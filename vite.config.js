import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import zlib from 'zlib'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'kick-drawer-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/api/')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }
          }

          if (req.url.startsWith('/api/kick-drawer')) {
            const url = new URL(req.url, 'http://localhost');
            const printerName = url.searchParams.get('printer') || 'GP-L80250 Series';
            
            const escapedPrinterName = printerName.replace(/"/g, '\\"');
            exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File kick-drawer.ps1 -PrinterName "${escapedPrinterName}"`, (err, stdout, stderr) => {
              res.setHeader('Content-Type', 'application/json');
              if (err) {
                console.error('Local printer kick error:', err, stderr);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              } else {
                console.log('Local printer kick command sent to:', printerName);
                res.end(JSON.stringify({ success: true }));
              }
            });
          } else if (req.url.startsWith('/api/print-barcode')) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const printerName = data.printer || 'Barcode Printer';
                const base64Image = data.image;
                const qty = data.qty || 1;

                if (!base64Image) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'No image data provided' }));
                  return;
                }

                const base64Data = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
                const tempFilePath = path.join(os.tmpdir(), `barcode-${Date.now()}.png`);
                fs.writeFileSync(tempFilePath, base64Data, 'base64');

                const escapedPrinterName = printerName.replace(/"/g, '\\"');
                const escapedFilePath = tempFilePath.replace(/"/g, '\\"');

                exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File print-barcode.ps1 -PrinterName "${escapedPrinterName}" -ImagePath "${escapedFilePath}" -Copies ${qty}`, (err, stdout, stderr) => {
                  try {
                    fs.unlinkSync(tempFilePath);
                  } catch (e) {}

                  res.setHeader('Content-Type', 'application/json');
                  if (err) {
                    console.error('Local barcode print error:', err, stderr);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                  } else {
                    console.log('Local barcode print command sent to:', printerName);
                    res.end(JSON.stringify({ success: true }));
                  }
                });
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url.startsWith('/api/db/sync')) {
            res.setHeader('Content-Type', 'application/json');
            try {
              const url = new URL(req.url, 'http://localhost');
              const dbFilePath = path.resolve('./db_shared.json');
              let sharedDb = {};
              if (fs.existsSync(dbFilePath)) {
                sharedDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
              }
              const response = {};
              for (const [key, val] of Object.entries(sharedDb)) {
                const clientTs = Number(url.searchParams.get(key) || '0');
                const serverTs = Number(val.updatedAt || '0');
                if (serverTs > clientTs) {
                  response[key] = val;
                }
              }
              res.end(JSON.stringify(response));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else if (req.url.startsWith('/api/db/save')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const { key, data, updatedAt } = JSON.parse(body);
                if (!key) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Missing key' }));
                  return;
                }
                const dbFilePath = path.resolve('./db_shared.json');
                let sharedDb = {};
                if (fs.existsSync(dbFilePath)) {
                  sharedDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
                }
                sharedDb[key] = { data, updatedAt: updatedAt || Date.now() };
                fs.writeFileSync(dbFilePath, JSON.stringify(sharedDb, null, 2), 'utf8');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url.startsWith('/api/production/backup')) {
            try {
              const dbFilePath = path.resolve('./db_shared.json');
              if (fs.existsSync(dbFilePath)) {
                const dbContent = fs.readFileSync(dbFilePath, 'utf8');
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
          } else if (req.url.startsWith('/api/production/restore')) {
            const chunks = [];
            req.on('data', chunk => { chunks.push(chunk); });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const buffer = Buffer.concat(chunks);
                const decompressed = zlib.gunzipSync(buffer);
                const parsed = JSON.parse(decompressed.toString('utf8'));
                
                if (typeof parsed !== 'object' || parsed === null) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Invalid database backup structure' }));
                  return;
                }

                const dbFilePath = path.resolve('./db_shared.json');
                fs.writeFileSync(dbFilePath, JSON.stringify(parsed, null, 2), 'utf8');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else if (req.url.startsWith('/api/server-ip')) {
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
            res.end(JSON.stringify({ ip }));
          } else if (req.url.startsWith('/api/production/reset-demo')) {
            res.setHeader('Content-Type', 'application/json');
            try {
              const dbFilePath = path.resolve('./db_shared.json');
              let sharedDb = {};
              if (fs.existsSync(dbFilePath)) {
                sharedDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
              }
              const timeNow = Date.now();
              const keysToReset = [
                'products', 'categories', 'customers', 'orders', 'framing_jobs', 
                'debts', 'expenses', 'raw_materials', 'otp_logs', 'production_history',
                'shifts', 'leaves', 'payrolls', 'order_payments', 'audit_logs', 'attendance'
              ];
              
              keysToReset.forEach(k => {
                sharedDb[k] = { data: [], updatedAt: timeNow };
              });
              
              const getInitialSlots = () => {
                const slots = {};
                slots['Walk-In'] = { id: 'Walk-In', label: 'Walk-In', items: [], depositAmount: 0 };
                for (let i = 1; i <= 30; i++) {
                  const id = `P${i}`;
                  slots[id] = { id, label: `ຄິວ ${i} (Queue)`, items: [], depositAmount: 0 };
                }
                return slots;
              };
              sharedDb['slots'] = { data: getInitialSlots(), updatedAt: timeNow };

              fs.writeFileSync(dbFilePath, JSON.stringify(sharedDb, null, 2), 'utf8');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else if (req.url.startsWith('/api/production/initialize')) {
            res.setHeader('Content-Type', 'application/json');
            try {
              const dbFilePath = path.resolve('./db_shared.json');
              let sharedDb = {};
              if (fs.existsSync(dbFilePath)) {
                sharedDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
              }
              
              const timeNow = Date.now();
              const usersData = sharedDb['users']?.data || [];
              const adminIdx = usersData.findIndex(u => u.id === 'admin' || u.email === 'admin@gmail.com');
              const adminUser = {
                id: 'admin',
                name: 'System Administrator',
                email: 'admin@gmail.com',
                role: 'owner',
                roleName: 'ເຈົ້າຂອງຮ້ານ (Owner)',
                password: 'admin123',
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
              fs.writeFileSync(dbFilePath, JSON.stringify(sharedDb, null, 2), 'utf8');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
})
