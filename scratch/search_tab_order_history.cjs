const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('reorder_tabs') || line.includes('tab_') || line.includes('สลับตำแหน่ง') || line.includes('เรียงลำดับ')) {
    console.log(line.substring(0, 300));
  }
});
