import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Moura';
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  console.log('Resetting Admin password to:', password === 'Moura' ? 'Moura' : '***');
  
  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('login', 'Admin')
    .select();
    
  if (error) {
    console.error('Error resetting password:', error);
  } else {
    console.log('Admin password reset successfully:', data);
  }
}

reset();
