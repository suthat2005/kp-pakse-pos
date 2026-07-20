const fs = require('fs');
const path = require('path');

const srcDir = 'D:\\เรัดร้านขอบพระใหน່ລ້າສຸດ\\kp pakse pos v2027';
const destDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos';

console.log("=== EMERGENCY RESTORE TO 04:58 AM VERSION ===");
console.log("Source:", srcDir);
console.log("Destination:", destDir);

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
    // Copy file
    fs.copyFileSync(src, dest);
    fileCount++;
    console.log(`[RESTORED] ${path.relative(destDir, dest)}`);
  }
}

try {
  copyRecursive(srcDir, destDir);
  console.log(`\n✅ SUCCESSFULLY RESTORED ${fileCount} FILES TO 04:58 AM VERSION!`);
} catch(e) {
  console.error("❌ Restore failed:", e.message);
}
