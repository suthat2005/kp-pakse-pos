const fs = require('fs');
const path = require('path');

function searchD(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === '$RECYCLE.BIN' || f === 'node_modules' || f === '.git' || f === 'dist' || f === '$WINDOWS.~TMP') return;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchD(full, depth + 1);
        } else if (f.endsWith('.json') && f.includes('db_shared')) {
          console.log(`FOUND JSON: ${full} | size: ${stat.size} | mtime: ${stat.mtime.toISOString()}`);
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("Searching D:/ for db_shared JSON files...");
searchD('D:/');
