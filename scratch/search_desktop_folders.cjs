const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\sutha\\OneDrive';

function searchRecursive(dir, depth = 0) {
  if (depth > 2) return;
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === 'AppData' || f === 'node_modules' || f === '.git' || f === 'dist') return;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (f.toLowerCase().includes('kp') || f.toLowerCase().includes('pos')) {
            console.log(`FOUND DIRECTORY: ${full} | mtime: ${stat.mtime.toISOString()}`);
          }
          searchRecursive(full, depth + 1);
        } else {
          if (f.toLowerCase().includes('kp') || f.toLowerCase().includes('pos')) {
            console.log(`FOUND FILE: ${full} | size: ${stat.size} | mtime: ${stat.mtime.toISOString()}`);
          }
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("Searching C:\\Users\\sutha\\OneDrive recursively up to depth 2...");
searchRecursive(rootDir);
searchRecursive('C:\\Users\\sutha'); // also search home
