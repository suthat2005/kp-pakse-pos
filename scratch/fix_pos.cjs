const fs = require('fs');
const path = require('path');

const file = 'src/components/POS.jsx';
const filePath = path.join(process.cwd(), file);
if (!fs.existsSync(filePath)) {
  console.log('POS.jsx not found!');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Fix 1 Regex: find the block starting with placeholder="ເຊັ່ນ: VIP-1, Q05..." followed by padding: '10px' up to </form>\s*</div>\s*</div>\s*)\s*\}\s*.*Service Configuration Modal
const regex1 = /placeholder\s*=\s*["']ເຊັ່ນ:\s*VIP-1,\s*Q05\.\.\.["'][\s\S]*?Service\s+Configuration\s+Modal[\s\S]*?serviceConfigProduct\.price\.toLocaleString\(\)\}[\s\S]*?<\/div>/;

const restoredPart1 = `placeholder="ເຊັ່ນ: VIP-1, Q05..."
                    value={newSlotId}
                    onChange={(e) => setNewSlotId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ຊື່ບັດຄິວ (Slot Label / Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ເຊັ່ນ: ວີໄອພີ 1 (ຖ້າວ່າງຈະໃຊ້ລະຫັດແທນ)"
                    value={newSlotLabel}
                    onChange={(e) => setNewSlotLabel(e.target.value)}
                  />
                </div>
                {addSlotError && (
                  <p style={{ color: 'var(--alert-red)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    ⚠️ {addSlotError}
                  </p>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddSlotModal(false); setAddSlotError(''); }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">ຢືນຢັນ ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Configuration Modal */}
      {showServiceConfigModal && serviceConfigProduct && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🛠️ ຕັ້ງຄ່າການບໍລິການອັດກอบ</h3>
              <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => { setShowServiceConfigModal(false); setServiceConfigProduct(null); }}>✕</button>
            </div>

            <form onSubmit={handleConfirmServiceConfig}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: 0, marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{serviceConfigProduct.name}</div>
                  <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold', marginTop: '4px' }}>₭{serviceConfigProduct.price.toLocaleString()} / ອົງ</div>
                </div>`;

// Fix 2 Regex: find the block starting with serviceConfigAmulets.map up to the Total display row
const regex2 = /\{serviceConfigAmulets\.map\([\s\S]*?Rename\s+Queue[\s\S]*?Total:[\s\S]*?serviceConfigQty[\s\S]*?<\/div>/;

const restoredPart2 = `{serviceConfigAmulets.map((amulet, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '10px', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <div 
                          onClick={() => document.getElementById(\`service-amulet-file-\${index}\`).click()}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '6px',
                            background: '#221e1a',
                            border: '1.5px dashed var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden'
                          }}
                          title="ອັບໂຫຼດຮູບພຣະ"
                        >
                          {amulet.image ? (
                            <img src={amulet.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          ) : (
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>📷</span>
                          )}
                        </div>
                        <input
                          type="file"
                          id={\`service-amulet-file-\${index}\`}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setServiceConfigAmulets(prev => {
                                  const copy = [...prev];
                                  copy[index].image = reader.result;
                                  return copy;
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 'bold', marginBottom: '4px' }}>ອົງທີ \${index + 1}</div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ປ້ອນຊື່ພຣະເຄື່ອງ/ລາຍລະອຽດ..."
                          value={amulet.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServiceConfigAmulets(prev => {
                              const copy = [...prev];
                              copy[index].description = val;
                              return copy;
                            });
                          }}
                          style={{ width: '100%', background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
                  <span>ຍອດລວມທັງໝົດ / Total:</span>
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>₭{(serviceConfigProduct.price * serviceConfigQty).toLocaleString()}</span>
                </div>`;

if (regex1.test(content)) {
  content = content.replace(regex1, restoredPart1);
  console.log('Part 1 matched and replaced!');
} else {
  console.log('Part 1 regex did not match!');
}

if (regex2.test(content)) {
  content = content.replace(regex2, restoredPart2);
  console.log('Part 2 matched and replaced!');
} else {
  console.log('Part 2 regex did not match!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('POS.jsx has been fixed.');
