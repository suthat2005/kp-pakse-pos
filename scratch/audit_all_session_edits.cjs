const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(transcriptPath)) {
  console.log("Transcript not found:", transcriptPath);
  process.exit(1);
}

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let userPrompts = [];
let toolEdits = [];

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      userPrompts.push({
        step: obj.step_index,
        content: typeof obj.content === 'string' ? obj.content.substring(0, 300) : JSON.stringify(obj.content).substring(0, 300)
      });
    } else if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'write_to_file') {
          toolEdits.push({
            step: obj.step_index,
            tool: tc.name,
            file: tc.args?.TargetFile || tc.args?.targetFile
          });
        }
      });
    }
  } catch(e) {}
});

rl.on('close', () => {
  console.log("=== ALL USER PROMPTS IN CONVERSATION ===");
  userPrompts.forEach(p => console.log(`Step ${p.step}: ${p.content.replace(/\n/g, ' ')}`));
  console.log("\nTotal edits logged:", toolEdits.length);
});
