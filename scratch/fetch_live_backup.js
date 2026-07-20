const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const DB_FILE = path.resolve("c:/Users/sutha/OneDrive/Desktop/kp pakse pos/db_shared.json");
const BACKUP_FILE = path.resolve("c:/Users/sutha/OneDrive/Desktop/kp pakse pos/db_shared_backup.json");
const LIVE_URL = "https://kp-pakse-suthatpospos.shop/api/production/backup";

async function main() {
  console.log(`🚀 Fetching live database backup from: ${LIVE_URL}`);

  // Backup local database file
  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
    console.log(`✓ Backed up local db_shared.json to db_shared_backup.json`);
  }

  const chunks = [];
  https.get(LIVE_URL, { rejectUnauthorized: false }, (res) => {
    if (res.statusCode !== 200) {
      console.error(`❌ HTTP error! Status: ${res.statusCode}`);
      process.exit(1);
    }

    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log(`✓ Downloaded ${buffer.length} bytes of compressed database.`);
      
      try {
        const decompressed = zlib.gunzipSync(buffer);
        const parsed = JSON.parse(decompressed.toString('utf8'));
        
        // Save to local db_shared.json
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');
        console.log(`✓ Successfully updated db_shared.json with production database!`);
        
        // Print tables
        for (const [key, val] of Object.entries(parsed)) {
          const count = Array.isArray(val.data) 
            ? val.data.length 
            : (typeof val.data === 'object' && val.data !== null ? Object.keys(val.data).length : 1);
          console.log(`   └─ Table [${key}]: ${count} records`);
        }
      } catch (err) {
        console.error("❌ Failed to decompress/parse the downloaded backup:", err);
      }
    });
  }).on('error', (err) => {
    console.error("❌ HTTPS request failed:", err);
  });
}

main().catch(err => {
  console.error("❌ Unexpected error:", err);
});
