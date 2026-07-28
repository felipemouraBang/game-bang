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

let settingsTableMissingLogged = false;

function handleSupabaseError(action: string, keyOrKeys: string | string[], err: any) {
  const errMsg = err?.message || String(err);
  const isTableMissing = errMsg.includes("Could not find the table") || errMsg.includes("settings' in the schema cache");
  const isInvalidKey = errMsg.includes("Invalid API key") || errMsg.includes("invalid key") || errMsg.includes("JWT") || errMsg.includes("PGRST301");

  if (isTableMissing) {
    if (!settingsTableMissingLogged) {
      settingsTableMissingLogged = true;
      console.info(
        `[SettingsManager] Persistent settings table 'settings' is not yet created in Supabase.\n` +
        `-> The system is automatically using the local filesystem fallback: "${SETTINGS_FILE_PATH}".\n` +
        `-> Tip: Run the SQL DDL queries from "/supabase_migration.sql" on your Supabase dashboard SQL editor.`
      );
    }
  } else if (isInvalidKey) {
    if (!settingsTableMissingLogged) {
      settingsTableMissingLogged = true;
      console.info(
        `[SettingsManager] Supabase API key is pending configuration or invalid. Using local filesystem store: "${SETTINGS_FILE_PATH}".`
      );
    }
  } else {
    console.warn(`[SettingsManager] ${action} with key(s) "${Array.isArray(keyOrKeys) ? keyOrKeys.join(', ') : keyOrKeys}" failed. Falling back to local store. Error:`, errMsg);
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
    handleSupabaseError('Get key', key, err);
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
    handleSupabaseError('Get keys', keys, err);
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
    handleSupabaseError('Write key', key, err);
  }
}
