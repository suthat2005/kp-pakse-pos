const https = require('https');
const zlib = require('zlib');

const url = 'https://kp-pakse-suthatpospos.shop/api/production/backup';
const options = {
  headers: {
    'Authorization': 'Bearer KP-Pakse-Secret-Token-2026'
  }
};

https.get(url, options, (res) => {
  let chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const decompressed = zlib.gunzipSync(buffer);
      const liveDb = JSON.parse(decompressed.toString('utf8'));

      console.log("=== LIVE CLOUD DB INSPECTION ===");
      if (liveDb.slots && liveDb.slots.data) {
        const slotsObj = liveDb.slots.data;
        const active = Object.values(slotsObj).filter(s => s.status && s.status !== 'available');
        console.log("Active slots count in Cloud DB:", active.length);
        active.forEach(s => {
          console.log(`  - ${s.id}: status=${s.status}, customer=${s.customerName || 'N/A'}, deposit=${s.deposit || 0}, total=${s.totalPrice || 0}`);
        });
      }

    } catch (e) {
      console.error("Error parsing live backup:", e.message);
    }
  });
});
