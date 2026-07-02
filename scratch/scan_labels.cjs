const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const files = [];

function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') scanDir(full);
    else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) files.push(full);
  }
}
scanDir(srcDir);

const labelKeys = new Map();
const regex = /getLabel\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const defaultVal = match[2];
    const basename = path.basename(file);
    if (!labelKeys.has(key)) {
      labelKeys.set(key, { default: defaultVal, files: [basename] });
    } else {
      const existing = labelKeys.get(key);
      if (!existing.files.includes(basename)) existing.files.push(basename);
    }
  }
}

// Load existing all_labels.json
const labelsFile = path.join(__dirname, '..', 'all_labels.json');
let existingLabels = {};
try {
  existingLabels = JSON.parse(fs.readFileSync(labelsFile, 'utf8'));
} catch(e) {}

console.log('=== ALL getLabel() KEYS IN CODEBASE ===');
console.log(`Total unique keys: ${labelKeys.size}`);
console.log('');

const existingKeys = new Set(Object.keys(existingLabels));
const codeKeys = new Set(labelKeys.keys());

// Keys in code but not in all_labels.json
const missing = [];
for (const key of codeKeys) {
  if (!existingKeys.has(key)) {
    const info = labelKeys.get(key);
    missing.push({ key, default: info.default, files: info.files.join(', ') });
  }
}

// Keys in all_labels.json but not in code
const unused = [];
for (const key of existingKeys) {
  if (!codeKeys.has(key)) {
    unused.push(key);
  }
}

console.log(`=== MISSING from all_labels.json (${missing.length}) ===`);
for (const m of missing) {
  console.log(`  ${m.key}: "${m.default}" [${m.files}]`);
}

console.log('');
console.log(`=== UNUSED in all_labels.json (${unused.length}) ===`);
for (const u of unused) {
  console.log(`  ${u}`);
}

console.log('');
console.log('=== ALL KEYS ===');
for (const [key, info] of labelKeys) {
  console.log(`  ${key}: "${info.default}" [${info.files.join(', ')}]`);
}
