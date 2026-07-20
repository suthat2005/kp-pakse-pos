const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== CATEGORIES IN DATABASE ===");
  console.log(JSON.stringify(db.categories, null, 2));
} else {
  console.log("Database file not found!");
}
