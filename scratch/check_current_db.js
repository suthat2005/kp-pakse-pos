const fs = require('fs');
const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("products.data is array?", Array.isArray(db.products.data));
  console.log("products.data type:", typeof db.products.data);
  console.log("products.data length/keys:", Array.isArray(db.products.data) ? db.products.data.length : Object.keys(db.products.data).length);
}
