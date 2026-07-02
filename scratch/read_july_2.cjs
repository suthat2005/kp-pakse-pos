const fs = require('fs');
const path = require('path');

const logFile = 'C:/Users/sutha/.gemini/antigravity/brain/668294e9-f07d-4cf3-842f-54716181ccff/.system_generated/logs/transcript.jsonl';

if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  console.log(`Scanning July 2 lines...`);
  
  lines.forEach((line, idx) => {
    if (!line) return;
    try {
      const obj = JSON.parse(line);
      const created = obj.created_at || '';
      if (created.startsWith('2026-07-02')) {
        // Parse time to display local time (UTC + 7)
        const dateObj = new Date(created);
        const localTimeStr = dateObj.toLocaleTimeString('th-TH', { hour12: false });
        if (obj.type === 'PLANNER_RESPONSE' || obj.type === 'CODE_ACTION' || obj.type === 'USER_INPUT') {
          console.log(`Line ${idx+1} [Local: ${localTimeStr}] [UTC: ${created}]: ${obj.type} - ${obj.content ? obj.content.substring(0, 120) : ''}`);
        }
      }
    } catch (e) {}
  });
} else {
  console.log('Log file does not exist.');
}
