const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldFmtS = "const fmtS = n => {\n  n = n || 0;\n  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + 'k ₭';\n};";
  const newFmtS = "const fmtS = n => {\n  n = n || 0;\n  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + 'k';\n};";

  if (content.includes(oldFmtS)) {
    content = content.replace(oldFmtS, newFmtS);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Fixed fmtS to output only 'k' suffix, removing duplicate '₭' (which renders as 'K')!");
  } else {
    console.log("oldFmtS not found");
  }
}
