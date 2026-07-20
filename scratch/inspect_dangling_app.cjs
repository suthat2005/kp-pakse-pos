const { execSync } = require('child_process');

const commits = [
  '7e206e43f0110363cf80d85834a446a79d997fff',
  '390ac72892d60592a4936a14d587116b82f91a8d',
  'd50af36061c7867378cc071b3e33a120db9b9b89',
  'ec4b22d80138de00f6a6a58feb3c2d3b5d524472',
  '380c84af9c81dd108f50c9d01feacbc39f74c3c6',
  'efcea746139564f6ed57ec10ec5adf29e3e37816',
  'f78ee2f80790f89c36af5746b8f51bbadaf8285d'
];

commits.forEach(c => {
  try {
    const app = execSync(`git show ${c}:src/App.jsx`).toString('utf8');
    const hasSearch = app.includes('Ctrl') || app.includes('ຄົ້ນຫາ');
    const hasClock = app.includes('toLocaleTimeString') || app.includes('toLocaleDateString');
    console.log(`Commit ${c.slice(0, 7)}: hasSearch=${hasSearch}, hasClock=${hasClock}`);
  } catch(e) {
    // Some commits may not have src/App.jsx
  }
});
