const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== SEARCHING ALL GIT COMMITS AND STASHES FOR db_shared.json ===");

try {
  // Get list of all commit hashes
  const commits = execSync('git log --all --format="%h %cd %s"', { encoding: 'utf8' }).split('\n');
  
  commits.forEach(line => {
    if (!line.trim()) return;
    const hash = line.split(' ')[0];
    try {
      const dbContent = execSync(`git show ${hash}:db_shared.json`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      const db = JSON.parse(dbContent);
      const prods = db.products ? (db.products.data || db.products) : {};
      const count = Array.isArray(prods) ? prods.length : Object.keys(prods).length;
      console.log(`Commit ${hash} | Products count: ${count} | Info: ${line.substring(0, 80)}`);
    } catch(e) {}
  });
} catch(e) {
  console.error("Git search error:", e.message);
}

// Also check all stashes
try {
  const stashes = execSync('git stash list --format="%h %s"', { encoding: 'utf8' }).split('\n');
  stashes.forEach(line => {
    if (!line.trim()) return;
    const hash = line.split(' ')[0];
    try {
      const dbContent = execSync(`git show ${hash}:db_shared.json`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      const db = JSON.parse(dbContent);
      const prods = db.products ? (db.products.data || db.products) : {};
      const count = Array.isArray(prods) ? prods.length : Object.keys(prods).length;
      console.log(`Stash ${hash} | Products count: ${count} | Info: ${line}`);
    } catch(e) {}
  });
} catch(e) {}
