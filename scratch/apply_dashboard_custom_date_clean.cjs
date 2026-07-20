const fs = require('fs');

const path = 'src/components/Dashboard.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add custom period option to period buttons
  if (!content.includes("key: 'custom'")) {
    content = content.replace(
      "{ key: 'year', label: db.getLabel('auto_ປີນີ້_1oag73', `ປີນີ້`) }",
      "{ key: 'year', label: db.getLabel('auto_ປີນີ້_1oag73', `ປີນີ້`) },\n    { key: 'custom', label: db.getLabel('auto_ກຳນົດເອງ_custom', `ກຳນົດເອງ`) }"
    );
  }

  // 2. Add startDate / endDate state hooks to Dashboard component
  if (!content.includes("const [startDate, setStartDate] = useState")) {
    const stateTarget = "const [period, setPeriod] = useState('today');";
    const stateReplacement = `const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));`;
    content = content.replace(stateTarget, stateReplacement);
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully applied custom date states to Dashboard.jsx!");
} else {
  console.error("Dashboard.jsx not found.");
}
