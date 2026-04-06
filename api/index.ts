import express from 'express';
import cookieParser from 'cookie-parser';
import { initSupabaseDb } from '../src/db/initSupabase.js';
import loginHandler from './auth/login.js';
import registerHandler from './auth/register.js';
import meHandler from './auth/me.js';
import logoutHandler from './auth/logout.js';
import userRoutes from '../src/routes/users.js';
import actionRoutes from '../src/routes/actions.js';
import adminRoutes from '../src/routes/admin.js';
import statsRoutes from '../src/routes/stats.js';
import challengeRoutes from '../src/routes/challenges.js';

const app = express();

// Initialize DB defaults
initSupabaseDb().catch(console.error);

app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// API Routes
app.post('/api/auth/login', loginHandler as any);
app.post('/api/auth/register', registerHandler as any);
app.get('/api/auth/me', meHandler as any);
app.post('/api/auth/logout', logoutHandler as any);

app.use('/api/users', userRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/challenges', challengeRoutes);

export default app;
