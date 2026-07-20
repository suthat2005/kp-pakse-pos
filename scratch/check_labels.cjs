const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Match any Thai character range: U+0E00 to U+0E7F
      const regex = /[\u0E00-\u0E7F]/g;
      let match;
      const matches = [];
      while ((match = regex.exec(content)) !== null) {
        // Get line number and context
        const index = match.index;
        const lineNum = content.substring(0, index).split('\n').length;
        const line = content.split('\n')[lineNum - 1];
        matches.push({ lineNum, char: match[0], code: match[0].charCodeAt(0).toString(16).toUpperCase(), line: line.trim() });
      }
      if (matches.length > 0) {
        console.log(`\nFile: ${fullPath}`);
        // Group by line to avoid duplicates
        const uniqueLines = {};
        matches.forEach(m => {
          if (!uniqueLines[m.lineNum]) {
            uniqueLines[m.lineNum] = { line: m.line, chars: [] };
          }
          uniqueLines[m.lineNum].chars.push(`${m.char} (U+${m.code})`);
        });
        Object.keys(uniqueLines).forEach(lineNum => {
          console.log(`  Line ${lineNum}: "${uniqueLines[lineNum].line}"`);
          console.log(`    Thai chars: ${uniqueLines[lineNum].chars.join(', ')}`);
        });
      }
    }
  }
}

console.log("🔍 Scanning src/ directory for Thai characters...");
scanDir('C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src');
