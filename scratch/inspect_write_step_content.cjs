const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript_full.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    try {
      const data = JSON.parse(line);
      if (data.step_index === 3324 || data.step_index === 3336) {
        console.log(`Step ${data.step_index} | line length: ${line.length}`);
        data.tool_calls.forEach(tc => {
          if (tc.args && tc.args.CodeContent) {
            console.log(`  CodeContent length: ${tc.args.CodeContent.length}`);
          }
        });
      }
    } catch(e) {}
  });
}
