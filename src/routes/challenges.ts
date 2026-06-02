import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';
import { getSetting } from '../db/settingsManager.js';

const router = express.Router();

// Create Challenge (Admin Only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { title, description, start_date, end_date, points } = req.body;
  const created_by = req.user.id;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date, and end date are required.' });
  }

  try {
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title,
        description,
        start_date,
        end_date,
        points: points || 0,
        created_by
      })
      .select()
      .single();

    if (error) throw error;

    // Notify all users
    const { data: users } = await supabase.from('users').select('id');
    if (users && users.length > 0) {
      const notificationMessage = `Novo Desafio: ${title} valendo ${points || 0} pontos! Prepare-se!`;
      const notifications = users.map(u => ({
        user_id: u.id,
        message: notificationMessage,
        type: 'challenge'
      }));
      await supabase.from('notifications').insert(notifications);
    }

    logAction(created_by, 'CREATE_CHALLENGE', `Created challenge: ${title}`);

    res.status(201).json({ id: challenge.id, message: 'Challenge created and notifications sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create challenge.' });
  }
});

// Complete Challenge (Student)
router.post('/:id/complete', authenticate, async (req, res) => {
  const challengeId = req.params.id;
  const userId = req.user.id;
  const { fullName, whatsapp, unit } = req.body;

  if (!fullName || !whatsapp || !unit) {
    return res.status(400).json({ error: 'Nome completo, WhatsApp e Unidade são obrigatórios.' });
  }

  try {
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) return res.status(404).json({ error: 'Challenge not found.' });

    if (challenge.winner_id) {
      return res.status(400).json({ error: 'Challenge already won by someone else.' });
    }

    // Check if user already submitted
    const unlockedAt = await getSetting('challenges_unlocked_at', '1970-01-01T00:00:00.000Z');

    const { data: existing } = await supabase
      .from('actions')
      .select('id')
      .eq('user_id', userId)
      .in('type', ['challenge_bang', 'challenge_completion'])
      .gt('created_at', unlockedAt)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ 
        error: 'Você já enviou um desafio para validação. Aguarde a liberação da administração para enviar novamente.' 
      });
    }

    // Get user name
    const { data: user } = await supabase.from('users').select('name').eq('id', userId).single();
    const userName = user ? user.name : 'Aluno';

    const proof = JSON.stringify({ fullName, whatsapp, unit });

    // Create action
    await supabase.from('actions').insert({
      user_id: userId,
      type: 'challenge_completion',
      status: 'pending',
      points: challenge.points || 0,
      challenge_id: challengeId,
      proof
    });

    // Notify Admins
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
    if (admins && admins.length > 0) {
      const adminMsg = `Aluno ${userName} completou o desafio "${challenge.title}"! Verifique para validar.`;
      const notifications = admins.map(a => ({
        user_id: a.id,
        message: adminMsg,
        type: 'admin_alert'
      }));
      await supabase.from('notifications').insert(notifications);
    }

    res.json({ message: 'Challenge completion submitted for review.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit challenge completion.' });
  }
});

// Get all challenges (Admin Only)
router.get('/all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(challenges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch challenges.' });
  }
});

// Get Active Challenge
router.get('/active', authenticate, async (req, res) => {
  const now = new Date().toISOString();
  const userId = req.user.id;
  
  // Get the challenge that is currently active or upcoming (closest to now)
  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('*')
    .gt('end_date', now)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!challenge) return res.json(null);

  // Check if current user has already submitted
  const { data: submission } = await supabase
    .from('actions')
    .select('status')
    .eq('user_id', userId)
    .eq('challenge_id', challenge.id)
    .maybeSingle();
  
  res.json({
    ...challenge,
    user_status: submission ? submission.status : null
  });
});

// End Challenge Early (Admin Only)
router.post('/:id/end', authenticate, authorize(['admin']), async (req, res) => {
  const challengeId = req.params.id;
  
  console.log(`POST /api/challenges/${challengeId}/end - Requested by user ${req.user.id}`);

  try {
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      console.log(`Challenge ${challengeId} not found`);
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    const slightlyPast = new Date(Date.now() - 1000).toISOString();
    await supabase
      .from('challenges')
      .update({ end_date: slightlyPast })
      .eq('id', challengeId);
    
    console.log(`Ending challenge ${challengeId} early at ${slightlyPast}`);

    // Notify all users
    const { data: users } = await supabase.from('users').select('id');
    if (users && users.length > 0) {
      const notificationMessage = `O Desafio "${challenge.title}" foi encerrado antecipadamente pela administração.`;
      const notifications = users.map(u => ({
        user_id: u.id,
        message: notificationMessage,
        type: 'system'
      }));
      await supabase.from('notifications').insert(notifications);
    }

    logAction(req.user.id, 'END_CHALLENGE', `Ended challenge ${challengeId} early`);

    res.json({ message: 'Challenge ended successfully and users notified.' });
  } catch (err) {
    console.error('Error ending challenge early:', err);
    res.status(500).json({ error: 'Failed to end challenge.' });
  }
});

export default router;
