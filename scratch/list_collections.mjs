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
    
    db.listCollections().then(collections => {
      console.log("Collections list:");
      collections.forEach(col => {
        console.log(`- Collection ID: ${col.id}`);
      });
    }).catch(err => {
      console.error("Error listing collections:", err);
    });

  } catch (e) {
    console.error("Initialization error:", e);
  }
} else {
  console.log("Firebase key file not found");
}
