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

  console.log("=== SEARCHING TRANSCRIPT FOR USER INPUT ===");
  rl.on('line', (line) => {
    if (line.includes('"type":"USER_INPUT"')) {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index} (${obj.created_at}): ${obj.content}`);
    }
  });
} else {
  console.log("Log file not found!");
}
