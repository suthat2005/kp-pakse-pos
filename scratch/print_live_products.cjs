const fs = require('fs');
const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  const products = Object.values(db.products.data);
  console.log(`Total Products in db_shared.json: ${products.length}`);
  console.log("Sample of first 5 products:");
  console.log(JSON.stringify(products.slice(0, 5), null, 2));
}
