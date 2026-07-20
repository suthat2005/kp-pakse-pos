const { execSync } = require('child_process');
const fs = require('fs');

console.log("Searching git dangling blobs for database keys...");

try {
  // Get all dangling blobs
  const output = execSync('git fsck --lost-found').toString('utf8');
  const blobs = [];
  output.split('\n').forEach(line => {
    if (line.startsWith('dangling blob')) {
      blobs.push(line.split(' ')[2].trim());
    }
  });
  
  console.log(`Found ${blobs.length} dangling blobs.`);
  
  blobs.forEach(b => {
    try {
      const content = execSync(`git show ${b}`).toString('utf8');
      if (content.includes('slots') && content.includes('products') && content.includes('categories')) {
        const size = content.length;
        const data = JSON.parse(content);
        
        function countItems(obj) {
          if (!obj) return 0;
          if (obj.data) return Object.keys(obj.data).length;
          return Object.keys(obj).length;
        }
        
        console.log(`FOUND DB BLOB: ${b}`);
        console.log(`  Size: ${size} chars`);
        console.log(`  Products: ${countItems(data.products)} | Orders: ${countItems(data.orders)} | Debts: ${countItems(data.debts)} | Framing: ${countItems(data.framing_jobs)} | Customers: ${countItems(data.customers)}`);
      }
    } catch(e) {}
  });
} catch(e) {
  console.error("Git fsck failed:", e.message);
}
