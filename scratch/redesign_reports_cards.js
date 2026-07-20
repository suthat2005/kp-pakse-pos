const fs = require('fs');

const path = 'src/components/Reports.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Check if section header helper already exists or inject it
  if (!content.includes('const ReportSectionHeader')) {
    const helperDef = `
const ReportSectionHeader = ({ icon, title, extra }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(212, 175, 55, 0.12)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--gold-primary)', flexShrink: 0
      }}>
        {icon}
      </div>
      <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>
        {title}
      </h3>
    </div>
    {extra && (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {extra}
      </div>
    )}
  </div>
);
`;
    // Insert before export default function Reports
    content = content.replace('export default function Reports', helperDef + '\nexport default function Reports');
    console.log("✓ Injected ReportSectionHeader component!");
  }

  // Define SVG icons map
  const icons = {
    bills: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
    debts: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    expenses: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
    returns: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>`,
    topOnline: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`,
    ordersOnline: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
    trend: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`,
    category: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>`,
    channel: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
    payment: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    alerts: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    quick: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    activity: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    treat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`
  };

  // Replace Header 1: Bills Lookup
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem' }}>🔍 ໃບບິນຂາຍຊ່ວງນີ້ (Bills Lookup)</h3>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.bills).replace(/"/g, "'")}} title="ໃບບິນຂາຍຊ່ວງນີ້ (Bills Lookup)" />`
  );

  // Replace Header 2: Debts Table
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: 0 }}>📒 ບັນຊີລູກຄ້າຕິດໜີ້ຊ່ວງນີ້ (Period Debts Table)</h3>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.debts).replace(/"/g, "'")}} title="ບັນຊີລູກຄ້າຕິດໜີ້ຊ່ວງນີ້ (Period Debts Table)" />`
  );

  // Replace Header 3: Expenses Table
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: 0 }}>💸 ບັນທຶກລາຍຈ່າຍຊ່ວງນີ້ (Period Expenses Table)</h3>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.expenses).replace(/"/g, "'")}} title="ບັນທຶກລາຍຈ່າຍຊ່ວງນີ້ (Period Expenses Table)" />`
  );

  // Replace Header 4: Returns & Refunds
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: 0 }}>↩️ ການຄືນສິນຄ້າ / ຄືນເງິນ (Returns &amp; Refunds)</h3>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.returns).replace(/"/g, "'")}} title="ການຄືນສິນຄ້າ / ຄືນເງິນ (Returns & Refunds)" />`
  );

  // Replace Header 5: Top Selling Online
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>🏆 ສິນຄ້າຂາຍດີທາງ Online (Top Selling Products)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.topOnline).replace(/"/g, "'")}} title="ສິນຄ້າຂາຍດີທາງ Online (Top Selling Products)" />`
  );

  // Replace Header 6: Online Orders
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📋 ລາຍການ Online Orders ທັງໝົດ</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.ordersOnline).replace(/"/g, "'")}} title="ລາຍການ Online Orders ທັງໝົດ" />`
  );

  // Replace Header 7: Revenue Trend
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📈 ແນວໂນ້ມລາຍຮັບ / Revenue Trend</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.trend).replace(/"/g, "'")}} title="ແນວໂນ້ມລາຍຮັບ / Revenue Trend" />`
  );

  // Replace Header 8: Category Sales
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📊 ສັດສ່ວນຍອດຂາຍສິນຄ້າ / Category Sales</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.category).replace(/"/g, "'")}} title="ສັດສ່ວນຍອດຂາຍສິນຄ້າ / Category Sales" />`
  );

  // Replace Header 9: POS vs Online
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📊 ສັດສ່ວນຍອດຂາຍ POS vs Online</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.channel).replace(/"/g, "'")}} title="ສັດສ່ວນຍອດຂາຍ POS vs Online" />`
  );

  // Replace Header 10: Payment Breakdown
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>💳 ສະຫຼຸບການຊຳລະ (ລວມທຸກຊ່ອງທາງ)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.payment).replace(/"/g, "'")}} title="ສະຫຼຸບການຊຳລະ (ລວມທຸກຊ່ອງທາງ)" />`
  );

  // Replace Header 11: Expenses Summary
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>💸 ລາຍຈ່າຍ (Expenses)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.expenses).replace(/"/g, "'")}} title="ລາຍຈ່າຍ (Expenses)" />`
  );

  // Replace Header 12: System Alerts
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.9rem' }}>🔔 ແຈ້ງເຕືອນລະບົບ (System Alerts)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.alerts).replace(/"/g, "'")}} title="ແຈ້ງເຕືອນລະບົບ (System Alerts)" />`
  );

  // Replace Header 13: Quick Actions
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.9rem' }}>⚡ ຈັດການດ່ວນ (Quick Actions)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.quick).replace(/"/g, "'")}} title="ຈັດການດ່ວນ (Quick Actions)" />`
  );

  // Replace Header 14: Live Activity
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.9rem' }}>🕒 ປະຫວັດເຄື່ອນໄຫວ (Live Activity)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.activity).replace(/"/g, "'")}} title="ປະຫວັດເຄື່ອນໄຫວ (Live Activity)" />`
  );

  // Replace Header 15: Treat History
  content = content.replace(
    `<h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.02rem' }}>📋 ລາຍລະອຽດການລ້ຽງແຂກ (Treat History)</h4>`,
    `<ReportSectionHeader icon={${JSON.stringify(icons.treat).replace(/"/g, "'")}} title="ລາຍລະອຽດການລ້ຽງແຂກ (Treat History)" />`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully upgraded section headers in Reports.jsx!");
} else {
  console.error("Reports.jsx not found.");
}
