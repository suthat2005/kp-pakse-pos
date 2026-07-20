const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

getJson('https://kp-pakse-suthatpospos.shop/api/db')
  .then(res => {
    console.log("Response:", res);
  })
  .catch(err => {
    console.error(err);
  });
