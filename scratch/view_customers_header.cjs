const fs = require('fs');

const file = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src/components/Customers.jsx';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.slice(510, 615).forEach((line, idx) => {
    console.log(`Line ${idx + 511}: ${line}`);
  });
}
