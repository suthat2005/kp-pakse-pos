const fs = require('fs');

const dbPath = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const prods = Object.values(db.products.data || db.products);
  const categories = db.categories.data || db.categories;

  const catMap = {};
  prods.forEach(p => {
    const c = p.category || 'NONE';
    catMap[c] = (catMap[c] || 0) + 1;
  });

  console.log("=== PRODUCT CATEGORY BREAKDOWN ===");
  console.log(catMap);
  console.log("\n=== KNOWN CATEGORIES IN DB ===");
  console.log(categories);
}
