const fs = require('fs');
const path = require('path');

const inventoryPath = 'src/components/Inventory.jsx';
let content = fs.readFileSync(inventoryPath, 'utf8');

// Restore from backup to start clean
const backupDir = 'C:/Users/sutha/.gemini/antigravity/brain/57160ca8-be3f-481c-9ffc-5f8f79e955b7/scratch';
const backupPath = path.join(backupDir, 'Inventory_backup.jsx');
if (fs.existsSync(backupPath)) {
  content = fs.readFileSync(backupPath, 'utf8');
  console.log('✓ Restored clean Inventory.jsx from backup.');
}

// 1. Define Sub-Views RawMaterialsSubView and ManufacturingSubView code
const subViewsCode = `
// ==========================================
// 💎 RAW MATERIALS SUB-VIEW
// ==========================================
function RawMaterialsSubView() {
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', category: 'acrylic', unit: 'ແຜ່ນ', stock_qty: '', min_stock: '', cost_price: '', supplier: '' });
  const [csvText, setCsvText] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = () => {
    setMaterials(db.getRawMaterials());
  };

  const handleOpenAdd = () => {
    setEditMaterial(null);
    setFormData({ name: '', category: 'acrylic', unit: 'ແຜ່ນ', stock_qty: '', min_stock: '', cost_price: '', supplier: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditMaterial(m);
    setFormData({ ...m });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('ຕ້ອງການລຶບວັດຖຸດິບນີ້ແມ່ນບໍ່?')) {
      db.deleteRawMaterial(id);
      loadMaterials();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      stock_qty: Number(formData.stock_qty || 0),
      min_stock: Number(formData.min_stock || 0),
      cost_price: Number(formData.cost_price || 0)
    };
    if (editMaterial) {
      db.updateRawMaterial({ ...editMaterial, ...data });
    } else {
      db.addRawMaterial(data);
    }
    setShowModal(false);
    loadMaterials();
  };

  const handleExportCsv = () => {
    const headers = 'ID,Name,Category,Unit,Stock Qty,Min Stock,Cost Price,Supplier\\n';
    const rows = materials.map(m => '"' + m.id + '","' + m.name + '","' + m.category + '","' + m.unit + '",' + m.stock_qty + ',' + m.min_stock + ',' + m.cost_price + ',"' + (m.supplier || '') + '"').join('\\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'raw_materials_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = () => {
    try {
      const lines = csvText.split('\\n');
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 7) {
          db.addRawMaterial({
            name: cols[1],
            category: cols[2] || 'acrylic',
            unit: cols[3] || 'ອັນ',
            stock_qty: Number(cols[4] || 0),
            min_stock: Number(cols[5] || 0),
            cost_price: Number(cols[6] || 0),
            supplier: cols[7] || ''
          });
          importedCount++;
        }
      }
      alert('✓ ນຳເຂົ້າວັດຖຸດິບສຳເລັດ ' + importedCount + ' ລາຍການ!');
      setShowCsvModal(false);
      setCsvText('');
      loadMaterials();
    } catch (err) {
      alert('⚠ ຂໍ́ຜິດພາດໃນການນຳເຂົ້າ CSV: ' + err.message);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 ຄົ້ນຫາວັດຖຸດິບ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportCsv}>📤 ສົ່ງອອກ CSV</button>
          <button className="btn btn-secondary" onClick={() => setShowCsvModal(true)}>📥 ນຳເຂົ້າ CSV</button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>➕ ເພີ່ມວັດຖຸດິບໃໝ່</button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>ຊື່ວັດຖຸດິບ</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>ໝວດໝູ່</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>ຫົວໜ່ວຍ</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>ຈຳນວນສະຕັອກ</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>ຈຳນວນຕໍ່າສຸດ</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>ຕົ້ນທຶນ (LAK)</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>ຜູ້ສະໜອງ</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>ຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)', background: m.stock_qty <= m.min_stock ? 'rgba(231,76,60,0.03)' : 'transparent' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{m.name}</td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{m.category}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{m.unit}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: m.stock_qty <= m.min_stock ? 'var(--alert-red)' : 'white' }}>
                  {m.stock_qty.toLocaleString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{m.min_stock}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{m.cost_price.toLocaleString()} ₭</td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{m.supplier || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleOpenEdit(m)}>✏️ ແກ້ໄຂ</button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.1)' }} onClick={() => handleDelete(m.id)}>🗑️ ລຶບ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '450px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{editMaterial ? '✏️ ແກ້ໄຂຂໍ້ມູນວັດຖຸດິບ' : '➕ ເພີ່ມວັດຖຸດິບໃໝ່'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">ຊື່ວັດຖຸດິບ</label>
                <input type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">ໝວດໝູ່</label>
                  <select className="form-control" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="acrylic">ອາຄຣີລິກ (Acrylic)</option>
                    <option value="wood">ໄມ້/ຂອບໄມ້ (Wood)</option>
                    <option value="glass">ແກ້ວ/ເລນ (Glass)</option>
                    <option value="glue">ກາວ/ອຸປະກອນ (Glue/Chemicals)</option>
                    <option value="other">ອື່ນໆ (Other)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ຫົວໜ່ວຍ</label>
                  <input type="text" className="form-control" placeholder="ແຜ່ນ, ອັນ, ກ່ອງ,..." required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">ຈຳນວນສະຕັອກ</label>
                  <input type="number" className="form-control" required value={formData.stock_qty} onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ຈຳນວນເຕືອນຕໍ່າສຸດ</label>
                  <input type="number" className="form-control" required value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ຕົ້ນທຶນຕໍ່ໜ່ວຍ (LAK)</label>
                <input type="number" className="form-control" required value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">ຜູ້ສະໜອງ (Supplier)</label>
                <input type="text" className="form-control" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
              </div>
              <div className="modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">💾 ຢືນຢັນ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '500px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>📥 ນຳເຂົ້າວັດຖຸດິບຜ່ານ CSV</h3>
              <button className="close-btn" onClick={() => setShowCsvModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ວາງເນື້ອຫາໄຟລ໌ CSV ຂອງວັດຖຸດິບຕາມຮູບແບບດ້ານລຸ່ມນີ້ (ຫ້າມລົບແຖວຫົວຂໍ້ທຳອິດ):
              </p>
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.75rem', background: '#1c1915' }}
                placeholder="ID,Name,Category,Unit,Stock Qty,Min Stock,Cost Price,Supplier&#10;,Acrylic sheet 2mm,acrylic,sheet,50,5,45000,PT Supplier"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <div className="modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCsvModal(false)}>ຍົກເລີກ</button>
                <button type="button" className="btn btn-primary" onClick={handleImportCsv} disabled={!csvText.trim()}>💾 ຢືນຢັນການນຳເຂົ້າ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🏭 BOM FORMULA & MANUFACTURING SUB-VIEW
// ==========================================
function ManufacturingSubView() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bomList, setBomList] = useState([]);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [matQty, setMatQty] = useState('');

  const [sheetW, setSheetW] = useState('30');
  const [sheetH, setSheetH] = useState('30');
  const [pieceW, setPieceW] = useState('4');
  const [pieceH, setPieceH] = useState('4');
  const [margin, setMargin] = useState('0.2');
  const [sheetCost, setSheetCost] = useState('50000');

  const [solverResult, setSolverResult] = useState({ yieldCount: 0, efficiency: 0, waste: 0, costPerUnit: 0, rows: 0, cols: 0 });
  const [produceQty, setProduceQty] = useState('10');
  const [productionHistory, setProductionHistory] = useState([]);

  useEffect(() => {
    loadData();
    calculateAcrylicYield();
  }, []);

  useEffect(() => {
    calculateAcrylicYield();
  }, [sheetW, sheetH, pieceW, pieceH, margin, sheetCost]);

  const loadData = () => {
    setProducts(db.getProducts().filter(p => !db.isServiceCategory(p.category)));
    setRawMaterials(db.getRawMaterials());
    setProductionHistory(db.getProductionHistory());
  };

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setBomList(p.bom || []);
  };

  const handleAddRecipeMaterial = (e) => {
    e.preventDefault();
    if (!selectedMatId || !matQty || isNaN(matQty) || Number(matQty) <= 0) {
      alert('ກະລຸນາເລືອກວັດຖຸດິບ ແລະ ປ້ອນຈຳນວນທີ່ຖືກຕ້ອງ');
      return;
    }
    const mat = rawMaterials.find(m => m.id === selectedMatId);
    if (!mat) return;

    const existingIdx = bomList.findIndex(b => b.materialId === selectedMatId);
    let updatedList = [...bomList];
    if (existingIdx !== -1) {
      updatedList[existingIdx].qty += Number(matQty);
    } else {
      updatedList.push({
        materialId: selectedMatId,
        materialName: mat.name,
        qty: Number(matQty)
      });
    }
    setBomList(updatedList);
    setSelectedMatId('');
    setMatQty('');
  };

  const handleRemoveRecipeMaterial = (matId) => {
    setBomList(bomList.filter(b => b.materialId !== matId));
  };

  const handleSaveRecipe = () => {
    if (!selectedProduct) return;
    const updatedProduct = {
      ...selectedProduct,
      bom: bomList
    };
    db.updateProduct(updatedProduct);
    alert('✓ ບັນທຶກສູດການຜະລິດສຳເລັດ!');
    loadData();
    setSelectedProduct(updatedProduct);
  };

  const calculateAcrylicYield = () => {
    const sW = parseFloat(sheetW) || 0;
    const sH = parseFloat(sheetH) || 0;
    const pW = parseFloat(pieceW) || 0;
    const pH = parseFloat(pieceH) || 0;
    const m = parseFloat(margin) || 0;
    const cost = parseFloat(sheetCost) || 0;

    if (sW <= 0 || sH <= 0 || pW <= 0 || pH <= 0) return;

    const cols = Math.floor(sW / (pW + m));
    const rows = Math.floor(sH / (pH + m));
    const yieldCount = cols * rows;
    
    let efficiency = 0;
    let waste = 100;
    let costPerUnit = 0;

    if (yieldCount > 0) {
      efficiency = ((yieldCount * pW * pH) / (sW * sH)) * 100;
      waste = 100 - efficiency;
      costPerUnit = cost / yieldCount;
    }

    setSolverResult({
      yieldCount,
      efficiency: Math.round(efficiency * 10) / 10,
      waste: Math.round(waste * 10) / 10,
      costPerUnit: Math.round(costPerUnit),
      rows,
      cols
    });
  };

  const calculateCapacity = (prod) => {
    if (!prod || !prod.bom || prod.bom.length === 0) return 0;
    const capacities = prod.bom.map(recipe => {
      const mat = rawMaterials.find(m => m.id === recipe.materialId);
      if (!mat) return 0;
      return Math.floor(mat.stock_qty / recipe.qty);
    });
    return Math.min(...capacities);
  };

  const handleExecuteProduction = () => {
    if (!selectedProduct) return;
    const qty = parseInt(produceQty);
    if (isNaN(qty) || qty <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນທີ່ຕ້ອງການຜະລິດ');
      return;
    }

    try {
      db.addProductionJob(selectedProduct.id, qty);
      alert('✓ ຜະລິດສິນຄ້າ ' + selectedProduct.name + ' ຈຳນວນ ' + qty + ' ອັນ ສຳເລັດ!');
      loadData();
      const updatedProd = db.getProducts().find(p => p.id === selectedProduct.id);
      setSelectedProduct(updatedProd);
    } catch (err) {
      alert('⚠ ຂໍ້ຜິດພາດໃນການຜະລິດ: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
      
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: 0 }}>📦 ເລືອກສິນຄ້າເພື່ອຈັດການ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '450px', overflowY: 'auto' }}>
          {products.map(p => {
            const hasBOM = p.bom && p.bom.length > 0;
            return (
              <button
                key={p.id}
                type="button"
                className="btn"
                style={{
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  border: selectedProduct?.id === p.id ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                  background: selectedProduct?.id === p.id ? 'rgba(212,175,55,0.06)' : '#1c1915',
                  color: selectedProduct?.id === p.id ? 'var(--gold-primary)' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handleSelectProduct(p)}
              >
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                <span style={{ fontSize: '0.7rem', color: hasBOM ? 'var(--success-green)' : 'var(--text-secondary)' }}>
                  {hasBOM ? '✓ ມີສູດ' : '⚠ ບໍ່ມີສູດ'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {selectedProduct ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                  🧪 ສູດການຜະລິດ (BOM Formula Recipe) - {selectedProduct.name}
                </h3>
                <form onSubmit={handleAddRecipeMaterial} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <select
                    className="form-control"
                    required
                    style={{ flexGrow: 1 }}
                    value={selectedMatId}
                    onChange={(e) => setSelectedMatId(e.target.value)}
                  >
                    <option value="">-- ເລືອກວັດຖຸດິບ --</option>
                    {rawMaterials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.stock_qty} {m.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    required
                    className="form-control"
                    style={{ width: '90px' }}
                    placeholder="ຈຳນວນ"
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>ເພີ່ມ</button>
                </form>

                <div style={{ minHeight: '120px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', background: 'rgba(0,0,0,0.1)' }}>
                  {bomList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      ຍັງບໍ່ທັນມີວັດຖຸດິບໃນສູດການຜະລິດ.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {bomList.map(item => (
                        <div key={item.materialId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1915', padding: '6px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.materialName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>{item.qty}</span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '1rem' }}
                              onClick={() => handleRemoveRecipeMaterial(item.materialId)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '14px' }} onClick={handleSaveRecipe}>
                  💾 ບັນທຶກສູດການຜະລິດ (Save BOM)
                </button>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                    🏭 ຜະລິດສິນຄ້າ (Execute Manufacturing)
                  </h3>
                  
                  <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed var(--gold-primary)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ກຳລັງການຜະລິດສູງສຸດ (Max Yield Capacity):</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>
                      {calculateCapacity(selectedProduct)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>ອັນ</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      * ຄຳນວນຈາກວັດຖຸດິບຄົງເຫຼືອໃນສະຕັອກ
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ຈຳນວນທີ່ຕ້ອງການຜະລິດ</label>
                    <input
                      type="number"
                      className="form-control"
                      value={produceQty}
                      onChange={(e) => setProduceQty(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', background: 'var(--success-green)', borderColor: 'var(--success-green)', color: 'black', fontWeight: 'bold' }}
                  onClick={handleExecuteProduction}
                  disabled={calculateCapacity(selectedProduct) <= 0}
                >
                  🚀 ສັ່ງຜະລິດສິນຄ້າ (Manufacture)
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 14px' }}>
                📐 ເຄື່ອງຄິດໄລ່ແຜ່ນອາຄຣີລິກ (Acrylic Sheet Cutting Solver)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ກວ້າງແຜ່ນ (Sheet W - cm)</label>
                      <input type="number" className="form-control" value={sheetW} onChange={(e) => setSheetW(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ສູງແຜ່ນ (Sheet H - cm)</label>
                      <input type="number" className="form-control" value={sheetH} onChange={(e) => setSheetH(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ກວ້າງຊິ້ນງານ (Piece W - cm)</label>
                      <input type="number" className="form-control" value={pieceW} onChange={(e) => setPieceW(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ສູງຊິ້ນງານ (Piece H - cm)</label>
                      <input type="number" className="form-control" value={pieceH} onChange={(e) => setPieceH(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ໄລຍະຫ່າງ/ຄວາມໜາໃບຕັດ (Waste margin - cm)</label>
                    <input type="number" step="0.1" className="form-control" value={margin} onChange={(e) => setMargin(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ຕົ້ນທຶນແຜ່ນອາຄຣີລິກ (Sheet Cost - LAK)</label>
                    <input type="number" className="form-control" value={sheetCost} onChange={(e) => setSheetCost(e.target.value)} />
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '12px', marginTop: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຈຳນວນຊິ້ນງານທີ່ໄດ້:</span>
                      <b style={{ color: 'var(--gold-primary)' }}>{solverResult.yieldCount} ຊິ້ນ</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ອັດຕາໃຊ້ງານ (Yield):</span>
                      <b style={{ color: 'var(--success-green)' }}>{solverResult.efficiency}%</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ອັດຕາເສຍເສດ (Waste):</span>
                      <b style={{ color: 'var(--alert-red)' }}>{solverResult.waste}%</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                      <span>ຕົ້ນທຶນສະເລ່ຍ:</span>
                      <b style={{ color: 'white' }}>{solverResult.costPerUnit.toLocaleString()} ₭ / ຊິ້ນ</b>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📺 ຕົວຢ່າງການຈັດວາງແຜ່ນຕັດ (Simulated Cutting Layout Grid):</span>
                  <div style={{
                    width: '100%',
                    height: '240px',
                    background: '#151311',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px'
                  }}>
                    {solverResult.yieldCount > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(' + solverResult.cols + ', 1fr)',
                        gridTemplateRows: 'repeat(' + solverResult.rows + ', 1fr)',
                        gap: '2px',
                        width: '90%',
                        height: '90%',
                        background: 'rgba(212,175,55,0.02)',
                        border: '1.5px dashed rgba(212,175,55,0.2)',
                        padding: '4px'
                      }}>
                        {Array.from({ length: solverResult.yieldCount }).map((_, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(212,175,55,0.1)',
                              border: '1px solid var(--gold-primary)',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              color: 'var(--gold-primary)'
                            }}
                          >
                            P{idx + 1}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>%ຂະໜາດຊິ້ນງານໃຫຍ່ເກີນແຜ່ນອາຄຣີລິກ!</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                📜 ປະຫວັດການຜະລິດສິນຄ້າ (Production History)
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>ວັນທີ</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>ຊື່ສິນຄ້າ</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>ຈຳນວນ</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>ຕົ້ນທຶນສະເລ່ຍ</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>ຕົ້ນທຶນລວມ</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>ຜູ້ສັ່ງຜະລິດ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionHistory.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <td style={{ padding: '8px' }}>{new Date(h.createdAt).toLocaleDateString('lo-LA')}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{h.productName}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--success-green)', fontWeight: 'bold' }}>+{h.qty}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{h.costPerUnit.toLocaleString()} ₭</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{h.totalCost.toLocaleString()} ₭</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{h.createdByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            👈 ກະລຸນາເລືອກສິນຄ້າຈາກລາຍການດ້ານຊ້າຍມືເພື່ອຈັດການສູດການຜະລິດ ຫຼື ສັ່ງຜະລິດ.
          </div>
        )}
      </div>

    </div>
  );
}
`;

