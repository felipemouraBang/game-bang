import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';
import { getSettings, setSetting } from '../db/settingsManager.js';

const router = express.Router();

// Reset Monthly Points (Admin Only)
router.post('/reset/monthly', authenticate, authorize(['admin']), async (req, res) => {
  const { userId } = req.body;

  try {
    if (userId) {
      const { error, count } = await supabase
        .from('users')
        .update({ score_monthly: 0 })
        .eq('id', userId)
        .eq('role', 'student');

      if (error) throw error;
      logAction(req.user.id, 'RESET_MONTHLY', `Reset monthly points for user ${userId}`);
      res.json({ message: 'Monthly points reset successfully' });
    } else {
      // Save monthly winners of each unit before manual reset
      const now = new Date();
      const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      
      // If resetting in the first 10 days of the month, the points are highly likely for the previous month
      let targetYear = brTime.getUTCFullYear();
      let targetMonthNum = brTime.getUTCMonth() + 1; // 1-12
      if (brTime.getUTCDate() <= 10) {
        targetMonthNum -= 1;
        if (targetMonthNum === 0) {
          targetMonthNum = 12;
          targetYear -= 1;
        }
      }
      const targetMonthStr = `${targetYear}-${String(targetMonthNum).padStart(2, '0')}`;

      const { data: students } = await supabase
        .from('users')
        .select('id, name, unit, score_monthly, email, photo')
        .eq('role', 'student')
        .eq('is_active', true);

      if (students && students.length > 0) {
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
          const activeScorers = unitStudents.filter(s => (s.score_monthly || 0) > 0);
          if (activeScorers.length > 0) {
            activeScorers.sort((a, b) => b.score_monthly - a.score_monthly);
            const winner = activeScorers[0];
            hallOfFameEntries.push({
              period_type: 'month',
              period_identifier: targetMonthStr,
              user_id: winner.id,
              score: winner.score_monthly
            });
          }
        }

        if (hallOfFameEntries.length > 0) {
          await supabase.from('hall_of_fame').insert(hallOfFameEntries);
        }
      }

      const { error, count } = await supabase
        .from('users')
        .update({ score_monthly: 0 })
        .eq('role', 'student');

      if (error) throw error;
      logAction(req.user.id, 'RESET_MONTHLY_ALL', 'Reset monthly points for ALL students');
      res.json({ message: 'Monthly points reset successfully' });
    }
  } catch (err) {
    console.error('Reset monthly error:', err);
    res.status(500).json({ error: 'Failed to reset monthly points' });
  }
});

