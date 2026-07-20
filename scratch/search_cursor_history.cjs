const fs = require('fs');
const path = require('path');

const historyDirs = [
  'C:\\Users\\sutha\\AppData\\Roaming\\Cursor\\User\\History',
  'C:\\Users\\sutha\\AppData\\Roaming\\Code\\User\\History',
  'C:\\Users\\sutha\\AppData\\Roaming\\Windsurf\\User\\History',
  'C:\\Users\\sutha\\AppData\\Roaming\\Code - Insiders\\User\\History'
];

historyDirs.forEach(historyDir => {
  console.log(`Checking history directory: ${historyDir}`);
  if (fs.existsSync(historyDir)) {
    console.log(`Found path: ${historyDir}`);
    // Search recursively
    function searchHistory(dir, results = []) {
      try {
        const list = fs.readdirSync(dir);
        list.forEach(f => {
          const full = path.join(dir, f);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            searchHistory(full, results);
          } else {
            const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
            if (ageHours < 24) {
              results.push({ path: full, mtime: stat.mtime, size: stat.size });
            }
          }
        });
      } catch(e) {}
      return results;
    }
    
    const files = searchHistory(historyDir);
    console.log(`Found ${files.length} files modified in last 24 hours in ${path.basename(historyDir)}`);
    
    files.forEach(f => {
      try {
        const content = fs.readFileSync(f.path, 'utf8');
        if (content.includes('toLocaleTimeString') || content.includes('PhetsarathOT') || content.includes('GP-L80250')) {
          const firstLine = content.split('\n')[0].slice(0, 100);
          console.log(`MATCH: ${f.path} | size: ${f.size} | mtime: ${f.mtime.toISOString()} | First line: ${firstLine}`);
        }
      } catch(e) {}
    });
  } else {
    console.log(`Not found: ${historyDir}`);
  }
});
