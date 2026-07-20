const fs = require('fs');

const reportsFile = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Reports.jsx';
if (fs.existsSync(reportsFile)) {
  let content = fs.readFileSync(reportsFile, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldPreset = `    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'year') {`;

  const newPreset = `    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === '90days') {
      const d = new Date();
      d.setDate(d.getDate() - 89);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'year') {`;

  if (content.includes(oldPreset)) {
    content = content.replace(oldPreset, newPreset);
    fs.writeFileSync(reportsFile, content, 'utf8');
    console.log("✅ Added '90days' preset option to Reports.jsx successfully!");
  } else {
    console.log("oldPreset pattern not found in Reports.jsx");
  }
}
