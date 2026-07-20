const fs = require('fs');
const path = require('path');

const desktopDir = 'C:\\Users\\sutha\\OneDrive\\Desktop';
console.log("=== SEARCHING DESKTOP FOR db_shared FILES ===");

try {
  const files = fs.readdirSync(desktopDir);
  files.forEach(f => {
    const fullPath = path.join(desktopDir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Check if it's a backup folder
      if (f.toLowerCase().includes('pos') || f.toLowerCase().includes('kp') || f.toLowerCase().includes('backup')) {
        console.log(`Directory: ${f}`);
        // Read children
        try {
          const children = fs.readdirSync(fullPath);
          children.forEach(c => {
            if (c.toLowerCase().includes('db_shared') || c.toLowerCase().includes('db-shared') || c.toLowerCase().includes('backup')) {
              console.log(`  - File: ${c} (Size: ${fs.statSync(path.join(fullPath, c)).size})`);
            }
          });
        } catch (e) {}
      }
    } else {
      if (f.toLowerCase().includes('db_shared') || f.toLowerCase().includes('db-shared') || f.toLowerCase().includes('backup')) {
        console.log(`File: ${f} (Size: ${stat.size})`);
      }
    }
  });
} catch (e) {
  console.error("Error:", e.message);
}
