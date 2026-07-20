const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  const buf = fs.readFileSync(path);
  console.log("File length:", buf.length);
  console.log("First 200 chars code representation:");
  for (let i = 0; i < Math.min(buf.length, 200); i++) {
    const code = buf[i];
    const char = String.fromCharCode(code);
    console.log(`Index ${i}: code=${code} (${code.toString(16)}) -> char=${JSON.stringify(char)}`);
  }
} else {
  console.log("File not found:", path);
}
