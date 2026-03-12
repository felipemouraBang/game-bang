import bcrypt from 'bcryptjs';
import { supabase } from './supabase.js';

export async function initSupabaseDb() {
  try {
    // Create Default Admin (Admin / Moura)
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('login', 'Admin')
      .maybeSingle();

    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('Moura', 10);
      await supabase.from('users').insert({
        name: 'Administrador Master',
        login: 'Admin',
        password: hashedPassword,
        role: 'admin',
        email: 'admin@bang.com',
        nickname: 'Mestre',
        is_active: true
      });
      console.log('Default Admin created in Supabase.');
    }

    // Create Default Receptionist (Recepcao / Teambang744)
    const { data: recepExists } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'receptionist')
      .limit(1)
      .maybeSingle();

    if (!recepExists) {
      const hashedPassword = bcrypt.hashSync('Teambang744', 10);
      await supabase.from('users').insert({
        name: 'Recepção',
        login: 'Recepcao',
        password: hashedPassword,
        role: 'receptionist',
        email: 'recepcao@bang.com',
        nickname: 'Recepção',
        is_active: true
      });
      console.log('Default Receptionist created in Supabase.');
    }
    
    // Create a default student for testing
    const { data: studentExists } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .limit(1)
      .maybeSingle();

    if (!studentExists) {
      const hashedPassword = bcrypt.hashSync('123456', 10);
      await supabase.from('users').insert({
        name: 'Aluno Exemplo',
        login: 'Aluno',
        password: hashedPassword,
        role: 'student',
        email: 'aluno@bang.com',
        nickname: 'Lutador',
        is_active: true
      });
      console.log('Default Student created in Supabase.');
    }
  } catch (error) {
    console.error('Error initializing Supabase DB defaults:', error);
  }
}
