import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';

const SECRET_KEY = process.env.JWT_SECRET || 'bang_ranking_secret_key_2024';

export const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

export const logAction = async (userId, action, details) => {
  try {
    await supabase.from('logs').insert({ user_id: userId, action, details });
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};
