const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const workspaceRoot = "c:/Users/sutha/OneDrive/Desktop/kp pakse pos";
const KEY_FILE = path.resolve(workspaceRoot, './firebase-key.json');

async function main() {
  console.log("🚀 Initializing Firebase Admin to list collections...");
  if (!fs.existsSync(KEY_FILE)) {
    console.error("firebase-key.json not found!");
    return;
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  const db = getFirestore();
  
  try {
    console.log("Querying list of collections...");
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`- Collection ID: ${col.id}`);
    });
  } catch (err) {
    console.error("Failed to list collections:", err);
  }
}

main().catch(console.error);
