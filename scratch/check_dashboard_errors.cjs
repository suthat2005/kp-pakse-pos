const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  const code = fs.readFileSync(path, 'utf8');
  const lines = code.split('\n');
  
  // Find lines that have backslash
  lines.forEach((line, idx) => {
    if (line.includes('\\') && !line.includes('\\n') && !line.includes('\\t') && !line.includes('\\"')) {
      console.log(`Line ${idx + 1}: ${line}`);
    }
  });
} else {
  console.log("File not found:", path);
}
