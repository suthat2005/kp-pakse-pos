const fs = require('fs');
const path = require('path');

console.log("=== SCANNING ALL D DRIVE DIRECTORIES ===");
const list = fs.readdirSync('D:\\');
list.forEach(f => {
  const full = path.join('D:\\', f);
  try {
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`DIR: ${full}`);
      const sub = fs.readdirSync(full);
      sub.forEach(s => {
        const subFull = path.join(full, s);
        try {
          if (fs.statSync(subFull).isDirectory()) {
            console.log(`  SUBDIR: ${subFull}`);
          }
        } catch(e) {}
      });
    }
  } catch(e) {}
});
