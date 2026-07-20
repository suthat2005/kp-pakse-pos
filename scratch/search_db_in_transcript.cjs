const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript_full.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  console.log("Searching transcript for db_shared.json contents...");
  
  lines.forEach((line, idx) => {
    if (line.includes('db_shared.json') && line.includes('content') && line.includes('products')) {
      console.log(`Line ${idx} matches! Length: ${line.length}`);
    }
  });
}
