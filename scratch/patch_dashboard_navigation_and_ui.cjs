const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Update KpiCard definition to support onClick
  const oldKpiCard = `function KpiCard({ icon, label, value, sub, subColor, accentColor, change, chart, small }) {
  const rgb = accentColor?.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '99,102,241';
  return (
    <div style={{
      padding: '20px 22px 16px',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'default',
      animation: 'dashFadeUp 0.4s ease',
      background: \`rgba(\${rgb}, 0.07)\`,
      border: \`1px solid rgba(\${rgb}, 0.25)\`,
      borderRadius: 18,
      boxShadow: \`0 4px 24px rgba(\${rgb}, 0.15)\`
    }}>`;

  const newKpiCard = `function KpiCard({ icon, label, value, sub, subColor, accentColor, change, chart, small, onClick }) {
  const rgb = accentColor?.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '99,102,241';
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '20px 22px 16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        animation: 'dashFadeUp 0.4s ease',
        background: \`rgba(\${rgb}, 0.07)\`,
        border: \`1px solid rgba(\${rgb}, 0.25)\`,
        borderRadius: 18,
        boxShadow: \`0 4px 24px rgba(\${rgb}, 0.15)\`,
        transition: 'transform 0.2s ease, border-color 0.2s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = \`rgba(\${rgb}, 0.45)\`; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = \`rgba(\${rgb}, 0.25)\`; } }}
    >`;

  if (content.includes(oldKpiCard)) {
    content = content.replace(oldKpiCard, newKpiCard);
    console.log("✓ Updated KpiCard definition!");
  } else {
    console.log("oldKpiCard pattern not found");
  }

  // 2. Add custom date picker inputs to UI
  const oldPeriodSelector = `        {/* Period Selector — segmented control style */}
        <div style={{
          display:'flex', gap:3,
          background:'rgba(255,255,255,0.03)',
          border:'1px solid rgba(148,163,184,0.08)',
          borderRadius:12, padding:4,
          flexWrap:'wrap',
        }}>
          {periods.map(p => (
            <button key={p.key}
              className={\`dash-period-btn\${period===p.key?' active':''}\`}
              onClick={() => setPeriod(p.key)}
              style={{
                padding:'6px 14px', borderRadius:9,
                background: 'none',
                color: period===p.key ? 'white' : '#64748b',
                fontWeight: period===p.key ? 700 : 500,
                fontSize:'0.78rem',
              }}>
              {p.label}
            </button>
          ))}
        </div>`;

  const newPeriodSelector = `        {/* Period Selector — segmented control style */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{
            display:'flex', gap:3,
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(148,163,184,0.08)',
            borderRadius:12, padding:4,
            flexWrap:'wrap',
          }}>
            {periods.map(p => (
              <button key={p.key}
                className={\`dash-period-btn\${period===p.key?' active':''}\`}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding:'6px 14px', borderRadius:9,
                  background: 'none',
                  color: period===p.key ? 'white' : '#64748b',
                  fontWeight: period===p.key ? 700 : 500,
                  fontSize:'0.78rem',
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px', padding: '4px 8px'
            }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>ຫາ</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>`;

  if (content.includes(oldPeriodSelector)) {
    content = content.replace(oldPeriodSelector, newPeriodSelector);
    console.log("✓ Added custom date pickers to UI!");
  } else {
    console.log("oldPeriodSelector not found");
  }

  // 3. Make Primary KPI Cards Clickable
  const oldPrimaryKPIs = `          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <KpiCard
              icon={<DashIcons.revenue />} label="ຍອດຂາຍລວມ"
              value={fmtS(data.totalRevenue)}
              sub={\`\${data.totalOrders} ບິນ · ທຽບ\${period==='today'?'ມື້ກ່ອນ':period==='week'?'7ວันກ່ອນ':'ງວດກ່ອນ'}: \${revChange>=0?'+':''}\${Math.abs(revChange).toFixed(1)}%\`}
              subColor={revChange>=0?'#34d399':'#f87171'}
              accentColor="rgba(251,191,36,0.08)"
              change={revChange}
              chart={data.dailyWeek}
            />
            <KpiCard
              icon={<DashIcons.receipt />} label="ຈຳນວນບິນ"
              value={data.totalOrders.toLocaleString()}
              sub={\`ອໍເດີ້ອອນລາຍ \${data.onlineOrders} ລາຍການ\`}
              subColor="#60a5fa"
              accentColor="rgba(52,152,219,0.08)"
              change={ordChange}
            />
            <KpiCard
              icon={<DashIcons.expense />} label="ລາຍຈ່າຍ"
              value={fmtS(data.totalExpense)}
              sub={data.totalReturns > 0 ? \`ຄືນເງິນ \${fmtS(data.totalReturns)}\` : 'ບໍ່ມີການຄືນ'}
              subColor="#f87171"
              accentColor="rgba(231,76,60,0.08)"
            />
            <KpiCard
              icon={<DashIcons.profit />} label="ກຳໄລຄາດຄະເນ"
              value={fmtS(data.totalProfit)}
              sub={\`ໜີ້ຄ້າງ: \${fmtS(data.totalDebt)}\`}
              subColor={data.totalDebt>0?'#f87171':'#34d399'}
              accentColor={data.totalProfit>=0?"rgba(39,174,96,0.08)":"rgba(231,76,60,0.08)"}
            />
          </div>`;

  const newPrimaryKPIs = `          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <KpiCard
              icon={<DashIcons.revenue />} label="ຍອດຂາຍລວມ"
              value={fmtS(data.totalRevenue)}
              sub={\`\${data.totalOrders} ບິນ · ທຽບ\${period==='today'?'ມື້ກ່ອນ':period==='week'?'7ວັນກ່ອນ':'ງວດກ່ອນ'}: \${revChange>=0?'+':''}\${Math.abs(revChange).toFixed(1)}%\`}
              subColor={revChange>=0?'#34d399':'#f87171'}
              accentColor="rgba(251,191,36,0.08)"
              change={revChange}
              chart={data.dailyWeek}
              onClick={() => onTabChange?.('reports')}
            />
            <KpiCard
              icon={<DashIcons.receipt />} label="ຈຳນວນບิล"
              value={data.totalOrders.toLocaleString()}
              sub={\`ອໍເดີ້ອອນລາຍ \${data.onlineOrders} ລາຍການ\`}
              subColor="#60a5fa"
              accentColor="rgba(52,152,219,0.08)"
              change={ordChange}
              onClick={() => onTabChange?.('reports')}
            />
            <KpiCard
              icon={<DashIcons.expense />} label="ລາຍຈ່າຍ"
              value={fmtS(data.totalExpense)}
              sub={data.totalReturns > 0 ? \`ຄືນເງິນ \${fmtS(data.totalReturns)}\` : 'ບໍ່ມີการຄືນ'}
              subColor="#f87171"
              accentColor="rgba(231,76,60,0.08)"
              onClick={() => onTabChange?.('inventory')}
            />
            <KpiCard
              icon={<DashIcons.profit />} label="ກຳໄລຄາດຄະເນ"
              value={fmtS(data.totalProfit)}
              sub={\`ໜີ້ຄ້າງ: \${fmtS(data.totalDebt)}\`}
              subColor={data.totalDebt>0?'#f87171':'#34d399'}
              accentColor={data.totalProfit>=0?"rgba(39,174,96,0.08)":"rgba(231,76,60,0.08)"}
              onClick={() => onTabChange?.('reports')}
            />
          </div>`;

  if (content.includes(oldPrimaryKPIs)) {
    content = content.replace(oldPrimaryKPIs, newPrimaryKPIs);
    console.log("✓ Updated primary KPI cards click handlers!");
  } else {
    console.log("oldPrimaryKPIs not found");
  }

  // 4. Make Secondary KPI Cards Clickable
  const oldSecondaryKPIs = `          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(155,89,182,0.08)' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:\`\${data.onlineOrders} ອໍເດີ້\`, color:'rgba(52,152,219,0.08)' },
              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:\`ໃນ\${periods.find(p=>p.key===period)?.label||period}ນີ້\`, color:'rgba(52,211,153,0.08)' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ้ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)' },
            ].map((item, i) => {
              const rgb = item.color.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '167,139,250';
              return (
                <div key={i} style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: \`rgba(\${rgb}, 0.07)\`,
                  border: \`1px solid rgba(\${rgb}, 0.25)\`,
                  borderRadius: 18,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: \`0 4px 20px rgba(\${rgb}, 0.12)\`,
                  transition: 'transform 0.2s ease, border-color 0.2s',
                  cursor: 'default',
                  animation: \`dashFadeUp \${0.4+(i*0.08)}s ease\`,
                }}`;

  const newSecondaryKPIs = `          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(155,89,182,0.08)', tab:'framing' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:\`\${data.onlineOrders} ອໍເດີ້\`, color:'rgba(52,152,219,0.08)', tab:'online-orders' },
              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:\`ໃນ\${periods.find(p=>p.key===period)?.label||period}ນີ້\`, color:'rgba(52,211,153,0.08)', tab:'customers' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)', tab:'inventory' },
            ].map((item, i) => {
              const rgb = item.color.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '167,139,250';
              return (
                <div key={i} 
                  onClick={() => onTabChange?.(item.tab)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: \`rgba(\${rgb}, 0.07)\`,
                    border: \`1px solid rgba(\${rgb}, 0.25)\`,
                    borderRadius: 18,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: \`0 4px 20px rgba(\${rgb}, 0.12)\`,
                    transition: 'transform 0.2s ease, border-color 0.2s',
                    cursor: 'pointer',
                    animation: \`dashFadeUp \${0.4+(i*0.08)}s ease\`,
                  }}`;

  if (content.includes(oldSecondaryKPIs)) {
    content = content.replace(oldSecondaryKPIs, newSecondaryKPIs);
    console.log("✓ Updated secondary KPI cards click handlers!");
  } else {
    console.log("oldSecondaryKPIs not found");
  }

  // 5. Remove bottom Quick Actions / ทางลัด
  const oldQuickActions = `          {/* ═══════════════════════
              QUICK ACTIONS
          ═══════════════════════ */}
          <div className="glass-card" style={{ padding:'18px 20px' }}>
            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1px', color: 'var(--gold-primary)', fontWeight: 800 }}>
              ທາງລັດ
            </h3>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:10 }}>
              {[
                { icon:<DashIcons.pos />,       label:'ຂາຍໜ້າຮ້าน', tab:'pos',          color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.22)' },
                { icon:<DashIcons.frame />,      label:'ງານອັດກອບ',   tab:'framing_board', color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.22)' },
                { icon:<DashIcons.inventory />,  label:'ຈັດການ Stock', tab:'inventory',    color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.22)' },
                { icon:<DashIcons.reports />,    label:'ລາຍງານ',       tab:'reports',      color:'#34d399', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.22)' },
                { icon:<DashIcons.hrm />,        label:'ພະນັກງານ',     tab:'hrm',          color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
              ].map((item, i) => (
                <button key={i} className="dash-quick-btn"
                  onClick={() => onTabChange?.(item.tab)}
                  style={{
                    padding:'16px 10px',
                    background: item.bg,
                    border: \`1px solid \${item.border}\`,
                    borderRadius:13,
                    color: item.color,
                    cursor:'pointer', fontFamily:'inherit',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                    fontWeight:700, fontSize:'0.75rem', textAlign:'center',
                  }}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>`;

  if (content.includes(oldQuickActions)) {
    content = content.replace(oldQuickActions, '');
    console.log("✓ Removed redundant bottom Quick Actions block!");
  } else {
    // Try without comments or slightly different casing
    const altQuickActions = content.substring(content.indexOf('<div className="glass-card" style={{ padding:\'18px 20px\' }}>'));
    if (altQuickActions.includes('ທາງລັດ')) {
      content = content.substring(0, content.indexOf('<div className="glass-card" style={{ padding:\'18px 20px\' }}>')) + '</div>\n    );\n}';
      console.log("✓ Removed redundant bottom Quick Actions block (alt method)!");
    }
  }

  // 6. Make Recent Sales & Top Products Headers Clickable
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ລາຍການຂາຍລ່າສຸດ</h3>`,
    `<h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ລາຍການຂາຍລ່າສຸດ</h3>`
  );

  content = content.replace(
    `<h3>ສິນຄ້າຂາຍດີ Top {data.topProducts.length}</h3>`,
    `<h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ສິນຄ້າຂายດີ Top {data.topProducts.length}</h3>`
  );

  // 7. Make entire Low Stock Alert Header Clickable
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ສິນຄ້າ Stock ໃກ້ໝົດ ({data.lowStock.length} ລາຍການ)</h3>`,
    `<h3 onClick={() => onTabChange?.('inventory')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ສິນຄ້າ Stock ໃກ້ໝົດ ({data.lowStock.length} ລາຍການ)</h3>`
  );

  fs.writeFileSync(file, content, 'utf8');
}
