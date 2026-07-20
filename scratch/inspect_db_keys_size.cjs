const fs = require('fs');

const currentC = JSON.parse(fs.readFileSync('C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json', 'utf8'));
const backupC = JSON.parse(fs.readFileSync('C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared_backup.json', 'utf8'));

console.log("=== Key sizes (JSON string length) ===");
const keys = Object.keys(currentC);
keys.forEach(k => {
  const curLen = currentC[k] ? JSON.stringify(currentC[k]).length : 0;
  const bacLen = backupC[k] ? JSON.stringify(backupC[k]).length : 0;
  console.log(`Key [${k}]: currentC=${curLen} chars | backupC=${bacLen} chars`);
});
