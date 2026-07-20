const fs = require('fs');

const topics = [
  { name: '1. Inventory Management', file: 'src/components/Inventory.jsx' },
  { name: '2. Framing Queue Board', file: 'src/components/FramingBoard.jsx' },
  { name: '3. Reports System', file: 'src/components/Reports.jsx' },
  { name: '4. System Settings', file: 'src/components/Settings.jsx' },
  { name: '5. Customer Management', file: 'src/components/Customers.jsx' }
];

console.log("=== VERIFYING 5 MAIN SECTIONS (19/7 19:05 - 20/7 04:57) ===");
topics.forEach(t => {
  if (fs.existsSync(t.file)) {
    const stat = fs.statSync(t.file);
    console.log(`✅ ${t.name}: File exists | Size: ${stat.size} bytes | Modified: ${stat.mtime.toLocaleString('th-TH')}`);
  } else {
    console.log(`❌ ${t.name}: File missing!`);
  }
});
