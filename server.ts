import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

log(">>> SERVER STARTING v4.17 <<<");

const app = express();

// --- 0. ROOT DIAGNOSTIC ---
app.get('/', (req, res) => {
  res.send(`<h1>Onusandhan v4.17 LIVE</h1><p>Time: ${new Date().toISOString()}</p><p>Host: ${req.headers.host}</p><p>Path: ${req.url}</p>`);
});

// --- 1. GLOBAL LOGGING ---
app.use((req, res, next) => {
  log(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// --- 2. PRIORITY DIAGNOSTIC ROUTES ---
app.get(['/api/health', '/api/health/'], (req, res) => {
  log("Health check triggered");
  res.json({ 
    status: 'ok', 
    version: 'v4.17', 
    time: new Date().toISOString(),
    db_loaded: !!globalDb,
    env: process.env.NODE_ENV || 'production',
    headers: req.headers
  });
});

app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(serverLogs.join('\n'));
});

// --- 3. DYNAMIC DB LOADING ---
let globalDb: any = null;
async function initDb() {
  try {
    log("Background DB initialization starting...");
    const dbModule = await import('./src/db.ts');
    globalDb = dbModule.db;
    log("Background DB initialization complete.");
  } catch (e: any) {
    log(`DATABASE LOAD ERROR: ${e.message}\n${e.stack}`);
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

// --- 4. CORE API ROUTES ---

app.post('/api/auth/login', (req, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  const { email, password } = req.body;
  try {
    const user = globalDb.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
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
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  const { email, password, role, fullName } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = globalDb.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hash, role || 'Scholar');
    globalDb.prepare('INSERT INTO profiles (user_id, full_name) VALUES (?, ?)').run(info.lastInsertRowid, fullName);
    const token = jwt.sign({ id: info.lastInsertRowid, role: role || 'Scholar', email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: role || 'Scholar' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drive', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  try {
    const items = globalDb.prepare('SELECT * FROM drive_items WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/drive', authenticateToken, upload.single('file'), (req: any, res: any) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  const { title, item_type, category, authors, abstract, publish_year, external_url, visibility } = req.body;
  const file_path = req.file ? `/files/${req.file.filename}` : null;
  try {
    globalDb.prepare(`
      INSERT INTO drive_items (user_id, title, item_type, category, authors, abstract, publish_year, file_path, external_url, visibility) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title, item_type, category, authors, abstract, publish_year || null, file_path, external_url || null, visibility || 'Private');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. STATIC FILES & CATCH-ALL ---
app.use('/files', express.static(uploadDir));
const distPath = path.join(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  log(`Serving static files from ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    // PROTECT API ROUTES FROM BEING CAUGHT BY VITE/SPA
    if (req.url.startsWith('/api/')) {
        log(`404 Fallback for API: ${req.url}`);
        return res.status(404).json({ error: `API route not found: ${req.url}` });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  log("WARNING: dist folder missing. Frontend will not work.");
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
    res.send(`<h1>Onusandhan v4.17</h1><p>API Server is live, but UI build is missing. Check deployment logs.</p>`);
  });
}

// --- 6. START ---
app.listen(PORT, '0.0.0.0', () => {
  log(`Server v4.17 LISTENING on 0.0.0.0:${PORT}`);
  initDb();
});
