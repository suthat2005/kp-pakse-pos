const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Remove border from Recent Sales
  content = content.replace(
    `{/* ── Recent Sales ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'1px solid rgba(148,163,184,0.08)', borderRadius:18, overflow:'hidden' }}>`,
    `{/* ── Recent Sales ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'none', borderRadius:18, overflow:'hidden' }}`
  );

  // 2. Remove border from Top Products
  content = content.replace(
    `{/* ── Top Products ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'1px solid rgba(148,163,184,0.08)', borderRadius:18, overflow:'hidden' }}>`,
    `{/* ── Top Products ── */}\n            <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'none', borderRadius:18, overflow:'hidden' }}`
  );

  // 3. Remove border from Quick Actions
  content = content.replace(
    `{/* ═══════════════════════\n              QUICK ACTIONS\n          ═══════════════════════ */}\n          <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'1px solid rgba(148,163,184,0.08)', borderRadius:18, padding:'18px 20px' }}>`,
    `{/* ═══════════════════════\n              QUICK ACTIONS\n          ═══════════════════════ */}\n          <div style={{ background:'linear-gradient(145deg, rgba(11,25,48,0.9), rgba(7,18,37,0.95))', border:'none', borderRadius:18, padding:'18px 20px' }}`
  );

  // 4. Clean up Quick Actions buttons to only have 2 (pos and hrm) and set desktop grid columns to repeat(2, 220px)
  const originalGridAndButtons = `            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:10 }}>
              {[
                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },
                { icon:<DashIcons.frame />,      label:'ງານອັດກອບ',   tab:'framing_board', color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.22)' },
                { icon:<DashIcons.inventory />,  label:'ຈັດการ Stock', tab:'inventory',    color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.22)' },
                { icon:<DashIcons.reports />,    label:'ລາຍງານ',       tab:'reports',      color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.22)' },
                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
              ].map((item, i) => (
                <button key={i} className="dash-quick-btn"`;

  const newGridAndButtons = `            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,220px)', gap:10 }}>
              {[
                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },
                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
              ].map((item, i) => (
                <button key={i} className="dash-quick-btn"`;

  content = content.replace(originalGridAndButtons, newGridAndButtons);

  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully removed borders from all standard Dashboard container cards!");
} else {
  console.error("Dashboard.jsx not found.");
}
