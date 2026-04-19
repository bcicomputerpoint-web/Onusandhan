import fs from 'fs';

async function testOptions() {
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Origin': 'http://localhost:3000'
    }
  });
  console.log(res.status, res.headers.get('content-type'));
  const text = await res.text();
  console.log('body:', text.substring(0, 50));
}
testOptions();
