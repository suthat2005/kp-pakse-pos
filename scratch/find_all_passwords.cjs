const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== SEARCHING ALL GIT COMMITS FOR @Thatg56566330 ===");
try {
  // Find all commit hashes containing "@Thatg56566330"
  const commits = execSync(`git log --oneline -G"@Thatg56566330"`, { encoding: 'utf8' }).trim().split('\n');
  console.log("Commits:", commits);
  
  commits.forEach(c => {
    if (!c) return;
    const hash = c.split(' ')[0];
    console.log(`\nCommit: ${c}`);
    // Find which files changed in this commit that had "@Thatg56566330"
    const files = execSync(`git show --name-only --oneline ${hash}`, { encoding: 'utf8' }).trim().split('\n').slice(1);
    console.log("Files in commit:", files);
    
    files.forEach(file => {
      if (!file) return;
      try {
        const fileContent = execSync(`git show ${hash}:${file}`, { encoding: 'utf8' });
        if (fileContent.includes('@Thatg56566330')) {
          console.log(`  -> Found in file: ${file}`);
          // If it's a JSON file, print the users block
          if (file.endsWith('.json')) {
            const db = JSON.parse(fileContent);
            if (db.users) {
              console.log("Users block:");
              console.log(JSON.stringify(db.users.data, null, 2));
            }
          } else {
            // Print lines containing "@Thatg56566330"
            fileContent.split('\n').forEach((line, idx) => {
              if (line.includes('@Thatg56566330')) {
                console.log(`    Line ${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      } catch (e) {
        // ignore errors for deleted files
      }
    });
  });
} catch (e) {
  console.error("Error:", e.message);
}
