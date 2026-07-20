const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Inject InventoryIcons and InventoryKpiCard right after line 7 (Portal import or similar)
  const importAnchor = "import AmuletImageEditor from './AmuletImageEditor';";
  
  const definitions = `
const InventoryIcons = {
  warehouse: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10l10-6z"/><path d="M6 22V10h12v12"/></svg>
  ),
  stock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  consumables: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  purchasing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  rawMaterials: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l3 13m2-22 3 6-3 13m-10-13h18"/></svg>
  ),
  manufacturing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M5 17V8.7l5 3.3V8.7l5 3.3V5h4v12z"/></svg>
  ),
  box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  cost: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  retail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  profit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  category: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
  )
};

function InventoryKpiCard({ icon, label, value, sub, accentColor }) {
  const rgb = accentColor || '212, 175, 55';
  return (
    <div 
      style={{
        padding: '20px 22px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: \`rgba(\${rgb}, 0.07)\`,
        border: \`1px solid rgba(\${rgb}, 0.25)\`,
        borderRadius: 18,
        boxShadow: \`0 4px 24px rgba(\${rgb}, 0.12)\`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'dashFadeUp 0.4s ease',
      }}
    >
      <div style={{ position: 'absolute', top: -14, right: -14, width: 70, height: 70, borderRadius: '50%', background: \`rgb(\${rgb})\`, opacity: 0.08, filter: 'blur(16px)', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: \`rgba(\${rgb}, 0.15)\`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: \`1px solid rgba(\${rgb}, 0.3)\`,
          color: \`rgb(\${rgb})\`,
        }}>
          {icon}
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: \`rgb(\${rgb})\`, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: \`rgba(\${rgb}, 0.85)\`, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
      </div>
      
      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
`;

  if (content.includes(importAnchor) && !content.includes('InventoryIcons')) {
    content = content.replace(importAnchor, importAnchor + definitions);
    console.log("✅ Definitions injected!");
  } else {
    console.log("⚠️ Definitions already present or anchor missing.");
  }

  // 2. Replace Sub Tab Navigation Bar
  const oldTabs = `<div className="nav-tabs" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'warehouse' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('warehouse')}
        >
          🏠 ຈັດການສາງໃຫຍ່ (Warehouse)
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'products' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('products')}
        >
          {db.getLabel('inv_tab_products', '📦 ສະຕັອກໜ້າຮ້ານ (Shop Stock)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'consumables' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('consumables')}
        >
          🔧 ສາງອຸປະກອນສິ້ນເປືອງ (Consumables)
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'purchasing' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('purchasing')}
        >
          {db.getLabel('inv_tab_purchasing', '🧾 ສັ່ງຊື້ & ຜູ້ສະໜອງ')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'raw_materials' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('raw_materials')}
        >
          {db.getLabel('inv_tab_raw_materials', '💎 ວັດຖຸດິບ (Raw Materials)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'manufacturing' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('manufacturing')}
        >
          {db.getLabel('inv_tab_manufacturing', '🏭 ສູດການຜະລິດ & BOM')}
        </button>
      </div>`;

  const newTabs = `<div className="nav-tabs" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'warehouse' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('warehouse')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.warehouse />
          {db.getLabel('inv_tab_warehouse', 'ຈັດການສາງໃຫຍ່ (Warehouse)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'products' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.stock />
          {db.getLabel('inv_tab_products', 'ສະຕັອກໜ້າຮ້ານ (Shop Stock)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'consumables' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('consumables')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.consumables />
          {db.getLabel('inv_tab_consumables', 'ສາງອຸປະກອນສິ້ນເປືອງ (Consumables)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'purchasing' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('purchasing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.purchasing />
          {db.getLabel('inv_tab_purchasing', 'ສັ່ງຊື້ & ຜູ້ສະໜອງ')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'raw_materials' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('raw_materials')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.rawMaterials />
          {db.getLabel('inv_tab_raw_materials', 'ວັດຖຸດິບ (Raw Materials)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'manufacturing' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('manufacturing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.manufacturing />
          {db.getLabel('inv_tab_manufacturing', 'ສູດການຜະລິດ & BOM')}
        </button>
      </div>`;

  if (content.includes(oldTabs)) {
    content = content.replace(oldTabs, newTabs);
    console.log("✅ Tabs replaced!");
  } else {
    console.log("❌ Tabs block not found.");
  }

  // 3. Replace Shop Stock KPI Cards
  const oldShopKpis = `          {/* Stock Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--gold-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ຈຳນວນສິນຄ້າຄົງເຫຼືອໜ້າ_9dgu3y', \`📦 ຈຳນວນສິນຄ້າຄົງເຫຼືອໜ້າຮ້ານทັງໝົດ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalStockCount.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຊິ້ນ__ຈາກ_4n4po5', \`ຊິ້ນ (ຈາກ\`)} {physicalProducts.length} {db.getLabel('auto_ລາຍການ__t3ypbz', \`ລາຍການ)\`)}</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber, #e67e22)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ມູນຄ່າຕົ້ນທຶນສະຕັອກໜ້າ_16nkuw', \`💰 ມູນຄ່າຕົ້ນທຶນສະຕັອກໜ້າຮ້ານລວມ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {hasInventoryPermission('inventoryViewCost') ? \`\${totalCostValue.toLocaleString()} ກີບ\` : '*** ກີບ'}
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--success-green, #27ae60)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ມູນຄ່າລາຄາາຍໜ້າຮ້ານລວມ_194rm8', \`📈 ມູນຄ່າລາຄາາຍໜ້າຮ້ານລວມ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalRetailValue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ກີບ_2726e', \`ກີບ\`)}</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-primary, #3498db)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto___ກຳໄລຄາດຄະເນໜ້າຮ້ານ_nowlqf', \`✨ ກຳໄລຄາດຄະເນໜ້າຮ້ານ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                {hasInventoryPermission('inventoryViewCost') ? \`\${totalPotentialProfit.toLocaleString()} ກີບ\` : '*** ກີບ'}
              </span>
            </div>
          </div>`;

  const newShopKpis = `          {/* Stock Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <InventoryKpiCard
              icon={<InventoryIcons.box />}
              label={db.getLabel('auto____ຈຳນວນສິນຄ້າຄົງເຫຼືອໜ້າ_9dgu3y', 'ຈຳນວນສິນຄ້າຄົງເຫຼືອໜ້າຮ້ານທັງໝົດ')}
              value={totalStockCount.toLocaleString()}
              sub={\`\${db.getLabel('auto_ຊິ້ນ__ຈາກ_4n4po5', 'ຊິ້ນ (ຈາກ')} \${physicalProducts.length} \${db.getLabel('auto_ລາຍການ__t3ypbz', 'ລາຍການ)')}\`}
              accentColor="212, 175, 55"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.cost />}
              label={db.getLabel('auto____ມູນຄ່າຕົ້ນທຶນສະຕັອກໜ້າ_16nkuw', 'ມູນຄ່າຕົ້ນທຶນສະຕັອກໜ້າຮ້ານລວມ')}
              value={hasInventoryPermission('inventoryViewCost') ? \`\${totalCostValue.toLocaleString()} ກີບ\` : '*** ກີບ'}
              accentColor="243, 156, 18"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.retail />}
              label={db.getLabel('auto____ມູນຄ່າລາຄາາຍໜ້າຮ້ານລວມ_194rm8', 'ມູນຄ່າລາຄາຂາຍໜ້າຮ້ານລວມ')}
              value={\`\${totalRetailValue.toLocaleString()} ກີບ\`}
              accentColor="46, 204, 113"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.profit />}
              label={db.getLabel('auto___ກຳໄລຄາດຄະເນໜ້າຮ້ານ_nowlqf', 'ກຳໄລຄາດຄະເນໜ້າຮ້ານ')}
              value={hasInventoryPermission('inventoryViewCost') ? \`\${totalPotentialProfit.toLocaleString()} ກີບ\` : '*** ກີບ'}
              accentColor="52, 152, 219"
            />
          </div>`;

  if (content.includes(oldShopKpis)) {
    content = content.replace(oldShopKpis, newShopKpis);
    console.log("✅ Shop Stock KPI Cards replaced!");
  } else {
    console.log("❌ Shop Stock KPI Cards block not found.");
  }

  // 4. Replace Warehouse KPI Cards
  const oldWarehouseKpis = `          {/* Warehouse Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--gold-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ຈຳນວນສິນຄ້າໃນສາງໃຫຍ່ທັ_gjj103', \`🏠 ຈຳນວນສິນຄ້າໃນສາງໃຫຍ່ທັງໝົດ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalWarehouseStockCount.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຊິ້ນ__ຈາກ_4n4po5', \`ຊິ້ນ (ຈາກ\`)} {physicalProducts.length} {db.getLabel('auto_ລາຍການ__t3ypbz', \`ລາຍການ)\`)}</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber, #e67e22)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ມູນຄ່າຕົ້ນທຶນສາງໃຫຍ່ລວ_xu9mwp', \`💰 ມູນຄ່າຕົ້ນທຶນສາງໃຫຍ່ລວມ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {hasInventoryPermission('inventoryViewCost') ? \`\${totalWarehouseCostValue.toLocaleString()} ກີບ\` : '*** ກີບ'}
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--success-green, #27ae60)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ມູນຄ່າລາຄາຂາຍສາງໃຫຍ່ລວ_e8p98d', \`📈 ມູນຄ່າລາຄາຂາຍສາງໃຫຍ່ລວມ\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {totalWarehouseRetailValue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ກີບ_2726e', \`ກີບ\`)}</span>
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-primary, #3498db)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto___ກຳໄລຄາດຄະເນສາງໃຫຍ່_bf4qm6', \`✨ ກຳໄລຄາດຄະເນສາງໃຫຍ່\`)}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                {hasInventoryPermission('inventoryViewCost') ? \`\${totalWarehousePotentialProfit.toLocaleString()} ກີບ\` : '*** ກีບ'}
              </span>
            </div>
          </div>`;

  const newWarehouseKpis = `          {/* Warehouse Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <InventoryKpiCard
              icon={<InventoryIcons.warehouse />}
              label={db.getLabel('auto____ຈຳນວນສິນຄ້າໃນສາງໃຫຍ່ທັ_gjj103', 'ຈຳນວນສິນຄ້າໃນສາງໃຫຍ່ທັງໝົດ')}
              value={totalWarehouseStockCount.toLocaleString()}
              sub={\`\${db.getLabel('auto_ຊິ້ນ__ຈາກ_4n4po5', 'ຊິ້ນ (ຈາກ')} \${physicalProducts.length} \${db.getLabel('auto_ລາຍການ__t3ypbz', 'ລາຍການ)')}\`}
              accentColor="212, 175, 55"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.cost />}
              label={db.getLabel('auto____ມູນຄ່າຕົ້ນທຶນສາງໃຫຍ່ລວ_xu9mwp', 'ມູນຄ່າຕົ້ນທຶนສາງໃຫຍ່ລວມ')}
              value={hasInventoryPermission('inventoryViewCost') ? \`\${totalWarehouseCostValue.toLocaleString()} ກີບ\` : '*** ກີບ'}
              accentColor="243, 156, 18"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.retail />}
              label={db.getLabel('auto____ມູນຄ່າລາຄາຂາຍສາງໃຫຍ່ລວ_e8p98d', 'ມູນຄ່າລາຄາຂາຍສາງໃຫຍ່ລວມ')}
              value={\`\${totalWarehouseRetailValue.toLocaleString()} ກີບ\`}
              accentColor="46, 204, 113"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.profit />}
              label={db.getLabel('auto___ກຳໄລຄາດຄະເນສາງໃຫຍ່_bf4qm6', 'ກຳໄລຄາດຄະເນສາງໃຫຍ່')}
              value={hasInventoryPermission('inventoryViewCost') ? \`\${totalWarehousePotentialProfit.toLocaleString()} ກີບ\` : '*** ກີບ'}
              accentColor="52, 152, 219"
            />
          </div>`;

  if (content.includes(oldWarehouseKpis)) {
    content = content.replace(oldWarehouseKpis, newWarehouseKpis);
    console.log("✅ Warehouse KPI Cards replaced!");
  } else {
    console.log("❌ Warehouse KPI Cards block not found.");
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Finished writing modifications to Inventory.jsx!");
}
