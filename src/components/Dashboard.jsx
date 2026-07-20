import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/db';

/* ─────────────────────────────────
   Helpers (logic preserved 100%)
───────────────────────────────── */
const sod = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const eod = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const _sameDay = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const safe = (fn, fb=[]) => { try { return fn()||fb; } catch { return fb; } };
const pct = (c,p) => p<=0?(c>0?100:0):((c-p)/p)*100;
const fmtS = n => {
  n = n || 0;
  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + ' ₭';
};

/* ─────────────────────────────────
   Data Engine (logic preserved 100%)
───────────────────────────────── */
function calcData(s, e, cs, ce) {
  const orders    = safe(() => db.getOrders());
  const online    = safe(() => db.getOnlineOrders());
  const jobs      = safe(() => db.getFramingJobs());
  const products  = safe(() => db.getProducts());
  const customers = safe(() => db.getCustomers());
  const returns_  = safe(() => db.getReturns());
  const debts     = safe(() => db.getDebts());
  const expenses  = safe(() => db.getExpenses());

  const costMap = {};
  products.forEach(p => { costMap[p.id] = p.cost||0; });

  const inR = (arr, a, b, f='date') => arr.filter(x => {
    try { const d=new Date(x[f]||x.createdAt||x.createdDate); return !isNaN(d)&&d>=a&&d<=b; } catch{return false;}
  });

  const cOrd = inR(orders, s, e);
  const cOnl = inR(online, s, e).filter(o => o.type !== 'inquiry');
  const cOnlPaid = cOnl.filter(o => o.paymentStatus === 'paid');
  const cJobs = inR(jobs, s, e);
  const cExp = inR(expenses, s, e);
  const cRet = inR(returns_, s, e);

  const pOrd = cs ? inR(orders, cs, ce) : [];
  const pOnl = cs ? inR(online, cs, ce).filter(o => o.type !== 'inquiry') : [];
  const pOnlPaid = pOnl.filter(o => o.paymentStatus === 'paid');
  const pJobs = cs ? inR(jobs, cs, ce) : [];

  const sumOrder = arr => arr.reduce((acc, o) => {
    const items = o.items || o.cartItems || [];
    const sub = items.reduce((s, item) => s + ((item.price||0) * (item.qty||1)), 0);
    const disc = o.discount || 0;
    const tot = sub - disc;
    return {
      revenue: acc.revenue + tot,
      cost:    acc.cost + items.reduce((s, item) => s + (costMap[item.productId]||0)*(item.qty||1), 0),
      orders:  acc.orders + 1,
      disc:    acc.disc + disc,
    };
  }, { revenue:0, cost:0, orders:0, disc:0 });

  const sumOnline = arr => arr.reduce((acc, o) => ({
    revenue: acc.revenue + (o.total||o.price||0),
    orders:  acc.orders + 1,
  }), { revenue:0, orders:0 });

  const sumJobs = arr => arr.reduce((acc, j) => ({
    revenue: acc.revenue + (j.totalPrice||j.price||0),
    jobs:    acc.jobs + 1,
  }), { revenue:0, jobs:0 });

  const cO = sumOrder(cOrd);
  const pO = sumOrder(pOrd);
  const cOLn = sumOnline(cOnlPaid);
  const pOLn = sumOnline(pOnlPaid);
  const cJ = sumJobs(cJobs.filter(j => j.status === 'delivered' || j.status === 'completed'));
  const pJ = sumJobs(pJobs.filter(j => j.status === 'delivered' || j.status === 'completed'));

  const totalRevenue = cO.revenue + cOLn.revenue + cJ.revenue;
  const prevRevenue  = pO.revenue + pOLn.revenue + pJ.revenue;
  const totalOrders  = cO.orders + cOLn.orders;
  const prevOrders   = pO.orders + pOLn.orders;
  const totalExpense = cExp.reduce((s, e) => s + (e.amount||0), 0);
  const totalProfit  = totalRevenue - cO.cost - totalExpense;
  const totalReturns = cRet.reduce((s, r) => s + (r.refundAmount||0), 0);
  const totalDebt    = debts.filter(d => !d.paidDate).reduce((s, d) => s + (d.amount||0), 0);

  const topProducts = (() => {
    const map = {};
    [...cOrd, ...cOnlPaid].forEach(o => {
      (o.items||o.cartItems||[]).forEach(item => {
        if (!map[item.name]) map[item.name] = { name:item.name, qty:0, revenue:0 };
        map[item.name].qty += item.qty||1;
        map[item.name].revenue += (item.price||0)*(item.qty||1);
      });
    });
    return Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0, 6);
  })();

  const lowStock = products.filter(p => !db.isServiceCategory?.(p.category) && (p.stock||0) <= (p.minStock||5));
  const newCustomers = customers.filter(c => {
    try { const d=new Date(c.createdAt||c.joinDate); return !isNaN(d)&&d>=s&&d<=e; } catch{return false;}
  }).length;

  const recentSales = cOrd.slice(-8).reverse().map(o => {
    const items = o.items||o.cartItems||[];
    return {
      id:      o.id,
      name:    items.length > 0 ? (items[0].name + (items.length > 1 ? ` +${items.length-1}` : '')) : 'ບໍ່ມີຂໍ້ມູນ',
      amount:  items.reduce((s,i) => s+(i.price||0)*(i.qty||1),0) - (o.discount||0),
      method:  o.paymentMethod,
      time:    o.date||o.createdAt,
      cashier: o.cashierName||o.createdBy||'',
    };
  });

  const hourlyData = (() => {
    const hrs = Array(24).fill(0);
    cOrd.forEach(o => { try { hrs[new Date(o.date).getHours()] += o.items?.reduce((s,i)=>s+(i.price||0)*(i.qty||1),0)||0; } catch{} });
    return hrs;
  })();

  const dailyWeek = (() => {
    const days = [];
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = sod(d); const de = eod(d);
      const dayOrders = inR(orders, ds, de);
      days.push({ label: d.toLocaleDateString('lo-LA',{weekday:'short'}), value: dayOrders.reduce((s,o)=>s+(o.items||[]).reduce((a,it)=>a+(it.price||0)*(it.qty||1),0),0) });
    }
    return days;
  })();

  return { totalRevenue, prevRevenue, totalOrders, prevOrders, totalExpense, totalProfit, totalReturns, totalDebt, topProducts, lowStock, newCustomers, recentSales, hourlyData, dailyWeek, totalFraming: cJ.revenue, framingJobs: cJ.jobs, onlineRevenue: cOLn.revenue, onlineOrders: cOLn.orders };
}

