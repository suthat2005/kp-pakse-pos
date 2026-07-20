const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
console.log("Home directory:", homeDir);

const checkPaths = [
  path.join(homeDir, "Google Drive", "My Drive", "POS_Backups"),
  path.join(homeDir, "Dropbox", "POS_Backups"),
  path.join(homeDir, "OneDrive", "Desktop", "POS_Backups"),
  path.join(homeDir, "OneDrive", "POS_Backups"),
  path.join(homeDir, "POS_Backups")
];

checkPaths.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\nFound backup directory: ${dir}`);
    try {
      const files = fs.readdirSync(dir);
      files.forEach(f => {
        if (f.endsWith('.json')) {
          const fullPath = path.join(dir, f);
          try {
            const db = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (db.users && Array.isArray(db.users.data)) {
              const hasReal = db.users.data.some(u => u.passcode !== '1111' && u.passcode !== '2222' && u.passcode !== '3333' && u.passcode !== '');
              if (hasReal) {
                console.log(`  - 🎉 [REAL CREDENTIALS] File: ${f}`);
                db.users.data.forEach(u => {
                  console.log(`    * ID: ${u.id}, Name: ${u.name}, Passcode: ${u.passcode}, Password: ${u.password}`);
                });
              } else {
                console.log(`  - [Default] File: ${f}`);
              }
            }
          } catch (e) {}
        }
      });
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log(`Directory does not exist: ${dir}`);
  }
});
