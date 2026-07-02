const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '../db_shared.json');
const MIGRATIONS_DIR = __dirname;

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return {};
}

function saveDatabase(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function runMigrations() {
  console.log('📦 Starting Database Migrations...');
  const db = loadDatabase();
  
  // Ensure migrations_history exists
  if (!db.migrations_history) {
    db.migrations_history = { data: [], updatedAt: Date.now() };
  }
  
  const appliedMigrations = new Set(db.migrations_history.data.map(m => m.name));
  
  // Read all migration files in migrations/ directory
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.cjs') && f !== 'migrate.cjs')
    .sort(); // Run in alphabetical order
    
  let count = 0;
  for (const file of files) {
    if (!appliedMigrations.has(file)) {
      console.log(`🚀 Running migration: ${file}`);
      try {
        const migrationPath = path.join(MIGRATIONS_DIR, file);
        const migrationModule = require(migrationPath);
        
        // Execute the migration, passing the db object (which contains the existing data)
        migrationModule.up(db);
        
        // Log the applied migration
        db.migrations_history.data.push({
          name: file,
          appliedAt: new Date().toISOString()
        });
        db.migrations_history.updatedAt = Date.now();
        count++;
      } catch (err) {
        console.error(`❌ Migration failed at ${file}:`, err.message);
        process.exit(1);
      }
    }
  }
  
  if (count > 0) {
    saveDatabase(db);
    console.log(`✓ Successfully applied ${count} migrations!`);
  } else {
    console.log('✓ Database is already up to date.');
  }
}

runMigrations();
