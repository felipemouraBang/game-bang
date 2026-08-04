import bcrypt from 'bcryptjs';
import { supabase } from './supabase.js';
import { getSetting, setSetting } from './settingsManager.js';

export async function initSupabaseDb() {
  try {
    // Create Default Admin (Admin / Moura)
    const { data: adminExists, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('login', 'Admin')
      .maybeSingle();

    if (adminCheckError) {
      const msg = adminCheckError.message || String(adminCheckError);
      if (msg.includes('Invalid API key') || msg.includes('PGRST301') || msg.includes('invalid key') || msg.includes('JWT')) {
        console.warn('[InitSupabase] Supabase connection is waiting for valid API keys or new project setup.');
        return;
      }
    }

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
      { name: 'Canoas Rondon', login: 'canoas_rondon', role: 'receptionist', nickname: 'Canoas', email: 'canoas_rondon@bang.com', unit: 'Canoas' },
      { name: 'Recepção Cachoeirinha', login: 'Cachoeirinha', role: 'receptionist', nickname: 'Cachoeirinha', email: 'recepcao_cachoeirinha@bang.com', unit: 'Cachoeirinha' },
      { name: 'Recepção Cachoeirinha (Lower)', login: 'recepcao_cachoeirinha', role: 'receptionist', nickname: 'Cachoeirinha', email: 'recepcao_cachoeirinha_alt@bang.com', unit: 'Cachoeirinha' }
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

    // Always recalculate student scores (monthly strictly for current month, annual for current year)
    console.log('[Init_Score_Sync] Recalculating student monthly and annual points strictly by date...');
    const { data: studentsJuly, error: studentsJulyError } = await supabase
      .from('users')
      .select('id, name, score_monthly, score_annual')
      .eq('role', 'student');

    if (studentsJulyError) {
      const msg = studentsJulyError.message || String(studentsJulyError);
      if (msg.includes('Invalid API key') || msg.includes('PGRST301') || msg.includes('invalid key') || msg.includes('JWT')) {
        console.warn('[Init_Score_Sync] Supabase connection is waiting for valid API keys.');
      } else {
        console.error('[Init_Score_Sync] Error fetching students:', msg);
      }
    } else if (studentsJuly) {
      const now = new Date();
      const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const year = brTime.getUTCFullYear();
      const monthNum = brTime.getUTCMonth() + 1;
      const monthStr = String(monthNum).padStart(2, '0');

      const monthStart = `${year}-${monthStr}-01T00:00:00.000Z`;
      const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
      const nextYearNum = monthNum === 12 ? year + 1 : year;
      const monthEnd = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00.000Z`;
      const yearStart = `${year}-01-01T00:00:00.000Z`;

      for (const student of studentsJuly) {
        // Monthly actions
        const { data: mActions } = await supabase
          .from('actions')
          .select('points')
          .eq('user_id', student.id)
          .eq('status', 'approved')
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);

        // Annual actions
        const { data: aActions } = await supabase
          .from('actions')
          .select('points')
          .eq('user_id', student.id)
          .eq('status', 'approved')
          .gte('created_at', yearStart);

        let mPoints = mActions ? mActions.reduce((sum, act) => sum + (act.points || 0), 0) : 0;
        let aPoints = aActions ? aActions.reduce((sum, act) => sum + (act.points || 0), 0) : 0;

        // Annual points must NEVER decrease automatically during server startup
        const safeAnnualScore = Math.max(student.score_annual || 0, aPoints);

        if (student.score_monthly !== mPoints || student.score_annual !== safeAnnualScore) {
          await supabase
            .from('users')
            .update({ score_monthly: mPoints, score_annual: safeAnnualScore })
            .eq('id', student.id);
        }
      }
      console.log('[Init_Score_Sync] Score verification and recalculation complete.');
    }
  } catch (error) {
    console.error('Error initializing Supabase DB defaults:', error);
  }
}
