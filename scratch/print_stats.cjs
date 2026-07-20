const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== CHECKING ONLINE ORDERS IN DB ===");
  const orders = db.online_orders?.data || db.online_orders || [];
  if (Array.isArray(orders)) {
    orders.forEach(o => {
      if (o.total === null || o.total === undefined) {
        console.log(`Order: ID=${o.id}, customerId=${o.customerId}, total=${o.total}`);
      }
    });
  }
} else {
  console.log("Database file not found!");
}
