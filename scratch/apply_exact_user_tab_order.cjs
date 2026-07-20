const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const blockStart = content.indexOf('{/* Sub Tab Bar Navigation */}');
  const blockEnd = content.indexOf('{activeSubTab === \'raw_materials\' && (');

  if (blockStart !== -1 && blockEnd !== -1) {
    const exactOrderBlock = `{/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
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
      </div>\n\n      `;

    content = content.substring(0, blockStart) + exactOrderBlock + content.substring(blockEnd);
    fs.writeFileSync(file, content, 'utf8');
    console.log("✅ Reordered tabs in Inventory.jsx to user's EXACT 1-6 order!");
  } else {
    console.log("Could not locate block boundaries in Inventory.jsx:", blockStart, blockEnd);
  }
}
