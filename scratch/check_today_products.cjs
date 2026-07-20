const fs = require('fs');

const path = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(path)) {
  const db = JSON.parse(fs.readFileSync(path, 'utf8'));
  const prods = db.products.data || db.products;
  const list = Object.values(prods);
  
  console.log("Total products:", list.length);
  
  // Local time today 04:00 AM is 21:00 UTC yesterday = epoch 1784497200000
  // Local time today 05:00 AM is 22:00 UTC yesterday = epoch 1784500800000
  const after4 = list.filter(p => p.updatedAt >= 1784497200000);
  console.log(`Products updated after 04:00 AM today (count: ${after4.length}):`);
  after4.forEach(p => {
    console.log(`  - ID: ${p.id} | Name: ${p.name} | Price: ${p.price} | UpdatedAt: ${new Date(p.updatedAt).toISOString()}`);
  });
} else {
  console.log("File not found!");
}
