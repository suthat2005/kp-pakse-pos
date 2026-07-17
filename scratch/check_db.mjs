import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./db_shared.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  // Check attendance
  const attendance = db.attendance ? db.attendance.data || [] : [];
  console.log(`Total attendance logs: ${attendance.length}`);
  
  let corrupted = 0;
  attendance.forEach((rec, idx) => {
    if (!rec.date) {
      console.log(`Corrupted record at index ${idx}: missing date!`, rec);
      corrupted++;
    }
    if (!rec.userId) {
      console.log(`Corrupted record at index ${idx}: missing userId!`, rec);
      corrupted++;
    }
  });
  
  // Check leaves
  const leaves = db.leaves ? db.leaves.data || [] : [];
  console.log(`Total leaves logs: ${leaves.length}`);
  leaves.forEach((rec, idx) => {
    if (!rec.startDate) {
      console.log(`Corrupted leave record at index ${idx}: missing startDate!`, rec);
      corrupted++;
    }
    if (!rec.endDate) {
      console.log(`Corrupted leave record at index ${idx}: missing endDate!`, rec);
      corrupted++;
    }
  });

  console.log(`Inspection completed. Corrupted records found: ${corrupted}`);
} else {
  console.log('db_shared.json not found!');
}
