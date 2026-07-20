const fs = require('fs');
const path = require('path');

function findNodeModules(dir, depth = 0) {
  if (depth > 4) return [];
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      const full = path.join(dir, f);
      if (f === 'node_modules') {
        results.push(full);
      } else {
        const stat = fs.statSync(full);
        if (stat.isDirectory() && f !== '.git') {
          results = results.concat(findNodeModules(full, depth + 1));
        }
      }
    });
  } catch(e) {}
  return results;
}

console.log("Searching for node_modules in project...");
findNodeModules('.').forEach(p => console.log(p));
