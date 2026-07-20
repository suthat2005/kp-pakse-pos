const fs = require('fs');
const path = require('path');

const backupsDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\backups';
if (fs.existsSync(backupsDir)) {
  const files = fs.readdirSync(backupsDir);
  files.forEach(f => {
    if (f.endsWith('.json') && f !== 'firebase-key.json') {
      const fullPath = path.join(backupsDir, f);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('ສົມຈິດ')) {
          console.log(`\nFile: ${f} contains 'ສົມຈິດ'`);
          const db = JSON.parse(content);
          if (db.users) {
            console.log("Users in this backup:");
            console.log(JSON.stringify(db.users.data, null, 2));
          }
        }
      } catch (e) {}
    }
  });
}
