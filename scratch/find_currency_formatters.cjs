const fs = require('fs');

const files = [
  'src/utils/db.js',
  'src/components/POS.jsx',
  'src/components/Reports.jsx',
  'src/components/Dashboard.jsx'
];

console.log("=== SEARCHING CURRENCY FORMATTERS ===");
files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(/function\s+[a-zA-Z0-9_]*format[a-zA-Z0-9_]*|const\s+[a-zA-Z0-9_]*format[a-zA-Z0-9_]*/gi);
    console.log(`- ${f}:`, matches || "None");
  }
});
