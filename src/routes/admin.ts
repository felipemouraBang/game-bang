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

// Get unlock status (Admin and Restricted Admin)
router.get('/unlock-status', authenticate, authorize(['admin', 'restricted_admin']), async (req, res) => {
  try {
    const settings = await getSettings(['challenges_unlocked_at', 'graduations_unlocked_at']);
    res.json(settings);
  } catch (err) {
    console.error('Failed to get unlock status:', err);
    res.status(500).json({ error: 'Failed to fetch unlock status.' });
  }
});

// Unlock challenges or graduations (Admin Only - Or allow restricted_admin if needed, let's allow both since they can both validate items)
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

export default router;
