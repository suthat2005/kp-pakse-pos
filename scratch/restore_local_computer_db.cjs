const fs = require('fs');

const backupPath = 'db_shared_backup.json';
const dbPath = 'db_shared.json';

if (fs.existsSync(backupPath)) {
  const backupData = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(dbPath, backupData, 'utf8');
  console.log("✓ Successfully restored user's local computer database (db_shared.json) from local backup (db_shared_backup.json)!");
} else {
  console.error("⚠ db_shared_backup.json not found.");
}
