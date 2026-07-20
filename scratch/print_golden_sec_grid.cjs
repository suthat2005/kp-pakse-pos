const fs = require('fs');

const dPathAlt = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\src\\components\\Dashboard.jsx';
if (fs.existsSync(dPathAlt)) {
  const content = fs.readFileSync(dPathAlt, 'utf8').replace(/\r\n/g, '\n');
  const lines = content.split('\n');
  console.log("=== GOLDEN FILE LINES 570-630 ===");
  for (let i = 570; i <= 630; i++) {
    if (lines[i]) {
      console.log(`${i}: ${lines[i]}`);
    }
  }
} else {
  console.log("Golden file not found");
}
