const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Reports.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Update setDatePreset
  const oldSetDatePreset = `  const setDatePreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === '90days') {
      const d = new Date();
      d.setDate(d.getDate() - 89);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const d = new Date();
      d.setDate(d.getDate() - 364);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    }
  };`;

  const newSetDatePreset = `  const setDatePreset = (preset) => {
    setActivePreset(preset);
    const d = new Date();
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      d.setDate(d.getDate() - 6);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'month') {
      d.setDate(d.getDate() - 29);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'quarter') {
      d.setDate(d.getDate() - 89);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const ys = new Date(d.getFullYear(), 0, 1);
      setStartDate(ys.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    }
  };`;

  if (content.includes(oldSetDatePreset)) {
    content = content.replace(oldSetDatePreset, newSetDatePreset);
    console.log("✓ Updated setDatePreset logic!");
  } else {
    console.log("oldSetDatePreset not found");
  }

  // 2. Locate and replace Advanced Date Range Selector
  const pickerStart = content.indexOf('{/* Advanced Date Range Selector */}');
  if (pickerStart !== -1) {
    // Let's find the closing div of the Advanced Date Range Selector container
    const pickerEnd = content.indexOf('</div>\n      </div>', pickerStart);
    if (pickerEnd !== -1) {
      const newPickerUI = `{/* Advanced Date Range Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
          <div style={{
            display: 'flex', gap: '3px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            borderRadius: '12px', padding: '4px',
            flexWrap: 'wrap',
          }}>
            {[
              { id: 'today', name: 'ວັນນີ້' },
              { id: 'week', name: '7 ວັນ' },
              { id: 'month', name: 'ເດືອນ' },
              { id: 'quarter', name: '3 ເດືອນ' },
              { id: 'year', name: 'ປີ' },
              { id: 'custom', name: 'ກຳນົດເອງ' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                className={\`dash-period-btn \${activePreset === opt.id ? 'active' : ''}\`}
                style={{
                  padding: '6px 14px', borderRadius: '9px',
                  background: activePreset === opt.id ? 'linear-gradient(135deg,rgba(99,102,241,0.85),rgba(79,70,229,0.9))' : 'none',
                  color: activePreset === opt.id ? 'white' : '#64748b',
                  fontWeight: activePreset === opt.id ? 700 : 500,
                  fontSize: '0.78rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setDatePreset(opt.id)}
              >
                {opt.name}
              </button>
            ))}
          </div>

          {activePreset === 'custom' && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)', marginTop: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px', padding: '4px 8px'
            }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>ຫາ</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>`;

      content = content.substring(0, pickerStart) + newPickerUI + content.substring(pickerEnd + 6);
      console.log("✓ Replaced Reports date selector UI successfully!");
    }
  }

  fs.writeFileSync(file, content, 'utf8');
}
