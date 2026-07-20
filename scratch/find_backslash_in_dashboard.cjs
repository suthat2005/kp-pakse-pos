const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  const code = fs.readFileSync(path, 'utf8');
  const lines = code.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.includes('\\')) {
      console.log(`Line ${idx + 1}: ${line}`);
    }
  });
}
