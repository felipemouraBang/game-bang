import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';

const router = express.Router();

const POINTS_MAP = {
  checkin: 1,
  post: 5,
  referral: 10,
  referral_deal: 20,
  bonus_week: 5
};

// Submit Action (Student)
router.post('/', authenticate, async (req, res) => {
  const { type, proof, details } = req.body;
  const userId = req.user.id;

  if (!POINTS_MAP[type]) {
    return res.status(400).json({ error: 'Invalid action type' });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check-in validation (GPS)
  if (type === 'checkin') {
    const { data: existing } = await supabase
      .from('actions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'checkin')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Você já fez check-in hoje.' });
    }
  }

  // Post validation (One per day)
  if (type === 'post') {
    const { data: existing } = await supabase
      .from('actions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'post')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Você já fez uma postagem hoje.' });
    }
  }

  const { data, error } = await supabase
    .from('actions')
    .insert({
      user_id: userId,
      type,
      status: 'pending',
      points: POINTS_MAP[type],
      proof: JSON.stringify(proof)
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  logAction(userId, 'SUBMIT_ACTION', `Submitted ${type}`);
  res.status(201).json({ id: data.id, message: 'Action submitted for validation' });
});

// QR Code Check-in (Student)
router.post('/qr-checkin', authenticate, async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  
  const { data: existing } = await supabase
    .from('actions')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'checkin')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    return res.status(400).json({ error: 'Você já fez check-in hoje.' });
  }

  try {
    // We'll run them sequentially.
    const { error: actionError } = await supabase
      .from('actions')
      .insert({
        user_id: userId,
        type: 'checkin',
        status: 'approved',
        points: 1,
        proof: '{"method":"QR_CODE"}',
        validated_at: new Date().toISOString()
      });

    if (actionError) throw actionError;

    const { data: user } = await supabase.from('users').select('score_monthly, score_annual').eq('id', userId).single();
    if (!user) throw new Error('User not found');

    const { error: userError } = await supabase
      .from('users')
      .update({
        score_monthly: user.score_monthly + 1,
        score_annual: user.score_annual + 1
      })
      .eq('id', userId);

    if (userError) throw userError;

    logAction(userId, 'QR_CHECKIN', 'Check-in via QR Code');
    res.status(201).json({ message: 'Check-in successful' });
  } catch (err) {
    console.error('QR Check-in error:', err);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
});

// Get Pending Actions (Admin/Receptionist)
router.get('/pending', authenticate, authorize(['admin', 'receptionist']), async (req, res) => {
  const { data: actions, error } = await supabase
    .from('actions')
    .select(`
      *,
      users:user_id (name, photo)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten the response to match the expected format
  const formattedActions = actions.map(a => ({
    ...a,
    user_name: a.users.name,
    user_photo: a.users.photo
  }));

  res.json(formattedActions);
});

// Validate Action (Admin/Receptionist)
router.post('/:id/validate', authenticate, authorize(['admin', 'receptionist']), async (req, res) => {
  const actionId = parseInt(req.params.id);
  const { data: action, error: actionFetchError } = await supabase
    .from('actions')
    .select('*')
    .eq('id', actionId)
    .single();

  if (actionFetchError || !action) return res.status(404).json({ error: 'Action not found' });
  if (action.status !== 'pending') return res.status(400).json({ error: 'Action already processed' });

  try {
    // Special handling for challenge completion
    if (action.type === 'challenge_completion' && action.challenge_id) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', action.challenge_id)
        .single();
      
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      if (challenge.winner_id) {
        return res.status(400).json({ error: 'Challenge already won by someone else.' });
      }

      // Mark challenge as won
      await supabase.from('challenges').update({ winner_id: action.user_id }).eq('id', action.challenge_id);

      // Notify Winner
      await supabase.from('notifications').insert({
        user_id: action.user_id,
        message: `Parabéns! Você venceu o desafio "${challenge.title}" e ganhou ${action.points} pontos!`,
        type: 'challenge_won'
      });
    }

    const points = action.points;

    // Update Action Status
    await supabase
      .from('actions')
      .update({
        status: 'approved',
        validated_by: req.user.id,
        validated_at: new Date().toISOString()
      })
      .eq('id', actionId);

    // Update User Points
    const { data: user } = await supabase.from('users').select('score_monthly, score_annual').eq('id', action.user_id).single();
    if (user) {
      await supabase
        .from('users')
        .update({
          score_monthly: user.score_monthly + points,
          score_annual: user.score_annual + points
        })
        .eq('id', action.user_id);
    }

    logAction(req.user.id, 'VALIDATE_ACTION', `Validated action ${actionId} for user ${action.user_id} (+${points} pts)`);

    res.json({ message: 'Action validated', points });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Failed to validate action' });
  }
});

// Reject Action (Admin/Receptionist)
router.post('/:id/reject', authenticate, authorize(['admin', 'receptionist']), async (req, res) => {
  const actionId = parseInt(req.params.id);
  
  const { error } = await supabase
    .from('actions')
    .update({
      status: 'rejected',
      validated_by: req.user.id,
      validated_at: new Date().toISOString()
    })
    .eq('id', actionId);

  if (error) return res.status(500).json({ error: error.message });

  logAction(req.user.id, 'REJECT_ACTION', `Rejected action ${actionId}`);

  res.json({ message: 'Action rejected' });
});

// Get User Actions (Self)
router.get('/me', authenticate, async (req, res) => {
  const { data: actions, error } = await supabase
    .from('actions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(actions);
});

export default router;
