const fs = require('fs');
const path = require('path');

function searchD(dir, depth = 0) {
  if (depth > 3) return;
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === '$RECYCLE.BIN' || f === 'node_modules' || f === '.git' || f === 'dist') return;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (f.toLowerCase().includes('kp pakse pos')) {
            console.log(`FOUND: ${full} (${stat.mtime.toISOString()})`);
          }
          searchD(full, depth + 1);
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("Searching D:/ for kp pakse pos folders...");
searchD('D:/');
