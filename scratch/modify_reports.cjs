const fs = require('fs');
const path = require('path');

const reportsPath = 'src/components/Reports.jsx';
let content = fs.readFileSync(reportsPath, 'utf8');

// Restore clean backup if available
const backupDir = 'C:/Users/sutha/.gemini/antigravity/brain/57160ca8-be3f-481c-9ffc-5f8f79e955b7/scratch';
const backupPath = path.join(backupDir, 'Reports_backup.jsx');
if (fs.existsSync(backupPath)) {
  content = fs.readFileSync(backupPath, 'utf8');
  console.log('✓ Restored clean Reports.jsx from backup.');
}

// 1. Add states at start of Reports component
const stateTarget = "const [startDate, setStartDate] = useState(todayStr);";
const stateReplacement = "const [startDate, setStartDate] = useState(todayStr);\n  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | audit_logs\n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 10;\n  \n  // Audit Logs States\n  const [auditSearchQuery, setAuditSearchQuery] = useState('');\n  const [auditSeverityFilter, setAuditSeverityFilter] = useState('all');\n  const [auditCurrentPage, setAuditCurrentPage] = useState(1);\n  const [auditLogs, setAuditLogs] = useState([]);\n\n  useEffect(() => {\n    if (activeTab === 'audit_logs') {\n      setAuditLogs(db.getAuditLogs());\n    }\n  }, [activeTab]);\n\n  const loadAuditLogs = () => {\n    setAuditLogs(db.getAuditLogs());\n  };";

content = content.replace(stateTarget, stateReplacement);

// 2. Add CSV export function and Paginated logic
const helperMethodsTarget = "  // Filter orders by lookup input search query";
const helperMethodsReplacement = `  const handleExportTransactionsCsv = () => {
    const headers = 'Bill ID,Date,Cashier,Discount,Net Total,Payment Method\\n';
    const rows = filteredOrders.map(o => '"' + o.id + '","' + new Date(o.date).toLocaleString('lo-LA') + '","' + o.cashierName + '",' + o.discount + ',' + o.total + ',"' + o.paymentMethod + '"').join('\\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter orders by lookup input search query`;

content = content.replace(helperMethodsTarget, helperMethodsReplacement);

// 3. Find range of return block to replace
const returnIdx = content.indexOf('return (');
const modalIdx = content.indexOf('{/* Invoice Reprint / Lookup Detail Modal */}');

