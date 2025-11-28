import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './lib/db.js';
import { initEmailService } from './lib/email.js';
import authRouter from './routes/auth.js';
import noticesRouter from './routes/notices.js';
import feedbackRouter from './routes/feedback.js';
import { seedDemo } from './lib/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Initialize database and seed demo data
console.log('Initializing database...');
await initDb();
console.log('Database initialized successfully');
await seedDemo();
console.log('Demo data seeded');

// Initialize email service
console.log('Initializing email service...');
initEmailService();
console.log('Email service ready');

app.get('/api/health', (req, res) => {
	return res.json({ ok: true, service: 'notice-board', version: '1.0.0' });
});

app.use('/api/auth', authRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/feedback', feedbackRouter);

// Get the uploads directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../data/uploads');

// Serve frontend build if deployed together
const staticDir = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(staticDir));
app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api')) return next();
	return res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});


