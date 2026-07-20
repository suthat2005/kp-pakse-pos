const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Replace all occurrences of selectedWarehouseCatFilter with selectedCatFilter
  if (content.includes('selectedWarehouseCatFilter')) {
    content = content.replace(/selectedWarehouseCatFilter/g, 'selectedCatFilter');
    console.log("✅ Replaced selectedWarehouseCatFilter with selectedCatFilter!");
    fs.writeFileSync(file, content, 'utf8');
  } else {
    console.log("❌ selectedWarehouseCatFilter not found in file.");
  }
} else {
  console.log("File not found!");
}
