const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const line = lines[583]; // line 584 (0-indexed 583)
  console.log("Line 584 content:", line);
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const code = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
    console.log(`char: '${char}', hex: U+${code}`);
  }
}
