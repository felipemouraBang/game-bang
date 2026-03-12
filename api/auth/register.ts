import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { supabase } from '../../src/db/supabase.js';

const SECRET_KEY = process.env.JWT_SECRET || 'bang_ranking_secret_key_2024';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { name, login, password, email, nickname, unit } = req.body;
  
  name = name?.trim();
  login = login?.trim();
  email = email?.trim();
  nickname = nickname?.trim();
  unit = unit?.trim();

  if (!name || !login || !password || !unit) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('login', login)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Este login já está em uso.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        login,
        password: hashedPassword,
        role: 'student',
        email: email || null,
        nickname: nickname || null,
        unit
      })
      .select()
      .single();

    if (error || !user) {
      throw error || new Error('Failed to create user');
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
    
    // Log registration
    await supabase.from('logs').insert({ user_id: user.id, action: 'REGISTER', details: 'User registered' });

    return res.status(201).json({ user: { id: user.id, name: user.name, role: user.role, photo: user.photo } });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
}
