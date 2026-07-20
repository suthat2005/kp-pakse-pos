const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript_full.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  console.log("Searching previous session for checkout/reset...");
  
  lines.forEach((line, idx) => {
    if (line.includes('CommandLine') && (line.includes('checkout') || line.includes('reset') || line.includes('clean'))) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.name === 'run_command' && tc.args && tc.args.CommandLine) {
              console.log(`Line ${idx} (${obj.step_index}): Cwd: ${tc.args.Cwd} | Cmd: ${tc.args.CommandLine}`);
            }
          });
        }
      } catch(e) {}
    }
  });
}
