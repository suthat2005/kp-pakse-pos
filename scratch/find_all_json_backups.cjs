const fs = require('fs');
const path = require('path');

const userHome = 'C:\\Users\\sutha';

function searchJsonFiles(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === 'node_modules' || f === '.git' || f === 'AppData' || f === 'dist' || f === '.vite') return;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchJsonFiles(full, depth + 1);
        } else if (f.endsWith('.json') || f.endsWith('.json.gz') || f.endsWith('.bak')) {
          // Check if modified today (2026-07-20 or 2026-07-19)
          const mtime = stat.mtime;
          if (mtime.getFullYear() === 2026 && mtime.getMonth() === 6 && mtime.getDate() >= 19) {
            console.log(`FOUND BACKUP: ${full} | size: ${stat.size} | mtime: ${mtime.toISOString()}`);
          }
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("Searching C:\\Users\\sutha for JSON/backup files modified on July 19-20, 2026...");
searchJsonFiles(userHome);
