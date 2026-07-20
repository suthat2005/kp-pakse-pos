const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFile = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript_full.jsonl';

if (fs.existsSync(logFile)) {
  const rl = readline.createInterface({
    input: fs.createReadStream(logFile),
    output: process.stdout,
    terminal: false
  });

  console.log("=== SEARCHING ALL URLS IN TRANSCRIPT ===");
  rl.on('line', (line) => {
    const urls = line.match(/https?:\/\/[^\s"']+/g);
    if (urls) {
      urls.forEach(url => {
        if (url.includes('suthat') || url.includes('pakse') || url.includes('pos')) {
          console.log(`URL: ${url}`);
        }
      });
    }
  });
}
