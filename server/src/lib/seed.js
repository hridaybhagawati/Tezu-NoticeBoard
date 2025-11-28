import bcrypt from 'bcryptjs';
import { all, get, run } from './db.js';

const demoUsers = [
	{ name: 'Admin User', email: 'admin@tezpuruniversity.ac.in', role: 'admin', department: 'General', password: 'Admin@123' },
	{ name: 'Teacher One', email: 'teacher@tezpuruniversity.ac.in', role: 'teacher', department: 'CS', password: 'Teacher@123' },
	{ name: 'Student One', email: 'student@tezpuruniversity.ac.in', role: 'student', department: 'CS', password: 'Student@123' }
];

export async function seedDemo() {
	try {
		const existing = await all('SELECT email FROM users');
		const existingEmails = new Set(existing.map(u => u.email));
		for (const user of demoUsers) {
			if (existingEmails.has(user.email)) {
				console.log(`User ${user.email} already exists, skipping`);
				continue;
			}
			const passwordHash = await bcrypt.hash(user.password, 10);
			await run(
				'INSERT INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)',
				[user.name, user.email, passwordHash, user.role, user.department]
			);
			console.log(`Created user: ${user.email} (${user.role})`);
		}
	} catch (err) {
		console.error('Error seeding users:', err);
		throw err;
	}
	// Ensure a set of demo notices exist (idempotent)
	try {
		const now = new Date().toISOString();
		const teacher = await get('SELECT id FROM users WHERE role = ?', ['teacher']);
		const authorId = teacher?.id ?? 2;

		const demoNotices = [
			{
				title: 'Welcome Back to Campus',
				content: 'Classes resume from next Monday. Please check your schedules.',
				category: 'Academic',
				department: 'all',
				status: 'approved'
			},
			{
				title: 'CS Department Hackathon',
				content: '24-hour coding marathon this weekend. Teams of 3-4. Register online.',
				category: 'Events',
				department: 'all',
				status: 'approved'
			},
			{
				title: 'Library Maintenance',
				content: 'The library will be closed for maintenance on Saturday between 9am-12pm.',
				category: 'General',
				department: 'all',
				status: 'approved'
			},
			{
				title: 'Guest Lecture: AI in Education',
				content: 'Join us for a guest lecture on AI in Education this Friday at 4pm in the main auditorium.',
				category: 'Events',
				department: 'CS',
				status: 'pending'
			},
			{
				title: 'Placement Drive Registration',
				content: 'Final year students can register for the placement drive by end of this week.',
				category: 'Placement',
				department: 'CS',
				status: 'approved'
			}
		];

		for (const n of demoNotices) {
			const exists = await get('SELECT id FROM notices WHERE title = ?', [n.title]);
			if (exists) {
				console.log(`Notice "${n.title}" already exists, skipping`);
				continue;
			}

			// Set approved flag consistent with status for backwards compatibility
			const approvedFlag = n.status === 'approved' ? 1 : 0;

			await run(
				'INSERT INTO notices (title, content, category, department, author_id, approved, status, comment_enabled, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
				[n.title, n.content, n.category, n.department, authorId, approvedFlag, n.status, 1, now, now]
			);
			console.log(`Created demo notice: ${n.title} (status=${n.status})`);
		}
	} catch (err) {
		console.error('Error seeding demo notices:', err);
		throw err;
	}
}


