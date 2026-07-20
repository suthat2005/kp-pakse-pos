const fs = require('fs');
const path = require('path');

// Target the exact v2027 folder inside เรัดร้านขอบพระใหน่ล้าสุด
const parentDir = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด';
const list = fs.readdirSync(parentDir);
let targetFolder = null;

list.forEach(f => {
  if (f.includes('v2027') || f.includes('kp pakse pos')) {
    targetFolder = path.join(parentDir, f);
  }
});

console.log("Target 04:58 AM folder found:", targetFolder);

if (targetFolder && fs.existsSync(targetFolder)) {
  const destDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos';
  let fileCount = 0;

  function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      const baseName = path.basename(src);
      if (baseName === 'node_modules' || baseName === '.git' || baseName === 'dist' || baseName === '.vite' || baseName === 'scratch') {
        return;
      }
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const list = fs.readdirSync(src);
      list.forEach(f => {
        copyRecursive(path.join(src, f), path.join(dest, f));
      });
    } else {
      fs.copyFileSync(src, dest);
      fileCount++;
      console.log(`[RESTORED 04:58] ${path.relative(destDir, dest)}`);
    }
  }

  copyRecursive(targetFolder, destDir);
  console.log(`\n✅ SUCCESSFULLY RESTORED ${fileCount} FILES FROM 04:58 AM GOLDEN SNAPSHOT!`);
} else {
  console.log("❌ Target folder not found");
}
