const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY_FILE = 'firebase-key.json';

if (fs.existsSync(KEY_FILE)) {
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  // We can try to list collections on database '(default)' or check if we get a different error.
  const db = getFirestore();
  db.listCollections().then(cols => {
    console.log("Success on default database! Collections:", cols.map(c => c.id));
    process.exit(0);
  }).catch(err => {
    console.error("Default DB error:", err.message);
    
    // Let's try custom database name from environment variables if any
    console.log("Searching process.env...");
    console.log(process.env);
    process.exit(1);
  });
} else {
  console.log("firebase-key.json not found!");
}
