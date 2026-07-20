const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== AUDITING EDITS BETWEEN 19/7/2026 19:05 AND 20/7/2026 04:57 ===");

// 1. Git commits in timeframe
try {
  const gitLog = execSync('git log --since="2026-07-19 12:00:00" --until="2026-07-20 04:57:00" --format="%h %cd %s"', { encoding: 'utf8' });
  console.log("--- GIT COMMITS IN TIMEFRAME ---");
  console.log(gitLog || "No commits directly recorded in this timeframe.");
} catch(e) {}

// 2. Scan file modification dates across src and backups
const srcDir = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src';
console.log("\n--- SRC FILES MODIFIED IN TIMEFRAME ---");

function scanSrc(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanSrc(full);
    } else {
      const mtime = stat.mtime;
      console.log(`${mtime.toLocaleString('th-TH')} | ${path.relative(srcDir, full)}`);
    }
  });
}

scanSrc(srcDir);
