import express from 'express';
import { body, validationResult } from 'express-validator';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// List feedback for a notice (with replies)
router.get('/:noticeId', async (req, res) => {
	const noticeId = Number(req.params.noticeId);
	const rows = await all(
		`SELECT f.*, u.name as user_name, u.role as user_role 
		 FROM feedback f JOIN users u ON f.user_id = u.id
		 WHERE f.notice_id = ? AND f.reply_to IS NULL
		 ORDER BY datetime(f.created_at) ASC`,
		[noticeId]
	);
	// Get replies for each comment
	for (const row of rows) {
		const replies = await all(
			`SELECT f.*, u.name as user_name, u.role as user_role 
			 FROM feedback f JOIN users u ON f.user_id = u.id
			 WHERE f.reply_to = ?
			 ORDER BY datetime(f.created_at) ASC`,
			[row.id]
		);
		row.replies = replies;
	}
	return res.json(rows);
});

// Add feedback or reply
router.post(
	'/:noticeId',
	requireAuth,
	[
		body('message').isString().isLength({ min: 1 }),
		body('reply_to').optional().isInt()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const noticeId = Number(req.params.noticeId);
		const notice = await get('SELECT id, comment_enabled FROM notices WHERE id = ?', [noticeId]);
		if (!notice) return res.status(404).json({ error: 'Notice not found' });
		if (!notice.comment_enabled) return res.status(403).json({ error: 'Comments are disabled for this notice' });
		const replyTo = req.body.reply_to ? Number(req.body.reply_to) : null;
		if (replyTo) {
			const parent = await get('SELECT id FROM feedback WHERE id = ? AND notice_id = ?', [replyTo, noticeId]);
			if (!parent) return res.status(404).json({ error: 'Parent comment not found' });
		}
		const now = new Date().toISOString();
		const result = await run(
			'INSERT INTO feedback (notice_id, user_id, message, reply_to, created_at) VALUES (?,?,?,?,?)',
			[noticeId, req.user.id, req.body.message, replyTo, now]
		);
		const row = await get(
			`SELECT f.*, u.name as user_name, u.role as user_role 
			 FROM feedback f JOIN users u ON f.user_id = u.id 
			 WHERE f.id = ?`,
			[result.lastID]
		);
		return res.status(201).json(row);
	}
);

// Delete feedback (own comment or admin/teacher)
router.delete('/:id', requireAuth, async (req, res) => {
	const id = Number(req.params.id);
	const comment = await get('SELECT * FROM feedback WHERE id = ?', [id]);
	if (!comment) return res.status(404).json({ error: 'Not found' });
	if (req.user.role !== 'admin' && req.user.role !== 'teacher' && comment.user_id !== req.user.id) {
		return res.status(403).json({ error: 'Forbidden' });
	}
	await run('DELETE FROM feedback WHERE id = ?', [id]);
	return res.json({ ok: true });
});

export default router;


