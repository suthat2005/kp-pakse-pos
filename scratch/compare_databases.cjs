const fs = require('fs');

const paths = {
  currentC: 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json',
  backupC: 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared_backup.json',
  backupD: 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\db_shared_backup.json'
};

function countItems(obj) {
  if (!obj) return 0;
  if (obj.data) {
    return Object.keys(obj.data).length;
  }
  return Object.keys(obj).length;
}

Object.entries(paths).forEach(([key, path]) => {
  if (fs.existsSync(path)) {
    try {
      const data = JSON.parse(fs.readFileSync(path, 'utf8'));
      console.log(`=== Database: ${key} (${path}) ===`);
      console.log(`  File size: ${fs.statSync(path).size} bytes`);
      console.log(`  Products count: ${countItems(data.products)}`);
      console.log(`  Orders count: ${countItems(data.orders)}`);
      console.log(`  Debts count: ${countItems(data.debts)}`);
      console.log(`  Framing jobs count: ${countItems(data.framing_jobs)}`);
      console.log(`  Customers count: ${countItems(data.customers)}`);
    } catch(e) {
      console.error(`Error reading ${key}:`, e.message);
    }
  } else {
    console.log(`=== Database: ${key} (Not Found) ===`);
  }
});
