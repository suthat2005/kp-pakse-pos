const fs = require('fs');

const path = 'src/App.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // 1. Add ModernIcon import if missing
  if (!content.includes("import ModernIcon")) {
    content = content.replace(
      "import React,",
      "import ModernIcon from './components/ModernIcon';\nimport React,"
    );
    if (!content.includes("import ModernIcon")) {
      content = "import ModernIcon from './components/ModernIcon';\n" + content;
    }
  }

  // 2. Wrap emojis in sidebar navigation items with ModernIcon
  const tabIcons = [
    { emoji: '🏠', text: 'ພາບລວມ (Dashboard)' },
    { emoji: '📊', text: 'ລາຍງານ (Reports)' },
    { emoji: '💵', text: 'ຂາຍໜ້າຮ້ານ (POS)' },
    { emoji: '⚡', text: 'ບອກງານອັດກອບ (Framing Board)' },
    { emoji: '🛒', text: 'ອໍເດີ້ອອນລາຍ (Online Orders)' },
    { emoji: '📦', text: 'ສະຕັອກ (Inventory)' },
    { emoji: '📒', text: 'ບັນຊີຕິດໜີ້ (Debts)' },
    { emoji: '💳', text: 'ສະມາຊິກ (Members)' },
    { emoji: '👥', text: 'ຈັດການບຸກຄະລາກອນ (HRM)' },
    { emoji: '🤖', text: 'ລະບົບ AI' },
    { emoji: '⚙️', text: 'ຕັ້ງຄ່າ (Settings)' },
  ];

  tabIcons.forEach(({ emoji, text }) => {
    const target = `${emoji} ${text}`;
    const replacement = `<ModernIcon emoji="${emoji}" width={18} height={18} style={{ marginRight: 8 }} />${text}`;
    content = content.replaceAll(target, replacement);
  });

  // 3. Wrap emojis in topbar title with ModernIcon
  const topbarTitles = [
    { emoji: '🏠', label: 'Dashboard' },
    { emoji: '📊', label: 'Reports' },
    { emoji: '💵', label: 'POS' },
    { emoji: '⚡', label: 'Framing Board' },
    { emoji: '🛒', label: 'Online Orders' },
    { emoji: '📦', label: 'Inventory' },
    { emoji: '📒', label: 'Debts' },
    { emoji: '💳', label: 'Members' },
    { emoji: '🤖', label: 'AI' },
    { emoji: '⚙️', label: 'Settings' },
  ];

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully applied ModernIcon to App.jsx sidebar and headers!");
} else {
  console.error("App.jsx not found.");
}
