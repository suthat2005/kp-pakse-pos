const https = require('https');
const zlib = require('zlib');

const url = 'https://kp-pakse-suthatpospos.shop/api/production/backup';
https.get(url, (res) => {
  console.log("HTTP Status:", res.statusCode);
  console.log("Headers:", res.headers);
  let chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      console.log("Buffer length:", buffer.length);
      let jsonStr;
      try {
        jsonStr = zlib.gunzipSync(buffer).toString('utf8');
      } catch(e) {
        jsonStr = buffer.toString('utf8');
      }
      const liveDb = JSON.parse(jsonStr);

      console.log("=== LIVE CLOUD DB INSPECTION ===");
      if (liveDb.slots && liveDb.slots.data) {
        const slotsObj = liveDb.slots.data;
        const active = Object.values(slotsObj).filter(s => s.status && s.status !== 'available');
        console.log("Active slots count:", active.length);
        active.forEach(s => {
          console.log(`  - ${s.id}: status=${s.status}, customer=${s.customerName || 'N/A'}, deposit=${s.deposit || 0}, total=${s.totalPrice || 0}`);
        });
      }

    } catch (e) {
      console.error("Error parsing live backup:", e.message);
    }
  });
});
