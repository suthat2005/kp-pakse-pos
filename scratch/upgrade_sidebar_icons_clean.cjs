const fs = require('fs');

const path = 'src/App.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add ModernIcon import if missing
  if (!content.includes("import ModernIcon")) {
    content = "import ModernIcon from './components/ModernIcon';\n" + content;
  }

  // 2. Replace raw emoji spans inside sidebar-icon containers
  const iconReplacements = [
    { from: '<span className="sidebar-icon">🏠</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="🏠" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">📊</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="📊" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">💵</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="💵" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">🛠️</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="🛠️" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">🛒</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="🛒" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">📦</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="📦" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">📒</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="📒" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">💳</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="💳" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">👥</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="👥" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">🤖</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="🤖" width={18} height={18} /></span>' },
    { from: '<span className="sidebar-icon">⚙️</span>', to: '<span className="sidebar-icon"><ModernIcon emoji="⚙️" width={18} height={18} /></span>' },
  ];

  iconReplacements.forEach(({ from, to }) => {
    content = content.replaceAll(from, to);
  });

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully upgraded sidebar icons to SVG ModernIcon in App.jsx!");
} else {
  console.error("App.jsx not found.");
}
