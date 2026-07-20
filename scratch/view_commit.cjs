const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Redirecting git log to file...");
  execSync(`git log -S"@Thatg56566330" -p > scratch/git_diff.txt`);
  const diff = fs.readFileSync('scratch/git_diff.txt', 'utf8');
  console.log("=== DIFF DETAILS ===");
  console.log(diff.slice(0, 5000));
  fs.unlinkSync('scratch/git_diff.txt');
} catch (e) {
  console.error("Error:", e.message);
}
