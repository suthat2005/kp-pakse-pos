const fs = require('fs');

const hrmFile = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src/components/HRM.jsx';
if (fs.existsSync(hrmFile)) {
  let content = fs.readFileSync(hrmFile, 'utf8').replace(/\r\n/g, '\n');
  content = content
    .replace('✓ ອະນຸມັດ', 'ອະນຸມັດ')
    .replace('✕ ປະຕິເສດ', 'ປະຕິເສດ');
  fs.writeFileSync(hrmFile, content.replace(/\n/g, '\r\n'), 'utf8');
  console.log("✓ Final HRM.jsx button labels cleaned!");
}
