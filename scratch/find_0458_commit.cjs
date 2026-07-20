const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== GIT LOG (Recent 30 commits with full ISO dates) ===");
try {
  const log = execSync('git log -n 30 --format="%h %cd %s"', { encoding: 'utf8' });
  console.log(log);
} catch (e) {
  console.error(e.message);
}

console.log("=== GIT REFLOG (Recent 50 entries) ===");
try {
  const reflog = execSync('git reflog -n 50 --date=iso', { encoding: 'utf8' });
  console.log(reflog);
} catch (e) {
  console.error(e.message);
}

console.log("=== GIT STASH LIST ===");
try {
  const stash = execSync('git stash list --date=iso', { encoding: 'utf8' });
  console.log(stash);
} catch (e) {
  console.error(e.message);
}
