const fs = require('fs');

const path = 'src/App.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Exact replacement of the topbar-actions 3 buttons block to remove all borders and background boxes!
  const targetBlock = `          <div className="topbar-actions">
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

  const newBorderlessBlock = `          <div className="topbar-actions">
            {lowStockWarning && activeUser.role === 'owner' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('inventory');
                  setInventoryFilter('low_stock');
                }}
                style={{
                  background: 'transparent',
                  color: '#f87171',
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'opacity 0.2s ease'
                }}
              >
                ⚠️ {isMobile ? 'ສະຕັອກ' : 'ສະຕັອກໃກ້ໝົດ!'}
              </button>
            )}

            {/* Online Shop QR Code Button */}
            <button
              type="button"
              style={{
                background: 'transparent',
                color: '#60a5fa',
                border: 'none',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s ease',
                marginRight: '4px'
              }}
              onClick={() => setShowOnlineShopQrModal(true)}
            >
              🌐 {isMobile ? 'QR' : 'QR ເບິ່ງສິນຄ້າ'}
            </button>

            {/* Quick-action Expense Logger */}
            {!isMobile && (
              <button
                type="button"
                style={{
                  background: 'transparent',
                  color: '#34d399',
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.2s ease'
                }}
                onClick={() => {
                  setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', currency: 'LAK' });
                  setShowExpenseModal(true);
                }}
              >
                💸 ບັນທຶກລາຍຈ່າຍ
              </button>
            )}`;

  // Also handle possibility of character encoding for Lao text
  let replaced = false;
  if (content.includes(targetBlock)) {
    content = content.replace(targetBlock, newBorderlessBlock);
    replaced = true;
  } else {
    // Regex based replacement for safety
    const regex = /<div className="topbar-actions">\s*\{lowStockWarning[\s\S]*?💸 ບັນທຶກລ[^\n<]+\s*<\/button>\s*\)/;
    if (regex.test(content)) {
      content = content.replace(regex, newBorderlessBlock.replace(/\s*$/, ''));
      replaced = true;
    }
  }

  if (replaced) {
    fs.writeFileSync(path, content, 'utf8');
    console.log("✓ Successfully removed borders and boxes from topbar action buttons in App.jsx!");
  } else {
    console.error("✗ Failed to match topbar action buttons block in App.jsx");
  }
} else {
  console.error("App.jsx not found.");
}
