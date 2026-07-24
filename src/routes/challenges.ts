import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate, authorize, logAction } from '../middleware/auth.js';
import { getSetting, setSetting } from '../db/settingsManager.js';

const router = express.Router();

// Helper to parse max_winners and clean description
export function parseChallengeMetadata(challenge: any) {
  if (!challenge) return challenge;
  let maxWinners: number | null = null;
  let description = challenge.description || '';

  const match = description.match(/\[MAX_WINNERS:(.*?)\]/);
  if (match) {
    const val = match[1].trim();
    if (val !== 'unlimited' && val !== 'all' && val !== 'null') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxWinners = parsed;
      }
    }
    description = description.replace(/\n?\[MAX_WINNERS:.*?\]/g, '').trim();
  }

  return {
    ...challenge,
    description,
    max_winners: maxWinners
  };
}

// Create Challenge (Admin Only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { title, description, start_date, end_date, points, max_winners } = req.body;
  const created_by = req.user.id;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date, and end date are required.' });
  }

  const maxWinnersVal = (max_winners !== null && max_winners !== undefined && max_winners !== '' && max_winners !== 'unlimited' && max_winners !== 'all') 
    ? parseInt(String(max_winners), 10) 
    : null;

  const formattedDescription = `${description || ''}\n[MAX_WINNERS:${maxWinnersVal !== null && !isNaN(maxWinnersVal) ? maxWinnersVal : 'unlimited'}]`.trim();

  try {
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title,
        description: formattedDescription,
        start_date,
        end_date,
        points: points || 0,
        created_by
      })
      .select()
      .single();

    if (error) throw error;

    // Save in settings as backup
    await setSetting(`challenge_max_winners_${challenge.id}`, maxWinnersVal !== null && !isNaN(maxWinnersVal) ? String(maxWinnersVal) : 'unlimited');

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

// Get Challenge Submissions (Admin / Receptionist / Restricted Admin)
router.get('/submissions', authenticate, authorize(['admin', 'receptionist', 'restricted_admin']), async (req, res) => {
  try {
    const { data: actions, error } = await supabase
      .from('actions')
      .select(`
        *,
        users:user_id (id, name, nickname, unit, photo)
      `)
      .in('type', ['challenge_completion', 'challenge_bang'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get all challenges for mapping title
    const { data: challenges } = await supabase.from('challenges').select('id, title, points, description');
    const challengeMap = new Map();
    if (challenges) {
      challenges.forEach(c => {
        challengeMap.set(String(c.id), parseChallengeMetadata(c));
      });
    }

    const formatted = (actions || []).map(a => {
      const userObj = a.users || {};
      const challengeObj = a.challenge_id ? challengeMap.get(String(a.challenge_id)) : null;
      return {
        ...a,
        user_name: userObj.name || 'Aluno',
        user_nickname: userObj.nickname || '',
        user_unit: userObj.unit || 'Sem Unidade',
        user_photo: userObj.photo || null,
        challenge_title: challengeObj ? challengeObj.title : 'Desafio',
        challenge_max_winners: challengeObj ? challengeObj.max_winners : null
      };
    });

    res.json(formatted);
  } catch (err: any) {
    console.error('Failed to fetch challenge submissions:', err);
    res.status(500).json({ error: 'Failed to fetch challenge submissions.' });
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
    const { data: rawChallenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !rawChallenge) return res.status(404).json({ error: 'Challenge not found.' });

    const challenge = parseChallengeMetadata(rawChallenge);

    // Check if user already submitted for THIS specific challenge
    const unlockedAt = await getSetting('challenges_unlocked_at', '1970-01-01T00:00:00.000Z');

    const { data: existing } = await supabase
      .from('actions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .gt('created_at', unlockedAt)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ 
        error: existing.status === 'approved' 
          ? 'Você já concluiu este desafio e sua participação foi aprovada!' 
          : 'Sua resposta já foi enviada e está aguardando aprovação da administração.' 
      });
    }

    // Get user name
    const { data: user } = await supabase.from('users').select('name').eq('id', userId).single();
    const userName = user ? user.name : 'Aluno';

    const proof = JSON.stringify({ fullName, whatsapp, unit });

    // Create action in PENDING state
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
      const adminMsg = `Aluno ${userName} enviou o desafio "${challenge.title}" para validação!`;
      const notifications = admins.map(a => ({
        user_id: a.id,
        message: adminMsg,
        type: 'admin_alert'
      }));
      await supabase.from('notifications').insert(notifications);
    }

    res.json({ message: 'Desafio enviado com sucesso para a fila de aprovação da administração!' });
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
    
    const formatted = (challenges || []).map(parseChallengeMetadata);
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch challenges.' });
  }
});

// Get Active Challenges
router.get('/active', authenticate, async (req, res) => {
  const now = new Date().toISOString();
  const userId = req.user.id;
  
  // Get all challenges that are currently active or upcoming (where end_date > now)
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .gt('end_date', now)
    .order('start_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  if (!challenges || challenges.length === 0) return res.json([]);

  const challengeIds = challenges.map(c => c.id);

  // Check user submission status for each active challenge
  const { data: submissions } = await supabase
    .from('actions')
    .select('challenge_id, status')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  const submissionMap = new Map();
  if (submissions) {
    submissions.forEach(sub => {
      if (sub.challenge_id) {
        submissionMap.set(String(sub.challenge_id), sub.status);
      }
    });
  }

  const results = challenges.map(c => {
    const parsed = parseChallengeMetadata(c);
    return {
      ...parsed,
      user_status: submissionMap.get(String(parsed.id)) || null
    };
  });

  res.json(results);
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
