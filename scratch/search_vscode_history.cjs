const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\sutha\\AppData\\Roaming\\Code\\User\\History';

function searchHistory(dir, results = []) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchHistory(full, results);
      } else {
        // VS Code history files usually have random names, but the parent directory contains entries.json which maps names.
        // Let's search files modified today (July 20) or yesterday (July 19)
        const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
        if (ageHours < 24) {
          results.push({ path: full, mtime: stat.mtime, size: stat.size });
        }
      }
    });
  } catch(e) {}
  return results;
}

console.log("Searching VS Code Local History for files modified in the last 24 hours...");
if (fs.existsSync(historyDir)) {
  const files = searchHistory(historyDir);
  console.log(`Found ${files.length} files modified in last 24 hours.`);
  
  // Let's filter files that contain unique keywords like 'PhetsarathOT' or 'toLocaleTimeString'
  const matching = [];
  files.forEach(f => {
    try {
      const content = fs.readFileSync(f.path, 'utf8');
      if (content.includes('toLocaleTimeString') || content.includes('PhetsarathOT') || content.includes('GP-L80250')) {
        matching.push(f);
        // Print first line or some info
        const firstLine = content.split('\n')[0].slice(0, 100);
        console.log(`MATCH: ${f.path} | size: ${f.size} | mtime: ${f.mtime.toISOString()} | First line: ${firstLine}`);
      }
    } catch(e) {}
  });
  console.log(`Total matching VS Code history files: ${matching.length}`);
} else {
  console.log("VS Code history directory not found at:", historyDir);
}
