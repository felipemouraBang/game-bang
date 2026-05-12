import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

import bcrypt from 'bcryptjs';

const passwordHash = bcrypt.hashSync('Teambang', 10);

const receptionists = [
  { name: 'Recepção Forte Muaythai', login: 'recepcao_forte_muaythai', role: 'receptionist', nickname: 'Forte Muaythai', email: 'recepcao@forte_muaythai.com', unit: 'Forte Muaythai' },
  { name: 'Recepção Forte Fitness', login: 'recepcao_forte_fitness', role: 'receptionist', nickname: 'Forte Fitness', email: 'recepcao@forte_fitness.com', unit: 'Forte Fitness' },
  { name: 'Recepção Forte Fight', login: 'recepcao_forte_fight', role: 'receptionist', nickname: 'Forte Fight', email: 'recepcao@forte_fight.com', unit: 'Forte Fight' },
  { name: 'Recepção Anita', login: 'recepcao_anita', role: 'receptionist', nickname: 'Anita', email: 'recepcao@anita.com', unit: 'Anita' },
  { name: 'Recepção Moinhos', login: 'recepcao_moinhos', role: 'receptionist', nickname: 'Moinhos', email: 'recepcao@moinhos.com', unit: 'Moinhos' },
  { name: 'Recepção Protásio', login: 'recepcao_protasio', role: 'receptionist', nickname: 'Protásio', email: 'recepcao@protasio.com', unit: 'Protásio' },
  { name: 'Recepção Zona Sul', login: 'recepcao_zona_sul', role: 'receptionist', nickname: 'Zona Sul', email: 'recepcao@zona_sul.com', unit: 'Zona Sul' },
  { name: 'Recepção Tramandai', login: 'recepcao_tramandai', role: 'receptionist', nickname: 'Tramandai', email: 'recepcao@tramandai.com', unit: 'Tramandai' },
  { name: 'Recepção Canoas', login: 'recepcao_canoas', role: 'receptionist', nickname: 'Canoas', email: 'recepcao@canoas.com', unit: 'Canoas' },
  { name: 'Recepção Zona Leste', login: 'recepcao_zonaleste', role: 'receptionist', nickname: 'Zona Leste', email: 'recepcao@zonaleste.com', unit: 'Zona Leste' }
];

async function insertReceptionists() {
  for (const user of receptionists) {
    const { data: existing } = await supabase.from('users').select('id').eq('login', user.login).single();
    if (existing) {
       console.log("Already exists", user.login);
    } else {
       const { error } = await supabase.from('users').insert({
         ...user,
         password: passwordHash,
         is_active: true
       });
       if (error) {
          console.error("Error inserting", user.login, error);
       } else {
          console.log("Inserted", user.login);
       }
    }
  }
}

insertReceptionists();
