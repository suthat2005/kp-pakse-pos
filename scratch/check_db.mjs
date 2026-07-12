import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const keyPath = path.resolve('./suthat-eb36a-firebase-adminsdk-fbsvc-72a3d762c4.json');

if (fs.existsSync(keyPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    const db = getFirestore();
    console.log("Firestore initialized successfully!");
    
    // Check db_shared collection
    db.collection('db_shared').get().then(snapshot => {
      console.log("db_shared collection documents count:", snapshot.size);
      snapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        const data = doc.data();
        if (data) {
          console.log(`- Keys in doc ${doc.id}:`, Object.keys(data));
          // If the document contains database keys
          for (const [k, v] of Object.entries(data)) {
            console.log(`  * ${k}: size/length:`, JSON.stringify(v).length);
          }
        }
      });
    }).catch(err => {
      console.error("Error reading db_shared collection:", err);
    });

  } catch (e) {
    console.error("Initialization error:", e);
  }
} else {
  console.log("Firebase key file not found");
}
