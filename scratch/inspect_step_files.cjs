const fs = require('fs');

const files = [
  'scratch/step_3176_dashboard_write.json',
  'scratch/step_3178_dashboard_write.json',
  'scratch/step_3204_dashboard_write.json',
  'scratch/step_3324_dashboard_write.json',
  'scratch/step_4644_dashboard_write.json',
  'scratch/step_4788_dashboard_write.json'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`=== ${f} ===`);
    try {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      console.log("Keys:", Object.keys(data));
      if (data.ReplacementContent) {
        console.log("ReplacementContent length:", data.ReplacementContent.length);
        console.log("Sample:", data.ReplacementContent.slice(0, 200));
      }
    } catch(e) {
      console.error(e.message);
    }
  }
});
