const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== AUDITING FILES CREATED/MODIFIED BETWEEN 01:50 AM AND 04:58 AM TODAY (20/07/2026) ===");

const startTime = new Date('2026-07-20T01:50:00+07:00');
const endTime = new Date('2026-07-20T04:58:00+07:00');

console.log(`Start Time (ISO): ${startTime.toISOString()}`);
console.log(`End Time   (ISO): ${endTime.toISOString()}`);

// Scan project directory C:\Users\sutha\OneDrive\Desktop\kp pakse pos
const cDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos';
const dDir = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027';

function scanTimeframe(dir) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.vite') return;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          scanTimeframe(full);
        } else {
          const mtime = stat.mtime;
          if (mtime >= startTime && mtime <= endTime) {
            console.log(`[MATCH] ${mtime.toISOString()} | ${full} | size: ${stat.size}`);
          }
        }
      } catch(e) {}
    });
  } catch(e) {}
}

console.log("\n--- SEARCHING IN C: DRIVE PROJECT ---");
scanTimeframe(cDir);

console.log("\n--- SEARCHING IN D: DRIVE PROJECT ---");
scanTimeframe(dDir);
