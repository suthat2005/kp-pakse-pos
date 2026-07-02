const fs = require('fs');
const path = require('path');

const logFile = 'C:/Users/sutha/.gemini/antigravity/brain/668294e9-f07d-4cf3-842f-54716181ccff/.system_generated/logs/transcript.jsonl';

if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  console.log(`Scanning transcript lines 11240 to 11450...`);
  
  lines.forEach((line, idx) => {
    if (!line || idx < 11240 || idx > 11450) return;
    try {
      const obj = JSON.parse(line);
      console.log(`Line ${idx+1} [Local: ${new Date(obj.created_at).toLocaleString('th-TH')}] [UTC: ${obj.created_at}]: Type: ${obj.type}`);
    } catch (e) {}
  });
} else {
  console.log('Log file does not exist.');
}
