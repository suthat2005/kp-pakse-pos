const fs = require('fs');
const path = require('path');

const logFile = 'C:/Users/sutha/.gemini/antigravity/brain/668294e9-f07d-4cf3-842f-54716181ccff/.system_generated/logs/transcript_full.jsonl';

if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  console.log(`Scanning full lines for 2:40 AM code actions...`);
  
  lines.forEach((line) => {
    if (!line) return;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index >= 10850 && obj.step_index <= 10880) {
        if (obj.type === 'CODE_ACTION') {
          console.log(`STEP_INDEX: ${obj.step_index} [${obj.created_at}]`);
          console.log(obj.content);
          console.log('==================================================');
        }
      }
    } catch (e) {}
  });
} else {
  console.log('Log file does not exist.');
}