if (returnIdx !== -1 && modalIdx !== -1) {
  // Let's write the new return body
  const replacementReturn = `return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Dynamic Receipt Print Sizing Styles */}
      <style>
        {\`
          @media print {
            .modal-overlay.print-modal .modal-content {
              width: \${settings.receiptPaperWidth || '80mm'} !important;
              max-width: \${settings.receiptPaperWidth || '80mm'} !important;
            }
            .print-receipt-container {
              width: \${settings.receiptPaperWidth || '80mm'} !important;
              max-width: \${settings.receiptPaperWidth || '80mm'} !important;
              font-size: \${settings.receiptFontSize || '10pt'} !important;
              padding: \${settings.receiptPadding || '5mm'} !important;
              line-height: \${settings.receiptLineHeight || '1.3'} !important;
              margin-left: \${settings.receiptMarginLeft || '0mm'} !important;
              margin-right: \${settings.receiptMarginRight || '0mm'} !important;
              margin-top: \${settings.receiptMarginTop || '0mm'} !important;
              margin-bottom: \${settings.receiptMarginBottom || '0mm'} !important;
            }
            .print-receipt-item {
              font-size: calc(\${settings.receiptFontSize || '10pt'} - 1pt) !important;
            }
            .print-receipt-totals {
              font-size: \${settings.receiptFontSize || '10pt'} !important;
            }
            .print-receipt-footer {
              font-size: calc(\${settings.receiptFontSize || '10pt'} - 2pt) !important;
            }
            .print-receipt-divider {
              border-top: \${settings.receiptDividerThickness || '1px'} \${settings.receiptDividerStyle || 'dashed'} black !important;
            }
          }
          .print-receipt-container {
            width: \${settings.receiptPaperWidth || '80mm'} !important;
            font-size: \${settings.receiptFontSize || '10pt'} !important;
            padding: \${settings.receiptPadding || '5mm'} !important;
            line-height: \${settings.receiptLineHeight || '1.3'} !important;
            margin-left: \${settings.receiptMarginLeft || '0mm'} !important;
            margin-right: \${settings.receiptMarginRight || '0mm'} !important;
            margin-top: \${settings.receiptMarginTop || '0mm'} !important;
            margin-bottom: \${settings.receiptMarginBottom || '0mm'} !important;
          }
          .print-receipt-divider {
            border-top: \${settings.receiptDividerThickness || '1px'} \${settings.receiptDividerStyle || 'dashed'} black !important;
          }
        \`}
      </style>

      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ color: 'var(--gold-primary)' }}>{db.getLabel('title_reports', '📊 ບົດລາຍງານຍອດຂາຍ & ການເງິນ (Sales & Finance Reports)')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ກວດສອບຍອດຂາຍ, ຄຳນວນກຳໄລ, ວິເຄາະດ້ວຍກຣາບ ແລະ ບັນທຶກປະຫວັດຄວາມປອດໄພ</p>
        </div>

        {/* Tab Selectors */}
        <div className="nav-tabs" style={{ margin: 0, display: 'flex', gap: '8px', border: 'none' }}>
          <button
            type="button"
            className={\`nav-tab \${activeTab === 'dashboard' ? 'active' : ''}\`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 ແດຊບອດຍອດຂາຍ
          </button>
          <button
            type="button"
            className={\`nav-tab \${activeTab === 'audit_logs' ? 'active' : ''}\`}
            onClick={() => {
              setActiveTab('audit_logs');
              loadAuditLogs();
            }}
          >
            🛡️ ບັນທຶກຄວາມປອດໄພ & Audit
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Date & Cashier Filters */}
          <div className="glass-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ເລີ່ມຕົ້ນ:</span>
              <input type="date" className="form-control" style={{ width: '150px', background: '#1c1915' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ສິ້ນສຸດ:</span>
              <input type="date" className="form-control" style={{ width: '150px', background: '#1c1915' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ພະນັກງານ:</span>
              <select className="form-control" style={{ width: '180px', background: '#1c1915' }} value={selectedCashier} onChange={e => setSelectedCashier(e.target.value)}>
                <option value="">ທັງໝົດ (All Cashiers)</option>
                {cashiers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--gold-primary)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📊 ຍອດຂາຍລວມ (Total Revenue)</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 'bold', color: 'white' }}>
                {(stats.totalSalesLak || 0).toLocaleString()} ₭
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                ຈາກການຂາຍທັງໝົດ {stats.ordersCount || 0} ບິນ
              </span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--success-green)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✨ ກຳໄລສຸດທິ (Net Profit)</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 'bold', color: 'var(--success-green)' }}>
                {Math.round(stats.netProfit || 0).toLocaleString()} ₭
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>*ຫັກຕົ້ນທຶນ, ຄ່າຈ້າງ ແລະ ລາຍຈ່າຍ</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--alert-red)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💸 ລາຍຈ່າຍລວມ (Expenses)</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 'bold', color: 'var(--alert-red)' }}>
                {(stats.totalExpenseLak || 0).toLocaleString()} ₭
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                ມີທັງໝົດ {stats.expenses?.length || 0} ລາຍການ
              </span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #3498db' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📒 ຍອດຄ້າງໜີ້ (Credit Debts)</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 'bold', color: '#3498db' }}>
                {(stats.totalDebtLak || 0).toLocaleString()} ₭
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                ຄ້າງຈ່າຍ {stats.debts?.length || 0} ບິນ
              </span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #9b59b6' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏭 ວັດຖຸດິບຕ່ຳກວ່າເກນ (Low Stock Materials)</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 'bold', color: '#9b59b6' }}>
                {db.getRawMaterials().filter(m => m.stock_qty <= m.min_stock).length} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>ລາຍການ</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                ຈາກທັງໝົດ {db.getRawMaterials().length} ວັດຖຸດິບ
              </span>
            </div>
          </div>

          {/* SVG Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '14px', fontSize: '0.95rem' }}>📈 ແນວໂນ້ມຍອດຂາຍ (Sales Trend Graph)</h4>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 500 180" style={{ width: '100%', height: '180px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                  <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="20" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="20" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="20" y1="160" x2="480" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <path d={chartData.path} fill="none" stroke="var(--gold-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartData.points.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="5" fill="var(--gold-primary)" stroke="#1a1815" strokeWidth="1.5" />
                      <text x={p.x} y={p.y - 10} fill="white" fontSize="9" textAnchor="middle">
                        {p.val > 0 ? (p.val / 1000).toLocaleString() + 'k' : ''}
                      </text>
                      <text x={p.x} y="174" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">{p.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '14px', fontSize: '0.95rem' }}>🥧 ສັດສ່ວນການຊຳລະເງິນ (Payment Ratio)</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', flexGrow: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', width: '60%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', background: 'var(--gold-primary)', borderRadius: '3px' }}></span>
                    <span>ເງິນສົດ (Cash): {donut.pCash.toFixed(1)}% ({donut.cash.toLocaleString()} ₭)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#3498db', borderRadius: '3px' }}></span>
                    <span>ໂອນທະນາຄານ: {donut.pTransfer.toFixed(1)}% ({donut.transfer.toLocaleString()} ₭)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#e74c3c', borderRadius: '3px' }}></span>
                    <span>ຕິດໜີ້ (Debts): {donut.pDebt.toFixed(1)}% ({donut.debt.toLocaleString()} ₭)</span>
                  </div>
                </div>

                <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                  <svg width="110" height="110" viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="16" />
                    {donut.strokeTransfer > 0 && (
                      <circle cx="75" cy="75" r="50" fill="none"
                        stroke="#3498db" strokeWidth="16"
                        strokeDasharray={donut.strokeTransfer + ' ' + (314.16 - donut.strokeTransfer)}
                        strokeDashoffset={-donut.offsetTransfer}
                        transform="rotate(-90 75 75)"
                        strokeLinecap="round"
                      />
                    )}
                    {donut.strokeCash > 0 && (
                      <circle cx="75" cy="75" r="50" fill="none"
                        stroke="var(--gold-primary)" strokeWidth="16"
                        strokeDasharray={donut.strokeCash + ' ' + (314.16 - donut.strokeCash)}
                        strokeDashoffset={-donut.offsetCash}
                        transform="rotate(-90 75 75)"
                        strokeLinecap="round"
                      />
                    )}
                    {donut.strokeDebt > 0 && (
                      <circle cx="75" cy="75" r="50" fill="none"
                        stroke="#e74c3c" strokeWidth="16"
                        strokeDasharray={donut.strokeDebt + ' ' + (314.16 - donut.strokeDebt)}
                        strokeDashoffset={-donut.offsetDebt}
                        transform="rotate(-90 75 75)"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-secondary)' }}>
                    <span>ຍອດລວມ</span>
                    <b style={{ color: 'white', fontSize: '11px', marginTop: '2px' }}>{donut.total.toLocaleString()} ₭</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Tables Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Expenses List */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '12px', fontSize: '0.95rem' }}>💸 ລາຍການລາຍຈ່າຍ (Expenses Log)</h4>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px' }}>ວັນທີ</th>
                      <th style={{ padding: '8px' }}>ປະເພດ</th>
                      <th style={{ padding: '8px' }}>ໝາຍເຫດ</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>ຈຳນວນເງິນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.expenses?.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>ບໍ່ມີຂໍ້ມູນລາຍຈ່າຍ</td></tr>
                    ) : (
                      stats.expenses?.map(ex => (
                        <tr key={ex.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px', fontSize: '0.75rem' }}>{new Date(ex.date).toLocaleDateString('lo-LA')}</td>
                          <td style={{ padding: '8px' }}>{ex.categoryName}</td>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{ex.notes || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--alert-red)' }}>-{ex.amount.toLocaleString()} ₭</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unpaid Debts List */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '12px', fontSize: '0.95rem' }}>📒 ລາຍການຕິດໜີ້ຄ້າງຊຳລະ (Unpaid Debts)</h4>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px' }}>ລູກຄ້າ</th>
                      <th style={{ padding: '8px' }}>ເບີໂທ</th>
                      <th style={{ padding: '8px' }}>ລາຍການຄ້າງ</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>ຍອດຕິດໜີ້</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.debts?.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>ບໍ່ມີຍອດຕິດໜີ້ຄ້າງຊຳລະ</td></tr>
                    ) : (
                      stats.debts?.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{d.customerName}</td>
                          <td style={{ padding: '8px' }}>{d.customerPhone}</td>
                          <td style={{ padding: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {d.items?.map(i => i.name + 'x' + i.qty).join(', ')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{d.total.toLocaleString()} ₭</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sold Products Ranking */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '12px', fontSize: '0.95rem' }}>🏆 ອັນດັບສິນຄ້າຂາຍດີ (Top Selling Products)</h4>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px' }}>ອັນດັບ</th>
                      <th style={{ padding: '8px' }}>ຊື່ສິນຄ້າ</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>ຈຳນວນຂາຍ</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>ຍອດລວມ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTopProducts()?.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>ບໍ່ມີຂໍ້ມູນການຂາຍສິນຄ້າ</td></tr>
                    ) : (
                      getTopProducts()?.slice(0, 5).map((item, idx) => (
                        <tr key={item.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{idx + 1}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.name}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--success-green)' }}>
                            {item.qty.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{(item.total || 0).toLocaleString()} ₭</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Paginated Sales lookup */}
          {(() => {
            const filteredOrders = (stats.orders || []).filter(o => 
              o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
            ).sort((a, b) => new Date(b.date) - new Date(a.date));

            const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
            const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            return (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: 0 }}>🔍 ຄົ້ນຫາປະຫວັດໃບບິນຍ້ອນຫຼັງ (All Bills Lookup)</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleExportTransactionsCsv} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      📤 ສົ່ງອອກ CSV
                    </button>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ຄົ້ນຫາດ້ວຍ ເລກບິນ, ຊື່ພະນັກງານ, ຊ່ອງທາງຊຳລະ..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ maxWidth: '300px', background: '#1c1915' }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px' }}>ເລກບິນ (ID)</th>
                        <th style={{ padding: '12px' }}>ວັນທີ / ເວລາ</th>
                        <th style={{ padding: '12px' }}>ພະນັກງານຂາຍ</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>ສ່ວນຫຼຸດ</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>ຍອດລວມສຸດທິ</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>ຊ່ອງທາງຊຳລະ</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>ປຣິນບິນຄືນ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.length === 0 ? (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>ບໍ່ພົບຂໍ້ມູນໃບບິນຂາຍ</td></tr>
                      ) : (
                        paginatedOrders.map(order => (
                          <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{order.id}</td>
                            <td style={{ padding: '12px' }}>{new Date(order.date).toLocaleString('lo-LA')}</td>
                            <td style={{ padding: '12px' }}>{order.cashierName}</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--alert-red)' }}>
                              {order.discount > 0 ? \`-\${order.discount.toLocaleString()} ₭\` : '-'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{order.total.toLocaleString()} ₭</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                background: order.paymentMethod === 'cash' ? 'rgba(212,175,55,0.1)' : 'rgba(52,152,219,0.1)',
                                color: order.paymentMethod === 'cash' ? 'var(--gold-primary)' : '#3498db'
                              }}>
                                {order.paymentMethod === 'cash' ? '💵 ເງິນສົດ' : '📱 ໂອນທະນາຄານ'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleReprint(order)}>🖨️ ພິມບິນຄືນ</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {pageCount > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ⬅️ ກ່ອນໜ້າ
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ໜ້າ {currentPage} / {pageCount} (ທັງໝົດ {filteredOrders.length} ບິນ)
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      disabled={currentPage === pageCount}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      ຖັດໄປ ➡️
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB TAB: SECURITY & AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Audit Logs Filter controls */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ຄົ້ນຫາເຫດການ:</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ຄົ້ນຫາລາຍລະອຽດ, ຜູ້ໃຊ້..."
                  value={auditSearchQuery}
                  onChange={(e) => {
                    setAuditSearchQuery(e.target.value);
                    setAuditCurrentPage(1);
                  }}
                  style={{ width: '250px', background: '#1c1915' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ຄວາມຮຸນແຮງ (Severity):</span>
                <select
                  className="form-control"
                  style={{ width: '150px', background: '#1c1915' }}
                  value={auditSeverityFilter}
                  onChange={(e) => {
                    setAuditSeverityFilter(e.target.value);
                    setAuditCurrentPage(1);
                  }}
                >
                  <option value="all">ທັງໝົດ (All)</option>
                  <option value="info">ข้อมูล (Info)</option>
                  <option value="warning">ແຈ້ງເຕືອນ (Warning)</option>
                  <option value="danger">ອັນຕະລາຍ (Danger)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
              onClick={() => {
                if (window.confirm('ຕ້ອງການລຶບບັນທຶກຄວາມປອດໄພທັງໝົດແມ່ນບໍ່? (ບໍ່ສາມາດກູ້ຄືນໄດ້)')) {
                  db.clearAuditLogs();
                  loadAuditLogs();
                }
              }}
            >
              🗑️ ລ້າງບັນທຶກທັງໝົດ
            </button>
          </div>

          {/* Audit Logs Grid Table */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px' }}>ວັນທີ / ເວລາ</th>
                    <th style={{ padding: '12px' }}>ພະນັກງານ (User)</th>
                    <th style={{ padding: '12px' }}>ປະເພດເຫດການ (Event)</th>
                    <th style={{ padding: '12px' }}>ລາຍລະອຽດ (Description)</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>ລະດັບ (Severity)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredLogs = auditLogs.filter(log => {
                      const matchesSearch = log.description.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                        log.userName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                        log.type.toLowerCase().includes(auditSearchQuery.toLowerCase());
                      const matchesSeverity = auditSeverityFilter === 'all' || log.severity === auditSeverityFilter;
                      return matchesSearch && matchesSeverity;
                    });

                    const auditPageCount = Math.ceil(filteredLogs.length / itemsPerPage);
                    const paginatedLogs = filteredLogs.slice((auditCurrentPage - 1) * itemsPerPage, auditCurrentPage * itemsPerPage);

                    if (paginatedLogs.length === 0) {
                      return <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>ບໍ່ພົບຂໍ້ມູນບັນທຶກຄວາມປອດໄພ</td></tr>;
                    }

                    return (
                      <>
                        {paginatedLogs.map(log => (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '12px', fontSize: '0.8rem' }}>{new Date(log.timestamp).toLocaleString('lo-LA')}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.userName}</td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{log.type}</td>
                            <td style={{ padding: '12px', color: 'white' }}>{log.description}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                background: log.severity === 'danger' ? 'rgba(231,76,60,0.15)' : log.severity === 'warning' ? 'rgba(230,126,34,0.15)' : 'rgba(52,152,219,0.15)',
                                color: log.severity === 'danger' ? 'var(--alert-red)' : log.severity === 'warning' ? '#e67e22' : '#3498db',
                                border: \`1px solid \${log.severity === 'danger' ? 'var(--alert-red)' : log.severity === 'warning' ? '#e67e22' : '#3498db'}\`
                              }}>
                                {log.severity.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Pagination for Audit Logs */}
                        {auditPageCount > 1 && (
                          <tr>
                            <td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  disabled={auditCurrentPage === 1}
                                  onClick={() => setAuditCurrentPage(auditCurrentPage - 1)}
                                >
                                  ⬅️ ກ່ອນໜ້າ
                                </button>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  ໜ້າ {auditCurrentPage} / {auditPageCount} (ທັງໝົດ {filteredLogs.length} ບັນທຶກ)
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  disabled={auditCurrentPage === auditPageCount}
                                  onClick={() => setAuditCurrentPage(auditCurrentPage + 1)}
                                >
                                  ຖັດໄປ ➡️
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}`;

  const beforeReturn = content.substring(0, returnIdx);
  const afterReturn = content.substring(modalIdx);
  
  const finalContent = beforeReturn + replacementReturn + '\n\n      ' + afterReturn;
  fs.writeFileSync(reportsPath, finalContent, 'utf8');
  console.log('✓ Reports.jsx updated successfully.');
} else {
  console.log('⚠ Could not find returnIdx or modalIdx in Reports.jsx');
}
