const fs = require('fs');
const path = require('path');

const masterDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos';
const backupDir = path.join(masterDir, 'backups', `master_snapshot_${Date.now()}`);

console.log("=== CONSOLIDATING SINGLE MASTER PROJECT ===");
console.log("Master Directory:", masterDir);

// 1. Create a timestamped backup inside backups/ folder
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Save master db_shared.json snapshot
const dbPath = path.join(masterDir, 'db_shared.json');
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, path.join(backupDir, 'db_shared.json'));
  console.log("✓ Saved master db_shared.json backup to:", path.join(backupDir, 'db_shared.json'));
}

// 2. Verify all core files in master project
const requiredFiles = [
  'src/App.jsx',
  'src/index.css',
  'src/App.css',
  'src/main.jsx',
  'src/utils/db.js',
  'src/components/POS.jsx',
  'src/components/Reports.jsx',
  'src/components/Customers.jsx',
  'src/components/HRM.jsx',
  'src/components/Dashboard.jsx',
  'src/components/Inventory.jsx',
  'src/components/OnlineShop.jsx',
  'src/components/OnlineShopSettings.jsx',
  'src/components/OrderTracking.jsx',
  'src/components/Portal.jsx',
  'src/components/AIDetector.jsx',
  'src/components/AmuletImageEditor.jsx',
  'src/components/Debts.jsx',
  'src/components/FramingBoard.jsx',
  'src/components/Login.jsx',
  'src/components/OnlineOrders.jsx',
  'src/components/Settings.jsx',
  'src/components/ModernIcon.jsx',
  'server.js',
  'vite.config.js',
  'package.json',
  'index.html',
  'db_shared.json'
];

let missing = 0;
requiredFiles.forEach(rel => {
  const full = path.join(masterDir, rel);
  if (!fs.existsSync(full)) {
    console.error(`❌ MISSING FILE: ${rel}`);
    missing++;
  } else {
    const stat = fs.statSync(full);
    console.log(`✓ [OK] ${rel} (${stat.size} bytes)`);
  }
});

if (missing === 0) {
  console.log("\n✅ ALL REQUIRED FILES ARE 100% PRESENT IN SINGLE MASTER PROJECT!");
} else {
  console.error(`\n❌ ${missing} files missing!`);
}
