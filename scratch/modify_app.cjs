const fs = require('fs');
const path = require('path');

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Create a backup in scratch folder
const backupDir = 'C:/Users/sutha/.gemini/antigravity/brain/57160ca8-be3f-481c-9ffc-5f8f79e955b7/scratch';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
fs.writeFileSync(path.join(backupDir, 'App_backup.jsx'), content);
console.log('✓ App.jsx backed up successfully.');

// 2. Add HRM import
const importTarget = "import Debts from './components/Debts';";
const importReplacement = "import Debts from './components/Debts';\nimport HRM from './components/HRM';";
if (content.includes(importTarget)) {
  content = content.replace(importTarget, importReplacement);
  console.log('✓ Added HRM import.');
} else {
  console.log('⚠ Could not find import statement in App.jsx');
}

// 3. Add sidebarCollapsed state
const stateTarget = "const [activeTab, setActiveTab] = useState('pos');";
const stateReplacement = "const [activeTab, setActiveTab] = useState('pos');\n  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);";
if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log('✓ Added sidebarCollapsed state.');
} else {
  console.log('⚠ Could not find state declaration in App.jsx');
}

// 4. Replace Theme Injection useEffect
const useEffectRegex = /\/\/\s*Inject\s+Custom\s+Theme\s+Colors\s+Dynamically[\s\S]*?\}\s*,\s*\[settings\]\s*\);/;
const newUseEffect = `// Inject Custom Theme Colors Dynamically
  useEffect(() => {
    const root = document.documentElement;
    const customKeys = [
      'gold-primary', 'bg-main', 'bg-card', 'success-green', 'alert-red', 
      'radius-lg', 'radius-md', 'radius-sm', 'gold-dark', 'gold-glow', 'bg-card-hover',
      'accent-amber', 'text-primary', 'text-secondary', 'border-color', 'font-lao', 'shadow-premium'
    ];
    customKeys.forEach(k => {
      root.style.removeProperty(\`--user-\${k}\`);
      root.style.removeProperty(\`--\${k}\`);
    });

    if (settings && settings.themeConfig) {
      const cfg = settings.themeConfig;
      if (cfg.colors) {
        root.style.setProperty('--user-gold-primary', cfg.colors.primary || '#d4af37');
        root.style.setProperty('--user-bg-main', cfg.colors.background || '#0c0b09');
        root.style.setProperty('--user-bg-card', cfg.colors.card || '#161411');
        root.style.setProperty('--user-success-green', cfg.colors.success || '#2ecc71');
        root.style.setProperty('--user-alert-red', cfg.colors.danger || '#e74c3c');
        root.style.setProperty('--border-color', cfg.colors.border || '#3D352E');
        root.style.setProperty('--accent-amber', cfg.colors.secondary || '#4A3B32');
        
        const primary = cfg.colors.primary || '#d4af37';
        root.style.setProperty('--user-gold-dark', darkenColor(primary, 0.2));
        root.style.setProperty('--user-gold-glow', hexToRgba(primary, 0.25));
        
        const cardBg = cfg.colors.card || '#161411';
        root.style.setProperty('--user-bg-card-hover', lightenColor(cardBg, 0.15));
      }
      
      if (cfg.typography) {
        root.style.setProperty('--font-lao', cfg.typography.fontFamily || 'Phetsarath, Noto Sans Lao, sans-serif');
      }
      
      if (cfg.layout) {
        root.style.setProperty('--user-radius-lg', cfg.layout.borderRadius || '8px');
        const rVal = parseInt(cfg.layout.borderRadius || '8px');
        root.style.setProperty('--user-radius-md', \`\${Math.round(rVal / 2)}px\`);
        root.style.setProperty('--user-radius-sm', \`\${Math.round(rVal / 4)}px\`);
        
        root.style.setProperty('--sidebar-width', cfg.layout.sidebarWidth || '260px');
        root.style.setProperty('--sidebar-collapsed-width', cfg.layout.sidebarCollapsedWidth || '70px');
      }
    } else if (settings && settings.themeColors) {
      Object.entries(settings.themeColors).forEach(([key, val]) => {
        if (val) {
          root.style.setProperty(\`--user-\${key}\`, val);
          if (key === 'gold-primary') {
            root.style.setProperty('--user-gold-dark', darkenColor(val, 0.2));
            root.style.setProperty('--user-gold-glow', hexToRgba(val, 0.25));
          }
          if (key === 'bg-card') {
            root.style.setProperty('--user-bg-card-hover', lightenColor(val, 0.15));
          }
        }
      });
    }

    if (settings && settings.uiControls) {
      const uic = settings.uiControls;
      if (!uic.roundedCorners) {
        root.style.setProperty('--user-radius-lg', '0px');
        root.style.setProperty('--user-radius-md', '0px');
        root.style.setProperty('--user-radius-sm', '0px');
      }
      if (!uic.shadowsEnabled) {
        root.style.setProperty('--shadow-premium', 'none');
      }
      if (!uic.animationEnabled) {
        document.body.classList.add('no-animations');
      } else {
        document.body.classList.remove('no-animations');
      }
    }
  }, [settings]);`;

