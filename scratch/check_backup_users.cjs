const fs = require('fs');
const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\backups\\master_snapshot_1784507542208\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== USERS IN master_snapshot ===");
  console.log(JSON.stringify(db.users, null, 2));
} else {
  console.log("master_snapshot not found!");
}
