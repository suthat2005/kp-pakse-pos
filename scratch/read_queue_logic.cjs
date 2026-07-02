const fs = require('fs');
const path = require('path');

const files = ['src/components/POS.jsx', 'src/utils/db.js'];
files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('queue') || line.includes('Queue') || line.includes('slot') || line.includes('Slot') || line.includes('ຄິວ') || line.includes('ຄິວອັດກອບ')) {
      if (line.length < 130) {
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
