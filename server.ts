import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { initSupabaseDb } from './src/db/initSupabase.js';
import { supabase } from './src/db/supabase.js';
import { getSetting, setSetting } from './src/db/settingsManager.js';
import loginHandler from './api/auth/login.js';
import registerHandler from './api/auth/register.js';
import resetPasswordHandler from './api/auth/reset-password.js';
import meHandler from './api/auth/me.js';
import logoutHandler from './api/auth/logout.js';
import userRoutes from './src/routes/users.js';
import actionRoutes from './src/routes/actions.js';
import adminRoutes from './src/routes/admin.js';
import statsRoutes from './src/routes/stats.js';
import challengeRoutes from './src/routes/challenges.js';

const PORT = 3000;

async function checkAndResetMonthlyScores() {
  try {
    const now = new Date();
    // Translate standard UTC to Brasília timezone (GMT-3) to be fully accurate
    const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const day = brTime.getUTCDate();
    const year = brTime.getUTCFullYear();
    const month = String(brTime.getUTCMonth() + 1).padStart(2, '0');
    const currentMonthStr = `${year}-${month}`;

    if (day === 1) {
      // Check if already reset for this month in settings
      const lastResetMonth = await getSetting('last_monthly_reset_month', '');

      if (lastResetMonth !== currentMonthStr) {
        console.log(`[Auto-Reset] It is the 1st of the month (${currentMonthStr}). Resetting monthly scores...`);

        // Calculate previous month string (e.g. '2026-06' if current is '2026-07')
        let prevYear = brTime.getUTCFullYear();
        let prevMonthNum = brTime.getUTCMonth(); // getUTCMonth() is 0-11
        if (prevMonthNum === 0) {
          prevMonthNum = 12;
          prevYear = prevYear - 1;
        }
        const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

        // 1. Fetch current monthly rankings for each unit to determine previous month's winners
        try {
          const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, name, unit, score_monthly, email, photo')
            .eq('role', 'student')
            .eq('is_active', true);

          if (studentsError) {
            console.error('[Auto-Reset] Error fetching students for Hall of Fame:', studentsError);
          } else if (students && students.length > 0) {
            // Group by unit
            const unitsMap: Record<string, any[]> = {};
            students.forEach(s => {
              const unitName = s.unit || 'Sem Unidade';
              if (!unitsMap[unitName]) unitsMap[unitName] = [];
              unitsMap[unitName].push(s);
            });

            const hallOfFameEntries: any[] = [];

            for (const unitName of Object.keys(unitsMap)) {
              const unitStudents = unitsMap[unitName];
              // Filter those with points > 0
              const activeScorers = unitStudents.filter(s => (s.score_monthly || 0) > 0);
              if (activeScorers.length > 0) {
                // Find the one with max score_monthly
                activeScorers.sort((a, b) => b.score_monthly - a.score_monthly);
                const winner = activeScorers[0];

                hallOfFameEntries.push({
                  period_type: 'month',
                  period_identifier: prevMonthStr,
                  user_id: winner.id,
                  score: winner.score_monthly
                });
              }
            }

            if (hallOfFameEntries.length > 0) {
              console.log(`[Auto-Reset] Inserting ${hallOfFameEntries.length} winners into hall_of_fame for ${prevMonthStr}...`);
              const { error: hofError } = await supabase
                .from('hall_of_fame')
                .insert(hallOfFameEntries);
              if (hofError) {
                console.error('[Auto-Reset] Error inserting into hall_of_fame:', hofError);
              }
            }
          }
        } catch (hofErr) {
          console.error('[Auto-Reset] Failed to populate Hall of Fame before reset:', hofErr);
        }

        // Reset scores
        const { error: updateError } = await supabase
          .from('users')
          .update({ score_monthly: 0 })
          .eq('role', 'student');

        if (updateError) throw updateError;

        // Upsert setting key
        await setSetting('last_monthly_reset_month', currentMonthStr);

        // Insert log
        await supabase.from('logs').insert({
          user_id: 1, // System default ID
          action: 'AUTO_RESET_MONTHLY_ALL',
          details: `Automatic monthly points reset for ${currentMonthStr} was executed.`
        });

        console.log('[Auto-Reset] Automatic monthly score reset completed successfully.');
      }
    }
  } catch (err) {
    console.error('[Auto-Reset] Auto monthly reset exception:', err);
  }
}

async function startServer() {
  const app = express();

  // Initialize Default Users in Supabase
  await initSupabaseDb();

  // Run immediately and Schedule hourly check for automatic monthly scores reset
  await checkAndResetMonthlyScores();
  setInterval(() => {
    checkAndResetMonthlyScores().catch(err => console.error('[Auto-Reset] Interval error:', err));
  }, 60 * 60 * 1000);

  app.set('trust proxy', 1); // Trust first proxy (required for secure cookies behind Nginx/GCP)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());

  // API Routes
  app.post('/api/auth/login', loginHandler as any);
  app.post('/api/auth/register', registerHandler as any);
  app.post('/api/auth/reset-password', resetPasswordHandler as any);
  app.get('/api/auth/me', meHandler as any);
  app.post('/api/auth/logout', logoutHandler as any);
  
  app.use('/api/users', userRoutes);
  app.use('/api/actions', actionRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/challenges', challengeRoutes);

  // Serve static files from uploads directory (if needed)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use('/uploads', express.static(uploadsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: {
          usePolling: false,
          ignored: ['**']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
