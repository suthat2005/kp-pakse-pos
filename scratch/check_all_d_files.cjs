const fs = require('fs');
const path = require('path');

const dir = 'D:\\เรັດຮ້ານຂອບພຣະໃໝ່ລ້າสุด\\kp pakse pos v2027\\src'; // Or let's resolve dynamically
const exactPath = fs.readdirSync('D:/').find(f => f.includes('เรัดร้านขอบพระใหน่ล้าสุด') || f.includes('เรັດຮ້ານຂອບພຣະໃໝ່ລ້າສຸດ'));
const srcPath = path.join('D:/', exactPath, 'kp pakse pos v2027', 'src');

function getFiles(d) {
  let results = [];
  const list = fs.readdirSync(d);
  list.forEach(f => {
    const full = path.join(d, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else {
      results.push({ path: full, mtime: stat.mtime });
    }
  });
  return results;
}

console.log("Checking src files modified today on D: drive...");
if (fs.existsSync(srcPath)) {
  const files = getFiles(srcPath);
  files.forEach(f => {
    const localTimeStr = f.mtime.toLocaleString('th-TH');
    console.log(`${f.mtime.toISOString()} (${localTimeStr}) - ${path.relative(srcPath, f.path)}`);
  });
} else {
  console.log("srcPath not found:", srcPath);
}
