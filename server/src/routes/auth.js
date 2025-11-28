import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { get, run } from '../lib/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post(
	'/login',
	[
		body('email').exists(),
		body('password').exists()
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ error: 'Invalid email or password format', errors: errors.array() });
			}
			const { email, password, role } = req.body;
			if (!email || !password) {
				return res.status(400).json({ error: 'Username and password are required' });
			}
			const user = await get('SELECT * FROM users WHERE email = ?', [email]);
			if (!user) {
				return res.status(401).json({ error: 'Invalid email or password' });
			}
			
			// If role is specified, validate it matches
			if (role && user.role !== role) {
				return res.status(401).json({ error: `This account is registered as ${user.role}, not ${role}` });
			}
			
			const ok = await bcrypt.compare(password, user.password_hash);
			if (!ok) {
				return res.status(401).json({ error: 'Invalid email or password' });
			}
			const token = signToken({
				id: user.id,
				role: user.role,
				name: user.name,
				department: user.department,
				email: user.email
			});
			return res.json({
				token,
				user: { id: user.id, role: user.role, name: user.name, department: user.department, email: user.email }
			});
		} catch (err) {
			console.error('Login error:', err);
			return res.status(500).json({ error: 'Server error during login' });
		}
	}
);

router.post(
	'/signup',
	[
		body('email').isEmail(),
		body('password').isLength({ min: 6 }),
		body('name').notEmpty(),
		body('role').isIn(['teacher', 'student', 'admin']),
		body('department').notEmpty()
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
			}
			const { email, password, name, role, department } = req.body;
			
			// Check if user already exists
			const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
			if (existing) {
				return res.status(400).json({ error: 'Email already registered' });
			}
			
			// Hash password and create user
			const passwordHash = await bcrypt.hash(password, 10);
			await run(
				'INSERT INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)',
				[name, email, passwordHash, role, department]
			);
			
			// Return success
			return res.json({ message: 'Account created successfully. Please log in.' });
		} catch (err) {
			console.error('Signup error:', err);
			return res.status(500).json({ error: 'Server error during signup' });
		}
	}
);

router.post(
	'/forgot-password',
	[body('email').isEmail()],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ error: 'Invalid email format', errors: errors.array() });
			}

			const { email } = req.body;
			
			// Check if user exists
			const user = await get('SELECT id FROM users WHERE email = ?', [email]);
			if (!user) {
				// Don't reveal if email exists for security
				return res.json({ message: 'If an account with that email exists, a password reset link will be sent.' });
			}

			// Generate reset token
			const token = crypto.randomBytes(32).toString('hex');
			const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

			// Store token in database
			await run(
				'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?,?,?,?)',
				[user.id, token, expiresAt.toISOString(), new Date().toISOString()]
			);

			// Send email with reset link
			const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
			const emailSent = await sendPasswordResetEmail(email, resetLink);

			// Even if email fails, confirm success to user for security
			return res.json({ 
				message: 'Password reset link sent to your email.',
				debug: process.env.NODE_ENV === 'development' ? { emailSent, token } : undefined
			});
		} catch (err) {
			console.error('Forgot password error:', err.message);
			return res.status(500).json({ error: 'Server error during password reset request' });
		}
	}
);

router.post(
	'/reset-password',
	[
		body('token').notEmpty(),
		body('newPassword').isLength({ min: 6 })
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
			}

			const { token, newPassword } = req.body;

			// Find valid token
			const resetRecord = await get(
				'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
				[token]
			);

			if (!resetRecord) {
				return res.status(400).json({ error: 'Invalid or expired reset token' });
			}

			// Hash new password
			const passwordHash = await bcrypt.hash(newPassword, 10);

			// Update user password
			await run(
				'UPDATE users SET password_hash = ? WHERE id = ?',
				[passwordHash, resetRecord.user_id]
			);

			// Mark token as used
			await run(
				'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
				[resetRecord.id]
			);

			return res.json({ message: 'Password reset successfully. Please log in with your new password.' });
		} catch (err) {
			console.error('Reset password error:', err);
			return res.status(500).json({ error: 'Server error during password reset' });
		}
	}
);

router.post(
	'/delete-account',
	requireAuth,
	async (req, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: 'Unauthorized: No user found' });
			}

			// Delete user from database
			await run('DELETE FROM users WHERE id = ?', [userId]);

			// Also delete any password reset tokens associated with this user
			await run('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

			return res.json({ message: 'Account deleted successfully' });
		} catch (err) {
			console.error('Delete account error:', err);
			return res.status(500).json({ error: 'Server error during account deletion' });
		}
	}
);

// Google OAuth endpoint - creates account if doesn't exist
router.post(
	'/google',
	[body('token').notEmpty()],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
			}

			const { token } = req.body;

			// Verify Google token
			const ticket = await googleClient.verifyIdToken({
				idToken: token,
				audience: process.env.GOOGLE_CLIENT_ID
			});

			const payload = ticket.getPayload();
			const email = payload.email;
			const name = payload.name;

			// Check if user exists
			let user = await get('SELECT * FROM users WHERE email = ?', [email]);

			if (!user) {
				// Create new user with Google account - default to student role and 'all' department
				const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
				await run(
					'INSERT INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)',
					[name, email, passwordHash, 'student', 'all']
				);
				user = await get('SELECT * FROM users WHERE email = ?', [email]);
			}

			// Generate token
			const authToken = signToken({
				id: user.id,
				role: user.role,
				name: user.name,
				department: user.department,
				email: user.email
			});

			return res.json({
				token: authToken,
				user: { 
					id: user.id, 
					role: user.role, 
					name: user.name, 
					department: user.department, 
					email: user.email 
				}
			});
		} catch (err) {
			console.error('Google OAuth error:', err);
			return res.status(401).json({ error: 'Google authentication failed' });
		}
	}
);

export default router;


