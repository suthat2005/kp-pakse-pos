const { execSync } = require('child_process');

console.log("Checking all git stashes for db_shared.json...");

for (let i = 0; i < 10; i++) {
  try {
    const files = execSync(`git stash show --name-only stash@{${i}}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
    console.log(`=== stash@{${i}} ===`);
    console.log(files.trim());
  } catch(e) {
    break;
  }
}
