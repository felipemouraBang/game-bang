import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';
import { getReceptionistUnits } from '../utils/units.js';
import { getSetting } from '../db/settingsManager.js';

const router = express.Router();

const POINTS_MAP = {
  checkin: 1,
  checkin_muay_thai: 1,
  checkin_fitness: 1,
  checkin_fight: 1,
  post: 5,
  referral: 10,
  referral_deal: 20,
  bonus_week: 5,
  graduation: 10,
  donation: 10,
  challenge_bang: 10
};

// Submit Action (Student)
router.post('/', authenticate, async (req, res) => {
  const { type, proof, details } = req.body;
  const userId = req.user.id;

  if (!POINTS_MAP[type]) {
    return res.status(400).json({ error: 'Invalid action type' });
  }

  // --- Lock system for Graduation and Challenges ---
  if (type === 'graduation' || type === 'challenge_bang') {
    const key = type === 'graduation' ? 'graduations_unlocked_at' : 'challenges_unlocked_at';
    const unlockedAt = await getSetting(key, '1970-01-01T00:00:00.000Z');
    const typesToCheck = type === 'graduation' ? ['graduation'] : ['challenge_bang', 'challenge_completion'];

    const { data: existing } = await supabase
      .from('actions')
      .select('id')
      .eq('user_id', userId)
      .in('type', typesToCheck)
      .gt('created_at', unlockedAt)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      const label = type === 'graduation' ? 'Graduação' : 'Desafio';
      return res.status(400).json({ 
        error: `Você já enviou um registro de ${label} para validação. Aguarde a liberação da administração.` 
      });
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // Check-in validation (GPS)
  if (type.startsWith('checkin')) {
    const { data: existing } = await supabase
      .from('actions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      const modalityName = type === 'checkin_muay_thai' ? 'Muay Thai' : 
                          type === 'checkin_fitness' ? 'Fitness' : 
                          type === 'checkin_fight' ? 'Fight' : 'Geral';
      return res.status(400).json({ error: `Você já fez check-in no ${modalityName} hoje.` });
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

  let finalProof = proof;
  if (details) {
    if (typeof finalProof === 'string') {
      try {
        const parsed = JSON.parse(finalProof);
        parsed.details = details;
        finalProof = JSON.stringify(parsed);
      } catch (e) {
        finalProof = JSON.stringify({ value: finalProof, details });
      }
    } else {
      finalProof = { ...(finalProof || {}), details };
    }
  }

  const { data, error } = await supabase
    .from('actions')
    .insert({
      user_id: userId,
      type,
      status: 'pending',
      points: POINTS_MAP[type],
      proof: typeof finalProof === 'string' ? finalProof : JSON.stringify(finalProof)
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
  const { type = 'checkin' } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  const { data: existing } = await supabase
    .from('actions')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    const modalityName = type === 'checkin_muay_thai' ? 'Muay Thai' : 
                        type === 'checkin_fitness' ? 'Fitness' : 
                        type === 'checkin_fight' ? 'Fight' : 'Geral';
    return res.status(400).json({ error: `Você já fez check-in no ${modalityName} hoje.` });
  }

  try {
    // We'll run them sequentially.
    const { error: actionError } = await supabase
      .from('actions')
      .insert({
        user_id: userId,
        type: type,
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
router.get('/pending', authenticate, authorize(['admin', 'receptionist', 'restricted_admin']), async (req, res) => {
  const { data: currentUser } = await supabase.from('users').select('role, nickname').eq('id', req.user.id).single();

  const { data: actions, error } = await supabase
    .from('actions')
    .select(`
      *,
      users:user_id (name, photo, unit)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  if (!actions) return res.json([]);

  // Flatten the response and filter by unit if receptionist
  let formattedActions = actions.map(a => ({
    ...a,
    user_name: a.users.name,
    user_photo: a.users.photo,
    user_unit: a.users.unit
  }));

  if (currentUser?.role === 'receptionist') {
    const units = getReceptionistUnits(currentUser.nickname);
    const restrictedTypes = ['donation', 'referral', 'referral_deal', 'graduation', 'challenge_bang'];
    if (units.length > 0) {
      formattedActions = formattedActions.filter(a => units.includes(a.user_unit) && !restrictedTypes.includes(a.type));
    } else {
      formattedActions = formattedActions.filter(a => !restrictedTypes.includes(a.type));
    }
  }

  res.json(formattedActions);
});

// Validate Action (Admin/Receptionist)
router.post('/:id/validate', authenticate, authorize(['admin', 'receptionist', 'restricted_admin']), async (req, res) => {
  const actionId = req.params.id;
  const { data: currentUser } = await supabase.from('users').select('role, nickname').eq('id', req.user.id).single();
  
  const { data: action, error: actionFetchError } = await supabase
    .from('actions')
    .select('*')
    .eq('id', actionId)
    .single();

  if (actionFetchError || !action) return res.status(404).json({ error: 'Action not found' });
  if (action.status !== 'pending') return res.status(400).json({ error: 'Action already processed' });
  const restrictedTypes = ['donation', 'referral', 'referral_deal', 'graduation', 'challenge_bang'];
  if (restrictedTypes.includes(action.type) && currentUser?.role === 'receptionist') {
    return res.status(403).json({ error: 'Receptionists cannot validate this type of action' });
  }

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
router.post('/:id/reject', authenticate, authorize(['admin', 'receptionist', 'restricted_admin']), async (req, res) => {
  const actionId = req.params.id;
  const { data: currentUser } = await supabase.from('users').select('role').eq('id', req.user.id).single();

  const { data: action } = await supabase.from('actions').select('type').eq('id', actionId).single();
  if (!action) return res.status(404).json({ error: 'Action not found' });

  const restrictedTypes = ['donation', 'referral', 'referral_deal', 'graduation', 'challenge_bang'];
  if (restrictedTypes.includes(action.type) && currentUser?.role === 'receptionist') {
    return res.status(403).json({ error: 'Receptionists cannot reject this type of action' });
  }

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

// Get User Actions (Admin/Receptionist/Self)
router.get('/user/:id', authenticate, async (req, res) => {
  const targetId = req.params.id;
  if (req.user.role !== 'admin' && req.user.role !== 'receptionist' && req.user.role !== 'restricted_admin' && req.user.id !== targetId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data: actions, error } = await supabase
    .from('actions')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(actions || []);
});

// Get User Actions (Self)
router.get('/me', authenticate, async (req, res) => {
  const { data: actions, error } = await supabase
    .from('actions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(actions || []);
});

export default router;
