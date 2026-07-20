const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== SEARCHING ALL GIT COMMITS FOR NON-DEFAULT PASSWORDS ===");
try {
  const commitHashes = execSync('git log --format="%H"', { encoding: 'utf8' }).trim().split('\n');
  console.log(`Total commits in history: ${commitHashes.length}`);
  
  for (const hash of commitHashes) {
    if (!hash) continue;
    try {
      const show = execSync(`git show ${hash}:db_shared.json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const db = JSON.parse(show);
      if (db.users && Array.isArray(db.users.data)) {
        const hasNonDefault = db.users.data.some(u => {
          return u.passcode !== '1111' && u.passcode !== '2222' && u.passcode !== '3333' && u.passcode !== '9999' && u.passcode !== '';
        });
        if (hasNonDefault) {
          console.log(`\n🎉 Found non-default user credentials in commit ${hash.slice(0, 7)}:`);
          db.users.data.forEach(u => {
            console.log(`  - ID: ${u.id}, Name: ${u.name}, Passcode: ${u.passcode}, Email: ${u.email}, Password: ${u.password}`);
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }
  console.log("Finished scanning all commits.");
} catch (e) {
  console.error("Error:", e.message);
}
