const fs = require('fs');
const path = require('path');

function searchD(dir, depth = 0) {
  if (depth > 3) return;
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (f.toLowerCase().includes('kp') || f.toLowerCase().includes('pos')) {
            console.log(`FOUND D DIR: ${full} | mtime: ${stat.mtime.toISOString()}`);
          }
          searchD(full, depth + 1);
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("Searching D:\\ for POS folders...");
searchD('D:\\');