// Recalculate Monthly Points (Admin Only) - Syncs score_monthly for all students based ONLY on current month's approved actions
router.post('/recalculate/monthly', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const now = new Date();
    const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const year = brTime.getUTCFullYear();
    const monthNum = brTime.getUTCMonth() + 1;
    const month = String(monthNum).padStart(2, '0');

    const monthStart = `${year}-${month}-01T00:00:00.000Z`;
    const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
    const nextYearNum = monthNum === 12 ? year + 1 : year;
    const monthEnd = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00.000Z`;

    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, name, score_monthly')
      .eq('role', 'student');

    if (studentsError) throw studentsError;

    let updatedCount = 0;
    if (students) {
      for (const student of students) {
        const { data: actions, error: actionsError } = await supabase
          .from('actions')
          .select('points')
          .eq('user_id', student.id)
          .eq('status', 'approved')
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);

        if (actionsError) continue;

        const currentMonthPoints = actions ? actions.reduce((sum, act) => sum + (act.points || 0), 0) : 0;

        await supabase
          .from('users')
          .update({ score_monthly: currentMonthPoints })
          .eq('id', student.id);

        updatedCount++;
      }
    }

    logAction(req.user.id, 'RECALCULATE_MONTHLY', `Recalculated monthly points for ${updatedCount} students for month ${year}-${month}`);
    res.json({ message: `Pontuação mensal de ${updatedCount} alunos sincronizada com sucesso para o mês ${month}/${year}!`, month: `${year}-${month}` });
  } catch (err: any) {
    console.error('Recalculate monthly error:', err);
    res.status(500).json({ error: err?.message || 'Falha ao recalcular pontuação mensal' });
  }
});

// Reset Annual Points (Admin Only)
router.post('/reset/annual', authenticate, authorize(['admin']), async (req, res) => {
  const { userId } = req.body;

  try {
    if (userId) {
      const { error } = await supabase
        .from('users')
        .update({ score_annual: 0 })
        .eq('id', userId)
        .eq('role', 'student');

      if (error) throw error;
      logAction(req.user.id, 'RESET_ANNUAL', `Reset annual points for user ${userId}`);
      res.json({ message: 'Annual points reset successfully' });
    } else {
      const { error } = await supabase
        .from('users')
        .update({ score_annual: 0 })
        .eq('role', 'student');

      if (error) throw error;
      logAction(req.user.id, 'RESET_ANNUAL_ALL', 'Reset annual points for ALL students');
      res.json({ message: 'Annual points reset successfully' });
    }
  } catch (err) {
    console.error('Reset annual error:', err);
    res.status(500).json({ error: 'Failed to reset annual points' });
  }
});

// Remove Points (Admin Only)
router.post('/remove-points', authenticate, authorize(['admin']), async (req, res) => {
  const { userId, points, type } = req.body; // type: 'monthly' or 'annual' or 'both'

  if (!userId || !points) {
    return res.status(400).json({ error: 'User ID and points are required' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('score_monthly, score_annual')
    .eq('id', userId)
    .single();

  if (userError || !user) return res.status(404).json({ error: 'User not found' });

  const updates: any = {};
  if (type === 'monthly' || type === 'both') {
    updates.score_monthly = Math.max(0, user.score_monthly - points);
  }
  if (type === 'annual' || type === 'both') {
    updates.score_annual = Math.max(0, user.score_annual - points);
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) return res.status(500).json({ error: updateError.message });
  }

  logAction(req.user.id, 'REMOVE_POINTS', `Removed ${points} points (${type}) from user ${userId}`);
  res.json({ message: 'Points removed successfully' });
});

// Add Points (Admin Only)
router.post('/add-points', authenticate, authorize(['admin']), async (req, res) => {
  const { userId, points, type } = req.body; // type: 'monthly' or 'annual' or 'both'

  if (!userId || !points) {
    return res.status(400).json({ error: 'User ID and points are required' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('score_monthly, score_annual')
    .eq('id', userId)
    .single();

  if (userError || !user) return res.status(404).json({ error: 'User not found' });

  const updates: any = {};
  if (type === 'monthly' || type === 'both') {
    updates.score_monthly = user.score_monthly + points;
  }
  if (type === 'annual' || type === 'both') {
    updates.score_annual = user.score_annual + points;
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) return res.status(500).json({ error: updateError.message });
  }

  logAction(req.user.id, 'ADD_POINTS', `Added ${points} points (${type}) to user ${userId}`);
  res.json({ message: 'Points added successfully' });
});

// Reset Specific User Points (Admin Only)
router.post('/reset-user', authenticate, authorize(['admin']), async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const { error } = await supabase
    .from('users')
    .update({ score_monthly: 0, score_annual: 0 })
    .eq('id', userId);

  if (error) return res.status(500).json({ error: error.message });
  logAction(req.user.id, 'RESET_USER_POINTS', `Reset all points for user ${userId}`);

  res.json({ message: 'User points reset successfully' });
});

// Get Logs (Admin Only)
router.get('/logs', authenticate, authorize(['admin']), async (req, res) => {
  const { data: logs, error } = await supabase
    .from('logs')
    .select(`
      *,
      users:user_id (name)
    `)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  
  const formattedLogs = logs.map(l => ({
    ...l,
    user_name: l.users?.name
  }));

  res.json(formattedLogs);
});

// Send Notification (Admin Only)
router.post('/notify', authenticate, authorize(['admin']), async (req, res) => {
  const { userId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    if (userId === 'all') {
      // Send to all students
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student');

      if (users && users.length > 0) {
        const notifications = users.map(u => ({
          user_id: u.id,
          message: message
        }));
        await supabase.from('notifications').insert(notifications);
      }
      
      logAction(req.user.id, 'NOTIFY_ALL', `Sent broadcast notification: ${message}`);
    } else {
      // Send to specific user
      await supabase.from('notifications').insert({ user_id: userId, message: message });
      logAction(req.user.id, 'NOTIFY_USER', `Sent notification to user ${userId}: ${message}`);
    }

    res.json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Notify error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get First Place Students of each unit (Admin and Restricted Admin)
router.get('/unit-leaders', authenticate, authorize(['admin', 'restricted_admin']), async (req, res) => {
  try {
    const { month } = req.query; // e.g. '2026-06'
    
    // Get current month in Brazil's timezone
    const now = new Date();
    const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const currentMonthStr = `${brTime.getUTCFullYear()}-${String(brTime.getUTCMonth() + 1).padStart(2, '0')}`;

    if (month && month !== currentMonthStr) {
      // Fetch historical winners from hall_of_fame
      const { data: records, error: hofError } = await supabase
        .from('hall_of_fame')
        .select(`
          score,
          users:user_id (id, name, unit, email, photo)
        `)
        .eq('period_type', 'month')
        .eq('period_identifier', month);

      if (!hofError && records && records.length > 0) {
        // Get all unique units to show full list even if some units had no winners
        const { data: studentsData } = await supabase
          .from('users')
          .select('unit')
          .eq('role', 'student')
          .eq('is_active', true);

        const uniqueUnits = Array.from(new Set((studentsData || []).map(u => u.unit).filter(Boolean)));
        if (uniqueUnits.length === 0) {
          uniqueUnits.push('Sem Unidade');
        }

        const leadersByUnit: Record<string, any> = {};
        uniqueUnits.forEach(u => {
          leadersByUnit[u] = null;
        });

        records?.forEach((rec: any) => {
          const user = rec.users;
          if (user) {
            const unit = user.unit || 'Sem Unidade';
            leadersByUnit[unit] = {
              id: user.id,
              name: user.name,
              score: rec.score,
              email: user.email,
              photo: user.photo
            };
          }
        });

        const result = Object.keys(leadersByUnit).sort().map(unitName => ({
          unit: unitName,
          monthlyLeader: leadersByUnit[unitName] || {
            id: null,
            name: '',
            score: 0,
            email: '',
            photo: ''
          },
          annualLeader: {
            id: null,
            name: '',
            score: 0,
            email: '',
            photo: ''
          }
        }));

        return res.json(result);
      }

      // If hall_of_fame is empty or missing for this month, calculate directly from approved actions!
      const [mYearStr, mMonthStr] = (month as string).split('-');
      const mYear = parseInt(mYearStr, 10);
      const mMonth = parseInt(mMonthStr, 10);

      const mStart = `${mYearStr}-${mMonthStr}-01T00:00:00.000Z`;
      const nextM = mMonth === 12 ? 1 : mMonth + 1;
      const nextY = mMonth === 12 ? mYear + 1 : mYear;
      const mEnd = `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00.000Z`;

      const { data: monthActions } = await supabase
        .from('actions')
        .select('user_id, points')
        .eq('status', 'approved')
        .gte('created_at', mStart)
        .lt('created_at', mEnd);

      const userMonthPts: Record<string, number> = {};
      monthActions?.forEach(a => {
        if (a.user_id) {
          userMonthPts[a.user_id] = (userMonthPts[a.user_id] || 0) + (a.points || 0);
        }
      });

      const { data: studentsData } = await supabase
        .from('users')
        .select('id, name, unit, email, photo')
        .eq('role', 'student')
        .eq('is_active', true);

      const leadersByUnit: Record<string, any> = {};
      studentsData?.forEach(s => {
        const u = s.unit || 'Sem Unidade';
        const pts = userMonthPts[s.id] || 0;
        if (!leadersByUnit[u] || pts > leadersByUnit[u].score) {
          if (pts > 0) {
            leadersByUnit[u] = {
              id: s.id,
              name: s.name,
              score: pts,
              email: s.email,
              photo: s.photo
            };
          }
        }
      });

      const uniqueUnits = Array.from(new Set((studentsData || []).map(u => u.unit).filter(Boolean)));
      if (uniqueUnits.length === 0) uniqueUnits.push('Sem Unidade');

      const result = uniqueUnits.sort().map(unitName => ({
        unit: unitName,
        monthlyLeader: leadersByUnit[unitName] || {
          id: null,
          name: '',
          score: 0,
          email: '',
          photo: ''
        },
        annualLeader: {
          id: null,
          name: '',
          score: 0,
          email: '',
          photo: ''
        }
      }));

      return res.json(result);
    }

    const { data: students, error } = await supabase
      .from('users')
      .select('id, name, unit, score_monthly, score_annual, email, photo')
      .eq('role', 'student')
      .eq('is_active', true);

    if (error) throw error;

    if (!students || students.length === 0) {
      return res.json([]);
    }

    // Group by unit
    const leadersByUnit: { [unit: string]: { monthly: any; annual: any } } = {};

    students.forEach(student => {
      const unit = student.unit || 'Sem Unidade';
      if (!leadersByUnit[unit]) {
        leadersByUnit[unit] = {
          monthly: student,
          annual: student
        };
      } else {
        // Compare monthly
        if (student.score_monthly > leadersByUnit[unit].monthly.score_monthly) {
          leadersByUnit[unit].monthly = student;
        }
        // Compare annual
        if (student.score_annual > leadersByUnit[unit].annual.score_annual) {
          leadersByUnit[unit].annual = student;
        }
      }
    });

    const result = Object.keys(leadersByUnit).map(unitName => ({
      unit: unitName,
      monthlyLeader: {
        id: leadersByUnit[unitName].monthly.id,
        name: leadersByUnit[unitName].monthly.name,
        score: leadersByUnit[unitName].monthly.score_monthly,
        email: leadersByUnit[unitName].monthly.email,
        photo: leadersByUnit[unitName].monthly.photo
      },
      annualLeader: {
        id: leadersByUnit[unitName].annual.id,
        name: leadersByUnit[unitName].annual.name,
        score: leadersByUnit[unitName].annual.score_annual,
        email: leadersByUnit[unitName].annual.email,
        photo: leadersByUnit[unitName].annual.photo
      }
    }));

    res.json(result);
  } catch (err) {
    console.error('Failed to get unit leaders:', err);
    res.status(500).json({ error: 'Failed to fetch unit leaders.' });
  }
});

// Get unlock status (Admin and Restricted Admin Only)
router.get('/unlock-status', authenticate, authorize(['admin', 'restricted_admin']), async (req, res) => {
  try {
    const settings = await getSettings(['challenges_unlocked_at', 'graduations_unlocked_at']);
    res.json(settings);
  } catch (err) {
    console.error('Failed to get unlock status:', err);
    res.status(500).json({ error: 'Failed to fetch unlock status.' });
  }
});

// Unlock challenges or graduations (Admin and Restricted Admin Only)
router.post('/unlock', authenticate, authorize(['admin', 'restricted_admin']), async (req, res) => {
  const { type } = req.body; // 'challenges' or 'graduations'

  if (type !== 'challenges' && type !== 'graduations') {
    return res.status(400).json({ error: 'Invalid unlock type' });
  }

  try {
    const key = type === 'challenges' ? 'challenges_unlocked_at' : 'graduations_unlocked_at';
    const val = new Date().toISOString();

    await setSetting(key, val);

    // Send global notification to students
    const message = type === 'challenges' 
      ? 'A administração liberou o envio de novos Desafios! Envie suas atividades para validação.'
      : 'A administração liberou o envio de novas Graduações! Envie suas atividades para validação.';

    const { data: users } = await supabase.from('users').select('id').eq('role', 'student');
    if (users && users.length > 0) {
      const notifications = users.map(u => ({
        user_id: u.id,
        message: message,
        type: 'system'
      }));
      await supabase.from('notifications').insert(notifications);
    }

    logAction(req.user.id, `UNLOCK_${type.toUpperCase()}`, `Admin unlocked submitting validation for all users`);
    res.json({ message: 'Success', unlocked_at: val });
  } catch (err) {
    console.error('Failed to unlock:', err);
    res.status(500).json({ error: 'Failed to execute unlock.' });
  }
});

// Revert Challenge Auto Approvals & Recalculate Points (Admin Only)
router.post('/revert-challenge-auto-approvals', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { data: approvedChallengeActions } = await supabase
      .from('actions')
      .select('id')
      .in('type', ['challenge_completion', 'challenge_bang'])
      .eq('status', 'approved');

    let revertedCount = 0;
    if (approvedChallengeActions && approvedChallengeActions.length > 0) {
      const actionIds = approvedChallengeActions.map(a => a.id);
      revertedCount = actionIds.length;

      await supabase
        .from('actions')
        .update({
          status: 'pending',
          validated_at: null,
          validated_by: null
        })
        .in('id', actionIds);
    }

    // Clear winner_id from challenges
    await supabase.from('challenges').update({ winner_id: null }).not('winner_id', 'is', null);

    // Recalculate student scores for current month and year
    const now = new Date();
    const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const year = brTime.getUTCFullYear();
    const monthNum = brTime.getUTCMonth() + 1;
    const month = String(monthNum).padStart(2, '0');

    const monthStart = `${year}-${month}-01T00:00:00.000Z`;
    const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
    const nextYearNum = monthNum === 12 ? year + 1 : year;
    const monthEnd = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00.000Z`;
    const yearStart = `${year}-01-01T00:00:00.000Z`;

    const { data: studentsList } = await supabase.from('users').select('id').eq('role', 'student');
    if (studentsList) {
      for (const st of studentsList) {
        const { data: mActs } = await supabase
          .from('actions')
          .select('points')
          .eq('user_id', st.id)
          .eq('status', 'approved')
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);

        const mPoints = mActs ? mActs.reduce((sum, act) => sum + (act.points || 0), 0) : 0;

        const { data: aActs } = await supabase
          .from('actions')
          .select('points')
          .eq('user_id', st.id)
          .eq('status', 'approved')
          .gte('created_at', yearStart);

        const aPoints = aActs ? aActs.reduce((sum, act) => sum + (act.points || 0), 0) : 0;

        await supabase
          .from('users')
          .update({ score_monthly: mPoints, score_annual: aPoints })
          .eq('id', st.id);
      }
    }

    logAction(req.user.id, 'REVERT_CHALLENGE_AUTO_APPROVALS', `Reverted ${revertedCount} challenge actions to pending and recalculated scores`);
    res.json({ message: `${revertedCount} desafios auto-aprovados foram movidos de volta para a fila de pendentes e os pontos foram corrigidos!` });
  } catch (err: any) {
    console.error('Error reverting challenge auto approvals:', err);
    res.status(500).json({ error: err?.message || 'Erro ao reverter aprovações automáticas de desafios' });
  }
});

export default router;
