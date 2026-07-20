const fs = require('fs');
const dbPath = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log("=== DB CATEGORIES ===");
  console.log(JSON.stringify(db.categories, null, 2));
}
