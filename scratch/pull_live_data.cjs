const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const DB_FILE = path.resolve(__dirname, '../db_shared.json');
const BACKUP_FILE = path.resolve(__dirname, '../db_shared_backup.json');
const KEY_FILE = path.resolve(__dirname, '../firebase-key.json');

async function main() {
  console.log("🚀 Starting live cloud data pull from project folder (CJS)...");
  
  if (!fs.existsSync(KEY_FILE)) {
    console.error("❌ Error: firebase-key.json is missing in the workspace root!");
    process.exit(1);
  }

  // 1. Back up existing local database file
  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
    console.log(`✓ Backed up local db_shared.json to db_shared_backup.json`);
  }

  // 2. Initialize Firebase Admin
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  const firestoreDb = getFirestore();
  console.log("✓ Firebase Admin initialized successfully!");

  // 3. Fetch all documents from pos_db collection
  console.log("☁️ Querying 'pos_db' collection from Cloud Firestore...");
  const snapshot = await firestoreDb.collection('pos_db').get();
  
  const freshDb = {};
  console.log(`✓ Retrieved ${snapshot.docs.length} documents from Firestore.`);

  for (const doc of snapshot.docs) {
    const key = doc.id;
    const docData = doc.data();
    freshDb[key] = {
      data: docData.data || [],
      updatedAt: docData.updatedAt || Date.now()
    };
    
    // Log statistics
    const recordCount = Array.isArray(docData.data) 
      ? docData.data.length 
      : (typeof docData.data === 'object' && docData.data !== null ? Object.keys(docData.data).length : 1);
    console.log(`  └─ Pulling [${key}]: ${recordCount} items / records`);
  }

  // 4. Overwrite local db_shared.json completely
  fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), 'utf8');
  console.log(`✓ Successfully updated local db_shared.json with real production data from Cloud!`);
  console.log("🎉 All mock data has been wiped and replaced with live data.");
}

main().catch(err => {
  console.error("❌ Pull failed:", err);
  process.exit(1);
});