// 2. Inject Sub-Views
const mainComponentStartToken = "export default function Inventory({";
const injectIdx = content.indexOf(mainComponentStartToken);
if (injectIdx !== -1) {
  content = content.substring(0, injectIdx) + subViewsCode + '\n' + content.substring(injectIdx);
  console.log('✓ Injected sub-views code.');
}

// 3. Inject activeSubTab state declaration in Inventory component
const mainStateTarget = "const [products, setProducts] = useState([]);";
const mainStateReplacement = "const [activeSubTab, setActiveSubTab] = useState('products');\n  const [products, setProducts] = useState([]);";
content = content.replace(mainStateTarget, mainStateReplacement);
console.log('✓ Injected activeSubTab state.');

// 4. Locate return start and replacement range
const returnStartStr = "return (\n    <div className=\"animate-fade-in\" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>";
const returnIdx = content.indexOf(returnStartStr);

const modalStartStr = "      {/* Category Management Modal */}";
const modalIdx = content.indexOf(modalStartStr);

if (returnIdx !== -1 && modalIdx !== -1) {
  const replacementReturn = `return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'products' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('products')}
        >
          📦 ສະຕັອກສິນຄ້າ (Products)
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'raw_materials' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('raw_materials')}
        >
          💎 ວັດຖຸດິບ (Raw Materials)
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'manufacturing' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('manufacturing')}
        >
          🏭 ສູດການຜະລິດ & BOM
        </button>
      </div>

      {activeSubTab === 'raw_materials' && (
        <RawMaterialsSubView />
      )}

      {activeSubTab === 'manufacturing' && (
        <ManufacturingSubView />
      )}

      {activeSubTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header and Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('title_inventory', '📦 ຈັດການຄັງສິນຄ້າ & ສະຕັອກ (Inventory)')}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>ຈັດການລາຍການສິນຄ້າ, ຂອບພຣະ, ສ້ອຍຄໍ, ແລະ ປັບສະຕັອກໄດ້ໂດຍກົງ</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => { setSelectedBarcodeProd(null); setBarcodePrintQty(1); setShowBarcodeModal(true); }}>
                🏷️ ສ້າງບາໂຄ້ດເປົ່າ
              </button>
              <button className="btn btn-secondary" onClick={() => { setBulkPrintQtys({}); setBulkSearch(''); setBulkCatFilter('all'); setShowBulkBarcodeModal(true); }}>
                🏷️ ປຣິນບາໂຄ້ດຫຼາຍລາຍການ
              </button>
              <button className="btn btn-secondary" onClick={openCategoryAdd}>
                🗂️ ຈັດການໝວດໝູ່
              </button>
              <button className="btn btn-primary" onClick={handleOpenAdd}>
                ➕ ເພີ່ມສິນຄ້າໃໝ່
              </button>
            </div>
          </div>

          {/* Stock Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--gold-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📦 ຈຳນວນສິນຄ້າຄົງເຫຼືອທັງໝົດ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalStockCount.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>ຊິ້ນ/ອັນ</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber, #e67e22)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💰 ມູນຄ່າຕົ້ນທຶນສະຕັອກລວມ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalCostValue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>ກີບ</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--success-green, #27ae60)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📈 ມູນຄ່າລາຄາຂາຍສະຕັອກລວມ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalRetailValue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>ກີບ</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-primary, #3498db)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✨ ກຳໄລຄາດຄະເນທັງໝົດ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                {totalPotentialProfit.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>ກີບ</span>
              </span>
            </div>
          </div>`;

  const beforeReturn = content.substring(0, returnIdx);
  const afterReturn = content.substring(modalIdx);
  
  // Find where the kpi card section ends and the catalog section starts (i.e. low stock bar or tabs)
  const kpiEndStr = "{lowStockProducts.length > 0 && (";
  const kpiEndIdx = content.indexOf(kpiEndStr);
  
  if (kpiEndIdx !== -1) {
    const middleContent = content.substring(kpiEndIdx, modalIdx);
    const finalContent = beforeReturn + replacementReturn + '\n' + middleContent + '\n      )}\n\n' + afterReturn;
    fs.writeFileSync(inventoryPath, finalContent, 'utf8');
    console.log('✓ Inventory.jsx updated successfully.');
  } else {
    console.log('⚠ Could not find KPI end index in Inventory.jsx');
  }
} else {
  console.log('⚠ Could not find returnIdx or modalIdx in Inventory.jsx');
}
