const multer = require('multer');
const express = require('express');
const app = express();
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const upload = multer({ limits: { fileSize: 10 } });

app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.log('Multer Error Caught:', err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

app.use((req, res, next) => {
  console.log('Fell through to next middleware. Method:', req.method);
  res.send('FALLTHROUGH_HTML');
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log('Listening on', port);
  
  const form = new FormData();
  form.append('file', Buffer.alloc(100), { filename: 'test.pdf' });
  
  try {
    const res = await fetch(`http://localhost:${port}/api/upload`, {
      method: 'POST',
      body: form
    });
    console.log('Response status:', res.status);
    console.log('Response text:', await res.text());
  } catch (e) {
    console.error(e);
  }
  
  // also test an empty file
  const form2 = new FormData();
  try {
    const res2 = await fetch(`http://localhost:${port}/api/upload`, {
      method: 'POST',
      body: form2
    });
    console.log('Response status 2:', res2.status);
    console.log('Response text 2:', await res2.text());
  } catch (e) {
    console.error(e);
  }

  // test an invalid field name
  const form3 = new FormData();
  form3.append('WRONG_FIELD', Buffer.alloc(100), { filename: 'test.pdf' });
  try {
    const res3 = await fetch(`http://localhost:${port}/api/upload`, {
      method: 'POST',
      body: form3
    });
    console.log('Response status 3:', res3.status);
    console.log('Response text 3:', await res3.text());
  } catch (e) {
    console.error(e);
  }

  server.close();
});
