async function run() {
  const fd = new FormData();
  const validBuffer = new Uint8Array(100); 
  fd.append('file', new Blob([validBuffer], { type: 'image/jpeg' }), 'valid.jpg');
  
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: fd
  });
  console.log('STATUS:', res.status);
  console.log('CONTENT-TYPE:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('BODY:', text.substring(0, 500));
}
run();
