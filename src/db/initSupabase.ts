import bcrypt from 'bcryptjs';
import { supabase } from './supabase.js';
import { getSetting, setSetting } from './settingsManager.js';

export async function initSupabaseDb() {
  try {
    // Create Default Admin (Admin / Moura)
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('login', 'Admin')
      .maybeSingle();

    if (!adminExists) {
      const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Moura';
      const hashedPassword = bcrypt.hashSync(defaultAdminPassword, 10);
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

    // Create New Restricted Admin (admin1 / Bang744)
    const { data: admin1Exists } = await supabase
      .from('users')
      .select('id')
      .eq('login', 'admin1')
      .maybeSingle();

    if (!admin1Exists) {
      const hashedAdmin1Password = bcrypt.hashSync('Bang744', 10);
      await supabase.from('users').insert({
        name: 'Administrador Restrito',
        login: 'admin1',
        password: hashedAdmin1Password,
        role: 'restricted_admin',
        email: 'admin1@bang.com',
        nickname: 'Restrito',
        is_active: true
      });
      console.log('Restricted Admin (admin1) created in Supabase.');
    }

    // Initialize specific receptionists
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
      { name: 'Recepção Igara', login: 'recepcao_igara', role: 'receptionist', nickname: 'Canoas Igara', email: 'recepcao_igara@bang.com', unit: 'Canoas Igara' },
      { name: 'Recepção Igara (Acento)', login: 'recpção_igara', role: 'receptionist', nickname: 'Canoas Igara', email: 'recpcao_igara_alt@bang.com', unit: 'Canoas Igara' },
      { name: 'Canoas Rondon', login: 'canoas_rondon', role: 'receptionist', nickname: 'Canoas', email: 'canoas_rondon@bang.com', unit: 'Canoas' }
    ];

    for (const rec of receptionists) {
      const { data: recExists } = await supabase
        .from('users')
        .select('id')
        .eq('login', rec.login)
        .maybeSingle();

      if (!recExists) {
        await supabase.from('users').insert({
          name: rec.name,
          login: rec.login,
          password: passwordHash,
          role: rec.role,
          email: rec.email,
          nickname: rec.nickname,
          unit: rec.unit,
          is_active: true
        });
        console.log(`Created Receptionist: ${rec.name}`);
      }
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

    // Recalculate monthly scores for all students, keeping only monthly points made from 01/06/2026 onwards
    const migrationKey = 'recalculated_monthly_points_from_june_2026';
    const isAlreadyRecalculated = await getSetting(migrationKey, '');

    if (isAlreadyRecalculated !== 'true') {
      console.log('[Recalculate_June] Recalculating monthly points from 2026-06-01 onwards...');

      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('id, name, score_monthly')
        .eq('role', 'student');

      if (studentsError) {
        console.error('[Recalculate_June] Error fetching students:', studentsError);
      } else if (students) {
        console.log(`[Recalculate_June] Found ${students.length} students to recalculate.`);

        for (const student of students) {
          const { data: actions, error: actionsError } = await supabase
            .from('actions')
            .select('points')
            .eq('user_id', student.id)
            .eq('status', 'approved')
            .gte('created_at', '2026-06-01T00:00:00.000Z');

          if (actionsError) {
            console.error(`[Recalculate_June] Error fetching actions for student ${student.name} (ID: ${student.id}):`, actionsError);
            continue;
          }

          const totalPoints = actions ? actions.reduce((sum, act) => sum + (act.points || 0), 0) : 0;

          const { error: updateError } = await supabase
            .from('users')
            .update({ score_monthly: totalPoints })
            .eq('id', student.id);

          if (updateError) {
            console.error(`[Recalculate_June] Error updating student ${student.name} (ID: ${student.id}) score:`, updateError);
          } else {
            console.log(`[Recalculate_June] Student ${student.name} score updated from ${student.score_monthly} to ${totalPoints}`);
          }
        }
      }

      await setSetting(migrationKey, 'true');
      console.log('[Recalculate_June] Recalculation migration finished successfully.');
    }
  } catch (error) {
    console.error('Error initializing Supabase DB defaults:', error);
  }
}
