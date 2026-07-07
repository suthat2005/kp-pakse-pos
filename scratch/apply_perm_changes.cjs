const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/components/Inventory.jsx');
let lines = fs.readFileSync(targetFile, 'utf8').split('\n');

// 1. Pass activeUser prop to subcomponents
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<RawMaterialsSubView isMobile={isMobile} />')) {
    lines[i] = lines[i].replace('<RawMaterialsSubView isMobile={isMobile} />', '<RawMaterialsSubView isMobile={isMobile} activeUser={activeUser} />');
    console.log('✓ Passed activeUser to RawMaterialsSubView');
  }
  if (lines[i].includes('<ManufacturingSubView isMobile={isMobile} />')) {
    lines[i] = lines[i].replace('<ManufacturingSubView isMobile={isMobile} />', '<ManufacturingSubView isMobile={isMobile} activeUser={activeUser} />');
    console.log('✓ Passed activeUser to ManufacturingSubView');
  }
}

// 2. Add activeUser prop and hasInventoryPermission helper to RawMaterialsSubView and ManufacturingSubView declarations
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function RawMaterialsSubView({ isMobile }) {')) {
    lines[i] = `function RawMaterialsSubView({ isMobile, activeUser }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };`;
    console.log('✓ Modified RawMaterialsSubView declaration');
  }
  if (lines[i].includes('function ManufacturingSubView({ isMobile }) {')) {
    lines[i] = `function ManufacturingSubView({ isMobile, activeUser }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };`;
    console.log('✓ Modified ManufacturingSubView declaration');
  }
}

// 3. Add hasInventoryPermission to Inventory main component declaration
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function Inventory({ activeUser, onUpdate, initialFilter, onFilterChange, isMobile }) {')) {
    lines[i] = `export default function Inventory({ activeUser, onUpdate, initialFilter, onFilterChange, isMobile }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };`;
    console.log('✓ Modified Inventory main component declaration');
  }
}

// Helper to wrap form groups (inputs)
function wrapFormGroup(targetText, permission, name) {
  let foundIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(targetText)) {
      foundIndex = i;
      break;
    }
  }
  if (foundIndex === -1) {
    console.error(`✗ Failed to find form group containing: ${targetText}`);
    return;
  }
  // Find start: go upwards to find <div className="form-group" or similar
  let startIdx = -1;
  for (let i = foundIndex; i >= 0; i--) {
    if (lines[i].includes('<div className="form-group"') || lines[i].includes('<div className=\'form-group\'') || lines[i].includes('className="form-group"')) {
      startIdx = i;
      break;
    }
  }
  // Find end: go downwards to find closing </div>
  let endIdx = -1;
  let openDivs = 1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('<div')) {
      openDivs++;
    }
    if (lines[i].includes('</div>')) {
      openDivs--;
      if (openDivs === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (startIdx !== -1 && endIdx !== -1) {
    lines[startIdx] = `{hasInventoryPermission('${permission}') && (\n` + lines[startIdx];
    lines[endIdx] = lines[endIdx] + `\n)}`;
    console.log(`✓ Wrapped form group: ${name}`);
  } else {
    console.error(`✗ Failed to wrap form group: ${name} (start=${startIdx}, end=${endIdx})`);
  }
}

// Helper to wrap buttons
function wrapButton(targetText, permission, name) {
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(targetText) && !lines[i].includes('hasInventoryPermission')) {
      // Find start: go upwards to find <button
      let startIdx = -1;
      for (let j = i; j >= Math.max(0, i - 10); j--) {
        if (lines[j].includes('<button')) {
          startIdx = j;
          break;
        }
      }
      // Find end: go downwards to find </button>
      let endIdx = -1;
      for (let j = i; j <= Math.min(lines.length - 1, i + 10); j++) {
        if (lines[j].includes('</button>')) {
          endIdx = j;
          break;
        }
      }
      if (startIdx !== -1 && endIdx !== -1) {
        lines[startIdx] = `{hasInventoryPermission('${permission}') && (\n` + lines[startIdx];
        lines[endIdx] = lines[endIdx] + `\n)}`;
        count++;
      }
    }
  }
  if (count > 0) {
    console.log(`✓ Wrapped ${count} instances of button: ${name}`);
  } else {
    console.warn(`⚠ Did not wrap any instances of button: ${name}`);
  }
}

// 4. Wrap cost input fields in modals
wrapFormGroup('value={formData.cost_price}', 'inventoryViewCost', 'Raw Material cost price input');
wrapFormGroup('value={formData.cost}', 'inventoryViewCost', 'Product cost input');
wrapFormGroup('value={sheetCost}', 'inventoryViewCost', 'BOM sheet cost input');

// 5. Wrap BOM Cost Per Unit display
let bomCpuIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('solverResult.costPerUnit.toLocaleString()')) {
    bomCpuIndex = i;
    break;
  }
}
if (bomCpuIndex !== -1) {
  let startIdx = -1;
  for (let i = bomCpuIndex; i >= 0; i--) {
    if (lines[i].includes('<div') && lines[i].includes('justifyContent')) {
      startIdx = i;
      break;
    }
  }
  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('</div>')) {
      endIdx = i;
      break;
    }
  }
  if (startIdx !== -1 && endIdx !== -1) {
    lines[startIdx] = `{hasInventoryPermission('inventoryViewCost') && (\n` + lines[startIdx];
    lines[endIdx] = lines[endIdx] + `\n)}`;
    console.log('✓ Wrapped BOM cost per unit display');
  }
}

