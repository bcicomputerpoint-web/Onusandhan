import fs from 'fs';

async function testUploadLarge() {
  try {
    // Create a 2MB file
    const buffer = Buffer.alloc(2 * 1024 * 1024, 'a');
    const formData = new FormData();
    const fileBlob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', fileBlob, 'large.pdf');
    
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

testUploadLarge();
