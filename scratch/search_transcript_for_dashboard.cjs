const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:/Users/sutha/.gemini/antigravity/brain/7a4b17e5-577a-4db8-be7b-98b2978bddd4/.system_generated/logs/transcript_full.jsonl';

async function search() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    // We search for write_to_file or replace_file_content tool calls for Dashboard.jsx
    if (line.includes('Dashboard.jsx') && (line.includes('write_to_file') || line.includes('replace_file_content'))) {
      try {
        const obj = JSON.parse(line);
        console.log(`Line ${lineCount}: index=${obj.step_index}, type=${obj.type}, status=${obj.status}`);
        
        // Let's inspect the tool calls
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
              console.log(`  Tool: ${tc.name}`);
              console.log(`  Args keys: ${Object.keys(tc.args || {})}`);
              if (tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('Dashboard.jsx')) {
                console.log(`  Found target Dashboard.jsx write/replace!`);
                // Let's write the details to a temp file
                fs.writeFileSync(`scratch/step_${obj.step_index}_dashboard_write.json`, JSON.stringify(tc.args, null, 2));
              }
            }
          }
        }
      } catch (err) {
        // Ignore JSON parsing errors for huge lines
      }
    }
  }
  console.log('Search finished.');
}

search();
