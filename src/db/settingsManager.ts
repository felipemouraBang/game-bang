import { supabase } from './supabase.js';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'db', 'local_settings.json');

// In-Memory cache for ultimate speed and fallback safety
let inMemorySettings: Record<string, string> = {
  challenges_unlocked_at: '1970-01-01T00:00:00.000Z',
  graduations_unlocked_at: '1970-01-01T00:00:00.000Z',
  last_monthly_reset_month: ''
};

// Ensure directory exists and load local file once on boot
try {
  const dir = path.dirname(SETTINGS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(SETTINGS_FILE_PATH)) {
    const fileContent = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    inMemorySettings = { ...inMemorySettings, ...parsed };
    console.log('[SettingsManager] Loaded local physical fallback settings:', inMemorySettings);
  } else {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(inMemorySettings, null, 2), 'utf-8');
  }
} catch (err) {
  console.warn('[SettingsManager] Failed initializing local settings file:', err);
}

function saveLocalSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(inMemorySettings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[SettingsManager] Failed writing local settings file:', err);
  }
}

export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      if (inMemorySettings[key] !== data.value) {
        inMemorySettings[key] = data.value;
        saveLocalSettings();
      }
      return data.value;
    }
  } catch (err) {
    console.warn(`[SettingsManager] Get key "${key}" from Supabase failed. Falling back to local store. Error:`, (err as any).message || err);
  }

  return inMemorySettings[key] !== undefined ? inMemorySettings[key] : defaultValue;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      throw error;
    }

    if (data) {
      data.forEach((row: any) => {
        result[row.key] = row.value;
        inMemorySettings[row.key] = row.value;
      });
      saveLocalSettings();
    }
  } catch (err) {
    console.warn(`[SettingsManager] Get keys [${keys.join(', ')}] from Supabase failed. Falling back to local store. Error:`, (err as any).message || err);
  }

  keys.forEach(key => {
    if (result[key] === undefined) {
      result[key] = inMemorySettings[key] || '1970-01-01T00:00:00.000Z';
    }
  });

  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  inMemorySettings[key] = value;
  saveLocalSettings();

  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.warn(`[SettingsManager] Write key "${key}" to Supabase failed. Kept on local store. Error:`, (err as any).message || err);
  }
}
