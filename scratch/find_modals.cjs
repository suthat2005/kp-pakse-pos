const fs = require('fs');
const path = require('path');

const files = [
  'src/components/POS.jsx',
  'src/components/Inventory.jsx',
  'src/components/Settings.jsx',
  'src/components/HRM.jsx',
  'src/components/AIDetector.jsx',
  'src/components/Reports.jsx',
  'src/components/Debts.jsx',
  'src/components/Login.jsx',
  'src/App.jsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('className=') && (line.includes('modal') || line.includes('Modal'))) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});
