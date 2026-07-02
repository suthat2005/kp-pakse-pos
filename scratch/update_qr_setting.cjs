const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../db_shared.json');
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (db.settings && db.settings.data) {
    db.settings.data.bankAccountName = 'LEYUNG (ເລຍຸງ)';
    db.settings.data.bankAccountNumber = 'Merchant: mch64f01defcb310';
    db.settings.data.bankQrTemplate = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021115312031041800520446mch64f01defcb3138590016A00526628466257701082771041802030020316mch64f01defcb3105204593253034185802LA5907 LEYUNG6002CH62200716stk6875cb2f6de946304B423';
    db.settings.updatedAt = Date.now();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('✓ Successfully updated bank QR code template in db_shared.json!');
  } else {
    console.log('Error: settings.data not found in db_shared.json');
  }
} else {
  console.log('Error: db_shared.json not found');
}
