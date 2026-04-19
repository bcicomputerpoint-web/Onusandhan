import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './src/db.js'; // Using .js extension for ES modules resolution
import path from 'path';
import multer from 'multer';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'onusandhan_super_secret_key_123';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage & Validation Configuration (Max Size: 10MB)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // statically serve files

  // Seed demo admin if not exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@onusandhan.com');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run('admin@onusandhan.com', hash, 'Admin');
    db.prepare('INSERT INTO profiles (user_id, full_name, department, institution) VALUES (?, ?, ?, ?)').run(info.lastInsertRowid, 'System Admin', 'IT', 'Onusandhan');
    console.log('Seeded demo admin: admin@onusandhan.com / admin123');
  }

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

  // Handle generic file upload
  app.post('/api/upload', (req: any, res: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      res.json({ url: `/uploads/${req.file.filename}` });
    });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
