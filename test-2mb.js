import fs from 'fs';

async function run() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n';
  body += 'Content-Type: application/pdf\r\n\r\n';
  
  // 2MB payload
  body += 'a'.repeat(2 * 1024 * 1024) + '\r\n';
  body += '--' + boundary + '--\r\n';

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary
      },
      body: body
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response top 100 chars:', text.substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
run();
