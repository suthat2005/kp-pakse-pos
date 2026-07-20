const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const KEY_FILE = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\firebase-key.json';

if (fs.existsSync(KEY_FILE)) {
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  const firestoreDb = getFirestore();
  
  console.log("☁️ Listing documents in 'pos_db' collection...");
  
  firestoreDb.collection('pos_db').listDocuments()
    .then(docs => {
      console.log("=== FIRESTORE DOCUMENTS ===");
      docs.forEach(doc => {
        console.log(`  - Doc ID: ${doc.id}`);
      });
      process.exit(0);
    })
    .catch(err => {
      console.error("Error listing documents:", err);
      process.exit(1);
    });
} else {
  console.log("firebase-key.json not found!");
}
