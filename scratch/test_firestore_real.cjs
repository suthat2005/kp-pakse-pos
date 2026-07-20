const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY_FILE = 'suthat-eb36a-firebase-adminsdk-fbsvc-72a3d762c4.json';

if (fs.existsSync(KEY_FILE)) {
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  const db = getFirestore();
  
  db.listCollections().then(collections => {
    console.log(`=== CLOUD COLLECTIONS ===`);
    collections.forEach(c => console.log(`  Collection: ${c.id}`));
    process.exit(0);
  }).catch(e => {
    console.error("Failed:", e.message);
    process.exit(1);
  });
} else {
  console.log("Service account file not found:", KEY_FILE);
}
