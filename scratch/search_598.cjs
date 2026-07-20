const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\backups\\db_shared-20260720-090652.json';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('1325') || line.includes('123456') || line.includes('joni1987')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
      // Print context: 5 lines before and after
      console.log(lines.slice(Math.max(0, idx - 5), idx + 5).join('\n'));
      console.log("------------------------");
    }
  });
} else {
  console.log("Backup file not found!");
}
