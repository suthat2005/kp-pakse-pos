import https from 'https';

https.get('https://kp-pakse-suthatpospos.shop/pos', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Length:', data.length);
    console.log('Body Preview:', data.slice(0, 500));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
