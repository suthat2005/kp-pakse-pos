import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

// ── Date helpers ──────────────────────────────────────────────────────────────
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// ── Format helpers ────────────────────────────────────────────────────────────
const fmt = n => (n || 0).toLocaleString('en', { maximumFractionDigits: 0 }) + ' ₭';
const fmtShort = n => {
  n = n || 0;
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = ['#D4AF37','#0984E3','#00B894','#E17055','#6C5CE7','#00CEC9','#F39C12'];

// ── Safe db getter (never throws) ─────────────────────────────────────────────
function safeGet(fn, fallback = []) {
  try { return fn() || fallback; } catch (e) { return fallback; }
}

// ── Compute all dashboard data ────────────────────────────────────────────────
function computeDashboard() {
  const now = new Date();
  const orders       = safeGet(() => db.getOrders());
  const expenses     = safeGet(() => db.getExpenses());
  const returns_     = safeGet(() => db.getReturns());
  const debts        = safeGet(() => db.getDebts());
  const products     = safeGet(() => db.getProducts());
  const jobs         = safeGet(() => db.getFramingJobs());
  const onlineOrders = safeGet(() => db.getOnlineOrders());
  const purchaseOrders = safeGet(() => db.getPurchaseOrders());
  const customers    = safeGet(() => db.getCustomers());

  const todayOrders = orders.filter(o => {
    try { const d = new Date(o.date); return !isNaN(d) && isSameDay(d, now); } catch { return false; }
  });

  // Week start (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekOrders = orders.filter(o => {
    try { const d = new Date(o.date); return !isNaN(d) && d >= weekStart; } catch { return false; }
  });

  const todaySales   = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const todayBills   = todayOrders.length;
  const weekSales    = weekOrders.reduce((s, o) => s + (o.total || 0), 0);
  const weekBills    = weekOrders.length;
  const todayRefunds = returns_.filter(r => {
    try { const d = new Date(r.date); return !isNaN(d) && isSameDay(d, now); } catch { return false; }
  }).reduce((s, r) => s + (r.refundAmount || 0), 0);

  const unpaid = debts.filter(d => d.status === 'unpaid');
  const outstandingDebt = unpaid.reduce((s, d) => s + (d.total || 0), 0);

  const lowStock = products.filter(p => {
    try { return !db.isServiceCategory(p.category) && (p.stock || 0) <= (p.minStock || 0); } catch { return (p.stock || 0) <= (p.minStock || 0); }
  }).sort((a, b) => (a.stock || 0) - (b.stock || 0));

  const pendingOnline  = onlineOrders.filter(o => o.type !== 'inquiry' && !(o.shippingStatus === 'delivered' || o.shippingStatus === 'cancelled' || o.paymentStatus === 'rejected')).length;
  const pendingPO      = purchaseOrders.filter(p => p.status === 'pending').length;
  const memberCount    = customers.length;
  const jobStats       = {
    pending: jobs.filter(j => j.status === 'pending').length,
    framing: jobs.filter(j => j.status === 'framing').length,
    done:    jobs.filter(j => j.status === 'done').length,
  };

  // Last 14-day trend
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dOrders   = orders.filter(o => { try { const od = new Date(o.date); return !isNaN(od) && isSameDay(od, d); } catch { return false; } });
    const dExpenses = expenses.filter(e => { try { const ed = new Date(e.date || e.createdAt); return !isNaN(ed) && isSameDay(ed, d); } catch { return false; } });
    last14.push({
      label:   d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      sales:   dOrders.reduce((s, o) => s + (o.total || 0), 0),
      expense: dExpenses.reduce((s, e) => s + (e.amount || 0), 0),
    });
  }

  // Category pie this week
  const catMap = {};
  weekOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const cat = it.category || 'ອື່ນໆ';
      catMap[cat] = (catMap[cat] || 0) + ((it.price || 0) * (it.qty || 1));
    });
  });
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Hourly today
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    sales: todayOrders.filter(o => { try { return new Date(o.date).getHours() === h; } catch { return false; } }).reduce((s, o) => s + (o.total || 0), 0),
  }));

  return { todaySales, todayBills, weekSales, weekBills, todayRefunds, outstandingDebt, debtorCount: unpaid.length, lowStock, pendingOnline, pendingPO, memberCount, jobStats, last14, catData, hourly };
}

