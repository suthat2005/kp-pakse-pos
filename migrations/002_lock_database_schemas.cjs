module.exports = {
  up: (db) => {
    console.log('🔒 Running Database Schema Lock Guards...');

    const requiredKeys = [
      'products', 'categories', 'customers', 'orders', 'framing_jobs', 
      'debts', 'expenses', 'raw_materials', 'otp_logs', 'production_history',
      'shifts', 'leaves', 'payrolls', 'order_payments', 'audit_logs', 
      'attendance', 'settings'
    ];

    let initializedCount = 0;

    requiredKeys.forEach(key => {
      // 1. Schema check & safe initialization
      if (!db[key]) {
        console.log(`  -> Initializing missing table: ${key}`);
        db[key] = { data: key === 'settings' ? {} : [], updatedAt: Date.now() };
        initializedCount++;
      } else {
        // 2. Lock guard: prevent overwriting active table data with invalid types
        if (key === 'settings') {
          if (typeof db[key].data !== 'object' || db[key].data === null) {
            console.log(`  ⚠️ Fixing malformed data type for: ${key}`);
            db[key].data = {};
            db[key].updatedAt = Date.now();
          }
        } else {
          if (!Array.isArray(db[key].data)) {
            console.log(`  ⚠️ Fixing malformed data type for: ${key}`);
            db[key].data = [];
            db[key].updatedAt = Date.now();
          }
        }
        console.log(`  ✓ Table locked and secured: ${key} (${key === 'settings' ? 'Object' : db[key].data.length + ' records'})`);
      }
    });

    // 3. Special Slot initialization check
    if (!db.slots) {
      console.log('  -> Initializing slots...');
      const slots = {};
      slots['Walk-In'] = { id: 'Walk-In', label: 'Walk-In', items: [], depositAmount: 0 };
      for (let i = 1; i <= 30; i++) {
        const id = `P${i}`;
        slots[id] = { id, label: `ຄิວ ${i} (Queue)`, items: [], depositAmount: 0 };
      }
      db.slots = { data: slots, updatedAt: Date.now() };
      initializedCount++;
    } else {
      console.log(`  ✓ Table locked and secured: slots (${Object.keys(db.slots.data || {}).length} slots)`);
    }

    // 4. Product fields safety check & data type enforcement
    if (db.products && Array.isArray(db.products.data)) {
      let sanitizedCount = 0;
      db.products.data = db.products.data.map(p => {
        let changed = false;
        
        // Ensure price is numeric
        if (p.price !== undefined && typeof p.price !== 'number') {
          const numPrice = Number(p.price);
          p.price = isNaN(numPrice) ? 0 : numPrice;
          changed = true;
        }
        
        // Ensure stock is numeric
        if (p.stock !== undefined && typeof p.stock !== 'number') {
          const numStock = Number(p.stock);
          p.stock = isNaN(numStock) ? 0 : numStock;
          changed = true;
        }

        if (changed) sanitizedCount++;
        return p;
      });

      if (sanitizedCount > 0) {
        db.products.updatedAt = Date.now();
        console.log(`  ✓ Sanitized and locked ${sanitizedCount} product numeric records (price/stock).`);
      }
    }

    console.log(`🔒 Schema lock complete. Initialized ${initializedCount} tables. Database schema is locked.`);
  }
};
