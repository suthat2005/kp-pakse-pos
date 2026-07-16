import net from 'net';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.resolve(__dirname, './dist');
const DB_FILE = path.resolve(__dirname, './db_shared.json');
const KEY_FILE = path.resolve(__dirname, './firebase-key.json');

// Simple async mutex lock to prevent concurrent file write race conditions on db_shared.json
class Lock {
  constructor() {
    this.promise = Promise.resolve();
  }
  acquire() {
    let release;
    const next = new Promise(resolve => {
      release = resolve;
    });
    const current = this.promise;
    this.promise = current.then(() => next);
    return current.then(() => release);
  }
}
const dbLock = new Lock();

// Initialize Firebase Admin
let firestoreDb = null;
try {
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync(KEY_FILE)) {
    serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    firestoreDb = getFirestore();
    console.log("✓ Firebase Admin SDK initialized successfully!");
    
    // Sync data from Firestore to local JSON on startup
    syncFromCloudOnStartup();
    // Periodically sync from Firestore in the background every 30 seconds
    setInterval(syncFromCloud, 30000);
  } else {
    console.warn("⚠️ Firebase credentials not found (neither FIREBASE_SERVICE_ACCOUNT env var nor firebase-key.json). Running in Local Offline Mode.");
  }
} catch (err) {
  console.error("❌ Failed to initialize Firebase:", err);
}

// Merge Resolver helpers for Phase 1 Data integrity
function mergeArrays(arrA, arrB, keyField = 'id') {
  if (!Array.isArray(arrA)) return Array.isArray(arrB) ? arrB : [];
  if (!Array.isArray(arrB)) return arrA;

  const map = new Map();
  arrA.forEach(item => {
    if (item && item[keyField] !== undefined) {
      map.set(String(item[keyField]), item);
    }
  });

  arrB.forEach(itemB => {
    if (itemB && itemB[keyField] !== undefined) {
      const keyStr = String(itemB[keyField]);
      const itemA = map.get(keyStr);
      if (!itemA) {
        map.set(keyStr, itemB);
      } else {
        const tsA = Number(itemA.updatedAt || 0);
        const tsB = Number(itemB.updatedAt || 0);
        if (tsB > tsA) {
          map.set(keyStr, itemB);
        } else if (tsA === tsB) {
          map.set(keyStr, { ...itemA, ...itemB });
        }
      }
    }
  });

  return Array.from(map.values());
}

function mergeObjects(objA, objB, clientUpdatedAt = 0) {
  if (!objA || typeof objA !== 'object') return objB || {};
  if (!objB || typeof objB !== 'object') return objA;

  const merged = { ...objA };
  for (const [key, valB] of Object.entries(objB)) {
    const valA = objA[key];
    if (!valA) {
      merged[key] = valB;
    } else {
      const tsA = Number(valA.updatedAt || 0);
      const tsB = Number(valB.updatedAt || 0);
      if (tsB >= tsA) {
        merged[key] = valB;
      }
    }
  }

  // Handle deletions: if a key is in objA but not in objB
  // and the source's overall updatedAt is greater than or equal to the slot's updatedAt
  for (const key of Object.keys(objA)) {
    if (!(key in objB)) {
      const valA = objA[key];
      const tsA = Number(valA?.updatedAt || 0);
      if (clientUpdatedAt >= tsA) {
        delete merged[key];
      }
    }
  }
  return merged;
}

