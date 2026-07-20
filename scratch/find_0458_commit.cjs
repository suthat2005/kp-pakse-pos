const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== SEARCHING EARLY COMMITS FOR db_shared.json ===");
try {
  const commits = execSync('git log --reverse --format="%H" -- db_shared.json', { encoding: 'utf8' }).trim().split('\n');
  console.log(`Total commits of db_shared.json: ${commits.length}`);
  
  for (let i = 0; i < Math.min(10, commits.length); i++) {
    const hash = commits[i];
    console.log(`\nCommit index ${i}: ${hash}`);
    try {
      execSync(`git show ${hash}:db_shared.json > scratch/temp_db.json`);
      const db = JSON.parse(fs.readFileSync('scratch/temp_db.json', 'utf8'));
      if (db.users && Array.isArray(db.users.data)) {
        console.log(`  - Users:`);
        db.users.data.forEach(u => {
          console.log(`    * ID: ${u.id}, Name: ${u.name}, Passcode: ${u.passcode}, Password: ${u.password}`);
        });
      }
      fs.unlinkSync('scratch/temp_db.json');
    } catch (e) {
      console.log(`  - Failed to read: ${e.message}`);
    }
  }
} catch (e) {
  console.error(e);
}
