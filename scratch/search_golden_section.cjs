const fs = require('fs');

const dPathAlt = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\src\\components\\Dashboard.jsx';
if (fs.existsSync(dPathAlt)) {
  const content = fs.readFileSync(dPathAlt, 'utf8');
  console.log("Section occurrences in golden:", content.match(/Section/gi) || "None");
} else {
  console.log("Golden not found");
}
