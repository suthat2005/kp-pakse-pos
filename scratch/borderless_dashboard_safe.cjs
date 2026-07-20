const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Globally replace standard card borders with none
  content = content.split("border:'1px solid rgba(148,163,184,0.08)'").join("border:'none'");

  // 2. Clean up Quick Actions buttons to only have 2 (pos and hrm) and set desktop grid columns to repeat(2, 220px)
  const originalGridAndButtons = `            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:10 }}>
              {[
                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },
                { icon:<DashIcons.frame />,      label:'ງານອັດກອບ',   tab:'framing_board', color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.22)' },
                { icon:<DashIcons.inventory />,  label:'ຈັດການ Stock', tab:'inventory',    color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.22)' },
                { icon:<DashIcons.reports />,    label:'ລາຍງານ',       tab:'reports',      color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.22)' },
                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
              ].map((item, i) => (
                <button key={i} className="dash-quick-btn"`;

  const newGridAndButtons = `            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,220px)', gap:10 }}>
              {[
                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້ານ', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },
                { icon:<DashIcons.hrm />,        label:'ພະນักງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
              ].map((item, i) => (
                <button key={i} className="dash-quick-btn"`;

  if (content.includes(originalGridAndButtons)) {
    content = content.replace(originalGridAndButtons, newGridAndButtons);
    console.log("✓ Successfully replaced Quick Actions grid buttons!");
  } else {
    console.log("✗ Could not match Quick Actions grid buttons!");
  }

  // Double check and replace for Lao spelling in hrm if it was hrm card or something
  content = content.replace('ພະນັກງານ', 'ພະນັກງານ');

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully applied all safe borderless dashboard customizations!");
} else {
  console.error("Dashboard.jsx not found.");
}
