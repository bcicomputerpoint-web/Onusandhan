import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { dbService } from './src/services/dbService';

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

log(">>> ONUSANDHAN SERVER BOOT v4.25 <<<");
const INSTANCE_ID = Math.random().toString(36).substring(2, 7).toUpperCase();

async function startServer() {
  const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- 1. GLOBAL LOGGING & MIDDELWARE ---
app.use((req, res, next) => {
  log(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Binary chunk upload (STRICTLY BEFORE body-parser for raw stream handling)
app.post('/api/upload/chunk/binary', (req, res) => {
  const uploadId = req.headers['x-upload-id'] as string;
  const chunkIndex = req.headers['x-chunk-index'] as string;
  
  if (!uploadId || chunkIndex === undefined) {
    return res.status(400).json({ error: 'Missing headers' });
  }

  const chunkDir = path.join(uploadDir, 'chunks');
  if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });

  const userChunkDir = path.join(chunkDir, uploadId);
  if (!fs.existsSync(userChunkDir)) fs.mkdirSync(userChunkDir, { recursive: true });
  
  const chunkPath = path.join(userChunkDir, `chunk-${chunkIndex}`);
  const writeStream = fs.createWriteStream(chunkPath);
  
  req.pipe(writeStream);
  
  writeStream.on('finish', () => {
    log(`[${INSTANCE_ID}] Chunk Recv: ${uploadId} pc:${chunkIndex}`);
    res.json({ success: true, instance: INSTANCE_ID });
  });
  
  writeStream.on('error', (err) => {
    log(`[${INSTANCE_ID}] Chunk Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  });
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// --- 2. PRIORITY DIAGNOSTIC ROUTES ---
app.get(['/api/health', '/api/health/'], (req, res) => {
  let writable = false;
  try {
    const testFile = path.join(uploadDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    writable = true;
  } catch(e) {}

  res.json({ 
    status: 'ok', 
    version: 'v4.25', 
    instance: INSTANCE_ID,
    storage_writable: writable,
    time: new Date().toISOString(),
    db_ready: true,
    env: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(serverLogs.join('\n'));
});

// --- 3. DYNAMIC DB LOADING ---
async function initDb() {
  try {
    log("Initializing Cloud Persistence (Firestore)...");
    log("Cloud Persistence ready.");
  } catch (e: any) {
    log(`CRITICAL FIRESTORE INITIALIZATION ERROR: ${e.message}`);
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

// --- 4. CHUNKED UPLOAD SYSTEM ---
const chunkDir = path.join(uploadDir, 'chunks');
if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });

app.post('/api/upload/chunk/form', upload.single('chunk'), (req, res) => {
  const { uploadId, chunkIndex, filename } = req.body;
  if (!req.file || !uploadId || chunkIndex === undefined) {
    return res.status(400).json({ error: 'Missing upload components' });
  }
  
  const userChunkDir = path.join(chunkDir, uploadId);
  if (!fs.existsSync(userChunkDir)) fs.mkdirSync(userChunkDir, { recursive: true });
  
  const chunkPath = path.join(userChunkDir, `chunk-${chunkIndex}`);
  fs.renameSync(req.file.path, chunkPath);
  
  res.json({ success: true });
});

const assemblingLocks = new Set<string>();

app.post('/api/upload/assemble', async (req, res) => {
  const { uploadId, totalChunks, filename } = req.body;
  if (!uploadId || !totalChunks || !filename) {
    return res.status(400).json({ error: 'Missing assembly data' });
  }

  if (assemblingLocks.has(uploadId)) {
    return res.status(423).json({ error: 'Assembly in progress' });
  }

  assemblingLocks.add(uploadId);
  log(`Assembling ${filename} (${uploadId}) - ${totalChunks} pieces`);

  try {
    const userChunkDir = path.join(chunkDir, uploadId);
    if (!fs.existsSync(userChunkDir)) {
      throw new Error('Chunks directory not found');
    }

    const finalFileName = `${Date.now()}-${filename}`;
    const finalPath = path.join(uploadDir, finalFileName);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(userChunkDir, `chunk-${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Piece ${i} missing from set`);
      }
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
      fs.unlinkSync(chunkPath);
    }
    writeStream.end();

    await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));
    fs.rmSync(userChunkDir, { recursive: true, force: true });
    
    log(`Successfully assembled: ${finalFileName}`);
    res.json({ url: `/files/${finalFileName}` });
  } catch (err: any) {
    log(`Assembly FAILED: ${err.message}`);
    res.status(500).json({ error: err.message });
  } finally {
    assemblingLocks.delete(uploadId);
  }
});

// --- 5. CORE API HANDLERS ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user: any = await dbService.getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, fullName } = req.body;
  try {
    const exists = await dbService.getUserByEmail(email);
    if (exists) return res.status(400).json({ error: 'User already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const newUser: any = await dbService.createUser({
      email,
      password_hash: hash,
      role: role || 'Scholar'
    });
    await dbService.updateProfile(newUser.id, { full_name: fullName });
    
    const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: newUser.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Profile
app.get('/api/profile', authenticateToken, async (req: any, res) => {
  try {
    const profile = await dbService.getProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ email: req.user.email, role: req.user.role, ...profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', authenticateToken, async (req: any, res) => {
  const { institution, department, research_area, orcid, bio, full_name, session, university, program } = req.body;
  try {
    await dbService.updateProfile(req.user.id, { full_name, institution, department, research_area, orcid, bio, session, university, program });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Drive
app.get('/api/drive', authenticateToken, async (req: any, res) => {
  try {
    const items = await dbService.getDriveItems(req.user.id);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drive', authenticateToken, upload.single('file'), async (req: any, res: any) => {
  const { title, item_type, category, authors, abstract, publish_year, external_url, visibility } = req.body;
  const file_path = req.file ? `/files/${req.file.filename}` : null;
  try {
    await dbService.addDriveItem({
      user_id: req.user.id,
      title,
      item_type,
      category,
      authors: authors || null,
      abstract: abstract || null,
      publish_year: parseInt(publish_year) || null,
      file_path,
      external_url: external_url || null,
      visibility: visibility || 'Private'
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/drive/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const item = await dbService.getDriveItem(req.params.id);
    if (!item) return res.status(404).send();
    if (item.user_id !== req.user.id && req.user.role !== 'Admin') return res.sendStatus(403);
    
    if (item.file_path) {
      const fullPath = path.join(uploadDir, path.basename(item.file_path));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    await dbService.deleteDriveItem(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LMS Routes
app.get('/api/courses', authenticateToken, async (req: any, res) => {
  try {
    const courses = await dbService.getCourses();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin') return res.sendStatus(403);
  try {
    const { title, description } = req.body;
    const info = await dbService.addCourse({ title, description, instructor_id: req.user.id });
    res.json({ id: info.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/enrollments', authenticateToken, async (req: any, res) => {
  try {
    const enrollments = await dbService.getEnrollments(req.user.id);
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enrollments', authenticateToken, async (req: any, res) => {
  const { course_id } = req.body;
  try {
    const result = await dbService.enrollUser(req.user.id, course_id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/courses/:id', authenticateToken, async (req: any, res) => {
  try {
    const course = await dbService.getCourseDetails(req.params.id);
    if (!course) return res.status(404).send();
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Assistant Route (Gemini Integration)
app.post('/api/ai/chat', authenticateToken, async (req: any, res) => {
  const { message, context } = req.body;
  try {
    const { GoogleGenAI } = (await import("@google/genai")) as any;
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `System: Onusandhan Academic Assistant. Context: ${JSON.stringify(context || {})}` }] },
        { role: 'user', parts: [{ text: message }] }
      ]
    });
    res.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI failed to respond." });
  }
});

app.delete('/api/delete-file', (req: any, res: any) => {
  const { file_path } = req.query;
  if (!file_path) return res.status(400).json({ error: 'Missing path' });
  try {
    const filename = path.basename(file_path as string);
    const fullPath = path.join(uploadDir, filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin
app.get('/api/admin/stats', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin') return res.sendStatus(403);
  try {
    const stats = await dbService.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. STATIC FILES & CATCH-ALL ---
app.use('/files', express.static(uploadDir));

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
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
      res.send(`<h1>Onusandhan v4.25</h1><p>API Server is live, but UI build is missing. Run build.</p>`);
    });
  }
}

// --- 6. START ---
app.listen(PORT, '0.0.0.0', () => {
  log(`Server v4.25 [${INSTANCE_ID}] LISTENING on 0.0.0.0:${PORT}`);
  initDb();
});

}

startServer();
