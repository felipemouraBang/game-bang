-- Migration for Supabase - Bang Ranking App
-- Complete Schema and Initial Data

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student', -- 'admin', 'receptionist', 'student'
    email TEXT,
    photo TEXT,
    nickname TEXT,
    unit TEXT,
    score_monthly INTEGER DEFAULT 0,
    score_annual INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    points INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create Actions Table (Points validation)
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'challenge', 'daily', 'extra', 'checkin', 'post', 'referral_deal', 'graduation'
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    points INTEGER DEFAULT 0,
    proof JSONB, -- { image_url: string, description: string, lat, lng, etc }
    validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create Hall of Fame Table
CREATE TABLE IF NOT EXISTS hall_of_fame (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL, -- 'month', 'year'
    period_identifier TEXT NOT NULL, -- '2024-03', '2024'
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_score_monthly ON users(score_monthly DESC);
CREATE INDEX IF NOT EXISTS idx_users_score_annual ON users(score_annual DESC);
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);

-- 9. Initial Users Insertion
-- Admin: Login 'Admin', Password 'Moura'
INSERT INTO users (name, login, password, role, nickname, email, is_active)
VALUES (
    'Administrador Master', 
    'Admin', 
    '$2b$10$8snye28GHXCPaFy//02Fd.LSofBdCfzwidHUkf1v/cMbqM.tL3AHy', 
    'admin', 
    'Mestre',
    'admin@bang.com',
    true
) ON CONFLICT (login) DO NOTHING;

-- Receptionist: Login 'Recepcao', Password 'Teambang744'
INSERT INTO users (name, login, password, role, nickname, email, is_active)
VALUES (
    'Recepção', 
    'Recepcao', 
    '$2b$10$3BYUGn9P8CjUsy9DZaWtfekWQ1NdcFRERjQrJSBa2No9iw5tk.28y', 
    'receptionist', 
    'Recepção',
    'recepcao@bang.com',
    true
) ON CONFLICT (login) DO NOTHING;

-- Test Student: Login 'Aluno', Password '123456'
INSERT INTO users (name, login, password, role, nickname, email, unit, is_active)
VALUES (
    'Aluno Exemplo', 
    'Aluno', 
    '$2b$10$4MII9WxTRuntNlaSSfossepjeE.4xUlkKNjnMflo6u89xbTeBsDLe', 
    'student', 
    'Lutador',
    'aluno@bang.com',
    'Forte Fitness',
    true
) ON CONFLICT (login) DO NOTHING;
