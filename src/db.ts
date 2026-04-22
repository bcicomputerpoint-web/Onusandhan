import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let _db: any = null;

export function getDb() {
  if (_db) return _db;

  try {
    const dbDir = path.join('/tmp', 'onusandhan-data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'onusandhan.db');
    console.log(`[DB] Initializing database at ${dbPath}`);
    
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');

    // Initialize schema
    _db.exec(`
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
    const categorizeStmt = _db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    ['Thesis', 'Synopsis', 'Publication', 'Conference Paper', 'Book Chapter', 'Research Proposal', 'Seminar Paper', 'Others'].forEach(cat => {
      categorizeStmt.run(cat);
    });

    // Seed Admin
    const adminEmail = 'admin@onusandhan.com';
    const adminExists = _db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!adminExists) {
      const hash = bcrypt.hashSync('admin123', 10);
      const info = _db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(adminEmail, hash, 'Admin');
      _db.prepare('INSERT INTO profiles (user_id, full_name, institution, department, research_area) VALUES (?, ?, ?, ?, ?)').run(
        info.lastInsertRowid,
        'System Admin',
        'Onusandhan Platform',
        'Administration',
        'Platform Management'
      );
    }

    return _db;
  } catch (error) {
    console.error('[DB] Critical Failure during initialization:', error);
    throw error;
  }
}

// Export for backward compatibility but server should ideally use getDb()
export const db = new Proxy({}, {
  get(target, prop) {
    return getDb()[prop];
  }
}) as any;
