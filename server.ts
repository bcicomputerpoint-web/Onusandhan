import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'onusandhan_super_secret_key_123';
const PORT = 3000;
const uploadDir = path.join('/tmp', 'uploads-final');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const serverLogs: string[] = [];
function log(msg: string) {
  const themedMsg = `[${new Date().toISOString()}] ${msg}`;
  console.log(themedMsg);
  serverLogs.push(themedMsg);
  if (serverLogs.length > 500) serverLogs.shift();
}

// Global Exception Tracking
process.on('uncaughtException', (err) => {
  log(`CRITICAL: Uncaught Exception: ${err.message}\n${err.stack}`);
});

process.on('unhandledRejection', (reason: any) => {
  log(`CRITICAL: Unhandled Rejection: ${reason?.message || reason}`);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// --- PRIORITY API ROUTES ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: 'v4.16', 
    time: new Date().toISOString(),
    db_status: db ? 'ready' : 'initializing',
    env: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(serverLogs.join('\n'));
});

// --- DYNAMIC DB LOADING ---
let db: any = null;
async function initDb() {
  try {
    log("Initializing Database Module...");
    const dbModule = await import('./src/db.ts');
    db = dbModule.db;
    log("Database Module Loaded.");
  } catch (e: any) {
    log(`DATABASE ERROR: ${e.message}\n${e.stack}`);
  }
}

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database initializing' });
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database initializing' });
  const { email, password, role, fullName } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hash, role || 'Scholar');
    db.prepare('INSERT INTO profiles (user_id, full_name) VALUES (?, ?)').run(info.lastInsertRowid, fullName);
    const token = jwt.sign({ id: info.lastInsertRowid, role: role || 'Scholar', email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: role || 'Scholar' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- DRIVE ROUTES ---
app.get('/api/drive', authenticateToken, (req: any, res) => {
  if (!db) return res.status(503).json({ error: 'Database initializing' });
  try {
    const items = db.prepare('SELECT * FROM drive_items WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- UPLOAD LOGIC ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/drive', authenticateToken, upload.single('file'), (req: any, res: any) => {
  if (!db) return res.status(503).json({ error: 'Database initializing' });
  const { title, item_type, category, authors, abstract, publish_year, external_url, visibility } = req.body;
  const file_path = req.file ? `/files/${req.file.filename}` : null;
  try {
    const info = db.prepare(`
      INSERT INTO drive_items (user_id, title, item_type, category, authors, abstract, publish_year, file_path, external_url, visibility) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title, item_type, category, authors, abstract, publish_year || null, file_path, external_url || null, visibility || 'Private');
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- STATIC FILES ---
app.use('/files', express.static(uploadDir));
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  log(`Server listening on 0.0.0.0:${PORT} (v4.16)`);
  initDb();
});