/* ─────────────────────────────────
   SVG Icons (Dashboard-specific)
───────────────────────────────── */
const DashIcons = {
  revenue: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  receipt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  expense: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  profit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  frame: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  ),
  cart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  alert: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  trendUp: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  trendDown: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  pos: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h.01M12 15h.01M17 15h.01M7 11h.01M12 11h.01M17 11h.01"/><path d="M2 8h20"/>
    </svg>
  ),
  inventory: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  reports: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  hrm: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  arrowRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

/* ─────────────────────────────────
   Mini Bar Chart (CSS only, logic preserved)
───────────────────────────────── */
function MiniBarChart({ data, color = '#6366f1' }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:52, padding:'4px 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:0 }}>
          <div
            title={`${d.label}: ${fmtS(d.value)}`}
            style={{
              width:'100%', maxWidth:32,
              height: `${Math.max(3, (d.value/maxVal)*44)}px`,
              background: i === data.length-1
                ? `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
                : `${color}44`,
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.4s ease',
              cursor: 'default',
              boxShadow: i === data.length-1 ? `0 0 8px ${color}66` : 'none',
            }}
          />
          <span style={{ fontSize:'0.5rem', color:'rgba(148,163,184,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%', textAlign:'center' }}>
            {d.label?.slice(0,2)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────
   KPI Card — Enterprise Design
───────────────────────────────── */
function KpiCard({ icon, label, value, sub, subColor, accentColor, change, chart, small, onClick }) {
  const rgb = accentColor?.match(/\d+,\s*\d+,\s*\d+/)?.[0] || '99,102,241';
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '20px 22px 16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        animation: 'dashFadeUp 0.4s ease',
        background: `rgba(${rgb}, 0.07)`,
        border: `1px solid rgba(${rgb}, 0.25)`,
        borderRadius: 18,
        boxShadow: `0 4px 24px rgba(${rgb}, 0.15)`,
        transition: 'transform 0.2s ease, border-color 0.2s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `rgba(${rgb}, 0.45)`; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = `rgba(${rgb}, 0.25)`; } }}
    >

      {/* Accent glow */}
      <div style={{ position:'absolute', top:-14, right:-14, width:70, height:70, borderRadius:'50%', background:`rgb(${rgb})`, opacity:0.09, filter:'blur(18px)', pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{
          width:42, height:42, borderRadius:12,
          background: `rgba(${rgb}, 0.15)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          border: `1px solid rgba(${rgb}, 0.3)`,
          color: `rgb(${rgb})`,
        }}>
          {icon}
        </div>
        {change !== undefined && (
          <div style={{
            display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:20,
            background: change>=0?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)',
            border:`1px solid ${change>=0?'rgba(52,211,153,0.2)':'rgba(248,113,113,0.2)'}`,
          }}>
            <span style={{ fontSize:'0.65rem', fontWeight:800, color: change>=0?'#34d399':'#f87171', display:'flex', alignItems:'center', gap:2 }}>
              {change>=0 ? <DashIcons.trendUp /> : <DashIcons.trendDown />}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize: small?'1.3rem':'1.75rem', fontWeight:900, color:`rgb(${rgb})`, letterSpacing:'-0.5px', lineHeight:1.1 }}>
          {value}
        </div>
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:`rgba(${rgb}, 0.85)`, marginTop:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          {label}
        </div>
      </div>

      {sub && (
        <div style={{ fontSize:'0.72rem', color: subColor||'#64748b', marginTop:2, lineHeight:1.3 }}>
          {sub}
        </div>
      )}

      {chart && (
        <div style={{ marginTop:8, borderTop:'1px solid rgba(148,163,184,0.06)', paddingTop:8 }}>
          <MiniBarChart data={chart} color={`rgb(${rgb})`} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────
   Payment Method Badge (logic preserved)
───────────────────────────────── */
function PayBadge({ method }) {
  const m = (method||'').toLowerCase();
  const configs = {
    cash:     { label:'ສົດ',   bg:'rgba(52,211,153,0.1)',   color:'#34d399', border:'rgba(52,211,153,0.25)' },
    transfer: { label:'ໂອນ',  bg:'rgba(96,165,250,0.1)',   color:'#60a5fa', border:'rgba(96,165,250,0.25)' },
    thb:      { label:'THB',   bg:'rgba(251,191,36,0.1)',   color:'#fbbf24', border:'rgba(251,191,36,0.25)' },
    usd:      { label:'USD',   bg:'rgba(167,139,250,0.1)',  color:'#a78bfa', border:'rgba(167,139,250,0.25)' },
    debt:     { label:'ໜີ້',   bg:'rgba(248,113,113,0.1)',  color:'#f87171', border:'rgba(248,113,113,0.25)' },
    promo:    { label:'Promo', bg:'rgba(251,191,36,0.1)',   color:'#fbbf24', border:'rgba(251,191,36,0.25)' },
    split:    { label:'ລວມ',   bg:'rgba(148,163,184,0.08)', color:'#94a3b8', border:'rgba(148,163,184,0.2)' },
  };
  const c = configs[m] || { label:method||'-', bg:'rgba(148,163,184,0.08)', color:'#94a3b8', border:'rgba(148,163,184,0.2)' };
  return (
    <span style={{ padding:'2px 8px', borderRadius:999, fontSize:'0.65rem', fontWeight:800, background:c.bg, color:c.color, border:`1px solid ${c.border}`, whiteSpace:'nowrap' }}>
      {c.label}
    </span>
  );
}

/* ─────────────────────────────────
   Skeleton Loader
───────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: '20px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.04)', animation:'dashShimmer 1.4s ease-in-out infinite' }} />
        <div style={{ width:60, height:22, borderRadius:20, background:'rgba(255,255,255,0.04)', animation:'dashShimmer 1.4s ease-in-out infinite' }} />
      </div>
      <div style={{ width:'70%', height:28, borderRadius:8, background:'rgba(255,255,255,0.05)', marginBottom:8, animation:'dashShimmer 1.4s ease-in-out infinite' }} />
      <div style={{ width:'45%', height:14, borderRadius:6, background:'rgba(255,255,255,0.03)', animation:'dashShimmer 1.4s ease-in-out infinite 0.2s' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Dashboard({ onTabChange, isMobile }) {
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
        const s = startDate ? new Date(startDate + 'T00:00:00') : new Date();
        const e = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        return { s:sod(s), e:eod(e), cs:null, ce:null };
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
  }, [period, getRange, startDate, endDate]);

  useEffect(() => { queueMicrotask(refresh); }, [refresh]);

  useEffect(() => {
    const handleUpdate = () => { setSettings(safe(() => db.getSettings(), {})); refresh(); };
    window.addEventListener('db-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(refresh, 30000);
    return () => { window.removeEventListener('db-updated', handleUpdate); window.removeEventListener('storage', handleUpdate); clearInterval(interval); };
  }, [refresh]);

  const revChange = data ? pct(data.totalRevenue, data.prevRevenue) : 0;
  const ordChange = data ? pct(data.totalOrders, data.prevOrders) : 0;

  /* ── Render ── */
  return (
    <div style={{ maxWidth:1400, margin:'0 auto', animation:'dashFadeUp 0.35s ease' }}>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dashShimmer {
          0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        .dash-period-btn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1) !important; border: none !important; cursor: pointer !important; font-family: inherit !important; }
        .dash-period-btn:hover { background: rgba(255,255,255,0.06) !important; color: #e2e8f0 !important; }
        .dash-period-btn.active { background: linear-gradient(135deg,rgba(99,102,241,0.85),rgba(79,70,229,0.9)) !important; color: white !important; box-shadow: 0 2px 14px rgba(99,102,241,0.4) !important; }
        .top-prod-row:hover { background: rgba(148,163,184,0.04) !important; }
        .recent-sale-row:hover { background: rgba(148,163,184,0.04) !important; }
        .dash-quick-btn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1) !important; }
        .dash-quick-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 28px rgba(0,0,0,0.55) !important; filter: brightness(1.08); }
        .dash-view-all-btn { transition: all 0.15s ease !important; }
        .dash-view-all-btn:hover { opacity: 0.8 !important; }
      `}</style>

      {/* ═══════════════════
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(148,163,184,0.08)', borderRadius:12, padding:4, flexWrap:'wrap' }}>
          {periods.map(p => (
            <button key={p.key}
              className={`dash-period-btn${period===p.key?' active':''}`}
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
            display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end',
            background: 'rgba(255,255,255,0.02)', marginTop: '8px',
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
        </div>
      </div>

      {/* ═══════════════════
          KPI SKELETON / LOADING
      ═══════════════════ */}
      {loading && !data && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {data && (
        <>
          {/* ═══════════════════════
              PRIMARY KPI GRID
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <KpiCard
              icon={<DashIcons.revenue />}
              label="ຍອດຂາຍລວມ"
              value={fmtS(data.totalRevenue)}
              sub={`${data.totalOrders} ບິນ · ທຽບ${period==='today'?'ມື້ກ່ອນ':period==='week'?'7ວັນກ່ອນ':'ງວດກ່ອນ'}: ${revChange>=0?'+':''}${Math.abs(revChange).toFixed(1)}%`}
              subColor={revChange>=0?'#34d399':'#f87171'}
              accentColor="rgba(251,191,36,0.08)"
              change={revChange}
              chart={data.dailyWeek}
              onClick={() => onTabChange?.('reports')}
            />
            <KpiCard
              icon={<DashIcons.receipt />}
              label="ຈຳນວນບິນ"
              value={data.totalOrders.toLocaleString()}
              sub={`ອໍເດີ້ອອນລາຍ ${data.onlineOrders} ລາຍການ`}
              subColor="#60a5fa"
              accentColor="rgba(52,152,219,0.08)"
              change={ordChange}
              onClick={() => onTabChange?.('reports')}
            />
            <KpiCard
              icon={<DashIcons.expense />}
              label="ລາຍຈ່າຍ"
              value={fmtS(data.totalExpense)}
              sub={data.totalReturns > 0 ? `ຄືນເງິນ ${fmtS(data.totalReturns)}` : 'ບໍ່ມີການຄືນ'}
              subColor="#f87171"
              accentColor="rgba(231,76,60,0.08)"
              onClick={() => onTabChange?.('inventory')}
            />
            <KpiCard
              icon={<DashIcons.profit />}
              label="ກຳໄລຄາດຄະເນ"
              value={fmtS(data.totalProfit)}
              sub={`ໜີ້ຄ້າງ: ${fmtS(data.totalDebt)}`}
              subColor={data.totalDebt>0?'#f87171':'#34d399'}
              accentColor={data.totalProfit>=0?"rgba(39,174,96,0.08)":"rgba(231,76,60,0.08)"}
              onClick={() => onTabChange?.('reports')}
            /></div>

          {/* ═══════════════════════
              SECONDARY KPIs
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { icon:<DashIcons.frame />, label:'ງານອັດກອບ', value:fmtS(data.totalFraming), sub:`${data.framingJobs} Job`, color:'rgba(155,89,182,0.08)', tab:'framing' },
              { icon:<DashIcons.cart />, label:'ອໍເດີ້ອອນລາຍ', value:fmtS(data.onlineRevenue), sub:`${data.onlineOrders} ອໍເດີ້`, color:'rgba(52,152,219,0.08)', tab:'online-orders' },
              { icon:<DashIcons.users />, label:'ສະມາຊິກໃໝ່', value:data.newCustomers.toLocaleString(), sub:`ໃນ${periods.find(p=>p.key===period)?.label||period}ນີ້`, color:'rgba(52,211,153,0.08)', tab:'customers' },
              { icon:<DashIcons.alert />, label:'Stock ໃກ້ໝົດ', value:data.lowStock.length.toLocaleString(), sub:data.lowStock.length>0?'ຕ້ອງສັ່ງຊື້ຮີບ':'Stock ຫລ່ຽງດີ', color:data.lowStock.length>0?'rgba(230,126,34,0.08)':'rgba(39,174,96,0.08)', tab:'inventory' },
            ].map((item, i) => {
              const rgb = item.color.match(/\d+,\s*\d+,\s*\d+/)?.[0] || '167,139,250';
              return (
                <div key={i} 
                  onClick={() => onTabChange?.(item.tab)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: `rgba(${rgb}, 0.07)`,
                    border: `1px solid rgba(${rgb}, 0.25)`,
                    borderRadius: 18,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: `0 4px 20px rgba(${rgb}, 0.12)`,
                    transition: 'transform 0.2s ease, border-color 0.2s',
                    cursor: 'pointer',
                    animation: `dashFadeUp ${0.4+(i*0.08)}s ease`,
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.transform='translateY(-2px)';
                    e.currentTarget.style.borderColor=`rgba(${rgb}, 0.45)`;
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.transform='';
                    e.currentTarget.style.borderColor=`rgba(${rgb}, 0.25)`;
                  }}>
                  <div style={{ position:'absolute', top:-14, right:-14, width:60, height:60, borderRadius:'50%', background:`rgb(${rgb})`, opacity:0.08, filter:'blur(18px)', pointerEvents:'none' }} />
                  <div style={{
                    width:36,
                    height:36,
                    borderRadius:10,
                    background: `rgba(${rgb}, 0.15)`,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    flexShrink:0,
                    color:`rgb(${rgb})`,
                    border: `1px solid rgba(${rgb}, 0.3)`
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:'1.15rem', fontWeight:900, color:`rgb(${rgb})`, letterSpacing:'-0.3px', lineHeight:1.1 }}>{item.value}</div>
                    <div style={{ fontSize:'0.65rem', fontWeight:700, color:`rgba(${rgb}, 0.85)`, textTransform:'uppercase', letterSpacing:'0.4px', marginTop:4 }}>{item.label}</div>
                    <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:2 }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}</div>

          {/* ═══════════════════════
              MAIN GRID (2 columns)
          ═══════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginBottom:20 }}>

            {/* ── Recent Sales ── */}
            <div className="glass-card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid rgba(148,163,184,0.06)' }}>
                <div>
                  <h3 onClick={() => onTabChange?.('reports')} style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, cursor: 'pointer' }}>ລາຍການຂາຍລ່າສຸດ</h3>
                  <p style={{ color:'#475569', fontSize:'0.68rem', margin:'3px 0 0' }}>ການຂາຍ {data.totalOrders} ລາຍການ</p>
                </div>
                <button className="dash-view-all-btn" onClick={() => onTabChange?.('reports')}
                  style={{ padding:'5px 12px', borderRadius:8, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                  ທັງໝົດ <DashIcons.arrowRight />
                </button>
              </div>

              {data.recentSales.length === 0 ? (
                <div style={{ padding:'40px 20px', textAlign:'center', color:'#475569', fontSize:'0.85rem' }}>
                  ຍັງບໍ່ມີລາຍການຂາຍ
                </div>
              ) : (
                <div style={{ padding:'8px 0' }}>
                  {data.recentSales.map((sale, i) => (
                    <div key={sale.id||i} className="recent-sale-row"
                      style={{ display:'flex', alignItems:'center', padding:'10px 20px', borderBottom:'1px solid rgba(148,163,184,0.04)', gap:12, transition:'background 0.12s', cursor:'default' }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800, color:'#818cf8', flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.84rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sale.name}</div>
                        <div style={{ color:'#475569', fontSize:'0.68rem', display:'flex', alignItems:'center', gap:6, marginTop:1 }}>
                          {sale.time && <span>{new Date(sale.time).toLocaleTimeString('lo-LA',{hour:'2-digit',minute:'2-digit'})}</span>}
                          {sale.cashier && <span>· {sale.cashier}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                        <span style={{ fontWeight:800, color:'#fbbf24', fontSize:'0.85rem' }}>{fmtS(sale.amount)}</span>
                        <PayBadge method={sale.method} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Top Products ── */}
            <div className="glass-card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid rgba(148,163,184,0.06)' }}>
                <div>
                  <h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ສິນຄ້າຂາຍດີ Top {data.topProducts.length}</h3>
                  <p style={{ color:'#475569', fontSize:'0.68rem', margin:'3px 0 0' }}>ຈາກ{periods.find(p=>p.key===period)?.label||period}ນີ້</p>
                </div>
                <button className="dash-view-all-btn" onClick={() => onTabChange?.('inventory')}
                  style={{ padding:'5px 12px', borderRadius:8, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', color:'#fbbf24', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                  ທັງໝົດ <DashIcons.arrowRight />
                </button>
              </div>

              {data.topProducts.length === 0 ? (
                <div style={{ padding:'40px 20px', textAlign:'center', color:'#475569', fontSize:'0.85rem' }}>
                  ຍັງບໍ່ມີຂໍ້ມູນ
                </div>
              ) : (
                <div style={{ padding:'8px 0' }}>
                  {data.topProducts.map((p, i) => {
                    const maxRev = data.topProducts[0].revenue || 1;
                    const barPct = (p.revenue / maxRev) * 100;
                    const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32', '#818cf8', '#34d399', '#60a5fa'];
                    return (
                      <div key={p.name} className="top-prod-row"
                        style={{ padding:'10px 20px', borderBottom:'1px solid rgba(148,163,184,0.04)', transition:'background 0.12s', cursor:'default' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                          <span style={{ width:22, height:22, borderRadius:6, background:`${rankColors[i]||'#64748b'}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:900, color:rankColors[i]||'#64748b', flexShrink:0 }}>
                            {i+1}
                          </span>
                          <span style={{ flex:1, fontWeight:700, color:'#e2e8f0', fontSize:'0.84rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                          <span style={{ fontWeight:800, color:rankColors[i]||'#64748b', fontSize:'0.82rem', flexShrink:0 }}>{fmtS(p.revenue)}</span>
                          <span style={{ fontSize:'0.65rem', color:'#475569', flexShrink:0 }}>{p.qty} ອັນ</span>
                        </div>
                        <div style={{ height:4, background:'rgba(148,163,184,0.07)', borderRadius:999, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${barPct}%`, background:`linear-gradient(90deg,${rankColors[i]||'#64748b'},${rankColors[i]||'#64748b'}88)`, borderRadius:999, transition:'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════
              LOW STOCK ALERT
          ═══════════════════════ */}
          {data.lowStock.length > 0 && (
            <div className="glass-card" style={{ border:'1px solid rgba(248,113,113,0.2)', padding:0, overflow:'hidden', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom:'1px solid rgba(248,113,113,0.1)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(248,113,113,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f87171' }}>
                    <DashIcons.alert />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>ສິນຄ້າ Stock ໃກ້ໝົດ ({data.lowStock.length} ລາຍການ)</h3>
                    <p style={{ color:'rgba(248,113,113,0.6)', fontSize:'0.68rem', margin:'2px 0 0' }}>ຕ້ອງສັ່ງຊື້ເພີ່ມ ເພື່ອຮັກສາການຂາຍ</p>
                  </div>
                </div>
                <button className="dash-view-all-btn" onClick={() => onTabChange?.('inventory')}
                  style={{ padding:'6px 14px', borderRadius:9, background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.25)', color:'#f87171', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                  ຈັດການ Stock <DashIcons.arrowRight />
                </button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'14px 20px' }}>
                {data.lowStock.slice(0,12).map(p => (
                  <div key={p.id} style={{ padding:'5px 12px', borderRadius:8, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.15)', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.78rem' }}>{p.name}</span>
                    <span style={{ fontWeight:900, color:'#f87171', fontSize:'0.78rem' }}>{p.stock} ຍັງເຫຼືອ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════
              QUICK ACTIONS
          ═══════════════════════ */}
          
        </>
      )}
    </div>
  );
}