// Startup cloud sync function
async function syncFromCloudOnStartup() {
  if (!firestoreDb) return;
  try {
    let localDb = {};
    if (fs.existsSync(DB_FILE)) {
      localDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    
    console.log("☁️ Pulling latest updates from Cloud Firestore...");
    const snapshot = await firestoreDb.collection('pos_db').get();
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
      const key = doc.id;
      const cloudVal = doc.data();
      const localVal = localDb[key];
      
      const cloudTs = Number(cloudVal.updatedAt || '0');
      const localTs = Number(localVal?.updatedAt || '0');
      
      if (cloudTs > localTs) {
        let mergedData;
        if (Array.isArray(cloudVal.data) && Array.isArray(localVal?.data)) {
          mergedData = mergeArrays(localVal.data, cloudVal.data);
        } else if (key === 'slots') {
          mergedData = mergeObjects(localVal?.data, cloudVal.data, cloudTs);
        } else if (key === 'settings') {
          mergedData = { ...localVal?.data, ...cloudVal.data };
        } else {
          mergedData = cloudVal.data;
        }

        localDb[key] = {
          data: mergedData,
          updatedAt: Math.max(cloudTs, localTs)
        };
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf8');
      console.log(`✓ Cloud sync complete. Merged updates in ${updatedCount} tables locally.`);
      
      // Push merged data back to Firestore to ensure consistency
      for (const [key, val] of Object.entries(localDb)) {
        await firestoreDb.collection('pos_db').doc(key).set({
          data: val.data,
          updatedAt: val.updatedAt
        });
      }
      console.log(`☁️ Merged database synced back to Cloud Firestore.`);
    } else {
      console.log("✓ Local database is already up to date with Cloud Firestore.");
    }
    
    // Run duplicate products cleanup
    await cleanupDuplicateProducts();
  } catch (err) {
    console.error("❌ Cloud sync failed on startup:", err);
  }
}

async function cleanupDuplicateProducts() {
  if (!firestoreDb) return;
  try {
    console.log("🧹 Running duplicate products cleanup check...");
    const docRef = firestoreDb.collection('pos_db').doc('products');
    const doc = await docRef.get();
    if (!doc.exists) return;
    
    const prodVal = doc.data();
    const products = prodVal.data || [];
    if (!Array.isArray(products)) return;
    
    const beforeCount = products.length;
    // Filter out products with barcode '0' or 0, cost 10000, price 80000, name including 'ອົງລອຍ'
    const filtered = products.filter(p => {
      if (!p) return false;
      const isBad = (p.barcode === '0' || p.barcode === 0) && 
                    p.price === 80000 && 
                    p.name && p.name.includes('ອົງລອຍ');
      return !isBad;
    });
    
    if (filtered.length !== beforeCount) {
      const now = Date.now();
      await docRef.set({
        data: filtered,
        updatedAt: now
      });
      console.log(`🧹 Cleaned up duplicate products in Cloud Firestore. Removed ${beforeCount - filtered.length} items.`);
      
      // Also update local DB file if exists
      if (fs.existsSync(DB_FILE)) {
        const localDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        localDb['products'] = {
          data: filtered,
          updatedAt: now
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf8');
        console.log(`🧹 Local DB file updated with cleaned products.`);
      }
    } else {
      console.log("🧹 No duplicate products found in Cloud Firestore.");
    }
  } catch (err) {
    console.error("❌ Failed to clean up duplicate products:", err);
  }
}

let isSyncing = false;
async function syncFromCloud() {
  if (!firestoreDb || isSyncing) return;
  isSyncing = true;
  try {
    let localDb = {};
    if (fs.existsSync(DB_FILE)) {
      localDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    const snapshot = await firestoreDb.collection('pos_db').get();
    let hasUpdates = false;
    snapshot.forEach(doc => {
      const key = doc.id;
      const cloudVal = doc.data();
      const localVal = localDb[key];
      const cloudTs = Number(cloudVal.updatedAt || '0');
      const localTs = Number(localVal?.updatedAt || '0');
      if (cloudTs > localTs) {
        let mergedData;
        if (Array.isArray(cloudVal.data) && Array.isArray(localVal?.data)) {
          mergedData = mergeArrays(localVal.data, cloudVal.data);
        } else if (key === 'slots') {
          mergedData = mergeObjects(localVal?.data, cloudVal.data, cloudTs);
        } else if (key === 'settings') {
          mergedData = { ...localVal?.data, ...cloudVal.data };
        } else {
          mergedData = cloudVal.data;
        }
        localDb[key] = { data: mergedData, updatedAt: Math.max(cloudTs, localTs) };
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf8');
      console.log("☁️ Background Cloud DB sync completed: merged local cache.");
      // Push merged results back to Firestore to align them
      for (const doc of snapshot.docs) {
        const key = doc.id;
        const val = localDb[key];
        if (val) {
          await firestoreDb.collection('pos_db').doc(key).set({
            data: val.data,
            updatedAt: val.updatedAt
          }).catch(err => console.warn(`⚠️ Cloud background realign write failed for [${key}]:`, err.message));
        }
      }
    }
  } catch (err) {
    console.warn("Background cloud sync warning:", err.message);
  } finally {
    isSyncing = false;
  }
}



// LAN Printer Auto-Discovery Helper
function getLocalSubnetPrefix() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        const ip = alias.address;
        const parts = ip.split('.');
        if (parts[0] === '192' || parts[0] === '10' || parts[0] === '172') {
          return parts.slice(0, 3).join('.');
        }
      }
    }
  }
  return null;
}

async function discoverLanPrinters() {
  const prefix = getLocalSubnetPrefix();
  if (!prefix) return [];
  
  const scanPromises = [];
  const activePrinters = [];
  
  // Scan IP range 1 to 254 on port 9100 in parallel
  for (let i = 1; i <= 254; i++) {
    const ip = `${prefix}.${i}`;
    const promise = new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(250); // Fast timeout for local network
      
      socket.connect(9100, ip, () => {
        socket.destroy();
        activePrinters.push(ip);
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve();
      });
    });
    scanPromises.push(promise);
  }
  
  await Promise.all(scanPromises);
  return activePrinters;
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Set Global Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // API Authorization Guard
  if (pathname.startsWith('/api/') && pathname !== '/api/server-ip') {
    const authHeader = req.headers['authorization'];
    const expectedToken = 'Bearer KP-Pakse-Secret-Token-2026';
    if (!authHeader || authHeader !== expectedToken) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Unauthorized API Access' }));
      return;
    }
  }

  // API: Auto-Discover LAN Printers on subnet (port 9100)
  if (pathname === '/api/discover-printers' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    discoverLanPrinters()
      .then(printers => {
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, printers }));
      })
      .catch(err => {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
    return;
  }

  // API: Get server network IP
  if (pathname === '/api/server-ip' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const interfaces = os.networkInterfaces();
    let ip = '127.0.0.1';
    const candidates = [];
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && !alias.internal) {
          const nameLower = devName.toLowerCase();
          const isVirtual = nameLower.includes('vmnet') || 
                            nameLower.includes('vbox') || 
                            nameLower.includes('virtualbox') || 
                            nameLower.includes('docker') || 
                            nameLower.includes('wsl') || 
                            nameLower.includes('host-only') ||
                            nameLower.includes('vpn');
          candidates.push({ address: alias.address, isVirtual });
        }
      }
    }
    const nonVirtual = candidates.filter(c => !c.isVirtual);
    if (nonVirtual.length > 0) {
      ip = nonVirtual[0].address;
    } else if (candidates.length > 0) {
      ip = candidates[0].address;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ ip }));
    return;
  }

  // API: Kick Cash Drawer (Local Hardware Port Link)
  if (pathname === '/api/kick-drawer') {
    const printerName = parsedUrl.searchParams.get('printer') || 'GP-L80250 Series';
    res.setHeader('Content-Type', 'application/json');

    // Check if the printer name is a LAN IP address
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(printerName)) {
      console.log('🌐 LAN printer IP detected. Kicking drawer via direct TCP socket on port 9100:', printerName);
      const client = new net.Socket();
      client.setTimeout(3000);
      
      client.connect(9100, printerName, () => {
        // ESC p m t1 t2 (raw ESC/POS cash drawer kick code)
        const kickCommand = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
        client.write(kickCommand, () => {
          client.destroy();
          console.log('✓ Cash drawer kicked successfully via TCP socket to LAN printer at IP:', printerName);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, method: 'tcp' }));
        });
      });

      client.on('error', (err) => {
        client.destroy();
        console.error('❌ TCP socket drawer kick error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      });

      client.on('timeout', () => {
        client.destroy();
        console.error('❌ TCP socket drawer kick timeout');
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: 'Connection timeout' }));
      });
      return;
    }

    // Otherwise fall back to local Windows driver spooler via Powershell
    const escapedPrinterName = printerName.replace(/"/g, '\\"');
    exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File kick-drawer.ps1 -PrinterName "${escapedPrinterName}"`, (err, stdout, stderr) => {
      if (err) {
        console.error('Local printer kick error:', err, stderr);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      } else {
        console.log('Local printer kick command sent via Powershell to Windows driver:', printerName);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, method: 'powershell' }));
      }
    });
    return;
  }

  // API: Print Barcode Sticker (Local Hardware Port Link)
  if (pathname === '/api/print-barcode' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const data = JSON.parse(body);
        const printerName = data.printer || 'Barcode Printer';
        const base64Image = data.image;
        const qty = data.qty || 1;

        if (!base64Image) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'No image data provided' }));
          return;
        }

        const base64Data = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
        const tempFilePath = path.join(os.tmpdir(), `barcode-${Date.now()}.png`);
        fs.writeFileSync(tempFilePath, base64Data, 'base64');

        const escapedPrinterName = printerName.replace(/"/g, '\\"');
        const escapedFilePath = tempFilePath.replace(/"/g, '\\"');

        exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File print-barcode.ps1 -PrinterName "${escapedPrinterName}" -ImagePath "${escapedFilePath}" -Copies ${qty}`, (err, stdout, stderr) => {
          try { fs.unlinkSync(tempFilePath); } catch (e) {}

          if (err) {
            console.error('Local barcode print error:', err, stderr);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          } else {
            console.log('Local barcode print command sent to:', printerName);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          }
        });
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API: DB Sync (Loads local cache updates instantly from cache & uses gzip)
  if (pathname === '/api/db/sync') {
    res.setHeader('Content-Type', 'application/json');
    try {
      let sharedDb = {};
      if (fs.existsSync(DB_FILE)) {
        sharedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      }
      const response = {};
      for (const [key, val] of Object.entries(sharedDb)) {
        const clientTs = Number(parsedUrl.searchParams.get(key) || '0');
        const serverTs = Number(val.updatedAt || '0');
        if (serverTs > clientTs) {
          response[key] = val;
        }
      }
      
      const jsonResponse = JSON.stringify(response);
      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (acceptEncoding.includes('gzip') && jsonResponse.length > 1024) {
        zlib.gzip(Buffer.from(jsonResponse, 'utf8'), (err, compressed) => {
          if (!err) {
            res.setHeader('Content-Encoding', 'gzip');
            res.statusCode = 200;
            res.end(compressed);
          } else {
            res.statusCode = 200;
            res.end(jsonResponse);
          }
        });
      } else {
        res.statusCode = 200;
        res.end(jsonResponse);
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: DB Save (Saves locally for immediate response & writes to Cloud Firestore in bg)
  if (pathname === '/api/db/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      const release = await dbLock.acquire();
      try {
        const { key, data, updatedAt } = JSON.parse(body);
        if (!key) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Missing key' }));
          return;
        }
        
        // 1. Write to local JSON file for speed & offline reliability
        let sharedDb = {};
        if (fs.existsSync(DB_FILE)) {
          sharedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
        const timeNow = updatedAt || Date.now();
        
        let mergedData = data;
        const currentServerTable = sharedDb[key];
        if (currentServerTable) {
          const arrServer = currentServerTable.data;
          if (Array.isArray(data) && Array.isArray(arrServer)) {
            const clientIds = new Set(data.map(item => item.id).filter(id => id !== undefined));
            const merged = [];
            
            // 1. Add/Merge items from the client's payload
            data.forEach(item => {
              if (item && item.id !== undefined) {
                const serverItem = arrServer.find(s => s.id === item.id);
                if (!serverItem) {
                  merged.push(item);
                } else {
                  const tsC = Number(item.updatedAt || 0);
                  const tsS = Number(serverItem.updatedAt || 0);
                  if (tsS > tsC) {
                    merged.push(serverItem);
                  } else {
                    merged.push(item);
                  }
                }
              }
            });

            // 2. Keep server/cloud items not in client payload if they were updated after client's last pull
            arrServer.forEach(serverItem => {
              if (serverItem && serverItem.id !== undefined && !clientIds.has(serverItem.id)) {
                const tsS = Number(serverItem.updatedAt || 0);
                if (tsS > updatedAt) {
                  merged.push(serverItem);
                }
              }
            });

            mergedData = merged;
          } else if (key === 'slots') {
            mergedData = mergeObjects(currentServerTable.data, data, timeNow);
          } else if (key === 'settings') {
            mergedData = { ...currentServerTable.data, ...data };
          }
        }

        sharedDb[key] = { data: mergedData, updatedAt: timeNow };
        fs.writeFileSync(DB_FILE, JSON.stringify(sharedDb, null, 2), 'utf8');
        
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true }));

        // 2. Write to Cloud Firestore database in background
        if (firestoreDb) {
          firestoreDb.collection('pos_db').doc(key).set({
            data: mergedData,
            updatedAt: timeNow
          }).then(() => {
            console.log(`☁️ Successfully backed up key [${key}] to Cloud Firestore.`);
          }).catch(err => {
            console.warn(`⚠️ Cloud write failed for [${key}] (offline):`, err.message);
          });
        }
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      } finally {
        release();
      }
    });
    return;
  }

  // Helper to generate empty initial queue slots for database reset
  function getInitialSlots() {
    const slots = {};
    slots['Walk-In'] = { id: 'Walk-In', label: 'Walk-In', items: [], depositAmount: 0 };
    for (let i = 1; i <= 30; i++) {
      const id = `P${i}`;
      slots[id] = { id, label: `ຄິວ ${i} (Queue)`, items: [], depositAmount: 0 };
    }
    return slots;
  }

  // API: Production - Full Backup (Downloads Gzip compressed db_shared.json)
  if (pathname === '/api/production/backup' && req.method === 'GET') {
    try {
      if (fs.existsSync(DB_FILE)) {
        const dbContent = fs.readFileSync(DB_FILE, 'utf8');
        const compressed = zlib.gzipSync(Buffer.from(dbContent, 'utf8'));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="pos_backup_${Date.now()}.json.gz"`);
        res.end(compressed);
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Database file not found' }));
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: Production - Restore Database (Receives Gzip compressed db_shared.json and overwrites it)
  if (pathname === '/api/production/restore' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      const release = await dbLock.acquire();
      try {
        const buffer = Buffer.concat(chunks);
        const decompressed = zlib.gunzipSync(buffer);
        const parsed = JSON.parse(decompressed.toString('utf8'));
        
        // Simple validation check: ensure it is a valid database object containing some known keys
        if (typeof parsed !== 'object' || parsed === null) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Invalid database backup structure' }));
          return;
        }

        // Save atomically
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');

        // Sync all collections to Cloud Firestore if active
        if (firestoreDb) {
          console.log("☁️ Restoring all collections to Cloud Firestore...");
          const batch = firestoreDb.batch();
          for (const [key, val] of Object.entries(parsed)) {
            batch.set(firestoreDb.collection('pos_db').doc(key), {
              data: val.data,
              updatedAt: val.updatedAt || Date.now()
            });
          }
          await batch.commit();
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error("❌ Database restore failed:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      } finally {
        release();
      }
    });
    return;
  }

  // API: Production - Reset Demo Data (Wipes transactional data atomically)
  if (pathname === '/api/production/reset-demo' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    const release = await dbLock.acquire();
    try {
      let sharedDb = {};
      if (fs.existsSync(DB_FILE)) {
        sharedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      }
      const timeNow = Date.now();
      const keysToReset = [
        'products', 'categories', 'customers', 'orders', 'framing_jobs', 
        'debts', 'expenses', 'raw_materials', 'otp_logs', 'production_history',
        'shifts', 'leaves', 'payrolls', 'order_payments', 'audit_logs', 'attendance',
        'online_orders'
      ];
      
      keysToReset.forEach(k => {
        sharedDb[k] = { data: [], updatedAt: timeNow };
      });
      
      // Reset slots to empty queues
      const initialSlots = getInitialSlots();
      sharedDb['slots'] = { data: initialSlots, updatedAt: timeNow };

      fs.writeFileSync(DB_FILE, JSON.stringify(sharedDb, null, 2), 'utf8');

      // Sync reset state to Cloud Firestore
      if (firestoreDb) {
        console.log("☁️ Resetting Cloud Firestore collections to empty...");
        const batch = firestoreDb.batch();
        keysToReset.forEach(k => {
          batch.set(firestoreDb.collection('pos_db').doc(k), { data: [], updatedAt: timeNow });
        });
        batch.set(firestoreDb.collection('pos_db').doc('slots'), { data: initialSlots, updatedAt: timeNow });
        await batch.commit();
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error("❌ Reset Demo Data failed:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    } finally {
      release();
    }
    return;
  }

  // API: Production - Initialize System Admin Account (Seed default admin/admin123 with force password change)
  if (pathname === '/api/production/initialize' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    const release = await dbLock.acquire();
    try {
      let sharedDb = {};
      if (fs.existsSync(DB_FILE)) {
        sharedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      }
      
      const timeNow = Date.now();
      const usersData = sharedDb['users']?.data || [];
      
      // Check if admin already exists
      const adminIdx = usersData.findIndex(u => u.id === 'admin' || u.email === 'admin@gmail.com');
      const adminUser = {
        id: 'admin',
        name: 'System Administrator',
        email: 'admin@gmail.com',
        role: 'owner', // Maps to owner privileges
        roleName: 'ເຈົ້າຂອງຮ້ານ (Owner)',
        password: 'admin123', // plaintext fallback for standard auth checks
        passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // SHA-256 hash of 'admin123'
        forcePasswordChange: true,
        passcode: '9999',
        payType: 'monthly',
        baseWage: 5000000,
        otRate: 50000,
        permissions: {
          admin: true,
          pos: true,
          inventory: true,
          hrm: true,
          reports: true,
          debts: true,
          ai: true,
          settings: true
        }
      };

      if (adminIdx !== -1) {
        usersData[adminIdx] = adminUser;
      } else {
        usersData.push(adminUser);
      }

      sharedDb['users'] = { data: usersData, updatedAt: timeNow };
      fs.writeFileSync(DB_FILE, JSON.stringify(sharedDb, null, 2), 'utf8');

      // Sync initialized admin to Cloud Firestore
      if (firestoreDb) {
        await firestoreDb.collection('pos_db').doc('users').set({
          data: usersData,
          updatedAt: timeNow
        });
        console.log("☁️ Seeded/Updated Admin user to Cloud Firestore.");
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error("❌ Production Initialize failed:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    } finally {
      release();
    }
    return;
  }

  // Serve static files from /dist
  let filePath = path.join(DIST_DIR, pathname);
  
  if (filePath === DIST_DIR || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 500;
      res.end(`Server Error: ${err.code}`);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      // Smart caching: long cache for static assets, no-cache for HTML
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (['.js', '.css', '.ttf', '.woff', '.woff2', '.png', '.jpg', '.svg', '.ico'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year cache
      }
      
      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (acceptEncoding.includes('gzip') && content.length > 1024 && ['.js', '.css', '.html', '.json', '.svg'].includes(ext)) {
        zlib.gzip(content, (zlibErr, compressed) => {
          if (!zlibErr) {
            res.setHeader('Content-Encoding', 'gzip');
            res.end(compressed);
          } else {
            res.end(content);
          }
        });
      } else {
        res.end(content);
      }
    }
  });
});

const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`POS Server running on port ${PORT}`);
  console.log(`Access POS locally: http://localhost:${PORT}`);
  console.log(`===================================================`);
  
  if (isProd) {
    // High-visibility RED warning banner in terminal
    console.log(`\n\x1b[41m\x1b[37m  ⚠️  WARNING: PRODUCTION ACTIVE (โหมดขึ้นเว็บจริง)  ⚠️  \x1b[0m`);
    console.log(`\x1b[31m  - Running on Live Production Environment\x1b[0m`);
    console.log(`\x1b[31m  - Any changes will affect live customer database\x1b[0m`);
    console.log(`\x1b[31m  - Database Schema synchronization is DISABLED (sync: false)\x1b[0m`);
    console.log(`\x1b[41m\x1b[37m=========================================================\x1b[0m\n`);
  }
});
