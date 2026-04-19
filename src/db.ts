import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure db directory exists
import fs from 'fs';
const dbDir = path.join(process.cwd(), 'data');
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
    role TEXT NOT NULL DEFAULT 'Scholar', -- 'Scholar', 'Author', 'Admin'
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
    item_type TEXT NOT NULL, -- 'Document', 'Link'
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

// Create an admin user if it doesn't exist
import bcrypt from 'bcryptjs';
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

// Create a demo scholar
const scholarEmail = 'scholar@example.com';
const scholarExists = db.prepare('SELECT id FROM users WHERE email = ?').get(scholarEmail);
if (!scholarExists) {
  const hash = bcrypt.hashSync('scholar123', 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(scholarEmail, hash, 'Scholar');
  db.prepare('INSERT INTO profiles (user_id, full_name, institution, department, research_area, bio) VALUES (?, ?, ?, ?, ?, ?)').run(
    info.lastInsertRowid,
    'Jane Doe',
    'University of Example',
    'Computer Science',
    'Artificial Intelligence & Cloud Computing',
    'Ph.D. Scholar working on AI applications.'
  );
  // Add some dummy docs
  db.prepare('INSERT INTO drive_items (user_id, title, item_type, category, authors, abstract, publish_year, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    info.lastInsertRowid,
    'AI in Modern Cloud Architectures',
    'Document',
    'Publication',
    'Jane Doe, John Smith',
    'This paper discusses advanced AI integration... (dummy abstract)',
    2025,
    '/uploads/ai_modern_cloud.pdf'
  );
  db.prepare('INSERT INTO drive_items (user_id, title, item_type, category, external_url) VALUES (?, ?, ?, ?, ?)').run(
    info.lastInsertRowid,
    'TensorFlow Datasets for ML',
    'Link',
    'Others',
    'https://www.tensorflow.org/datasets'
  );
}
