const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src';
function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') search(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('import') && line.includes('from') && line.includes('react') && line.includes('t')) {
          console.log(`${path.relative(srcDir, fullPath)}:${i + 1} - ${line.trim()}`);
        }
      });
    }
  }
}
search(srcDir);
