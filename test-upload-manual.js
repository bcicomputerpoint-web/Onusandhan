// Create a FormData to send
import fs from 'fs';
import path from 'path';

async function run() {
  const fileContent = Buffer.from('hello world');
  
  // Create manual multipart format since standard Node.js fetch doesn't have FormData natively attached to fs in old versions
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n';
  body += 'Content-Type: application/pdf\r\n\r\n';
  body += 'hello world\r\n';
  body += '--' + boundary + '--\r\n';

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary
      },
      body: body
    });

    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
