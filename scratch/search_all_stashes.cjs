const { execSync } = require('child_process');
const fs = require('fs');

const cwd = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos';
try {
  const stashes = execSync('git stash list', { cwd }).toString().split('\n').filter(Boolean);
  console.log(`Found ${stashes.length} stashes.`);
  
  for (let i = 0; i < stashes.length; i++) {
    const stashRef = `stash@{${i}}`;
    try {
      const files = execSync(`git stash show --name-only "${stashRef}"`, { cwd }).toString();
      if (files.includes('Dashboard.jsx')) {
        console.log(`Stash ${stashRef} has Dashboard.jsx! Details:`);
        const diff = execSync(`git diff "${stashRef}^" "${stashRef}" -- src/components/Dashboard.jsx`, { cwd }).toString();
        console.log(`Diff length: ${diff.length}`);
        if (diff.includes('KpiCard')) {
          console.log(`=== FOUND KpiCard in stash ${stashRef}! ===`);
          fs.writeFileSync(`scratch/found_stash_${i}.diff`, diff);
        }
      }
    } catch (e) {
      console.log(`Failed to inspect stash ${stashRef}: ${e.message}`);
    }
  }
} catch (err) {
  console.error(err);
}
