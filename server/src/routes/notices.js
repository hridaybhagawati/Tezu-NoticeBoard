import express from 'express';
import { body, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { all, get, run } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendBulkNotificationEmails } from '../lib/email.js';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadsDir),
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (req, file, cb) => {
		const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
		const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = allowedTypes.test(file.mimetype);
		if (extname && mimetype) {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type. Allowed: images, PDF, DOC, TXT'));
		}
	}
});

const router = express.Router();

// List notices with filters and pagination
router.get(
	'/',
	requireAuth,
	[
		query('q').optional().isString(),
		query('category').optional().isString(),
		query('department').optional().isString(),
		query('approved').optional().isIn(['0', '1']),
		query('pending').optional().isIn(['0', '1']),
		query('page').optional().isInt({ min: 1 }),
		query('pageSize').optional().isInt({ min: 1, max: 50 })
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { q = '', category = '', department = '' } = req.query;
		const showPending = req.query.pending === '1';
		const page = Number(req.query.page ?? 1);
		const pageSize = Number(req.query.pageSize ?? 10);
		const offset = (page - 1) * pageSize;
		const where = [];
		const params = [];
		
		if (q) {
			where.push('(title LIKE ? OR content LIKE ?)');
			params.push(`%${q}%`, `%${q}%`);
		}
		if (category) {
			where.push('category = ?');
			params.push(category);
		}
		if (department) {
			where.push('department = ?');
			params.push(department);
		}
		
		// Admin can view pending notices when requested, others see only approved
		if (req.user?.role === 'admin' && showPending) {
			where.push("(status = 'pending' OR status = 'rejected')");
		} else {
			where.push("status = 'approved'");
		}
		
		const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
		const rows = await all(
			`SELECT n.*, u.name as author_name,
				(SELECT COUNT(*) FROM reactions WHERE notice_id = n.id) as like_count,
				(SELECT COUNT(*) FROM reactions WHERE notice_id = n.id AND user_id = ?) as user_liked
			FROM notices n 
			JOIN users u ON n.author_id = u.id
			${whereSql}
			ORDER BY datetime(created_at) DESC
			LIMIT ? OFFSET ?`,
			[req.user?.id || 0, ...params, pageSize, offset]
		);
		// Get attachments for each notice
		for (const row of rows) {
			const attachments = await all('SELECT * FROM attachments WHERE notice_id = ?', [row.id]);
			row.attachments = attachments.map(a => ({
				id: a.id,
				filename: a.filename,
				original_filename: a.original_filename,
				file_type: a.file_type,
				file_size: a.file_size,
				url: `/api/notices/files/${a.filename}`, // Updated secure file endpoint
			}));
			row.like_count = row.like_count || 0;
			row.user_liked = row.user_liked > 0;
		}
		const totalRow = await get(
			`SELECT COUNT(*) as total FROM notices n ${whereSql}`,
			params
		);
		return res.json({ items: rows, total: totalRow.total, page, pageSize });
	}
);

// Create notice (teacher/admin) with optional file uploads
router.post(
	'/',
	requireAuth,
	requireRole('teacher', 'admin'),
	upload.array('files', 10),
	[
		body('title').isString().isLength({ min: 1 }),
		body('content').isString().isLength({ min: 1 }),
		body('category').isString(),
		body('department').isString(),
		body('comment_enabled').optional().isBoolean()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { title, content, category, department, comment_enabled = true } = req.body;
		const now = new Date().toISOString();
		
		// Teachers: notices are pending, Admins: notices are approved
		const status = req.user.role === 'admin' ? 'approved' : 'pending';
		
		const result = await run(
			'INSERT INTO notices (title, content, category, department, author_id, status, comment_enabled, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
			[title, content, category, department, req.user.id, status, comment_enabled ? 1 : 0, now, now]
		);
		const noticeId = result.lastID;
		// Save uploaded files
		if (req.files && req.files.length > 0) {
			console.log(`Creating notice ${noticeId} with ${req.files.length} files`);
			for (const file of req.files) {
				console.log(`Inserting file: ${file.filename} for notice ${noticeId}`);
				await run(
					'INSERT INTO attachments (notice_id, filename, original_filename, file_path, file_type, file_size, created_at) VALUES (?,?,?,?,?,?,?)',
					[noticeId, file.filename, file.originalname, file.path, file.mimetype, file.size, now]
				);
			}
		}
		const row = await get('SELECT * FROM notices WHERE id = ?', [noticeId]);
		// Fetch attachments for the response
		const attachments = await all('SELECT * FROM attachments WHERE notice_id = ?', [noticeId]);
		row.attachments = attachments.map(a => ({
			id: a.id,
			filename: a.filename,
			original_filename: a.original_filename,
			file_type: a.file_type,
			file_size: a.file_size,
			url: `/api/notices/files/${a.filename}`,
		}));
		console.log(`Notice ${noticeId} created with ${row.attachments.length} attachments`);
		
		// Send email notifications if notice is approved (only for admin-created notices)
		if (status === 'approved') {
			console.log(`📮 Notice ${noticeId} is approved. Attempting to send email notifications...`);
			// Get all user emails from database
			const userEmails = await all('SELECT DISTINCT email FROM users WHERE role IN (?, ?)', ['student', 'teacher']);
			const emails = userEmails.map(u => u.email);
			
			if (emails.length > 0) {
				console.log(`📧 Found ${emails.length} registered users to notify`);
				const emailResult = await sendBulkNotificationEmails(
					emails, 
					title, 
					content, 
					req.user.name || 'Administrator'
				);
				console.log(`📬 Email result: ${emailResult.sent} successful, ${emailResult.failed} failed`);
			} else {
				console.log('⚠️  No registered users found to notify');
			}
		} else {
			console.log(`📝 Notice ${noticeId} saved as pending (waiting for admin approval)`);
		}
		
		return res.status(201).json(row);
	}
);

