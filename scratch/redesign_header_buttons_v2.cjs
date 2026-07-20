const fs = require('fs');

const path = 'src/App.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Upgrade Low Stock warning button label
  content = content.replace(
    `{isMobile ? '⚠️ ສະຕັອກ' : '⚠️ ສະຕັອກໃກ້ໝົດ!'}`,
    `<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>{isMobile ? 'ສະຕັອກ' : 'ສະຕັອກໃກ້ໝົດ!'}</>`
  );

  // 2. Upgrade QR Code Button label
  content = content.replace(
    `{isMobile ? '🌐 QR' : '🌐 QR ເບິ່ງສິນຄ້າ'}`,
    `<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>{isMobile ? 'QR' : 'QR ເບິ່ງສິນຄ້າ'}</>`
  );

  // 3. Upgrade Expense Logger Button label
  const targetExpenseText = content.match(/💸\s+ບັນທຶກລ[^\n<]+/)?.[0];
  if (targetExpenseText) {
    content = content.replace(
      targetExpenseText,
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>ບັນທຶກລາຍຈ່າຍ`
    );
  }

  // 4. Update style props in header buttons
  content = content.replace(
    `background: 'rgba(52, 152, 219, 0.12)',\n                color: '#3498db',\n                borderColor: 'rgba(52, 152, 219, 0.3)',`,
    `background: 'rgba(96, 165, 250, 0.12)',\n                color: '#60a5fa',\n                borderColor: 'rgba(96, 165, 250, 0.3)',\n                borderRadius: '10px',`
  );

  content = content.replace(
    `background: 'rgba(229, 169, 59, 0.12)',\n                  color: 'var(--accent-amber)',\n                  borderColor: 'rgba(229, 169, 59, 0.3)',`,
    `background: 'rgba(52, 211, 153, 0.12)',\n                  color: '#34d399',\n                  borderColor: 'rgba(52, 211, 153, 0.3)',\n                  borderRadius: '10px',`
  );

  content = content.replace(
    `background: 'rgba(231, 76, 60, 0.2)',\n                  color: 'var(--alert-red)',\n                  border: '1px solid var(--alert-red)',`,
    `background: 'rgba(248, 113, 113, 0.12)',\n                  color: '#f87171',\n                  border: '1px solid rgba(248, 113, 113, 0.3)',\n                  borderRadius: '10px',`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully upgraded top header action buttons in App.jsx!");
} else {
  console.error("App.jsx not found.");
}
