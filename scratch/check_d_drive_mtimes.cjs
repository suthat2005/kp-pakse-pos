const fs = require('fs');
const path = require('path');

function searchD(dir) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      console.log(f);
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          const sub = fs.readdirSync(full);
          sub.forEach(s => console.log(`  ${f}/${s}`));
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("=== D DRIVE FOLDERS ===");
searchD('D:\\');
