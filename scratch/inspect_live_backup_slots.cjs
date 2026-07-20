const https = require('https');
const fs = require('fs');

const url = 'https://kp-pakse-suthatpospos.shop/api/production/backup';
https.get(url, (res) => {
  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    try {
      const buffer = Buffer.concat(data);
      const zlib = require('zlib');
      const jsonStr = zlib.gunzipSync(buffer).toString('utf8');
      const liveDb = JSON.parse(jsonStr);

      console.log("=== LIVE CLOUD DB INSPECTION ===");
      if (liveDb.slots && liveDb.slots.data) {
        const slotsObj = liveDb.slots.data;
        const active = Object.values(slotsObj).filter(s => s.status && s.status !== 'available');
        console.log("Active slots count:", active.length);
        console.log("Active slots:", active.map(s => `${s.id}: ${s.status} (${s.customerName || ''})`));
      }

      if (liveDb.framing_jobs && liveDb.framing_jobs.data) {
        console.log("Total framing jobs in live cloud DB:", liveDb.framing_jobs.data.length);
      }

    } catch (e) {
      console.error("Error parsing live backup:", e.message);
    }
  });
}).on('error', err => {
  console.error("HTTP Error:", err.message);
});
