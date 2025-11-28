import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/noticeboard.sqlite');
const uploadsPath = path.resolve(__dirname, '../../data/uploads');

// Delete the database file
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Database file deleted');
}

// Clear uploads directory
if (fs.existsSync(uploadsPath)) {
    fs.rmSync(uploadsPath, { recursive: true, force: true });
    console.log('Uploads directory cleared');
}

console.log('System cleared successfully');