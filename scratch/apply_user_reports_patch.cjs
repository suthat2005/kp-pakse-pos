const fs = require('fs');

const reportsFile = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src/components/Reports.jsx';
if (fs.existsSync(reportsFile)) {
  let content = fs.readFileSync(reportsFile, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Update setDatePreset to include '90days' option
  const originalPresetSetter = `  const setDatePreset = (preset) => {
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
    } else if (preset === 'year') {
      const d = new Date();
      d.setDate(d.getDate() - 364);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    }
  };`;

  const replacementPresetSetter = `  const setDatePreset = (preset) => {
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

  if (content.includes(originalPresetSetter)) {
    content = content.replace(originalPresetSetter, replacementPresetSetter);
    console.log("✓ Updated setDatePreset logic successfully!");
  } else {
    console.log("Failed to match setDatePreset logic.");
  }

  // 2. Add style tags in component return statement
  const styleTarget = `  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>`;

  const styleReplacement = `  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{\`
        .rep-period-btn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1) !important; border: none !important; cursor: pointer !important; font-family: inherit !important; }
        .rep-period-btn:hover { background: rgba(255,255,255,0.06) !important; color: #e2e8f0 !important; }
        .rep-period-btn.active { background: linear-gradient(135deg,rgba(99,102,241,0.85),rgba(79,70,229,0.9)) !important; color: white !important; box-shadow: 0 2px 14px rgba(99,102,241,0.4) !important; }
      \`}</style>`;

  if (content.includes(styleTarget)) {
    content = content.replace(styleTarget, styleReplacement);
    console.log("✓ Added CSS styles block to component return!");
  } else {
    console.log("Failed to match styleTarget return statement.");
  }

  // 3. Replace Advanced Date Range Selector
  const selectorStart = "        {/* Advanced Date Range Selector */}";
  const selectorEnd = "      {/* ─── Tab Switcher ─────────────────────────────────────────────────────── */}";
  
  const startIdx = content.indexOf(selectorStart);
  const endIdx = content.indexOf(selectorEnd);

  if (startIdx !== -1 && endIdx !== -1) {
    const originalSelector = content.substring(startIdx, endIdx);
    const replacementSelector = `${selectorStart}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
          <div style={{
            display:'flex', gap:3,
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(148,163,184,0.08)',
            borderRadius:12, padding:4,
            flexWrap:'wrap',
            justifyContent: isMobile ? 'space-between' : 'flex-start'
          }}>
            {[
              { id: 'today',   label: 'ວັນນີ້' },
              { id: '7days',   label: '7 ວัน' },
              { id: '30days',  label: 'เດືອນ' },
              { id: '90days',  label: '3 ເດືອນ' },
              { id: 'year',    label: 'ປີ' },
              { id: 'custom',  label: 'ກຳນົດເອງ' },
            ].map(p => (
              <button key={p.id}
                type="button"
                className={\`rep-period-btn\${activePreset===p.id?' active':''}\`}
                onClick={() => setDatePreset(p.id)}
                style={{
                  padding:'6px 14px', borderRadius:9,
                  background: 'none',
                  color: activePreset===p.id ? 'white' : '#64748b',
                  fontWeight: activePreset===p.id ? 700 : 500,
                  fontSize:'0.78rem',
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {activePreset === 'custom' && (
            <div className="animate-fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '6px 12px',
              borderRadius: '10px',
              flexWrap: 'wrap',
              width: '100%',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ແຕ່:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.45)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ຫາ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.45)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>\n\n`;
    content = content.replace(originalSelector, replacementSelector);
    console.log("✓ Redesigned Reports date selector markup successfully!");
  } else {
    console.log("Failed to locate selector boundaries.");
  }

  fs.writeFileSync(reportsFile, content.replace(/\n/g, '\r\n'), 'utf8');
} else {
  console.log("Reports.jsx file not found!");
}
