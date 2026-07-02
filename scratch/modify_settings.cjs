const fs = require('fs');
const path = require('path');

const settingsPath = 'src/components/Settings.jsx';
let content = fs.readFileSync(settingsPath, 'utf8');

// 1. Create a backup
const backupDir = 'C:/Users/sutha/.gemini/antigravity/brain/57160ca8-be3f-481c-9ffc-5f8f79e955b7/scratch';
fs.writeFileSync(path.join(backupDir, 'Settings_backup.jsx'), content);
console.log('✓ Settings.jsx backed up successfully.');

// 2. Find range for activeSubTab === 'theme'
const startToken = "{activeSubTab === 'theme' && (";
const endToken = "          {activeSubTab === 'labels' && (";

const startIdx = content.indexOf(startToken);
const endIdx = content.indexOf(endToken);

if (startIdx !== -1 && endIdx !== -1) {
  const newThemeSubTabBlock = `{activeSubTab === 'theme' && (
            <form onSubmit={(e) => {
              e.preventDefault();
              db.saveSettings(settings);
              setSuccessMsg('✓ ບັນທຶກການຕັ້ງຄ່າຮູບແບບສີ, UI ແລະ Dashboard ສຳເລັດ!');
              if (onUpdate) onUpdate();
              setTimeout(() => setSuccessMsg(''), 3000);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                🎨 ປັບແຕ່ງຮູບແບບ, UI & ໜ້າ Dashboard (Theme & Layout Configurator)
              </h3>
              
              {/* Preset Themes */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>🌈 ເለືອກໂທນສີຫຼັກເລີ່ມຕົ້ນ (Preset Themes)</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[
                    { id: 'gold', name: '🟡 ສີທອງ (Temple Gold)', primary: '#d4af37', bgMain: '#0c0b09', bgCard: '#161411', border: '#2e2a22' },
                    { id: 'amber', name: '🟠 ສີສົ້ມ (Warm Amber)', primary: '#e67e22', bgMain: '#0f0e0c', bgCard: '#1d1914', border: '#33271d' },
                    { id: 'emerald', name: '🟢 ສີຂຽວ (Emerald)', primary: '#2ecc71', bgMain: '#080d0a', bgCard: '#101c14', border: '#172e21' },
                    { id: 'blue', name: '🔵 ສີຟ້າ (Royal Blue)', primary: '#3498db', bgMain: '#080d12', bgCard: '#101720', border: '#1a2636' },
                    { id: 'crimson', name: '🔴 ສີແດງ (Crimson Red)', primary: '#e74c3c', bgMain: '#100a0a', bgCard: '#1e1111', border: '#331d1d' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className="btn"
                      style={{
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        border: settings.appTheme === t.id ? '2px solid white' : '1px solid var(--border-color)',
                        background: '#1a1815',
                        color: settings.appTheme === t.id ? t.primary : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        const updatedColors = {
                          ...(settings.themeColors || {}),
                          'gold-primary': t.primary,
                          'bg-main': t.bgMain,
                          'bg-card': t.bgCard,
                          'border-color': t.border
                        };
                        const updatedThemeConfig = {
                          ...(settings.themeConfig || {}),
                          colors: {
                            ...(settings.themeConfig?.colors || {}),
                            primary: t.primary,
                            background: t.bgMain,
                            card: t.bgCard,
                            border: t.border
                          }
                        };
                        setSettings({
                          ...settings,
                          appTheme: t.id,
                          themeColors: updatedColors,
                          themeConfig: updatedThemeConfig
                        });
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Colors Section */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>🎨 ປັບແຕ່ງສີລະບົບລະອຽດ (System Color Palette)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'ສີຫຼັກ (Primary Gold)', key: 'primary', defaultValue: '#D4AF37' },
                    { label: 'ສີຮອງ (Secondary Brown)', key: 'secondary', defaultValue: '#4A3B32' },
                    { label: 'ພື້ນຫຼັງ (Main Background)', key: 'background', defaultValue: '#13110F' },
                    { label: 'ພື້ນຫຼັງກ່ອງ (Card/Surface)', key: 'card', defaultValue: '#24201C' },
                    { label: 'ພື້ນຫຼັງເມນູ (Sidebar)', key: 'sidebar', defaultValue: '#1E1B18' },
                    { label: 'ແຖບເທິງ (Topbar)', key: 'topbar', defaultValue: '#191613' },
                    { label: 'ຂອບ (Border)', key: 'border', defaultValue: '#3D352E' },
                    { label: 'ສີສຳເລັດ (Success Green)', key: 'success', defaultValue: '#2ecc71' },
                    { label: 'ສີແຈ້ງເຕືອນ (Danger Red)', key: 'danger', defaultValue: '#e74c3c' }
                  ].map(c => {
                    const currentColor = settings.themeConfig?.colors?.[c.key] || c.defaultValue;
                    return (
                      <div key={c.key} className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>{c.label}</label>
                        <input
                          type="color"
                          className="form-control"
                          style={{ height: '36px', padding: '2px', cursor: 'pointer' }}
                          value={currentColor}
                          onChange={(e) => {
                            const updatedConfig = {
                              ...(settings.themeConfig || {}),
                              colors: {
                                ...(settings.themeConfig?.colors || {}),
                                [c.key]: e.target.value
                              }
                            };
                            const legacyMap = { primary: 'gold-primary', background: 'bg-main', card: 'bg-card', border: 'border-color', success: 'success-green', danger: 'alert-red' };
                            const updatedColors = { ...(settings.themeColors || {}) };
                            if (legacyMap[c.key]) {
                              updatedColors[legacyMap[c.key]] = e.target.value;
                            }
                            setSettings({
                              ...settings,
                              themeColors: updatedColors,
                              themeConfig: updatedConfig
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Layout & Typography Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Border Radius and Spacing */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>📐 ປັບແຕ່ງຂະໜາດ & ຄວາມໂຄ້ງມົນ (Layout Settings)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ຄວາມໂຄ້ງມົນຂອງຂອບ (Border Radius)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                          {parseInt(settings.themeConfig?.layout?.borderRadius || '8')}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        className="form-control"
                        value={parseInt(settings.themeConfig?.layout?.borderRadius || '8')}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            layout: {
                              ...(settings.themeConfig?.layout || {}),
                              borderRadius: val + 'px'
                            }
                          };
                          const updatedColors = {
                            ...(settings.themeColors || {}),
                            'radius-lg': val + 'px',
                            'radius-md': Math.round(val / 2) + 'px',
                            'radius-sm': Math.round(val / 4) + 'px'
                          };
                          setSettings({ ...settings, themeColors: updatedColors, themeConfig: updatedConfig });
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຄວາມກວ້າງເມນູຊ້າຍ (Sidebar Width)</label>
                      <select
                        className="form-control"
                        value={settings.themeConfig?.layout?.sidebarWidth || '260px'}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            layout: {
                              ...(settings.themeConfig?.layout || {}),
                              sidebarWidth: e.target.value
                            }
                          };
                          setSettings({ ...settings, themeConfig: updatedConfig });
                        }}
                      >
                        <option value="220px">220px (ເມນູຂະໜາດນ້ອຍ)</option>
                        <option value="240px">240px (ເມນູປານກາງ)</option>
                        <option value="260px">260px (ເມນູມາດຕະຖານ)</option>
                        <option value="280px">280px (ເມນູຂະໜາດໃຫຍ່)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>✍️ ປັບແຕ່ງຕົວໜັງສື (Typography)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຟອນຕົວໜັງສື (Font Family)</label>
                      <select
                        className="form-control"
                        value={settings.themeConfig?.typography?.fontFamily || 'Outfit, Phetsarath OT, sans-serif'}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            typography: {
                              ...(settings.themeConfig?.typography || {}),
                              fontFamily: e.target.value
                            }
                          };
                          setSettings({ ...settings, themeConfig: updatedConfig });
                        }}
                      >
                        <option value="Phetsarath, Noto Sans Lao, sans-serif">Phetsarath / Noto Sans Lao</option>
                        <option value="Outfit, Phetsarath OT, sans-serif">Outfit & Phetsarath (Premium Layout)</option>
                        <option value="Phetsarath OT, Inter, sans-serif">Inter & Phetsarath OT</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຂະໜາດຕົວໜັງສືເລີ່ມຕົ້ນ (Base Font Size)</label>
                      <select
                        className="form-control"
                        value={settings.themeConfig?.typography?.fontSizeBase || '14px'}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            typography: {
                              ...(settings.themeConfig?.typography || {}),
                              fontSizeBase: e.target.value
                            }
                          };
                          setSettings({ ...settings, themeConfig: updatedConfig });
                        }}
                      >
                        <option value="13px">13px (ຕົວໜັງສືນ້ອຍ)</option>
                        <option value="14px">14px (ຕົວໜັງສືປົກກະຕິ)</option>
                        <option value="15px">15px (ຕົວໜັງສືໃຫຍ່)</option>
                        <option value="16px">16px (ຕົວໜັງສືໃຫຍ່ພິເສດ)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* UI Controls Toggles */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>⚙️ ການຄວບຄຸມເອັບເຟັກ UI & ລະບົບ (UI Toggles)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { label: '✨ ເອັບເຟັກການເຄື່ອນໄຫວ (Animations)', key: 'animationEnabled' },
                    { label: '🌓 ເງົາ ແລະ ມິຕິກ່ອງ (Card Shadows)', key: 'shadowsEnabled' },
                    { label: '🔲 ປຸ່ມຂອບມົນ (Rounded Corners)', key: 'roundedCorners' },
                    { label: '⚡ ເອັບເຟັກຊີ້ເມົາ (Hover Scale-up)', key: 'hoverEffects' },
                    { label: '⏳ ໂຫຼດແບບ Skeleton (Loading placeholders)', key: 'skeletonLoading' },
                    { label: '🔔 ແຈ້ງເຕືອນແອບພັອບອັບ (Toast alerts)', key: 'toastNotifications' },
                    { label: '🔄 ໂຫຼດແດຊບອດອັດຕະໂນມັດ (Auto dashboard refresh)', key: 'autoRefreshDashboard' },
                    { label: '🔊 ສຽງເອັບເຟັກກົດປຸ່ມ (Click sounds)', key: 'soundEffects' }
                  ].map(u => {
                    const isChecked = settings.uiControls?.[u.key] ?? true;
                    return (
                      <label key={u.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updatedUi = {
                              ...(settings.uiControls || {}),
                              [u.key]: e.target.checked
                            };
                            setSettings({
                              ...settings,
                              uiControls: updatedUi
                            });
                          }}
                        />
                        {u.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dashboard widgets builder */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>📊 ຕົວຈັດການກ່ອງສະແດງຜົນໜ້າ Dashboard (Dashboard Builder Widgets)</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  ເລືອກວິດເຈັດ (Widgets) ທີ່ຕ້ອງການໃຫ້ສະແດງຜົນໃນໜ້າທຳອິດ ຫຼື ໜ້າລາຍງານ.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                      { label: '💵 ຍອດຂາຍມື້ນີ້ (Sales Today)', id: 'sales_today' },
                      { label: '📈 ກຣາຟລາຍຮັບ (Revenue Chart)', id: 'revenue_chart' },
                      { label: '📦 ມູນຄ່າສະຕັອກ (Stock Valuation)', id: 'stock_valuation' },
                      { label: '🏭 ກຳລັງການຜະລິດ (Capacity Tool)', id: 'capacity_widget' },
                      { label: '👥 ລາຍຊື່ເຂົ້າງານ (Attendance list)', id: 'attendance_checklist' }
                    ].map(w => {
                      const activeWidgets = settings.dashboardBuilder?.widgets || [];
                      const isIncluded = activeWidgets.includes(w.id);
                      return (
                        <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={(e) => {
                              let updatedWidgets = [...activeWidgets];
                              if (e.target.checked) {
                                if (!updatedWidgets.includes(w.id)) updatedWidgets.push(w.id);
                              } else {
                                updatedWidgets = updatedWidgets.filter(id => id !== w.id);
                              }
                              setSettings({
                                ...settings,
                                dashboardBuilder: {
                                  ...(settings.dashboardBuilder || {}),
                                  widgets: updatedWidgets
                                }
                              });
                            }}
                          />
                          {w.label}
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຮູບແບບກຣາຟລາຍຮັບ (Default Chart Type)</label>
                      <select
                        className="form-control"
                        value={settings.dashboardBuilder?.chartType || 'bar'}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            dashboardBuilder: {
                              ...(settings.dashboardBuilder || {}),
                              chartType: e.target.value
                            }
                          });
                        }}
                      >
                        <option value="bar">📊 ກຣາຟແທ່ງ (Bar Chart)</option>
                        <option value="line">📈 ກຣາຟເສັ້ນ (Line Chart)</option>
                        <option value="pie">🍕 ກຣາຟວົງກົມ (Pie Chart)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ໄລຍະເວລາໂຫຼດໃໝ່ - ວິນາທີ (Auto Refresh Interval)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="10"
                        max="300"
                        value={settings.dashboardBuilder?.refreshInterval || 60}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            dashboardBuilder: {
                              ...(settings.dashboardBuilder || {}),
                              refreshInterval: parseInt(e.target.value) || 60
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-end', marginTop: '10px' }}>
                💾 ບັນທຶກຮູບແບບ, UI & ວິດເຈັດ
              </button>
            </form>
          )}

          {activeSubTab === 'labels' && (`;

  content = content.substring(0, startIdx) + newThemeSubTabBlock + content.substring(endIdx);
  fs.writeFileSync(settingsPath, content, 'utf8');
  console.log('✓ Settings.jsx updated successfully.');
} else {
  console.log('⚠ Could not find startIdx/endIdx in Settings.jsx');
}
