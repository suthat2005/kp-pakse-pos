const fs = require('fs');
const path = require('path');

function findJsonBackups(dir) {
  let results = [];
  try {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat && stat.isFile() && f.endsWith('.json') && (f.includes('db') || f.includes('backup') || f.includes('step'))) {
          results.push({ name: f, path: full, size: stat.size, mtime: stat.mtime });
        }
      } catch (e) {}
    });
  } catch(e) {}
  return results;
}

const rootBackups = findJsonBackups('.');
const scratchBackups = findJsonBackups('scratch');

console.log("Root backups:", rootBackups);
console.log("Scratch backups:", scratchBackups);
