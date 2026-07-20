const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  console.log("Searching transcript for edits to App.jsx...");
  
  lines.forEach((line, idx) => {
    if (line.includes('App.jsx') && (line.includes('replace_file_content') || line.includes('multi_replace_file_content') || line.includes('write_to_file'))) {
      try {
        const data = JSON.parse(line);
        if (data.tool_calls) {
          data.tool_calls.forEach(tc => {
            if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
              console.log(`Line ${idx} | step ${data.step_index} | tool: ${tc.name} | desc: ${tc.args.Description || tc.args.Instruction}`);
            }
          });
        }
      } catch(e) {}
    }
  });
} else {
  console.error("Transcript file not found.");
}
