import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';

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

export default router;
