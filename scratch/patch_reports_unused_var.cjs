const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Reports.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldDecl = "  const handleClearFilters = () => {";
  const newDecl = "  const _handleClearFilters = () => {";

  if (content.includes(oldDecl)) {
    content = content.replace(oldDecl, newDecl);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Renamed handleClearFilters to _handleClearFilters to avoid unused warning!");
  } else {
    console.log("oldDecl not found");
  }
}
