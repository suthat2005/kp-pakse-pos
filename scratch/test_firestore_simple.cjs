const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY_FILE = 'firebase-key.json';

if (fs.existsSync(KEY_FILE)) {
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  const db = getFirestore();
  
  db.listCollections().then(collections => {
    console.log(`=== COLLECTIONS ===`);
    collections.forEach(c => console.log(`  Collection: ${c.id}`));
    process.exit(0);
  }).catch(e => {
    console.error("Failed:", e.message);
    process.exit(1);
  });
} else {
  console.log("firebase-key.json not found!");
}
