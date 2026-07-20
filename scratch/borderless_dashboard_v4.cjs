const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Make sure borders of Recent Sales and Top Products are restored to original
  // Since we checked out clean and ran restore_dashboard_v2, they are already:
  // border:'1px solid rgba(148,163,184,0.08)'
  // So we only need to replace the Quick Actions block!

  // 2. Search and replace the Quick Actions block
  const originalQuickActionsBlock = `          {/* ═══════════════════════\n              QUICK ACTIONS\n          ═══════════════════════ */}\n          <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'1px solid rgba(148,163,184,0.08)', borderRadius:18, padding:'18px 20px' }}>\n            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1px', color:'#334155' }}>\n              ທາງລັດ\n            </h3>\n            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:10 }}>\n              {[\n                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },\n                { icon:<DashIcons.frame />,      label:'ງານອັດກອບ',   tab:'framing_board', color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.22)' },\n                { icon:<DashIcons.inventory />,  label:'ຈັດການ Stock', tab:'inventory',    color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.22)' },\n                { icon:<DashIcons.reports />,    label:'ລາຍງານ',       tab:'reports',      color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.22)' },\n                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },\n              ].map((item, i) => (\n                <button key={i} className="dash-quick-btn"\n                  onClick={() => onTabChange?.(item.tab)}\n                  style={{\n                    padding:'16px 10px',\n                    background: item.bg,\n                    border: \`1px solid \${item.border}\`,\n                    borderRadius:13,\n                    color: item.color,\n                    cursor:'pointer', fontFamily:'inherit',\n                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,\n                    fontWeight:700, fontSize:'0.75rem', textAlign:'center',\n                  }}>\n                  {item.icon}\n                  {item.label}\n                </button>\n              ))}\n            </div>\n          </div>`;

  const newQuickActionsBlock = `          {/* ═══════════════════════\n              QUICK ACTIONS (Box-less & Border-less)\n          ═══════════════════════ */}\n          <div style={{ marginTop: 24, padding: '0 4px' }}>\n            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1.2px', color:'#64748b' }}>\n              ທາງລັດ\n            </h3>\n            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,220px)', gap:10 }}>\n              {[\n                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },\n                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },\n              ].map((item, i) => (
                <button key={i} className="dash-quick-btn"
                  onClick={() => onTabChange?.(item.tab)}
                  style={{
                    padding:'16px 10px',
                    background: item.bg,
                    border: \`1px solid \${item.border}\`Local,
                    borderRadius:13,
                    color: item.color,
                    cursor:'pointer', fontFamily:'inherit',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                    fontWeight:700, fontSize:'0.75rem', textAlign:'center',
                  }}>
                  {item.icon}
                  {item.label}
                </button>
              ))}\n            </div>\n          </div>`;

  // Wait! Let's check: the file was reverted and then restore_dashboard_v2 was run.
  // Does it have the 5 buttons quick actions block? Yes!
  if (content.includes(originalQuickActionsBlock.replace(/\\/g, ''))) {
    content = content.replace(originalQuickActionsBlock.replace(/\\/g, ''), newQuickActionsBlock);
    console.log("✓ Successfully replaced Shortcuts card block!");
  } else {
    // If exact block doesn't match, let's do a more robust find and replace
    console.log("✗ Could not match exact Shortcuts card block. Running robust fallback...");
    
    const targetHeader = `{/* ═══════════════════════\n              QUICK ACTIONS\n          ═══════════════════════ */}`;
    const startIdx = content.indexOf(targetHeader);
    if (startIdx !== -1) {
      const endIdx = content.indexOf('</div>\n        </>\n      )}', startIdx);
      if (endIdx !== -1) {
        const segmentToReplace = content.substring(startIdx, endIdx);
        const replacedSegment = `{/* ═══════════════════════\n              QUICK ACTIONS (Box-less & Border-less)\n          ═══════════════════════ */}\n          <div style={{ marginTop: 24, padding: '0 4px' }}>\n            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1.2px', color:'#64748b' }}>\n              ທາງລັດ\n            </h3>\n            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,220px)', gap:10 }}>\n              {[\n                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },\n                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },\n              ].map((item, i) => (\n                <button key={i} className="dash-quick-btn"\n                  onClick={() => onTabChange?.(item.tab)}\n                  style={{\n                    padding:'16px 10px',\n                    background: item.bg,\n                    border: \`1px solid \${item.border}\`,\n                    borderRadius:13,\n                    color: item.color,\n                    cursor:'pointer', fontFamily:'inherit',\n                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,\n                    fontWeight:700, fontSize:'0.75rem', textAlign:'center',\n                  }}>\n                  {item.icon}\n                  {item.label}\n                </button>\n              ))}\n            </div>\n          </div>\n        `;
        content = content.replace(segmentToReplace, replacedSegment);
        console.log("✓ Successfully replaced Shortcuts segment via robust fallback!");
      }
    }
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Done running borderless_dashboard_v4.cjs!");
} else {
  console.error("Dashboard.jsx not found.");
}
