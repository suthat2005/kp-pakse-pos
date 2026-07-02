const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/utils/db.js');
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  const match = content.match(/const DEFAULT_PRODUCTS = (\[[\s\S]*?\]);/);
  if (match) {
    console.log(match[0].slice(0, 1000));
  } else {
    console.log('Not found');
  }
}
