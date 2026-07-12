import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./db_shared.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const debts = db.debts?.data || db.debts || [];
  console.log(`Total debts in db_shared.json: ${debts.length}`);
  debts.forEach(d => {
    console.log(`- ID: ${d.id}, Customer: ${d.customerName}, Total: ${d.total}, Status: ${d.status}, Date: ${d.date}`);
  });
} else {
  console.log("db_shared.json not found!");
}
