import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../utils/db';

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameWeek = (date, now) => {
  const d = new Date(date);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
};

const PALETTE = {
  gold:    ['#D4AF37', '#F5D76E', '#AA882C'],
  emerald: ['#00B894', '#55EFC4', '#006B5F'],
  blue:    ['#0984E3', '#74B9FF', '#034D8C'],
  rose:    ['#E17055', '#FAB1A0', '#A0522D'],
  purple:  ['#6C5CE7', '#A29BFE', '#3D3491'],
  teal:    ['#00CEC9', '#81ECEC', '#007A78'],
};

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = n => (n || 0).toLocaleString('en', { maximumFractionDigits: 0 }) + ' ₭';
const fmtShort = n => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return String(n || 0);
};

// ── computeDashboard ─────────────────────────────────────────────────────────
function computeDashboard() {
  const now = new Date();
  const orders   = db.getOrders();
  const expenses = typeof db.getExpenses === 'function' ? db.getExpenses() : [];
  const returns  = typeof db.getReturns  === 'function' ? db.getReturns()  : [];
  const debts    = db.getDebts();
  const products = db.getProducts();
  const jobs     = db.getFramingJobs();
  const onlineOrders = typeof db.getOnlineOrders === 'function' ? db.getOnlineOrders() : [];
  const pos      = typeof db.getPurchaseOrders === 'function' ? db.getPurchaseOrders() : [];

  const todayOrders  = orders.filter(o => { const d = new Date(o.date); return !isNaN(d) && isSameDay(d, now); });
  const todaySales   = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const todayRefunds = returns.filter(r => { const d = new Date(r.date); return !isNaN(d) && isSameDay(d, now); }).reduce((s, r) => s + (r.refundAmount || 0), 0);
  const weekOrders   = orders.filter(o => { const d = new Date(o.date); return !isNaN(d) && isSameWeek(d, now); });
  const weekSales    = weekOrders.reduce((s, o) => s + (o.total || 0), 0);
  const unpaid       = debts.filter(d => d.status === 'unpaid');
  const outstandingDebt = unpaid.reduce((s, d) => s + (d.total || 0), 0);
  const lowStock     = products.filter(p => !db.isServiceCategory(p.category) && (p.stock || 0) <= (p.minStock || 0)).sort((a,b) => (a.stock||0)-(b.stock||0));
  const pendingOnline = onlineOrders.filter(o => o.status === 'pending').length;
  const pendingPO    = pos.filter(p => p.status === 'pending').length;
  const memberCount  = db.getCustomers().length;
  const jobStats     = { pending: jobs.filter(j=>j.status==='pending').length, framing: jobs.filter(j=>j.status==='framing').length, done: jobs.filter(j=>j.status==='done').length };

  // Last 14 days sales series
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOrders = orders.filter(o => { const od = new Date(o.date); return !isNaN(od) && isSameDay(od, d); });
    const dayExpenses = expenses.filter(e => { const ed = new Date(e.date || e.createdAt); return !isNaN(ed) && isSameDay(ed, d); });
    last14.push({
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      sales: dayOrders.reduce((s,o) => s+(o.total||0), 0),
      expense: dayExpenses.reduce((s,e) => s+(e.amount||0), 0),
    });
  }

  // Category breakdown for this week
  const catMap = {};
  weekOrders.forEach(o => {
    (o.items||[]).forEach(it => {
      const cat = it.category || 'อื่นๆ';
      catMap[cat] = (catMap[cat] || 0) + (it.price * it.qty || 0);
    });
  });
  const catData = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 6);

  // Hourly heatmap today
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    sales: todayOrders.filter(o => new Date(o.date).getHours() === h).reduce((s,o)=>s+(o.total||0),0),
  }));

  return { todaySales, todayBills: todayOrders.length, todayRefunds, weekSales, weekBills: weekOrders.length, outstandingDebt, debtorCount: unpaid.length, lowStock, pendingOnline, pendingPO, memberCount, jobStats, last14, catData, hourly };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#D4AF37', height = 44, fill = true }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = height;
  const pts = data.map((v, i) => [i / (data.length - 1) * w, h - (v / max) * (h - 4) - 2]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, overflow: 'visible' }}>
      {fill && <path d={area} fill={color} fillOpacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color1 = '#D4AF37', color2 = '#0984E3', showExpense = true, height = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || !data.length) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.sales, d.expense || 0)), 1);
  const w = 700, h = height, padL = 38, padR = 8, padT = 10, padB = 28;
  const cw = w - padL - padR, ch = h - padT - padB;
  const barGroupW = cw / data.length;
  const barW = showExpense ? Math.min(barGroupW * 0.36, 18) : Math.min(barGroupW * 0.55, 28);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(v => ({ y: padT + ch - v * ch, label: fmtShort(v * maxVal) }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color1} stopOpacity="1" />
          <stop offset="100%" stopColor={color1} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color2} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color2} stopOpacity="0.3" />
        </linearGradient>
        <filter id="barShadow"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color1} floodOpacity="0.3" /></filter>
      </defs>
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={w - padR} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
          <text x={padL - 4} y={t.y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="9">{t.label}</text>
        </g>
      ))}
      {/* Baseline */}
      <line x1={padL} y1={padT + ch} x2={w - padR} y2={padT + ch} stroke="rgba(255,255,255,0.15)" />
      {/* Bars */}
      {data.map((d, i) => {
        const cx = padL + barGroupW * i + barGroupW / 2;
        const sh = (d.sales / maxVal) * ch;
        const eh = (d.expense / maxVal) * ch;
        const isHov = hovered === i;
        const x1 = showExpense ? cx - barW - 2 : cx - barW / 2;
        const x2 = showExpense ? cx + 2 : cx - barW / 2;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            {/* Sales bar */}
            <rect x={x1} y={padT + ch - sh} width={barW} height={sh} rx="3" fill="url(#barGrad1)" filter={isHov ? 'url(#barShadow)' : ''} opacity={isHov ? 1 : 0.85} />
            {/* Top cap */}
            <rect x={x1} y={padT + ch - sh} width={barW} height="4" rx="2" fill={color1} />
            {/* Expense bar */}
            {showExpense && (
              <>
                <rect x={x2} y={padT + ch - eh} width={barW} height={eh} rx="3" fill="url(#barGrad2)" opacity={isHov ? 0.9 : 0.65} />
                <rect x={x2} y={padT + ch - eh} width={barW} height="4" rx="2" fill={color2} opacity="0.8" />
              </>
            )}
            {/* X label */}
            {(data.length <= 14 || i % 2 === 0) && (
              <text x={cx} y={padT + ch + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7.5">{d.label}</text>
            )}
            {/* Tooltip */}
            {isHov && (
              <g>
                <rect x={cx - 40} y={padT + ch - sh - 42} width="80" height={showExpense ? 40 : 22} rx="6" fill="#1a1710" stroke={color1} strokeWidth="1" />
                <text x={cx} y={padT + ch - sh - 28} textAnchor="middle" fill={color1} fontSize="9" fontWeight="bold">{fmtShort(d.sales)} ₭</text>
                {showExpense && <text x={cx} y={padT + ch - sh - 14} textAnchor="middle" fill={color2} fontSize="9">{fmtShort(d.expense)} ₭</text>}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Line / Area Chart ─────────────────────────────────────────────────────────
function LineAreaChart({ data, chartType = 'area', color1 = '#D4AF37', color2 = '#0984E3', height = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length < 2) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.sales, d.expense || 0)), 1);
  const w = 700, h = height, padL = 38, padR = 8, padT = 10, padB = 28;
  const cw = w - padL - padR, ch = h - padT - padB;
  const pts1 = data.map((d, i) => ({ x: padL + (i / (data.length - 1)) * cw, y: padT + ch - (d.sales / maxVal) * ch }));
  const pts2 = data.map((d, i) => ({ x: padL + (i / (data.length - 1)) * cw, y: padT + ch - (d.expense / maxVal) * ch }));
  const mkLine = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const mkArea = (pts, ch, padT) => `${mkLine(pts)} L${pts[pts.length-1].x},${padT+ch} L${pts[0].x},${padT+ch} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(v => ({ y: padT + ch - v * ch, label: fmtShort(v * maxVal) }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, overflow: 'visible' }}>
      <defs>
        <linearGradient id="aGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color1} stopOpacity="0.4" /><stop offset="100%" stopColor={color1} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="aGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color2} stopOpacity="0.3" /><stop offset="100%" stopColor={color2} stopOpacity="0" />
        </linearGradient>
        <filter id="glowLine"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={w - padR} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
          <text x={padL - 4} y={t.y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="9">{t.label}</text>
        </g>
      ))}
      <line x1={padL} y1={padT + ch} x2={w - padR} y2={padT + ch} stroke="rgba(255,255,255,0.15)" />
      {chartType !== 'line' && <path d={mkArea(pts2, ch, padT)} fill="url(#aGrad2)" />}
      {chartType !== 'line' && <path d={mkArea(pts1, ch, padT)} fill="url(#aGrad1)" />}
      <path d={mkLine(pts2)} fill="none" stroke={color2} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
      <path d={mkLine(pts1)} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" filter="url(#glowLine)" />
      {/* Dots & labels */}
      {data.map((d, i) => {
        const p1 = pts1[i], p2 = pts2[i];
        const isHov = hovered === i;
        const showLabel = data.length <= 14 || i % 2 === 0;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            <rect x={p1.x - 8} y={padT} width="16" height={ch} fill="transparent" />
            {isHov && <line x1={p1.x} y1={padT} x2={p1.x} y2={padT + ch} stroke="rgba(255,255,255,0.1)" strokeDasharray="3,3" />}
            <circle cx={p1.x} cy={p1.y} r={isHov ? 5 : 3} fill={color1} stroke="#1a1710" strokeWidth="1.5" />
            <circle cx={p2.x} cy={p2.y} r={isHov ? 4 : 2.5} fill={color2} stroke="#1a1710" strokeWidth="1.5" />
            {showLabel && <text x={p1.x} y={padT + ch + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7.5">{d.label}</text>}
            {isHov && (
              <g>
                <rect x={p1.x - 44} y={padT} width="88" height="44" rx="6" fill="#1a1710" stroke={color1} strokeWidth="1" />
                <text x={p1.x} y={padT + 16} textAnchor="middle" fill={color1} fontSize="9" fontWeight="bold">💰 {fmtShort(d.sales)} ₭</text>
                <text x={p1.x} y={padT + 30} textAnchor="middle" fill={color2} fontSize="9">📤 {fmtShort(d.expense)} ₭</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data, size = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || !data.length) return <div style={{ color: '#666', fontSize: '0.8rem', padding: '40px', textAlign: 'center' }}>ຍັງບໍ່ມີຂໍ້ມູນ</div>;
  const colors = [PALETTE.gold[0], PALETTE.blue[0], PALETTE.emerald[0], PALETTE.rose[0], PALETTE.purple[0], PALETTE.teal[0]];
  const total = data.reduce((s, d) => s + d[1], 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.36, ri = size * 0.22;
  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const slice = (d[1] / total) * 2 * Math.PI;
    const a1 = angle, a2 = angle + slice;
    angle = a2;
    return { label: d[0], value: d[1], pct: ((d[1] / total) * 100).toFixed(1), a1, a2, color: colors[i % colors.length] };
  });
  const arc = (a1, a2, R, ri) => {
    const gap = 0.02;
    const x1 = cx + R * Math.cos(a1 + gap), y1 = cy + R * Math.sin(a1 + gap);
    const x2 = cx + R * Math.cos(a2 - gap), y2 = cy + R * Math.sin(a2 - gap);
    const x3 = cx + ri * Math.cos(a2 - gap), y3 = cy + ri * Math.sin(a2 - gap);
    const x4 = cx + ri * Math.cos(a1 + gap), y4 = cy + ri * Math.sin(a1 + gap);
    const lg = a2 - a1 > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${ri},${ri} 0 ${lg},0 ${x4},${y4} Z`;
  };

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}>
        <defs>
          {slices.map((s, i) => (
            <radialGradient key={i} id={`dg${i}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor={s.color} stopOpacity="1" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.6" />
            </radialGradient>
          ))}
        </defs>
        {slices.map((s, i) => {
          const isHov = hovered === i;
          const expandR = isHov ? r + 10 : r;
          const expandRi = isHov ? ri - 4 : ri;
          return (
            <path
              key={i}
              d={arc(s.a1, s.a2, expandR, expandRi)}
              fill={`url(#dg${i})`}
              stroke="#0d0c0a"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.2s ease', filter: isHov ? `drop-shadow(0 0 8px ${s.color})` : 'none' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {hovered !== null ? (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fill={slices[hovered].color} fontSize="11" fontWeight="bold">{slices[hovered].label.slice(0, 10)}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fill="white" fontSize="10">{slices[hovered].pct}%</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">{fmtShort(slices[hovered].value)} ₭</text>
          </>
        ) : (
          <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">ລາຍໝວດ</text>
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 120 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 0', borderRadius: '4px', background: hovered === i ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.15s' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}` }} />
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '0.72rem', color: s.color, fontWeight: 600 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ──────────────────────────────────────────────────────
function HBarChart({ data, height = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || !data.length) return null;
  const maxVal = Math.max(...data.map(d => d[1]), 1);
  const colors = [PALETTE.gold[0], PALETTE.blue[0], PALETTE.emerald[0], PALETTE.rose[0], PALETTE.purple[0], PALETTE.teal[0]];
  const rowH = Math.min(height / data.length - 6, 32);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
      {data.map((d, i) => {
        const pct = (d[1] / maxVal) * 100;
        const isHov = hovered === i;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', width: '90px', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[0]}</div>
            <div style={{ flex: 1, height: `${rowH}px`, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[i % colors.length]}99)`, borderRadius: '6px', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: isHov ? `0 0 12px ${colors[i % colors.length]}` : 'none' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: colors[i % colors.length], width: '55px', textAlign: 'left', fontWeight: 600 }}>{fmtShort(d[1])} ₭</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Hourly Heatmap (BarChart small) ───────────────────────────────────────────
function HourlyChart({ data, height = 100 }) {
  const [hov, setHov] = useState(null);
  if (!data) return null;
  const maxVal = Math.max(...data.map(d => d.sales), 1);
  const w = 700, h = height, padL = 10, padR = 10, padT = 10, padB = 20;
  const cw = w - padL - padR, ch = h - padT - padB;
  const bw = cw / 24 - 2;
  const colors = ['#1a237e','#283593','#3949ab','#3f51b5','#5c6bc0','#7986cb','#9fa8da','#c5cae9','#e8eaf6','#ffe082','#ffd740','#ffca28','#ffc107','#ffb300','#ffa000','#ff8f00','#ff6f00','#e65100','#e53935','#c62828','#b71c1c','#e53935','#ef5350','#e91e63'];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, overflow: 'visible' }}>
      {data.map((d, i) => {
        const bh = Math.max(2, (d.sales / maxVal) * ch);
        const x = padL + i * (cw / 24) + 1;
        const y = padT + ch - bh;
        const color = colors[Math.floor(d.sales / maxVal * (colors.length - 1))];
        const isHov = hov === i;
        return (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
            <rect x={x} y={y} width={bw} height={bh} rx="3" fill={color} opacity={isHov ? 1 : 0.7} />
            <text x={x + bw / 2} y={padT + ch + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8.5">{d.hour}h</text>
            {isHov && d.sales > 0 && (
              <g>
                <rect x={Math.min(x - 20, w - 80)} y={y - 26} width="60" height="20" rx="4" fill="#1a1710" stroke={color} strokeWidth="1" />
                <text x={Math.min(x + 10, w - 50)} y={y - 12} textAnchor="middle" fill="white" fontSize="9">{fmtShort(d.sales)} ₭</text>
              </g>
            )}
          </g>
        );
      })}
      <line x1={padL} y1={padT + ch} x2={w - padR} y2={padT + ch} stroke="rgba(255,255,255,0.1)" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, sparkData, onClick, trend }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? (color || 'rgba(255,255,255,0.25)') : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '16px', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '6px',
        textAlign: 'left', cursor: onClick ? 'pointer' : 'default', color: 'inherit',
        transition: 'all 0.2s ease', transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${color || 'transparent'}20` : '0 2px 8px rgba(0,0,0,0.15)',
        overflow: 'hidden', position: 'relative', minWidth: 0,
      }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: color, borderRadius: '50%', opacity: 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{icon}</span> <span>{label}</span>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: color || 'white', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>{sub}</div>}
        </div>
        {trend !== undefined && (
          <div style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '20px', background: trend >= 0 ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)', color: trend >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 700, flexShrink: 0 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div style={{ marginTop: '4px', opacity: 0.8 }}>
          <Sparkline data={sparkData} color={color || '#D4AF37'} height={38} />
        </div>
      )}
    </button>
  );
}

// ── Chart Type Selector ───────────────────────────────────────────────────────
function ChartTypeBtn({ current, value, label, onChange }) {
  return (
    <button type="button" onClick={() => onChange(value)}
      style={{
        padding: '5px 12px', borderRadius: '8px', border: '1px solid',
        borderColor: current === value ? '#D4AF37' : 'rgba(255,255,255,0.1)',
        background: current === value ? 'rgba(212,175,55,0.15)' : 'transparent',
        color: current === value ? '#D4AF37' : 'rgba(255,255,255,0.5)',
        fontSize: '0.73rem', cursor: 'pointer', fontWeight: current === value ? 700 : 400,
        transition: 'all 0.15s',
      }}>
      {label}
    </button>
  );
}

// ── Section Card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, children, actions }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>{title}</h3>
        {actions && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ activeUser, onTabChange, isMobile }) {
  const canSeeFinance = !!activeUser && (activeUser.role === 'owner' || activeUser.permissions?.admin || activeUser.permissions?.reports);
  const [data, setData] = useState(computeDashboard);
  const [mainChartType, setMainChartType] = useState(() => localStorage.getItem('dash_main_chart') || 'bar');
  const [catChartType, setCatChartType] = useState(() => localStorage.getItem('dash_cat_chart') || 'donut');

  useEffect(() => {
    const h = () => setData(computeDashboard());
    window.addEventListener('db-updated', h);
    return () => window.removeEventListener('db-updated', h);
  }, []);

  const saveMainChart = v => { setMainChartType(v); localStorage.setItem('dash_main_chart', v); };
  const saveCatChart  = v => { setCatChartType(v);  localStorage.setItem('dash_cat_chart', v); };

  const go = tab => { if (onTabChange) onTabChange(tab); };

  // Sparkline data (last 7 days sales for today card)
  const sparkSales = data.last14.slice(7).map(d => d.sales);
  const sparkExp   = data.last14.slice(7).map(d => d.expense);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {canSeeFinance && (
          <StatCard icon="💵" label="ຍອດຂາຍມື້ນີ້" value={fmt(data.todaySales)} sub={`${data.todayBills} ໃບບິນ`} color="#2ecc71" sparkData={sparkSales} onClick={() => go('reports')} />
        )}
        {canSeeFinance && (
          <StatCard icon="📅" label="ຍອດຂາຍອາທິດນີ້" value={fmt(data.weekSales)} sub={`${data.weekBills} ໃບບິນ`} color="#D4AF37" sparkData={sparkSales} onClick={() => go('reports')} />
        )}
        {canSeeFinance && (
          <StatCard icon="↩️" label="ຄືນເງິນມື້ນີ້" value={fmt(data.todayRefunds)} color={data.todayRefunds > 0 ? '#e74c3c' : 'rgba(255,255,255,0.7)'} onClick={() => go('reports')} />
        )}
        {canSeeFinance && (
          <StatCard icon="🧾" label="ໜີ້ຄ້າງຮັບ" value={fmt(data.outstandingDebt)} sub={`${data.debtorCount} ລາຍການ`} color={data.outstandingDebt > 0 ? '#f39c12' : 'rgba(255,255,255,0.7)'} onClick={() => go('debts')} />
        )}
        <StatCard icon="⚠️" label="ສິນຄ້າໃກ້ໝົດ" value={data.lowStock.length} sub="ຄລິກເພື່ອຈັດການ" color={data.lowStock.length > 0 ? '#e74c3c' : '#2ecc71'} onClick={() => go('inventory')} />
        <StatCard icon="🌐" label="ອໍເດີ້ອອນລາຍ" value={data.pendingOnline} color={data.pendingOnline > 0 ? '#3498db' : 'rgba(255,255,255,0.7)'} onClick={() => go('online_orders')} />
        <StatCard icon="🖼️" label="ງານກອບ" value={data.jobStats.pending + data.jobStats.framing + data.jobStats.done} sub={`ຮັບ ${data.jobStats.pending} · ເຮັດ ${data.jobStats.framing} · ພ້ອມ ${data.jobStats.done}`} color="#9b59b6" onClick={() => go('framing_board')} />
        <StatCard icon="👥" label="ສະມາຊິກທັງໝົດ" value={data.memberCount} color="#D4AF37" onClick={() => go('customers')} />
      </div>

      {/* ── Main Sales vs Expense Chart ── */}
      {canSeeFinance && (
        <SectionCard
          title={<>📈 ຍອດຂາຍ <span style={{ color: '#D4AF37' }}>vs</span> ຄ່າໃຊ້ຈ່າຍ (14 ວັນ)</>}
          actions={[
            <ChartTypeBtn key="bar"  current={mainChartType} value="bar"  label="📊 Bar"  onChange={saveMainChart} />,
            <ChartTypeBtn key="line" current={mainChartType} value="line" label="📉 Line" onChange={saveMainChart} />,
            <ChartTypeBtn key="area" current={mainChartType} value="area" label="🌊 Area" onChange={saveMainChart} />,
          ]}
        >
          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 4, borderRadius: 2, background: '#D4AF37' }} /><span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>ຍອດຂາຍ</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 4, borderRadius: 2, background: '#0984E3' }} /><span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>ຄ່າໃຊ້ຈ່າຍ</span></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {mainChartType === 'bar'  && <BarChart      data={data.last14} color1="#D4AF37" color2="#0984E3" showExpense height={220} />}
            {mainChartType === 'line' && <LineAreaChart data={data.last14} chartType="line" color1="#D4AF37" color2="#0984E3" height={220} />}
            {mainChartType === 'area' && <LineAreaChart data={data.last14} chartType="area" color1="#D4AF37" color2="#0984E3" height={220} />}
          </div>
        </SectionCard>
      )}

      {/* ── Lower row: Category + Hourly ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {/* Category breakdown */}
        <SectionCard
          title="🍩 ຍອດຂາຍຕາມໝວດ (ອາທິດນີ້)"
          actions={[
            <ChartTypeBtn key="donut" current={catChartType} value="donut" label="🍩 Donut"   onChange={saveCatChart} />,
            <ChartTypeBtn key="hbar"  current={catChartType} value="hbar"  label="📊 H-Bar"   onChange={saveCatChart} />,
          ]}
        >
          {data.catData.length === 0
            ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', padding: '30px 0', textAlign: 'center' }}>ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ</div>
            : catChartType === 'donut'
              ? <DonutChart data={data.catData} size={isMobile ? 160 : 190} />
              : <HBarChart data={data.catData} height={200} />
          }
        </SectionCard>

        {/* Today's hourly heatmap */}
        <SectionCard title="⏰ ຍອດຂາຍລາຍຊົ່ວໂມງ (ມື້ນີ້)">
          {data.todaySales === 0
            ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', padding: '30px 0', textAlign: 'center' }}>ຍັງບໍ່ມີຂໍ້ມູນ</div>
            : <HourlyChart data={data.hourly} height={120} />
          }
          {/* Peak hour info */}
          {data.todaySales > 0 && (() => {
            const peak = data.hourly.reduce((m, d) => d.sales > m.sales ? d : m, data.hourly[0]);
            return peak.sales > 0 ? (
              <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>⚡ ຊ່ວງພີ​ກ: <strong style={{ color: '#ffd740' }}>{peak.hour}:00 – {peak.hour + 1}:00</strong></span>
                <span>💰 {fmtShort(peak.sales)} ₭</span>
              </div>
            ) : null;
          })()}
        </SectionCard>
      </div>

      {/* ── Low Stock Table ── */}
      <SectionCard
        title={<>⚠️ <span style={{ color: '#f39c12' }}>ສິນຄ້າໃກ້ໝົດ / ໝົດສະຕັອກ</span> (Low Stock Alerts)</>}
        actions={<button type="button" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.72rem' }} onClick={() => go('inventory')}>ຈັດການສະຕັອກ →</button>}
      >
        {data.lowStock.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ecc71', fontSize: '0.85rem', padding: '12px 0' }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span> ສິນຄ້າທຸກລາຍການຍັງມີສະຕັອກພຽງພໍ
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>ສິນຄ້າ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>ຄົງເຫຼືອ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>ຂັ້ນຕ່ຳ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>ສະຖານະ</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.slice(0, 12).map((p, idx) => {
                  const isEmpty = (p.stock || 0) <= 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={{ padding: '9px 10px', color: 'white' }}>{p.name}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: isEmpty ? '#e74c3c' : '#f39c12', fontFamily: 'monospace' }}>{p.stock || 0} {p.unit || ''}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{p.minStock || 0}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: isEmpty ? 'rgba(231,76,60,0.15)' : 'rgba(243,156,18,0.15)', color: isEmpty ? '#e74c3c' : '#f39c12', fontWeight: 600, border: `1px solid ${isEmpty ? 'rgba(231,76,60,0.3)' : 'rgba(243,156,18,0.3)'}` }}>
                          {isEmpty ? '❌ ໝົດ' : '⚠️ ໃກ້ໝົດ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.lowStock.length > 12 && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px', paddingLeft: '10px' }}>
                + ອີກ {data.lowStock.length - 12} ລາຍການ — <button type="button" style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }} onClick={() => go('inventory')}>ເບິ່ງທັງໝົດ →</button>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