if (useEffectRegex.test(content)) {
  content = content.replace(useEffectRegex, newUseEffect);
  console.log('✓ Replaced useEffect.');
} else {
  console.log('⚠ Could not match useEffect regex in App.jsx');
}

// 5. Replace header JSX
const startIdx = content.indexOf('return (');
const endIdx = content.indexOf('<main className="dashboard-content">');

if (startIdx !== -1 && endIdx !== -1) {
  const returnBlock = content.substring(startIdx, endIdx);
  if (returnBlock.includes('<header className="app-header">')) {
    const newReturnBlock = `return (
    <div className="app-container" style={computedStyle}>
      <style>{\`
        /* Collapsible Sidebar Styles */
        .app-container {
          display: flex !important;
          flex-direction: row !important;
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-primary);
        }
        .app-sidebar {
          background: var(--bg-card);
          border-right: 1.5px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 101;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 4px 0 20px rgba(0,0,0,0.3);
          flex-shrink: 0;
        }
        .sidebar-logo {
          padding: 16px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1.5px solid var(--border-color);
          min-height: 70px;
        }
        .sidebar-logo .logo-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px solid var(--gold-primary);
          box-shadow: 0 0 8px var(--gold-glow);
          flex-shrink: 0;
          object-fit: cover;
        }
        .sidebar-logo .logo-img-fallback {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(212,175,55,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          border: 1.5px solid var(--gold-primary);
          flex-shrink: 0;
        }
        .sidebar-logo .logo-text {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-logo .logo-text h1 {
          font-size: 0.9rem;
          color: var(--gold-primary);
          font-weight: 700;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin: 0;
        }
        .sidebar-logo .logo-text p {
          font-size: 0.65rem;
          color: var(--text-secondary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin: 0;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 8px;
          flex-grow: 1;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: transparent;
          border: 1.5px solid transparent;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: white;
        }
        .sidebar-item.active {
          background: linear-gradient(95deg, var(--gold-glow) 0%, rgba(212,175,55,0.02) 100%);
          border-color: rgba(212, 175, 55, 0.3);
          color: var(--gold-primary);
        }
        .sidebar-icon {
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        .sidebar-label {
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.2s;
        }
        .sidebar-toggle-btn {
          background: rgba(255,255,255,0.02);
          border: none;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .sidebar-toggle-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .main-layout {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }
        .app-topbar {
          background: var(--bg-card);
          border-bottom: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          min-height: 70px;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          z-index: 100;
        }
        .active-route-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--gold-primary);
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dashboard-content {
          flex-grow: 1;
          overflow-y: auto !important;
          padding: 24px;
          background-color: var(--bg-main);
        }
        .no-animations * {
          transition: none !important;
          animation: none !important;
        }
      \`}</style>

      {/* Left Sidebar Navigation */}
      <aside className="app-sidebar" style={{ width: sidebarCollapsed ? '70px' : '260px' }}>
        <div className="sidebar-logo">
          {settings.shopLogo ? (
            <img src={settings.shopLogo} className="logo-img" alt="Shop Logo" />
          ) : (
            <div className="logo-img-fallback">🪷</div>
          )}
          {!sidebarCollapsed && (
            <div className="logo-text">
              <h1>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</h1>
              <p>{settings.shopSubtitle || 'ຮ້ານອັດກອບພຣະເຄື່ອງ & ວັດຖຸມຸງຄຸນ'}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={\`sidebar-item \${activeTab === 'pos' ? 'active' : ''}\`}
            onClick={() => setActiveTab('pos')}
          >
            <span className="sidebar-icon">💵</span>
            {!sidebarCollapsed && (
              <span className="sidebar-label">
                {activeUser.role === 'technician' ? '🛠️ ງານອັດກອບ (Framing)' : db.getLabel('tab_pos', '💵 ຂາຍໜ້າຮ້ານ (POS)')}
              </span>
            )}
          </button>

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={\`sidebar-item \${activeTab === 'inventory' ? 'active' : ''}\`}
              onClick={() => setActiveTab('inventory')}
            >
              <span className="sidebar-icon">📦</span>
              {!sidebarCollapsed && <span className="sidebar-label">{db.getLabel('tab_inventory', '📦 ສະຕັອກ (Inventory)')}</span>}
            </button>
          )}

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={\`sidebar-item \${activeTab === 'hrm' ? 'active' : ''}\`}
              onClick={() => setActiveTab('hrm')}
            >
              <span className="sidebar-icon">👥</span>
              {!sidebarCollapsed && <span className="sidebar-label">👥 ຈັດການບຸກຄະລາກອນ (HRM)</span>}
            </button>
          )}

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={\`sidebar-item \${activeTab === 'reports' ? 'active' : ''}\`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="sidebar-icon">📊</span>
              {!sidebarCollapsed && <span className="sidebar-label">{db.getLabel('tab_reports', '📊 ລາຍງານ (Reports)')}</span>}
            </button>
          )}

          {(activeUser.role === 'owner' || activeUser.role === 'cashier') && (
            <button
              type="button"
              className={\`sidebar-item \${activeTab === 'debts' ? 'active' : ''}\`}
              onClick={() => setActiveTab('debts')}
            >
              <span className="sidebar-icon">📒</span>
              {!sidebarCollapsed && <span className="sidebar-label">{db.getLabel('tab_debts', '📒 ບັນຊີຕິດໜີ້ (Debts)')}</span>}
            </button>
          )}

          {activeUser.role !== 'cashier' && (
            <button
              type="button"
              className={\`sidebar-item \${activeTab === 'ai' ? 'active' : ''}\`}
              onClick={() => setActiveTab('ai')}
            >
              <span className="sidebar-icon">🤖</span>
              {!sidebarCollapsed && <span className="sidebar-label">{db.getLabel('tab_ai', '🤖 ລະບົບ AI')}</span>}
            </button>
          )}

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={\`sidebar-item \${activeTab === 'settings' ? 'active' : ''}\`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="sidebar-icon">⚙️</span>
              {!sidebarCollapsed && <span className="sidebar-label">{db.getLabel('tab_settings', '⚙️ ຕັ້ງຄ່າ (Settings)')}</span>}
            </button>
          )}
        </nav>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'ขະຫຍາຍເມນູ' : 'ພັບເມນູ'}
        >
          {sidebarCollapsed ? '➡️' : '⬅️'}
        </button>
      </aside>

      {/* Main Right Content Panel */}
      <div className="main-layout">
        {/* Topbar Utility Header */}
        <header className="app-topbar">
          <div className="topbar-left">
            <span className="active-route-name">
              {activeTab === 'pos' && (activeUser.role === 'technician' ? '🛠️ ງານອັດກອບ (Framing)' : '💵 ຂາຍໜ້າຮ້ານ (POS)')}
              {activeTab === 'inventory' && '📦 ຈັດການສະຕັອກ & ວັດຖຸດິບ (Inventory)'}
              {activeTab === 'hrm' && '👥 ຈັດການບຸກຄະລາກອນ & ເງິນເດືອນ (HRM)'}
              {activeTab === 'reports' && '📊 ບົດລາຍງານຍອດຂາຍ & ລາຍຈ່າຍ (Reports)'}
              {activeTab === 'debts' && '📒 ບັນຊີລູກຄ້າຕິດໜີ້ (Debts)'}
              {activeTab === 'ai' && '🤖 ລະບົບກ້ອງ CCTV AI'}
              {activeTab === 'settings' && '⚙️ ຕັ້ງຄ່າລະບົບ (Settings)'}
            </span>
          </div>

          <div className="topbar-actions">
            {lowStockWarning && activeUser.role === 'owner' && (
              <div
                onClick={() => {
                  setActiveTab('inventory');
                  setInventoryFilter('low_stock');
                }}
                style={{
                  background: 'rgba(231, 76, 60, 0.2)',
                  color: 'var(--alert-red)',
                  border: '1px solid var(--alert-red)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  animation: 'pulse-gold 1.5s infinite',
                  cursor: 'pointer'
                }}
              >
                ⚠️ ສະຕັອກໃກ້ໝົດ!
              </div>
            )}

            {/* Quick-action Expense Logger */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'rgba(229, 169, 59, 0.12)',
                color: 'var(--accent-amber)',
                borderColor: 'rgba(229, 169, 59, 0.3)',
                whiteSpace: 'nowrap',
                fontWeight: 'bold'
              }}
              onClick={() => {
                setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '' });
                setShowExpenseModal(true);
              }}
            >
              💸 ບັນທຶກລາຍຈ່າຍ
            </button>

            {/* Shift Report reprint button for active / last shift */}
            {activeUser.role === 'cashier' && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold'
                }}
                onClick={() => {
                  const logs = db.getAttendance();
                  const activeRecord = logs.find(l => l.userId === activeUser.id && !l.clockOut);
                  const lastRecord = logs.find(l => l.userId === activeUser.id);
                  const recordToUse = activeRecord || lastRecord;
                  if (recordToUse) {
                    const summary = db.getSalesSummary(activeUser.id, recordToUse.clockIn, recordToUse.clockOut || new Date().toISOString(), true);
                    setShiftReportData({
                      cashierName: activeUser.name,
                      clockIn: recordToUse.clockIn,
                      clockOut: recordToUse.clockOut || null,
                      ...summary
                    });
                    setShowShiftReportModal(true);
                  } else {
                    alert('ບໍ່ພົບຂໍ້ມູນກະການເຮັດວຽກ!');
                  }
                }}
              >
                🖨️ ສະຫຼຸບກະ
              </button>
            )}

            <div className="user-badge" style={{ border: 'none', background: 'transparent', padding: 0 }}>
              <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}>
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : settings.shopLogo ? (
                  <img src={settings.shopLogo} alt="Shop Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  activeUser.role === 'owner' ? '👑' : activeUser.role === 'cashier' ? '💵' : '🛠️'
                )}
              </div>
              <div className="user-info-text">
                <div className="user-name">{activeUser.name}</div>
                <div className="user-role">
                  {activeUser.roleName.split(' ')[0]}
                  {todayAttendance && !todayAttendance.clockOut && (
                    <span style={{ color: 'var(--success-green)', fontWeight: 'bold', marginLeft: '6px' }}>
                      (ກະ: {db.getShiftSales(activeUser.id).toLocaleString()} ₭)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Clock-In / Clock-Out Button */}
              <div style={{ marginLeft: '6px', marginRight: '6px', display: 'flex', alignItems: 'center' }}>
                {!todayAttendance ? (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      background: 'var(--success-green)',
                      color: 'black',
                      fontWeight: 'bold',
                      borderColor: 'var(--success-green)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => {
                      const rec = db.clockInUser(activeUser.id);
                      setTodayAttendance(rec);
                      alert('✓ ບັນທຶກເວລາເຂົ້າງານສຳເລັດ!');
                      handleSystemUpdate();
                    }}
                  >
                    🕒 ເຂົ້າງານ
                  </button>
                ) : !todayAttendance.clockOut ? (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      background: 'var(--alert-red)',
                      color: 'white',
                      fontWeight: 'bold',
                      borderColor: 'var(--alert-red)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => {
                      handleClockOut();
                    }}
                  >
                    🕒 ອອກງານ
                  </button>
                ) : (
                  <span
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.65rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-secondary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    ✓ ເຮັດວຽກແລ້ວ
                  </span>
                )}
              </div>

              <button className="logout-btn" onClick={handleLogout} title="ອອກຈາກລະບົບ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Tabs Renderer */}
        <main className="dashboard-content">`;
        
    content = content.substring(0, startIdx) + newReturnBlock + content.substring(endIdx);
    console.log('✓ Replaced JSX header block.');
  } else {
    console.log('⚠ return block does not match expected layout');
  }
} else {
  console.log('⚠ Could not find startIdx/endIdx for header replacement');
}

// 6. Inject HRM tab component rendering
const hrmRenderSearch = "{activeTab === 'reports' && activeUser.role === 'owner' && (\n          <Reports activeUser={activeUser} />\n        )}";
const hrmRenderReplacement = `{activeTab === 'reports' && activeUser.role === 'owner' && (
          <Reports activeUser={activeUser} />
        )}
        
        {activeTab === 'hrm' && activeUser.role === 'owner' && (
          <HRM activeUser={activeUser} onUpdate={handleSystemUpdate} />
        )}`;

if (content.includes(hrmRenderSearch)) {
  content = content.replace(hrmRenderSearch, hrmRenderReplacement);
  console.log('✓ Added HRM tab component routing.');
} else {
  console.log('⚠ Could not find Reports route to inject HRM route.');
}

// Write the modified content back to App.jsx
fs.writeFileSync(appPath, content, 'utf8');
console.log('✓ App.jsx successfully updated.');
