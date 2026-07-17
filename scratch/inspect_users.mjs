import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./db_shared.json');

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const users = db.users ? db.users.data || [] : [];
  console.log('List of users in database:');
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Permissions:`, u.permissions);
  });
} else {
  console.log('db_shared.json not found!');
}