// 6. Cost displays replacement in rows and cards
for (let i = 0; i < lines.length; i++) {
  // Raw materials table cost
  if (lines[i].includes('m.cost_price.toLocaleString()') && lines[i].includes('₭') && lines[i].includes('<td')) {
    lines[i] = lines[i].replace('{m.cost_price.toLocaleString()} ₭', "{hasInventoryPermission('inventoryViewCost') ? `${m.cost_price.toLocaleString()} ₭` : '*** ₭'}");
    console.log('✓ Replaced raw material table cost line');
  }
  // Raw materials card cost
  if (lines[i].includes('m.cost_price.toLocaleString()') && lines[i].includes('₭') && !lines[i].includes('<td')) {
    lines[i] = lines[i].replace('{m.cost_price.toLocaleString()} ₭', "{hasInventoryPermission('inventoryViewCost') ? `${m.cost_price.toLocaleString()} ₭` : '*** ₭'}");
    console.log('✓ Replaced raw material card cost line');
  }
  // Product table cost
  if (lines[i].includes('p.cost.toLocaleString()') && lines[i].includes('ກີບ') && lines[i].includes('<td')) {
    lines[i] = lines[i].replace('{p.cost.toLocaleString()} ກີບ', "{hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} ກີບ` : '*** ກີບ'}");
    console.log('✓ Replaced product table cost line');
  }
  // Product card cost (mixed Lao-Thai spelling)
  if (lines[i].includes('p.cost.toLocaleString()') && lines[i].includes('₭') && !lines[i].includes('<td')) {
    lines[i] = lines[i].replace('{p.cost.toLocaleString()} ₭', "{hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} ₭` : '*** ₭'}");
    console.log('✓ Replaced product card cost line');
  }
  // BOM Production History costs
  if (lines[i].includes('h.costPerUnit.toLocaleString()')) {
    lines[i] = lines[i].replace('{h.costPerUnit.toLocaleString()} ₭', "{hasInventoryPermission('inventoryViewCost') ? `${h.costPerUnit.toLocaleString()} ₭` : '*** ₭'}");
    console.log('✓ Replaced h.costPerUnit line');
  }
  if (lines[i].includes('h.totalCost.toLocaleString()')) {
    lines[i] = lines[i].replace('{h.totalCost.toLocaleString()} ₭', "{hasInventoryPermission('inventoryViewCost') ? `${h.totalCost.toLocaleString()} ₭` : '*** ₭'}");
    console.log('✓ Replaced h.totalCost line');
  }
}

// 7. Product Valuation KPI Cards and Add Button replacement
// Total Cost Value KPI card
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{totalCostValue.toLocaleString()}')) {
    lines[i] = lines[i].replace('{totalCostValue.toLocaleString()} <span style={{ fontSize: \'0.9rem\', fontWeight: \'normal\', color: \'var(--text-secondary)\' }}>ກີບ</span>', "{hasInventoryPermission('inventoryViewCost') ? `${totalCostValue.toLocaleString()} ກີບ` : '*** ກີບ'}");
    console.log('✓ Replaced totalCostValue KPI card');
  }
  if (lines[i].includes('{totalPotentialProfit.toLocaleString()}')) {
    lines[i] = lines[i].replace('{totalPotentialProfit.toLocaleString()} <span style={{ fontSize: \'0.9rem\', fontWeight: \'normal\', color: \'var(--text-secondary)\' }}>ກີບ</span>', "{hasInventoryPermission('inventoryViewCost') ? `${totalPotentialProfit.toLocaleString()} ກີບ` : '*** ກີບ'}");
    console.log('✓ Replaced totalPotentialProfit KPI card');
  }
}

// 8. Wrap buttons using the wrapButton helper
wrapButton('handleExportCsv', 'inventoryViewCost', 'CSV Export Button');
wrapButton('setShowCsvModal(true)', 'inventoryAddProduct', 'CSV Import Button');
wrapButton('➕ ເພີ່ມວັດຖຸດິບໃໝ່', 'inventoryAddProduct', 'Add Raw Material Button');
wrapButton('➕ ເພີ່ມສິນຄ້າໃໝ່', 'inventoryAddProduct', 'Add Product Button');

// Table Action buttons
wrapButton('handleOpenEdit(m)', 'inventoryEditProduct', 'Raw Material Table Edit Button');
wrapButton('handleDelete(m.id)', 'inventoryDeleteProduct', 'Raw Material Table Delete Button');
wrapButton('handleOpenEdit(p)', 'inventoryEditProduct', 'Product Edit Button');
wrapButton('handleDeleteProduct(p)', 'inventoryDeleteProduct', 'Product Delete Button');

fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
console.log('*** Finished line-by-line updates on Inventory.jsx ***');
