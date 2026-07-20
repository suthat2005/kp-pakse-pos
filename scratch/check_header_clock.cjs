const fs = require('fs');

const appFile = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\App.jsx';
const posFile = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\POS.jsx';

if (fs.existsSync(appFile)) {
  const app = fs.readFileSync(appFile, 'utf8');
  console.log("App.jsx has clock/time logic?:", app.includes('currentTime') || app.includes('Clock') || app.includes('toLocaleTimeString') || app.includes('timeStr'));
}

if (fs.existsSync(posFile)) {
  const pos = fs.readFileSync(posFile, 'utf8');
  console.log("POS.jsx has clock/time logic?:", pos.includes('currentTime') || pos.includes('Clock') || pos.includes('toLocaleTimeString') || pos.includes('timeStr'));
}
