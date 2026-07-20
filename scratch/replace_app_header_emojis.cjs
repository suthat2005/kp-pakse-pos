const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\App.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Replace Command Palette items
  const oldPalette = `              {[
                { icon: '🏠', label: 'ພາບລວມ (Dashboard)', tab: 'dashboard', role: 'all' },
                { icon: '💵', label: 'ຂາຍໜ້າຮ້ານ (POS)', tab: 'pos', role: 'all' },
                { icon: '🖼️', label: 'ງານອັດກອບ (Framing)', tab: 'framing_board', role: 'all' },
                { icon: '🛒', label: 'ອໍເດີ້ອອນລາຍ (Online Orders)', tab: 'online_orders', role: 'owner' },
                { icon: '📦', label: 'ສະຕັອກ (Inventory)', tab: 'inventory', role: 'owner' },
                { icon: '👤', label: 'ສະມາຊິກ (Members)', tab: 'customers', role: 'all' },
                { icon: '📒', label: 'ໜີ້ສິນ (Debts)', tab: 'debts', role: 'owner' },
                { icon: '📊', label: 'ລາຍງານ (Reports)', tab: 'reports', role: 'owner' },
                { icon: '👥', label: 'ພະນັກງານ (HRM)', tab: 'hrm', role: 'owner' },
                { icon: '🤖', label: 'ລະບົບ AI', tab: 'ai', role: 'owner' },
                { icon: '⚙️', label: 'ຕັ້ງຄ່າ (Settings)', tab: 'settings', role: 'owner' },
              ]`;

  const newPalette = `              {[
                { icon: <Icons.dashboard style={{ width: 16, height: 16 }} />, label: 'ພາບລວມ (Dashboard)', tab: 'dashboard', role: 'all' },
                { icon: <Icons.pos style={{ width: 16, height: 16 }} />, label: 'ຂາຍໜ້າຮ້ານ (POS)', tab: 'pos', role: 'all' },
                { icon: <Icons.framing style={{ width: 16, height: 16 }} />, label: 'ງານອັດກອບ (Framing)', tab: 'framing_board', role: 'all' },
                { icon: <Icons.onlineOrders style={{ width: 16, height: 16 }} />, label: 'ອໍເດີ້ອອນລาย (Online Orders)', tab: 'online_orders', role: 'owner' },
                { icon: <Icons.inventory style={{ width: 16, height: 16 }} />, label: 'ສະຕັອກ (Inventory)', tab: 'inventory', role: 'owner' },
                { icon: <Icons.customers style={{ width: 16, height: 16 }} />, label: 'ສະມາຊິກ (Members)', tab: 'customers', role: 'all' },
                { icon: <Icons.debts style={{ width: 16, height: 16 }} />, label: 'ໜີ້ສິນ (Debts)', tab: 'debts', role: 'owner' },
                { icon: <Icons.reports style={{ width: 16, height: 16 }} />, label: 'ລາຍງານ (Reports)', tab: 'reports', role: 'owner' },
                { icon: <Icons.hrm style={{ width: 16, height: 16 }} />, label: 'ພະນັກງານ (HRM)', tab: 'hrm', role: 'owner' },
                { icon: <Icons.ai style={{ width: 16, height: 16 }} />, label: 'ລະບົບ AI', tab: 'ai', role: 'owner' },
                { icon: <Icons.settings style={{ width: 16, height: 16 }} />, label: 'ຕັ້ງຄ່າ (Settings)', tab: 'settings', role: 'owner' },
              ]`;

  content = content.replace(oldPalette, newPalette);

  // 2. Replace Shift Info Panel items
  const oldShift = `                {[
                  { icon: '💰', label: 'ລາຍຮັບ', desc: 'ຕິດຕາມກະ' },
                  { icon: '📊', label: 'ລາຍງານ', desc: 'ສະຫຼຸບທ້າຍກະ' },
                  { icon: '🔐', label: 'ຄວາມປອດໄພ', desc: 'ຄຸ້ມຄອງ Access' },
                ]`;

  const newShift = `                {[
                  { icon: <Icons.pos style={{ width: 16, height: 16, color: 'var(--gold-primary)' }} />, label: 'ລາຍຮັບ', desc: 'ຕິດຕາມກະ' },
                  { icon: <Icons.reports style={{ width: 16, height: 16, color: '#3498db' }} />, label: 'ລາຍງານ', desc: 'ສະຫຼຸບທ້າຍກະ' },
                  { icon: <Icons.settings style={{ width: 16, height: 16, color: '#e74c3c' }} />, label: 'ຄວາມປອດໄພ', desc: 'ຄຸ້ມຄອງ Access' },
                ]`;

  content = content.replace(oldShift, newShift);

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Successfully replaced all main emojis in App.jsx with SVGs!");
}
