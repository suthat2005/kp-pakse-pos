const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src';
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{1F1E0}-\u{1F1FF}]/gu;

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(emojiRegex);
      if (matches && matches.length > 0) {
        // Find unique matches to avoid clutter
        const unique = [...new Set(matches)];
        console.log(`File: ${path.relative(srcDir, fullPath)} contains emojis: ${unique.join(' ')}`);
      }
    }
  }
}

console.log("=== SYSTEM WIDE EMOJI SEARCH ===");
searchDir(srcDir);