// Update notice (owner teacher or admin)
router.put(
	'/:id',
	requireAuth,
	requireRole('teacher', 'admin'),
	[
		body('title').optional().isString().isLength({ min: 3 }),
		body('content').optional().isString().isLength({ min: 3 }),
		body('category').optional().isString(),
		body('department').optional().isString(),
		body('approved').optional().isBoolean(),
		body('comment_enabled').optional().isBoolean()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const id = Number(req.params.id);
		const existing = await get('SELECT * FROM notices WHERE id = ?', [id]);
		if (!existing) return res.status(404).json({ error: 'Not found' });
		if (req.user.role !== 'admin' && existing.author_id !== req.user.id) {
			return res.status(403).json({ error: 'Forbidden' });
		}
		const updated = {
			title: req.body.title ?? existing.title,
			content: req.body.content ?? existing.content,
			category: req.body.category ?? existing.category,
			department: req.body.department ?? existing.department,
			approved: req.user.role === 'admin' ? Number(req.body.approved ?? existing.approved) : existing.approved,
			comment_enabled: req.body.comment_enabled !== undefined ? (req.body.comment_enabled ? 1 : 0) : existing.comment_enabled,
			updated_at: new Date().toISOString()
		};
		await run(
			'UPDATE notices SET title=?, content=?, category=?, department=?, approved=?, comment_enabled=?, updated_at=? WHERE id=?',
			[updated.title, updated.content, updated.category, updated.department, updated.approved, updated.comment_enabled, updated.updated_at, id]
		);
		const row = await get('SELECT * FROM notices WHERE id = ?', [id]);
		return res.json(row);
	}
);

// Approve notice (admin)
router.post('/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
	const id = Number(req.params.id);
	console.log(`📋 Admin ${req.user.id} attempting to approve notice ${id}`);
	
	const existing = await get('SELECT * FROM notices WHERE id = ?', [id]);
	if (!existing) {
		console.error(`❌ Notice ${id} not found`);
		return res.status(404).json({ error: 'Not found' });
	}
	
	if (existing.status === 'approved') {
		console.log(`ℹ️  Notice ${id} already approved`);
		return res.json(existing);
	}
	
	await run('UPDATE notices SET status = ?, updated_at = ? WHERE id = ?', ['approved', new Date().toISOString(), id]);
	const row = await get('SELECT * FROM notices WHERE id = ?', [id]);
	console.log(`✅ Notice ${id} approved successfully`);
	
	// Send email notifications
	console.log(`📮 Notice ${id} has been approved. Sending email notifications...`);
	const userEmails = await all('SELECT DISTINCT email FROM users WHERE role IN (?, ?)', ['student', 'teacher']);
	const emails = userEmails.map(u => u.email);
	
	if (emails.length > 0) {
		console.log(`📧 Found ${emails.length} users to notify`);
		const emailResult = await sendBulkNotificationEmails(
			emails,
			row.title,
			row.content,
			'Administrator'
		);
		console.log(`📬 Email result: ${emailResult.sent} sent, ${emailResult.failed} failed`);
	} else {
		console.log('⚠️  No users found to notify');
	}
	
	return res.json(row);
});

// Disapprove/Reject notice (admin)
router.post('/:id/disapprove', requireAuth, requireRole('admin'), async (req, res) => {
	const id = Number(req.params.id);
	const reason = req.body.reason || '';
	console.log(`❌ Admin ${req.user.id} rejecting notice ${id}. Reason: ${reason}`);
	
	const existing = await get('SELECT * FROM notices WHERE id = ?', [id]);
	if (!existing) {
		console.error(`❌ Notice ${id} not found`);
		return res.status(404).json({ error: 'Not found' });
	}
	
	if (existing.status === 'rejected') {
		console.log(`ℹ️  Notice ${id} already rejected`);
		return res.json(existing);
	}
	
	await run('UPDATE notices SET status = ?, updated_at = ? WHERE id = ?', ['rejected', new Date().toISOString(), id]);
	const row = await get('SELECT * FROM notices WHERE id = ?', [id]);
	console.log(`✅ Notice ${id} rejected successfully`);
	
	return res.json(row);
});

