const fs = require('fs');

const dbC = JSON.parse(fs.readFileSync('C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\db_shared.json', 'utf8'));
const dbD = JSON.parse(fs.readFileSync('D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\db_shared.json', 'utf8'));

function compareTable(name) {
  const cData = dbC[name] ? (dbC[name].data || dbC[name]) : {};
  const dData = dbD[name] ? (dbD[name].data || dbD[name]) : {};
  const cKeys = Object.keys(cData);
  const dKeys = Object.keys(dData);
  
  console.log(`=== Table: ${name} ===`);
  console.log(`  C key count: ${cKeys.length} | D key count: ${dKeys.length}`);
  
  const inCNotD = cKeys.filter(k => !dKeys.includes(k));
  const inDNotC = dKeys.filter(k => !cKeys.includes(k));
  
  if (inCNotD.length > 0) {
    console.log(`  Keys in C but not D: ${inCNotD.slice(0, 5).join(', ')} (total ${inCNotD.length})`);
  }
  if (inDNotC.length > 0) {
    console.log(`  Keys in D but not C: ${inDNotC.slice(0, 5).join(', ')} (total ${inDNotC.length})`);
  }
}

['products', 'orders', 'debts', 'framing_jobs', 'customers', 'online_orders', 'settings'].forEach(compareTable);
