const fs = require('fs');

const jsonPath = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/scratch/step_339_dashboard_write.json';
const dashboardPath = 'c:/Users/sutha/OneDrive/Desktop/kp pakse pos/src/components/Dashboard.jsx';

if (fs.existsSync(jsonPath)) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let code = data.CodeContent;

  // 1. Format code line endings to normalized \n
  code = code.replace(/\r\n/g, '\n');

  // 2. Modify fmtS currency formatter
  const originalFmtS = `const fmtS = n => {
  n=n||0;
  if(n>=1e9) return (n/1e9).toFixed(1)+'B ₭';
  if(n>=1e6) return (n/1e6).toFixed(1)+'M ₭';
  if(n>=1e3) return Math.round(n/1e3)+'K ₭';
  return n.toLocaleString()+' ₭';
};`;

  const newFmtS = `const fmtS = n => {
  n = n || 0;
  return Math.round(n).toLocaleString('de-DE') + ' ₭';
};`;

  if (code.includes(originalFmtS)) {
    code = code.replace(originalFmtS, newFmtS);
  } else {
    console.log("Could not find originalFmtS");
  }

  // 3. Modify KpiCard component signature and styles
  const originalKpiCard = `function KpiCard({ icon, label, value, sub, subColor, accentColor, change, chart, small }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(11,25,48,0.9) 0%, rgba(7,18,37,0.95) 100%)',
      border: '1px solid rgba(148,163,184,0.09)',
      borderRadius: 18,
      padding: '20px 22px 16px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s, box-shadow 0.2s',
      cursor: 'default',
      animation: 'dashFadeUp 0.4s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor='rgba(148,163,184,0.18)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.6)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(148,163,184,0.09)'; e.currentTarget.style.boxShadow=''; }}>`;

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
        transition: 'transform 0.2s ease, border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={onClick ? e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = \`rgba(\${rgb}, 0.45)\`;
        e.currentTarget.style.boxShadow = \`0 10px 28px rgba(0,0,0,0.55), 0 4px 24px rgba(\${rgb}, 0.25)\`;
      } : undefined}
      onMouseLeave={onClick ? e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = \`rgba(\${rgb}, 0.25)\`;
        e.currentTarget.style.boxShadow = \`0 4px 24px rgba(\${rgb}, 0.15)\`;
      } : undefined}
    >`;

  // Also strip the old style definition inside originalKpiCard
  code = code.replace(originalKpiCard, newKpiCard);

  // Re-map colors of KpiCards to match design system colors:
  code = code.replace(
    `accentColor="rgba(99,102,241,0.08)"`,
    `accentColor="rgba(52,152,219,0.08)"`
  );
  code = code.replace(
    `accentColor="rgba(248,113,113,0.08)"`,
    `accentColor="rgba(231,76,60,0.08)"`
  );
  code = code.replace(
    `accentColor={data.totalProfit>=0?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)"}`,
    `accentColor={data.totalProfit>=0?"rgba(39,174,96,0.08)":"rgba(231,76,60,0.08)"}`
  );

  // 4. Modify Dashboard function setup (states, periods, getRange, refresh)
  const originalStateSetup = `export default function Dashboard({ onTabChange, isMobile }) {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(() => safe(() => db.getSettings(), {}));
  const [now] = useState(() => new Date());

  const periods = [
    { key:'today',   label:'ວັນນີ້' },
    { key:'week',    label:'7 ວັນ' },
    { key:'month',   label:'ເດືອນ' },
    { key:'quarter', label:'3 ເດືອນ' },
    { key:'year',    label:'ປີ' },
  ];

  const getRange = useCallback((p) => {
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
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const { s, e, cs, ce } = getRange(period);
      const d = calcData(s, e, cs, ce);
      setData(d);
      setSettings(safe(() => db.getSettings(), {}));
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [period, getRange]);`;

  const newStateSetup = `export default function Dashboard({ onTabChange, isMobile }) {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(() => safe(() => db.getSettings(), {}));
  const [now] = useState(() => new Date());

  const periods = [
    { key:'today',   label:'ວັນນີ້' },
    { key:'week',    label:'7 ວັນ' },
    { key:'month',   label:'ເດືອນ' },
    { key:'quarter', label:'3 ເດືອນ' },
    { key:'year',    label:'ປີ' },
    { key:'custom',  label:'ກຳນົດເອງ' },
  ];

  const getRange = useCallback((p) => {
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
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        return { s:sod(sDate), e:eod(eDate), cs:null, ce:null };
      }
      default: return { s:sod(n), e:eod(n), cs:null, ce:null };
    }
  }, [startDate, endDate]);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const { s, e, cs, ce } = getRange(period);
      const d = calcData(s, e, cs, ce);
      setData(d);
      setSettings(safe(() => db.getSettings(), {}));
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [period, getRange]);`;

  code = code.replace(originalStateSetup, newStateSetup);

  // 5. Update Header Render with Custom Presets & Inputs
  const originalHeaderRender = `      {/* ═══════════════════
          HEADER
      ═══════════════════ */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ color:'#f1f5f9', fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.4px', margin:0 }}>
            {db.getLabel('dashboard_title','ພາບລວມລາຄວາດ')}
          </h1>
          <p style={{ color:'#475569', fontSize:'0.78rem', margin:'5px 0 0', fontWeight:500 }}>
            {now.toLocaleDateString('lo-LA', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
            {' · '}{settings.shopName || 'KP Pakse POS'}
          </p>
        </div>

        {/* Period Selector — segmented control style */}
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
      </div>`;

  const newHeaderRender = `      {/* ═══════════════════
          HEADER
      ═══════════════════ */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ color:'#f1f5f9', fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.4px', margin:0 }}>
            {db.getLabel('dashboard_title','ພາບລວມລາຄວາດ')}
          </h1>
          <p style={{ color:'#475569', fontSize:'0.78rem', margin:'5px 0 0', fontWeight:500 }}>
            {now.toLocaleDateString('lo-LA', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
            {' · '}{settings.shopName || 'KP Pakse POS'}
          </p>
        </div>

        {/* Period Selector & Custom Date Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
          <div style={{
            display:'flex', gap:3,
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(148,163,184,0.08)',
            borderRadius:12, padding:4,
            flexWrap:'wrap',
            justifyContent: isMobile ? 'space-between' : 'flex-start'
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
            <div className="animate-fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '6px 12px',
              borderRadius: '10px',
              flexWrap: 'wrap',
              width: '100%',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ແຕ່:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.45)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ຫາ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.45)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>`;

  code = code.replace(originalHeaderRender, newHeaderRender);

  // 6. Update Primary KPI Card render blocks with onClick redirection
  const originalPrimaryKpiGrid = `          {/* ═══════════════════════
              PRIMARY KPI GRID
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <KpiCard
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

  const newPrimaryKpiGrid = `          {/* ═══════════════════════
              PRIMARY KPI GRID
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
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
              onClick={() => onTabChange?.('reports')}
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

  code = code.replace(originalPrimaryKpiGrid, newPrimaryKpiGrid);

  // 7. Update Secondary KPI Card rendering block to support hover effects and redirection links
  const originalSecondaryKpisBlock = `          {/* ═══════════════════════
              SECONDARY KPIs
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(167,139,250,0.08)', iconColor:'#a78bfa' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:\`\${data.onlineOrders} ອໍເດີ້\`, color:'rgba(96,165,250,0.08)', iconColor:'#60a5fa' },
              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:\`ໃນ\${periods.find(p=>p.key===period)?.label||period}ນີ້\`, color:'rgba(52,211,153,0.08)', iconColor:'#34d399' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(248,113,113,0.08)':'rgba(52,211,153,0.08)', iconColor:data.lowStock.length>0?'#f87171':'#34d399' },
            ].map((item, i) => (
              <div key={i} style={{
                background:'linear-gradient(145deg, rgba(11,25,48,0.8) 0%, rgba(7,18,37,0.9) 100%)',
                border:'1px solid rgba(148,163,184,0.07)', borderRadius:14, padding:'14px 16px',
                display:'flex', alignItems:'center', gap:12,
                transition:'transform 0.2s ease, border-color 0.2s', cursor:'default',
                animation:\`dashFadeUp \${0.4+(i*0.08)}s ease\`,
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor='rgba(148,163,184,0.15)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='rgba(148,163,184,0.07)';}}>
                <div style={{ width:36, height:36, borderRadius:10, background:item.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:item.iconColor }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize:'1.15rem', fontWeight:900, color:'#f1f5f9', letterSpacing:'-0.3px' }}>{item.value}</div>
                  <div style={{ fontSize:'0.65rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px' }}>{item.label}</div>
                  <div style={{ fontSize:'0.7rem', color:'#64748b' }}>{item.sub}</div>
                </div>
              </div>
            ))}`;

  const newSecondaryKpisBlock = `          {/* ═══════════════════════
              SECONDARY KPIs
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(155,89,182,0.08)', tab:'framing_board' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:\`\${data.onlineOrders} ອໍເດີ້\`, color:'rgba(52,152,219,0.08)', tab:'online_orders' },
              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:\`ໃນ\${periods.find(p=>p.key===period)?.label||period}ນີ້\`, color:'rgba(52,211,153,0.08)', tab:'customers' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)', tab:'inventory' },
            ].map((item, i) => {
              const rgb = item.color.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '167,139,250';
              return (
                <div key={i} 
                  onClick={item.tab ? () => onTabChange?.(item.tab) : undefined}
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
                    transition: 'transform 0.2s ease, border-color 0.2s, box-shadow 0.2s',
                    cursor: item.tab ? 'pointer' : 'default',
                    animation: \`dashFadeUp \${0.4+(i*0.08)}s ease\`,
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.transform='translateY(-3px)';
                    e.currentTarget.style.borderColor=\`rgba(\${rgb}, 0.45)\`;
                    e.currentTarget.style.boxShadow=\`0 10px 28px rgba(0,0,0,0.55), 0 4px 20px rgba(\${rgb}, 0.22)\`;
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.transform='';
                    e.currentTarget.style.borderColor=\`rgba(\${rgb}, 0.25)\`;
                    e.currentTarget.style.boxShadow=\`0 4px 20px rgba(\${rgb}, 0.12)\`;
                  }}
                >
                  <div style={{ position:'absolute', top:-14, right:-14, width:60, height:60, borderRadius:'50%', background:\`rgb(\${rgb})\`, opacity:0.08, filter:'blur(18px)', pointerEvents:'none' }} />
                  <div style={{
                    width:36,
                    height:36,
                    borderRadius:10,
                    background: \`rgba(\${rgb}, 0.15)\`,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    flexShrink:0,
                    color:\`rgb(\${rgb})\`,
                    border: \`1px solid rgba(\${rgb}, 0.3)\`
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:'1.15rem', fontWeight:900, color:\`rgb(\${rgb})\`, letterSpacing:'-0.3px', lineHeight:1.1 }}>{item.value}</div>
                    <div style={{ fontSize:'0.65rem', fontWeight:700, color:\`rgba(\${rgb}, 0.85)\`, textTransform:'uppercase', letterSpacing:'0.4px', marginTop:4 }}>{item.label}</div>
                    <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:2 }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>`;

  code = code.replace(originalSecondaryKpisBlock, newSecondaryKpisBlock);

  fs.writeFileSync(dashboardPath, code, 'utf8');
  console.log("Successfully restored and upgraded Dashboard.jsx!");
} else {
  console.error("Backup JSON file not found.");
}
