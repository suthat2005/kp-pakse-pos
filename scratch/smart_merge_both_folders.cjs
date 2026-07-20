const fs = require('fs');
const path = require('path');

const cDir = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos';

// Find the D drive folder dynamically
const dParent = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด';
let dDir = null;

if (fs.existsSync(dParent)) {
  const list = fs.readdirSync(dParent);
  list.forEach(f => {
    if (f.includes('v2027') || f.includes('kp pakse pos')) {
      dDir = path.join(dParent, f);
    }
  });
}

if (!dDir) {
  dDir = 'D:\\kp pakse pos v2';
}

console.log("=== SMART TWO-WAY MERGE FROM BOTH FOLDERS ===");
console.log("Folder C (Destination & Source 1):", cDir);
console.log("Folder D (Source 2):              ", dDir);

let mergedCount = 0;
let fromDCount = 0;
let fromCCount = 0;

function getAllFiles(dir, base = dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(f => {
      if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.vite' || f === 'scratch') return;
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(getAllFiles(full, base));
      } else {
        results.push(path.relative(base, full));
      }
    });
  } catch(e) {}
  return results;
}

const cFiles = new Set(getAllFiles(cDir));
const dFiles = new Set(getAllFiles(dDir));

const allRelFiles = new Set([...cFiles, ...dFiles]);

allRelFiles.forEach(relPath => {
  const cPath = path.join(cDir, relPath);
  const dPath = path.join(dDir, relPath);

  const cExists = fs.existsSync(cPath);
  const dExists = fs.existsSync(dPath);

  if (cExists && dExists) {
    const cStat = fs.statSync(cPath);
    const dStat = fs.statSync(dPath);

    // Pick the newer file (or larger if timestamps are close)
    if (dStat.mtimeMs > cStat.mtimeMs) {
      fs.copyFileSync(dPath, cPath);
      fromDCount++;
      console.log(`[MERGED from D (Newer)] ${relPath} | D: ${dStat.mtime.toLocaleString()} vs C: ${cStat.mtime.toLocaleString()}`);
    } else {
      fromCCount++;
      console.log(`[KEPT from C (Newer)] ${relPath} | C: ${cStat.mtime.toLocaleString()}`);
    }
  } else if (dExists && !cExists) {
    const dParentDir = path.dirname(cPath);
    if (!fs.existsSync(dParentDir)) {
      fs.mkdirSync(dParentDir, { recursive: true });
    }
    fs.copyFileSync(dPath, cPath);
    fromDCount++;
    console.log(`[COPIED from D (Missing in C)] ${relPath}`);
  }
});

console.log(`\n✅ SMART MERGE COMPLETE!`);
console.log(`Files updated from D: ${fromDCount}`);
console.log(`Files kept from C:    ${fromCCount}`);