// Delete notice (owner teacher or admin)
router.delete('/:id', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
	const id = Number(req.params.id);
	const existing = await get('SELECT * FROM notices WHERE id = ?', [id]);
	if (!existing) return res.status(404).json({ error: 'Not found' });
	if (req.user.role !== 'admin' && existing.author_id !== req.user.id) {
		return res.status(403).json({ error: 'Forbidden' });
	}
	await run('DELETE FROM notices WHERE id = ?', [id]);
	return res.json({ ok: true });
});

// Secure file download endpoint (MUST come before /:id routes)
router.get('/files/:filename', requireAuth, async (req, res) => {
    try {
        const filename = req.params.filename;
        console.log('File request:', filename, 'by user:', req.user?.id, 'role:', req.user?.role);
        
        // First check if the file is associated with any notice
        const notice = await get(
            'SELECT n.* FROM notices n JOIN attachments a ON n.id = a.notice_id WHERE a.filename = ?',
            [filename]
        );
        
        console.log('Notice lookup result:', notice ? `Found notice ${notice.id}` : 'No notice found');
        
        if (!notice) {
            console.error('File not found in database:', filename);
            return res.status(404).json({ error: 'File not found' });
        }

        // Check access permissions based on user role and notice status
        // Teachers and admins can always access
        // Students can only access approved notices in their department (or 'all' notices)
        if (req.user.role === 'student') {
            if (notice.approved !== 1) {
                console.error('Access denied - not approved');
                return res.status(403).json({ error: 'Access denied. Notice not yet approved.' });
            }

            // If department-specific notice, check department access
            if (notice.department && notice.department !== 'all' && req.user.department !== notice.department) {
                console.error('Access denied - department mismatch. User dept:', req.user.department, 'Notice dept:', notice.department);
                return res.status(403).json({ error: 'Access denied. Notice is not for your department.' });
            }
        }

        // If all checks pass, serve the file
        const filePath = path.join(uploadsDir, filename);
        console.log('Serving file from:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('File does not exist on disk:', filePath);
            return res.status(404).json({ error: 'File not found on disk' });
        }

        console.log('File served successfully');
        res.sendFile(filePath);
    } catch (err) {
        console.error('File download error:', err);
        res.status(500).json({ error: 'Server error while downloading file', details: err.message });
    }
});

// Export notice as PDF
router.get('/:id/export/pdf', async (req, res) => {
	try {
		const id = Number(req.params.id);
		
		if (!id || isNaN(id)) {
			return res.status(400).json({ error: 'Invalid notice ID' });
		}
		
		const row = await get(
			`SELECT n.*, u.name as author_name 
			 FROM notices n JOIN users u ON n.author_id = u.id WHERE n.id = ?`,
			[id]
		);
		
		if (!row) {
			return res.status(404).json({ error: 'Notice not found' });
		}
		
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="notice-${id}.pdf"`);
		
		const doc = new PDFDocument({ margin: 50 });
		
		// Handle errors
		doc.on('error', (err) => {
			console.error('PDF generation error:', err);
			if (!res.headersSent) {
				res.status(500).json({ error: 'PDF generation failed' });
			}
		});
		
		doc.pipe(res);
		
		// Title
		doc.fontSize(20).text(row.title, { underline: true });
		doc.moveDown();
		
		// Metadata
		doc.fontSize(12).text(`Category: ${row.category}    Department: ${row.department}`);
		doc.text(`Author: ${row.author_name}`);
		doc.text(`Date: ${new Date(row.created_at).toLocaleString()}`);
		doc.moveDown();
		
		// Content
		doc.fontSize(14).text(row.content, { align: 'left' });
		
		doc.end();
	} catch (err) {
		console.error('PDF export error:', err);
		if (!res.headersSent) {
			res.status(500).json({ error: 'Failed to generate PDF' });
		}
	}
});

// Like/Unlike notice
router.post('/:id/like', requireAuth, async (req, res) => {
	const noticeId = Number(req.params.id);
	const notice = await get('SELECT id FROM notices WHERE id = ?', [noticeId]);
	if (!notice) return res.status(404).json({ error: 'Not found' });
	const existing = await get('SELECT * FROM reactions WHERE notice_id = ? AND user_id = ?', [noticeId, req.user.id]);
	if (existing) {
		await run('DELETE FROM reactions WHERE notice_id = ? AND user_id = ?', [noticeId, req.user.id]);
		return res.json({ liked: false });
	} else {
		await run('INSERT INTO reactions (notice_id, user_id, reaction_type, created_at) VALUES (?,?,?,?)', [
			noticeId,
			req.user.id,
			'like',
			new Date().toISOString()
		]);
		return res.json({ liked: true });
	}
});

export default router;


