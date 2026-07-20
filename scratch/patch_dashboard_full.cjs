const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Update fmtS
  const oldFmtS = `const fmtS = n => {
  n=n||0;
  if(n>=1e9) return (n/1e9).toFixed(1)+'B ₭';
  if(n>=1e6) return (n/1e6).toFixed(1)+'M ₭';
  if(n>=1e3) return Math.round(n/1e3)+'K ₭';
  return n.toLocaleString()+' ₭';
};`;
  const newFmtS = `const fmtS = n => {
  n = n || 0;
  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + 'k ₭';
};`;
  content = content.replace(oldFmtS, newFmtS);

  // 2. Update signature, states and periods
  const oldSignature = `export default function Dashboard({ onTabChange, isMobile }) {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(() => safe(() => db.getSettings(), {}));
  const [now] = useState(() => new Date());

  const periods = [
    { key:'today',   label:'ວันນີ້' },
    { key:'week',    label:'7 ວັນ' },
    { key:'month',   label:'ເດືອນ' },
    { key:'quarter', label:'3 ເດືອນ' },
    { key:'year',    label:'ປີ' },
  ];`;

  const newSignature = `export default function Dashboard({ activeUser, onTabChange, isMobile }) {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(() => safe(() => db.getSettings(), {}));
  const [now] = useState(() => new Date());

  const periods = [
    { key:'today',   label:'ວັນນີ້' },
    { key:'week',    label:'7 ວัน' },
    { key:'month',   label:'ເດືອນ' },
    { key:'quarter', label:'3 ເດືອນ' },
    { key:'year',    label:'ປີ' },
    { key:'custom',  label:'ກຳນົດເອງ' },
  ];`;
  content = content.replace(oldSignature, newSignature);

  // 3. Update getRange
  const oldGetRange = `  const getRange = useCallback((p) => {
    const n = new Date();
    switch(p) {
      case 'today':   return { s:sod(n), e:eod(n), cs:new Date(sod(n).getTime()-86400000), ce:new Date(eod(n).getTime()-86400000) };
      case 'week': {
        const s7 = new Date(n); s7.setDate(n.getDate()-6);
        const p7s = new Date(s7); p7s.setDate(s7.getDate()-7);
        const p7e = new Date(s7); p7e.setDate(s7.getDate()-1);
        return { s:sod(s7), e:eod(n), cs:sod(p7s), ce:eod(p7e) };
      }
      case 'month': {
        const ms = new Date(n.getFullYear(), n.getMonth(), 1);
        const pms = new Date(n.getFullYear(), n.getMonth()-1, 1);
        const pme = new Date(n.getFullYear(), n.getMonth(), 0);
        return { s:sod(ms), e:eod(n), cs:sod(pms), ce:eod(pme) };
      }
      case 'quarter': {
        const q3 = new Date(n); q3.setDate(n.getDate()-90);
        return { s:sod(q3), e:eod(n), cs:null, ce:null };
      }
      case 'year': {
        const ys = new Date(n.getFullYear(),0,1);
        return { s:sod(ys), e:eod(n), cs:null, ce:null };
      }
      default: return { s:sod(n), e:eod(n), cs:null, ce:null };
    }
  }, []);`;

  const newGetRange = `  const getRange = useCallback((p) => {
    const n = new Date();
    switch(p) {
      case 'today':   return { s:sod(n), e:eod(n), cs:new Date(sod(n).getTime()-86400000), ce:new Date(eod(n).getTime()-86400000) };
      case 'week': {
        const s7 = new Date(n); s7.setDate(n.getDate()-6);
        const p7s = new Date(s7); p7s.setDate(s7.getDate()-7);
        const p7e = new Date(s7); p7e.setDate(s7.getDate()-1);
        return { s:sod(s7), e:eod(n), cs:sod(p7s), ce:eod(p7e) };
      }
      case 'month': {
        const ms = new Date(n.getFullYear(), n.getMonth(), 1);
        const pms = new Date(n.getFullYear(), n.getMonth()-1, 1);
        const pme = new Date(n.getFullYear(), n.getMonth(), 0);
        return { s:sod(ms), e:eod(n), cs:sod(pms), ce:eod(pme) };
      }
      case 'quarter': {
        const q3 = new Date(n); q3.setDate(n.getDate()-90);
        return { s:sod(q3), e:eod(n), cs:null, ce:null };
      }
      case 'year': {
        const ys = new Date(n.getFullYear(),0,1);
        return { s:sod(ys), e:eod(n), cs:null, ce:null };
      }
      case 'custom': {
        const s = startDate ? new Date(startDate + 'T00:00:00') : new Date();
        const e = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        return { s:sod(s), e:eod(e), cs:null, ce:null };
      }
      default: return { s:sod(n), e:eod(n), cs:null, ce:null };
    }
  }, [startDate, endDate]);`;
  content = content.replace(oldGetRange, newGetRange);

  // 4. Update refresh dependencies
  const oldRefresh = `  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const { s, e, cs, ce } = getRange(period);
      const d = calcData(s, e, cs, ce);
      setData(d);
      setSettings(safe(() => db.getSettings(), {}));
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [period, getRange]);`;

  const newRefresh = `  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const { s, e, cs, ce } = getRange(period);
      const d = calcData(s, e, cs, ce);
      setData(d);
      setSettings(safe(() => db.getSettings(), {}));
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [period, getRange, startDate, endDate]);`;
  content = content.replace(oldRefresh, newRefresh);

  // 5. Update custom date inputs in render
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
  content = content.replace(oldPeriodSelector, newPeriodSelector);

  // 6. Update KpiCard signature
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
  content = content.replace(oldKpiCard, newKpiCard);

  // 7. Replace KPI cards in {data && ( rendering section
  const dataStart = content.indexOf('{data && (');
  if (dataStart !== -1) {
    const subset = content.substring(dataStart);
    
    // Replace primary KPIs
    const oldPrimary = `<KpiCard
              icon={<DashIcons.revenue />} label="ຍອດຂາຍລວມ"
              value={fmtS(data.totalRevenue)}
              sub={\`\${data.totalOrders} ບິນ · ທຽບ\${period==='today'?'ມື້ກ່ອນ':period==='week'?'7ວັນກ່ອນ':'ງວດກ່ອນ'}: \${revChange>=0?'+':''}\${Math.abs(revChange).toFixed(1)}%\`}
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
              sub={data.totalReturns > 0 ? \`ຄືນເງິນ \${fmtS(data.totalReturns)}\` : 'ບໍ່ມີການຄືน'}
              subColor="#f87171"
              accentColor="rgba(231,76,60,0.08)"
            />
            <KpiCard
              icon={<DashIcons.profit />} label="ກຳໄລຄາດຄະເນ"
              value={fmtS(data.totalProfit)}
              sub={\`ໜີ້ຄ້າງ: \${fmtS(data.totalDebt)}\`}
              subColor={data.totalDebt>0?'#f87171':'#34d399'}
              accentColor={data.totalProfit>=0?"rgba(39,174,96,0.08)":"rgba(231,76,60,0.08)"}
            />`;

    const newPrimary = `<KpiCard
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
              icon={<DashIcons.receipt />} label="ຈຳນວນບິນ"
              value={data.totalOrders.toLocaleString()}
              sub={\`ອໍເດີ້ອອນລາຍ \${data.onlineOrders} ລາຍການ\`}
              subColor="#60a5fa"
              accentColor="rgba(52,152,219,0.08)"
              change={ordChange}
              onClick={() => onTabChange?.('reports')}
            />
            <KpiCard
              icon={<DashIcons.expense />} label="ລາຍຈ່າຍ"
              value={fmtS(data.totalExpense)}
              sub={data.totalReturns > 0 ? \`ຄືນເງິນ \${fmtS(data.totalReturns)}\` : 'ບໍ່ມີການຄືນ'}
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
            />`;

    // Replace secondary KPIs mapping block
    const oldSecondaryBlock = `          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(155,89,182,0.08)' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:\`\${data.onlineOrders} ອໍເດີ້\`, color:'rgba(52,152,219,0.08)' },
              { icon:<DashIcons.users />, label:'ສະມາชິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:\`ໃນ\${periods.find(p=>p.key===period)?.label||period}ນີ້\`, color:'rgba(52,211,153,0.08)' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)' },
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

    const newSecondaryBlock = `          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກอบ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(155,89,182,0.08)', tab:'framing' },
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

    content = content.replace(oldPrimary, newPrimary);
    content = content.replace(oldSecondaryBlock, newSecondaryBlock);
  }

  // 8. Remove Quick Actions block cleanly
  const qaIdx = content.indexOf('<div className="glass-card" style={{ padding:\'18px 20px\' }}>');
  if (qaIdx !== -1) {
    content = content.substring(0, qaIdx) + '</div>\n    );\n}';
  }

  // 9. Make Recent Sales & Top Products Headers Clickable
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ລາຍການຂາຍລ່າສຸດ</h3>`,
    `<h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ລາຍการຂາຍລ່າສຸດ</h3>`
  );

  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ສິນຄ້າຂາຍດີ Top {data.topProducts.length}</h3>`,
    `<h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ສິນຄ້າຂາຍດີ Top {data.topProducts.length}</h3>`
  );

  // 10. Make entire Low Stock Alert Header Clickable
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ສິນຄ້າ Stock ໃກ້ໝົດ ({data.lowStock.length} ລາຍການ)</h3>`,
    `<h3 onClick={() => onTabChange?.('inventory')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ສິນຄ້າ Stock ໃກ້ໝົດ ({data.lowStock.length} ລາຍການ)</h3>`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Dashboard.jsx successfully updated with all features!");
}
