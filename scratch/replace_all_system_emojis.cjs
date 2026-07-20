const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Replace occurrences:
  // 1. Month picker in consumables (around line 581)
  content = content.replace(
    `style={{ width: '160px', background: '#1c1915' }}`,
    `style={{ width: '160px' }}`
  );

  // 2. Select in consumables (around line 907)
  content = content.replace(
    `style={{width:isMobile?'100%':'200px',height:'38px',fontSize:'0.85rem',background:'#1c1915'}}`,
    `style={{width:isMobile?'100%':'200px',height:'38px',fontSize:'0.85rem'}}`
  );

  // 3. Month picker in purchasing (around line 1175)
  content = content.replace(
    `style={{width:'160px',background:'#1c1915'}}`,
    `style={{width:'160px'}}`
  );

  // 4. Textarea in BOM (around line 1645)
  content = content.replace(
    `style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.75rem', background: '#1c1915' }}`,
    `style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(0, 0, 0, 0.2)' }}`
  );

  // 5. BOM product list button (around line 1971)
  content = content.replace(
    `background: selectedProduct?.id === p.id ? 'rgba(212,175,55,0.06)' : '#1c1915',`,
    `background: selectedProduct?.id === p.id ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',\n                  borderRadius: '8px',`
  );

  // 6. BOM recipe item (around line 2040)
  content = content.replace(
    `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1915', padding: '6px 12px', borderRadius: '4px' }}`,
    `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '8px 14px', borderRadius: '8px' }}`
  );

  // 7. Raw material details (around line 5847)
  content = content.replace(
    `style={{ background: '#1c1916', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}`,
    `style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}`
  );

  // 8. Barcode input helper (around line 6474)
  content = content.replace(
    `                  background: '#1c1915',\n                  border: '1px solid var(--border-color)',\n                  borderRadius: '6px',`,
    `                  background: 'rgba(25, 20, 15, 0.45)',\n                  border: '1px solid var(--border-color)',\n                  borderRadius: '8px',`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Successfully cleaned up solid backgrounds in Inventory.jsx!");
}
