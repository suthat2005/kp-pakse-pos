import https from 'https';

const getUrl = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
  }).on('error', reject);
});

async function run() {
  try {
    console.log('Fetching index.html...');
    const indexRes = await getUrl('https://kp-pakse-suthatpospos.shop/pos');
    console.log('HTML Status:', indexRes.statusCode);
    
    // Find script src
    const html = indexRes.body;
    const match = html.match(/src="([^"]+\.js)"/);
    if (!match) {
      console.log('No script tag found matching src="...js"');
      // Let's print the full HTML
      console.log('HTML Body:', html);
      return;
    }
    
    const jsPath = match[1];
    console.log('Found JS asset path:', jsPath);
    
    const jsUrl = `https://kp-pakse-suthatpospos.shop${jsPath}`;
    console.log(`Fetching JS bundle from: ${jsUrl}`);
    
    const jsRes = await getUrl(jsUrl);
    console.log('JS Status Code:', jsRes.statusCode);
    console.log('JS Content Length:', jsRes.body.length);
    console.log('JS Headers:', jsRes.headers);
    if (jsRes.statusCode !== 200) {
      console.log('JS Content:', jsRes.body);
    }
  } catch (e) {
    console.error('Failed:', e);
  }
}

run();
