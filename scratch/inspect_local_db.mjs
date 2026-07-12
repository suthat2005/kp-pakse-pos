import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./db_shared.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log("Local db_shared.json settings key data:");
  console.log("Keys in db:", Object.keys(db));
  if (db.settings) {
    console.log("Settings updatedAt:", db.settings.updatedAt);
    console.log("Settings data keys:", Object.keys(db.settings.data || {}));
    console.log("ShopName:", db.settings.data?.shopName);
    console.log("TelegramChatId:", db.settings.data?.telegramChatId);
    console.log("exchangeRateThb:", db.settings.data?.exchangeRateThb);
    console.log("exchangeRateUsd:", db.settings.data?.exchangeRateUsd);
  } else {
    console.log("settings key does NOT exist in db_shared.json!");
  }
} else {
  console.log("db_shared.json not found!");
}
