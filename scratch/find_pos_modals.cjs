const fs = require('fs');
const path = require('path');

const file = 'src/components/POS.jsx';
const filePath = path.join(process.cwd(), file);
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('className=') && (line.includes('modal') || line.includes('Modal'))) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
}
