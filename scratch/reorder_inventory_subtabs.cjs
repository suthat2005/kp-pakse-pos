const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');

  // Find line with nav-tabs in Inventory.jsx
  const oldSnippet = `      {/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>`;

  const newSnippet = `      {/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>`;

  content = content.replace(/\r\n/g, '\n');

  // Let's locate the full block
  const blockStart = content.indexOf('{/* Sub Tab Bar Navigation */}');
  const blockEnd = content.indexOf('{activeSubTab === \'raw_materials\'');

  if (blockStart !== -1 && blockEnd !== -1) {
    const oldBlock = content.substring(blockStart, blockEnd);

    const newBlock = `{/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'products' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('products')}
        >
          {db.getLabel('inv_tab_products', '📦 ສະຕັອກໜ້າຮ້ານ (Shop Stock)')}
        </button>
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'warehouse' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('warehouse')}
        >
          🏠 ຈັດການສາງໃຫຍ່ (Warehouse)
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
        <button
          type="button"
          className={\`nav-tab \${activeSubTab === 'purchasing' ? 'active' : ''}\`}
          onClick={() => setActiveSubTab('purchasing')}
        >
          {db.getLabel('inv_tab_purchasing', '🧾 ສັ່ງຊື້ & ຜູ້ສະໜອງ')}
        </button>
      </div>\n\n      `;

    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Reordered Inventory sub-tabs and fixed alignment successfully!");
  } else {
    console.log("Could not locate nav-tabs block boundaries in Inventory.jsx");
  }
}
