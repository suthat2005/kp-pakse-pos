import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const cardBase = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  padding: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

function StatCard({ tab, icon, label, value, sub, color, isMobile, onGo }) {
  return (
    <button
      type="button"
      onClick={() => tab && onGo(tab)}
      style={{
        ...cardBase,
        textAlign: 'left',
        cursor: tab ? 'pointer' : 'default',
        color: 'inherit'
      }}
      className={tab ? 'table-row-hover' : ''}
    >
      <div style={{ fontSize: '0.78rem', color: '#999' }}>
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: isMobile ? '1.3rem' : '1.6rem',
          fontWeight: 'bold',
          color: color || 'white'
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#777' }}>{sub}</div>}
    </button>
  );
}

function computeDashboard() {
  const now = new Date();

  const orders = db.getOrders();
  const todayOrders = orders.filter(o => {
    const d = new Date(o.date);
    return !isNaN(d.getTime()) && isSameDay(d, now);
  });
  const todaySales = todayOrders.reduce((s, o) => s + (o.total || 0), 0);

  const returns = typeof db.getReturns === 'function' ? db.getReturns() : [];
  const todayRefunds = returns
    .filter(r => {
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && isSameDay(d, now);
    })
    .reduce((s, r) => s + (r.refundAmount || 0), 0);

  const debts = db.getDebts();
  const unpaid = debts.filter(d => d.status === 'unpaid');
  const outstandingDebt = unpaid.reduce((s, d) => s + (d.total || 0), 0);

  const products = db.getProducts();
  const lowStock = products
    .filter(
      p =>
        !db.isServiceCategory(p.category) &&
        (p.stock || 0) <= (p.minStock || 0)
    )
    .sort((a, b) => (a.stock || 0) - (b.stock || 0));

  const onlineOrders =
    typeof db.getOnlineOrders === 'function' ? db.getOnlineOrders() : [];
  const pendingOnline = onlineOrders.filter(o => o.status === 'pending').length;

  const jobsList = db.getFramingJobs();
  const jobs = {
    pending: jobsList.filter(j => j.status === 'pending').length,
    framing: jobsList.filter(j => j.status === 'framing').length,
    done: jobsList.filter(j => j.status === 'done').length
  };

  const pos =
    typeof db.getPurchaseOrders === 'function' ? db.getPurchaseOrders() : [];
  const pendingPO = pos.filter(p => p.status === 'pending').length;

  const memberCount = db.getCustomers().length;

  return {
    todaySales,
    todayBills: todayOrders.length,
    todayRefunds,
    outstandingDebt,
    debtorCount: unpaid.length,
    lowStock,
    pendingOnline,
    jobs,
    pendingPO,
    memberCount
  };
}

export default function Dashboard({ activeUser, onTabChange, isMobile }) {
  const canSeeFinance =
    !!activeUser &&
    (activeUser.role === 'owner' ||
      activeUser.permissions?.admin ||
      activeUser.permissions?.reports);

  const [data, setData] = useState(computeDashboard);

  useEffect(() => {
    const handler = () => setData(computeDashboard());
    window.addEventListener('db-updated', handler);
    return () => window.removeEventListener('db-updated', handler);
  }, []);

  const go = tab => {
    if (onTabChange) onTabChange(tab);
  };

  const kb = n => (n || 0).toLocaleString() + ' ₭';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr 1fr'
            : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}
      >
        {canSeeFinance && (
          <StatCard
            isMobile={isMobile}
            onGo={go}
            tab="reports"
            icon="💵"
            label="ຍອດຂາຍມື້ນີ້ (Today Sales)"
            value={kb(data.todaySales)}
            sub={`${data.todayBills} ໃບບິນ`}
            color="#2ecc71"
          />
        )}
        {canSeeFinance && (
          <StatCard
            isMobile={isMobile}
            onGo={go}
            tab="reports"
            icon="↩️"
            label="ຄືນເງິນມື້ນີ້ (Refunds)"
            value={kb(data.todayRefunds)}
            color={data.todayRefunds > 0 ? '#e74c3c' : 'white'}
          />
        )}
        {canSeeFinance && (
          <StatCard
            isMobile={isMobile}
            onGo={go}
            tab="debts"
            icon="🧾"
            label="ໜີ້ຄ້າງຮັບ (Outstanding)"
            value={kb(data.outstandingDebt)}
            sub={`${data.debtorCount} ລາຍການ`}
            color={data.outstandingDebt > 0 ? '#f39c12' : 'white'}
          />
        )}
        <StatCard
          isMobile={isMobile}
          onGo={go}
          tab="inventory"
          icon="⚠️"
          label="ສິນຄ້າໃກ້ໝົດ (Low Stock)"
          value={data.lowStock.length}
          sub="ຄລິກເພື່ອເບິ່ງສະຕັອກ"
          color={data.lowStock.length > 0 ? '#e74c3c' : '#2ecc71'}
        />
        <StatCard
          isMobile={isMobile}
          onGo={go}
          tab="online_orders"
          icon="🌐"
          label="ອໍເດີ້ອອນລາຍຄ້າງ (Pending)"
          value={data.pendingOnline}
          color={data.pendingOnline > 0 ? '#3498db' : 'white'}
        />
        <StatCard
          isMobile={isMobile}
          onGo={go}
          tab="inventory"
          icon="📥"
          label="ໃບສັ່ງຊື້ຄ້າງ (Pending PO)"
          value={data.pendingPO}
          color={data.pendingPO > 0 ? '#f39c12' : 'white'}
        />
        <StatCard
          isMobile={isMobile}
          onGo={go}
          tab="framing_board"
          icon="🖼️"
          label="ງານກອບ (Framing Jobs)"
          value={data.jobs.pending + data.jobs.framing + data.jobs.done}
          sub={`ຮັບ ${data.jobs.pending} · ກຳລັງເຮັດ ${data.jobs.framing} · ພ້ອມຮັບ ${data.jobs.done}`}
          color="#9b59b6"
        />
        <StatCard
          isMobile={isMobile}
          onGo={go}
          tab="customers"
          icon="👥"
          label="ສະມາຊິກທັງໝົດ (Members)"
          value={data.memberCount}
          color="var(--gold-primary)"
        />
      </div>

      <div style={cardBase}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}
        >
          <h3 style={{ margin: 0, color: 'var(--gold-primary)', fontSize: '1rem' }}>
            ⚠️ ສິນຄ້າໃກ້ໝົດ / ໝົດສະຕັອກ (Low Stock Alerts)
          </h3>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            onClick={() => go('inventory')}
          >
            ຈັດການສະຕັອກ →
          </button>
        </div>
        {data.lowStock.length === 0 ? (
          <div style={{ color: '#2ecc71', fontSize: '0.85rem', padding: '10px 0' }}>
            ✅ ບໍ່ມີສິນຄ້າໃກ້ໝົດ
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ color: '#999', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>ສິນຄ້າ</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>ຄົງເຫຼືອ</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>ຂັ້ນຕ່ຳ</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.slice(0, 12).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'white' }}>{p.name}</td>
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: (p.stock || 0) <= 0 ? '#e74c3c' : '#f39c12'
                      }}
                    >
                      {p.stock || 0} {p.unit || ''}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#999' }}>
                      {p.minStock || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.lowStock.length > 12 && (
              <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '6px' }}>
                + ອີກ {data.lowStock.length - 12} ລາຍການ...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