// ══════════════════════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Mini Sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#D4AF37', h = 40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const pts = data.map((v, i) => `${(i / (data.length - 1) * w).toFixed(1)},${(h - (v / max) * (h - 6) - 3).toFixed(1)}`).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data = [], c1 = '#D4AF37', c2 = '#0984E3' }) {
  const [hov, setHov] = useState(null);
  if (!data.length) return <EmptyChart />;
  const maxV = Math.max(...data.map(d => Math.max(d.sales, d.expense || 0)), 1);
  const W = 700, H = 220, PL = 42, PR = 8, PT = 12, PB = 32;
  const cw = W - PL - PR, ch = H - PT - PB;
  const bGroupW = cw / data.length;
  const bw = Math.min(bGroupW * 0.38, 20);
  const yLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
      <defs>
        <linearGradient id="bcg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c1} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="bcg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {yLines.map((v, i) => {
        const y = PT + ch - v * ch;
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'} strokeDasharray={i === 0 ? '' : '3,4'} />
            <text x={PL - 5} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">{fmtShort(v * maxV)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = PL + bGroupW * i + bGroupW / 2;
        const sh = Math.max(2, (d.sales / maxV) * ch);
        const eh = Math.max(2, ((d.expense || 0) / maxV) * ch);
        const isH = hov === i;
        const x1 = cx - bw - 2, x2 = cx + 2;
        return (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
            {isH && <rect x={PL + bGroupW * i} y={PT} width={bGroupW} height={ch} fill="rgba(255,255,255,0.03)" rx="4" />}
            <rect x={x1} y={PT + ch - sh} width={bw} height={sh} rx="3" fill="url(#bcg1)" opacity={isH ? 1 : 0.82} />
            <rect x={x1} y={PT + ch - sh} width={bw} height={4} rx="2" fill={c1} />
            <rect x={x2} y={PT + ch - eh} width={bw} height={eh} rx="3" fill="url(#bcg2)" opacity={isH ? 0.95 : 0.6} />
            <rect x={x2} y={PT + ch - eh} width={bw} height={4} rx="2" fill={c2} opacity="0.8" />
            {(data.length <= 14 || i % 2 === 0) && (
              <text x={cx} y={PT + ch + 16} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{d.label}</text>
            )}
            {isH && (
              <g>
                <rect x={Math.min(cx - 42, W - 92)} y={PT + 2} width={84} height={42} rx="7" fill="rgba(14,12,8,0.95)" stroke={c1} strokeWidth="1" />
                <text x={Math.min(cx, W - 50)} y={PT + 18} textAnchor="middle" fill={c1} fontSize="10" fontWeight="700">💰 {fmtShort(d.sales)} ₭</text>
                <text x={Math.min(cx, W - 50)} y={PT + 34} textAnchor="middle" fill={c2} fontSize="9">📤 {fmtShort(d.expense || 0)} ₭</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Area / Line Chart ─────────────────────────────────────────────────────────
function AreaChart({ data = [], c1 = '#D4AF37', c2 = '#0984E3', mode = 'area' }) {
  const [hov, setHov] = useState(null);
  if (!data.length) return <EmptyChart />;
  const maxV = Math.max(...data.map(d => Math.max(d.sales, d.expense || 0)), 1);
  const W = 700, H = 220, PL = 42, PR = 8, PT = 12, PB = 32;
  const cw = W - PL - PR, ch = H - PT - PB;
  const px = (i) => (PL + (i / Math.max(data.length - 1, 1)) * cw).toFixed(1);
  const py = (v)  => (PT + ch - (v / maxV) * ch).toFixed(1);
  const line1 = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.sales)}`).join(' ');
  const line2 = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.expense || 0)}`).join(' ');
  const area1 = `${line1} L${px(data.length - 1)},${PT + ch} L${px(0)},${PT + ch} Z`;
  const area2 = `${line2} L${px(data.length - 1)},${PT + ch} L${px(0)},${PT + ch} Z`;
  const yLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
      <defs>
        <linearGradient id="acg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} stopOpacity="0.4" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="acg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c2} stopOpacity="0" />
        </linearGradient>
        <filter id="glow1">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {yLines.map((v, i) => {
        const y = PT + ch - v * ch;
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'} strokeDasharray={i === 0 ? '' : '3,4'} />
            <text x={PL - 5} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">{fmtShort(v * maxV)}</text>
          </g>
        );
      })}
      {mode === 'area' && <path d={area2} fill="url(#acg2)" />}
      {mode === 'area' && <path d={area1} fill="url(#acg1)" />}
      <path d={line2} fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.65" />
      <path d={line1} fill="none" stroke={c1} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow1)" />
      {data.map((d, i) => {
        const isH = hov === i;
        const x = px(i), y1 = py(d.sales), y2 = py(d.expense || 0);
        return (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
            <rect x={parseFloat(x) - 10} y={PT} width={20} height={ch} fill="transparent" />
            {isH && <line x1={x} y1={PT} x2={x} y2={PT + ch} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />}
            <circle cx={x} cy={y1} r={isH ? 5 : 3.5} fill={c1} stroke="rgba(14,12,8,0.9)" strokeWidth="1.5" />
            <circle cx={x} cy={y2} r={isH ? 4 : 2.5} fill={c2} stroke="rgba(14,12,8,0.9)" strokeWidth="1.5" />
            {(data.length <= 14 || i % 2 === 0) && (
              <text x={x} y={PT + ch + 16} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{d.label}</text>
            )}
            {isH && (
              <g>
                <rect x={Math.min(parseFloat(x) - 42, W - 90)} y={PT + 2} width={84} height={42} rx="7" fill="rgba(14,12,8,0.95)" stroke={c1} strokeWidth="1" />
                <text x={Math.min(parseFloat(x), W - 46)} y={PT + 18} textAnchor="middle" fill={c1} fontSize="10" fontWeight="700">💰 {fmtShort(d.sales)} ₭</text>
                <text x={Math.min(parseFloat(x), W - 46)} y={PT + 34} textAnchor="middle" fill={c2} fontSize="9">📤 {fmtShort(d.expense || 0)} ₭</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data = [], size = 180 }) {
  const [hov, setHov] = useState(null);
  if (!data.length) return <EmptyChart msg="ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ" />;
  const total = data.reduce((s, d) => s + d[1], 0) || 1;
  const cx = size / 2, cy = size / 2;
  const R = size * 0.37, ri = size * 0.23;
  let ang = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const arc = (d[1] / total) * 2 * Math.PI;
    const s = { label: d[0], value: d[1], pct: ((d[1] / total) * 100).toFixed(1), a1: ang, a2: ang + arc, color: COLORS[i % COLORS.length] };
    ang += arc;
    return s;
  });
  const pathD = (s, expand = 0) => {
    const r = R + expand, rir = ri - expand / 2;
    const x1 = cx + r * Math.cos(s.a1 + 0.02), y1 = cy + r * Math.sin(s.a1 + 0.02);
    const x2 = cx + r * Math.cos(s.a2 - 0.02), y2 = cy + r * Math.sin(s.a2 - 0.02);
    const x3 = cx + rir * Math.cos(s.a2 - 0.02), y3 = cy + rir * Math.sin(s.a2 - 0.02);
    const x4 = cx + rir * Math.cos(s.a1 + 0.02), y4 = cy + rir * Math.sin(s.a1 + 0.02);
    const lg = s.a2 - s.a1 > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${rir},${rir} 0 ${lg},0 ${x4},${y4} Z`;
  };

  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.45))' }}>
        {slices.map((s, i) => (
          <path key={i} d={pathD(s, hov === i ? 9 : 0)}
            fill={s.color} stroke="#0d0b08" strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'all 0.18s ease', filter: hov === i ? `drop-shadow(0 0 8px ${s.color}80)` : 'none' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
          />
        ))}
        {hov !== null ? (
          <>
            <text x={cx} y={cy - 7} textAnchor="middle" fill={slices[hov].color} fontSize="10" fontWeight="700">{slices[hov].label.slice(0, 10)}</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fill="white" fontSize="11" fontWeight="800">{slices[hov].pct}%</text>
            <text x={cx} y={cy + 23} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">{fmtShort(slices[hov].value)} ₭</text>
          </>
        ) : (
          <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">ລາຍໝວດ</text>
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1, minWidth: 120 }}>
        {slices.map((s, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', background: hov === i ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.15s' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0, boxShadow: `0 0 5px ${s.color}` }} />
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={{ fontSize: '0.72rem', color: s.color, fontWeight: 700 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ──────────────────────────────────────────────────────
function HBarChart({ data = [] }) {
  const [hov, setHov] = useState(null);
  if (!data.length) return <EmptyChart msg="ຍັງບໍ່ມີຂໍ້ມູນ" />;
  const maxV = Math.max(...data.map(d => d[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
      {data.map((d, i) => {
        const pct = (d[1] / maxV) * 100;
        const c = COLORS[i % COLORS.length];
        return (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', width: 90, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[0]}</span>
            <div style={{ flex: 1, height: 26, background: 'rgba(255,255,255,0.04)', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${c},${c}88)`, borderRadius: 7, transition: 'width 0.7s cubic-bezier(.34,1.56,.64,1)', boxShadow: hov === i ? `0 0 14px ${c}60` : 'none' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: c, fontWeight: 700, width: 54, flexShrink: 0 }}>{fmtShort(d[1])} ₭</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Hourly Bar ────────────────────────────────────────────────────────────────
function HourlyBar({ data = [] }) {
  const [hov, setHov] = useState(null);
  if (!data.length) return null;
  const maxV = Math.max(...data.map(d => d.sales), 1);
  const W = 700, H = 120, PL = 6, PR = 6, PT = 8, PB = 22;
  const cw = W - PL - PR, ch = H - PT - PB;
  const bw = Math.max(cw / 24 - 3, 4);
  const gradColors = ['#1565C0','#1976D2','#2196F3','#42A5F5','#64B5F6','#90CAF9','#BBDEFB','#E3F2FD','#FFF9C4','#FFF59D','#FFF176','#FFEE58','#FFCA28','#FFA000','#FF8F00','#FF6F00','#F57C00','#E64A19','#D32F2F','#C62828','#B71C1C','#C62828','#D32F2F','#E53935'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
      {data.map((d, i) => {
        const bh = Math.max(2, (d.sales / maxV) * ch);
        const x = PL + i * (cw / 24) + 1;
        const y = PT + ch - bh;
        const c = gradColors[i];
        const isH = hov === i;
        return (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
            <rect x={x} y={y} width={bw} height={bh} rx="3" fill={c} opacity={isH ? 1 : 0.72} />
            <text x={x + bw / 2} y={PT + ch + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{d.hour}h</text>
            {isH && d.sales > 0 && (
              <g>
                <rect x={Math.max(0, Math.min(x - 22, W - 60))} y={y - 24} width={58} height={19} rx="5" fill="rgba(14,12,8,0.95)" stroke={c} strokeWidth="1" />
                <text x={Math.max(29, Math.min(x + 7, W - 22))} y={y - 10} textAnchor="middle" fill="white" fontSize="9">{fmtShort(d.sales)} ₭</text>
              </g>
            )}
          </g>
        );
      })}
      <line x1={PL} y1={PT + ch} x2={W - PR} y2={PT + ch} stroke="rgba(255,255,255,0.12)" />
    </svg>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyChart({ msg = 'ຍັງບໍ່ມີຂໍ້ມູນ' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '1.8rem', opacity: 0.3 }}>📊</span>
      {msg}
    </div>
  );
}

// ── Chart Type Button ─────────────────────────────────────────────────────────
function CBtn({ cur, val, label, set }) {
  const on = cur === val;
  return (
    <button type="button" onClick={() => set(val)} style={{ padding: '4px 11px', borderRadius: 7, border: `1px solid ${on ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: on ? 'rgba(212,175,55,0.15)' : 'transparent', color: on ? '#D4AF37' : 'rgba(255,255,255,0.45)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: on ? 700 : 400, transition: 'all 0.15s' }}>
      {label}
    </button>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'white', spark, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${hov ? (color + '55') : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', color: 'inherit', transition: 'all 0.18s ease', transform: hov ? 'translateY(-2px)' : 'none', boxShadow: hov ? `0 8px 20px rgba(0,0,0,0.28), 0 0 0 1px ${color}22` : '0 2px 8px rgba(0,0,0,0.12)', overflow: 'hidden', position: 'relative', minWidth: 0 }}>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, background: color, borderRadius: '50%', opacity: 0.07, filter: 'blur(18px)', pointerEvents: 'none' }} />
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.42)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)' }}>{sub}</div>}
      {spark && spark.length > 1 && <div style={{ marginTop: 2, opacity: 0.75 }}><Sparkline data={spark} color={color} h={36} /></div>}
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, actions, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 18px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>{title}</h3>
        {actions && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ activeUser, onTabChange, isMobile }) {
  const canFinance = !!activeUser && (activeUser.role === 'owner' || activeUser.permissions?.admin || activeUser.permissions?.reports);
  const [data,    setData]    = useState(() => { try { return computeDashboard(); } catch { return null; } });
  const [mainCt,  setMainCt]  = useState(() => localStorage.getItem('dash_mc') || 'bar');
  const [catCt,   setCatCt]   = useState(() => localStorage.getItem('dash_cc') || 'donut');

  useEffect(() => {
    const h = () => { try { setData(computeDashboard()); } catch (e) { console.error('Dashboard compute error:', e); } };
    window.addEventListener('db-updated', h);
    return () => window.removeEventListener('db-updated', h);
  }, []);

  const saveMc = v => { setMainCt(v); localStorage.setItem('dash_mc', v); };
  const saveCc = v => { setCatCt(v);  localStorage.setItem('dash_cc', v); };
  const go     = tab => { if (onTabChange) onTabChange(tab); };

  if (!data) {
    return <div style={{ padding: 40, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>ກຳລັງໂຫຼດ Dashboard...</div>;
  }

  const sparkSales = data.last14.slice(7).map(d => d.sales);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit,minmax(175px,1fr))', gap: 11 }}>
        {canFinance && <StatCard icon="💵" label="ຍອດຂາຍມື້ນີ້"     value={fmt(data.todaySales)}     sub={`${data.todayBills} ໃບບິນ`}                        color="#2ecc71" spark={sparkSales} onClick={() => go('reports')} />}
        {canFinance && <StatCard icon="📅" label="ຍອດຂາຍອາທິດນີ້"   value={fmt(data.weekSales)}     sub={`${data.weekBills} ໃບບິນ`}                         color="#D4AF37" spark={sparkSales} onClick={() => go('reports')} />}
        {canFinance && <StatCard icon="↩️" label="ຄືນເງິນມື້ນີ້"   value={fmt(data.todayRefunds)}  color={data.todayRefunds > 0 ? '#e74c3c' : 'white'}      onClick={() => go('reports')} />}
        {canFinance && <StatCard icon="🧾" label="ໜີ້ຄ້າງຮັບ"       value={fmt(data.outstandingDebt)} sub={`${data.debtorCount} ລາຍການ`}                    color={data.outstandingDebt > 0 ? '#f39c12' : 'white'} onClick={() => go('debts')} />}
        <StatCard icon="⚠️" label="ສິນຄ້າໃກ້ໝົດ"   value={data.lowStock.length}   sub="ຄລິກຈັດການ"                                           color={data.lowStock.length > 0 ? '#e74c3c' : '#2ecc71'} onClick={() => go('inventory')} />
        <StatCard icon="🌐" label="ອໍເດີ້ອອນລາຍ"   value={data.pendingOnline}     color={data.pendingOnline > 0 ? '#3498db' : 'white'}       onClick={() => go('online_orders')} />
        <StatCard icon="🖼️" label="ງານກອບ"          value={data.jobStats.pending + data.jobStats.framing + data.jobStats.done} sub={`ຮັບ ${data.jobStats.pending}·ເຮັດ ${data.jobStats.framing}·ພ້ອມ ${data.jobStats.done}`} color="#9b59b6" onClick={() => go('framing_board')} />
        <StatCard icon="👥" label="ສະມາຊິກ"          value={data.memberCount}                                                                   color="#D4AF37" onClick={() => go('customers')} />
      </div>

      {/* ── Main trend chart ── */}
      {canFinance && (
        <Section
          title={<span>📈 ຍອດຂາຍ <span style={{ color: '#D4AF37' }}>vs</span> ຄ່າໃຊ້ຈ່າຍ <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>— 14 ວັນ</span></span>}
          actions={[
            <CBtn key="bar"  cur={mainCt} val="bar"  label="📊 Bar"  set={saveMc} />,
            <CBtn key="area" cur={mainCt} val="area" label="🌊 Area" set={saveMc} />,
            <CBtn key="line" cur={mainCt} val="line" label="📉 Line" set={saveMc} />,
          ]}
        >
          <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 4, borderRadius: 2, background: '#D4AF37' }} /><span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>ຍອດຂາຍ</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 4, borderRadius: 2, background: '#0984E3' }} /><span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>ຄ່າໃຊ້ຈ່າຍ</span></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {mainCt === 'bar'  && <BarChart  data={data.last14} c1="#D4AF37" c2="#0984E3" />}
            {mainCt === 'area' && <AreaChart data={data.last14} c1="#D4AF37" c2="#0984E3" mode="area" />}
            {mainCt === 'line' && <AreaChart data={data.last14} c1="#D4AF37" c2="#0984E3" mode="line" />}
          </div>
        </Section>
      )}

      {/* ── Category + Hourly ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Section
          title="🍩 ຍອດຂາຍຕາມໝວດ (ອາທິດນີ້)"
          actions={[
            <CBtn key="d" cur={catCt} val="donut" label="🍩 Donut" set={saveCc} />,
            <CBtn key="h" cur={catCt} val="hbar"  label="📊 H-Bar" set={saveCc} />,
          ]}
        >
          {catCt === 'donut' ? <DonutChart data={data.catData} size={isMobile ? 155 : 180} /> : <HBarChart data={data.catData} />}
        </Section>

        <Section title="⏰ ຍອດຂາຍລາຍຊົ່ວໂມງ (ມື້ນີ້)">
          {data.todaySales === 0
            ? <EmptyChart msg="ຍັງບໍ່ມີຍອດຂາຍໃນມື້ນີ້" />
            : <HourlyBar data={data.hourly} />
          }
          {data.todaySales > 0 && (() => {
            const peak = data.hourly.reduce((m, d) => d.sales > m.sales ? d : m, data.hourly[0]);
            return peak.sales > 0 ? (
              <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>⚡ ຊ່ວງພີ​ກ: <strong style={{ color: '#FFCA28' }}>{peak.hour}:00–{peak.hour + 1}:00</strong></span>
                <span>💰 {fmtShort(peak.sales)} ₭</span>
              </div>
            ) : null;
          })()}
        </Section>
      </div>

      {/* ── Low Stock ── */}
      <Section
        title={<span>⚠️ <span style={{ color: '#f39c12' }}>ສິນຄ້າໃກ້ໝົດ / ໝົດສະຕັອກ</span></span>}
        actions={<button type="button" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.72rem' }} onClick={() => go('inventory')}>ຈັດການສະຕັອກ →</button>}
      >
        {data.lowStock.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2ecc71', fontSize: '0.82rem', padding: '10px 0' }}>
            <span>✅</span> ສິນຄ້າທຸກລາຍການຍັງມີສະຕັອກພຽງພໍ
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['ສິນຄ້າ', 'ຄົງເຫຼືອ', 'ຂັ້ນຕ່ຳ', 'ສະຖານະ'].map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px', textAlign: i === 0 ? 'left' : 'right', color: 'rgba(255,255,255,0.35)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.lowStock.slice(0, 15).map((p, idx) => {
                  const empty = (p.stock || 0) <= 0;
                  return (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', color: 'white' }}>{p.name}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: empty ? '#e74c3c' : '#f39c12', fontFamily: 'monospace' }}>{p.stock || 0} {p.unit || ''}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.32)', fontFamily: 'monospace' }}>{p.minStock || 0}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.67rem', padding: '2px 8px', borderRadius: 12, background: empty ? 'rgba(231,76,60,0.14)' : 'rgba(243,156,18,0.14)', color: empty ? '#e74c3c' : '#f39c12', fontWeight: 600, border: `1px solid ${empty ? 'rgba(231,76,60,0.3)' : 'rgba(243,156,18,0.3)'}` }}>
                          {empty ? '❌ ໝົດ' : '⚠️ ໃກ້ໝົດ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.lowStock.length > 15 && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 8, paddingLeft: 10 }}>
                + ອີກ {data.lowStock.length - 15} ລາຍການ —{' '}
                <button type="button" style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }} onClick={() => go('inventory')}>ເບິ່ງທັງໝົດ →</button>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
