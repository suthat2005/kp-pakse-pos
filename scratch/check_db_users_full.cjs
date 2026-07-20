const fs = require('fs');
const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== DB USERS ===");
  console.log(JSON.stringify(db.users, null, 2));
}
