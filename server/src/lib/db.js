import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/noticeboard.sqlite');

let dbInstance = null;

export function getDb() {
	if (!dbInstance) {
		throw new Error('Database not initialized. Call initDb() first.');
	}
	return dbInstance;
}

export async function initDb() {
	if (dbInstance) return dbInstance;
	// Ensure data directory exists
	const dir = path.dirname(dbPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	await new Promise((resolve) => {
		sqlite3.verbose();
		dbInstance = new sqlite3.Database(dbPath, resolve);
	});
	await run(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL CHECK (role IN ('admin','teacher','student')),
			department TEXT
		);
	`);
	await run(`
		CREATE TABLE IF NOT EXISTS notices (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			category TEXT NOT NULL,
			department TEXT NOT NULL,
			author_id INTEGER NOT NULL,
			approved INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'pending',
			comment_enabled INTEGER NOT NULL DEFAULT 1,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (author_id) REFERENCES users(id)
		);
	`);
	// Add comment_enabled column if it doesn't exist
	await run(`ALTER TABLE notices ADD COLUMN comment_enabled INTEGER NOT NULL DEFAULT 1`).catch(() => {});
	// Add status column if it doesn't exist
	await run(`ALTER TABLE notices ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`).catch(() => {});
	await run(`
		CREATE TABLE IF NOT EXISTS attachments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			notice_id INTEGER NOT NULL,
			filename TEXT NOT NULL,
			original_filename TEXT NOT NULL,
			file_path TEXT NOT NULL,
			file_type TEXT NOT NULL,
			file_size INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
		);
	`);
	await run(`
		CREATE TABLE IF NOT EXISTS reactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			notice_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			reaction_type TEXT NOT NULL DEFAULT 'like',
			created_at TEXT NOT NULL,
			UNIQUE(notice_id, user_id),
			FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`);
	await run(`
		CREATE TABLE IF NOT EXISTS feedback (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			notice_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			message TEXT NOT NULL,
			reply_to INTEGER,
			created_at TEXT NOT NULL,
			FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (reply_to) REFERENCES feedback(id) ON DELETE CASCADE
		);
	`);
	await run(`
		CREATE TABLE IF NOT EXISTS password_reset_tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token TEXT NOT NULL UNIQUE,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL,
			used INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`);
	return dbInstance;
}

export function run(sql, params = []) {
	const db = getDb();
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) return reject(err);
			resolve({ lastID: this.lastID, changes: this.changes });
		});
	});
}

export function all(sql, params = []) {
	const db = getDb();
	return new Promise((resolve, reject) => {
		db.all(sql, params, function (err, rows) {
			if (err) return reject(err);
			resolve(rows);
		});
	});
}

export function get(sql, params = []) {
	const db = getDb();
	return new Promise((resolve, reject) => {
		db.get(sql, params, function (err, row) {
			if (err) return reject(err);
			resolve(row);
		});
	});
}


