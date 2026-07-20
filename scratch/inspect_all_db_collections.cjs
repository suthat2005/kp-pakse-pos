const fs = require('fs');

const dbPath = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log("=== DB COLLECTIONS SUMMARY ===");
  for (const [key, val] of Object.entries(db)) {
    if (typeof val === 'object' && val !== null) {
      const dataObj = val.data || val;
      const count = Array.isArray(dataObj) ? dataObj.length : Object.keys(dataObj).length;
      console.log(`- ${key}: ${count} entries | updatedAt: ${val.updatedAt ? new Date(val.updatedAt).toISOString() : 'N/A'}`);
    }
  }
} else {
  console.log("db_shared.json not found");
}
