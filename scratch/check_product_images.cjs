const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(file)) {
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log("=== DB KEYS ===");
  console.log(Object.keys(db));
  if (db.products) {
    console.log("=== products keys ===");
    console.log(Object.keys(db.products));
    const data = db.products.data || db.products;
    if (Array.isArray(data)) {
      console.log("products count:", data.length);
      data.forEach(p => {
        if (p.price === null || p.price === undefined || p.priceOnline === null || p.priceVip === null || p.priceVip === undefined) {
          console.log(`Product: ID=${p.id}, Name=${p.name}, price=${p.price}, priceOnline=${p.priceOnline}, priceVip=${p.priceVip}`);
        }
      });
    }
  }
} else {
  console.log("Database file not found!");
}
