import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';
import { checkAndSendDailyMotivation } from '../utils/dailyMotivation.js';

const router = express.Router();

// Get all users (Admin/Receptionist)
router.get('/', authenticate, authorize(['admin', 'receptionist']), async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, login, role, email, photo, nickname, score_monthly, score_annual, is_active, unit');
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(users);
});

// Get Notifications (Self)
router.get('/notifications', authenticate, async (req, res) => {
  if (req.user.role === 'student') {
    try {
      checkAndSendDailyMotivation(req.user.id);
    } catch (e) {
      console.error('Error sending daily motivation:', e);
    }
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(notifications);
});

// Mark Notification as Read (Self)
router.post('/notifications/:id/read', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Marked as read' });
});

// Get single user (Admin/Receptionist/Self)
router.get('/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.role !== 'admin' && req.user.role !== 'receptionist' && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, login, role, email, photo, nickname, score_monthly, score_annual, is_active, unit')
    .eq('id', id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Create user (Admin only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, login, password, role, email, nickname, unit } = req.body;
  
  if (!name || !login || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('login', login)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Login already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        login,
        password: hashedPassword,
        role,
        email,
        nickname,
        unit
      })
      .select()
      .single();
    
    if (error) throw error;

    logAction(req.user.id, 'CREATE_USER', `Created user ${login} (${role})`);
    res.status(201).json({ id: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin or Self)
router.put('/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, login, password, email, photo, nickname, role, is_active, unit } = req.body;

  // Check permissions
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (userError || !user) return res.status(404).json({ error: 'User not found' });

  // Fetch current user details for permission check
  const { data: currentUser } = await supabase
    .from('users')
    .select('login')
    .eq('id', req.user.id)
    .single();

  if (!currentUser) return res.status(401).json({ error: 'Current user not found' });

  // Fixed Admin Protection
  if (user.login === 'Admin') {
    if (currentUser.login !== 'Admin') {
      return res.status(403).json({ error: 'Only the Master Admin can modify itself' });
    }
    // Prevent changing login/role/active status of Master Admin
    if (login && login !== 'Admin') return res.status(403).json({ error: 'Cannot change Master Admin login' });
    if (role && role !== 'admin') return res.status(403).json({ error: 'Cannot change Master Admin role' });
    if (is_active === false) return res.status(403).json({ error: 'Cannot deactivate Master Admin' });
  }

  // Prevent changing login if not admin
  if (login && login !== user.login && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only Admin can change login' });
  }

  // Update fields
  const updates: any = {};

  if (name) updates.name = name;
  if (login) updates.login = login;
  if (email) updates.email = email;
  if (photo) updates.photo = photo;
  if (nickname) updates.nickname = nickname;
  if (unit) updates.unit = unit;
  if (role && req.user.role === 'admin') updates.role = role;
  if (is_active !== undefined && req.user.role === 'admin') updates.is_active = is_active;

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    updates.password = hashedPassword;
    logAction(req.user.id, 'CHANGE_PASSWORD', `Changed password for user ${user.login}`);
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    if (updateError) return res.status(500).json({ error: updateError.message });
    logAction(req.user.id, 'UPDATE_USER', `Updated user ${user.login}`);
  }

  res.json({ message: 'User updated' });
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { data: user } = await supabase
    .from('users')
    .select('login')
    .eq('id', id)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.login === 'Admin') return res.status(403).json({ error: 'Cannot delete Master Admin' });

  try {
    // Supabase doesn't support transactions in the client SDK easily like SQLite
    // We'll run them sequentially. For a more robust solution, use a Postgres function (RPC).
    
    // Handle references in other tables
    await supabase.from('actions').delete().or(`user_id.eq.${id},validated_by.eq.${id}`);
    await supabase.from('notifications').delete().eq('user_id', id);
    await supabase.from('logs').delete().eq('user_id', id);
    await supabase.from('hall_of_fame').delete().eq('user_id', id);
    await supabase.from('challenges').update({ winner_id: null }).eq('winner_id', id);
    
    // Reassign challenges created by this user to Master Admin (assuming id 1 is Master Admin)
    // We should find the Master Admin ID dynamically if possible, but 1 is usually it.
    await supabase.from('challenges').update({ created_by: 1 }).eq('created_by', id);

    const { error: deleteError } = await supabase.from('users').delete().eq('id', id);
    if (deleteError) throw deleteError;

    logAction(req.user.id, 'DELETE_USER', `Deleted user ${user.login}`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user. It might have active dependencies.' });
  }
});

export default router;
