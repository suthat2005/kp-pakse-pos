import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../db_shared.json');

try {
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const keys = ['products', 'categories', 'orders', 'debts', 'framing_jobs', 'attendance', 'expenses', 'audit_logs', 'raw_materials', 'shifts', 'users', 'payrolls', 'customers', 'online_orders'];
  
  keys.forEach(key => {
    const table = dbData[key];
    if (table && table.data) {
      const list = table.data;
      if (!Array.isArray(list)) {
        console.log(`WARNING: ${key}.data is NOT an array! Type is:`, typeof list);
        return;
      }
      const nulls = list.filter(item => item === null || item === undefined);
      if (nulls.length > 0) {
        console.log(`WARNING: Found ${nulls.length} null/undefined elements in ${key}.data!`);
      } else {
        console.log(`✓ ${key}: ${list.length} elements (No nulls)`);
      }
    } else {
      console.log(`- ${key}: Not found or has no .data`);
    }
  });
} catch (e) {
  console.error('Failed to parse db_shared.json:', e);
}
