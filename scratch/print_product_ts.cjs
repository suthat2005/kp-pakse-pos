const fs = require('fs');

const path = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(path)) {
  const db = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log("Products updatedAt:", db.products ? db.products.updatedAt : 'none');
  console.log("Categories updatedAt:", db.categories ? db.categories.updatedAt : 'none');
  console.log("Orders updatedAt:", db.orders ? db.orders.updatedAt : 'none');
  console.log("Debts updatedAt:", db.debts ? db.debts.updatedAt : 'none');
} else {
  console.log("File not found!");
}
