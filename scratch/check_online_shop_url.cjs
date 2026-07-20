const http = require('https');

http.get('https://kp-pakse-suthatpospos.shop/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("=== HTTP STATUS ===");
    console.log(res.statusCode);
    console.log("=== SCRIPT TAGS IN INDEX.HTML ===");
    const regex = /<script\b[^>]*src="([^"]*)"/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log(match[0]);
    }
  });
}).on('error', (err) => {
  console.error(err);
});
