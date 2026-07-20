const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Revert standard card borders of Recent Sales to original
  content = content.replace(
    `{/* ── Recent Sales ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'none', borderRadius:18, overflow:'hidden' }}>`,
    `{/* ── Recent Sales ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'1px solid rgba(148,163,184,0.08)', borderRadius:18, overflow:'hidden' }}`
  );

  // 2. Revert standard card borders of Top Products to original
  content = content.replace(
    `{/* ── Top Products ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'none', borderRadius:18, overflow:'hidden' }}>`,
    `{/* ── Top Products ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'1px solid rgba(148,163,184,0.08)', borderRadius:18, overflow:'hidden' }}`
  );

  // 3. Replace Quick Actions box entirely to remove the container box (gradient background + borders)
  const originalQuickActionsBlock = `          {/* ═══════════════════════\n              QUICK ACTIONS\n          ═══════════════════════ */}\n          <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'none', borderRadius:18, padding:'18px 20px' }}>\n            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1px', color:'#334155' }}>\n              ທາງລັດ\n            </h3>\n            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,220px)', gap:10 }}>\n              {[\n                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },\n                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },\n              ].map((item, i) => (\n                <button key={i} className=\"dash-quick-btn\"\n                  onClick={() => onTabChange?.(item.tab)}\n                  style={{\n                    padding:'16px 10px',\n                    background: item.bg,\n                    border: \`1px solid \${item.border}\`,\n                    borderRadius:13,\n                    color: item.color,\n                    cursor:'pointer', fontFamily:'inherit',\n                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,\n                    fontWeight:700, fontSize:'0.75rem', textAlign:'center',\n                  }}>\n                  {item.icon}\n                  {item.label}\n                </button>\n              ))}\n            </div>\n          </div>`;

  const newQuickActionsBlock = `          {/* ═══════════════════════\n              QUICK ACTIONS (Box-less & Border-less)\n          ═══════════════════════ */}\n          <div style={{ marginTop: 24, padding: '0 4px' }}>\n            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1.2px', color:'#64748b' }}>\n              ທາງລັດ\n            </h3>\n            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,220px)', gap:10 }}>\n              {[\n                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },\n                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },\n              ].map((item, i) => (\n                <button key={i} className=\"dash-quick-btn\"\n                  onClick={() => onTabChange?.(item.tab)}\n                  style={{\n                    padding:'16px 10px',\n                    background: item.bg,\n                    border: \`1px solid \${item.border}\`,\n                    borderRadius:13,\n                    color: item.color,\n                    cursor:'pointer', fontFamily:'inherit',\n                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,\n                    fontWeight:700, fontSize:'0.75rem', textAlign:'center',\n                  }}>\n                  {item.icon}\n                  {item.label}\n                </button>\n              ))}\n            </div>\n          </div>`;

  if (content.includes(originalQuickActionsBlock)) {
    content = content.replace(originalQuickActionsBlock, newQuickActionsBlock);
    console.log("✓ Successfully replaced Shortcuts card block to remove container box!");
  } else {
    // Let's print out what is there
    console.log("✗ Could not match Shortcuts card block.");
    // Let's do substring search
    const idx = content.indexOf('QUICK ACTIONS');
    if (idx !== -1) {
      console.log("Found 'QUICK ACTIONS' keyword. Doing fallback replacement...");
      const startOfActions = content.indexOf('<div', idx - 100);
      const endOfActions = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', startOfActions) + 1) + 1);
      console.log(`Borders match bounds: ${startOfActions} to ${endOfActions}`);
    }
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Done running borderless_dashboard_v3.cjs!");
} else {
  console.error("Dashboard.jsx not found.");
}
