import express from 'express';
import { supabase } from '../db/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get Ranking (All Users)
router.get('/ranking', authenticate, async (req, res) => {
  const { period, unit } = req.query; // 'monthly' or 'annual'

  let orderBy = 'score_monthly';
  if (period === 'annual') {
    orderBy = 'score_annual';
  }

  let query = supabase
    .from('users')
    .select('id, name, nickname, photo, score_monthly, score_annual, unit')
    .eq('role', 'student')
    .eq('is_active', true);

  if (unit && unit !== 'all') {
    query = query.eq('unit', unit);
  }

  const { data: ranking, error } = await query
    .order(orderBy, { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(ranking);
});

// Get Evolution (Self)
router.get('/evolution', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { period } = req.query; // 'week', 'month', 'year'

  // Supabase/Postgres doesn't have strftime, we use to_char or date_trunc
  // For simplicity, we'll fetch actions and process in JS or use a raw query if needed.
  // But let's try to use Supabase's query builder if possible.
  
  // Actually, for complex aggregations, raw SQL is better. 
  // But we can't do raw SQL easily with the client SDK without RPC.
  // Let's fetch the last 100 approved actions and aggregate in JS for now.
  
  const { data: actions, error } = await supabase
    .from('actions')
    .select('created_at, points')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const evolution: any[] = [];
  const groups: { [key: string]: number } = {};

  actions.forEach(a => {
    const date = new Date(a.created_at);
    let key = date.toISOString().split('T')[0]; // Daily
    
    if (period === 'year') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly
    } else if (period === 'week') {
      // Simple week calculation
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${weekNum}`;
    }
    
    groups[key] = (groups[key] || 0) + a.points;
  });

  Object.keys(groups).forEach(key => {
    evolution.push({ date: key, total_points: groups[key] });
  });

  res.json(evolution);
});

// Get Hall of Fame (Public)
router.get('/hall-of-fame', authenticate, async (req, res) => {
  const { data: hallOfFame, error } = await supabase
    .from('hall_of_fame')
    .select(`
      *,
      users:user_id (name, photo, nickname)
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  const formattedHallOfFame = hallOfFame.map(h => ({
    ...h,
    name: h.users?.name,
    photo: h.users?.photo,
    nickname: h.users?.nickname
  }));

  res.json(formattedHallOfFame);
});

// Generate Hall of Fame (Admin Trigger - Simplified)
router.post('/hall-of-fame/generate', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { period_type, period_identifier } = req.body;

  let orderBy = 'score_monthly';
  if (period_type === 'year') orderBy = 'score_annual';

  const { data: champion, error } = await supabase
    .from('users')
    .select('id, score_monthly, score_annual')
    .eq('role', 'student')
    .order(orderBy, { ascending: false })
    .limit(1)
    .single();

  if (error || !champion) {
    return res.status(404).json({ error: 'No champion found' });
  }

  const score = period_type === 'year' ? champion.score_annual : champion.score_monthly;

  const { error: insertError } = await supabase
    .from('hall_of_fame')
    .insert({
      period_type,
      period_identifier,
      user_id: champion.id,
      score: score
    });

  if (insertError) return res.status(500).json({ error: insertError.message });
  res.json({ message: 'Hall of Fame updated', champion: { ...champion, score } });
});

export default router;
