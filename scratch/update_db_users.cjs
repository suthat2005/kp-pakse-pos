const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\utils\\db.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Let's use string.indexOf to find the start and end of DEFAULT_USERS block
  const startKeyword = 'const DEFAULT_USERS = [';
  const startIndex = content.indexOf(startKeyword);
  if (startIndex !== -1) {
    const endIndex = content.indexOf('];', startIndex);
    if (endIndex !== -1) {
      const oldBlock = content.substring(startIndex, endIndex + 2);
      const newBlock = `const DEFAULT_USERS = [
{ id: 'owner', name: 'ທ້າວ ສົມຈິດ (ສົມ)', role: 'owner', passcode: '1111', email: 'owner@gmail.com', password: 'owner123', roleName: 'ເຈົ້າຂອງຮ້ាន (Owner)', payType: 'daily', baseWage: 150000, otRate: 25000, permissions: { admin: true, pos: true, inventory: true, hrm: true, reports: true, debts: true, ai: true, settings: true } },
{ id: 'cashier', name: 'ນາງ ຈັນທະມາ (ຈັນ)', role: 'cashier', passcode: '2222', email: 'cashier@gmail.com', password: 'cashier123', roleName: 'ພະນັກງານຂາຍ (Cashier)', payType: 'monthly', baseWage: 2400000, otRate: 15000, permissions: { admin: false, pos: true, inventory: false, hrm: false, reports: false, debts: true, ai: false, settings: false } },
{ id: 'technician', name: 'ທ້າວ ບຸນມີ (ມີ)', role: 'technician', passcode: '3333', email: 'tech@gmail.com', password: 'tech123', roleName: 'ຊ່າງອັດກອບ (Technician)', payType: 'daily', baseWage: 100000, otRate: 20000, permissions: { admin: false, pos: true, inventory: false, hrm: false, reports: false, debts: false, ai: true, settings: false } }
];`;
      content = content.replace(oldBlock, newBlock);
      fs.writeFileSync(file, content, 'utf8');
      console.log("✅ Successfully replaced DEFAULT_USERS block in db.js!");
    } else {
      console.log("❌ Could not find closing ];");
    }
  } else {
    console.log("❌ Could not find const DEFAULT_USERS");
  }
}
