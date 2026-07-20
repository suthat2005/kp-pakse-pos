const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  
  // Find step 53
  lines.forEach((line, idx) => {
    try {
      const data = JSON.parse(line);
      if (data.step_index === 53) {
        console.log("=== STEP 53 ===");
        console.log(JSON.stringify(data.tool_calls, null, 2));
      }
      if (data.step_index === 3611) {
        console.log("=== STEP 3611 ===");
        console.log(JSON.stringify(data.tool_calls, null, 2));
      }
    } catch(e) {}
  });
}
