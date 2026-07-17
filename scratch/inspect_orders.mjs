import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./db_shared.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const orders = db.orders?.data || [];
  console.log(`Total orders in db_shared.json: ${orders.length}`);
  orders.slice(-10).forEach(o => {
    console.log(`- ID: ${o.id}, Date: ${o.date}, Total: ${o.total}, PaymentMethod: ${o.paymentMethod}, CustomerName: ${o.customerName}`);
  });
} else {
  console.log("db_shared.json not found!");
}
