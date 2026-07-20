const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Replace primary KPI block
  const blockStart = content.indexOf('<div style={{ display:\'grid\', gridTemplateColumns: isMobile ? \'1fr 1fr\' : \'repeat(4,1fr)\', gap:14, marginBottom:24 }}>');
  const blockEnd = content.indexOf('<div style={{ display:\'grid\', gridTemplateColumns: isMobile ? \'1fr 1fr\' : \'repeat(4,1fr)\', gap:12, marginBottom:28 }}>');

  if (blockStart !== -1 && blockEnd !== -1) {
    const oldPrimaryBlock = content.substring(blockStart, blockEnd);

    const newPrimaryBlock = `<div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
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
          </div>\n\n          `;

    content = content.substring(0, blockStart) + newPrimaryBlock + content.substring(blockEnd);
    console.log("✅ Replaced primary KPI block successfully!");
  } else {
    console.log("Could not find primary KPI block boundaries");
  }

  // 2. Replace secondary KPI block
  const blockStart2 = content.indexOf('<div style={{ display:\'grid\', gridTemplateColumns: isMobile ? \'1fr 1fr\' : \'repeat(4,1fr)\', gap:12, marginBottom:28 }}>');
  const blockEnd2 = content.indexOf('{/* ═══════════════════════\n              MAIN GRID (2 columns)\n          ═══════════════════════ */}');

  if (blockStart2 !== -1 && blockEnd2 !== -1) {
    const oldSecondaryBlock = content.substring(blockStart2, blockEnd2);

    const newSecondaryBlock = `<div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:\`\${data.framingJobs} Job\`, color:'rgba(155,89,182,0.08)', tab:'framing' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:\`\${data.onlineOrders} ອໍເດີ້\`, color:'rgba(52,152,219,0.08)', tab:'online-orders' },
              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:\`ໃນ\${periods.find(p=>p.key===period)?.label||period}ນີ້\`, color:'rgba(52,211,153,0.08)', tab:'customers' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮีບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)', tab:'inventory' },
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
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor=\`rgba(\${rgb}, 0.45)\`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor=\`rgba(\${rgb}, 0.25)\`;}}>
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
          </div>\n\n          `;

    content = content.substring(0, blockStart2) + newSecondaryBlock + content.substring(blockEnd2);
    console.log("✅ Replaced secondary KPI block successfully!");
  } else {
    console.log("Could not find secondary KPI block boundaries");
  }

  fs.writeFileSync(file, content, 'utf8');
}
