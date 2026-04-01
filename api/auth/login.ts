import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { supabase } from '../../src/db/supabase.js';
import { initSupabaseDb } from '../../src/db/initSupabase.js';

const SECRET_KEY = process.env.JWT_SECRET || 'bang_ranking_secret_key_2024';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize DB defaults
  await initSupabaseDb();

  const { login: rawLogin, password: rawPassword } = req.body;
  const login = rawLogin?.trim();
  const password = rawPassword?.trim();

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('login', login)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });

    const cookieStr = serialize('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    res.setHeader('Set-Cookie', cookieStr);
    
    // Log login
    await supabase.from('logs').insert({ user_id: user.id, action: 'LOGIN', details: 'User logged in' });

    return res.status(200).json({ user: { id: user.id, name: user.name, role: user.role, photo: user.photo } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
