const fs = require('fs');

const path = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json';
if (fs.existsSync(path)) {
  const db = JSON.parse(fs.readFileSync(path, 'utf8'));
  const prods = Object.values(db.products.data || db.products);
  
  console.log("=== LATEST PRODUCTS IN DATABASE ===");
  // Sort by updatedAt descending
  prods.sort((a, b) => b.updatedAt - a.updatedAt);
  
  prods.slice(0, 15).forEach(p => {
    console.log(`- ${p.id} | Name: ${p.name} | Price: ${p.price} | Stock: ${p.stock} | Updated: ${new Date(p.updatedAt).toLocaleString('th-TH')}`);
  });
} else {
  console.log("File not found!");
}
