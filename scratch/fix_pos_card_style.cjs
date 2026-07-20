const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\POS.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldCardStyle = `  const cardStyle = {
    padding: '10px',
    borderColor: isService ? 'rgba(229,169,59,0.28)' : 'rgba(39,174,96,0.2)',
  };`;

  const newCardStyle = `  const cardStyle = {
    padding: '10px',
    borderColor: isService ? 'rgba(229,169,59,0.28)' : 'rgba(39,174,96,0.2)',
    height: '195px',
    minHeight: '195px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    justifyContent: 'space-between'
  };`;

  if (content.includes(oldCardStyle)) {
    content = content.replace(oldCardStyle, newCardStyle);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Successfully updated cardStyle in POS.jsx!");
  } else {
    console.log("❌ Could not find oldCardStyle in POS.jsx!");
  }
}
