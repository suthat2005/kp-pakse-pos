const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Use transcript_full.jsonl for untruncated content
const transcriptPath = 'C:\\Users\\sutha\\.gemini\\antigravity\\brain\\7a4b17e5-577a-4db8-be7b-98b2978bddd4\\.system_generated\\logs\\transcript_full.jsonl';

function applyReplacement(content, target, replacement, label) {
  const index = content.indexOf(target);
  if (index === -1) {
    // Try normalized whitespace/newline matches
    const normContent = content.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
    const normTarget = target.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
    const normIndex = normContent.indexOf(normTarget);
    if (normIndex !== -1) {
      console.log(`[Normalized Match] Applied replacement for ${label}`);
      const escaped = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(escaped);
      const match = content.match(regex);
      if (match) {
        console.log(`[Regex Match] Applied replacement for ${label}`);
        return content.replace(regex, replacement);
      }
    }
    throw new Error(`Target content not found for replacement: ${label}`);
  }
  const before = content.slice(0, index);
  const after = content.slice(index + target.length);
  return before + replacement + after;
}

function restoreFileAtStep(filePath, maxStep) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  console.log(`\n--- Restoring ${relPath} up to step ${maxStep} ---`);
  
  // Start with clean content from git commit 73950d5
  let content = execSync(`git show 73950d5:${relPath}`).toString('utf8');
  
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  
  lines.forEach((line, lineIdx) => {
    if (!line.trim()) return;
    try {
      const data = JSON.parse(line);
      if (data.step_index >= maxStep) return;
      
      if (data.source === 'MODEL' && data.tool_calls) {
        data.tool_calls.forEach(tc => {
          const args = tc.args;
          if (!args || !args.TargetFile) return;
          
          const targetFileNorm = path.resolve(args.TargetFile.replace(/^["']|["']$/g, '')).replace(/\\/g, '/').toLowerCase();
          const expectedFileNorm = path.resolve(filePath).replace(/\\/g, '/').toLowerCase();
          
          if (targetFileNorm === expectedFileNorm) {
            console.log(`[Step ${data.step_index}] Tool: ${tc.name} | ${args.Description || args.Instruction || ''}`);
            if (tc.name === 'write_to_file') {
              content = args.CodeContent.replace(/^["']|["']$/g, '');
              console.log(`  -> Reset file content via write_to_file (size: ${content.length} bytes)`);
            } else if (tc.name === 'replace_file_content') {
              const target = args.TargetContent;
              const replacement = args.ReplacementContent;
              content = applyReplacement(content, target, replacement, `Step ${data.step_index} replace`);
            } else if (tc.name === 'multi_replace_file_content') {
              let chunks = args.ReplacementChunks;
              if (typeof chunks === 'string') {
                chunks = JSON.parse(chunks);
              }
              const sortedChunks = [...chunks].sort((a, b) => b.StartLine - a.StartLine);
              sortedChunks.forEach((chunk, chunkIdx) => {
                const target = chunk.TargetContent;
                const replacement = chunk.ReplacementContent;
                content = applyReplacement(content, target, replacement, `Step ${data.step_index} multi-chunk ${chunkIdx}`);
              });
            }
          }
        });
      }
    } catch(e) {
      console.error(`Error processing line ${lineIdx} in transcript (step ${e.step_index || 'unknown'}):`, e.message);
    }
  });
  
  console.log(`Final size: ${content.length} bytes`);
  return content;
}

const filesToRestore = [
  { path: 'src/App.jsx', out: 'src/App.jsx' },
  { path: 'src/components/Dashboard.jsx', out: 'src/components/Dashboard.jsx' },
  { path: 'src/components/Reports.jsx', out: 'src/components/Reports.jsx' }
];

filesToRestore.forEach(f => {
  try {
    const restoredCode = restoreFileAtStep(path.resolve(f.path), 5305);
    fs.writeFileSync(f.out, restoredCode, 'utf8');
    console.log(`✓ Successfully restored and wrote ${f.out}`);
  } catch(e) {
    console.error(`❌ Failed to restore ${f.path}:`, e.message);
  }
});
