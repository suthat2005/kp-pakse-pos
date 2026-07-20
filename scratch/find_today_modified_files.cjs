const fs = require('fs');
const path = require('path');

function getFilesRecursively(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      if (file === 'node_modules' || file === '.git' || file === 'dist') return;
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getFilesRecursively(filePath));
        } else {
          results.push({ path: filePath, mtime: stat.mtime, size: stat.size });
        }
      } catch(e) {}
    });
  } catch(e) {}
  return results;
}

const allFiles = getFilesRecursively('.');
// Sort by modification time descending
allFiles.sort((a, b) => b.mtime - a.mtime);

console.log("=== TOP 30 MOST RECENTLY MODIFIED FILES IN REPO ===");
allFiles.slice(0, 30).forEach(f => {
  console.log(`${f.mtime.toISOString()} | ${f.size} bytes | ${f.path}`);
});
