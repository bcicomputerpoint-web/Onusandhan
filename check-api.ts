async function run() {
  const res = await fetch('http://localhost:3000/api/admin/stats');
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
run();
