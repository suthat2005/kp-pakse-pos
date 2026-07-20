const https = require('https');
const fs = require('fs');

function getJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': 'Bearer KP-Pakse-Secret-Token-2026'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse: " + data.slice(0, 100)));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

console.log("=== FETCHING USERS FROM LIVE SERVER SYNC API ===");
getJson('https://kp-pakse-suthatpospos.shop/api/db/sync?users=0')
  .then(res => {
    if (res.users) {
      console.log("Success! Users in live database:");
      console.log(JSON.stringify(res.users, null, 2));
    } else {
      console.log("Failed. Response keys:", Object.keys(res));
      console.log("Full response:", res);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  });
