const fs = require('fs');

const path = 'src/App.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  const oldBlock = `          <div className="topbar-actions">
            {lowStockWarning && activeUser.role === 'owner' && (
              <div
                onClick={() => {
                  setActiveTab('inventory');
                  setInventoryFilter('low_stock');
                }}
                style={{
                  background: 'rgba(231, 76, 60, 0.2)',
                  color: 'var(--alert-red)',
                  border: '1px solid var(--alert-red)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  animation: 'pulse-gold 1.5s infinite',
                  cursor: 'pointer'
                }}
              >
                {isMobile ? '⚠️ ສະຕັອກ' : '⚠️ ສະຕັອກໃກ້ໝົດ!'}
              </div>
            )}

            {/* Online Shop QR Code Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'rgba(52, 152, 219, 0.12)',
                color: '#3498db',
                borderColor: 'rgba(52, 152, 219, 0.3)',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                marginRight: '8px'
              }}
              onClick={() => setShowOnlineShopQrModal(true)}
            >
              {isMobile ? '🌐 QR' : '🌐 QR ເບິ່ງສິນຄ້າ'}
            </button>

            {/* Quick-action Expense Logger */}
            {!isMobile && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(229, 169, 59, 0.12)',
                  color: 'var(--accent-amber)',
                  borderColor: 'rgba(229, 169, 59, 0.3)',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold'
                }}
                onClick={() => {
                  setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', currency: 'LAK' });
                  setShowExpenseModal(true);
                }}
              >
                💸 ບັນທຶກລາຍຈ່າຍ
              </button>
            )}`;

  const newBlock = `          <div className="topbar-actions">
            {lowStockWarning && activeUser.role === 'owner' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('inventory');
                  setInventoryFilter('low_stock');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(248, 113, 113, 0.15)',
                  marginRight: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {isMobile ? 'ສະຕັອກ' : 'ສະຕັອກໃກ້ໝົດ!'}
              </button>
            )}

            {/* Online Shop QR Code Button */}
            <button
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                background: 'rgba(96, 165, 250, 0.12)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                color: '#60a5fa',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                marginRight: '6px'
              }}
              onClick={() => setShowOnlineShopQrModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {isMobile ? 'QR' : 'QR ເບິ່ງສິນຄ້າ'}
            </button>

            {/* Quick-action Expense Logger */}
            {!isMobile && (
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#34d399',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', currency: 'LAK' });
                  setShowExpenseModal(true);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                ບັນທຶກລາຍຈ່າຍ
              </button>
            )}`;

  if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    console.log("✓ Successfully upgraded top action header buttons in App.jsx!");
  } else {
    console.error("✗ Could not match oldBlock in App.jsx.");
  }

  fs.writeFileSync(path, content, 'utf8');
} else {
  console.error("App.jsx not found.");
}
