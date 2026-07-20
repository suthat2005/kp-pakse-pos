const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  console.log("Total transcript lines:", lines.length);
  
  let matchCount = 0;
  lines.forEach((line, idx) => {
    if (line.includes('toLocaleDateString') || line.includes('toLocaleTimeString') || line.includes('Ctrl') || line.includes('clock') || line.includes('time') || line.includes('search') || line.includes('+')) {
      if (line.includes('replace_file_content') || line.includes('write_to_file') || line.includes('multi_replace_file_content')) {
        console.log(`Line ${idx}: ${line.slice(0, 300)}...`);
        matchCount++;
      }
    }
  });
  console.log("Total match count:", matchCount);
} else {
  console.error("Transcript file not found.");
}
