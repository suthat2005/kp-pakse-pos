const fs = require('fs');
const path = require('path');

function findReactDirs(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === 'react') {
        results.push(path.join(dir, f));
      }
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && f !== '.git' && f !== '.github') {
        results = results.concat(findReactDirs(full));
      }
    });
  } catch(e) {}
  return results;
}

console.log("Searching for react directories...");
findReactDirs('.').forEach(p => console.log(p));
