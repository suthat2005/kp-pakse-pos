// Use native global fetch

const assets = [
  'index-B_RWw4HL.js',
  'index-DOXwcrNF.css',
  'Login-BFlkAKHC.js',
  'POS-Bb8iX7x-.js',
  'Settings--OtNQCfP.js',
  'HRM-D790Xi3i.js',
  'Reports-CFWLjTr-.js'
];

async function check() {
  console.log('Checking live asset HTTP statuses...');
  for (const asset of assets) {
    const url = `https://kp-pakse-suthatpospos.shop/assets/${asset}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`- ${asset}: status ${res.status}`);
    } catch (e) {
      console.error(`- ${asset} failed to fetch:`, e.message);
    }
  }
}

check();
