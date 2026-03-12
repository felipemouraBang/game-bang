import db from './src/db/index.js';
import bcrypt from 'bcryptjs';

const user = db.prepare('SELECT * FROM users WHERE login = ?').get('Admin');

console.log('User found:', user);

if (user) {
  const isMatch = bcrypt.compareSync('Moura', user.password);
  console.log('Password "Moura" match:', isMatch);
  
  if (!isMatch) {
    console.log('Resetting password for Admin...');
    const newHash = bcrypt.hashSync('Moura', 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, user.id);
    console.log('Password reset complete.');
  }
} else {
  console.log('Admin user not found. Creating...');
  const hashedPassword = bcrypt.hashSync('Moura', 10);
  db.prepare(`
    INSERT INTO users (name, login, password, role, email, nickname)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Administrador Master', 'Admin', hashedPassword, 'admin', 'admin@bang.com', 'Mestre');
  console.log('Admin user created.');
}
