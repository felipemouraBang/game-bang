import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { supabase } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { loginOrEmail, newPassword } = req.body;
  loginOrEmail = loginOrEmail?.trim();

  if (!loginOrEmail || !newPassword) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    // Attempt to find the user by login or email.
    // .or() syntax expects something like: 'login.eq.username,email.eq.username'
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, login')
      .or(`login.eq.${loginOrEmail},email.eq.${loginOrEmail}`);
    
    if (findError) {
      throw findError;
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Crie sua conta ou verifique os dados' });
    }

    const user = users[0];

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Log the password change action
    await supabase.from('logs').insert({ user_id: user.id, action: 'RESET_PASSWORD', details: `User reset password unauthenticated via login/email` });

    return res.status(200).json({ message: 'Senha atualizada com sucesso!' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Erro interno ao tentar alterar a senha.' });
  }
}
