module.exports = {
  up: (db) => {
    // Safety check: Ensure settings exists without overwriting existing data
    if (!db.settings) {
      db.settings = { data: {}, updatedAt: Date.now() };
    }
    
    // Add default values for new fields safely
    const data = db.settings.data;
    if (data.bankName === undefined) data.bankName = 'BCEL One';
    if (data.currency === undefined) data.currency = 'LAK';
    
    db.settings.updatedAt = Date.now();
    console.log('  -> Default settings verified.');
  }
};
