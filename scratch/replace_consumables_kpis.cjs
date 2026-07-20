const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Inject alert and outflow in InventoryIcons
  const anchorIcons = "  category: () => (\n    <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.8\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"9\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\"/></svg>\n  )";
  
  const replacementIcons = `  category: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
  ),
  alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  outflow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 17 12 13 16 8 11 1 18"/><polyline points="17 18 23 18 23 12"/></svg>
  )`;

  if (content.includes(anchorIcons)) {
    content = content.replace(anchorIcons, replacementIcons);
    console.log("✅ Injected alert/outflow into InventoryIcons!");
  }

  // 2. Inject ConsumableCategoryIcons
  const importAnchor = "import AmuletImageEditor from './AmuletImageEditor';";
  const consumableCategoryDefs = `
const ConsumableCategoryIcons = {
  packaging: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  cleaning: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M5 12h14"/></svg>
  ),
  stationery: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  default: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  )
};

function getConsumableCatIconSvg(iconStr) {
  if (iconStr === '📦') return <ConsumableCategoryIcons.packaging />;
  if (iconStr === '🧹') return <ConsumableCategoryIcons.cleaning />;
  if (iconStr === '📝' || iconStr === '✏️') return <ConsumableCategoryIcons.stationery />;
  return <ConsumableCategoryIcons.default />;
}
`;

  if (!content.includes('ConsumableCategoryIcons')) {
    content = content.replace(importAnchor, importAnchor + consumableCategoryDefs);
    console.log("✅ ConsumableCategoryIcons injected!");
  }

  // 3. Replace KPI cards block in ConsumablesSubView
  const oldKpisBlock = "      {/* KPI CARDS */}\n" +
    "      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:'12px'}}>\n" +
    "        {[\n" +
    "          {icon:'📦',label:'ລາຍການທັງໝົດ',value:consumables.length+' ລາຍການ',color:'#4fc3f7'},\n" +
    "          {icon:'💰',label:'ມູນຄ່າສາງລວມ',value:totalStockValue.toLocaleString()+' ₭',color:'var(--gold-primary)'},\n" +
    "          {icon:'⚠️',label:'ສາງໃກ້ໝົດ',value:lowStockItems.length+' ລາຍการ',color:lowStockItems.length>0?'#e74c3c':'#2ecc71'},\n" +
    "          {icon:'📤',label:'ເບີກໃຊ້ເດືອນນີ້',value:totalDisburseMonth.toLocaleString()+' ₭',color:'#e17055'},\n" +
    "        ].map((card,i)=>(\n" +
    "          <div key={i} className=\"glass-card\" style={{padding:'16px',display:'flex',flexDirection:'column',gap:'6px',borderTop:`3px solid ${card.color}`}}>\n" +
    "            <div style={{fontSize:'1.5rem'}}>{card.icon}</div>\n" +
    "            <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{card.label}</div>\n" +
    "            <div style={{fontWeight:'bold',fontSize:'1rem',color:card.color}}>{card.value}</div>\n" +
    "          </div>\n" +
    "        ))}\n" +
    "      </div>";

  const newKpisBlock = `      {/* KPI CARDS */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:'12px'}}>
        <InventoryKpiCard
          icon={<InventoryIcons.box />}
          label="ລາຍການທັງໝົດ"
          value={consumables.length + ' ລາຍການ'}
          accentColor="52, 152, 219"
        />
        <InventoryKpiCard
          icon={<InventoryIcons.cost />}
          label="ມູນຄ່າສາງລວມ"
          value={totalStockValue.toLocaleString() + ' ₭'}
          accentColor="212, 175, 55"
        />
        <InventoryKpiCard
          icon={<InventoryIcons.alert />}
          label="ສາງໃກ້ໝົດ"
          value={lowStockItems.length + ' ລາຍການ'}
          accentColor={lowStockItems.length > 0 ? "231, 76, 60" : "46, 204, 113"}
        />
        <InventoryKpiCard
          icon={<InventoryIcons.outflow />}
          label="ເບີກໃຊ້ເດືອນນີ້"
          value={totalDisburseMonth.toLocaleString() + ' ₭'}
          accentColor="225, 112, 85"
        />
      </div>`;

  if (content.includes(oldKpisBlock)) {
    content = content.replace(oldKpisBlock, newKpisBlock);
    console.log("✅ Consumables KPI Cards replaced!");
  } else {
    // try direct search without CRLF issues
    const match = content.match(/\{\/\* KPI CARDS \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>/);
    if (match) {
      content = content.replace(match[0], newKpisBlock);
      console.log("✅ Consumables KPI Cards replaced via regex match!");
    } else {
      console.log("❌ Consumables KPI Cards block not found.");
    }
  }

  // 4. Replace Category Breakdown block in ConsumablesSubView
  const newCategoryBlock = `            {categories.map(cat=>{
              const items=consumables.filter(c=>c.category===cat.id);
              const catVal=items.reduce((s,c)=>s+((c.stock||0)*(c.costPerUnit||0)),0);
              const isActive=activeFilter===cat.id;
              return(
                <button key={cat.id} type="button" onClick={()=>setActiveFilter(isActive?'all':cat.id)}
                  style={{
                    background: isActive ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: isActive ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: isActive ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                    {getConsumableCatIconSvg(cat.icon)}
                    <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{cat.name}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{items.length} {db.getLabel('auto_ລາຍການ_ce8qoo', 'ລາຍການ')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', marginTop: '2px' }}>{catVal.toLocaleString()} ₭</div>
                </button>
              );
            })}`;

  const catMatch = content.match(/\{categories\.map\(cat=>[\s\S]*?\}\)\}/);
  if (catMatch) {
    content = content.replace(catMatch[0], newCategoryBlock);
    console.log("✅ Consumables Category list replaced via regex match!");
  } else {
    console.log("❌ Consumables Category list block not found.");
  }

  fs.writeFileSync(file, content, 'utf8');
}
