const fs = require('fs');
const KEY_FILE = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\firebase-key.json';
if (fs.existsSync(KEY_FILE)) {
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  console.log("Local firebase-key.json project_id:", serviceAccount.project_id);
} else {
  console.log("firebase-key.json not found!");
}
