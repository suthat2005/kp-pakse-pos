const fs = require('fs');

const path = 'src/components/Reports.jsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');

  // Helper for single clean search input tag
  const searchInputStyle = (widthStr) => `style={{ width: '${widthStr}', padding: '8px 14px 8px 36px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#f1f5f9', fontSize: '0.82rem', outline: 'none', transition: 'all 0.2s ease' }}`;

  const renderSearchWrapper = (placeholder, valueVar, onChangeFn, widthStr = '220px') => `
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(212, 175, 55, 0.7)" strokeWidth="2.5" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="${placeholder}"
                value={${valueVar}}
                onChange={${onChangeFn}}
                ${searchInputStyle(widthStr)}
              />
            </div>`;

  // 1. Replace Bills Lookup search input (around searchQuery)
  content = content.replace(
    /<input\s+type="text"\s+placeholder="ຄົ້ນຫາໃບບິນຂາຍ\.\.\."[^>]+value=\{searchQuery\}[^>]+>/g,
    renderSearchWrapper('ຄົ້ນຫາໃບບິນຂາຍ...', 'searchQuery', '(e) => setSearchQuery(e.target.value)', '220px').trim()
  );

  // 2. Replace Debts Table search input (around debtSearch)
  content = content.replace(
    /<input\s+type="text"\s+placeholder="ຄົ້ນຫາລູກຄ້າ, ເລກບິນ\.\.\."[^>]+value=\{debtSearch[^}]+\}[^>]+>/g,
    renderSearchWrapper('ຄົ້ນຫາລູກຄ້າ, ເລກບິນ...', "debtSearch || ''", '(e) => setDebtSearch(e.target.value)', '260px').trim()
  );

  // 3. Replace Expenses Table search input (around expenseSearch)
  content = content.replace(
    /<input\s+type="text"\s+placeholder="ຄົ້ນຫາລາຍຈ່າຍ, ໝວດ\.\.\."[^>]+value=\{expenseSearch[^}]+\}[^>]+>/g,
    renderSearchWrapper('ຄົ້ນຫາລາຍຈ່າຍ, ໝວດ...', "expenseSearch || ''", '(e) => setExpenseSearch(e.target.value)', '200px').trim()
  );

  // 4. Replace Online Orders search input (around searchOnline)
  content = content.replace(
    /<input\s+type="text"\s+placeholder="ຄົ້ນຫາ Order, ລູກຄ້າ, ເບີໂທ\.\.\."[^>]+value=\{searchOnline\}[^>]+>/g,
    renderSearchWrapper('ຄົ້ນຫາ Order, ລູກຄ້າ, ເບີໂທ...', 'searchOnline', 'e => setSearchOnline(e.target.value)', '220px').trim()
  );

  // 5. Replace Treat History search input (around treatSearch)
  content = content.replace(
    /<input\s+type="text"\s+placeholder="ຄົ້ນຫາ ID, ພະນັກງານ, ໝາຍເຫດ\.\.\."[^>]+value=\{treatSearch[^}]+\}[^>]+>/g,
    renderSearchWrapper('ຄົ້ນຫາ ID, ພະນັກງານ, ໝາຍເຫດ...', "treatSearch || ''", 'e => setTreatSearch(e.target.value)', '240px').trim()
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("✓ Successfully upgraded search inputs into sleek dark glass inputs with gold SVG search icons!");
} else {
  console.error("Reports.jsx not found.");
}
