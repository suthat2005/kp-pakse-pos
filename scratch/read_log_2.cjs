const fs = require('fs');
const path = require('path');

const logFile = 'C:/Users/sutha/.gemini/antigravity/brain/668294e9-f07d-4cf3-842f-54716181ccff/.system_generated/logs/transcript.jsonl';

if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  console.log(`Read ${lines.length} lines from log.`);
  
  lines.forEach((line, idx) => {
    if (!line) return;
    try {
      const obj = JSON.parse(line);
      const created = obj.created_at || '';
      // UTC time for local 02:00 AM (July 3) is 19:00 (July 2)
      // UTC time for local 02:00 PM (July 2) is 07:00 (July 2)
      if (created.includes('T19:') || created.includes('T07:') || created.includes('T06:') || created.includes('T18:') || created.includes('T20:')) {
        if (obj.type === 'PLANNER_RESPONSE' || obj.type === 'CODE_ACTION' || obj.type === 'USER_INPUT') {
          console.log(`Line ${idx+1} [${created}]: ${obj.type} - ${obj.content ? obj.content.substring(0, 150) : ''}`);
        }
      }
    } catch (e) {}
  });
} else {
  console.log('Log file does not exist.');
}
