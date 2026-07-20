const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src';
function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') search(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/import\s+\{[^}]*\}\s+from\s+['"]react['"]/g);
      if (matches) {
        matches.forEach(m => {
          if (/\b(t)\b/.test(m)) {
            console.log(`Found in file: ${path.relative(srcDir, fullPath)} - ${m}`);
          }
        });
      }
    }
  }
}
search(srcDir);
