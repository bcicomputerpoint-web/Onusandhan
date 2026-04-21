async function test() {
  try {
    const formData = new FormData();
    const blob = new Blob(['helloworld'], { type: 'text/plain' });
    formData.append('file', blob, 'test.txt');

    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
