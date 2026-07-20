const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Reports.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Define ReportIcons at the top
  const iconsDefinition = `const ReportIcons = {
  revenue: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  receipt: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  expense: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  profit: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  frame: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  ),
  cart: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  users: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  online: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  treats: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  overview: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  posStore: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  book: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  delivery: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  close: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  pending: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  package: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
};

`;

  const topInsertIdx = content.indexOf('export default function Reports(');
  if (topInsertIdx !== -1) {
    content = content.substring(0, topInsertIdx) + iconsDefinition + content.substring(topInsertIdx);
    console.log("✓ Injected ReportIcons definition!");
  }

  // 1. Replace main tabs icons
  const oldTabsList = `          { id: 'pos',      icon: '🏪', label: 'ໜ້າຮ້ານ POS' },
          { id: 'online',   icon: '🌐', label: 'ອອນລາຍ Shop' },
          { id: 'treats',   icon: '🎁', label: 'ລາຍການລ້ຽງແຂກ (Treats)' },
          { id: 'overview', icon: '📊', label: 'ພາບລວມທຸລະກິດ' },`;

  const newTabsList = `          { id: 'pos',      icon: <ReportIcons.posStore style={{ width: 16, height: 16, verticalAlign: 'middle' }} />, label: 'ໜ້າຮ້ານ POS' },
          { id: 'online',   icon: <ReportIcons.online style={{ width: 16, height: 16, verticalAlign: 'middle' }} />, label: 'ອອນລາຍ Shop' },
          { id: 'treats',   icon: <ReportIcons.treats style={{ width: 16, height: 16, verticalAlign: 'middle' }} />, label: 'ລາຍການລ້ຽງແຂກ (Treats)' },
          { id: 'overview', icon: <ReportIcons.overview style={{ width: 16, height: 16, verticalAlign: 'middle' }} />, label: 'ພາບລວມທຸລະກິດ' },`;

  content = content.replace(oldTabsList, newTabsList);

  // 2. Replace KPI emojis in POS tab
  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(52,152,219,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🛍️ ຍອດຂາຍສິນຄ້າ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(52,152,219,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.cart style={{ width: 16, height: 16, color: '#74B9FF' }} /> ຍອດຂາຍສິນຄ້າ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(243,156,18,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🛠️ ຍອດຂາຍອັດກອບ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(243,156,18,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.frame style={{ width: 16, height: 16, color: '#ffd740' }} /> ຍອດຂາຍອັດກອບ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(162,155,254,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🛒 ໃບບິນທັງໝົດ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(162,155,254,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.receipt style={{ width: 16, height: 16, color: '#A29BFE' }} /> ໃບບິນທັງໝົດ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(231,76,60,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>📒 ໜີ້ຄ້າງຊຳລະ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(231,76,60,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.book style={{ width: 16, height: 16, color: '#FAB1A0' }} /> ໜີ້ຄ້າງຊຳລະ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(212,175,55,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>💵 ລາຍຮັບທັງໝົດ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(212,175,55,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.revenue style={{ width: 16, height: 16, color: 'var(--gold-primary)' }} /> ລາຍຮັບທັງໝົດ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(0,184,148,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>📈 ກຳໄລສຸດທິ (ປະເມີນ)</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(0,184,148,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.profit style={{ width: 16, height: 16, color: '#55EFC4' }} /> ກຳໄລສຸດທິ (ປະເມີນ)</span>`
  );

  // 3. Replace KPI emojis in Online tab
  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(52,152,219,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🌐 ຍອດຂາຍ Online (ຊຳລະແລ້ວ)</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(52,152,219,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.online style={{ width: 16, height: 16, color: '#74B9FF' }} /> ຍອດຂາຍ Online (ຊຳລະແລ້ວ)</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(241,196,15,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>⏳ ລໍຖ້ານວດສະລິບ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(241,196,15,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.pending style={{ width: 16, height: 16, color: '#ffd740' }} /> ລໍຖ້ານວດສະລິບ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(46,204,113,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🚚 ສົ່ງ / ສຳເລັດແລ້ວ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(46,204,113,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.delivery style={{ width: 16, height: 16, color: '#2ecc71' }} /> ສົ່ງ / ສຳເລັດແລ້ວ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(231,76,60,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>❌ ຍົກເລີກ / Rejected</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(231,76,60,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.close style={{ width: 16, height: 16, color: '#e74c3c' }} /> ຍົກເລີກ / Rejected</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(212,175,55,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>📦 ຈຳນວນ Online ທັງໝົດ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(212,175,55,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.package style={{ width: 16, height: 16, color: 'var(--gold-primary)' }} /> ຈຳນວນ Online ທັງໝົດ</span>`
  );

  // 4. Replace KPI emojis in Treats tab
  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(230,126,34,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🎁 ຈຳນວນຄັ້ງທີ່ລ້ຽງແຂກ (Total Treats)</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(230,126,34,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.treats style={{ width: 16, height: 16, color: '#e67e22' }} /> ຈຳນວນຄັ້ງທີ່ລ້ຽງແຂກ (Total Treats)</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(231,76,60,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>💰 ມູນຄ່າລວມທີ່ລ້ຽງ (Estimated Value)</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(231,76,60,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.revenue style={{ width: 16, height: 16, color: '#FAB1A0' }} /> ມູນຄ່າລວມที่ລ້ຽງ (Estimated Value)</span>`
  );

  // 5. Replace KPI emojis in Overview tab
  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(162,155,254,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🏪 ຍອດ POS ໜ້າຮ້ານ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(162,155,254,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.posStore style={{ width: 16, height: 16, color: '#A29BFE' }} /> ຍອດ POS ໜ້າຮ້ານ</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(52,152,219,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🌐 ຍອດ Online Shop</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(52,152,219,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.online style={{ width: 16, height: 16, color: '#74B9FF' }} /> ຍອດ Online Shop</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(230,126,34,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>🎁 ລາຍການລ້ຽງແຂກ (Treats)</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(230,126,34,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.treats style={{ width: 16, height: 16, color: '#e67e22' }} /> ລາຍການລ້ຽງແຂກ (Treats)</span>`
  );

  content = content.replace(
    `<span style={{ fontSize:'0.68rem', color:'rgba(212,175,55,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>💰 ຍອດຂາຍລວມທຸກຊ່ອງທາງ</span>`,
    `<span style={{ fontSize:'0.68rem', color:'rgba(212,175,55,0.85)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6 }}><ReportIcons.revenue style={{ width: 16, height: 16, color: 'var(--gold-primary)' }} /> ຍອດຂາຍລວມທຸກຊ່ອງທາງ</span>`
  );

  // Replace all occurrences of 💸 ລາຍຈ່າຍທັງໝົດ globally using regex safely
  content = content.replace(/💸 ລາຍຈ່າຍທັງໝົດ/g, `<ReportIcons.expense style={{ width: 16, height: 16, color: '#FAB1A0', marginRight: 6, verticalAlign: 'middle' }} /> ລາຍຈ່າຍທັງໝົດ`);

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Patched all icons!");
}
