const fs = require('fs');
const path = require('path');

function countItems(obj) {
  if (!obj) return 0;
  if (obj.data) {
    return Object.keys(obj.data).length;
  }
  return Object.keys(obj).length;
}

const folders = [
  'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos',
  'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\backups',
  'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027',
  'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\backups'
];

folders.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    if (f.endsWith('.json') && f !== 'package.json' && f !== 'package-lock.json' && f !== 'firebase-key.json' && f !== 'tsconfig.json') {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        console.log(`=== ${f} in ${path.basename(dir)} ===`);
        console.log(`  Path: ${full}`);
        console.log(`  Mtime: ${stat.mtime.toISOString()}`);
        console.log(`  Size: ${stat.size} bytes`);
        console.log(`  Products: ${countItems(data.products)} | Orders: ${countItems(data.orders)} | Debts: ${countItems(data.debts)} | Framing: ${countItems(data.framing_jobs)} | Customers: ${countItems(data.customers)}`);
      } catch(e) {}
    }
  });
});
