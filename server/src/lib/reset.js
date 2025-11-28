import { run } from './db.js';
import { seedDemo } from './seed.js';

export async function resetDatabase() {
    try {
        // Drop existing tables
        await run('DROP TABLE IF EXISTS reactions');
        await run('DROP TABLE IF EXISTS comments');
        await run('DROP TABLE IF EXISTS attachments');
        await run('DROP TABLE IF EXISTS notices');
        await run('DROP TABLE IF EXISTS users');

        // Create tables
        await run(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                department TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await run(`
            CREATE TABLE notices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                department TEXT NOT NULL,
                author_id INTEGER NOT NULL,
                approved INTEGER DEFAULT 0,
                comment_enabled INTEGER DEFAULT 1,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (author_id) REFERENCES users (id)
            )
        `);

        await run(`
            CREATE TABLE attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notice_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT,
                file_size INTEGER,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (notice_id) REFERENCES notices (id) ON DELETE CASCADE
            )
        `);

        await run(`
            CREATE TABLE comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notice_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (notice_id) REFERENCES notices (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        await run(`
            CREATE TABLE reactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notice_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                reaction_type TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (notice_id) REFERENCES notices (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(notice_id, user_id)
            )
        `);

        // Seed demo data
        await seedDemo();
        console.log('Database reset and seeded successfully');
    } catch (err) {
        console.error('Error resetting database:', err);
        throw err;
    }
}