const fs = require('fs');

const path = 'db_shared.json';
if (fs.existsSync(path)) {
  const db = JSON.parse(fs.readFileSync(path, 'utf8'));

  console.log("=== DB SHARED OVERVIEW ===");
  console.log("Keys in DB:", Object.keys(db));
  
  if (db.settings) {
    console.log("Settings keys:", Object.keys(db.settings));
    if (db.settings.data) {
      console.log("Settings data keys:", Object.keys(db.settings.data));
    }
  }

  if (db.slots && db.slots.data) {
    console.log("Total slots:", Object.keys(db.slots.data).length);
    const slotsWithJobs = Object.values(db.slots.data).filter(s => s.status && s.status !== 'available');
    console.log("Active slots:", slotsWithJobs.map(s => `${s.id} (${s.status})`));
  }

  if (db.framing_jobs && db.framing_jobs.data) {
    console.log("Total framing jobs:", db.framing_jobs.data.length);
    console.log("Recent 5 framing jobs:", db.framing_jobs.data.slice(-5).map(j => `${j.id} - ${j.customerName} - ${j.amuletDescription}`));
  }

  if (db.products && db.products.data) {
    console.log("Total products:", db.products.data.length);
  }

  if (db.orders && db.orders.data) {
    console.log("Total orders:", db.orders.data.length);
  }

} else {
  console.error("db_shared.json not found.");
}
