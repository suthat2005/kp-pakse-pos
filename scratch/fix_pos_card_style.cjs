const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We want to replace characters in the range U+0E01 to U+0E4E (excluding U+0E3F)
  // Let's build a regex for all characters in the Thai range except U+0E3F
  // U+0E01 to U+0E3E and U+0E40 to U+0E4E
  const thaiRegex = /[\u0E01-\u0E3E\u0E40-\u0E4E]/g;

  content = content.replace(thaiRegex, (match) => {
    const code = match.charCodeAt(0);
    return String.fromCharCode(code + 0x80);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Converted Thai characters to Lao in: ${filePath}`);
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      processFile(fullPath);
    }
  }
}

console.log("🚀 Starting automatic conversion of Thai typos to Lao characters...");
scanDir('C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src');
console.log("🏁 Done!");
