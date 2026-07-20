const fs = require('fs');

const path = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared_backup.json';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  console.log("File length:", content.length);
  console.log("Start of content:", content.slice(0, 300));
  try {
    const data = JSON.parse(content);
    console.log("Type of data:", typeof data);
    console.log("Is array:", Array.isArray(data));
    console.log("Keys:", Object.keys(data));
    if (data.products) {
      console.log("products type:", typeof data.products);
      console.log("products length:", data.products.length || Object.keys(data.products).length);
    }
  } catch(e) {
    console.error("JSON parse error:", e.message);
  }
} else {
  console.log("File not found:", path);
}
