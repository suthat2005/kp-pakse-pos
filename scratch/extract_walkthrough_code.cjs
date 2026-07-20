const fs = require('fs');

const transcriptPath = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript_full.jsonl';

if (fs.existsSync(transcriptPath)) {
  console.log("Reading transcript_full.jsonl...");
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  
  let dashboardCode = null;
  let reportsCode = null;

  lines.forEach((line, idx) => {
    if (!line) return;
    if (line.includes('Dashboard.jsx') || line.includes('Reports.jsx')) {
      if (line.includes('replace_file_content') || line.includes('write_to_file') || line.includes('multi_replace_file_content')) {
        console.log(`Line ${idx}: Found file tool call`);
      }
    }
  });

} else {
  console.error("Transcript file not found.");
}
