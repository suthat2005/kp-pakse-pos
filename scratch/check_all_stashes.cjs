const { execSync } = require('child_process');

console.log("=== CHECKING GIT STASHES FOR db_shared.json ===");
for (let i = 0; i <= 5; i++) {
  try {
    const show = execSync(`git show stash@{${i}}:db_shared.json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const db = JSON.parse(show);
    if (db.users) {
      console.log(`\nStash stash@{${i}}:`);
      const usersList = Array.isArray(db.users.data) ? db.users.data : Object.values(db.users.data || {});
      usersList.forEach(u => {
        console.log(`  - ID: ${u.id}, Name: ${u.name}, Passcode: ${u.passcode}, Email: ${u.email}, Password: ${u.password}`);
      });
    }
  } catch (e) {
    // ignore errors
  }
}
