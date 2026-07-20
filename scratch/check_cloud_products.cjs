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
  
  db.collection('pos_db').get().then(snapshot => {
    console.log(`=== CLOUD DOCUMENTS (${snapshot.docs.length}) ===`);
    snapshot.forEach(doc => {
      const val = doc.data();
      const count = val.data ? (Array.isArray(val.data) ? val.data.length : Object.keys(val.data).length) : 0;
      console.log(`  Doc: ${doc.id} | Items count: ${count} | UpdatedAt: ${val.updatedAt}`);
    });
    process.exit(0);
  }).catch(e => {
    console.error("Failed:", e.message);
    process.exit(1);
  });
} else {
  console.log("firebase-key.json not found!");
}
