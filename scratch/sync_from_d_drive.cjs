const fs = require('fs');
const path = require('path');

const srcDir = 'D:\\เรັດຮ້ານຂອບພຣະໃໝ່ລ້າສຸດ\\kp pakse pos v2027'; // Note: corrected Lao character encoding if needed, or we can use the absolute path we found
// Let's resolve the exact path dynamically from our search result
const exactSrcDir = 'D:\\เรັດຮ້านຂອບພຣະໃໝ່ລ້າສຸດ\\kp pakse pos v2027';
// Wait, the path we found was: D:\เรัดร้านขอบพระใหน่ล้าสุด\kp pakse pos v2027
// Let's double check if we can read the directory:
const exactPath = fs.readdirSync('D:/').find(f => f.includes('เรัดร้านขอบพระใหน่ล้าสุด') || f.includes('เรັດຮ້ານຂອບພຣະໃໝ່ລ້າສຸດ'));
const resolvedSrc = path.join('D:/', exactPath, 'kp pakse pos v2027');

console.log("Resolved source path:", resolvedSrc);
const destDir = process.cwd();
console.log("Destination path:", destDir);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const list = fs.readdirSync(src);
    list.forEach(f => {
      if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.agents' || f === 'scratch') return;
      const srcFile = path.join(src, f);
      const destFile = path.join(dest, f);
      copyRecursive(srcFile, destFile);
    });
  } else {
    // Ensure parent dir exists
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(resolvedSrc, src)}`);
  }
}

if (fs.existsSync(resolvedSrc)) {
  copyRecursive(resolvedSrc, destDir);
  console.log("✓ Successfully copied all project files from D: drive project to Desktop project.");
} else {
  console.error("Source directory does not exist:", resolvedSrc);
}
