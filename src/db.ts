import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbDir = path.join('/tmp', 'onusandhan-data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(path.join(dbDir, 'onusandhan.db'));
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Scholar',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    institution TEXT,
    department TEXT,
    research_area TEXT,
    orcid TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS drive_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    item_type TEXT NOT NULL,
    category TEXT NOT NULL,
    authors TEXT,
    abstract TEXT,
    publish_year INTEGER,
    file_path TEXT,
    external_url TEXT,
    visibility TEXT DEFAULT 'Private',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Insert default categories
const categorizeStmt = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
['Thesis', 'Synopsis', 'Publication', 'Conference Paper', 'Book Chapter', 'Research Proposal', 'Seminar Paper', 'Others'].forEach(cat => {
  categorizeStmt.run(cat);
});

// Seed Admin
const adminEmail = 'admin@onusandhan.com';
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(adminEmail, hash, 'Admin');
  db.prepare('INSERT INTO profiles (user_id, full_name, institution, department, research_area) VALUES (?, ?, ?, ?, ?)').run(
    info.lastInsertRowid,
    'System Admin',
    'Onusandhan Platform',
    'Administration',
    'Platform Management'
  );
}
