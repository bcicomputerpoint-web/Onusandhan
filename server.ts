import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Removed top-level db import to prevent startup crashes
import path from 'path';
import multer from 'multer';
import fs from 'fs';

async function getDatabase() {
  const { db } = await import('./src/db.ts');
  return db;
}

const JWT_SECRET = process.env.JWT_SECRET || 'onusandhan_super_secret_key_123';

// Ensure uploads directory exists
const uploadDir = path.join('/tmp', 'uploads-final'); // Use /tmp for everything on serverless
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// In-memory log buffer for remote debugging
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

// Multer Storage & Validation Configuration (Max Size: 10MB)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Chunks always go to /tmp for safety on Cloud Run
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('/tmp/uploads-raw')) {
      fs.mkdirSync('/tmp/uploads-raw', { recursive: true });
    }
    cb(null, '/tmp/uploads-raw');
  },
  filename: (req, file, cb) => {
    cb(null, `chunk-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimetypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // xlsx
    'image/jpeg',
    'image/png'
  ];
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLSX, JPG, and PNG are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: fileFilter
});

// Separate uploader for chunks without strict type checking (since segments might lose type info)
const chunkUpload = multer({ 
  storage: chunkStorage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB per chunk max
});

let db: any = null;

async function startServer() {
  log(">>> SERVER BOOT v4.15 STARTING <<<");
  const app = express();
  const PORT = 3000;

  // 1. REGISTER HEALTH ROUTES FIRST
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      version: 'v4.15', 
      db_loaded: !!db,
      node: process.version,
      env: process.env.NODE_ENV || 'production'
    });
  });

  app.get('/api/logs', (req, res) => {
     res.setHeader('Content-Type', 'text/plain');
     res.send(serverLogs.join('\n'));
  });

  // 2. START LISTENING IMMEDIATELY
  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    log(`[${new Date().toISOString()}] Server listening on port ${PORT} (Early Listen)`);
  });

  // 3. LAZY LOAD DATABASE AND OTHER ROUTES
  try {
    log("Loading database module...");
    const dbMod = await import('./src/db.ts');
    db = dbMod.db;
    log("Database module loaded successfully.");
  } catch (e: any) {
    log(`CRITICAL DATABASE LOAD FAILURE: ${e.message}`);
    // We continue so health check stays alive
  }

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Debug Headers for domain troubleshooting

  app.use('/files', express.static(uploadDir));

  // Diagnostic route
  app.get('/api/ping', (req, res) => {
    console.log('Ping check from:', req.headers.origin);
    res.json({ status: 'live', host: req.headers.host });
  });

  // API Routes Start Here

  // --- API ROUTES ---

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

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }
      
      const validPassword = bcrypt.compareSync(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, role: user.role });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { email, password, role, fullName } = req.body;
    try {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const hash = bcrypt.hashSync(password, 10);
      const insertUser = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)');
      const info = insertUser.run(email, hash, role || 'Scholar');
      
      db.prepare('INSERT INTO profiles (user_id, full_name) VALUES (?, ?)').run(info.lastInsertRowid, fullName);

      const token = jwt.sign({ id: info.lastInsertRowid, role: role || 'Scholar', email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, role: role || 'Scholar' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Auth: Google OAuth URL
  app.get('/api/auth/google/url', (req, res) => {
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const redirectUri = `${APP_URL}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // Auth: Google OAuth Callback
  app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    if (!db) return res.status(503).send("System initializing...");
    const { code } = req.query;
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const redirectUri = `${APP_URL}/auth/google/callback`;
    
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      if (!tokenRes.ok) throw new Error('Failed to exchange token');
      const tokenData = await tokenRes.json();
      
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json();
      
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userData.email) as any;
      let userId;
      let role = 'Scholar';

      if (!user) {
        const hash = bcrypt.hashSync(Math.random().toString(36), 10);
        const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(userData.email, hash, role);
        userId = info.lastInsertRowid;
        db.prepare('INSERT INTO profiles (user_id, full_name) VALUES (?, ?)').run(userId, userData.name || 'Google User');
      } else {
        userId = user.id;
        role = user.role;
      }

      const token = jwt.sign({ id: userId, role, email: userData.email }, JWT_SECRET, { expiresIn: '24h' });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}', role: '${role}' }, '*');
                window.close();
              } else {
                window.location.href = '/login?error=Popup_Required';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth error:', error);
      res.send('<p>Authentication failed. Please close this window and try again.</p>');
    }
  });

  // CHUNKED UPLOAD SYSTEM (v4) - FormData based for maximum proxy compatibility
  app.post('/api/upload/chunk/form', (req, res, next) => {
    chunkUpload.single('chunk')(req, res, (err) => {
      if (err) {
        console.error('[Upload] Multer Error:', err);
        return res.status(500).json({ error: `Upload preparation failed: ${err.message}` });
      }
      next();
    });
  }, async (req: any, res: any) => {
    const { chunkIndex, totalChunks, uploadId } = req.body;
    const chunkFile = req.file;

    if (!uploadId || !chunkFile) {
      console.error(`[Upload] Chunks: Missing metadata. id=${uploadId}, fileFound=${!!chunkFile}`);
      return res.status(400).json({ error: 'Missing metadata or chunk data' });
    }
    
    log(`[Upload] Received chunk ${parseInt(chunkIndex) + 1}/${totalChunks} for id: ${uploadId}`);
    
    // Use /tmp for chunks to avoid any disk issues on Cloud Run
    const tempDir = path.join('/tmp', 'uploads-chunks', uploadId);

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
      fs.copyFileSync(chunkFile.path, chunkPath);
      fs.unlinkSync(chunkFile.path);

      const files = fs.readdirSync(tempDir).filter(f => f.startsWith('chunk-'));
      log(`[Upload] Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} saved for ${uploadId}. Total in temp: ${files.length}`);
      
      res.json({ success: true, received: chunkIndex });
    } catch (error: any) {
      log(`[Upload] Chunk saving error: ${error.message}`);
      res.status(500).json({ error: 'Server failed to save chunk' });
    }
  });

  // Dedicated endpoint to assemble chunks - more robust than triggering on last chunk
  app.post('/api/upload/assemble', async (req: any, res: any) => {
    const { uploadId, totalChunks, filename } = req.body;
    log(`[Upload] Assembly requested for ${filename} (${uploadId})`);
    
    if (!uploadId || !totalChunks || !filename) {
      log(`[Upload] Assembly rejected: Missing metadata`);
      return res.status(400).json({ error: 'Missing assembly metadata' });
    }

    const tempDir = path.join('/tmp', 'uploads-chunks', uploadId);
    const total = parseInt(totalChunks);

    if (!fs.existsSync(tempDir)) {
      log(`[Upload] Assembly rejected: tempDir ${tempDir} not found`);
      return res.status(404).json({ error: 'Upload segments not found. Please try again.' });
    }

    const lockFile = path.join(tempDir, 'reassembly.lock');
    if (fs.existsSync(lockFile)) {
      log(`[Upload] Assembly busy for ${uploadId}`);
      return res.status(423).json({ error: 'Assembly in progress' });
    }

    try {
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith('chunk-'));
      if (files.length < total) {
        log(`[Upload] Assembly rejected: Incomplete pieces (${files.length}/${total})`);
        return res.status(400).json({ error: `Incomplete upload. Received ${files.length} of ${total} pieces.` });
      }

      fs.writeFileSync(lockFile, 'locked');
      log(`[Upload] Starting explicit assembly for ${filename} (${total} chunks)...`);
      
      const finalFilename = `final-${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const finalPath = path.join(uploadDir, finalFilename);
      
      const writeStream = fs.createWriteStream(finalPath);

      try {
        for (let i = 0; i < total; i++) {
          const p = path.join(tempDir, `chunk-${i}`);
          if (fs.existsSync(p)) {
            writeStream.write(fs.readFileSync(p));
          } else {
            throw new Error(`Critical piece ${i} missing`);
          }
        }
        
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
          writeStream.end();
        });

        const stats = fs.statSync(finalPath);
        log(`[Upload] Assembly successful: ${finalFilename} (${stats.size} bytes)`);

        // Final cleanup
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
        
        return res.json({ url: `/files/${finalFilename}` });
      } catch (assembleError: any) {
        log(`[Upload] Assembly processing failure: ${assembleError.message}`);
        if (writeStream) writeStream.end();
        if (fs.existsSync(finalPath)) try { fs.unlinkSync(finalPath); } catch(e) {}
        if (fs.existsSync(lockFile)) try { fs.unlinkSync(lockFile); } catch(e) {}
        return res.status(500).json({ error: `Assembly failed: ${assembleError.message}` });
      }
    } catch (error: any) {
      log(`[Upload] Assembly fatal error: ${error.message}`);
      res.status(500).json({ error: 'Internal assembly failure' });
    }
  });

  // CHUNKED UPLOAD SYSTEM (v3) - The ultimate solution for restrictive firewalls
  app.post('/api/upload/chunk', async (req: any, res: any) => {
    const { chunkIndex, totalChunks, filename, uploadId, data } = req.body;
    
    if (!uploadId || !data) {
      return res.status(400).json({ error: 'Missing uploadId or data' });
    }

    const tempDir = path.join('/tmp', 'uploads-chunks-base64', uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(chunkPath, buffer);

    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const finalFilename = `b64chunked-${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const finalPath = path.join(uploadDir, finalFilename);
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const p = path.join(tempDir, `chunk-${i}`);
        if (fs.existsSync(p)) {
          const b = fs.readFileSync(p);
          writeStream.write(b);
          fs.unlinkSync(p);
        }
      }
      
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => {
          console.error('[Upload] Base64 WriteStream error:', err);
          reject(err);
        });
        writeStream.end();
      });
      
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
      return res.json({ url: `/files/${finalFilename}` });
    }

    res.json({ success: true });
  });

  // RAW BINARY UPLOAD (v2) - Most robust method for firewalls/proxies
  app.post('/api/upload/raw', async (req: any, res: any) => {
    console.log('--- Raw binary upload incoming ---');
    try {
      const filename = req.headers['x-filename'] || `file-${Date.now()}.bin`;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(filename);
      const finalFilename = 'raw-' + uniqueSuffix + ext;
      const fullPath = path.join(uploadDir, finalFilename);

      const writeStream = fs.createWriteStream(fullPath);
      
      req.pipe(writeStream);

      req.on('error', (e: any) => {
        console.error('Inbound stream error:', e);
        res.status(500).json({ error: 'Stream error' });
      });

      writeStream.on('finish', () => {
        console.log('Raw upload complete:', finalFilename);
        res.json({ url: `/files/${finalFilename}` });
      });

      writeStream.on('error', (e) => {
        console.error('Write stream error:', e);
        res.status(500).json({ error: 'File system error' });
      });
    } catch (error) {
      console.error('Raw upload handler error:', error);
      res.status(500).json({ error: 'Internal handler failure' });
    }
  });

  // Improved upload endpoint with logging
  app.post('/api/process/doc', (req: any, res: any) => {
    console.log('--- Incoming File Upload ---');
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('Upload Error (Multer):', err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        console.warn('Upload Warning: No file received');
        return res.status(400).json({ error: 'No file provided' });
      }
      console.log('Upload Success:', req.file.filename);
      res.json({ url: `/files/${req.file.filename}` });
    });
  });

  // Handle base64 fallback file upload
  app.post('/api/upload/base64', (req: any, res: any) => {
    try {
      const { filename, base64Data } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'Missing filename or base64Data' });
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 10 * 1024 * 1024) {
         return res.status(400).json({ error: 'File size exceeds 10MB limit.' });
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(filename);
      const finalFilename = 'file-' + uniqueSuffix + ext;
      const fullPath = path.join(uploadDir, finalFilename);
      
      fs.writeFileSync(fullPath, buffer);
      
      res.json({ url: `/uploads/${finalFilename}` });
    } catch (e: any) {
      console.error('Base64 upload error:', e);
      res.status(500).json({ error: 'Failed to process base64 upload' });
    }
  });

  // Handle physical file deletion
  app.delete('/api/delete-file', (req: any, res: any) => {
    try {
      const dbUrl = new URL(req.url, `http://${req.headers.host}`);
      const filePath = dbUrl.searchParams.get('file_path');
      if (filePath && filePath.startsWith('/uploads/')) {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Profile: Get current
  app.get('/api/profile', authenticateToken, (req: any, res) => {
    if (!db) return res.status(503).json({ error: "System initializing" });
    try {
      const profile = db.prepare(`
        SELECT u.email, u.role, p.* 
        FROM profiles p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = ?
      `).get(req.user.id);
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Profile: Update
  app.put('/api/profile', authenticateToken, (req: any, res) => {
    const { institution, department, research_area, orcid, bio, full_name } = req.body;
    try {
      db.prepare(`
        UPDATE profiles SET 
          full_name = COALESCE(?, full_name),
          institution = COALESCE(?, institution),
          department = COALESCE(?, department),
          research_area = COALESCE(?, research_area),
          orcid = COALESCE(?, orcid),
          bio = COALESCE(?, bio)
        WHERE user_id = ?
      `).run(full_name, institution, department, research_area, orcid, bio, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Drive: Get user items
  app.get('/api/drive', authenticateToken, (req: any, res) => {
    try {
      const items = db.prepare('SELECT * FROM drive_items WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Drive: Add item with File Upload Support
  app.post('/api/drive', authenticateToken, (req: any, res: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
         return res.status(400).json({ error: err.message });
      }
      
      const { title, item_type, category, authors, abstract, publish_year, external_url, visibility, user_id } = req.body;
      const file_path = req.file ? `/uploads/${req.file.filename}` : null;
      
      if (item_type === 'Document' && !file_path) {
         return res.status(400).json({ error: 'File is required for Document uploads' });
      }
      
      const targetUserId = (req.user.role === 'Admin' && user_id) ? user_id : req.user.id;
      
      try {
        const info = db.prepare(`
          INSERT INTO drive_items 
          (user_id, title, item_type, category, authors, abstract, publish_year, file_path, external_url, visibility) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(targetUserId, title, item_type, category, authors, abstract, publish_year || null, file_path, external_url || null, visibility || 'Private');
        
        const newItem = db.prepare('SELECT * FROM drive_items WHERE id = ?').get(info.lastInsertRowid);
        res.json(newItem);
      } catch (error) {
        console.error('Database error during upload:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });
  });

  // Drive: Delete item
  app.delete('/api/drive/:id', authenticateToken, (req: any, res: any) => {
    try {
      const itemId = req.params.id;
      const item = db.prepare('SELECT * FROM drive_items WHERE id = ?').get(itemId) as any;
      if (!item) return res.status(404).json({ error: 'Item not found' });
      
      if (item.user_id !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this item' });
      }
      
      if (item.file_path) {
         try {
           const fullPath = path.join(process.cwd(), item.file_path);
           if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
         } catch (fsError) {
           console.error(`Failed to delete physical file: ${item.file_path}`, fsError);
         }
      }
      
      db.prepare('DELETE FROM drive_items WHERE id = ?').run(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin: Get all stats and users
  app.get('/api/admin/stats', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.sendStatus(403);
    try {
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const totalDocs = db.prepare("SELECT COUNT(*) as count FROM drive_items WHERE item_type = 'Document'").get() as any;
      const totalLinks = db.prepare("SELECT COUNT(*) as count FROM drive_items WHERE item_type = 'Link'").get() as any;
      const recentUsers = db.prepare('SELECT u.id, u.email, u.role, p.full_name, u.created_at FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.created_at DESC LIMIT 10').all();
      const recentItems = db.prepare('SELECT * FROM drive_items ORDER BY created_at DESC LIMIT 50').all();
      
      res.json({
        totalUsers: totalUsers.count,
        totalDocs: totalDocs.count,
        totalLinks: totalLinks.count,
        recentUsers,
        recentItems
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Catch-all for API routes to prevent Vite from returning index.html
  app.all('/api/*', (req, res) => {
    console.error(`404 API Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // --- VITE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer();
