const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  // Revert to golden state first using Thai path
  const dPathAlt = 'D:\\เรัดร้านขอบพระใหน่ล้าสุด\\kp pakse pos v2027\\src\\components\\Dashboard.jsx';
  fs.copyFileSync(dPathAlt, file);
  console.log("✓ Reverted to clean golden state.");

  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Replace fmtS
  const oldFmtS = `const fmtS = n => {
  n=n||0;
  if(n>=1e9) return (n/1e9).toFixed(1)+'B ₭';
  if(n>=1e6) return (n/1e6).toFixed(1)+'M ₭';
  if(n>=1e3) return Math.round(n/1e3)+'K ₭';
  return n.toLocaleString()+' ₭';
};`;
  const newFmtS = "const fmtS = n => {\n  n = n || 0;\n  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + 'k ₭';\n};";
  content = content.replace(oldFmtS, newFmtS);

  // 2. Inject states after Dashboard opening brace
  const compStart = content.indexOf('export default function Dashboard(');
  if (compStart !== -1) {
    const bodyStart = content.indexOf(') {', compStart);
    if (bodyStart !== -1) {
      const stateInjection = "\n  const todayStr = new Date().toLocaleDateString('en-CA');\n  const [startDate, setStartDate] = useState(todayStr);\n  const [endDate, setEndDate] = useState(todayStr);";
      content = content.substring(0, bodyStart + 3) + stateInjection + content.substring(bodyStart + 3);
      console.log("✓ Injected states correctly!");
    }
  }

  // 3. Add custom option to periods
  const periodsIndex = content.indexOf('const periods = [');
  if (periodsIndex !== -1) {
    const periodsClose = content.indexOf('];', periodsIndex);
    if (periodsClose !== -1) {
      content = content.substring(0, periodsClose) + "    { key:'custom',  label:'ກຳນົດເອງ' },\n  " + content.substring(periodsClose);
      console.log("✓ Added custom option to periods list!");
    }
  }

  // 4. Update getRange
  const getRangeStart = content.indexOf('const getRange = useCallback((p) => {');
  if (getRangeStart !== -1) {
    const getRangeEnd = content.indexOf('}, []);', getRangeStart);
    if (getRangeEnd !== -1) {
      const newGetRange = "const getRange = useCallback((p) => {\n" +
        "    const n = new Date();\n" +
        "    switch(p) {\n" +
        "      case 'today':   return { s:sod(n), e:eod(n), cs:new Date(sod(n).getTime()-86400000), ce:new Date(eod(n).getTime()-86400000) };\n" +
        "      case 'week': {\n" +
        "        const s7 = new Date(n); s7.setDate(n.getDate()-6);\n" +
        "        const p7s = new Date(s7); p7s.setDate(s7.getDate()-7);\n" +
        "        const p7e = new Date(s7); p7e.setDate(s7.getDate()-1);\n" +
        "        return { s:sod(s7), e:eod(n), cs:sod(p7s), ce:eod(p7e) };\n" +
        "      }\n" +
        "      case 'month': {\n" +
        "        const ms = new Date(n.getFullYear(), n.getMonth(), 1);\n" +
        "        const pms = new Date(n.getFullYear(), n.getMonth()-1, 1);\n" +
        "        const pme = new Date(n.getFullYear(), n.getMonth(), 0);\n" +
        "        return { s:sod(ms), e:eod(n), cs:sod(pms), ce:eod(pme) };\n" +
        "      }\n" +
        "      case 'quarter': {\n" +
        "        const q3 = new Date(n); q3.setDate(n.getDate()-90);\n" +
        "        return { s:sod(q3), e:eod(n), cs:null, ce:null };\n" +
        "      }\n" +
        "      case 'year': {\n" +
        "        const ys = new Date(n.getFullYear(),0,1);\n" +
        "        return { s:sod(ys), e:eod(n), cs:null, ce:null };\n" +
        "      }\n" +
        "      case 'custom': {\n" +
        "        const s = startDate ? new Date(startDate + 'T00:00:00') : new Date();\n" +
        "        const e = endDate ? new Date(endDate + 'T23:59:59') : new Date();\n" +
        "        return { s:sod(s), e:eod(e), cs:null, ce:null };\n" +
        "      }\n" +
        "      default: return { s:sod(n), e:eod(n), cs:null, ce:null };\n" +
        "    }\n" +
        "  }, [startDate, endDate]);";
      content = content.substring(0, getRangeStart) + newGetRange + content.substring(getRangeEnd + 7);
      console.log("✓ Updated getRange implementation!");
    }
  }

  // 5. Update refresh dependencies
  const refreshStart = content.indexOf('const refresh = useCallback(() => {');
  if (refreshStart !== -1) {
    const refreshEnd = content.indexOf('}, [period, getRange]);', refreshStart);
    if (refreshEnd !== -1) {
      content = content.substring(0, refreshEnd) + "}, [period, getRange, startDate, endDate]);" + content.substring(refreshEnd + 23);
      console.log("✓ Updated refresh dependency array!");
    }
  }

  // 6. Update Period Selector UI
  const periodSelStart = content.indexOf('{periods.map(p => (');
  if (periodSelStart !== -1) {
    const divEnd = content.indexOf('</div>', periodSelStart);
    if (divEnd !== -1) {
      const replacementPeriodUI = "{periods.map(p => (\n" +
        "            <button key={p.key}\n" +
        "              className={`dash-period-btn${period===p.key?' active':''}`}\n" +
        "              onClick={() => setPeriod(p.key)}\n" +
        "              style={{\n" +
        "                padding:'6px 14px', borderRadius:9,\n" +
        "                background: 'none',\n" +
        "                color: period===p.key ? 'white' : '#64748b',\n" +
        "                fontWeight: period===p.key ? 700 : 500,\n" +
        "                fontSize:'0.78rem',\n" +
        "              }}>\n" +
        "              {p.label}\n" +
        "            </button>\n" +
        "          ))}\n" +
        "        </div>\n" +
        "        {period === 'custom' && (\n" +
        "          <div style={{\n" +
        "            display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end',\n" +
        "            background: 'rgba(255,255,255,0.02)', marginTop: '8px',\n" +
        "            border: '1px solid rgba(255,255,255,0.05)',\n" +
        "            borderRadius: '8px', padding: '4px 8px'\n" +
        "          }}>\n" +
        "            <input\n" +
        "              type=\"date\"\n" +
        "              value={startDate}\n" +
        "              onChange={(e) => setStartDate(e.target.value)}\n" +
        "              style={{\n" +
        "                background: 'transparent',\n" +
        "                border: 'none',\n" +
        "                color: 'white',\n" +
        "                fontSize: '0.78rem',\n" +
        "                outline: 'none'\n" +
        "              }}\n" +
        "            />\n" +
        "            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>ຫາ</span>\n" +
        "            <input\n" +
        "              type=\"date\"\n" +
        "              value={endDate}\n" +
        "              onChange={(e) => setEndDate(e.target.value)}\n" +
        "              style={{\n" +
        "                background: 'transparent',\n" +
        "                border: 'none',\n" +
        "                color: 'white',\n" +
        "                fontSize: '0.78rem',\n" +
        "                outline: 'none'\n" +
        "              }}\n" +
        "            />\n" +
        "          </div>\n" +
        "        )}";
      
      const outerDivStart = content.lastIndexOf('<div style={{', periodSelStart);
      if (outerDivStart !== -1) {
        const outerDivEnd = content.indexOf('</div>', divEnd + 6);
        if (outerDivEnd !== -1) {
          content = content.substring(0, outerDivStart) + "<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>\n        <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(148,163,184,0.08)', borderRadius:12, padding:4, flexWrap:'wrap' }}>\n          " + replacementPeriodUI + "\n        </div>" + content.substring(outerDivEnd + 6);
          console.log("✓ Updated Period Selector UI!");
        }
      }
    }
  }

  // 7. Update KpiCard signature
  const oldKpiCard = "function KpiCard({ icon, label, value, sub, subColor, accentColor, change, chart, small }) {\n" +
    "  const rgb = accentColor?.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '99,102,241';\n" +
    "  return (\n" +
    "    <div style={{\n" +
    "      padding: '20px 22px 16px',\n" +
    "      position: 'relative',\n" +
    "      overflow: 'hidden',\n" +
    "      cursor: 'default',\n" +
    "      animation: 'dashFadeUp 0.4s ease',\n" +
    "      background: `rgba(${rgb}, 0.07)`,\n" +
    "      border: `1px solid rgba(${rgb}, 0.25)`,\n" +
    "      borderRadius: 18,\n" +
    "      boxShadow: `0 4px 24px rgba(${rgb}, 0.15)`\n" +
    "    }}>";

  const newKpiCard = "function KpiCard({ icon, label, value, sub, subColor, accentColor, change, chart, small, onClick }) {\n" +
    "  const rgb = accentColor?.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '99,102,241';\n" +
    "  return (\n" +
    "    <div \n" +
    "      onClick={onClick}\n" +
    "      style={{\n" +
    "        padding: '20px 22px 16px',\n" +
    "        position: 'relative',\n" +
    "        overflow: 'hidden',\n" +
    "        cursor: onClick ? 'pointer' : 'default',\n" +
    "        animation: 'dashFadeUp 0.4s ease',\n" +
    "        background: `rgba(${rgb}, 0.07)`,\n" +
    "        border: `1px solid rgba(${rgb}, 0.25)`,\n" +
    "        borderRadius: 18,\n" +
    "        boxShadow: `0 4px 24px rgba(${rgb}, 0.15)`,\n" +
    "        transition: 'transform 0.2s ease, border-color 0.2s',\n" +
    "      }}\n" +
    "      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `rgba(${rgb}, 0.45)`; } }}\n" +
    "      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = `rgba(${rgb}, 0.25)`; } }}\n" +
    "    >";
  content = content.replace(oldKpiCard, newKpiCard);

  // 8. Update Primary KPI Card render block (target after comment)
  const commentIdx = content.indexOf('PRIMARY KPI GRID');
  if (commentIdx !== -1) {
    const primaryGridStart = content.indexOf('<div', commentIdx);
    if (primaryGridStart !== -1) {
      const primaryGridEnd = content.indexOf('</div>', primaryGridStart + 200);
      if (primaryGridEnd !== -1) {
        const newPrimaryBlock = "<div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>\n" +
          "            <KpiCard\n" +
          "              icon={<DashIcons.revenue />}\n" +
          "              label=\"ຍอดຂາຍລວມ\"\n" +
          "              value={fmtS(data.totalRevenue)}\n" +
          "              sub={`${data.totalOrders} ບິນ · ທຽບ${period==='today'?'ມື້ກ່ອນ':period==='week'?'7ວັນກ່ອນ':'ງວດກ່ອນ'}: ${revChange>=0?'+':''}${Math.abs(revChange).toFixed(1)}%`}\n" +
          "              subColor={revChange>=0?'#34d399':'#f87171'}\n" +
          "              accentColor=\"rgba(251,191,36,0.08)\"\n" +
          "              change={revChange}\n" +
          "              chart={data.dailyWeek}\n" +
          "              onClick={() => onTabChange?.('reports')}\n" +
          "            />\n" +
          "            <KpiCard\n" +
          "              icon={<DashIcons.receipt />}\n" +
          "              label=\"ຈຳນວນບິນ\"\n" +
          "              value={data.totalOrders.toLocaleString()}\n" +
          "              sub={`ອໍເດີ້ອອນລາຍ ${data.onlineOrders} ລາຍການ`}\n" +
          "              subColor=\"#60a5fa\"\n" +
          "              accentColor=\"rgba(52,152,219,0.08)\"\n" +
          "              change={ordChange}\n" +
          "              onClick={() => onTabChange?.('reports')}\n" +
          "            />\n" +
          "            <KpiCard\n" +
          "              icon={<DashIcons.expense />}\n" +
          "              label=\"ລາຍຈ່າຍ\"\n" +
          "              value={fmtS(data.totalExpense)}\n" +
          "              sub={data.totalReturns > 0 ? `ຄືນເງິນ ${fmtS(data.totalReturns)}` : 'ບໍ່ມີການຄືນ'}\n" +
          "              subColor=\"#f87171\"\n" +
          "              accentColor=\"rgba(231,76,60,0.08)\"\n" +
          "              onClick={() => onTabChange?.('inventory')}\n" +
          "            />\n" +
          "            <KpiCard\n" +
          "              icon={<DashIcons.profit />}\n" +
          "              label=\"ກຳໄລຄາດຄະເນ\"\n" +
          "              value={fmtS(data.totalProfit)}\n" +
          "              sub={`ໜີ້ຄ້າງ: ${fmtS(data.totalDebt)}`}\n" +
          "              subColor={data.totalDebt>0?'#f87171':'#34d399'}\n" +
          "              accentColor={data.totalProfit>=0?\"rgba(39,174,96,0.08)\":\"rgba(231,76,60,0.08)\"}\n" +
          "              onClick={() => onTabChange?.('reports')}\n" +
          "            />";
        content = content.substring(0, primaryGridStart) + newPrimaryBlock + content.substring(primaryGridEnd);
        console.log("✓ Updated Primary KPI Card render block correctly!");
      }
    }
  }

  // 9. Update Secondary KPI Cards Block (boundary search up to MAIN GRID comment including braces)
  const secGridStart = content.indexOf("<div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>");
  if (secGridStart !== -1) {
    const mainGridComment = "{/* ═══════════════════════\n              MAIN GRID (2 columns)\n          ═══════════════════════ */}";
    const secGridEnd = content.indexOf(mainGridComment, secGridStart);
    if (secGridEnd !== -1) {
      const newSecBlock = "<div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>\n" +
        "            {[\n" +
        "              { icon:<DashIcons.frame />, label:'ງານอັດກອບ', value:fmtS(data.totalFraming), sub:`${data.framingJobs} Job`, color:'rgba(155,89,182,0.08)', tab:'framing' },\n" +
        "              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:`${data.onlineOrders} ອໍເດີ້`, color:'rgba(52,152,219,0.08)', tab:'online-orders' },\n" +
        "              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:`ໃນ${periods.find(p=>p.key===period)?.label||period}ນີ້`, color:'rgba(52,211,153,0.08)', tab:'customers' },\n" +
        "              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)', tab:'inventory' },\n" +
        "            ].map((item, i) => {\n" +
        "              const rgb = item.color.match(/\\d+,\\s*\\d+,\\s*\\d+/)?.[0] || '167,139,250';\n" +
        "              return (\n" +
        "                <div key={i} \n" +
        "                  onClick={() => onTabChange?.(item.tab)}\n" +
        "                  style={{\n" +
        "                    position: 'relative',\n" +
        "                    overflow: 'hidden',\n" +
        "                    background: `rgba(${rgb}, 0.07)`,\n" +
        "                    border: `1px solid rgba(${rgb}, 0.25)`,\n" +
        "                    borderRadius: 18,\n" +
        "                    padding: '16px 20px',\n" +
        "                    display: 'flex',\n" +
        "                    alignItems: 'center',\n" +
        "                    gap: 12,\n" +
        "                    boxShadow: `0 4px 20px rgba(${rgb}, 0.12)`,\n" +
        "                    transition: 'transform 0.2s ease, border-color 0.2s',\n" +
        "                    cursor: 'pointer',\n" +
        "                    animation: `dashFadeUp ${0.4+(i*0.08)}s ease`,\n" +
        "                  }}\n" +
        "                  onMouseEnter={e=>{\n" +
        "                    e.currentTarget.style.transform='translateY(-2px)';\n" +
        "                    e.currentTarget.style.borderColor=`rgba(${rgb}, 0.45)`;\n" +
        "                  }}\n" +
        "                  onMouseLeave={e=>{\n" +
        "                    e.currentTarget.style.transform='';\n" +
        "                    e.currentTarget.style.borderColor=`rgba(${rgb}, 0.25)`;\n" +
        "                  }}>\n" +
        "                  <div style={{ position:'absolute', top:-14, right:-14, width:60, height:60, borderRadius:'50%', background:`rgb(${rgb})`, opacity:0.08, filter:'blur(18px)', pointerEvents:'none' }} />\n" +
        "                  <div style={{\n" +
        "                    width:36,\n" +
        "                    height:36,\n" +
        "                    borderRadius:10,\n" +
        "                    background: `rgba(${rgb}, 0.15)`,\n" +
        "                    display:'flex',\n" +
        "                    alignItems:'center',\n" +
        "                    justifyContent:'center',\n" +
        "                    flexShrink:0,\n" +
        "                    color:`rgb(${rgb})`,\n" +
        "                    border: `1px solid rgba(${rgb}, 0.3)`\n" +
        "                  }}>\n" +
        "                    {item.icon}\n" +
        "                  </div>\n" +
        "                  <div>\n" +
        "                    <div style={{ fontSize:'1.15rem', fontWeight:900, color:`rgb(${rgb})`, letterSpacing:'-0.3px', lineHeight:1.1 }}>{item.value}</div>\n" +
        "                    <div style={{ fontSize:'0.65rem', fontWeight:700, color:`rgba(${rgb}, 0.85)`, textTransform:'uppercase', letterSpacing:'0.4px', marginTop:4 }}>{item.label}</div>\n" +
        "                    <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:2 }}>{item.sub}</div>\n" +
        "                  </div>\n" +
        "                </div>\n" +
        "              );\n" +
        "            })}</div>\n\n          {/* ═══════════════════════\n              MAIN GRID (2 columns)\n          ═══════════════════════ */}";
      content = content.substring(0, secGridStart) + newSecBlock + content.substring(secGridEnd + mainGridComment.length);
      console.log("✓ Updated Secondary KPI Cards Block!");
    }
  }

  // 10. Clickable headers
  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ລາຍການຂາຍລ່າສຸດ</h3>`,
    `<h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ລາຍການຂາຍລ່າສຸດ</h3>`
  );

  content = content.replace(
    `<h3>ສິນຄ້າຂາຍດີ Top {data.topProducts.length}</h3>`,
    `<h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ສິນຄ້າຂາຍດີ Top {data.topProducts.length}</h3>`
  );

  content = content.replace(
    `<h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ສິນຄ້າ Stock ໃກ้ໝົດ ({data.lowStock.length} ລາຍການ)</h3>`,
    `<h3 onClick={() => onTabChange?.('inventory')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ສິນຄ້າ Stock ໃກ້ໝົດ ({data.lowStock.length} ລາຍການ)</h3>`
  );

  // 11. Remove bottom shortcuts section
  const oldQuickActions = `<div className="glass-card" style={{ padding:'18px 20px' }}>\n            <h3 style={{ fontWeight:700, fontSize:'0.75rem', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'1px', color: 'var(--gold-primary)', fontWeight: 800 }}>\n              ທາງລັດ\n            </h3>`;
  const quickActionsStart = content.indexOf(oldQuickActions);
  if (quickActionsStart !== -1) {
    const nextClosingDiv = content.indexOf('</div>', quickActionsStart + 120);
    const buttonsCloseDiv = content.indexOf('</div>', quickActionsStart + 200);
    const outerCloseDiv = content.indexOf('</div>', buttonsCloseDiv + 6);
    if (outerCloseDiv !== -1) {
      content = content.substring(0, quickActionsStart) + content.substring(outerCloseDiv + 6);
      console.log("✓ Removed bottom shortcuts block!");
    }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log("✅ Successfully patched Dashboard.jsx clean!");
}
