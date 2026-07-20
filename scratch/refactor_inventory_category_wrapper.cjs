const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Let's find index of "Sub Tab Bar Navigation"
  const tabIdx = content.indexOf('{/* Sub Tab Bar Navigation */}');
  if (tabIdx !== -1) {
    console.log("=== SUB TAB BAR CONTENT IN FILE ===");
    console.log(content.slice(tabIdx, tabIdx + 1500));
  }

  // Let's find index of "Stock Valuation KPI Cards"
  const shopKpiIdx = content.indexOf('{/* Stock Valuation KPI Cards */}');
  if (shopKpiIdx !== -1) {
    console.log("=== SHOP STOCK KPI CONTENT IN FILE ===");
    console.log(content.slice(shopKpiIdx, shopKpiIdx + 1500));
  }
}
