const fs = require('fs');
const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\backups\\db_shared-20260720-090652.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== USERS IN BACKUP 20260720-090652 ===");
  console.log(JSON.stringify(db.users, null, 2));
} else {
  console.log("Backup file not found!");
}
