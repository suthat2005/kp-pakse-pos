const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\HRM.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Inject state at the beginning of HRM function
  const oldState = `  const [activeSubTab, setActiveSubTab] = useState('employees'); // employees | shifts | attendance | leaves | payroll`;
  const newState = `  const [activeSubTab, setActiveSubTab] = useState('employees'); // employees | shifts | attendance | leaves | payroll
  const [revealedUsers, setRevealedUsers] = useState({});`;

  content = content.replace(oldState, newState);

  // 2. Replace plain passcode & password rendering block
  const oldRender = `                      <span>{db.getLabel('auto_ລະຫັດ_PIN_4_ຫຼັກ__dghrbv', \`ລະຫັດ PIN 4 ຫຼັກ:\`)}</span>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>{u.passcode}</span>
                      <span>{db.getLabel('auto_ລະຫັດຜ່ານ__Pass___1xi59c', \`ລະຫັດຜ່ານ (Pass):\`)}</span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{u.password}</span>`;

  const newRender = `                      <span>{db.getLabel('auto_ລະຫັດ_PIN_4_ຫຼັກ__dghrbv', \`ລະຫັດ PIN 4 ຫຼັກ:\`)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>{revealedUsers[u.id] ? u.passcode : '••••'}</span>
                        <button 
                          type="button" 
                          onClick={() => setRevealedUsers(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                          style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', padding: '0 4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}
                        >
                          {revealedUsers[u.id] ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      <span>{db.getLabel('auto_ລະຫັດຜ່ານ__Pass___1xi59c', \`ລະຫັດຜ່ານ (Pass):\`)}</span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: revealedUsers[u.id] ? 'white' : 'rgba(255,255,255,0.3)' }}>{revealedUsers[u.id] ? u.password : '••••••••'}</span>`;

  if (content.includes(oldRender)) {
    content = content.replace(oldRender, newRender);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Successfully patched passcode & password visibility in HRM.jsx!");
  } else {
    console.log("❌ Could not find oldRender block in HRM.jsx!");
  }
}
