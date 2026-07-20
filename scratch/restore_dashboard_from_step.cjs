const fs = require('fs');

const stepFile = 'scratch/step_4644_dashboard_write.json';
const dashboardFile = 'src/components/Dashboard.jsx';

if (fs.existsSync(stepFile) && fs.existsSync(dashboardFile)) {
  const step = JSON.parse(fs.readFileSync(stepFile, 'utf8'));
  let content = fs.readFileSync(dashboardFile, 'utf8');

  content = content.replace(/\r\n/g, '\n');
  const target = step.TargetContent.replace(/\r\n/g, '\n');
  const replacement = step.ReplacementContent.replace(/\r\n/g, '\n');

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(dashboardFile, content, 'utf8');
    console.log("✓ Successfully restored Dashboard.jsx with Custom Date Selector from step_4644!");
  } else {
    console.log("Target string not found in Dashboard.jsx. Overwriting directly from step replacement...");
    // Let's check where export default function Dashboard is in Dashboard.jsx
    const parts = content.split('export default function Dashboard');
    if (parts.length > 1) {
      const newContent = parts[0] + replacement;
      fs.writeFileSync(dashboardFile, newContent, 'utf8');
      console.log("✓ Successfully replaced Dashboard component with Custom Date Selector!");
    } else {
      console.error("Could not find export default function Dashboard in Dashboard.jsx");
    }
  }

} else {
  console.error("Step file or Dashboard file missing.");
}
