const fs = require('fs');

const dPath = 'D:\\เรັດຮ້ານຂອບພຣະໃຫມ່ລ້າສຸດ\\kp pakse pos v2027\\src\\components\\Dashboard.jsx'; // check path variation
const dPathAlt = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\src\\components\\Dashboard.jsx';
const cPath = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';

let restored = false;
if (fs.existsSync(dPathAlt)) {
  fs.copyFileSync(dPathAlt, cPath);
  console.log("✓ Reverted Dashboard.jsx to clean golden state!");
  restored = true;
} else if (fs.existsSync(dPath)) {
  fs.copyFileSync(dPath, cPath);
  console.log("✓ Reverted Dashboard.jsx to clean golden state!");
  restored = true;
}

if (!restored) {
  console.error("Could not find golden source to revert Dashboard.jsx");
}
