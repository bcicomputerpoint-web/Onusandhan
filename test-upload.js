import fs from 'fs';

async function testUpload() {
  try {
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync('package.json')], { type: 'application/json' });
    formData.append('file', fileBlob, 'package.json');
    
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Body:', text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}

testUpload();
