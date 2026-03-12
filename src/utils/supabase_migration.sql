-- Supabase Migration File
-- Generated for Gym App

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'receptionist', 'student')),
  email TEXT,
  photo TEXT,
  nickname TEXT,
  unit TEXT,
  score_monthly INTEGER DEFAULT 0,
  score_annual INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Challenges Table (Create before actions because of foreign key)
CREATE TABLE IF NOT EXISTS challenges (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_by BIGINT NOT NULL REFERENCES users(id),
  winner_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Actions Table
CREATE TABLE IF NOT EXISTS actions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('checkin', 'post', 'referral', 'referral_deal', 'bonus_week', 'challenge_completion')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  points INTEGER NOT NULL,
  proof TEXT, -- URL or JSON details
  challenge_id BIGINT REFERENCES challenges(id),
  validated_by BIGINT REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Logs Table
CREATE TABLE IF NOT EXISTS logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Hall of Fame Table
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  period_type TEXT NOT NULL CHECK(period_type IN ('week', 'month', 'year')),
  period_identifier TEXT NOT NULL, -- e.g., '2023-W42', '2023-10', '2023'
  user_id BIGINT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable Row Level Security (RLS) - Optional but recommended for Supabase
-- For now, we'll keep it simple as the app handles auth via Express
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for service role or authenticated if using Supabase Auth)
-- Since we use Express with a service role key, we might not need strict RLS policies yet
-- but it's good practice to have them.
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON actions FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON challenges FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON logs FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON hall_of_fame FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON settings FOR ALL USING (true);
