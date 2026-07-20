const fs = require('fs');
const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== DB TABLES AND SIZES ===");
  for (const key in db) {
    const table = db[key];
    if (table && table.data) {
      console.log(`- ${key}: ${Object.keys(table.data).length} records`);
    } else {
      console.log(`- ${key}: (no .data structure)`);
    }
  }
} else {
  console.log("db_shared.json does not exist!");
}
