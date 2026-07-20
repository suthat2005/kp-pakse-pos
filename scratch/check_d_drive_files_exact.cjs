const fs = require('fs');
const path = require('path');

const target = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\src';

function scan(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else {
      console.log(`${stat.mtime.toISOString()} | ${path.relative(target, full)}`);
    }
  });
}

scan(target);
