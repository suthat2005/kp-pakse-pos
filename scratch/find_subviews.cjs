const fs = require('fs');
const path = require('path');

const file = 'src/components/Inventory.jsx';
const filePath = path.join(process.cwd(), file);
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('function RawMaterialsSubView') || line.includes('const RawMaterialsSubView') || line.includes('function ManufacturingSubView') || line.includes('const ManufacturingSubView')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
}
