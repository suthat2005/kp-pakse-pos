const fs = require('fs');

const path = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';
if (fs.existsSync(path)) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('git checkout -- .') || line.includes('git restore .') || line.includes('git checkout')) {
      try {
        const data = JSON.parse(line);
        console.log(`Line ${idx} | step ${data.step_index} | content: ${line.slice(0, 200)}`);
      } catch(e) {}
    }
  });
}
