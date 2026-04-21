const fs = require('fs');

async function testUpload() {
  const formData = new FormData();
  // using a small dummy text file
  const blob = new Blob(['hello'], { type: 'text/plain' });
  formData.append('file', blob, 'test.txt');

  console.log('Sending request...');
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

testUpload();
