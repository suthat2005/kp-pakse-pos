const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4';

const files = fs.readdirSync(brainDir);
files.forEach(f => {
  if (f.endsWith('.png') || f.endsWith('.jpg')) {
    const full = path.join(brainDir, f);
    const stat = fs.statSync(full);
    console.log(`${stat.mtime.toISOString()} | ${f} | size: ${stat.size}`);
  }
});
