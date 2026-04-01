import dotenv from 'dotenv';
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL value (sanitized):', process.env.SUPABASE_URL.replace(/\/\/.*@/, '//***@'));
}
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('DEFAULT_ADMIN_PASSWORD:', process.env.DEFAULT_ADMIN_PASSWORD ? 'SET' : 'NOT SET');
if (process.env.DEFAULT_ADMIN_PASSWORD) {
  console.log('DEFAULT_ADMIN_PASSWORD value (sanitized):', process.env.DEFAULT_ADMIN_PASSWORD.replace(/./g, '*'));
}
