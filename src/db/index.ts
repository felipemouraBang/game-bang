import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'bang_ranking.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'receptionist', 'student')),
      email TEXT,
      photo TEXT,
      nickname TEXT,
      score_monthly INTEGER DEFAULT 0,
      score_annual INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    );
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN unit TEXT;`);
  } catch (e) {}

  // Actions Table (Check-ins, Posts, Referrals, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('checkin', 'post', 'referral', 'referral_deal', 'bonus_week', 'challenge_completion')),
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      points INTEGER NOT NULL,
      proof TEXT, -- URL or JSON details
      challenge_id INTEGER,
      validated_by INTEGER,
      validated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (validated_by) REFERENCES users(id),
      FOREIGN KEY (challenge_id) REFERENCES challenges(id)
    );
  `);

  // Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Hall of Fame Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hall_of_fame (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_type TEXT NOT NULL CHECK(period_type IN ('week', 'month', 'year')),
      period_identifier TEXT NOT NULL, -- e.g., '2023-W42', '2023-10', '2023'
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Challenges Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER DEFAULT 0,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      created_by INTEGER NOT NULL,
      winner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );
  `);

  try {
    db.exec(`ALTER TABLE challenges ADD COLUMN points INTEGER DEFAULT 0;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE challenges ADD COLUMN winner_id INTEGER;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE actions ADD COLUMN challenge_id INTEGER;`);
  } catch (e) {}

  // Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  try {
    db.exec(`ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'system';`);
  } catch (e) {
    // Column might already exist
  }

  // Settings Table (for gym location, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Create Default Admin (Admin / Moura)
  const adminExists = db.prepare('SELECT id FROM users WHERE login = ?').get('Admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('Moura', 10);
    db.prepare(`
      INSERT INTO users (name, login, password, role, email, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Administrador Master', 'Admin', hashedPassword, 'admin', 'admin@bang.com', 'Mestre');
    console.log('Default Admin created.');
  }

  // Create Default Receptionist (Recepcao / Teambang744) - Login not specified, assuming 'Recepcao' or similar
  // The prompt says "Senha inicial padrão: Teambang744". I'll create a generic receptionist user.
  const recepExists = db.prepare('SELECT id FROM users WHERE role = ?').get('receptionist');
  if (!recepExists) {
    const hashedPassword = bcrypt.hashSync('Teambang744', 10);
    db.prepare(`
      INSERT INTO users (name, login, password, role, email, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Recepção', 'Recepcao', hashedPassword, 'receptionist', 'recepcao@bang.com', 'Recepção');
    console.log('Default Receptionist created.');
  }
  
  // Create a default student for testing
  const studentExists = db.prepare('SELECT id FROM users WHERE role = ?').get('student');
  if (!studentExists) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (name, login, password, role, email, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Aluno Exemplo', 'Aluno', hashedPassword, 'student', 'aluno@bang.com', 'Lutador');
    console.log('Default Student created.');
  }
}

export default db;
