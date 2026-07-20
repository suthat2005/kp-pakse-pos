const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFile = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logFile)) {
  const rl = readline.createInterface({
    input: fs.createReadStream(logFile),
    output: process.stdout,
    terminal: false
  });

  console.log("=== SEARCHING TRANSCRIPT FOR REAL CREDENTIALS ===");
  rl.on('line', (line) => {
    // Look for passcodes or passwords that are NOT the default ones (1111, 2222, 3333, admin123, owner123, cashier123, tech123)
    if (line.includes('"passcode"') || line.includes('"password"') || line.includes('รหัส') || line.includes('ພະນັກງານ') || line.includes('ສົມຈິດ')) {
      // Find matches that might contain usernames or passwords
      // Print lines containing these keywords, but truncate to make sure it's readable
      console.log(line.slice(0, 1000));
    }
  });
} else {
  console.log("Log file not found at " + logFile);
}
