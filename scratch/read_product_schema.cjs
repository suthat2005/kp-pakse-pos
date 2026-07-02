const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/utils/db.js');
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  // Look for DEFAULT_PRODUCTS or similar definitions
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('products') || line.includes('product') || line.includes('supplier') || line.includes('Supplier')) {
      if (line.length < 150) {
        console.log(`db.js:${idx + 1}: ${line.trim()}`);
      }
    }
  });
}
