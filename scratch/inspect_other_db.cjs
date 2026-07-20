const fs = require('fs');

const path = 'D:\\kp pakse pos\\db_shared.json';
if (fs.existsSync(path)) {
  try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    console.log("=== KEY SIZES ===");
    Object.keys(data).forEach(k => {
      const len = data[k] ? JSON.stringify(data[k]).length : 0;
      console.log(`Key [${k}]: size=${len} chars`);
    });
  } catch(e) {
    console.error("Error:", e.message);
  }
} else {
  console.log("File not found:", path);
}
