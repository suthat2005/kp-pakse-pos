import fs from 'fs';
import path from 'path';

const srcDir = './src';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/db\.getLabel\(\s*db\.getLabel/g);
      if (matches) {
        console.log(`Found nested getLabel in ${fullPath}: ${matches.length} matches`);
        // Print lines containing it
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('db.getLabel(db.getLabel')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

scanDir(srcDir);
