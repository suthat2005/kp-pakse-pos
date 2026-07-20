const fs = require('fs');
const path = require('path');

const dir = 'scratch';
const files = fs.readdirSync(dir).filter(f => f.startsWith('step_') && f.endsWith('.json'));

files.forEach(f => {
  const full = path.join(dir, f);
  try {
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    console.log(`${f} -> TargetFile: ${data.TargetFile || data.TargetFile} | keys: ${Object.keys(data).join(',')}`);
    if (data.ReplacementChunks) {
      console.log(`   Chunks count: ${data.ReplacementChunks.length}`);
      data.ReplacementChunks.forEach((c, idx) => {
        console.log(`     Chunk ${idx}: lines [${c.StartLine} - ${c.EndLine}]`);
      });
    }
  } catch(e) {
    console.error(`Error reading ${f}:`, e.message);
  }
});
