const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  const buf = fs.readFileSync(path);
  console.log("Total bytes:", buf.length);
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 92) { // 92 is \
      // Print context of 10 bytes around it
      const start = Math.max(0, i - 15);
      const end = Math.min(buf.length, i + 15);
      const context = buf.slice(start, end).toString('utf8');
      console.log(`Byte index ${i}: context = ${JSON.stringify(context)}`);
    }
  }
} else {
  console.log("File not found!");
}
