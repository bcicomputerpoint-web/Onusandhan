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

log(">>> ONUSANDHAN SERVER BOOT v4.19 <<<");

const app = express();

// --- 1. GLOBAL LOGGING & MIDDELWARE ---
app.use((req, res, next) => {
  log(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// --- 2. PRIORITY DIAGNOSTIC ROUTES ---
app.get(['/api/health', '/api/health/'], (req, res) => {
  res.json({ 
    status: 'ok', 
    version: 'v4.19', 
    time: new Date().toISOString(),
    db_ready: !!globalDb,
    env: process.env.NODE_ENV || 'production'
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
    log("Loading database system...");
    const dbModule = await import('./src/db.ts');
    globalDb = dbModule.getDb(); // Use the exportable getter for safety
    log("Database system ready.");
  } catch (e: any) {
    log(`CRITICAL DATABASE INITIALIZATION ERROR: ${e.message}\n${e.stack}`);
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

// --- 4. CORE API HANDLERS ---

// Auth
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

// Profile
app.get('/api/profile', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  try {
    const profile = globalDb.prepare(`
      SELECT u.email, u.role, p.* FROM profiles p 
      JOIN users u ON p.user_id = u.id WHERE p.user_id = ?
    `).get(req.user.id);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  const { institution, department, research_area, orcid, bio, full_name } = req.body;
  try {
    globalDb.prepare(`
      UPDATE profiles SET 
        full_name = COALESCE(?, full_name), institution = COALESCE(?, institution),
        department = COALESCE(?, department), research_area = COALESCE(?, research_area),
        orcid = COALESCE(?, orcid), bio = COALESCE(?, bio)
      WHERE user_id = ?
    `).run(full_name, institution, department, research_area, orcid, bio, req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Drive
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

app.delete('/api/drive/:id', authenticateToken, (req: any, res: any) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  try {
    const item = globalDb.prepare('SELECT * FROM drive_items WHERE id = ?').get(req.params.id) as any;
    if (!item) return res.status(404).send();
    if (item.user_id !== req.user.id && req.user.role !== 'Admin') return res.sendStatus(403);
    
    if (item.file_path) {
      const fullPath = path.join(uploadDir, path.basename(item.file_path));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    globalDb.prepare('DELETE FROM drive_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LMS Routes
app.get('/api/courses', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  try {
    const courses = globalDb.prepare(`
      SELECT c.*, p.full_name as instructor_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
      FROM courses c 
      JOIN profiles p ON c.instructor_id = p.user_id
      ORDER BY c.created_at DESC
    `).all();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  if (req.user.role !== 'Admin') return res.sendStatus(403);
  try {
    const { title, description } = req.body;
    const info = globalDb.prepare('INSERT INTO courses (title, description, instructor_id) VALUES (?, ?, ?)').run(title, description, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/enrollments', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  try {
    const enrollments = globalDb.prepare(`
      SELECT e.*, c.title as course_title, c.description as course_description 
      FROM enrollments e 
      JOIN courses c ON e.course_id = c.id 
      WHERE e.user_id = ?
    `).all(req.user.id);
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enrollments', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  const { course_id } = req.body;
  try {
    const info = globalDb.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(req.user.id, course_id);
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    // If already enrolled, just return 200
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.json({ message: 'Already enrolled' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/courses/:id', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  try {
    const course = globalDb.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    const lessons = globalDb.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC').all(req.params.id);
    const assignments = globalDb.prepare('SELECT * FROM assignments WHERE course_id = ?').all(req.params.id);
    res.json({ ...course, lessons, assignments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Assistant Route (Gemini Integration)
app.post('/api/ai/chat', authenticateToken, async (req: any, res) => {
  const { message, context } = req.body;
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    // Use the model directly as per @google/genai patterns
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `System: Onusandhan Academic Assistant. Context: ${JSON.stringify(context || {})}` }] },
        { role: 'user', parts: [{ text: message }] }
      ]
    });
    res.json({ reply: result.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI failed to respond." });
  }
});

// Admin
app.get('/api/admin/stats', authenticateToken, (req: any, res) => {
  if (!globalDb) return res.status(503).json({ error: 'System initializing' });
  if (req.user.role !== 'Admin') return res.sendStatus(403);
  try {
    const totalUsers = globalDb.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalDocs = globalDb.prepare("SELECT COUNT(*) as count FROM drive_items WHERE item_type = 'Document'").get() as any;
    const recentUsers = globalDb.prepare('SELECT u.id, u.email, u.role, p.full_name, u.created_at FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.created_at DESC LIMIT 10').all();
    res.json({ totalUsers: totalUsers.count, totalDocs: totalDocs.count, recentUsers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. STATIC FILES & CATCH-ALL ---
app.use('/files', express.static(uploadDir));
const distPath = path.join(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
    res.send(`<h1>Onusandhan v4.18</h1><p>API Server is live, but UI build is missing. Run build.</p>`);
  });
}

// --- 6. START ---
app.listen(PORT, '0.0.0.0', () => {
  log(`Server v4.18 LISTENING on 0.0.0.0:${PORT}`);
  initDb();
});
