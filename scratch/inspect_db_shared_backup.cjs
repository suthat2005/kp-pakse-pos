const fs = require('fs');

const backupPath = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared_backup.json';
if (fs.existsSync(backupPath)) {
  const db = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log("=== DB_SHARED_BACKUP.JSON SUMMARY ===");
  for (const [key, val] of Object.entries(db)) {
    if (typeof val === 'object' && val !== null) {
      const dataObj = val.data || val;
      const count = Array.isArray(dataObj) ? dataObj.length : Object.keys(dataObj).length;
      console.log(`- ${key}: ${count} entries`);
    }
  }
} else {
  console.log("db_shared_backup.json not found");
}
