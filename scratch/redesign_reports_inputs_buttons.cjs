const fs = require('fs');

const path = 'src/components/Reports.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Upgrade Excel buttons
  content = content.replace(
    /style=\{\{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' \}\}>\s*📥 Excel/g,
    `style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.25)', color: '#34d399', cursor: 'pointer', fontFamily: 'inherit' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Excel`
  );

  // 2. Upgrade Print PDF buttons
  content = content.replace(
    /style=\{\{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' \}\}>\s*🖨️ Print PDF/g,
    `style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.25)', color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print PDF`
  );

  // 3. Upgrade search input fields
  content = content.replace(
    /className="form-control"\s*placeholder="(ຄົ້ນຫາ[^"]+)"/g,
    `placeholder="$1" style={{ padding: '7px 14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f1f5f9', fontSize: '0.8rem', outline: 'none' }}`
  );

  // 4. Upgrade chart dropdown selects
  content = content.replace(
    /style=\{\{ background: 'rgba\(255,255,255,0\.05\)', color: 'white', border: '1px solid rgba\(255,255,255,0\.1\)', borderRadius: '4px', padding: '2px 8px', fontSize: '0\.75rem' \}\}/g,
    `style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#f1f5f9', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully upgraded inputs, selects, and action buttons in Reports.jsx!");
} else {
  console.error("Reports.jsx not found.");
}
