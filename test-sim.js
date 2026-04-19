import fs from 'fs';

async function testSimulate() {
  const formData = new FormData();
  const fileBlob = new Blob(["hello world"], { type: 'text/plain' });
  formData.append('file', fileBlob, 'hello.txt');
  
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
  });
  console.log(res.status, res.headers.get('content-type'));
  const text = await res.text();
  console.log(text.substring(0, 100));
}
testSimulate();
