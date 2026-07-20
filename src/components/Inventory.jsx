import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import Portal from './Portal';
import AmuletImageEditor from './AmuletImageEditor';
const ConsumableCategoryIcons = {
  packaging: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  cleaning: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M5 12h14"/></svg>
  ),
  stationery: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  default: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  )
};

function getConsumableCatIconSvg(iconStr) {
  if (iconStr === '📦') return <ConsumableCategoryIcons.packaging />;
  if (iconStr === '🧹') return <ConsumableCategoryIcons.cleaning />;
  if (iconStr === '📝' || iconStr === '✏️') return <ConsumableCategoryIcons.stationery />;
  return <ConsumableCategoryIcons.default />;
}

const CategoryIcons = {
  amulet_frames: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
  ),
  necklaces: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M6 10a8 8 0 0 0 12 0"/><path d="M12 18v4"/><circle cx="12" cy="18" r="2"/></svg>
  ),
  services: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  gold: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  default: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  )
};

function getCategoryIconSvg(catId, catIcon) {
  if (catId === 'amulet_frames' || catIcon === '🪙') {
    return <CategoryIcons.amulet_frames />;
  }
  if (catId === 'necklaces' || catIcon === '⛓️') {
    return <CategoryIcons.necklaces />;
  }
  if (catId === 'services' || catIcon === '🛠️') {
    return <CategoryIcons.services />;
  }
  if (catId === 'cat_1783182208187' || catIcon === '👑') {
    return <CategoryIcons.gold />;
  }
  if (catIcon && (catIcon.startsWith('http') || catIcon.startsWith('data:image/'))) {
    return <img src={catIcon} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px' }} alt="" />;
  }
  return <CategoryIcons.default />;
}

const InventoryIcons = {
  warehouse: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10l10-6z"/><path d="M6 22V10h12v12"/></svg>
  ),
  stock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  consumables: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  purchasing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2H12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  rawMaterials: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l3 13m2-22 3 6-3 13m-10-13h18"/></svg>
  ),
  manufacturing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M5 17V8.7l5 3.3V8.7l5 3.3V5h4v12z"/></svg>
  ),
  box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  cost: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  retail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  profit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  category: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
  ),
  alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  outflow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 17 12 13 16 8 11 1 18"/><polyline points="17 18 23 18 23 12"/></svg>
  )
};

function InventoryKpiCard({ icon, label, value, sub, accentColor }) {
  const rgb = accentColor || '212, 175, 55';
  return (
    <div 
      style={{
        padding: '20px 22px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: `rgba(${rgb}, 0.07)`,
        border: `1px solid rgba(${rgb}, 0.25)`,
        borderRadius: 18,
        boxShadow: `0 4px 24px rgba(${rgb}, 0.12)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'dashFadeUp 0.4s ease',
      }}
    >
      <div style={{ position: 'absolute', top: -14, right: -14, width: 70, height: 70, borderRadius: '50%', background: `rgb(${rgb})`, opacity: 0.08, filter: 'blur(16px)', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `rgba(${rgb}, 0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid rgba(${rgb}, 0.3)`,
          color: `rgb(${rgb})`,
        }}>
          {icon}
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: `rgb(${rgb})`, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: `rgba(${rgb}, 0.85)`, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
      </div>
      
      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}


const ALL_BARCODE_FORMATS = [
  { value: 'QRCODE', label: 'QR Code (ສຳລັບບາໂຄ້ດສັ້ນ/2D)' },
  { value: 'CODE128', label: 'Code 128 (ແນະນຳ / Auto Alphanumeric)' },
  { value: 'CODE128A', label: 'Code 128 A (ຕົວພິມໃຫຍ່ & ຄວບຄຸມ)' },
  { value: 'CODE128B', label: 'Code 128 B (ຕົວພິມໃຫຍ່ & ນ້ອຍ)' },
  { value: 'CODE128C', label: 'Code 128 C (ຕົວເລກເທົ່ານັ້ນ)' },
  { value: 'CODE39', label: 'Code 39 (ຕົວເລກ & ຕົວອັກສອນຄລາສສິກ)' },
  { value: 'EAN13', label: 'EAN-13 (ມາດຕະຖານສາກົນ 13 ຫຼັກ)' },
  { value: 'EAN8', label: 'EAN-8 (ມາດຕະຖານສັ້ນ 8 ຫຼັກ)' },
  { value: 'EAN5', label: 'EAN-5 (ເພີ່ມເຕີມປຶ້ມ 5 ຫຼັກ)' },
  { value: 'EAN2', label: 'EAN-2 (ເພີ່ມເຕີມວາລະສານ 2 ຫຼັກ)' },
  { value: 'UPC', label: 'UPC-A (ມາດຕະຖານອາເມລິກາ 12 ຫຼັກ)' },
  { value: 'UPCE', label: 'UPC-E (ມາດຕະຖານອາເມລິກາສັ້ນ 8 ຫຼັກ)' },
  { value: 'ITF', label: 'ITF / Interleaved 2 of 5 (ຕົວເລກຄູ່)' },
  { value: 'ITF14', label: 'ITF-14 (ຂົນສົ່ງ/ສາງສິນຄ້າ 14 ຫຼັກ)' },
  { value: 'MSI', label: 'MSI Plessey (ຕົວເລກ)' },
  { value: 'MSI10', label: 'MSI Mod 10 (ຕົວເລກ)' },
  { value: 'MSI11', label: 'MSI Mod 11 (ຕົວເລກ)' },
  { value: 'MSI1010', label: 'MSI Mod 1010 (ຕົວເລກ)' },
  { value: 'MSI1110', label: 'MSI Mod 1110 (ຕົວເລກ)' },
  { value: 'pharmacode', label: 'Pharmacode (ລະຫັດຢາ/ການແພດ)' },
  { value: 'codabar', label: 'Codabar (ຕົວເລກ/ອັກສອນພິເສດ)' }
];

const parseSizeToPx = (sizeStr, defaultVal = 100) => {
  if (!sizeStr) return defaultVal;
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return defaultVal;
  if (sizeStr.toLowerCase().includes('mm')) {
    return Math.round(num * 10);
  }
  return Math.round(num);
};

const ensureUnit = (val, defaultUnit = 'mm') => {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (/^[0-9.]+$/.test(trimmed)) {
    return trimmed + defaultUnit;
  }
  return trimmed;
};

const generateBarcodeDataUrl = async (text, format = 'CODE128') => {
  const settings = db.getSettings();
  const canvas = document.createElement('canvas');
  try {
    if (format === 'QRCODE') {
      const qrWidth = settings.barcodeHeight || 50;
      canvas.width = qrWidth + 20;
      canvas.height = qrWidth + (settings.barcodeShowCode !== false ? 30 : 10);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, text, {
        margin: 1,
        scale: 3,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const qrSize = qrWidth;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 5;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      if (settings.barcodeShowCode !== false) {
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${settings.barcodeCodeSize || 10}px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, qrY + qrSize + 15);
      }

      return canvas.toDataURL();
    } else {
      JsBarcode(canvas, text, {
        format: format,
        width: settings.barcodeWidth || 2,
        height: settings.barcodeHeight || 50,
        displayValue: settings.barcodeShowCode !== false,
        fontSize: settings.barcodeCodeSize || 10,
        font: 'Courier New',
        background: '#FFFFFF',
        lineColor: '#000000',
        margin: settings.barcodeMargin || 10
      });
      return canvas.toDataURL();
    }
  } catch (err) {
    canvas.width = 300;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF0000';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❌ ຂໍ້ມູນບໍ່ຖືກຕ້ອງສຳລັບ ' + format, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('(' + text + ')', canvas.width / 2, canvas.height / 2 + 10);
    return canvas.toDataURL();
  }
  
  const handleDisburse = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(disburseForm.qty);
    if (!qtyVal || qtyVal <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນເບີກອອກ');
    if (qtyVal > (activeItem.stock || 0)) {
      if (!window.confirm('⚠️ ຈຳນວນເບີກອອກຫຼາຍກວ່າຄົງເຫຼືອໃນສາງ. ຕ້ອງການດຳເນີນການຕໍ່ບໍ່?')) return;
    }
    
    db.disburseConsumable(activeItem.id, qtyVal, disburseForm.notes);
    alert('✓ ເບີກອອກອຸປະກອນສຳເລັດ!');
    setDisburseForm({ qty: '', notes: '' });
    setShowDisburseModal(false);
    setActiveItem(null);
    loadConsumables();
    if (onUpdate) onUpdate();
  };
  
  const allHistory = [];
  consumables.forEach(c => {
    (c.history || []).forEach(h => {
      allHistory.push({
        ...h,
        itemName: c.name,
        unit: c.unit
      });
    });
  });
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const allExpenses = db.getExpenses();
  const monthExpenses = allExpenses.filter(ex => ex.date.startsWith(selectedMonth));
  const totalMonthExpenseVal = monthExpenses.reduce((sum, ex) => sum + (ex.convertedAmount || ex.amount), 0);
  
  const groupedExpenses = {};
  monthExpenses.forEach(ex => {
    const cat = ex.categoryName || ex.category || 'ອື່ນໆ';
    if (!groupedExpenses[cat]) {
      groupedExpenses[cat] = { name: cat, total: 0, count: 0 };
    }
    groupedExpenses[cat].total += (ex.convertedAmount || ex.amount);
    groupedExpenses[cat].count++;
  });
  const sortedGroupedExpenses = Object.values(groupedExpenses).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>{db.getLabel('auto____ຈັດການສາງອຸປະກອນສິ້ນເປ_4uuxq2', `🔧 ຈັດການສາງອຸປະກອນສິ້ນເປືອງ (Consumables Stock)`)}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowReportModal(true)}>
            📊 ລາຍງານລາຍຈ່າຍປະຈຳເດືອນ
          </button>
          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowHistoryModal(true)}>
            📋 ປະຫວັດຮັບ-ເບີກ
          </button>
          <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }} onClick={() => setShowAddModal(true)}>
            ➕ ເພີ່ມລາຍການອຸປະກອນ
          </button>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
          <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>{db.getLabel('auto_ລາຍການອຸປະກອນ_7l9211', `ລາຍການອຸປະກອນ`)}</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>{db.getLabel('auto_ຕົ້ນທຶນ_ໜ່ວຍ_qaqin1', `ຕົ້ນທຶນ/ໜ່ວຍ`)}</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>{db.getLabel('auto_ຍອດຄົງເຫຼືອ_da785x', `ຍອດຄົງເຫຼືອ`)}</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>{db.getLabel('auto_ຂັ້ນຕ່ຳ_pveo1t', `ຂັ້ນຕ່ຳ`)}</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>{db.getLabel('auto_ມູນຄ່າສາງ_dfn642', `ມູນຄ່າສາງ`)}</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>{db.getLabel('auto_ທຸລະກຳສາງ_hsxfzz', `ທຸລະກຳສາງ`)}</th>
              </tr>
            </thead>
            <tbody>
              {consumables.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    ບໍ່ມີລາຍການອຸປະກອນສິ້ນເປືອງ
                  </td>
                </tr>
              ) : consumables.map(item => {
                const totalVal = (item.stock || 0) * (item.costPerUnit || 0);
                const isLow = (item.stock || 0) <= (item.minStock || 0);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: isLow ? 'rgba(231,76,60,0.04)' : 'none' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      {isLow && <span style={{ fontSize: '0.65rem', color: '#e74c3c', background: 'rgba(231,76,60,0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{db.getLabel('auto____ໃກ້ຈະໝົດສາງ_8n3jlh', `⚠️ ໃກ້ຈະໝົດສາງ`)}</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{(item.costPerUnit || 0).toLocaleString()} ₭</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: isLow ? '#e74c3c' : 'white' }}>
                      {(item.stock || 0).toLocaleString()} {item.unit || 'ອັນ'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {(item.minStock || 0).toLocaleString()} {item.unit || 'ອັນ'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                      {totalVal.toLocaleString()} ₭
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#2ecc71', color: '#2ecc71', background: 'rgba(46,204,113,0.05)' }} onClick={() => { setActiveItem(item); setShowRestockModal(true); }}>
                          📥 ຮັບເຂົ້າ
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#e74c3c', color: '#e74c3c', background: 'rgba(231,76,60,0.05)' }} onClick={() => { setActiveItem(item); setShowDisburseModal(true); }}>
                          📤 ເບີກອອກ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto___ເພີ່ມລາຍການອຸປະກອນສິ້ນເ_53nwfw', `➕ ເພີ່ມລາຍການອຸປະກອນສິ້ນເປືອງ`)}</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <form onSubmit={handleAddConsumable} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">{db.getLabel('auto_ຊື່ອຸປະກອນ___6r1gnw', `ຊື່ອຸປະກອນ *`)}</label>
                  <input type="text" className="form-control" placeholder={db.getLabel('auto_ຕົວຢ່າງ__ເຈ້ຍຫ້ອງນ້ຳ__ສະບ_15n3gy', `ຕົວຢ່າງ: ເຈ້ຍຫ້ອງນ້ຳ, ສະບູ, ສະກັອດເທບ...`)} value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນຕໍ່ໜ່ວຍ__LAK__m0wy6x', `ຕົ້ນທຶນຕໍ່ໜ່ວຍ (LAK)`)}</label>
                    <input type="number" className="form-control" placeholder="0" value={addForm.costPerUnit} onChange={(e) => setAddForm({ ...addForm, costPerUnit: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{db.getLabel('auto_ຫົວໜ່ວຍ__Unit__ogidx0', `ຫົວໜ່ວຍ (Unit)`)}</label>
                    <input type="text" className="form-control" placeholder={db.getLabel('auto_ອັນ__ມ້ວນ__ແກັດ____vmeris', `ອັນ, ມ້ວນ, ແກັດ...`)} value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">{db.getLabel('auto_ຍອດເລີ່ມຕົ້ນ_tour11', `ຍອດເລີ່ມຕົ້ນ`)}</label>
                    <input type="number" className="form-control" placeholder="0" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{db.getLabel('auto_ລະດັບຂັ້ນຕ່ຳ_f6qj1r', `ລະດັບຂັ້ນຕ່ຳ`)}</label>
                    <input type="number" className="form-control" placeholder="5" value={addForm.minStock} onChange={(e) => setAddForm({ ...addForm, minStock: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }}>{db.getLabel('auto_ບັນທຶກ_hm29ds', `ບັນທຶກ`)}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {showRestockModal && activeItem && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#2ecc71', margin: 0 }}>{db.getLabel('auto____ຮັບເຂົ້າອຸປະກອນສິ້ນເປື_npaagi', `📥 ຮັບເຂົ້າອຸປະກອນສິ້ນເປືອງ`)}</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowRestockModal(false)}>✕</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <b>{db.getLabel('auto_ລາຍການ__t3ypbi', `ລາຍການ:`)}</b> {activeItem.name} {db.getLabel('auto__ຍອດຄົງເຫຼືອ__xeeod3', `(ຍອດຄົງເຫຼືອ:`)} {activeItem.stock} {activeItem.unit})
              </div>
              <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">{db.getLabel('auto_ຈຳນວນຮັບເຂົ້າ___kiq25n', `ຈຳນວນຮັບເຂົ້າ *`)}</label>
                    <input type="number" className="form-control" placeholder="10" value={restockForm.qty} onChange={(e) => setRestockForm({ ...restockForm, qty: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນຕໍ່ໜ່ວຍ__LAK__m0wy6x', `ຕົ້ນທຶນຕໍ່ໜ່ວຍ (LAK)`)}</label>
                    <input type="number" className="form-control" placeholder={activeItem.costPerUnit} value={restockForm.costPerUnit} onChange={(e) => setRestockForm({ ...restockForm, costPerUnit: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">{db.getLabel('auto_ວິທີການຊຳລະເງິນ_2zxxy5', `ວິທີການຊຳລະເງິນ`)}</label>
                  <select className="form-control" value={restockForm.paymentMethod} onChange={(e) => setRestockForm({ ...restockForm, paymentMethod: e.target.value })}>
                    <option value="cash">{db.getLabel('auto____ເງິນສົດ__Cash__i99q73', `💵 ເງິນສົດ (Cash)`)}</option>
                    <option value="transfer">{db.getLabel('auto____ໂອນຜ່ານ_BCEL_One__Tran_l6omjh', `📱 ໂອນຜ່ານ BCEL One (Transfer)`)}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{db.getLabel('auto_ໝາຍເຫດ_Supplier__Notes__z7ccd6', `ໝາຍເຫດ/Supplier (Notes)`)}</label>
                  <input type="text" className="form-control" placeholder={db.getLabel('auto_ຊື້ຢູ່ຮ້ານສະດວກຊື້__ຊື້ມາ_ogvf04', `ຊື້ຢູ່ຮ້ານສະດວກຊື້, ຊື້ມາເພີ່ມ...`)} value={restockForm.notes} onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })} />
                </div>
                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--gold-primary)' }}>
                  ⚠️ <b>{db.getLabel('auto_ຫມາຍເຫດ__x5aa4i', `ຫມາຍເຫດ:`)}</b> {db.getLabel('auto_ການຮັບເຂົ້າຈະເຮັດການ___ບັ_qie2ni', `ການຮັບເຂົ້າຈະເຮັດການ **ບັນທຶກລາຍຈ່າຍຮ້ານອັດຕະໂນມັດ** ມູນຄ່າ`)} {((parseFloat(restockForm.qty) || 0) * (parseFloat(restockForm.costPerUnit) || activeItem.costPerUnit || 0)).toLocaleString()} ກີບ.
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRestockModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#2ecc71', color: 'black', borderColor: '#2ecc71', fontWeight: 'bold' }}> Restock 📥</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {showDisburseModal && activeItem && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#e74c3c', margin: 0 }}>{db.getLabel('auto____ເບີກອອກອຸປະກອນສິ້ນເປືອ_g7t0j5', `📤 ເບີກອອກອຸປະກອນສິ້ນເປືອງ`)}</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowDisburseModal(false)}>✕</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <b>{db.getLabel('auto_ລາຍການ__t3ypbi', `ລາຍການ:`)}</b> {activeItem.name} {db.getLabel('auto__ຍອດຄົງເຫຼືອ__xeeod3', `(ຍອດຄົງເຫຼືອ:`)} {activeItem.stock} {activeItem.unit})
              </div>
              <form onSubmit={handleDisburse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">{db.getLabel('auto_ຈຳນວນເບີກອອກ___oprvd1', `ຈຳນວນເບີກອອກ *`)}</label>
                  <input type="number" className="form-control" placeholder="5" value={disburseForm.qty} onChange={(e) => setDisburseForm({ ...disburseForm, qty: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{db.getLabel('auto_ຈຸດປະສົງ_ໝາຍເຫດ_egg4zh', `ຈຸດປະສົງ/ໝາຍເຫດ`)}</label>
                  <input type="text" className="form-control" placeholder={db.getLabel('auto_ເບີກໄປໃຊ້ຢູ່ຫ້ອງນ້ຳ__ເບີກ_572uwy', `ເບີກໄປໃຊ້ຢູ່ຫ້ອງນ້ຳ, ເບີກໄປແພັກເຄື່ອງ...`)} value={disburseForm.notes} onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })} />
                </div>
                <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#FAB1A0' }}>
                  ℹ️ ການເບີກອອກໃຊ້ຈະບໍ່ມີການບັນທຶກລາຍຈ່າຍເພີ່ມ (ຍ້ອນວ່າໄດ້ບັນທຶກເປັນລາຍຈ່າຍໄປແລ້ວຕອນຊື້ຮັບເຂົ້າ).
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDisburseModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#e74c3c', color: 'white', borderColor: '#e74c3c', fontWeight: 'bold' }}>Disburse 📤</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {showHistoryModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-md glass-card" style={{ padding: '24px', maxHeight: '80%', overflowY: 'auto' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto____ປະຫວັດຮັບ_ເບີກອຸປະກອນສ_ud4c4v', `📋 ປະຫວັດຮັບ-ເບີກອຸປະກອນສິ້ນເປືອງ`)}</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowHistoryModal(false)}>✕</button>
              </div>
              <div className="desktop-table-view">
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>{db.getLabel('auto_ວັນທີ_ເວລາ_34372i', `ວັນທີ/ເວລາ`)}</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>{db.getLabel('auto_ລາຍການ_ce8qoo', `ລາຍການ`)}</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>{db.getLabel('auto_ປະເພດ_c0c4db', `ປະເພດ`)}</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>{db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>{db.getLabel('auto_ມູນຄ່າ_e6cxhv', `ມູນຄ່າ`)}</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>{db.getLabel('auto_ໝາຍເຫດ_ຜູ້ເຮັດ_gq9awx', `ໝາຍເຫດ/ຜູ້ເຮັດ`)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          ບໍ່ມີປະຫວັດທຸລະກຳ
                        </td>
                      </tr>
                    ) : allHistory.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <td style={{ padding: '10px' }}>{new Date(tx.date).toLocaleString('lo-LA')}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{tx.itemName}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            background: tx.type === 'restock' ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                            color: tx.type === 'restock' ? '#2ecc71' : '#e74c3c',
                            border: `1px solid ${tx.type === 'restock' ? '#2ecc71' : '#e74c3c'}`
                          }}>
                            {tx.type === 'restock' ? 'ຮັບເຂົ້າ' : 'ເບີກອອກ'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                          {tx.qty} {tx.unit}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'var(--gold-primary)' }}>
                          {tx.type === 'restock' ? `${(tx.totalCost || 0).toLocaleString()} ₭` : '-'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ color: 'white' }}>{tx.notes || '-'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ໂດຍ__1x7owv', `ໂດຍ:`)} {tx.createdByName}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showReportModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-md glass-card" style={{ padding: '24px', maxHeight: '80%', overflowY: 'auto' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto____ລາຍງານສະຫຼຸບລາຍຈ່າຍຮ້າ_xaafb1', `📊 ລາຍງານສະຫຼຸບລາຍຈ່າຍຮ້ານ`)}</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowReportModal(false)}>✕</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ເລືອກເດືອນ__9kr26p', `ເລືອກເດືອນ:`)}</label>
                <input type="month" className="form-control" style={{ width: '160px' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>

              <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.22)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ລວມລາຍຈ່າຍທັງໝົດປະຈຳເດ_a0a1jc', `💵 ລວມລາຍຈ່າຍທັງໝົດປະຈຳເດືອນ:`)}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#FAB1A0', marginTop: '4px' }}>
                    {totalMonthExpenseVal.toLocaleString()} ₭
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  ຈຳນວນລາຍການ: <b>{monthExpenses.length} {db.getLabel('auto_ລາຍການ_ce8qoo', `ລາຍການ`)}</b>
                </div>
              </div>

              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>{db.getLabel('auto____ແຍກຕາມປະເພດລາຍຈ່າຍ__Ca_n6xhge', `📁 ແຍກຕາມປະເພດລາຍຈ່າຍ (Category Summary):`)}</h4>
              <div className="desktop-table-view" style={{ marginBottom: '20px' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>{db.getLabel('auto_ປະເພດລາຍຈ່າຍ_m7xuee', `ປະເພດລາຍຈ່າຍ`)}</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>{db.getLabel('auto_ຈຳນວນບິນ_cltp5t', `ຈຳນວນບິນ`)}</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>{db.getLabel('auto_ຍອດລວມ__LAK__evrkyi', `ຍອດລວມ (LAK)`)}</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>{db.getLabel('auto_ເປີເຊັນ_____8o7jk8', `ເປີເຊັນ (%)`)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGroupedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          ບໍ່ມີລາຍຈ່າຍໃນເດືອນນີ້
                        </td>
                      </tr>
                    ) : sortedGroupedExpenses.map(row => {
                      const pct = totalMonthExpenseVal > 0 ? Math.round((row.total / totalMonthExpenseVal) * 100) : 0;
                      return (
                        <tr key={row.name} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: 'white' }}>{row.name}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{row.count}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#FAB1A0' }}>
                            {row.total.toLocaleString()} ₭
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <span>{pct}%</span>
                              <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#E17055' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>{db.getLabel('auto____ລາຍການບັນທຶກລາຍຈ່າຍ__E_agj9rt', `📋 ລາຍການບັນທຶກລາຍຈ່າຍ (Expenses Log):`)}</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {monthExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{db.getLabel('auto_ບໍ່ມີລາຍການ_hoaujz', `ບໍ່ມີລາຍການ`)}</div>
                ) : monthExpenses.map(ex => (
                  <div key={ex.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{ex.categoryName || ex.category}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {new Date(ex.date).toLocaleDateString('lo-LA')} {ex.notes ? ` • ${ex.notes}` : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#FAB1A0' }}>
                      {(ex.convertedAmount || ex.amount).toLocaleString()} ₭
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

// ==========================================
// 🔧 CONSUMABLES STOCK SUB-VIEW
// ==========================================
function ConsumablesSubView({ isMobile, activeUser, onUpdate }) {
  const [consumables, setConsumables] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showRestockModal, setShowRestockModal] = React.useState(false);
  const [showDisburseModal, setShowDisburseModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [sortMode, setSortMode] = React.useState('none');
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatIcon, setNewCatIcon] = React.useState('📦');
  const [editingCategory, setEditingCategory] = React.useState(null);
  const [categoryError, setCategoryError] = React.useState('');
  const [addForm, setAddForm] = React.useState({ name: '', costPerUnit: '', stock: '', minStock: '', unit: 'ອັນ', category: 'other' });
  const [editForm, setEditForm] = React.useState({ id: '', name: '', costPerUnit: '', minStock: '', unit: 'ອັນ', category: 'other' });
  const [restockForm, setRestockForm] = React.useState({ qty: '', costPerUnit: '', paymentMethod: 'cash', notes: '' });
  const [disburseForm, setDisburseForm] = React.useState({ qty: '', notes: '' });

  const loadData = () => {
    setConsumables((db.getConsumables() || []).filter(Boolean));
    setCategories(db.getConsumableCategories() || []);
  };
  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(); }, [showCategoryModal]);

  const handleAddConsumable = (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return alert('ກະລຸນາປ້ອນຊື່ອຸປະກອນ');
    db.addConsumable({ name: addForm.name, costPerUnit: parseFloat(addForm.costPerUnit)||0, stock: parseFloat(addForm.stock)||0, minStock: parseFloat(addForm.minStock)||0, unit: addForm.unit||'ອັນ', category: addForm.category||'other' });
    alert('✓ ເພີ່ມລາຍການອຸປະກອນສຳເລັດ!');
    setAddForm({ name:'', costPerUnit:'', stock:'', minStock:'', unit:'ອັນ', category: categories[0]?.id||'other' });
    setShowAddModal(false); loadData(); if (onUpdate) onUpdate();
  };

  const handleEditConsumable = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return alert('ກະລຸນາປ້ອນຊື່ອຸປະກອນ');
    db.updateConsumable(editForm.id, { name: editForm.name, costPerUnit: parseFloat(editForm.costPerUnit)||0, minStock: parseFloat(editForm.minStock)||0, unit: editForm.unit||'ອັນ', category: editForm.category||'other' });
    alert('✓ ແກ້ໄຂລາຍການສຳເລັດ!');
    setShowEditModal(false); loadData(); if (onUpdate) onUpdate();
  };

  const handleDeleteConsumable = (item) => {
    if (window.confirm(`⚠️ ລຶບ: ${item.name} ແທ້ບໍ່?`)) {
      db.deleteConsumable(item.id); alert('✓ ລຶບສຳເລັດ!');
      loadData(); if (onUpdate) onUpdate();
    }
  };

  const handleRestock = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(restockForm.qty);
    if (!qtyVal || qtyVal <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນ');
    const costVal = parseFloat(restockForm.costPerUnit) || activeItem.costPerUnit || 0;
    db.restockConsumable(activeItem.id, qtyVal, costVal, restockForm.paymentMethod, restockForm.notes);
    alert('✓ ຮັບເຂົ້າສຳເລັດ!');
    setRestockForm({ qty:'', costPerUnit:'', paymentMethod:'cash', notes:'' });
    setShowRestockModal(false); setActiveItem(null); loadData(); if (onUpdate) onUpdate();
  };

  const handleDisburse = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(disburseForm.qty);
    if (!qtyVal || qtyVal <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນ');
    if (qtyVal > (activeItem.stock||0) && !window.confirm('⚠️ ຈຳນວນເກີນ. ດຳເນີນຕໍ່?')) return;
    db.disburseConsumable(activeItem.id, qtyVal, disburseForm.notes);
    alert('✓ ເບີກອອກສຳເລັດ!');
    setDisburseForm({ qty:'', notes:'' });
    setShowDisburseModal(false); setActiveItem(null); loadData(); if (onUpdate) onUpdate();
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) { setCategoryError('ກະລຸນາປ້ອນຊື່'); return; }
    db.addConsumableCategory({ name: newCatName.trim(), icon: newCatIcon });
    setNewCatName(''); setNewCatIcon('📦'); setCategoryError('');
    setCategories(db.getConsumableCategories());
  };
  const handleUpdateCategory = () => {
    if (!editingCategory?.name.trim()) { setCategoryError('ກະລຸນາປ້ອນຊື່'); return; }
    db.updateConsumableCategory(editingCategory.id, { name: editingCategory.name, icon: editingCategory.icon });
    setEditingCategory(null); setCategoryError(''); setCategories(db.getConsumableCategories());
  };
  const handleDeleteCategory = (cat) => {
    if (consumables.some(c => c.category===cat.id)) return alert(`⚠️ ໝວດ "${cat.name}" ກຳລັງໃຊ້ງານ`);
    if (window.confirm(`ລຶບ "${cat.name}"?`)) { db.deleteConsumableCategory(cat.id); setCategories(db.getConsumableCategories()); }
  };
  const getCategoryInfo = (catId) => { const c = categories.find(x => x.id===catId); return c ? `${c.icon} ${c.name}` : '📁 ອື່ນໆ'; };

  const filteredConsumables = React.useMemo(() => {
    let list = consumables.filter(c => {
      if (!c) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q && !c.name.toLowerCase().includes(q) && !(c.id||'').toLowerCase().includes(q)) return false;
      if (activeFilter==='all') return true;
      if (activeFilter==='low') return (c.stock||0)<=(c.minStock||0);
      return c.category===activeFilter;
    });
    switch(sortMode) {
      case 'name_az': list=[...list].sort((a,b)=>a.name.localeCompare(b.name)); break;
      case 'name_za': list=[...list].sort((a,b)=>b.name.localeCompare(a.name)); break;
      case 'cost_hl': list=[...list].sort((a,b)=>(b.costPerUnit||0)-(a.costPerUnit||0)); break;
      case 'cost_lh': list=[...list].sort((a,b)=>(a.costPerUnit||0)-(b.costPerUnit||0)); break;
      case 'stock_hl': list=[...list].sort((a,b)=>(b.stock||0)-(a.stock||0)); break;
      case 'stock_lh': list=[...list].sort((a,b)=>(a.stock||0)-(b.stock||0)); break;
    }
    return list;
  }, [consumables, searchQuery, activeFilter, sortMode]);

  const lowStockItems = consumables.filter(c => c && (c.stock||0)<=(c.minStock||0));
  const totalStockValue = consumables.reduce((s,c)=>s+((c.stock||0)*(c.costPerUnit||0)), 0);
  let totalDisburseMonth=0;
  consumables.forEach(c => (c.history||[]).forEach(h => {
    if (h.type==='disburse' && h.date?.startsWith(selectedMonth)) totalDisburseMonth+=(h.qty||0)*(h.costPerUnit||c.costPerUnit||0);
  }));
  const allHistory=[];
  consumables.forEach(c=>(c.history||[]).forEach(h=>allHistory.push({...h,itemName:c.name,unit:c.unit})));
  allHistory.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const allExpenses=db.getExpenses();
  const monthExpenses=allExpenses.filter(ex=>ex.date?.startsWith(selectedMonth));
  const totalMonthExpenseVal=monthExpenses.reduce((s,ex)=>s+(ex.convertedAmount||ex.amount),0);
  const groupedExpenses={};
  monthExpenses.forEach(ex=>{const cat=ex.categoryName||ex.category||'ອື່ນໆ';if(!groupedExpenses[cat])groupedExpenses[cat]={name:cat,total:0,count:0};groupedExpenses[cat].total+=(ex.convertedAmount||ex.amount);groupedExpenses[cat].count++;});
  const sortedGroupedExpenses=Object.values(groupedExpenses).sort((a,b)=>b.total-a.total);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
      {/* ACTION BAR */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
        <h3 style={{color:'var(--gold-primary)',fontSize:'1.1rem',margin:0}}>{db.getLabel('auto____ຈັດການສາງອຸປະກອນສິ້ນເປ_uxd9j9', `🔧 ຈັດການສາງອຸປະກອນສິ້ນເປືອງ`)}</h3>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <button type="button" className="btn btn-secondary" style={{fontSize:'0.8rem',padding:'6px 12px'}} onClick={()=>setShowCategoryModal(true)}>{db.getLabel('auto_____ຈັດການໝວດໝູ່_o5lkqd', `🗂️ ຈັດການໝວດໝູ່`)}</button>
          <button type="button" className="btn btn-secondary" style={{fontSize:'0.8rem',padding:'6px 12px'}} onClick={()=>setShowReportModal(true)}>{db.getLabel('auto____ລາຍງານລາຍຈ່າຍ_ofnmyu', `📊 ລາຍງານລາຍຈ່າຍ`)}</button>
          <button type="button" className="btn btn-secondary" style={{fontSize:'0.8rem',padding:'6px 12px'}} onClick={()=>setShowHistoryModal(true)}>{db.getLabel('auto____ປະຫວັດຮັບ_ເບີກ_4kes4e', `📋 ປະຫວັດຮັບ-ເບີກ`)}</button>
          <button type="button" className="btn btn-primary" style={{fontSize:'0.8rem',padding:'6px 14px',background:'var(--gold-primary)',color:'black',borderColor:'var(--gold-primary)',fontWeight:'bold'}} onClick={()=>setShowAddModal(true)}>{db.getLabel('auto___ເພີ່ມລາຍການ_uxbgr1', `➕ ເພີ່ມລາຍການ`)}</button>
        </div>
      </div>

            {/* KPI CARDS */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:'12px'}}>
        <InventoryKpiCard
          icon={<InventoryIcons.box />}
          label="ລາຍການທັງໝົດ"
          value={consumables.length + ' ລາຍການ'}
          accentColor="52, 152, 219"
        />
        <InventoryKpiCard
          icon={<InventoryIcons.cost />}
          label="ມູນຄ່າສາງລວມ"
          value={totalStockValue.toLocaleString() + ' ₭'}
          accentColor="212, 175, 55"
        />
        <InventoryKpiCard
          icon={<InventoryIcons.alert />}
          label="ສາງໃກ້ໝົດ"
          value={lowStockItems.length + ' ລາຍການ'}
          accentColor={lowStockItems.length > 0 ? "231, 76, 60" : "46, 204, 113"}
        />
        <InventoryKpiCard
          icon={<InventoryIcons.outflow />}
          label="ເບີກໃຊ້ເດືອນນີ້"
          value={totalDisburseMonth.toLocaleString() + ' ₭'}
          accentColor="225, 112, 85"
        />
      </div>

      {/* CATEGORY BREAKDOWN */}
      {categories.length>0&&(
        <div>
          <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'8px',fontWeight:'600'}}>{db.getLabel('auto____ສະຫຼຸບຕາມໝວດໝູ່__qcrg15', `📁 ສະຫຼຸບຕາມໝວດໝູ່:`)}</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fill,minmax(180px,1fr))',gap:'10px'}}>
                        {categories.map(cat=>{
              const items=consumables.filter(c=>c.category===cat.id);
              const catVal=items.reduce((s,c)=>s+((c.stock||0)*(c.costPerUnit||0)),0);
              const isActive=activeFilter===cat.id;
              return(
                <button key={cat.id} type="button" onClick={()=>setActiveFilter(isActive?'all':cat.id)}
                  style={{
                    background: isActive ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: isActive ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: isActive ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                    {getConsumableCatIconSvg(cat.icon)}
                    <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{cat.name}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{items.length} {db.getLabel('auto_ລາຍການ_ce8qoo', 'ລາຍການ')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', marginTop: '2px' }}>{catVal.toLocaleString()} ₭</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LOW STOCK BANNER */}
      {lowStockItems.length>0&&(
        <div style={{background:'rgba(231,76,60,0.08)',border:'1px solid rgba(231,76,60,0.35)',borderRadius:'10px',padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
            <span>🚨</span>
            <span style={{fontWeight:'bold',color:'#e74c3c',fontSize:'0.9rem'}}>{db.getLabel('auto_ອຸປະກອນໃກ້ໝົດສາງ___a38ytr', `ອຸປະກອນໃກ້ໝົດສາງ (`)}{lowStockItems.length} {db.getLabel('auto_ລາຍການ__t3ypbz', `ລາຍການ)`)}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {lowStockItems.map(item=>(
              <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(231,76,60,0.06)',borderRadius:'6px',padding:'8px 12px'}}>
                <div>
                  <span style={{fontWeight:'bold',color:'white',fontSize:'0.85rem'}}>{item.name}</span>
                  <span style={{marginLeft:'8px',color:'#e74c3c',fontSize:'0.8rem'}}>{db.getLabel('auto_ຍອດ__1wadba', `ຍອດ:`)} {item.stock} {db.getLabel('auto___ຂັ້ນຕ່ຳ__n4g6xi', `/ ຂັ້ນຕ່ຳ:`)} {item.minStock} {item.unit}</span>
                </div>
                <button type="button" className="btn btn-secondary" style={{padding:'3px 10px',fontSize:'0.75rem',borderColor:'#2ecc71',color:'#2ecc71',background:'rgba(46,204,113,0.05)',whiteSpace:'nowrap'}}
                  onClick={()=>{setActiveItem(item);setShowRestockModal(true);}}>{db.getLabel('auto____ຕື່ມສະຕັອກ_o0vsnr', `📥 ຕື່ມສະຕັອກ`)}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH + SORT + FILTER */}
      <div style={{display:'flex',flexDirection:'column',gap:'10px',background:'rgba(255,255,255,0.01)',padding:'14px 16px',borderRadius:'8px',border:'1px solid var(--border-color)'}}>
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',flex:'1',minWidth:'200px'}}>
            <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--text-secondary)'}}>🔍</span>
            <input type="text" className="form-control" style={{paddingLeft:'36px',height:'38px',fontSize:'0.85rem'}} placeholder={db.getLabel('auto_ຄົ້ນຫາອຸປະກອນ____b98y5r', `ຄົ້ນຫາອຸປະກອນ...`)} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
            {searchQuery&&<button type="button" onClick={()=>setSearchQuery('')} style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer'}}>✕</button>}
          </div>
          <select className="form-control" style={{width:isMobile?'100%':'200px',height:'38px',fontSize:'0.85rem'}} value={sortMode} onChange={e=>setSortMode(e.target.value)}>
            <option value="none">{db.getLabel('auto____ຮຽງ__ຄ່າເລີ່ມຕົ້ນ_wyyrod', `📋 ຮຽງ: ຄ່າເລີ່ມຕົ້ນ`)}</option>
            <option value="name_az">{db.getLabel('auto____ຊື່_A_Z_8fdi8g', `🔤 ຊື່ A-Z`)}</option>
            <option value="name_za">{db.getLabel('auto____ຊື່_Z_A_8fe0r4', `🔤 ຊື່ Z-A`)}</option>
            <option value="cost_hl">{db.getLabel('auto____ຕົ້ນທຶນ_ສູງ_ຕ່ຳ_f5dder', `💰 ຕົ້ນທຶນ ສູງ→ຕ່ຳ`)}</option>
            <option value="cost_lh">{db.getLabel('auto____ຕົ້ນທຶນ_ຕ່ຳ_ສູງ_vhdezn', `💰 ຕົ້ນທຶນ ຕ່ຳ→ສູງ`)}</option>
            <option value="stock_hl">{db.getLabel('auto____ສາງ_ຫຼາຍ_ໜ້ອຍ_13m3et', `📦 ສາງ ຫຼາຍ→ໜ້ອຍ`)}</option>
            <option value="stock_lh">{db.getLabel('auto____ສາງ_ໜ້ອຍ_ຫຼາຍ_s113on', `📦 ສາງ ໜ້ອຍ→ຫຼາຍ`)}</option>
          </select>
        </div>
        <div className="no-scrollbar" style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'2px'}}>
          {[{id:'all',icon:'📋',label:'ທັງໝົດ'},{id:'low',icon:'⚠️',label:'ໃກ້ໝົດ'},...categories.map(c=>({id:c.id,icon:c.icon,label:c.name}))].map(tab=>{
            const count=tab.id==='all'?consumables.length:tab.id==='low'?consumables.filter(c=>(c.stock||0)<=(c.minStock||0)).length:consumables.filter(c=>c.category===tab.id).length;
            const isActive=activeFilter===tab.id;
            return(<button key={tab.id} type="button" onClick={()=>setActiveFilter(tab.id)} style={{padding:'5px 12px',borderRadius:'20px',fontSize:'0.8rem',fontWeight:'600',whiteSpace:'nowrap',cursor:'pointer',border:'1px solid',display:'flex',alignItems:'center',gap:'5px',borderColor:isActive?'var(--gold-primary)':'var(--border-color)',background:isActive?'var(--gold-primary)':'rgba(255,255,255,0.02)',color:isActive?'black':'var(--text-secondary)',transition:'all 0.2s'}}>
              <span>{tab.icon}</span><span>{tab.label}</span>
              <span style={{fontSize:'0.7rem',padding:'1px 5px',borderRadius:'10px',background:isActive?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.08)',color:isActive?'black':'var(--text-secondary)'}}>{count}</span>
            </button>);
          })}
        </div>
      </div>

      {/* TABLE */}
      <div className="glass-card" style={{padding:'20px'}}>
        <div className="desktop-table-view" style={{overflowX:'auto'}}>
          <table className="table-premium" style={{width:'100%',marginTop:0}}>
            <thead><tr>
              <th style={{textAlign:'left',padding:'12px'}}>{db.getLabel('auto_ລະຫັດ___ອຸປະກອນ_wo0npb', `ລະຫັດ / ອຸປະກອນ`)}</th>
              <th style={{textAlign:'left',padding:'12px'}}>{db.getLabel('auto_ໝວດໝູ່_dyeq76', `ໝວດໝູ່`)}</th>
              <th style={{textAlign:'right',padding:'12px'}}>{db.getLabel('auto_ຕົ້ນທຶນ_ໜ່ວຍ_qaqin1', `ຕົ້ນທຶນ/ໜ່ວຍ`)}</th>
              <th style={{textAlign:'center',padding:'12px'}}>{db.getLabel('auto_ຍອດຄົງເຫຼືອ_da785x', `ຍອດຄົງເຫຼືອ`)}</th>
              <th style={{textAlign:'center',padding:'12px'}}>{db.getLabel('auto_ຂັ້ນຕ່ຳ_pveo1t', `ຂັ້ນຕ່ຳ`)}</th>
              <th style={{textAlign:'right',padding:'12px'}}>{db.getLabel('auto_ມູນຄ່າສາງ_dfn642', `ມູນຄ່າສາງ`)}</th>
              <th style={{textAlign:'center',padding:'12px'}}>{db.getLabel('auto_ທຸລະກຳ_ix4f9e', `ທຸລະກຳ`)}</th>
              <th style={{textAlign:'right',padding:'12px'}}>{db.getLabel('auto_ຈັດການ_q4z3sz', `ຈັດການ`)}</th>
            </tr></thead>
            <tbody>
              {filteredConsumables.length===0?(
                <tr><td colSpan="8" style={{textAlign:'center',padding:'30px',color:'var(--text-secondary)'}}>{db.getLabel('auto_ບໍ່ມີລາຍການ_hoaujz', `ບໍ່ມີລາຍການ`)}</td></tr>
              ):filteredConsumables.map(item=>{
                const totalVal=(item.stock||0)*(item.costPerUnit||0);
                const isLow=(item.stock||0)<=(item.minStock||0);
                return(<tr key={item.id} style={{borderBottom:'1px solid var(--border-color)',background:isLow?'rgba(231,76,60,0.04)':'none'}}>
                  <td style={{padding:'12px'}}>
                    <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',fontFamily:'monospace'}}>{item.id}</div>
                    <div style={{fontWeight:'bold',fontSize:'0.9rem',marginTop:'2px'}}>{item.name}</div>
                    {isLow&&<span style={{fontSize:'0.65rem',color:'#e74c3c',background:'rgba(231,76,60,0.1)',padding:'2px 6px',borderRadius:'4px',marginTop:'3px',display:'inline-block'}}>{db.getLabel('auto____ໃກ້ຈະໝົດ_x3q1tg', `⚠️ ໃກ້ຈະໝົດ`)}</span>}
                  </td>
                  <td style={{padding:'12px'}}><span style={{fontSize:'0.78rem',color:'white',background:'rgba(255,255,255,0.05)',padding:'3px 8px',borderRadius:'12px',border:'1px solid var(--border-color)'}}>{getCategoryInfo(item.category)}</span></td>
                  <td style={{padding:'12px',textAlign:'right'}}>{(item.costPerUnit||0).toLocaleString()} ₭</td>
                  <td style={{padding:'12px',textAlign:'center',fontWeight:'bold',color:isLow?'#e74c3c':'white'}}>{(item.stock||0).toLocaleString()} {item.unit||'ອັນ'}</td>
                  <td style={{padding:'12px',textAlign:'center',color:'var(--text-secondary)'}}>{(item.minStock||0).toLocaleString()} {item.unit||'ອັນ'}</td>
                  <td style={{padding:'12px',textAlign:'right',fontWeight:'bold',color:'var(--gold-primary)'}}>{totalVal.toLocaleString()} ₭</td>
                  <td style={{padding:'12px',textAlign:'center'}}>
                    <div style={{display:'flex',gap:'5px',justifyContent:'center'}}>
                      <button type="button" className="btn btn-secondary" style={{padding:'3px 7px',fontSize:'0.72rem',borderColor:'#2ecc71',color:'#2ecc71',background:'rgba(46,204,113,0.05)'}} onClick={()=>{setActiveItem(item);setShowRestockModal(true);}}>{db.getLabel('auto____ຮັບ_b31pb3', `📥 ຮັບ`)}</button>
                      <button type="button" className="btn btn-secondary" style={{padding:'3px 7px',fontSize:'0.72rem',borderColor:'#e74c3c',color:'#e74c3c',background:'rgba(231,76,60,0.05)'}} onClick={()=>{setActiveItem(item);setShowDisburseModal(true);}}>{db.getLabel('auto____ເບີກ_bztzi9', `📤 ເບີກ`)}</button>
                    </div>
                  </td>
                  <td style={{padding:'12px',textAlign:'right'}}>
                    <div style={{display:'flex',gap:'5px',justifyContent:'flex-end'}}>
                      <button type="button" className="btn btn-primary" style={{padding:'3px 8px',fontSize:'0.75rem'}} onClick={()=>{setEditForm({id:item.id,name:item.name,costPerUnit:item.costPerUnit||0,minStock:item.minStock||0,unit:item.unit||'ອັນ',category:item.category||'other'});setShowEditModal(true);}}>📝</button>
                      <button type="button" className="btn" style={{padding:'3px 8px',fontSize:'0.75rem',background:'#c0392b',color:'white',border:'none'}} onClick={()=>handleDeleteConsumable(item)}>🗑️</button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
        <div className="mobile-cards-view" style={{display:'none',flexDirection:'column',gap:'12px'}}>
          {filteredConsumables.length===0?(<div style={{textAlign:'center',padding:'24px',color:'var(--text-secondary)'}}>{db.getLabel('auto_ບໍ່ມີລາຍການ_hoaujz', `ບໍ່ມີລາຍການ`)}</div>):filteredConsumables.map(item=>{
            const totalVal=(item.stock||0)*(item.costPerUnit||0);const isLow=(item.stock||0)<=(item.minStock||0);
            return(<div key={item.id} className="glass-card animate-fade-in" style={{padding:'14px',display:'flex',flexDirection:'column',gap:'10px',borderLeft:`4px solid ${isLow?'#e74c3c':'#2ecc71'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontWeight:'bold',fontSize:'0.95rem'}}>{item.name}</div><div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginTop:'2px'}}>{item.id} | {getCategoryInfo(item.category)}</div></div>
                <div style={{display:'flex',gap:'5px'}}>
                  <button type="button" className="btn btn-primary" style={{padding:'3px 8px',fontSize:'0.72rem'}} onClick={()=>{setEditForm({id:item.id,name:item.name,costPerUnit:item.costPerUnit||0,minStock:item.minStock||0,unit:item.unit||'ອັນ',category:item.category||'other'});setShowEditModal(true);}}>📝</button>
                  <button type="button" className="btn" style={{padding:'3px 8px',fontSize:'0.72rem',background:'#c0392b',color:'white',border:'none'}} onClick={()=>handleDeleteConsumable(item)}>🗑️</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',background:'rgba(255,255,255,0.02)',padding:'8px',borderRadius:'6px',fontSize:'0.78rem'}}>
                <div><span style={{color:'var(--text-secondary)'}}>{db.getLabel('auto_ຍອດ__1wadba', `ຍອດ:`)}</span> <strong style={{color:isLow?'#e74c3c':'white'}}>{(item.stock||0).toLocaleString()} {item.unit||'ອັນ'}</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>{db.getLabel('auto_ຂັ້ນຕ່ຳ__kpe3vd', `ຂັ້ນຕ່ຳ:`)}</span> <span>{(item.minStock||0).toLocaleString()}</span></div>
                <div><span style={{color:'var(--text-secondary)'}}>{db.getLabel('auto_ຕົ້ນທຶນ__4t4aie', `ຕົ້ນທຶນ:`)}</span> <span>{(item.costPerUnit||0).toLocaleString()} ₭</span></div>
                <div><span style={{color:'var(--text-secondary)'}}>{db.getLabel('auto_ມູນຄ່າ__dagihf', `ມູນຄ່າ:`)}</span> <strong style={{color:'var(--gold-primary)'}}>{totalVal.toLocaleString()} ₭</strong></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button type="button" className="btn btn-secondary" style={{flex:1,padding:'6px',fontSize:'0.8rem',borderColor:'#2ecc71',color:'#2ecc71'}} onClick={()=>{setActiveItem(item);setShowRestockModal(true);}}>{db.getLabel('auto____ຮັບເຂົ້າ_w6v75v', `📥 ຮັບເຂົ້າ`)}</button>
                <button type="button" className="btn btn-secondary" style={{flex:1,padding:'6px',fontSize:'0.8rem',borderColor:'#e74c3c',color:'#e74c3c'}} onClick={()=>{setActiveItem(item);setShowDisburseModal(true);}}>{db.getLabel('auto____ເບີກອອກ_2se0zm', `📤 ເບີກອອກ`)}</button>
              </div>
            </div>);
          })}
        </div>
      </div>

      {/* MODAL: ADD */}
      {showAddModal&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-sm glass-card" style={{padding:'24px'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'var(--gold-primary)',margin:0}}>{db.getLabel('auto___ເພີ່ມລາຍການອຸປະກອນ_ry5y2o', `➕ ເພີ່ມລາຍການອຸປະກອນ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>setShowAddModal(false)}>✕</button>
        </div>
        <form onSubmit={handleAddConsumable} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div><label className="form-label">{db.getLabel('auto_ຊື່ອຸປະກອນ___6r1gnw', `ຊື່ອຸປະກອນ *`)}</label><input type="text" className="form-control" placeholder={db.getLabel('auto_ເຈ້ຍຫ້ອງນ້ຳ__ສະບູ____jbqmcq', `ເຈ້ຍຫ້ອງນ້ຳ, ສະບູ...`)} value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} required/></div>
          <div><label className="form-label">{db.getLabel('auto_ໝວດໝູ່___db4z84', `ໝວດໝູ່ *`)}</label><select className="form-control" value={addForm.category} onChange={e=>setAddForm({...addForm,category:e.target.value})}>{categories.map(cat=><option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</select></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            <div><label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນ_ໜ່ວຍ_qaqin1', `ຕົ້ນທຶນ/ໜ່ວຍ`)}</label><input type="number" className="form-control" placeholder="0" value={addForm.costPerUnit} onChange={e=>setAddForm({...addForm,costPerUnit:e.target.value})}/></div>
            <div><label className="form-label">{db.getLabel('auto_ຫົວໜ່ວຍ_7dd5p3', `ຫົວໜ່ວຍ`)}</label><input type="text" className="form-control" placeholder={db.getLabel('auto_ອັນ__ມ້ວນ____g3myt1', `ອັນ, ມ້ວນ...`)} value={addForm.unit} onChange={e=>setAddForm({...addForm,unit:e.target.value})}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            <div><label className="form-label">{db.getLabel('auto_ຍອດເລີ່ມຕົ້ນ_tour11', `ຍອດເລີ່ມຕົ້ນ`)}</label><input type="number" className="form-control" placeholder="0" value={addForm.stock} onChange={e=>setAddForm({...addForm,stock:e.target.value})}/></div>
            <div><label className="form-label">{db.getLabel('auto_ລະດັບຂັ້ນຕ່ຳ_f6qj1r', `ລະດັບຂັ້ນຕ່ຳ`)}</label><input type="number" className="form-control" placeholder="5" value={addForm.minStock} onChange={e=>setAddForm({...addForm,minStock:e.target.value})}/></div>
          </div>
          <div className="modal-footer" style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'8px'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setShowAddModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
            <button type="submit" className="btn btn-primary" style={{background:'var(--gold-primary)',color:'black',borderColor:'var(--gold-primary)'}}>{db.getLabel('auto_ບັນທຶກ_hm29ds', `ບັນທຶກ`)}</button>
          </div>
        </form>
      </div></div></Portal>)}

      {/* MODAL: EDIT */}
      {showEditModal&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-sm glass-card" style={{padding:'24px'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'var(--gold-primary)',margin:0}}>{db.getLabel('auto____ແກ້ໄຂລາຍການ_uete8h', `📝 ແກ້ໄຂລາຍການ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>setShowEditModal(false)}>✕</button>
        </div>
        <form onSubmit={handleEditConsumable} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div><label className="form-label">{db.getLabel('auto_ຊື່___c9mj7f', `ຊື່ *`)}</label><input type="text" className="form-control" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} required/></div>
          <div><label className="form-label">{db.getLabel('auto_ໝວດໝູ່___db4z84', `ໝວດໝູ່ *`)}</label><select className="form-control" value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}>{categories.map(cat=><option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</select></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            <div><label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນ_ໜ່ວຍ_qaqin1', `ຕົ້ນທຶນ/ໜ່ວຍ`)}</label><input type="number" className="form-control" value={editForm.costPerUnit} onChange={e=>setEditForm({...editForm,costPerUnit:e.target.value})}/></div>
            <div><label className="form-label">{db.getLabel('auto_ຫົວໜ່ວຍ_7dd5p3', `ຫົວໜ່ວຍ`)}</label><input type="text" className="form-control" value={editForm.unit} onChange={e=>setEditForm({...editForm,unit:e.target.value})}/></div>
          </div>
          <div><label className="form-label">{db.getLabel('auto_ລະດັບຂັ້ນຕ່ຳ_f6qj1r', `ລະດັບຂັ້ນຕ່ຳ`)}</label><input type="number" className="form-control" value={editForm.minStock} onChange={e=>setEditForm({...editForm,minStock:e.target.value})}/></div>
          <div className="modal-footer" style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'8px'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setShowEditModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
            <button type="submit" className="btn btn-primary" style={{background:'var(--gold-primary)',color:'black',borderColor:'var(--gold-primary)'}}>{db.getLabel('auto_ບັນທຶກ_hm29ds', `ບັນທຶກ`)}</button>
          </div>
        </form>
      </div></div></Portal>)}

      {/* MODAL: RESTOCK */}
      {showRestockModal&&activeItem&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-sm glass-card" style={{padding:'24px'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'#2ecc71',margin:0}}>{db.getLabel('auto____ຮັບເຂົ້າອຸປະກອນ_mtclca', `📥 ຮັບເຂົ້າອຸປະກອນ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>setShowRestockModal(false)}>✕</button>
        </div>
        <div style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:'14px'}}><b>{activeItem.name}</b> {db.getLabel('auto___ຍອດ__9xn4s6', `| ຍອດ:`)} {activeItem.stock} {activeItem.unit}</div>
        <form onSubmit={handleRestock} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            <div><label className="form-label">{db.getLabel('auto_ຈຳນວນຮັບ___vzeq8x', `ຈຳນວນຮັບ *`)}</label><input type="number" className="form-control" placeholder="10" value={restockForm.qty} onChange={e=>setRestockForm({...restockForm,qty:e.target.value})} required/></div>
            <div><label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນ_ໜ່ວຍ_qaqin1', `ຕົ້ນທຶນ/ໜ່ວຍ`)}</label><input type="number" className="form-control" placeholder={activeItem.costPerUnit} value={restockForm.costPerUnit} onChange={e=>setRestockForm({...restockForm,costPerUnit:e.target.value})}/></div>
          </div>
          <div><label className="form-label">{db.getLabel('auto_ວິທີຊຳລະ_sk6mtd', `ວິທີຊຳລະ`)}</label>
            <select className="form-control" value={restockForm.paymentMethod} onChange={e=>setRestockForm({...restockForm,paymentMethod:e.target.value})}>
              <option value="cash">{db.getLabel('auto____ເງິນສົດ_lwldox', `💵 ເງິນສົດ`)}</option><option value="transfer">{db.getLabel('auto____ໂອນ_BCEL_One_6asdec', `📱 ໂອນ BCEL One`)}</option>
            </select>
          </div>
          <div><label className="form-label">{db.getLabel('auto_ໝາຍເຫດ_e4bdxt', `ໝາຍເຫດ`)}</label><input type="text" className="form-control" placeholder={db.getLabel('auto_ຊື້ຢູ່ຮ້ານ____4dsadl', `ຊື້ຢູ່ຮ້ານ...`)} value={restockForm.notes} onChange={e=>setRestockForm({...restockForm,notes:e.target.value})}/></div>
          <div style={{background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.25)',padding:'10px',borderRadius:'6px',fontSize:'0.75rem',color:'var(--gold-primary)'}}>
            ⚠️ ຈະບັນທຶກລາຍຈ່າຍ <b>{((parseFloat(restockForm.qty)||0)*(parseFloat(restockForm.costPerUnit)||activeItem.costPerUnit||0)).toLocaleString()} ₭</b> ອັດຕະໂນມັດ
          </div>
          <div className="modal-footer" style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'8px'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setShowRestockModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
            <button type="submit" className="btn btn-primary" style={{background:'#2ecc71',color:'black',borderColor:'#2ecc71',fontWeight:'bold'}}>{db.getLabel('auto____ຢືນຢັນ_5heq1u', `📥 ຢືນຢັນ`)}</button>
          </div>
        </form>
      </div></div></Portal>)}

      {/* MODAL: DISBURSE */}
      {showDisburseModal&&activeItem&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-sm glass-card" style={{padding:'24px'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'#e74c3c',margin:0}}>{db.getLabel('auto____ເບີກອອກອຸປະກອນ_8hbyol', `📤 ເບີກອອກອຸປະກອນ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>setShowDisburseModal(false)}>✕</button>
        </div>
        <div style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:'14px'}}><b>{activeItem.name}</b> {db.getLabel('auto___ຍອດ__9xn4s6', `| ຍອດ:`)} {activeItem.stock} {activeItem.unit}</div>
        <form onSubmit={handleDisburse} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div><label className="form-label">{db.getLabel('auto_ຈຳນວນເບີກ___5autf4', `ຈຳນວນເບີກ *`)}</label><input type="number" className="form-control" placeholder="5" value={disburseForm.qty} onChange={e=>setDisburseForm({...disburseForm,qty:e.target.value})} required/></div>
          <div><label className="form-label">{db.getLabel('auto_ໝາຍເຫດ_e4bdxt', `ໝາຍເຫດ`)}</label><input type="text" className="form-control" placeholder={db.getLabel('auto_ເບີກໄປໃຊ້____gn9qbt', `ເບີກໄປໃຊ້...`)} value={disburseForm.notes} onChange={e=>setDisburseForm({...disburseForm,notes:e.target.value})}/></div>
          <div style={{background:'rgba(231,76,60,0.06)',border:'1px solid rgba(231,76,60,0.2)',padding:'10px',borderRadius:'6px',fontSize:'0.75rem',color:'#FAB1A0'}}>
            ℹ️ ການເບີກອອກຈະບໍ່ສ້າງລາຍຈ່າຍໃໝ່
          </div>
          <div className="modal-footer" style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'8px'}}>
            <button type="button" className="btn btn-secondary" onClick={()=>setShowDisburseModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
            <button type="submit" className="btn btn-primary" style={{background:'#e74c3c',color:'white',borderColor:'#e74c3c',fontWeight:'bold'}}>{db.getLabel('auto____ຢືນຢັນ_yb1741', `📤 ຢືນຢັນ`)}</button>
          </div>
        </form>
      </div></div></Portal>)}

      {/* MODAL: CATEGORY MANAGER */}
      {showCategoryModal&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-sm glass-card" style={{padding:'24px',maxHeight:'85vh',overflowY:'auto'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'var(--gold-primary)',margin:0}}>{db.getLabel('auto_____ຈັດການໝວດໝູ່ອຸປະກອນ_49m3qg', `🗂️ ຈັດການໝວດໝູ່ອຸປະກອນ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>{setShowCategoryModal(false);setEditingCategory(null);setCategoryError('');}}>✕</button>
        </div>
        <div style={{background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
          <div style={{fontSize:'0.8rem',fontWeight:'bold',color:'var(--gold-primary)',marginBottom:'10px'}}>{db.getLabel('auto___ເພີ່ມໝວດໝູ່ໃໝ່_xemag7', `➕ ເພີ່ມໝວດໝູ່ໃໝ່`)}</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <input type="text" className="form-control" style={{width:'60px',textAlign:'center',fontSize:'1.2rem'}} placeholder="🔧" value={newCatIcon} onChange={e=>setNewCatIcon(e.target.value)}/>
            <input type="text" className="form-control" style={{flex:1}} placeholder={db.getLabel('auto_ຊື່ໝວດໝູ່____9tdehb', `ຊື່ໝວດໝູ່...`)} value={newCatName} onChange={e=>{setNewCatName(e.target.value);setCategoryError('');}}/>
            <button type="button" className="btn btn-primary" style={{background:'var(--gold-primary)',color:'black',borderColor:'var(--gold-primary)',fontWeight:'bold'}} onClick={handleAddCategory}>{db.getLabel('auto_ເພີ່ມ_bgbfbk', `ເພີ່ມ`)}</button>
          </div>
          {categoryError&&<div style={{color:'#e74c3c',fontSize:'0.78rem',marginTop:'6px'}}>{categoryError}</div>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {categories.map(cat=>{
            const usageCount=consumables.filter(c=>c.category===cat.id).length;
            const isEditing=editingCategory&&editingCategory.id===cat.id;
            return(<div key={cat.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border-color)',borderRadius:'8px',padding:'10px 12px'}}>
              {isEditing?(
                <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                  <input type="text" className="form-control" style={{width:'60px',textAlign:'center',fontSize:'1.1rem'}} value={editingCategory.icon} onChange={e=>setEditingCategory({...editingCategory,icon:e.target.value})}/>
                  <input type="text" className="form-control" style={{flex:1}} value={editingCategory.name} onChange={e=>setEditingCategory({...editingCategory,name:e.target.value})}/>
                  <button type="button" className="btn btn-primary" style={{padding:'4px 10px',fontSize:'0.78rem',background:'var(--gold-primary)',color:'black',borderColor:'var(--gold-primary)'}} onClick={handleUpdateCategory}>{db.getLabel('auto_ບັນທຶກ_hm29ds', `ບັນທຶກ`)}</button>
                  <button type="button" className="btn btn-secondary" style={{padding:'4px 10px',fontSize:'0.78rem'}} onClick={()=>setEditingCategory(null)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                </div>
              ):(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'1.4rem'}}>{cat.icon}</span>
                    <div><div style={{fontWeight:'bold',color:'white',fontSize:'0.9rem'}}>{cat.name}</div><div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{usageCount} {db.getLabel('auto_ລາຍການ_ce8qoo', `ລາຍການ`)}</div></div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button type="button" className="btn btn-secondary" style={{padding:'3px 8px',fontSize:'0.75rem'}} onClick={()=>{setEditingCategory({...cat});setCategoryError('');}}>📝</button>
                    <button type="button" className="btn" style={{padding:'3px 8px',fontSize:'0.75rem',background:'#c0392b',color:'white',border:'none'}} onClick={()=>handleDeleteCategory(cat)}>🗑️</button>
                  </div>
                </div>
              )}
            </div>);
          })}
        </div>
      </div></div></Portal>)}

      {/* MODAL: HISTORY */}
      {showHistoryModal&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-md glass-card" style={{padding:'24px',maxHeight:'80%',overflowY:'auto'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'var(--gold-primary)',margin:0}}>{db.getLabel('auto____ປະຫວັດຮັບ_ເບີກ_4kes4e', `📋 ປະຫວັດຮັບ-ເບີກ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>setShowHistoryModal(false)}>✕</button>
        </div>
        <table className="table-premium" style={{width:'100%',marginTop:0}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'10px'}}>{db.getLabel('auto_ວັນທີ_btqrbn', `ວັນທີ`)}</th><th style={{textAlign:'left',padding:'10px'}}>{db.getLabel('auto_ລາຍການ_ce8qoo', `ລາຍການ`)}</th>
            <th style={{textAlign:'center',padding:'10px'}}>{db.getLabel('auto_ປະເພດ_c0c4db', `ປະເພດ`)}</th><th style={{textAlign:'center',padding:'10px'}}>{db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}</th>
            <th style={{textAlign:'right',padding:'10px'}}>{db.getLabel('auto_ມູນຄ່າ_e6cxhv', `ມູນຄ່າ`)}</th><th style={{textAlign:'left',padding:'10px'}}>{db.getLabel('auto_ໝາຍເຫດ_e4bdxt', `ໝາຍເຫດ`)}</th>
          </tr></thead>
          <tbody>
            {allHistory.length===0?(<tr><td colSpan="6" style={{textAlign:'center',padding:'20px',color:'var(--text-secondary)'}}>{db.getLabel('auto_ບໍ່ມີປະຫວັດ_mfapxf', `ບໍ່ມີປະຫວັດ`)}</td></tr>):allHistory.map(tx=>(
              <tr key={tx.id} style={{borderBottom:'1px solid var(--border-color)',fontSize:'0.8rem'}}>
                <td style={{padding:'10px'}}>{new Date(tx.date).toLocaleString('lo-LA')}</td>
                <td style={{padding:'10px',fontWeight:'bold'}}>{tx.itemName}</td>
                <td style={{padding:'10px',textAlign:'center'}}><span style={{padding:'2px 6px',borderRadius:'4px',fontSize:'0.65rem',fontWeight:'bold',background:tx.type==='restock'?'rgba(46,204,113,0.15)':'rgba(231,76,60,0.15)',color:tx.type==='restock'?'#2ecc71':'#e74c3c',border:`1px solid ${tx.type==='restock'?'#2ecc71':'#e74c3c'}`}}>{tx.type==='restock'?'ຮັບເຂົ້າ':'ເບີກອອກ'}</span></td>
                <td style={{padding:'10px',textAlign:'center',fontWeight:'bold'}}>{tx.qty} {tx.unit}</td>
                <td style={{padding:'10px',textAlign:'right',color:'var(--gold-primary)'}}>{tx.type==='restock'?`${(tx.totalCost||0).toLocaleString()} ₭`:'-'}</td>
                <td style={{padding:'10px'}}><div style={{color:'white'}}>{tx.notes||'-'}</div><div style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{db.getLabel('auto_ໂດຍ__1x7owv', `ໂດຍ:`)} {tx.createdByName}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></Portal>)}

      {/* MODAL: REPORT */}
      {showReportModal&&(<Portal><div className="modal-overlay" style={{zIndex:1200}}><div className="modal-content modal-md glass-card" style={{padding:'24px',maxHeight:'80%',overflowY:'auto'}}>
        <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{color:'var(--gold-primary)',margin:0}}>{db.getLabel('auto____ລາຍງານສະຫຼຸບລາຍຈ່າຍ_p5axtr', `📊 ລາຍງານສະຫຼຸບລາຍຈ່າຍ`)}</h3>
          <button type="button" className="close-btn" style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'1.25rem',cursor:'pointer'}} onClick={()=>setShowReportModal(false)}>✕</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',background:'rgba(255,255,255,0.03)',padding:'12px',borderRadius:'8px',border:'1px solid var(--border-color)'}}>
          <label style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{db.getLabel('auto_ເລືອກເດືອນ__9kr26p', `ເລືອກເດືອນ:`)}</label>
          <input type="month" className="form-control" style={{width:'160px'}} value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}/>
        </div>
        <div style={{background:'rgba(231,76,60,0.06)',border:'1px solid rgba(231,76,60,0.22)',padding:'16px',borderRadius:'12px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div><div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{db.getLabel('auto____ລວມລາຍຈ່າຍ__k7rnqu', `💵 ລວມລາຍຈ່າຍ:`)}</div><div style={{fontSize:'1.6rem',fontWeight:'bold',color:'#FAB1A0',marginTop:'4px'}}>{totalMonthExpenseVal.toLocaleString()} ₭</div></div>
          <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',textAlign:'right'}}>{db.getLabel('auto_ຈຳນວນ__q3rmxy', `ຈຳນວນ:`)} <b>{monthExpenses.length} {db.getLabel('auto_ລາຍການ_ce8qoo', `ລາຍການ`)}</b></div>
        </div>
        <h4 style={{color:'white',fontSize:'0.9rem',marginBottom:'10px'}}>{db.getLabel('auto____ແຍກຕາມໝວດໝູ່__shgxjn', `📁 ແຍກຕາມໝວດໝູ່:`)}</h4>
        <table className="table-premium" style={{width:'100%',marginBottom:'20px'}}>
          <thead><tr><th style={{textAlign:'left',padding:'10px'}}>{db.getLabel('auto_ໝວດໝູ່_dyeq76', `ໝວດໝູ່`)}</th><th style={{textAlign:'center',padding:'10px'}}>{db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}</th><th style={{textAlign:'right',padding:'10px'}}>{db.getLabel('auto_ຍອດ_27avo', `ຍອດ`)}</th><th style={{textAlign:'right',padding:'10px'}}>%</th></tr></thead>
          <tbody>
            {sortedGroupedExpenses.length===0?(<tr><td colSpan="4" style={{textAlign:'center',padding:'20px',color:'var(--text-secondary)'}}>{db.getLabel('auto_ບໍ່ມີ_c0d8bb', `ບໍ່ມີ`)}</td></tr>):sortedGroupedExpenses.map(row=>{
              const pct=totalMonthExpenseVal>0?Math.round((row.total/totalMonthExpenseVal)*100):0;
              return(<tr key={row.name} style={{borderBottom:'1px solid var(--border-color)',fontSize:'0.85rem'}}>
                <td style={{padding:'10px',fontWeight:'bold',color:'white'}}>{row.name}</td>
                <td style={{padding:'10px',textAlign:'center'}}>{row.count}</td>
                <td style={{padding:'10px',textAlign:'right',fontWeight:'bold',color:'#FAB1A0'}}>{row.total.toLocaleString()} ₭</td>
                <td style={{padding:'10px',textAlign:'right'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'8px'}}>
                    <span>{pct}%</span>
                    <div style={{width:'50px',height:'6px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:'#E17055'}}/></div>
                  </div>
                </td>
              </tr>);
            })}
          </tbody>
        </table>
        <h4 style={{color:'white',fontSize:'0.9rem',marginBottom:'10px'}}>{db.getLabel('auto____ລາຍການ__9dzsyo', `📋 ລາຍການ:`)}</h4>
        <div style={{maxHeight:'250px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'8px'}}>
          {monthExpenses.length===0?(<div style={{textAlign:'center',padding:'20px',color:'var(--text-secondary)',fontSize:'0.8rem'}}>{db.getLabel('auto_ບໍ່ມີ_c0d8bb', `ບໍ່ມີ`)}</div>):monthExpenses.map(ex=>(
            <div key={ex.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid var(--border-color)',borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.8rem'}}>
              <div><div style={{fontWeight:'bold',color:'white'}}>{ex.categoryName||ex.category}</div><div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:'2px'}}>{new Date(ex.date).toLocaleDateString('lo-LA')}{ex.notes?` • ${ex.notes}`:''}</div></div>
              <div style={{fontWeight:'bold',color:'#FAB1A0'}}>{(ex.convertedAmount||ex.amount).toLocaleString()} ₭</div>
            </div>
          ))}
        </div>
      </div></div></Portal>)}
    </div>
  );
}

// 💎 RAW MATERIALS SUB-VIEW
// ==========================================
function RawMaterialsSubView({ isMobile, activeUser }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'ອາຄຣີລິກ (Acrylic)',
    unit: 'ແຜ່ນ',
    stock_qty: '',
    min_stock: '',
    cost_price: '',
    supplier: '',
    barcode: '',
    image: '',
    description: '',
    notes: ''
  });
  const [csvText, setCsvText] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  function loadMaterials() {
    setMaterials(db.getRawMaterials());
  };

  const handleOpenAdd = () => {
    setEditMaterial(null);
    setFormData({
      name: '',
      category: 'ອາຄຣີລິກ (Acrylic)',
      unit: 'ແຜ່ນ',
      stock_qty: '',
      min_stock: '',
      cost_price: '',
      supplier: '',
      barcode: '',
      image: '',
      description: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditMaterial(m);
    setFormData({
      name: m.name || '',
      category: m.category || 'ອາຄຣີລິກ (Acrylic)',
      unit: m.unit || 'ແຜ່ນ',
      stock_qty: m.stock_qty ?? '',
      min_stock: m.min_stock ?? '',
      cost_price: m.cost_price ?? '',
      supplier: m.supplier || '',
      barcode: m.barcode || '',
      image: m.image || '',
      description: m.description || '',
      notes: m.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('ຕ້ອງການລຶບວັດຖຸດິບນີ້ແມ່ນບໍ່?')) {
      db.deleteRawMaterial(id);
      loadMaterials();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      stock_qty: Number(formData.stock_qty || 0),
      min_stock: Number(formData.min_stock || 0),
      cost_price: Number(formData.cost_price || 0),
      barcode: formData.barcode || '',
      image: formData.image || '',
      description: formData.description || '',
      notes: formData.notes || ''
    };
    if (editMaterial) {
      db.updateRawMaterial({ ...editMaterial, ...data });
    } else {
      db.addRawMaterial(data);
    }
    setShowModal(false);
    loadMaterials();
  };

  const handleExportCsv = () => {
    const headers = 'ID,Name,Category,Unit,Stock Qty,Min Stock,Cost Price,Supplier\n';
    const rows = materials.map(m => '"' + m.id + '","' + m.name + '","' + m.category + '","' + m.unit + '",' + m.stock_qty + ',' + m.min_stock + ',' + m.cost_price + ',"' + (m.supplier || '') + '"').join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'raw_materials_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = () => {
    try {
      const lines = csvText.split('\n');
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 7) {
          db.addRawMaterial({
            name: cols[1],
            category: cols[2] || 'acrylic',
            unit: cols[3] || 'ອັນ',
            stock_qty: Number(cols[4] || 0),
            min_stock: Number(cols[5] || 0),
            cost_price: Number(cols[6] || 0),
            supplier: cols[7] || ''
          });
          importedCount++;
        }
      }
      alert('✓ ນຳເຂົ້າວັດຖຸດິບສຳເລັດ ' + importedCount + ' ລາຍການ!');
      setShowCsvModal(false);
      setCsvText('');
      loadMaterials();
    } catch (err) {
      alert('⚠ ຂໍ້ຜິດພາດໃນການນຳເຂົ້າ CSV: ' + err.message);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const existingRawCategories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));
  const defaultRawCategories = ['ອາຄຣີລິກ (Acrylic)', 'ໄມ້/ຂອບໄມ້ (Wood)', 'ແກ້ວ/ເລນ (Glass)', 'ກາວ/ອຸປະກອນ (Glue/Chemicals)', 'ອື່ນໆ (Other)'];
  const rawCategoriesToSuggest = Array.from(new Set([...defaultRawCategories, ...existingRawCategories]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: isMobile ? '100%' : '400px', width: '100%' }}>
          <input
            type="text"
            className="form-control"
            placeholder={db.getLabel('auto____ຄົ້ນຫາວັດຖຸດິບ____fas6ma', `🔍 ຄົ້ນຫາວັດຖຸດິບ...`)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
{hasInventoryPermission('inventoryViewCost') && (
          <button 
            className="btn btn-secondary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={handleExportCsv}
          >
            📤 ສົ່ງອອກ CSV
          </button>
)}
{hasInventoryPermission('inventoryAddProduct') && (
          <button 
            className="btn btn-secondary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={() => setShowCsvModal(true)}
          >
            📥 ນຳເຂົ້າ CSV
          </button>
)}
{hasInventoryPermission('inventoryAddProduct') && (
          <button 
            className="btn btn-primary" 
            style={isMobile ? { flex: '1 1 100%', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={handleOpenAdd}
          >
            ➕ ເພີ່ມວັດຖຸດິບໃໝ່
          </button>
)}
        </div>
      </div>

      <div className="desktop-table-view">
        <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>{db.getLabel('auto_ຊື່ວັດຖຸດິບ_46tviv', `ຊື່ວັດຖຸດິບ`)}</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>{db.getLabel('auto_ໝວດໝູ່_dyeq76', `ໝວດໝູ່`)}</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>{db.getLabel('auto_ຫົວໜ່ວຍ_7dd5p3', `ຫົວໜ່ວຍ`)}</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>{db.getLabel('auto_ຈຳນວນສະຕັອກ_4sia96', `ຈຳນວນສະຕັອກ`)}</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>{db.getLabel('auto_ຈຳນວນຕໍ່າສຸດ_g3182k', `ຈຳນວນຕໍ່າສຸດ`)}</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>{db.getLabel('auto_ຕົ້ນທຶນ__LAK__wkmh35', `ຕົ້ນທຶນ (LAK)`)}</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>{db.getLabel('auto_ຜູ້ສະໜອງ_zfa9s4', `ຜູ້ສະໜອງ`)}</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>{db.getLabel('auto_ຈັດການ_q4z3sz', `ຈັດການ`)}</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)', background: m.stock_qty <= m.min_stock ? 'rgba(231,76,60,0.03)' : 'transparent' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{m.name}</td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{m.category}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{m.unit}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: m.stock_qty <= m.min_stock ? 'var(--alert-red)' : 'white' }}>
                  {m.stock_qty.toLocaleString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{m.min_stock}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{hasInventoryPermission('inventoryViewCost') ? `${m.cost_price.toLocaleString()} ₭` : '*** ₭'}</td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{m.supplier || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
{hasInventoryPermission('inventoryEditProduct') && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }} onClick={() => handleOpenEdit(m)}>{db.getLabel('auto____ແກ້ໄຂ_1rhy6x', `✏️ ແກ້ໄຂ`)}</button>
)}
{hasInventoryPermission('inventoryDeleteProduct') && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.1)' }} onClick={() => handleDelete(m.id)}>{db.getLabel('auto_____ລຶບ_ps8og4', `🗑️ ລຶບ`)}</button>
)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
        {filteredMaterials.map(m => (
          <div key={m.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid ' + (m.stock_qty <= m.min_stock ? 'var(--alert-red)' : 'var(--success-green)') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{m.name}</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{m.category}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຈຳນວນ__q3rmxy', `ຈຳນວນ:`)} </span>
                <span style={{ fontWeight: 'bold', color: m.stock_qty <= m.min_stock ? 'var(--alert-red)' : 'white' }}>{m.stock_qty.toLocaleString()} {m.unit}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຂັ້ນຕ່ຳ__kpe3vd', `ຂັ້ນຕ່ຳ:`)} </span>
                <span>{m.min_stock} {m.unit}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຕົ້ນທຶນ__4t4aie', `ຕົ້ນທຶນ:`)} </span>
                <span>{hasInventoryPermission('inventoryViewCost') ? `${m.cost_price.toLocaleString()} ₭` : '*** ₭'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຜູ້ສະໜອງ__wp5lme', `ຜູ້ສະໜອງ:`)} </span>
                <span>{m.supplier || '-'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
{hasInventoryPermission('inventoryEditProduct') && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(m)}>{db.getLabel('auto____ແກ້ໄຂ_1rhy6x', `✏️ ແກ້ໄຂ`)}</button>
)}
{hasInventoryPermission('inventoryDeleteProduct') && (
              <button className="btn btn-secondary btn-sm" style={{ color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.1)' }} onClick={() => handleDelete(m.id)}>{db.getLabel('auto_____ລຶບ_ps8og4', `🗑️ ລຶບ`)}</button>
)}
            </div>
          </div>
        ))}
      </div>
      
      
      {showModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-md glass-card" style={{ padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{editMaterial ? '✏️ ແກ້ໄຂຂໍ້ມູນວັດຖຸດິບ' : '➕ ເພີ່ມວັດຖຸດິບໃໝ່'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '10px 0' }}>
                <div className="grid-2col">
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ຊື່ວັດຖຸດິບ__Ingredient_N_w2ch06', `ຊື່ວັດຖຸດິບ (Ingredient Name) *`)}</label>
                      <input type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ໝວດໝູ່__Category____rjpp1', `ໝວດໝູ່ (Category) *`)}</label>
                      <input
                        type="text"
                        className="form-control"
                        list="raw-material-categories-datalist"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      />
                      <datalist id="raw-material-categories-datalist">
                        {rawCategoriesToSuggest.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">{db.getLabel('auto_ຫົວໜ່ວຍ__Unit____6hgn42', `ຫົວໜ່ວຍ (Unit) *`)}</label>
                        <input type="text" className="form-control" placeholder={db.getLabel('auto_ແຜ່ນ__ອັນ_____6a2myx', `ແຜ່ນ, ອັນ,...`)} required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{db.getLabel('auto_ບາໂຄ້ດ__Barcode__h8mixi', `ບາໂຄ້ດ (Barcode)`)}</label>
                        <input type="text" className="form-control" placeholder="Barcode..." value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ຜູ້ສະໜອງ__Supplier__v8027l', `ຜູ້ສະໜອງ (Supplier)`)}</label>
                      <input type="text" className="form-control" placeholder="Supplier name..." value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ຄຳອະທິບາຍ__Description__p1frx7', `ຄຳອະທິບາຍ (Description)`)}</label>
                      <input type="text" className="form-control" placeholder="Description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">{db.getLabel('auto_ສະຕັອກປັດຈຸບັນ___ao6zho', `ສະຕັອກປັດຈຸບັນ *`)}</label>
                        <input type="number" className="form-control" required value={formData.stock_qty} onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{db.getLabel('auto_ແຈ້ງເຕືອນຕໍ່າສຸດ___1qfon9', `ແຈ້ງເຕືອນຕໍ່າສຸດ *`)}</label>
                        <input type="number" className="form-control" required value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
                      </div>
                    </div>

{hasInventoryPermission('inventoryViewCost') && (
                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ລາຄາຊື້___ຕົ້ນທຶນ__LAK____gxgyd5', `ລາຄາຊື້ / ຕົ້ນທຶນ (LAK) *`)}</label>
                      <input type="number" className="form-control" required value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} />
                    </div>
)}

                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ຮູບພາບວັດຖຸດິບ__Ingredien_9n3d7r', `ຮູບພາບວັດຖຸດິບ (Ingredient Photo)`)}</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            compressImage(file).then(compressedBase64 => {
                              setFormData(prev => ({ ...prev, image: compressedBase64 }));
                            }).catch(err => {
                              console.error('Compression failed, falling back:', err);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({ ...prev, image: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                      {formData.image && (
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={formData.image} alt="Raw Material Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px', height: '30px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }} onClick={() => setFormData(prev => ({ ...prev, image: '' }))}>{db.getLabel('auto_ລຶບຮູບ_cbsby2', `ລຶບຮູບ`)}</button>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ໝາຍເຫດ__Notes__lhjenz', `ໝາຍເຫດ (Notes)`)}</label>
                      <textarea className="form-control" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditMaterial(null);
                  setFormData({
                    name: '',
                    category: 'ອາຄຣີລິກ (Acrylic)',
                    unit: 'ແຜ່ນ',
                    stock_qty: '',
                    min_stock: '',
                    cost_price: '',
                    supplier: '',
                    barcode: '',
                    image: '',
                    description: '',
                    notes: ''
                  });
                }}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                <button type="submit" className="btn btn-primary">{db.getLabel('auto____ຢືນຢັນ_6x1o6d', `💾 ຢືນຢັນ`)}</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {showCsvModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto____ນຳເຂົ້າວັດຖຸດິບຜ່ານ_CS_9m5vux', `📥 ນຳເຂົ້າວັດຖຸດິບຜ່ານ CSV`)}</h3>
              <button className="close-btn" onClick={() => setShowCsvModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ວາງເນື້ອຫາໄຟລ໌ CSV ຂອງວັດຖຸດິບຕາມຮູບແບບດ້ານລຸ່ມນີ້ (ຫ້າມລົບແຖວຫົວຂໍ້ທຳອິດ):
              </p>
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(0, 0, 0, 0.2)' }}
                placeholder="ID,Name,Category,Unit,Stock Qty,Min Stock,Cost Price,Supplier&#10;,Acrylic sheet 2mm,acrylic,sheet,50,5,45000,PT Supplier"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <div className="modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCsvModal(false);
                  setCsvText('');
                }}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                <button type="button" className="btn btn-primary" onClick={handleImportCsv} disabled={!csvText.trim()}>{db.getLabel('auto____ຢືນຢັນການນຳເຂົ້າ_k7vx8l', `💾 ຢືນຢັນການນຳເຂົ້າ`)}</button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Mobile FAB to Add Raw Material */}
      <button 
        type="button" 
        className="fab-btn" 
        onClick={handleOpenAdd} 
        title={db.getLabel('auto_ເພີ່ມວັດຖຸດິບໃໝ່__Add_Raw_s3z1hv', `ເພີ່ມວັດຖຸດິບໃໝ່ (Add Raw Material)`)}
      >
        ➕
      </button>

    </div>
  );
}

// ==========================================
// 🏭 BOM FORMULA & MANUFACTURING SUB-VIEW
// ==========================================
function ManufacturingSubView({ isMobile, activeUser }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bomList, setBomList] = useState([]);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [matQty, setMatQty] = useState('');

  const [sheetW, setSheetW] = useState('30');
  const [sheetH, setSheetH] = useState('30');
  const [pieceW, setPieceW] = useState('4');
  const [pieceH, setPieceH] = useState('4');
  const [margin, setMargin] = useState('0.2');
  const [sheetCost, setSheetCost] = useState('50000');

  const [solverResult, setSolverResult] = useState({ yieldCount: 0, efficiency: 0, waste: 0, costPerUnit: 0, rows: 0, cols: 0 });
  const [produceQty, setProduceQty] = useState('10');
  const [productionHistory, setProductionHistory] = useState([]);

  // States for inline Product & Material creation in BOM
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodMinStock, setProdMinStock] = useState('2');
  const [prodUnit, setProdUnit] = useState('ອັນ');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodImage, setProdImage] = useState('');

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('ອາຄຣີລິກ (Acrylic)');
  const [matUnit, setMatUnit] = useState('ແຜ່ນ');
  const [matStockQty, setMatStockQty] = useState('0');
  const [matMinStock, setMatMinStock] = useState('0');
  const [matCostPrice, setMatCostPrice] = useState('0');
  const [matSupplier, setMatSupplier] = useState('');

  useEffect(() => {
    loadData();
    calculateAcrylicYield();
  }, []);

  const handleOpenAddProduct = () => {
    const activeCats = db.getCategories();
    const defaultCatId = activeCats.length > 0 ? activeCats[0].id : 'frames';
    const defaultCat = activeCats.find(c => c.id === defaultCatId);
    setProdName('');
    setProdCategory(defaultCat ? defaultCat.name : defaultCatId);
    setProdPrice('');
    setProdCost('');
    setProdStock('10');
    setProdMinStock('2');
    setProdUnit('ອັນ');
    setProdBarcode(String(Math.floor(100000 + Math.random() * 900000)));
    setProdImage('https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60');
    setShowAddProductModal(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const activeCats = db.getCategories();
    const existingCat = activeCats.find(c => c.id === prodCategory || c.name.toLowerCase() === prodCategory.trim().toLowerCase());
    let catId = '';
    if (existingCat) {
      catId = existingCat.id;
    } else {
      const newCat = db.addCategory({ name: prodCategory.trim(), icon: '📦', type: 'physical' });
      catId = newCat.id;
    }

    const isService = db.isServiceCategory(catId);
    const payload = {
      name: prodName,
      category: catId,
      price: Number(prodPrice),
      cost: Number(prodCost),
      stock: isService ? 0 : Number(prodStock),
      minStock: isService ? 0 : Number(prodMinStock),
      unit: prodUnit || (isService ? 'ຄັ້ງ' : 'ອັນ'),
      barcode: prodBarcode,
      image: prodImage
    };
    const newProd = db.addProduct(payload);
    setShowAddProductModal(false);
    setProdName('');
    setProdCategory('');
    setProdPrice('');
    setProdCost('');
    setProdStock('10');
    setProdMinStock('2');
    setProdUnit('ອັນ');
    setProdBarcode('');
    setProdImage('');
    loadData();
    handleSelectProduct(newProd);
  };

  const handleOpenAddMaterial = () => {
    setMatName('');
    setMatCategory('ອາຄຣີລິກ (Acrylic)');
    setMatUnit('ແຜ່ນ');
    setMatStockQty('0');
    setMatMinStock('0');
    setMatCostPrice('0');
    setMatSupplier('');
    setShowAddMaterialModal(true);
  };

  const handleSaveMaterial = (e) => {
    e.preventDefault();
    const payload = {
      name: matName,
      category: matCategory,
      unit: matUnit,
      stock_qty: Number(matStockQty),
      min_stock: Number(matMinStock),
      cost_price: Number(matCostPrice),
      supplier: matSupplier
    };
    const newMat = db.addRawMaterial(payload);
    setShowAddMaterialModal(false);
    setMatName('');
    setMatCategory('ອາຄຣີລິກ (Acrylic)');
    setMatUnit('ແຜ່ນ');
    setMatStockQty('0');
    setMatMinStock('0');
    setMatCostPrice('0');
    setMatSupplier('');
    const materialsList = db.getRawMaterials();
    setRawMaterials(materialsList);
    setSelectedMatId(newMat.id);
  };

  useEffect(() => {
    calculateAcrylicYield();
  }, [sheetW, sheetH, pieceW, pieceH, margin, sheetCost]);

  function loadData() {
    setProducts(db.getProducts().filter(p => !db.isServiceCategory(p.category)));
    setRawMaterials(db.getRawMaterials());
    setProductionHistory(db.getProductionHistory());
  };

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setBomList(p.bom || []);
  };

  const handleAddRecipeMaterial = (e) => {
    e.preventDefault();
    if (!selectedMatId || !matQty || isNaN(matQty) || Number(matQty) <= 0) {
      alert('ກະລຸນາເລືອກວັດຖຸດິບ ແລະ ປ້ອນຈຳນວນທີ່ຖືກຕ້ອງ');
      return;
    }
    const mat = rawMaterials.find(m => m.id === selectedMatId);
    if (!mat) return;

    const existingIdx = bomList.findIndex(b => b.materialId === selectedMatId);
    let updatedList = [...bomList];
    if (existingIdx !== -1) {
      updatedList[existingIdx].qty += Number(matQty);
    } else {
      updatedList.push({
        materialId: selectedMatId,
        materialName: mat.name,
        qty: Number(matQty)
      });
    }
    setBomList(updatedList);
    setSelectedMatId('');
    setMatQty('');
  };

  const handleRemoveRecipeMaterial = (matId) => {
    setBomList(bomList.filter(b => b.materialId !== matId));
  };

  const handleSaveRecipe = () => {
    if (!selectedProduct) return;
    const updatedProduct = {
      ...selectedProduct,
      bom: bomList
    };
    db.updateProduct(updatedProduct);
    alert('✓ ບັນທຶກສູດການຜະລິດສຳເລັດ!');
    loadData();
    setSelectedProduct(updatedProduct);
  };

  function calculateAcrylicYield() {
    const sW = parseFloat(sheetW) || 0;
    const sH = parseFloat(sheetH) || 0;
    const pW = parseFloat(pieceW) || 0;
    const pH = parseFloat(pieceH) || 0;
    const m = parseFloat(margin) || 0;
    const cost = parseFloat(sheetCost) || 0;

    if (sW <= 0 || sH <= 0 || pW <= 0 || pH <= 0) return;

    const cols = Math.floor(sW / (pW + m));
    const rows = Math.floor(sH / (pH + m));
    const yieldCount = cols * rows;
    
    let efficiency = 0;
    let waste = 100;
    let costPerUnit = 0;

    if (yieldCount > 0) {
      efficiency = ((yieldCount * pW * pH) / (sW * sH)) * 100;
      waste = 100 - efficiency;
      costPerUnit = cost / yieldCount;
    }

    setSolverResult({
      yieldCount,
      efficiency: Math.round(efficiency * 10) / 10,
      waste: Math.round(waste * 10) / 10,
      costPerUnit: Math.round(costPerUnit),
      rows,
      cols
    });
  };

  const calculateCapacity = (prod) => {
    if (!prod || !prod.bom || prod.bom.length === 0) return 0;
    const capacities = prod.bom.map(recipe => {
      const mat = rawMaterials.find(m => m.id === recipe.materialId);
      if (!mat) return 0;
      return Math.floor(mat.stock_qty / recipe.qty);
    });
    return Math.min(...capacities);
  };

  const handleExecuteProduction = () => {
    if (!selectedProduct) return;
    const qty = parseInt(produceQty);
    if (isNaN(qty) || qty <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນທີ່ຕ້ອງການຜະລິດ');
      return;
    }

    try {
      db.addProductionJob(selectedProduct.id, qty);
      alert('✓ ຜະລິດສິນຄ້າ ' + selectedProduct.name + ' ຈຳນວນ ' + qty + ' ອັນ ສຳເລັດ!');
      loadData();
      const updatedProd = db.getProducts().find(p => p.id === selectedProduct.id);
      setSelectedProduct(updatedProd);
    } catch (err) {
      alert('⚠ ຂໍ້ຜິດພາດໃນການຜະລິດ: ' + err.message);
    }
  };

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
      
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: 0 }}>{db.getLabel('auto____ເລືອກສິນຄ້າເພື່ອຈັດການ_6uv8fi', `📦 ເລືອກສິນຄ້າເພື່ອຈັດການ`)}</h3>
{hasInventoryPermission('inventoryAddProduct') && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}
            onClick={handleOpenAddProduct}
          >
            ➕ ເພີ່ມສິນຄ້າໃໝ່
          </button>
)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '450px', overflowY: 'auto' }}>
          {products.map(p => {
            const hasBOM = p.bom && p.bom.length > 0;
            return (
              <button
                key={p.id}
                type="button"
                className="btn"
                style={{
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  border: selectedProduct?.id === p.id ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                  background: selectedProduct?.id === p.id ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  color: selectedProduct?.id === p.id ? 'var(--gold-primary)' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handleSelectProduct(p)}
              >
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                <span style={{ fontSize: '0.7rem', color: hasBOM ? 'var(--success-green)' : 'var(--text-secondary)' }}>
                  {hasBOM ? '✓ ມີສູດ' : '⚠ ບໍ່ມີສູດ'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {selectedProduct ? (
          <>
            <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                  🧪 ສູດການຜະລິດ (BOM Formula Recipe) - {selectedProduct.name}
                </h3>
                <form onSubmit={handleAddRecipeMaterial} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <select
                    className="form-control"
                    required
                    style={{ flexGrow: 1 }}
                    value={selectedMatId}
                    onChange={(e) => setSelectedMatId(e.target.value)}
                  >
                    <option value="">{db.getLabel('auto____ເລືອກວັດຖຸດິບ____6sfv84', `-- ເລືອກວັດຖຸດິບ --`)}</option>
                    {rawMaterials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.stock_qty} {m.unit})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 10px', fontSize: '0.85rem' }}
                    onClick={handleOpenAddMaterial}
                    title={db.getLabel('auto_ເພີ່ມວັດຖຸດິບໃໝ່_w4cts', `ເພີ່ມວັດຖຸດິບໃໝ່`)}
                  >
                    ➕
                  </button>
                  <input
                    type="number"
                    step="0.001"
                    required
                    className="form-control"
                    style={{ width: '90px' }}
                    placeholder={db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>{db.getLabel('auto_ເພີ່ມ_bgbfbk', `ເພີ່ມ`)}</button>
                </form>

                <div style={{ minHeight: '120px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', background: 'rgba(0,0,0,0.1)' }}>
                  {bomList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      ຍັງບໍ່ທັນມີວັດຖຸດິບໃນສູດການຜະລິດ.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {bomList.map(item => (
                        <div key={item.materialId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '8px 14px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.materialName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>{item.qty}</span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '1rem' }}
                              onClick={() => handleRemoveRecipeMaterial(item.materialId)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '14px' }} onClick={handleSaveRecipe}>
                  💾 ບັນທຶກສູດການຜະລິດ (Save BOM)
                </button>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                    🏭 ຜະລິດສິນຄ້າ (Execute Manufacturing)
                  </h3>
                  
                  <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed var(--gold-primary)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ກຳລັງການຜະລິດສູງສຸດ__Max__hkfx8e', `ກຳລັງການຜະລິດສູງສຸດ (Max Yield Capacity):`)}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>
                      {calculateCapacity(selectedProduct)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{db.getLabel('auto_ອັນ_27yph', `ອັນ`)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      * ຄຳນວນຈາກວັດຖຸດິບຄົງເຫຼືອໃນສະຕັອກ
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ຈຳນວນທີ່ຕ້ອງການຜະລິດ_5ex9tr', `ຈຳນວນທີ່ຕ້ອງການຜະລິດ`)}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={produceQty}
                      onChange={(e) => setProduceQty(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', background: 'var(--success-green)', borderColor: 'var(--success-green)', color: 'black', fontWeight: 'bold' }}
                  onClick={handleExecuteProduction}
                  disabled={calculateCapacity(selectedProduct) <= 0}
                >
                  🚀 ສັ່ງຜະລິດສິນຄ້າ (Manufacture)
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 14px' }}>
                📐 ເຄື່ອງຄິດໄລ່ແຜ່ນອາຄຣີລິກ (Acrylic Sheet Cutting Solver)
              </h3>
              
              <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ກວ້າງແຜ່ນ__Sheet_W___cm__3uypai', `ກວ້າງແຜ່ນ (Sheet W - cm)`)}</label>
                      <input type="number" className="form-control" value={sheetW} onChange={(e) => setSheetW(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ສູງແຜ່ນ__Sheet_H___cm__k6nuu1', `ສູງແຜ່ນ (Sheet H - cm)`)}</label>
                      <input type="number" className="form-control" value={sheetH} onChange={(e) => setSheetH(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ກວ້າງຊິ້ນງານ__Piece_W___c_6zpyfn', `ກວ້າງຊິ້ນງານ (Piece W - cm)`)}</label>
                      <input type="number" className="form-control" value={pieceW} onChange={(e) => setPieceW(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ສູງຊິ້ນງານ__Piece_H___cm__jteof2', `ສູງຊິ້ນງານ (Piece H - cm)`)}</label>
                      <input type="number" className="form-control" value={pieceH} onChange={(e) => setPieceH(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ໄລຍະຫ່າງ_ຄວາມໜາໃ_ຕັດ__Was_lr8x6g', `ໄລຍະຫ່າງ/ຄວາມໜາໃบຕັດ (Waste margin - cm)`)}</label>
                    <input type="number" step="0.1" className="form-control" value={margin} onChange={(e) => setMargin(e.target.value)} />
                  </div>

{hasInventoryPermission('inventoryViewCost') && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ຕົ້ນທຶນແຜ່ນອາຄຣີລິກ__Shee_a6e5y7', `ຕົ້ນທຶນແຜ່ນອາຄຣີລິກ (Sheet Cost - LAK)`)}</label>
                    <input type="number" className="form-control" value={sheetCost} onChange={(e) => setSheetCost(e.target.value)} />
                  </div>
)}

                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '12px', marginTop: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{db.getLabel('auto_ຈຳນວນຊິ້ນງານທີ່ໄດ້__9n66nr', `ຈຳນວນຊິ້ນງານທີ່ໄດ້:`)}</span>
                      <b style={{ color: 'var(--gold-primary)' }}>{solverResult.yieldCount} {db.getLabel('auto_ຊິ້ນ_1w8pne', `ຊິ້ນ`)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{db.getLabel('auto_ອັດຕາໃຊ້ງານ__Yield___2xmlzx', `ອັດຕາໃຊ້ງານ (Yield):`)}</span>
                      <b style={{ color: 'var(--success-green)' }}>{solverResult.efficiency}%</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{db.getLabel('auto_ອັດຕາເສຍເສດ__Waste___actz7z', `ອັດຕາເສຍເສດ (Waste):`)}</span>
                      <b style={{ color: 'var(--alert-red)' }}>{solverResult.waste}%</b>
                    </div>
{hasInventoryPermission('inventoryViewCost') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                      <span>{db.getLabel('auto_ຕົ້ນທຶນສະເລ່ຍ__ytym4a', `ຕົ້ນທຶນສະເລ່ຍ:`)}</span>
                      <b style={{ color: 'white' }}>{solverResult.costPerUnit.toLocaleString()} {db.getLabel('auto_____ຊິ້ນ_lqn56m', `₭ / ຊິ້ນ`)}</b>
                    </div>
)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ຕົວຢ່າງການຈັດວາງແຜ່ນຕັ_wt6ctz', `📺 ຕົວຢ່າງການຈັດວາງແຜ່ນຕັດ (Simulated Cutting Layout Grid):`)}</span>
                  <div style={{
                    width: '100%',
                    height: '240px',
                    background: '#151311',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px'
                  }}>
                    {solverResult.yieldCount > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(' + solverResult.cols + ', 1fr)',
                        gridTemplateRows: 'repeat(' + solverResult.rows + ', 1fr)',
                        gap: '2px',
                        width: '90%',
                        height: '90%',
                        background: 'rgba(212,175,55,0.02)',
                        border: '1.5px dashed rgba(212,175,55,0.2)',
                        padding: '4px'
                      }}>
                        {Array.from({ length: solverResult.yieldCount }).map((_, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(212,175,55,0.1)',
                              border: '1px solid var(--gold-primary)',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              color: 'var(--gold-primary)'
                            }}
                          >
                            P{idx + 1}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{db.getLabel('auto_ຂະໜາດຊິ້ນງານໃຫຍ່ເກີນແຜ່ນອ_4h13ko', `ຂະໜາດຊິ້ນງານໃຫຍ່ເກີນແຜ່ນອາຄຣີລິກ!`)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                📜 ປະຫວັດການຜະລິດສິນຄ້າ (Production History)
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>{db.getLabel('auto_ວັນທີ_btqrbn', `ວັນທີ`)}</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>{db.getLabel('auto_ຊື່ສິນຄ້າ_18q1y1', `ຊື່ສິນຄ້າ`)}</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>{db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>{db.getLabel('auto_ຕົ້ນທຶນສະເລ່ຍ_cmh35g', `ຕົ້ນທຶນສະເລ່ຍ`)}</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>{db.getLabel('auto_ຕົ້ນທຶນລວມ_4dfm0r', `ຕົ້ນທຶນລວມ`)}</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>{db.getLabel('auto_ຜູ້ສັ່ງຜະລິດ_eotxb3', `ຜູ້ສັ່ງຜະລິດ`)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionHistory.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <td style={{ padding: '8px' }}>{new Date(h.createdAt).toLocaleDateString('lo-LA')}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{h.productName}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--success-green)', fontWeight: 'bold' }}>+{h.qty}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{hasInventoryPermission('inventoryViewCost') ? `${h.costPerUnit.toLocaleString()} ₭` : '*** ₭'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{hasInventoryPermission('inventoryViewCost') ? `${h.totalCost.toLocaleString()} ₭` : '*** ₭'}</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{h.createdByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            👈 ກະລຸນາເລືອກສິນຄ້າຈາກລາຍການດ້ານຊ້າຍມືເພື່ອຈັດການສູດການຜະລິດ ຫຼື ສັ່ງຜະລິດ.
          </div>
        )}
      </div>

      {/* Modal overlays for Product & Raw Material creation inside BOM */}
      {showAddProductModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto___ເພີ່ມສິນຄ້າໃໝ່__Add_Pro_6ynwes', `➕ ເພີ່ມສິນຄ້າໃໝ່ (Add Product)`)}</h3>
              <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAddProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ຊື່ສິນຄ້າ__Product_Name__aw6958', `ຊື່ສິນຄ້າ (Product Name)`)}</label>
                <input type="text" className="form-control" required value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ໝວດໝູ່__Category__1el2u7', `ໝວດໝູ່ (Category)`)}</label>
                  <input
                    type="text"
                    className="form-control"
                    list="prod-categories-datalist-bom"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    required
                  />
                  <datalist id="prod-categories-datalist-bom">
                    {db.getCategories().map(cat => (
                      <option key={cat.id} value={cat.name} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຫົວໜ່ວຍ__Unit__ogidx0', `ຫົວໜ່ວຍ (Unit)`)}</label>
                  <input type="text" className="form-control" required value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ລາຄາຂາຍ__Price_LAK__6l9k24', `ລາຄາຂາຍ (Price LAK)`)}</label>
                  <input type="number" className="form-control" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນ__Cost_LAK__2wdcna', `ຕົ້ນທຶນ (Cost LAK)`)}</label>
                  <input type="number" className="form-control" required value={prodCost} onChange={(e) => setProdCost(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຈຳນວນສະຕັອກ_4sia96', `ຈຳນວນສະຕັອກ`)}</label>
                  <input type="number" className="form-control" required value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ເຕືອນຕໍ່າສຸດ_7uowc6', `ເຕືອນຕໍ່າສຸດ`)}</label>
                  <input type="number" className="form-control" required value={prodMinStock} onChange={(e) => setProdMinStock(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ລະຫັດບາໂຄ້ດ__Barcode__njohbt', `ລະຫັດບາໂຄ້ດ (Barcode)`)}</label>
                <input type="text" className="form-control" required value={prodBarcode} onChange={(e) => setProdBarcode(e.target.value)} />
              </div>
              <div className="modal-footer" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddProductModal(false);
                  setProdName('');
                  setProdCategory('');
                  setProdPrice('');
                  setProdCost('');
                  setProdStock('10');
                  setProdMinStock('2');
                  setProdUnit('ອັນ');
                  setProdBarcode('');
                  setProdImage('');
                }}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                <button type="submit" className="btn btn-primary">{db.getLabel('auto____ຢືນຢັນ_6x1o6d', `💾 ຢືນຢັນ`)}</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {showAddMaterialModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '450px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto___ເພີ່ມວັດຖຸດິບໃໝ່__Add_R_4onk54', `➕ ເພີ່ມວັດຖຸດິບໃໝ່ (Add Raw Material)`)}</h3>
              <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAddMaterialModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ຊື່ວັດຖຸດິບ__Material_Nam_rkznyi', `ຊື່ວັດຖຸດິບ (Material Name)`)}</label>
                <input type="text" className="form-control" required value={matName} onChange={(e) => setMatName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ໝວດໝູ່__Category__1el2u7', `ໝວດໝູ່ (Category)`)}</label>
                  <input
                    type="text"
                    className="form-control"
                    list="raw-material-categories-datalist-bom"
                    value={matCategory}
                    onChange={(e) => setMatCategory(e.target.value)}
                    required
                  />
                  <datalist id="raw-material-categories-datalist-bom">
                    {Array.from(new Set([
                      'ອາຄຣີລິກ (Acrylic)', 'ໄມ້/ຂອບໄມ້ (Wood)', 'ແກ້ວ/ເລນ (Glass)', 'ກາວ/ອຸປະກອນ (Glue/Chemicals)', 'ອື່ນໆ (Other)',
                      ...rawMaterials.map(m => m.category).filter(Boolean)
                    ])).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຫົວໜ່ວຍ__Unit__ogidx0', `ຫົວໜ່ວຍ (Unit)`)}</label>
                  <input type="text" className="form-control" placeholder={db.getLabel('auto_ແຜ່ນ__ອັນ__ກ່ອງ_____jfpqic', `ແຜ່ນ, ອັນ, ກ່ອງ,...`)} required value={matUnit} onChange={(e) => setMatUnit(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຈຳນວນສະຕັອກ_4sia96', `ຈຳນວນສະຕັອກ`)}</label>
                  <input type="number" className="form-control" required value={matStockQty} onChange={(e) => setMatStockQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຈຳນວນເຕືອນຕໍ່າສຸດ_bc9iy2', `ຈຳນວນເຕືອນຕໍ່າສຸດ`)}</label>
                  <input type="number" className="form-control" required value={matMinStock} onChange={(e) => setMatMinStock(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ຕົ້ນທຶນຕໍ່ໜ່ວຍ__Cost_LAK__aavg80', `ຕົ້ນທຶນຕໍ່ໜ່ວຍ (Cost LAK)`)}</label>
                <input type="number" className="form-control" required value={matCostPrice} onChange={(e) => setMatCostPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ຜູ້ສະໜອງ__Supplier__v8027l', `ຜູ້ສະໜອງ (Supplier)`)}</label>
                <input type="text" className="form-control" value={matSupplier} onChange={(e) => setMatSupplier(e.target.value)} />
              </div>
              <div className="modal-footer" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddMaterialModal(false);
                  setMatName('');
                  setMatCategory('ອາຄຣີລິກ (Acrylic)');
                  setMatUnit('ແຜ່ນ');
                  setMatStockQty('0');
                  setMatMinStock('0');
                  setMatCostPrice('0');
                  setMatSupplier('');
                }}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                <button type="submit" className="btn btn-primary">{db.getLabel('auto____ຢືນຢັນ_6x1o6d', `💾 ຢືນຢັນ`)}</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}


const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function PurchaseOrdersSubView({ isMobile, activeUser, onUpdate }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };

  const [section, setSection] = useState('orders'); // 'orders' | 'suppliers'
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Supplier modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', contact: '', address: '', note: '' });

  // PO modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNote, setPoNote] = useState('');
  const [poLines, setPoLines] = useState([]);
  const [poProductId, setPoProductId] = useState('');
  const [poError, setPoError] = useState('');

  useEffect(() => {
    loadAll();
    const handler = () => loadAll();
    window.addEventListener('db-updated', handler);
    return () => window.removeEventListener('db-updated', handler);
  }, []);

  function loadAll() {
    setSuppliers(db.getSuppliers());
    setPurchaseOrders(db.getPurchaseOrders());
    setProducts(db.getProducts());
  }

  const refresh = () => {
    loadAll();
    if (onUpdate) onUpdate();
  };

  // ── Suppliers ──
  const openAddSupplier = () => {
    setEditSupplier(null);
    setSupplierForm({ name: '', phone: '', contact: '', address: '', note: '' });
    setShowSupplierModal(true);
  };
  const openEditSupplier = (s) => {
    setEditSupplier(s);
    setSupplierForm({ name: s.name || '', phone: s.phone || '', contact: s.contact || '', address: s.address || '', note: s.note || '' });
    setShowSupplierModal(true);
  };
  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    if (editSupplier) {
      db.updateSupplier(editSupplier.id, supplierForm);
    } else {
      db.addSupplier(supplierForm);
    }
    setShowSupplierModal(false);
    refresh();
  };
  const handleDeleteSupplier = (s) => {
    if (window.confirm(`ລຶບຜູ້ສະໜອງ "${s.name}"?`)) {
      db.deleteSupplier(s.id);
      refresh();
    }
  };

  // ── Purchase Orders ──
  const openCreatePo = () => {
    setPoSupplierId('');
    setPoNote('');
    setPoLines([]);
    setPoProductId('');
    setPoError('');
    setShowPoModal(true);
  };
  const addPoLine = () => {
    if (!poProductId) return;
    if (poLines.some(l => l.productId === poProductId)) return;
    const prod = products.find(p => p.id === poProductId);
    if (!prod) return;
    setPoLines(prev => [...prev, { productId: prod.id, name: prod.name, qty: 1, cost: Number(prod.cost) || 0 }]);
    setPoProductId('');
  };
  const updatePoLine = (productId, field, value) => {
    setPoLines(prev => prev.map(l => l.productId === productId ? { ...l, [field]: value === '' ? '' : Number(value) } : l));
  };
  const removePoLine = (productId) => {
    setPoLines(prev => prev.filter(l => l.productId !== productId));
  };
  const poTotal = poLines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0);
  const handleCreatePo = () => {
    setPoError('');
    const items = poLines
      .map(l => ({ productId: l.productId, name: l.name, qty: Number(l.qty) || 0, cost: Number(l.cost) || 0 }))
      .filter(l => l.qty > 0);
    if (items.length === 0) {
      setPoError('ກະລຸນາເພີ່ມສິນຄ້າ ແລະ ໃສ່ຈຳນວນ');
      return;
    }
    const supplier = suppliers.find(s => s.id === poSupplierId);
    db.addPurchaseOrder({
      supplierId: poSupplierId,
      supplierName: supplier ? supplier.name : '',
      note: poNote.trim(),
      items,
      createdBy: activeUser?.name || ''
    });
    setShowPoModal(false);
    refresh();
  };
  const handleReceivePo = (po) => {
    if (window.confirm(`ຮັບສິນຄ້າຂອງໃບສັ່ງຊື້ ${po.id} ເຂົ້າສະຕັອກ? ຈຳນວນສະຕັອກຈະຖືກເພີ່ມອັດຕະໂນມັດ.`)) {
      db.receivePurchaseOrder(po.id);
      refresh();
    }
  };
  const handleDeletePo = (po) => {
    if (window.confirm(`ລຶບໃບສັ່ງຊື້ ${po.id}?`)) {
      db.deletePurchaseOrder(po.id);
      refresh();
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { label: '⏳ ລໍຖ້າຮັບ', color: '#f39c12', bg: 'rgba(243,156,18,0.12)' },
      received: { label: '✅ ຮັບແລ້ວ', color: '#2ecc71', bg: 'rgba(46,204,113,0.12)' },
      cancelled: { label: '❌ ຍົກເລີກ', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' }
    };
    const s = map[status] || map.pending;
    return <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold', color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>{s.label}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" className={`nav-tab ${section === 'orders' ? 'active' : ''}`} onClick={() => setSection('orders')}>{db.getLabel('auto____ໃບສັ່ງຊື້__Purchase_Or_yegfv0', `🧾 ໃບສັ່ງຊື້ (Purchase Orders)`)}</button>
        <button type="button" className={`nav-tab ${section === 'suppliers' ? 'active' : ''}`} onClick={() => setSection('suppliers')}>{db.getLabel('auto____ຜູ້ສະໜອງ__Suppliers__m6yb7c', `🏢 ຜູ້ສະໜອງ (Suppliers)`)}</button>
      </div>

      {section === 'suppliers' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.4rem', margin: 0 }}>{db.getLabel('auto____ຜູ້ສະໜອງ__Suppliers__m6yb7c', `🏢 ຜູ້ສະໜອງ (Suppliers)`)}</h2>
            <button type="button" className="btn btn-primary" onClick={openAddSupplier}>{db.getLabel('auto___ເພີ່ມຜູ້ສະໜອງ_s3ffrr', `➕ ເພີ່ມຜູ້ສະໜອງ`)}</button>
          </div>
          {suppliers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>ຍັງບໍ່ມີຜູ້ສະໜອງ — ກົດ "ເພີ່ມຜູ້ສະໜອງ" ເພື່ອເລີ່ມ</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ລະຫັດ_buuljx', `ລະຫັດ`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ຊື່_278xn', `ຊື່`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ເບີໂທ_bgdzf4', `ເບີໂທ`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ຜູ້ຕິດຕໍ່_ms4dev', `ຜູ້ຕິດຕໍ່`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ທີ່ຢູ່_iy5pix', `ທີ່ຢູ່`)}</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>{db.getLabel('auto_ຈັດການ_q4z3sz', `ຈັດການ`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--gold-primary)' }}>{s.id}</td>
                      <td style={{ padding: '10px 8px', color: 'white' }}>{s.name}</td>
                      <td style={{ padding: '10px 8px' }}>{s.phone || '-'}</td>
                      <td style={{ padding: '10px 8px' }}>{s.contact || '-'}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{s.address || '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn btn-sm btn-secondary" style={{ marginRight: '6px' }} onClick={() => openEditSupplier(s)}>✏️</button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteSupplier(s)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {section === 'orders' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.4rem', margin: 0 }}>{db.getLabel('auto____ໃບສັ່ງຊື້__Purchase_Or_yegfv0', `🧾 ໃບສັ່ງຊື້ (Purchase Orders)`)}</h2>
            <button type="button" className="btn btn-primary" onClick={openCreatePo}>{db.getLabel('auto___ສ້າງໃບສັ່ງຊື້_i5spr4', `➕ ສ້າງໃບສັ່ງຊື້`)}</button>
          </div>
          {purchaseOrders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>ຍັງບໍ່ມີໃບສັ່ງຊື້ — ສ້າງໃບສັ່ງຊື້ເພື່ອສັ່ງເຕີມສະຕັອກ, ເມື່ອຮັບຂອງແລ້ວກົດ "ຮັບເຂົ້າສະຕັອກ"</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ລະຫັດ_buuljx', `ລະຫັດ`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ວັນທີ_btqrbn', `ວັນທີ`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ຜູ້ສະໜອງ_zfa9s4', `ຜູ້ສະໜອງ`)}</th>
                    <th style={{ padding: '10px 8px' }}>{db.getLabel('auto_ລາຍການ_ce8qoo', `ລາຍການ`)}</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>{db.getLabel('auto_ມູນຄ່າ_____bls8a7', `ມູນຄ່າ (₭)`)}</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>{db.getLabel('auto_ສະຖານະ_a1xh9j', `ສະຖານະ`)}</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>{db.getLabel('auto_ຈັດການ_q4z3sz', `ຈັດການ`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...purchaseOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).map(po => (
                    <tr key={po.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--gold-primary)' }}>{po.id}</td>
                      <td style={{ padding: '10px 8px' }}>{new Date(po.date).toLocaleDateString('lo-LA')}</td>
                      <td style={{ padding: '10px 8px' }}>{po.supplierName || '-'}</td>
                      <td style={{ padding: '10px 8px' }}>{(po.items || []).map(it => `${it.name} ×${it.qty}`).join(', ')}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: hasInventoryPermission('inventoryViewCost') ? 'white' : 'var(--text-secondary)' }}>{hasInventoryPermission('inventoryViewCost') ? (po.total || 0).toLocaleString() : '***'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{statusBadge(po.status)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {po.status === 'pending' && (
                          <button type="button" className="btn btn-sm btn-primary" style={{ marginRight: '6px' }} onClick={() => handleReceivePo(po)}>{db.getLabel('auto____ຮັບເຂົ້າສະຕັອກ_qopf7d', `📥 ຮັບເຂົ້າສະຕັອກ`)}</button>
                        )}
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeletePo(po)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header">
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{editSupplier ? '✏️ ແກ້ໄຂຜູ້ສະໜອງ' : '➕ ເພີ່ມຜູ້ສະໜອງ'}</h3>
                <button className="close-btn" onClick={() => setShowSupplierModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveSupplier}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ຊື່ຜູ້ສະໜອງ___3tiz49', `ຊື່ຜູ້ສະໜອງ *`)}</label>
                    <input type="text" className="form-control" required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ເບີໂທ_bgdzf4', `ເບີໂທ`)}</label>
                    <input type="text" className="form-control" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ຜູ້ຕິດຕໍ່_ms4dev', `ຜູ້ຕິດຕໍ່`)}</label>
                    <input type="text" className="form-control" value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ທີ່ຢູ່_iy5pix', `ທີ່ຢູ່`)}</label>
                    <input type="text" className="form-control" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ໝາຍເຫດ_e4bdxt', `ໝາຍເຫດ`)}</label>
                    <input type="text" className="form-control" value={supplierForm.note} onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary">{db.getLabel('auto_ບັນທຶກ___klj66l', `ບັນທຶກ ✓`)}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Purchase Order Modal */}
      {showPoModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content glass-card" style={{ padding: '24px', maxWidth: '620px', width: '100%', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto___ສ້າງໃບສັ່ງຊື້__Purchase_gh5yvi', `➕ ສ້າງໃບສັ່ງຊື້ (Purchase Order)`)}</h3>
                <button className="close-btn" onClick={() => setShowPoModal(false)}>✕</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{db.getLabel('auto_ຜູ້ສະໜອງ__Supplier__v8027l', `ຜູ້ສະໜອງ (Supplier)`)}</label>
                    <select className="form-control" value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)}>
                      <option value="">{db.getLabel('auto___ບໍ່ລະບຸ___4sdl3u', `— ບໍ່ລະບຸ —`)}</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{db.getLabel('auto_ໝາຍເຫດ_e4bdxt', `ໝາຍເຫດ`)}</label>
                    <input type="text" className="form-control" value={poNote} onChange={(e) => setPoNote(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{db.getLabel('auto_ເພີ່ມສິນຄ້າ_jikg4y', `ເພີ່ມສິນຄ້າ`)}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="form-control" value={poProductId} onChange={(e) => setPoProductId(e.target.value)}>
                      <option value="">{db.getLabel('auto___ເລືອກສິນຄ້າ___juhw2c', `— ເລືອກສິນຄ້າ —`)}</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={addPoLine}>{db.getLabel('auto___ເພີ່ມ_606xej', `➕ ເພີ່ມ`)}</button>
                  </div>
                </div>

                {poLines.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {poLines.map(l => (
                      <div key={l.productId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}</span>
                          <input type="number" min="1" className="form-control" value={l.qty} onChange={(e) => updatePoLine(l.productId, 'qty', e.target.value)} style={{ width: '72px', textAlign: 'center' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຕົ້ນທຶນ_ໜ່ວຍ_qaqin1', `ຕົ້ນທຶນ/ໜ່ວຍ`)}</span>
                          <input type="number" min="0" className="form-control" value={l.cost} onChange={(e) => updatePoLine(l.productId, 'cost', e.target.value)} style={{ width: '100px', textAlign: 'right' }} />
                        </div>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removePoLine(l.productId)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {poError && <p style={{ color: 'var(--alert-red)', fontSize: '0.85rem', margin: 0 }}>⚠️ {poError}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ມູນຄ່າລວມ_dfn25u', `ມູນຄ່າລວມ`)}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{poTotal.toLocaleString()} ₭</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPoModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                <button type="button" className="btn btn-primary" disabled={poLines.length === 0} onClick={handleCreatePo}>{db.getLabel('auto_ບັນທຶກໃບສັ່ງຊື້___74us4u', `ບັນທຶກໃບສັ່ງຊື້ ✓`)}</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default function Inventory({ activeUser, onUpdate, initialFilter, onFilterChange, isMobile }) {
  const hasInventoryPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [editorImageToEdit, setEditorImageToEdit] = useState('');
  const [selectedEditImageIdx, setSelectedEditImageIdx] = useState(-1);
  
  // Search & Sorting states
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodSortMode, setProdSortMode] = useState('none');
  
  // Category tabs & filter
  const [selectedCatFilter, setSelectedCatFilter] = useState(initialFilter || 'all');
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [newCatType, setNewCatType] = useState('physical');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (initialFilter) {
      setSelectedCatFilter(initialFilter);
    }
  }, [initialFilter]);

  const changeCatFilter = (filterId) => {
    setSelectedCatFilter(filterId);
    if (onFilterChange) onFilterChange(filterId);
  };
  
  // Barcode Printer States
  const [selectedBarcodeProd, setSelectedBarcodeProd] = useState(null);
  const [customBarcodeText, setCustomBarcodeText] = useState('885001');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodePrintQty, setBarcodePrintQty] = useState(1);
  const [barcodeFormat, setBarcodeFormat] = useState(localStorage.getItem('barcode_format') || 'CODE128');
  const [barcodeFormatSearch, setBarcodeFormatSearch] = useState('');
  const [bulkBarcodeFormatSearch, setBulkBarcodeFormatSearch] = useState('');

  const handleBarcodeFormatChange = (format) => {
    setBarcodeFormat(format);
    localStorage.setItem('barcode_format', format);
  };

  // Bulk Barcode States
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);
  const [bulkPrintQtys, setBulkPrintQtys] = useState({}); // { [productId]: quantity }
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkCatFilter, setBulkCatFilter] = useState('all');
  
  // Warehouse Stock states
  const [showWarehouseRestockModal, setShowWarehouseRestockModal] = useState(false);
  const [showWarehouseTransferModal, setShowWarehouseTransferModal] = useState(false);
  const [warehouseActiveProduct, setWarehouseActiveProduct] = useState(null);
  const [warehouseRestockQty, setWarehouseRestockQty] = useState('');
  const [warehouseRestockNotes, setWarehouseRestockNotes] = useState('');
  const [warehouseTransferQty, setWarehouseTransferQty] = useState('');
  const [warehouseTransferNotes, setWarehouseTransferNotes] = useState('');
  
  // Product Form states
  const [formData, setFormData] = useState({
    name: '',
    category: (db.getCategories()[0] || { id: 'frames' }).id,
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: 'ອັນ',
    barcode: '',
    image: '',
    showOnline: true,
    priceOnline: '',
    priceVip: ''
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const barcodeCanvasRef = useRef(null);

  // Scanner helper modal state
  const [showScanHelperModal, setShowScanHelperModal] = useState(false);
  const [scanHelperInput, setScanHelperInput] = useState('');
  const scanInputRef = useRef(null);

  useEffect(() => {
    if (showScanHelperModal && scanInputRef.current) {
      setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 150);
    }
  }, [showScanHelperModal]);


  useEffect(() => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
  }, [showModal, showBarcodeModal, showBulkBarcodeModal, showCategoryModal]);

  useEffect(() => {
    if (showBarcodeModal && barcodeCanvasRef.current) {
      const textToGen = selectedBarcodeProd ? selectedBarcodeProd.barcode : customBarcodeText;
      generateBarcode(barcodeCanvasRef.current, textToGen, barcodeFormat);
    }
  }, [showBarcodeModal, selectedBarcodeProd, customBarcodeText, barcodeFormat]);

  const handleDeleteProduct = (p) => {
    const pass = prompt('ກະລຸນາປ້ອນລະຫັດຜ່ານຜູ້ດູແລລະບົບ (Admin Passcode) ເພື່ອລົບສິນຄ້າ:');
    if (!pass) return;
    
    const users = db.getUsers();
    const isAdmin = users.some(u => u.passcode === pass && (u.permissions?.admin || u.role === 'owner'));
    if (!isAdmin) {
      alert('ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!');
      return;
    }
    
    if (confirm(`ທ່ານຕ້ອງການລົບສິນຄ້າ "${p.name}" ແທ້ຫຼືບໍ່?`)) {
      db.deleteProduct(p.id);
      setProducts(db.getProducts());
      alert('✓ ລົບສິນຄ້າສຳເລັດ!');
    }
  };

  const handleOpenAdd = () => {
    setEditProduct(null);
    const activeCats = db.getCategories();
    
    // Pick default category based on active filter
    let defaultCat = activeCats[0];
    if (selectedCatFilter && selectedCatFilter !== 'all' && selectedCatFilter !== 'low_stock' && selectedCatFilter !== 'physical') {
      if (selectedCatFilter === 'service') {
        const serviceCat = activeCats.find(c => db.isServiceCategory(c.id));
        if (serviceCat) defaultCat = serviceCat;
      } else {
        const matched = activeCats.find(c => c.id === selectedCatFilter);
        if (matched) defaultCat = matched;
      }
    }
    
    const isService = defaultCat ? db.isServiceCategory(defaultCat.id) : false;
    setFormData({
      name: '',
      category: defaultCat ? defaultCat.id : '',
      price: '',
      cost: '',
      stock: isService ? '0' : '10',
      minStock: isService ? '0' : '2',
      unit: isService ? 'ຄັ້ງ' : 'ອັນ',
      barcode: String(Math.floor(100000 + Math.random() * 900000)),
      image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60',
      images: [],
      showOnline: !isService,
      priceOnline: '',
      priceVip: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditProduct(p);
    const activeCats = db.getCategories();
    const cat = activeCats.find(c => c.id === p.category);
    setFormData({
      name: p.name,
      category: cat ? cat.id : p.category,
      price: p.price,
      cost: p.cost,
      stock: db.isServiceCategory(p.category) ? 0 : p.stock,
      minStock: db.isServiceCategory(p.category) ? 0 : p.minStock,
      unit: p.unit,
      barcode: p.barcode,
      image: p.image,
      images: p.images || (p.image ? [p.image] : []),
      showOnline: p.showOnline !== undefined ? p.showOnline : !db.isServiceCategory(p.category),
      priceOnline: p.priceOnline !== undefined ? p.priceOnline : p.price,
      priceVip: p.priceVip !== undefined ? p.priceVip : p.price,
      description: p.description || ''
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const activeCats = db.getCategories();
    const existingCat = activeCats.find(c => c.id === formData.category || c.name.toLowerCase() === formData.category.trim().toLowerCase());
    let catId = '';
    if (existingCat) {
      catId = existingCat.id;
    } else {
      const newCat = db.addCategory({ name: formData.category.trim(), icon: '📦', type: 'physical' });
      catId = newCat.id;
    }

    const isService = db.isServiceCategory(catId);
    const payload = {
      ...formData,
      category: catId,
      stock: isService ? 0 : Number(formData.stock),
      minStock: isService ? 0 : Number(formData.minStock),
      price: Number(formData.price),
      cost: Number(formData.cost),
      priceOnline: Number(formData.priceOnline || formData.price),
      priceVip: Number(formData.priceVip || formData.price),
      showOnline: !!formData.showOnline,
      unit: formData.unit || (isService ? 'ຄັ້ງ' : 'ອັນ')
    };
    if (editProduct) {
      db.updateProduct({
        ...editProduct,
        ...payload
      });
    } else {
      db.addProduct(payload);
    }
    setShowModal(false);
    setProducts(db.getProducts());
    if (onUpdate) onUpdate();
  };

  const openCategoryAdd = () => {
    setCategoryError('');
    setEditingCategory(null);
    setNewCatName('');
    setNewCatIcon('📦');
    setNewCatType('physical');
    setShowCategoryModal(true);
  };

  const openCategoryEdit = (cat) => {
    setCategoryError('');
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon || '📦');
    setNewCatType(cat.type || (db.isServiceCategory(cat.id) ? 'service' : 'physical'));
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      if (editingCategory) {
        db.updateCategory({
          id: editingCategory.id,
          name: newCatName.trim(),
          icon: newCatIcon,
          type: newCatType
        });
      } else {
        db.addCategory({ name: newCatName.trim(), icon: newCatIcon, type: newCatType });
      }
      setNewCatName('');
      setNewCatIcon('📦');
      setNewCatType('physical');
      setEditingCategory(null);
      setCategoryError('');
      setCategories(db.getCategories());
    } catch (err) {
      setCategoryError(err.message);
    }
  };

  const verifyAdminPin = () => {
    const pin = prompt('🔒 ຕ້ອງການອະນຸມັດ: ກະລຸນາໃສ່ລະຫັດ PIN ຂອງ Admin/ເຈົ້າຂອງຮ້ານ:');
    if (!pin) return false;
    const users = db.getUsers();
    const settings = db.getSettings();
    const matchedOwner = users.find(u => u.role === 'owner' && u.passcode === pin);
    const isMasterPin = pin === settings.masterAdminPin;
    if (matchedOwner || isMasterPin) return true;
    alert('❌ ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ!');
    return false;
  };

  const handleWarehouseRestockSubmit = (e) => {
    e.preventDefault();
    const qty = Number(warehouseRestockQty);
    if (!qty || qty <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນໃຫ້ຖືກຕ້ອງ');
    
    const prodList = db.getProducts();
    const idx = prodList.findIndex(p => p.id === warehouseActiveProduct.id);
    if (idx !== -1) {
      prodList[idx].warehouseStock = (prodList[idx].warehouseStock || 0) + qty;
      db.saveProducts(prodList);
      db.addAuditLog('warehouse_restock', `ຮັບເຂົ້າສາງໃຫຍ່: ${warehouseActiveProduct.name} +${qty} ${warehouseActiveProduct.unit || 'ອັນ'} (${warehouseRestockNotes || ''})`);
      alert('✓ ຮັບເຂົ້າສາງໃຫຍ່ສຳເລັດ!');
      setShowWarehouseRestockModal(false);
      setWarehouseRestockQty('');
      setWarehouseRestockNotes('');
      setWarehouseActiveProduct(null);
      
      setProducts(db.getProducts());
      if (onUpdate) onUpdate();
    }
  };

  const handleWarehouseTransferSubmit = (e) => {
    e.preventDefault();
    const qty = Number(warehouseTransferQty);
    if (!qty || qty <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນໃຫ້ຖືກຕ້ອງ');
    
    const currentWarehouseStock = warehouseActiveProduct.warehouseStock || 0;
    if (qty > currentWarehouseStock) {
      if (!window.confirm(`⚠️ ຈຳນວນທີ່ໂອນ (${qty}) ຫຼາຍກວ່າສະຕັອກສາງໃຫຍ່ທີ່ມີ (${currentWarehouseStock}). ຢືນຢันທີ່ຈະໂອນບໍ່?`)) {
        return;
      }
    }
    
    const prodList = db.getProducts();
    const idx = prodList.findIndex(p => p.id === warehouseActiveProduct.id);
    if (idx !== -1) {
      prodList[idx].warehouseStock = Math.max(0, (prodList[idx].warehouseStock || 0) - qty);
      prodList[idx].stock = (prodList[idx].stock || 0) + qty;
      db.saveProducts(prodList);
      db.addAuditLog('warehouse_transfer', `ໂອນສິນຄ້າໄປໜ້າຮ້ານ: ${warehouseActiveProduct.name} ໂອນ ${qty} ${warehouseActiveProduct.unit || 'ອັນ'} (ສາງໃຫຍ່ -${qty} -> ໜ້າຮ້ານ +${qty}) (${warehouseTransferNotes || ''})`);
      alert('✓ ໂอนຍ້າຍສິນຄ້າໄປໜ້າຮ້ານສຳເລັດ!');
      setShowWarehouseTransferModal(false);
      setWarehouseTransferQty('');
      setWarehouseTransferNotes('');
      setWarehouseActiveProduct(null);
      
      setProducts(db.getProducts());
      if (onUpdate) onUpdate();
    }
  };

  // Direct Stock Adjustments (+ / - buttons in table)
  const adjustStock = (product, delta) => {
    if (delta > 0) {
      if (!hasInventoryPermission('inventoryAddStock')) {
        if (!verifyAdminPin()) return;
      }
    } else if (delta < 0) {
      if (!hasInventoryPermission('inventoryDeleteStock')) {
        if (!verifyAdminPin()) return;
      }
    }
    const newStock = Math.max(0, product.stock + delta);
    const updated = {
      ...product,
      stock: newStock
    };
    db.updateProduct(updated);
    setProducts(db.getProducts());
    if (onUpdate) onUpdate();
  };

  // Direct Stock Input field change
  const handleStockInputChange = (product, value) => {
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 0) return;

    if (qty > product.stock) {
      if (!hasInventoryPermission('inventoryAddStock')) {
        if (!verifyAdminPin()) return;
      }
    } else if (qty < product.stock) {
      if (!hasInventoryPermission('inventoryDeleteStock')) {
        if (!verifyAdminPin()) return;
      }
    }

    const updated = {
      ...product,
      stock: qty
    };
    db.updateProduct(updated);
    setProducts(db.getProducts());
    if (onUpdate) onUpdate();
  };

  // Direct Warehouse Stock Adjustments (+ / - buttons in table)
  const adjustWarehouseStock = (product, delta) => {
    if (delta > 0) {
      if (!hasInventoryPermission('inventoryAddStock')) {
        if (!verifyAdminPin()) return;
      }
    } else if (delta < 0) {
      if (!hasInventoryPermission('inventoryDeleteStock')) {
        if (!verifyAdminPin()) return;
      }
    }
    const newStock = Math.max(0, (product.warehouseStock || 0) + delta);
    const updated = {
      ...product,
      warehouseStock: newStock
    };
    db.updateProduct(updated);
    setProducts(db.getProducts());
    if (onUpdate) onUpdate();
  };

  // Direct Warehouse Stock Input field change
  const handleWarehouseStockInputChange = (product, value) => {
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 0) return;

    const currentWarehouseStock = product.warehouseStock || 0;
    if (qty > currentWarehouseStock) {
      if (!hasInventoryPermission('inventoryAddStock')) {
        if (!verifyAdminPin()) return;
      }
    } else if (qty < currentWarehouseStock) {
      if (!hasInventoryPermission('inventoryDeleteStock')) {
        if (!verifyAdminPin()) return;
      }
    }

    const updated = {
      ...product,
      warehouseStock: qty
    };
    db.updateProduct(updated);
    setProducts(db.getProducts());
    if (onUpdate) onUpdate();
  };

  const handleOpenBarcodeGen = (p) => {
    setSelectedBarcodeProd(p);
    setCustomBarcodeText(p.barcode);
    setBarcodePrintQty(1);
    setShowBarcodeModal(true);
  };

  // Barcode generator supporting JsBarcode and QRCode
  function generateBarcode(canvas, text, format = 'CODE128') {
    const settings = db.getSettings();
    try {
      if (format === 'QRCODE') {
        const qrWidth = settings.barcodeHeight || 50;
        canvas.width = qrWidth + 20;
        canvas.height = qrWidth + (settings.barcodeShowCode !== false ? 30 : 10);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const qrCanvas = document.createElement('canvas');
        QRCode.toCanvas(qrCanvas, text, {
          margin: 1,
          scale: 3,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }, (err) => {
          if (err) {
            console.error(err);
            return;
          }
          const qrSize = qrWidth;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 5;
          ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

          if (settings.barcodeShowCode !== false) {
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${settings.barcodeCodeSize || 10}px Courier New`;
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, qrY + qrSize + 15);
          }
        });
      } else {
        JsBarcode(canvas, text, {
          format: format,
          width: settings.barcodeWidth || 2,
          height: settings.barcodeHeight || 50,
          displayValue: settings.barcodeShowCode !== false,
          fontSize: settings.barcodeCodeSize || 10,
          font: 'Courier New',
          background: '#FFFFFF',
          lineColor: '#000000',
          margin: 4
        });
      }
    } catch (err) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FF0000';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❌ ຂໍ້ມູນບໍ່ຖືກຕ້ອງສຳລັບ ' + format, canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText('(' + text + ')', canvas.width / 2, canvas.height / 2 + 10);
    }
  };

  const renderStickerToCanvas = async (productName, priceText, barcodeText, barcodeFormat, settings) => {
    const width = parseSizeToPx(ensureUnit(settings.barcodeStickerWidth || '40mm', 'mm'), 400);
    const height = parseSizeToPx(ensureUnit(settings.barcodeStickerHeight || '25mm', 'mm'), 250);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const showName = settings.barcodeShowName !== false;
    const showPrice = settings.barcodeShowPrice !== false;
    const showCode = settings.barcodeShowCode !== false;
    const textSpacing = settings.barcodeTextSpacing || 5;

    // Font styles
    const textBold = settings.barcodeTextBold === true;
    const textItalic = settings.barcodeTextItalic === true;
    const fontStyleModifier = (textBold ? 'bold ' : '') + (textItalic ? 'italic ' : '');
    const textAlign = settings.barcodeTextAlign || 'center';

    let currentY = 15;

    // Draw product name
    if (showName) {
      let nameFontSize = settings.barcodeNameSize || 10;
      ctx.fillStyle = '#000000';
      ctx.font = `${fontStyleModifier}${nameFontSize}px Arial, "Phetsarath OT", sans-serif`;
      ctx.textAlign = textAlign;
      
      let drawX = width / 2;
      if (textAlign === 'left') drawX = 10;
      if (textAlign === 'right') drawX = width - 10;
      
      let name = productName || 'ສິນຄ້າທົ່ວໄປ';
      while (ctx.measureText(name).width > (width - 20) && nameFontSize > 8) {
        nameFontSize--;
        ctx.font = `${fontStyleModifier}${nameFontSize}px Arial, "Phetsarath OT", sans-serif`;
      }
      currentY += nameFontSize;
      ctx.fillText(name, drawX, currentY);
      currentY += textSpacing;
    }

    // Generate barcode canvas
    const barcodeCanvas = document.createElement('canvas');
    try {
      const bcHeight = settings.barcodeHeight || 50;
      const bcWidthScale = settings.barcodeWidth || 2;
      const bcMargin = 4;
      const bcFontSize = settings.barcodeCodeSize || 10;

      if (barcodeFormat === 'QRCODE') {
        const qrSize = bcHeight; // use height for QR size
        barcodeCanvas.width = qrSize + 20;
        barcodeCanvas.height = qrSize + (showCode ? bcFontSize + 15 : 5);
        const bcCtx = barcodeCanvas.getContext('2d');
        bcCtx.fillStyle = '#FFFFFF';
        bcCtx.fillRect(0, 0, barcodeCanvas.width, barcodeCanvas.height);

        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, barcodeText, {
          margin: 1,
          scale: 3,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        bcCtx.drawImage(qrCanvas, (barcodeCanvas.width - qrSize) / 2, 5, qrSize, qrSize);

        if (showCode) {
          bcCtx.fillStyle = '#000000';
          bcCtx.font = `bold ${bcFontSize}px Courier New`;
          bcCtx.textAlign = 'center';
          bcCtx.fillText(barcodeText, barcodeCanvas.width / 2, qrSize + 15);
        }

        // Center on sticker
        const drawX = (width - barcodeCanvas.width) / 2;
        ctx.drawImage(barcodeCanvas, drawX, currentY);
        currentY += barcodeCanvas.height + textSpacing;
      } else {
        JsBarcode(barcodeCanvas, barcodeText, {
          format: barcodeFormat,
          width: bcWidthScale,
          height: bcHeight,
          displayValue: showCode,
          fontSize: bcFontSize,
          font: 'Courier New',
          background: '#FFFFFF',
          lineColor: '#000000',
          margin: bcMargin
        });
        
        // Center barcode horizontally on sticker
        const drawX = (width - barcodeCanvas.width) / 2;
        ctx.drawImage(barcodeCanvas, drawX, currentY);
        currentY += barcodeCanvas.height + textSpacing;
      }
    } catch (err) {
      ctx.fillStyle = '#FF0000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('❌ Error: ' + barcodeFormat, width / 2, currentY + 15);
      currentY += 20;
    }

    // Draw price
    if (showPrice && priceText) {
      let priceFontSize = settings.barcodePriceSize || 12;
      ctx.fillStyle = '#333333';
      ctx.font = `${fontStyleModifier}${priceFontSize}px Arial, "Phetsarath OT", sans-serif`;
      ctx.textAlign = textAlign;

      let drawX = width / 2;
      if (textAlign === 'left') drawX = 10;
      if (textAlign === 'right') drawX = width - 10;

      while (ctx.measureText(priceText).width > (width - 20) && priceFontSize > 8) {
        priceFontSize--;
        ctx.font = `${fontStyleModifier}${priceFontSize}px Arial, "Phetsarath OT", sans-serif`;
      }
      ctx.fillText(priceText, drawX, currentY + priceFontSize);
    }

    return canvas.toDataURL('image/png');
  };

  const handlePrintBarcode = async () => {
    const settings = db.getSettings();
    const format = barcodeFormat || settings.barcodeFormat || 'CODE128';
    const name = selectedBarcodeProd ? selectedBarcodeProd.name : 'ສິນຄ້າທົ່ວໄປ';
    const priceVal = selectedBarcodeProd ? selectedBarcodeProd.price.toLocaleString() + ' ກີບ' : '';
    const text = customBarcodeText;

    if (settings.barcodeDirectPrint) {
      try {
        const dataUrl = await renderStickerToCanvas(name, priceVal, text, format, settings);
        const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? ''
          : (settings.printServerUrl || 'http://localhost:5173');
        const response = await fetch(`${baseUrl}/api/print-barcode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            printer: settings.windowsBarcodePrinterName || 'Barcode Printer',
            image: dataUrl,
            qty: barcodePrintQty
          })
        });
        const result = await response.json();
        if (!result.success) {
          alert('ຜິດພາດໃນການປຣິນ: ' + result.error);
        } else {
          setShowBarcodeModal(false);
        }
      } catch (e) {
        alert('ຜິດພາດໃນການເຊື່ອມຕໍ່: ' + e.message);
      }
      return;
    }

    const canvas = barcodeCanvasRef.current;
    if (!canvas) {
      alert("ຜິດພາດ: ບໍ່ພົບພື້ນທີ່ວາດບາໂຄ້ດ / Error: Barcode canvas not found.");
      return;
    }
    const dataUrl = canvas.toDataURL();
    
    const paperWidth = ensureUnit(settings.barcodePaperWidth || settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerWidth = ensureUnit(settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerHeight = ensureUnit(settings.barcodeStickerHeight || '25mm', 'mm');
    const gapX = ensureUnit(settings.barcodeGapX || '2mm', 'mm');
    const gapY = ensureUnit(settings.barcodeGapY || '2mm', 'mm');
    const columns = settings.barcodeColumns || 1;
    const marginLeft = ensureUnit(settings.barcodeMarginLeft || '0mm', 'mm');
    const marginTop = ensureUnit(settings.barcodeMarginTop || '0mm', 'mm');

    const showName = settings.barcodeShowName !== false;
    const showPrice = settings.barcodeShowPrice !== false;
    
    const textAlign = settings.barcodeTextAlign || 'center';
    const textBold = settings.barcodeTextBold === true;
    const textItalic = settings.barcodeTextItalic === true;
    
    const nameSize = ensureUnit(settings.barcodeNameSize || 10, 'px');
    const priceSize = ensureUnit(settings.barcodePriceSize || 12, 'px');
    const textSpacing = ensureUnit(settings.barcodeTextSpacing || 5, 'px');
    const stickerMargin = settings.barcodeMargin || 10;

    let stickersHtml = '';
    const totalStickers = barcodePrintQty;
    const numRows = Math.ceil(totalStickers / columns);
    for (let r = 0; r < numRows; r++) {
      stickersHtml += `<div class="row-container">`;
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c;
        if (idx < totalStickers) {
          stickersHtml += `
            <div class="sticker">
              ${showName ? `<p class="name">${name}</p>` : ''}
              <img src="${dataUrl}" />
              ${showPrice ? `<p class="price">${priceVal}</p>` : ''}
            </div>
          `;
        } else {
          stickersHtml += `<div class="sticker placeholder"></div>`;
        }
      }
      stickersHtml += `</div>`;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document || printFrame.contentDocument;
    frameDoc.write(`
      <html>
        <head>
          <title>ປຣິນບາໂຄ້ດ - ຂອບພຣະຣັທເກຊ</title>
          <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${paperWidth} ${stickerHeight};
              margin: 0;
            }
            html, body {
              width: ${paperWidth};
              height: ${stickerHeight};
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            body {
              font-family: 'Phetsarath', 'Phetsarath OT', Arial, sans-serif;
              background: white;
              color: black;
              margin: 0;
              padding: 0;
            }
            .row-container {
              display: flex;
              flex-direction: row;
              width: 100%;
              height: ${stickerHeight};
              page-break-after: always;
              break-after: always;
              box-sizing: border-box;
              padding-left: ${marginLeft};
              padding-top: ${marginTop};
              gap: ${gapX};
            }
            .row-container:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .sticker {
              display: flex;
              flex-direction: column;
              align-items: ${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              justify-content: center;
              width: ${stickerWidth};
              height: 100%;
              padding: ${stickerMargin}px;
              box-sizing: border-box;
              overflow: hidden;
            }
            .sticker.placeholder {
              visibility: hidden;
            }
            p.name {
              margin: 0;
              font-size: ${nameSize};
              font-weight: ${textBold ? 'bold' : 'normal'};
              font-style: ${textItalic ? 'italic' : 'normal'};
              text-align: ${textAlign};
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 0 0 auto;
            }
            p.price {
              margin: 0;
              font-size: ${priceSize};
              font-weight: ${textBold ? 'bold' : 'normal'};
              font-style: ${textItalic ? 'italic' : 'normal'};
              text-align: ${textAlign};
              width: 100%;
              flex: 0 0 auto;
            }
            img {
              flex: 1 1 auto;
              min-height: 0;
              max-width: 100%;
              object-fit: contain;
              margin-top: ${textSpacing};
              margin-bottom: ${textSpacing};
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body onload="window.print();">
          ${stickersHtml}
        </body>
      </html>
    `);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      document.body.removeChild(printFrame);
      setShowBarcodeModal(false);
    }, 1000);
  };

  const handlePrintBulkBarcodes = async () => {
    const itemsToPrint = products.filter(p => !db.isServiceCategory(p.category) && (bulkPrintQtys[p.id] || 0) > 0);
    if (itemsToPrint.length === 0) {
      alert('ກະລຸນາເລືອກຈຳນວນປຣິນບາໂຄ້ດຢ່າງໜ້ອຍ 1 ລາຍການ');
      return;
    }

    const settings = db.getSettings();
    const format = barcodeFormat || settings.barcodeFormat || 'CODE128';

    if (settings.barcodeDirectPrint) {
      try {
        for (const p of itemsToPrint) {
          const qty = bulkPrintQtys[p.id] || 0;
          const name = p.name;
          const priceVal = p.price.toLocaleString() + ' ກີບ';
          const text = p.barcode;
          const dataUrl = await renderStickerToCanvas(name, priceVal, text, format, settings);

          const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? ''
            : (settings.printServerUrl || 'http://localhost:5173');
          const response = await fetch(`${baseUrl}/api/print-barcode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              printer: settings.windowsBarcodePrinterName || 'Barcode Printer',
              image: dataUrl,
              qty: qty
            })
          });
          const result = await response.json();
          if (!result.success) {
            alert(`ຜິດພາດໃນການປຣິນ ${p.name}: ${result.error}`);
            return;
          }
        }
        setShowBulkBarcodeModal(false);
        setBulkPrintQtys({});
      } catch (e) {
        alert('ຜິດພາດໃນການເຊື່ອມຕໍ່: ' + e.message);
      }
      return;
    }

    const paperWidth = ensureUnit(settings.barcodePaperWidth || settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerWidth = ensureUnit(settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerHeight = ensureUnit(settings.barcodeStickerHeight || '25mm', 'mm');
    const gapX = ensureUnit(settings.barcodeGapX || '2mm', 'mm');
    const gapY = ensureUnit(settings.barcodeGapY || '2mm', 'mm');
    const columns = settings.barcodeColumns || 1;
    const marginLeft = ensureUnit(settings.barcodeMarginLeft || '0mm', 'mm');
    const marginTop = ensureUnit(settings.barcodeMarginTop || '0mm', 'mm');

    const showName = settings.barcodeShowName !== false;
    const showPrice = settings.barcodeShowPrice !== false;
    
    const textAlign = settings.barcodeTextAlign || 'center';
    const textBold = settings.barcodeTextBold === true;
    const textItalic = settings.barcodeTextItalic === true;
    
    const nameSize = ensureUnit(settings.barcodeNameSize || 10, 'px');
    const priceSize = ensureUnit(settings.barcodePriceSize || 12, 'px');
    const textSpacing = ensureUnit(settings.barcodeTextSpacing || 5, 'px');
    const stickerMargin = settings.barcodeMargin || 10;

    const stickersList = [];
    for (const p of itemsToPrint) {
      const qty = bulkPrintQtys[p.id] || 0;
      const dataUrl = await generateBarcodeDataUrl(p.barcode, format);
      const name = p.name;
      const priceVal = p.price.toLocaleString() + ' ກີບ';
      for (let i = 0; i < qty; i++) {
        stickersList.push({ name, dataUrl, priceVal });
      }
    }

    let stickersHtml = '';
    const totalStickers = stickersList.length;
    const numRows = Math.ceil(totalStickers / columns);
    for (let r = 0; r < numRows; r++) {
      stickersHtml += `<div class="row-container">`;
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c;
        if (idx < totalStickers) {
          const s = stickersList[idx];
          stickersHtml += `
            <div class="sticker">
              ${showName ? `<p class="name">${s.name}</p>` : ''}
              <img src="${s.dataUrl}" />
              ${showPrice ? `<p class="price">${s.priceVal}</p>` : ''}
            </div>
          `;
        } else {
          stickersHtml += `<div class="sticker placeholder"></div>`;
        }
      }
      stickersHtml += `</div>`;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document || printFrame.contentDocument;
    frameDoc.write(`
      <html>
        <head>
          <title>ປຣິນບາໂຄ້ດຫຼາຍລາຍການ - ຂອບພຣະຣັທເກຊ</title>
          <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${paperWidth} ${stickerHeight};
              margin: 0;
            }
            html, body {
              width: ${paperWidth};
              height: ${stickerHeight};
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            body {
              font-family: 'Phetsarath', 'Phetsarath OT', Arial, sans-serif;
              background: white;
              color: black;
              margin: 0;
              padding: 0;
            }
            .row-container {
              display: flex;
              flex-direction: row;
              width: 100%;
              height: ${stickerHeight};
              page-break-after: always;
              break-after: always;
              box-sizing: border-box;
              padding-left: ${marginLeft};
              padding-top: ${marginTop};
              gap: ${gapX};
            }
            .row-container:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .sticker {
              display: flex;
              flex-direction: column;
              align-items: ${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              justify-content: center;
              width: ${stickerWidth};
              height: 100%;
              padding: ${stickerMargin}px;
              box-sizing: border-box;
              overflow: hidden;
            }
            .sticker.placeholder {
              visibility: hidden;
            }
            p.name {
              margin: 0;
              font-size: ${nameSize};
              font-weight: ${textBold ? 'bold' : 'normal'};
              font-style: ${textItalic ? 'italic' : 'normal'};
              text-align: ${textAlign};
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 0 0 auto;
            }
            p.price {
              margin: 0;
              font-size: ${priceSize};
              font-weight: ${textBold ? 'bold' : 'normal'};
              font-style: ${textItalic ? 'italic' : 'normal'};
              text-align: ${textAlign};
              width: 100%;
              flex: 0 0 auto;
            }
            img {
              flex: 1 1 auto;
              min-height: 0;
              max-width: 100%;
              object-fit: contain;
              margin-top: ${textSpacing};
              margin-bottom: ${textSpacing};
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body onload="window.print();">
          ${stickersHtml}
        </body>
      </html>
    `);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      document.body.removeChild(printFrame);
      setShowBulkBarcodeModal(false);
      setBulkPrintQtys({});
    }, 1000);
  };

  const generateBarcodeDataUrl = async (text, format) => {
    const settings = db.getSettings();
    const canvas = document.createElement('canvas');
    try {
      if (format === 'QRCODE') {
        const qrSize = settings.barcodeHeight || 50;
        canvas.width = qrSize + 20;
        canvas.height = qrSize + (settings.barcodeShowCode !== false ? 30 : 10);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, text, {
          margin: 1,
          scale: 3,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        ctx.drawImage(qrCanvas, (canvas.width - qrSize) / 2, 5, qrSize, qrSize);
        if (settings.barcodeShowCode !== false) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${settings.barcodeCodeSize || 10}px Courier New`;
          ctx.textAlign = 'center';
          ctx.fillText(text, canvas.width / 2, qrSize + 15);
        }
      } else {
        JsBarcode(canvas, text, {
          format: format,
          width: settings.barcodeWidth || 2,
          height: settings.barcodeHeight || 50,
          displayValue: settings.barcodeShowCode !== false,
          fontSize: settings.barcodeCodeSize || 10,
          font: 'Courier New',
          background: '#FFFFFF',
          lineColor: '#000000',
          margin: 4
        });
      }
      return canvas.toDataURL();
    } catch (e) {
      return '';
    }
  };

  const lowStockProducts = products.filter(p => !db.isServiceCategory(p.category) && p.stock <= p.minStock);

  // Filter products by selected Category tab and search query, then sort
  const filteredProducts = products.filter(p => {
    // Search matching
    const searchMatch = !prodSearchQuery.trim() || 
      p.name.toLowerCase().includes(prodSearchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.toLowerCase().includes(prodSearchQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(prodSearchQuery.toLowerCase());
      
    if (!searchMatch) return false;

    // Category matching
    if (selectedCatFilter === 'all') return true;
    if (selectedCatFilter === 'low_stock') return !db.isServiceCategory(p.category) && p.stock <= p.minStock;
    if (selectedCatFilter === 'service') return db.isServiceCategory(p.category);
    if (selectedCatFilter === 'physical') return !db.isServiceCategory(p.category);
    return p.category === selectedCatFilter;
  }).sort((a, b) => {
    if (prodSortMode === 'name-asc') {
      return a.name.localeCompare(b.name, 'lo-LA');
    } else if (prodSortMode === 'name-desc') {
      return b.name.localeCompare(a.name, 'lo-LA');
    } else if (prodSortMode === 'stock-asc') {
      const aStock = db.isServiceCategory(a.category) ? 999999 : a.stock;
      const bStock = db.isServiceCategory(b.category) ? 999999 : b.stock;
      return aStock - bStock;
    } else if (prodSortMode === 'stock-desc') {
      const aStock = db.isServiceCategory(a.category) ? -1 : a.stock;
      const bStock = db.isServiceCategory(b.category) ? -1 : b.stock;
      return bStock - aStock;
    }
    return 0;
  });

  // Calculate stock valuation (excluding services category)
  const physicalProducts = products.filter(p => !db.isServiceCategory(p.category));
  const totalStockCount = physicalProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalCostValue = physicalProducts.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.stock) || 0)), 0);
  const totalRetailValue = physicalProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);
  const totalPotentialProfit = totalRetailValue - totalCostValue;

  // Main Warehouse States and Calculations
  const lowStockWarehouseProducts = products.filter(p => !db.isServiceCategory(p.category) && (p.warehouseStock || 0) <= p.minStock);

  const filteredWarehouseProducts = products.filter(p => {
    // Search matching
    const searchMatch = !prodSearchQuery.trim() || 
      p.name.toLowerCase().includes(prodSearchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.toLowerCase().includes(prodSearchQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(prodSearchQuery.toLowerCase());
      
    if (!searchMatch) return false;

    // Category matching
    if (selectedCatFilter === 'all') return true;
    if (selectedCatFilter === 'low_stock') return !db.isServiceCategory(p.category) && (p.warehouseStock || 0) <= p.minStock;
    if (selectedCatFilter === 'service') return db.isServiceCategory(p.category);
    if (selectedCatFilter === 'physical') return !db.isServiceCategory(p.category);
    return p.category === selectedCatFilter;
  }).sort((a, b) => {
    if (prodSortMode === 'name-asc') {
      return a.name.localeCompare(b.name, 'lo-LA');
    } else if (prodSortMode === 'name-desc') {
      return b.name.localeCompare(a.name, 'lo-LA');
    } else if (prodSortMode === 'stock-asc') {
      const aStock = db.isServiceCategory(a.category) ? 999999 : (a.warehouseStock || 0);
      const bStock = db.isServiceCategory(b.category) ? 999999 : (b.warehouseStock || 0);
      return aStock - bStock;
    } else if (prodSortMode === 'stock-desc') {
      const aStock = db.isServiceCategory(a.category) ? -1 : (a.warehouseStock || 0);
      const bStock = db.isServiceCategory(b.category) ? -1 : (b.warehouseStock || 0);
      return bStock - aStock;
    }
    return 0;
  });

  const totalWarehouseStockCount = physicalProducts.reduce((sum, p) => sum + (Number(p.warehouseStock) || 0), 0);
  const totalWarehouseCostValue = physicalProducts.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.warehouseStock) || 0)), 0);
  const totalWarehouseRetailValue = physicalProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.warehouseStock) || 0)), 0);
  const totalWarehousePotentialProfit = totalWarehouseRetailValue - totalWarehouseCostValue;


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'warehouse' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('warehouse')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.warehouse />
          {db.getLabel('inv_tab_warehouse', 'ຈັດການສາງໃຫຍ່ (Warehouse)')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.stock />
          {db.getLabel('inv_tab_products', 'ສະຕັອກໜ້າຮ້ານ (Shop Stock)')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'consumables' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('consumables')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.consumables />
          {db.getLabel('inv_tab_consumables', 'ສາງອຸປະກອນສິ້ນເປືອງ (Consumables)')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'purchasing' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('purchasing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.purchasing />
          {db.getLabel('inv_tab_purchasing', 'ສັ່ງຊື້ & ຜູ້ສະໜອງ')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'raw_materials' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('raw_materials')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.rawMaterials />
          {db.getLabel('inv_tab_raw_materials', 'ວັດຖຸດິບ (Raw Materials)')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'manufacturing' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('manufacturing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <InventoryIcons.manufacturing />
          {db.getLabel('inv_tab_manufacturing', 'ສູດການຜະລິດ & BOM')}
        </button>
      </div>

      {activeSubTab === 'raw_materials' && (
        <RawMaterialsSubView isMobile={isMobile} activeUser={activeUser} />
      )}

      {activeSubTab === 'manufacturing' && (
        <ManufacturingSubView isMobile={isMobile} activeUser={activeUser} />
      )}

      {activeSubTab === 'purchasing' && (
        <PurchaseOrdersSubView isMobile={isMobile} activeUser={activeUser} onUpdate={onUpdate} />
      )}

      {activeSubTab === 'consumables' && (
        <ConsumablesSubView isMobile={isMobile} activeUser={activeUser} onUpdate={onUpdate} />
      )}

      {activeSubTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header and Actions */}
          <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.5rem', margin: 0 }}>
                📦 ຈັດການສະຕັອກໜ້າຮ້ານ (Shop Stock)
              </h2>
              {!isMobile && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  ຈັດການລາຍການສິນຄ້າ ແລະ ປັບປຸງສະຕັອກສິນຄ້າຄົງເຫຼືອໜ້າຮ້ານໄດ້ໂດຍກົງ
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
              <button 
                className="btn btn-secondary" 
                style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                onClick={() => { setSelectedBarcodeProd(null); setBarcodePrintQty(1); setShowBarcodeModal(true); }}
              >
                🏷️ ສ້າງບາໂຄ້ດເປົ່າ
              </button>
              <button 
                className="btn btn-secondary" 
                style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                onClick={() => { setBulkPrintQtys({}); setBulkSearch(''); setBulkCatFilter('all'); setShowBulkBarcodeModal(true); }}
              >
                🏷️ ປຣິນບາໂຄ້ດຫຼາຍ
              </button>
              <button 
                className="btn btn-secondary" 
                style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                onClick={openCategoryAdd}
              >
                🗂️ ຈັດການໝວດໝູ່
              </button>
              {hasInventoryPermission('inventoryAddProduct') && (
                <button 
                  className="btn btn-primary" 
                  style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                  onClick={handleOpenAdd}
                >
                  ➕ ເພີ່ມສິນຄ້າໃໝ່
                </button>
              )}
            </div>
          </div>

          {/* Stock Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <InventoryKpiCard
              icon={<InventoryIcons.box />}
              label={db.getLabel('auto____ຈຳນວນສິນຄ້າຄົງເຫຼືອໜ້າ_9dgu3y', 'ຈຳນວນສິນຄ້າຄົງເຫຼືอໜ້າຮ້ານທັງໝົດ')}
              value={totalStockCount.toLocaleString()}
              sub={`${db.getLabel('auto_ຊິ້ນ__ຈາກ_4n4po5', 'ຊິ້ນ (ຈາກ')} ${physicalProducts.length} ${db.getLabel('auto_ລາຍການ__t3ypbz', 'ລາຍການ)')}`}
              accentColor="212, 175, 55"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.cost />}
              label={db.getLabel('auto____ມູນຄ່າຕົ້ນທຶນສະຕັອກໜ້າ_16nkuw', 'ມູນຄ່າຕົ້ນທຶນສະຕັອກໜ້າຮ້ານລວມ')}
              value={hasInventoryPermission('inventoryViewCost') ? `${totalCostValue.toLocaleString()} ກີບ` : '*** ກີບ'}
              accentColor="243, 156, 18"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.retail />}
              label={db.getLabel('auto____ມູນຄ່າລາຄາາຍໜ້າຮ້ານລວມ_194rm8', 'ມູນຄ່າລາຄາຂາຍໜ້າຮ້ານລວມ')}
              value={`${totalRetailValue.toLocaleString()} ກີບ`}
              accentColor="46, 204, 113"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.profit />}
              label={db.getLabel('auto___ກຳໄລຄາດຄະເນໜ້າຮ້ານ_nowlqf', 'ກຳໄລຄາດຄະເນໜ້າຮ້ານ')}
              value={hasInventoryPermission('inventoryViewCost') ? `${totalPotentialProfit.toLocaleString()} ກີບ` : '*** ກີບ'}
              accentColor="52, 152, 219"
            />
          </div>

          {/* Category Summary Card */}
          <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '18px', background: 'var(--bg-card)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)', marginTop: '4px' }}>
            <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InventoryIcons.category />
              ສະຫຼຸບສິນຄ້າໜ້າຮ້ານຕາມໝວດໝູ່ (Category Summary)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {categories.map(cat => {
                const catProducts = products.filter(p => p.category === cat.id);
                const isService = db.isServiceCategory(cat.id);
                const stockTotal = isService ? null : catProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
                const catTotalCost = isService ? 0 : catProducts.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.stock) || 0)), 0);
                const catTotalRetail = isService ? 0 : catProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);
                const catProfit = catTotalRetail - catTotalCost;
                return (
                  <div
                    key={cat.id}
                    onClick={() => { setSelectedCatFilter(cat.id); }}
                    style={{
                      background: selectedCatFilter === cat.id ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: selectedCatFilter === cat.id ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: selectedCatFilter === cat.id ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                      {getCategoryIconSvg(cat.id, cat.icon)}
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', lineHeight: 1.3 }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        📋 ລາຍການ: <b style={{ color: 'white' }}>{catProducts.length}</b> ລາຍການ
                      </span>
                      {!isService && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          📦 ສະຕັອກ: <b style={{ color: stockTotal === 0 ? 'var(--alert-red)' : 'var(--gold-primary)' }}>{stockTotal}</b> ຊິ້ນ
                        </span>
                      )}
                      {isService && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber, #e67e22)' }}>{db.getLabel('auto_____ບໍລິການ__No_Stock__ydtts8', `🛠️ ບໍລິການ (No Stock)`)}</span>
                      )}
                      {!isService && (
                        <>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            💰 ຕົ້ນທຶນ:{' '}
                            <b style={{ color: 'var(--accent-amber, #e67e22)' }}>
                              {hasInventoryPermission('inventoryViewCost') ? `${catTotalCost.toLocaleString()} ກີບ` : '***'}
                            </b>
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            📈 ຂາຍ:{' '}
                            <b style={{ color: 'var(--success-green, #27ae60)' }}>
                              {catTotalRetail.toLocaleString()} ກີບ
                            </b>
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            ✨ ກຳໄລ:{' '}
                            <b style={{ color: catProfit >= 0 ? 'var(--gold-primary)' : 'var(--alert-red)' }}>
                              {hasInventoryPermission('inventoryViewCost') ? `${catProfit.toLocaleString()} ກີບ` : '***'}
                            </b>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alerts Banner */}
          {lowStockProducts.length > 0 && (
            <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1.5px solid var(--alert-red)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ color: 'var(--alert-red)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                ⚠️ ແຈ້ງເຕືອນ: ສິນຄ້າໃກ້ໝົດສະຕັອກ ({lowStockProducts.length} ລາຍການ)
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {lowStockProducts.map(p => (
                  <div
                    key={p.id}
                    style={{ background: 'rgba(20, 10, 10, 0.5)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <span>{p.name} (<b>{db.getLabel('auto_ຄົງເຫຼືອ__8l71ml', `ຄົງເຫຼືອ:`)} {p.stock} {p.unit}</b>)</span>
                    {hasInventoryPermission('inventoryEditProduct') && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        ຕື່ມສະຕັອກ
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Sort UI controls */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '16px', 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginTop: '10px'
            }}
          >
            {/* Search Box */}
            <div style={{ flex: '1', minWidth: '250px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder={db.getLabel('auto_ຄົ້ນຫາສິນຄ້າ_ດ້ວຍຊື່_ຫຼື__b8ili6', `ຄົ້ນຫາສິນຄ້າ ດ້ວຍຊື່ ຫຼື ບາໂຄ້ດ (Search name/barcode)...`)}
                value={prodSearchQuery}
                onChange={(e) => setProdSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px 8px 36px', 
                  background: '#191613', 
                  color: 'white', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
              {prodSearchQuery && (
                <button
                  onClick={() => setProdSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{db.getLabel('auto_ຈັດລຽງ___Sort__46njnz', `ຈັດລຽງ / Sort:`)}</span>
              <select
                value={prodSortMode}
                onChange={(e) => setProdSortMode(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: '#191613',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value="none">{db.getLabel('auto_ເລືອກການຈັດລຽງ__None__vpelsz', `ເລືອກການຈັດລຽງ (None)`)}</option>
                <option value="name-asc">{db.getLabel('auto____ຊື່__ກ___ຮ__A_Z__pp1cp1', `🔠 ຊື່: ກ - ຮ (A-Z)`)}</option>
                <option value="name-desc">{db.getLabel('auto____ຊື່__ຮ___ກ__Z_A__ymxbr9', `🔠 ຊື່: ຮ - ກ (Z-A)`)}</option>
                <option value="stock-asc">{db.getLabel('auto____ສະຕັອກ__ຕ່ຳ__rarr__ສູງ_ka10ik', `📉 ສະຕັອກ: ຕ່ຳ &rarr; ສູງ (Low to High)`)}</option>
                <option value="stock-desc">{db.getLabel('auto____ສະຕັອກ__ສູງ__rarr__ຕ່ຳ_i4s725', `📈 ສະຕັອກ: ສູງ &rarr; ຕ່ຳ (High to Low)`)}</option>
              </select>
            </div>
          </div>

          {/* Category Tabs for easier visualization */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            {[
              { id: 'all', icon: '📋', name: 'ທັງໝົດ', count: products.length },
              { id: 'low_stock', icon: '⚠️', name: 'ສະຕັອກໃກ້ໝົດ', count: lowStockProducts.length },
              { id: 'physical', icon: '📦', name: 'ສິນຄ້າ', count: physicalProducts.length },
              { id: 'service', icon: '🛠️', name: 'ບໍລິການ', count: products.length - physicalProducts.length },
              ...categories.map(cat => ({
                id: cat.id,
                icon: cat.icon || '📦',
                name: cat.name,
                count: products.filter(p => p.category === cat.id).length
              }))
            ].map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${selectedCatFilter === tab.id ? 'active' : ''}`}
                style={{ fontSize: '0.85rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 14px', minWidth: '80px', textAlign: 'center' }}
                onClick={() => changeCatFilter(tab.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tab.icon && (tab.icon.startsWith('data:image/') || tab.icon.startsWith('http')) ? (
                    <img src={tab.icon} style={{ width: '14px', height: '14px', objectFit: 'contain', borderRadius: '2px' }} alt="" />
                  ) : (
                    <span style={{ fontSize: '0.8rem' }}>{tab.icon}</span>
                  )}
                  <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{tab.name}</span>
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.9 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Products Inventory Table */}
          <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
            <table className="table-premium" style={{ minWidth: '1000px', marginTop: 0 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '16px' }}>{db.getLabel('auto_ຮູບພາບ_80qond', `ຮູບພາບ`)}</th>
                  <th style={{ padding: '16px' }}>{db.getLabel('auto_ລະຫັດບາໂຄ້ດ_jwwpuw', `ລະຫັດບາໂຄ້ດ`)}</th>
                  <th style={{ padding: '16px' }}>{db.getLabel('auto_ຊື່ສິນຄ້າ_18q1y1', `ຊື່ສິນຄ້າ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{db.getLabel('auto_ຕົ້ນທຶນ_pcy3d0', `ຕົ້ນທຶນ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{db.getLabel('auto_ລາຄາຂາຍ_t82ggu', `ລາຄາຂາຍ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'center', width: '200px' }}>{db.getLabel('auto_ສະຕັອກໜ້າຮ້ານ_pee6pd', `ສະຕັອກໜ້າຮ້ານ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{db.getLabel('auto_ຈັດການ_q4z3sz', `ຈັດການ`)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍ່ມີລາຍການສິນຄ້າ_4c24pd', `ບໍ່ມີລາຍການສິນຄ້າ`)}</td>
                  </tr>
                ) : filteredProducts.map(p => {
                  const isService = db.isServiceCategory(p.category);
                  const isLow = !isService && p.stock <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', background: isLow ? 'rgba(231,76,60,0.02)' : 'none' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                        {p.barcode}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span>{p.name}</span>
                          <span style={{ display: 'inline-flex', width: 'fit-content', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '999px', color: isService ? 'var(--accent-amber)' : 'var(--success-green)', border: '1px solid ' + (isService ? 'rgba(229,169,59,0.3)' : 'rgba(39,174,96,0.3)'), background: isService ? 'rgba(229,169,59,0.08)' : 'rgba(39,174,96,0.08)' }}>
                            {(() => {
                              const cat = categories.find(c => c.id === p.category || c.name === p.category);
                              const catName = cat ? db.getLabel('cat_' + cat.id, cat.name) : p.category;
                              return isService ? `🛠️ ${catName || 'ບໍລິການ'}` : `📦 ${catName || 'ສິນຄ້າ'}`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} ກີບ` : '*** ກີບ'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                        {p.price.toLocaleString()} ກີບ
                      </td>
                      
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isService ? (
                          <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍລິການ__ບໍ່ມີສະຕັອກ__rff47c', `ບໍລິການ (ບໍ່ມີສະຕັອກ)`)}</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              className="cart-qty-btn"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => adjustStock(p, -1)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={p.stock}
                              onChange={(e) => handleStockInputChange(p, e.target.value)}
                              style={{
                                width: '50px',
                                background: '#0c0b09',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '4px',
                                color: isLow ? 'var(--alert-red)' : 'var(--success-green)',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                padding: '2px',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              className="cart-qty-btn"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => adjustStock(p, 1)}
                            >
                              +
                            </button>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleOpenBarcodeGen(p)}
                          >
                            🏷️ ບາໂຄ້ດ
                          </button>
                          {hasInventoryPermission('inventoryEditProduct') && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => handleOpenEdit(p)}
                            >
                              📝 ແກ້ໄຂ
                            </button>
                          )}
                          {hasInventoryPermission('inventoryDeleteProduct') && (
                            <button
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#c0392b', color: 'white', border: 'none' }}
                              onClick={() => handleDeleteProduct(p)}
                            >
                              🗑️ ລົບ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍ່ມີລາຍການສິນຄ້າ_4c24pd', `ບໍ່ມີລາຍການສິນຄ້າ`)}</div>
            ) : filteredProducts.map(p => {
              const isService = db.isServiceCategory(p.category);
              const isLow = !isService && p.stock <= p.minStock;
              return (
                <div key={p.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid ' + (isLow ? 'var(--alert-red)' : 'var(--success-green)') }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {p.image ? (
                      <img src={p.image} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', fontSize: '1.2rem' }}>📦</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{db.getLabel('auto_ບາໂຄ້ດ__nc7thx', `ບາໂຄ້ດ:`)} {p.barcode || '-'}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຕົ້ນທຶນ__4t4aie', `ຕົ້ນທຶນ:`)} </span>
                      <span>{hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} ₭` : '*** ₭'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ລາຄາາຍ__t81kl8', `ລາຄາາຍ:`)} </span>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{p.price.toLocaleString()} ₭</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ໝວດໝູ່__6g08d4', `ໝວດໝູ່:`)} </span>
                      <span style={{ textTransform: 'capitalize' }}>{p.category}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ສະຕັອກໜ້າຮ້ານ__61z65l', `ສະຕັອກໜ້າຮ້ານ:`)} </span>
                      {isService ? (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{db.getLabel('auto_ບໍລິການ_zbt7i2', `ບໍລິການ`)}</span>
                      ) : (
                        <span style={{ fontWeight: 'bold', color: isLow ? 'var(--alert-red)' : 'white' }}>{p.stock} / {p.minStock} {p.unit}</span>
                      )}
                    </div>
                  </div>

                  {!isService && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><b>{db.getLabel('auto_ປັບສະຕັອກໜ້າຮ້ານ__elfa31', `ປັບສະຕັອກໜ້າຮ້ານ:`)}</b></span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                        <button type="button" className="qty-btn" style={{ width: '32px', height: '32px', fontSize: '1rem' }} onClick={() => adjustStock(p, -1)}>-</button>
                        <input 
                          type="text" 
                          value={p.stock} 
                          readOnly 
                          style={{ width: '40px', background: '#0c0b09', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white', textAlign: 'center', fontSize: '0.9rem', padding: '4px 0', fontWeight: 'bold' }} 
                        />
                        <button type="button" className="qty-btn" style={{ width: '32px', height: '32px', fontSize: '1rem' }} onClick={() => adjustStock(p, 1)}>+</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenBarcodeGen(p)}>{db.getLabel('auto_____ບາໂຄ້ດ_hc240f', `🏷️ ບາໂຄ້ດ`)}</button>
                    {hasInventoryPermission('inventoryEditProduct') && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleOpenEdit(p)}>{db.getLabel('auto____ແກ້ໄຂ_mmb6rr', `📝 ແກ້ໄຂ`)}</button>
                    )}
                    {hasInventoryPermission('inventoryDeleteProduct') && (
                      <button type="button" className="btn btn-sm" style={{ background: '#c0392b', color: 'white', border: 'none' }} onClick={() => handleDeleteProduct(p)}>{db.getLabel('auto_____ລົບ_ps8okf', `🗑️ ລົບ`)}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'warehouse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header and Actions */}
          <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.5rem', margin: 0 }}>
                🏠 ຈັດການສະຕັອກສາງໃຫຍ່ (Warehouse Stock)
              </h2>
              {!isMobile && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  ຮັບເຄື່ອງເຂົ້າສາງໃຫຍ່ ແລະ ໂອນຍ້າຍສິນຄ້າໄປໜ້າຮ້ານໄດ້ຢ່າງສະດວກ
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
              <button 
                className="btn btn-secondary" 
                style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                onClick={() => { setSelectedBarcodeProd(null); setBarcodePrintQty(1); setShowBarcodeModal(true); }}
              >
                🏷️ ສ້າງບາໂຄ້ດເປົ່າ
              </button>
              <button 
                className="btn btn-secondary" 
                style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                onClick={() => { setBulkPrintQtys({}); setBulkSearch(''); setBulkCatFilter('all'); setShowBulkBarcodeModal(true); }}
              >
                🏷️ ປຣິນບາໂຄ້ດຫຼາຍ
              </button>
              <button 
                className="btn btn-secondary" 
                style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                onClick={openCategoryAdd}
              >
                🗂️ ຈັດການໝວດໝູ່
              </button>
              {hasInventoryPermission('inventoryAddProduct') && (
                <button 
                  className="btn btn-primary" 
                  style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
                  onClick={handleOpenAdd}
                >
                  ➕ ເພີ່ມສິນຄ້າໃໝ່
                </button>
              )}
            </div>
          </div>

          {/* Warehouse Valuation KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <InventoryKpiCard
              icon={<InventoryIcons.warehouse />}
              label={db.getLabel('auto____ຈຳນວນສິນຄ້າໃນສາງໃຫຍ່ທັ_gjj103', 'ຈຳນວນສິນຄ້າໃນສາງໃຫຍ່ທັງໝົດ')}
              value={totalWarehouseStockCount.toLocaleString()}
              sub={`${db.getLabel('auto_ຊິ້ນ__ຈາກ_4n4po5', 'ຊິ້ນ (ຈາກ')} ${physicalProducts.length} ${db.getLabel('auto_ລາຍການ__t3ypbz', 'ລາຍການ)')}`}
              accentColor="212, 175, 55"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.cost />}
              label={db.getLabel('auto____ມູນຄ່າຕົ້ນທຶນສາງໃຫຍ່ລວ_xu9mwp', 'ມູນຄ່າຕົ້ນທຶນສາງໃຫຍ່ລວມ')}
              value={hasInventoryPermission('inventoryViewCost') ? `${totalWarehouseCostValue.toLocaleString()} ກີບ` : '*** ກີບ'}
              accentColor="243, 156, 18"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.retail />}
              label={db.getLabel('auto____ມູນຄ່າລາຄາຂາຍສາງໃຫຍ່ລວ_e8p98d', 'ມູນຄ່າລາຄາຂາຍສາງໃຫຍ່ລວມ')}
              value={`${totalWarehouseRetailValue.toLocaleString()} ກີບ`}
              accentColor="46, 204, 113"
            />
            <InventoryKpiCard
              icon={<InventoryIcons.profit />}
              label={db.getLabel('auto___ກຳໄລຄາດຄະເນສາງໃຫຍ່_bf4qm6', 'ກຳໄລຄາດຄະເນສາງໃຫຍ່')}
              value={hasInventoryPermission('inventoryViewCost') ? `${totalWarehousePotentialProfit.toLocaleString()} ກີບ` : '*** ກີບ'}
              accentColor="52, 152, 219"
            />
          </div>

          {/* Warehouse Category Summary Card */}
          <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '18px', background: 'var(--bg-card)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)', marginTop: '4px' }}>
            <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InventoryIcons.category />
              ສະຫຼຸບສິນຄ້າໃນສາງໃຫຍ່ຕາມໝວດໝູ່ (Category Summary)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {categories.map(cat => {
                const catProducts = products.filter(p => p.category === cat.id);
                const isService = db.isServiceCategory(cat.id);
                const stockTotal = isService ? null : catProducts.reduce((sum, p) => sum + (Number(p.warehouseStock) || 0), 0);
                const catTotalCost = isService ? 0 : catProducts.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.warehouseStock) || 0)), 0);
                const catTotalRetail = isService ? 0 : catProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.warehouseStock) || 0)), 0);
                const catProfit = catTotalRetail - catTotalCost;
                return (
                  <div
                    key={cat.id}
                    onClick={() => { setSelectedCatFilter(cat.id); }}
                    style={{
                      background: selectedCatFilter === cat.id ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: selectedCatFilter === cat.id ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: selectedCatFilter === cat.id ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                      {getCategoryIconSvg(cat.id, cat.icon)}
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', lineHeight: 1.3 }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        📋 ລາຍການ: <b style={{ color: 'white' }}>{catProducts.length}</b> ລາຍການ
                      </span>
                      {!isService && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          🏠 ສາງໃຫຍ່: <b style={{ color: stockTotal === 0 ? 'var(--alert-red)' : 'var(--gold-primary)' }}>{stockTotal}</b> ຊິ້ນ
                        </span>
                      )}
                      {isService && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber, #e67e22)' }}>{db.getLabel('auto_____ບໍລິການ_35ez3i', `🛠️ ບໍລິການ`)}</span>
                      )}
                      {!isService && (
                        <>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            💰 ຕົ້ນທຶນ:{' '}
                            <b style={{ color: 'var(--accent-amber, #e67e22)' }}>
                              {hasInventoryPermission('inventoryViewCost') ? `${catTotalCost.toLocaleString()} ກີບ` : '***'}
                            </b>
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            📈 ຂາຍ:{' '}
                            <b style={{ color: 'var(--success-green, #27ae60)' }}>
                              {catTotalRetail.toLocaleString()} ກີບ
                            </b>
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            ✨ ກຳໄລ:{' '}
                            <b style={{ color: catProfit >= 0 ? 'var(--gold-primary)' : 'var(--alert-red)' }}>
                              {hasInventoryPermission('inventoryViewCost') ? `${catProfit.toLocaleString()} ກີບ` : '***'}
                            </b>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Warehouse Products Alert */}
          {lowStockWarehouseProducts.length > 0 && (
            <div style={{ background: 'rgba(230, 126, 34, 0.1)', border: '1.5px solid var(--accent-amber, #e67e22)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ color: 'var(--accent-amber, #e67e22)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                ⚠️ ແຈ້ງເຕືອນ: ສິນຄ້າໃນສາງໃຫຍ່ໃກ້ໝົດ ({lowStockWarehouseProducts.length} ລາຍການ)
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {lowStockWarehouseProducts.map(p => (
                  <div
                    key={p.id}
                    style={{ background: 'rgba(20, 10, 10, 0.5)', border: '1px solid rgba(230, 126, 34, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <span>{p.name} (<b>{db.getLabel('auto_ຄົງເຫຼືອໃນສາງ__mm7zmg', `ຄົງເຫຼືອໃນສາງ:`)} {p.warehouseStock || 0} {p.unit}</b>)</span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', borderColor: '#2ecc71', color: '#2ecc71' }}
                      onClick={() => {
                        setWarehouseActiveProduct(p);
                        setShowWarehouseRestockModal(true);
                      }}
                    >
                      📥 ຮັບເຂົ້າສາງ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Sort UI controls */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '16px', 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginTop: '10px'
            }}
          >
            {/* Search Box */}
            <div style={{ flex: '1', minWidth: '250px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder={db.getLabel('auto_ຄົ້ນຫາສິນຄ້າໃນສາງ_ດ້ວຍຊື່_4lgyyi', `ຄົ້ນຫາສິນຄ້າໃນສາງ ດ້ວຍຊື່ ຫຼື ບາໂຄ້ດ (Search warehouse)...`)}
                value={prodSearchQuery}
                onChange={(e) => setProdSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px 8px 36px', 
                  background: '#191613', 
                  color: 'white', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
              {prodSearchQuery && (
                <button
                  onClick={() => setProdSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{db.getLabel('auto_ຈັດລຽງ___Sort__46njnz', `ຈັດລຽງ / Sort:`)}</span>
              <select
                value={prodSortMode}
                onChange={(e) => setProdSortMode(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: '#191613',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value="none">{db.getLabel('auto_ເລືອກການຈັດລຽງ__None__vpelsz', `ເລືອກການຈັດລຽງ (None)`)}</option>
                <option value="name-asc">{db.getLabel('auto____ຊື່__ກ___ຮ__A_Z__pp1cp1', `🔠 ຊື່: ກ - ຮ (A-Z)`)}</option>
                <option value="name-desc">{db.getLabel('auto____ຊື່__ຮ___ກ__Z_A__ymxbr9', `🔠 ຊື່: ຮ - ກ (Z-A)`)}</option>
                <option value="stock-asc">{db.getLabel('auto____ສະຕັອກສາງ__ຕ່ຳ__rarr___jf91bl', `📉 ສະຕັອກສາງ: ຕ່ຳ &rarr; ສູງ (Low to High)`)}</option>
                <option value="stock-desc">{db.getLabel('auto____ສະຕັອກສາງ__ສູງ__rarr___tajp6c', `📈 ສະຕັອກສາງ: ສູງ &rarr; ຕ່ຳ (High to Low)`)}</option>
              </select>
            </div>
          </div>

          {/* Category Tabs for Warehouse */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            {[
              { id: 'all', icon: '📋', name: 'ທັງໝົດ', count: products.length },
              { id: 'low_stock', icon: '⚠️', name: 'ສະຕັອກໃກ້ໝົດ', count: lowStockWarehouseProducts.length },
              { id: 'physical', icon: '📦', name: 'ສິນຄ້າ', count: physicalProducts.length },
              { id: 'service', icon: '🛠️', name: 'ບໍລິການ', count: products.length - physicalProducts.length },
              ...categories.map(cat => ({
                id: cat.id,
                icon: cat.icon || '📦',
                name: cat.name,
                count: products.filter(p => p.category === cat.id).length
              }))
            ].map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${selectedCatFilter === tab.id ? 'active' : ''}`}
                style={{ fontSize: '0.85rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 14px', minWidth: '80px', textAlign: 'center' }}
                onClick={() => changeCatFilter(tab.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tab.icon && (tab.icon.startsWith('data:image/') || tab.icon.startsWith('http')) ? (
                    <img src={tab.icon} style={{ width: '14px', height: '14px', objectFit: 'contain', borderRadius: '2px' }} alt="" />
                  ) : (
                    <span style={{ fontSize: '0.8rem' }}>{tab.icon}</span>
                  )}
                  <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{tab.name}</span>
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.9 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Main Warehouse Table */}
          <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
            <table className="table-premium" style={{ minWidth: '1000px', marginTop: 0 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '16px' }}>{db.getLabel('auto_ຮູບພາບ_80qond', `ຮູບພາບ`)}</th>
                  <th style={{ padding: '16px' }}>{db.getLabel('auto_ລະຫັດບາໂຄ້ດ_jwwpuw', `ລະຫັດບາໂຄ້ດ`)}</th>
                  <th style={{ padding: '16px' }}>{db.getLabel('auto_ຊື່ສິນຄ້າ_18q1y1', `ຊື່ສິນຄ້າ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{db.getLabel('auto_ຕົ້ນທຶນ_pcy3d0', `ຕົ້ນທຶນ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{db.getLabel('auto_ລາຄາຂາຍ_t82ggu', `ລາຄາຂາຍ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'center', width: '180px' }}>{db.getLabel('auto_ສະຕັອກສາງໃຫຍ່_9pn5n8', `ສະຕັອກສາງໃຫຍ່`)}</th>
                  <th style={{ padding: '16px', textAlign: 'center', width: '140px' }}>{db.getLabel('auto_ສະຕັອກໜ້າຮ້ານ_pee6pd', `ສະຕັອກໜ້າຮ້ານ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'center', width: '220px' }}>{db.getLabel('auto_ທຸລະກຳ_ix4f9e', `ທຸລະກຳ`)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{db.getLabel('auto_ຈັດການ_q4z3sz', `ຈັດການ`)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarehouseProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍ່ມີລາຍການສິນຄ້າໃນສາງ_t9ybju', `ບໍ່ມີລາຍການສິນຄ້າໃນສາງ`)}</td>
                  </tr>
                ) : filteredWarehouseProducts.map(p => {
                  const isService = db.isServiceCategory(p.category);
                  const isLow = !isService && (p.warehouseStock || 0) <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', background: isLow ? 'rgba(230, 126, 34, 0.02)' : 'none' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                        {p.barcode}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span>{p.name}</span>
                          <span style={{ display: 'inline-flex', width: 'fit-content', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '999px', color: isService ? 'var(--accent-amber)' : 'var(--success-green)', border: '1px solid ' + (isService ? 'rgba(229,169,59,0.3)' : 'rgba(39,174,96,0.3)'), background: isService ? 'rgba(229,169,59,0.08)' : 'rgba(39,174,96,0.08)' }}>
                            {(() => {
                              const cat = categories.find(c => c.id === p.category || c.name === p.category);
                              const catName = cat ? db.getLabel('cat_' + cat.id, cat.name) : p.category;
                              return isService ? `🛠️ ${catName || 'ບໍລິການ'}` : `📦 ${catName || 'ສິນຄ້າ'}`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} ກີບ` : '*** ກີບ'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                        {p.price.toLocaleString()} ກີບ
                      </td>
                      
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isService ? (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              className="cart-qty-btn"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => adjustWarehouseStock(p, -1)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={p.warehouseStock || 0}
                              onChange={(e) => handleWarehouseStockInputChange(p, e.target.value)}
                              style={{
                                width: '50px',
                                background: '#0c0b09',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '4px',
                                color: isLow ? 'var(--alert-red)' : 'var(--success-green)',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                padding: '2px',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              className="cart-qty-btn"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => adjustWarehouseStock(p, 1)}
                            >
                              +
                            </button>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {!isService ? `${p.stock} ${p.unit}` : '—'}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {!isService && (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '3px 7px', fontSize: '0.75rem', borderColor: '#2ecc71', color: '#2ecc71', background: 'rgba(46,204,113,0.05)' }}
                              onClick={() => {
                                setWarehouseActiveProduct(p);
                                setShowWarehouseRestockModal(true);
                              }}
                            >
                              📥 ຮັບເຂົ້າ
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '3px 7px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setWarehouseActiveProduct(p);
                                setShowWarehouseTransferModal(true);
                              }}
                            >
                              🚚 ໂອນຍ້າຍ
                            </button>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleOpenBarcodeGen(p)}
                          >
                            🏷️ ບາໂຄ້ດ
                          </button>
                          {hasInventoryPermission('inventoryEditProduct') && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => handleOpenEdit(p)}
                            >
                              📝 ແກ້ໄຂ
                            </button>
                          )}
                          {hasInventoryPermission('inventoryDeleteProduct') && (
                            <button
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#c0392b', color: 'white', border: 'none' }}
                              onClick={() => handleDeleteProduct(p)}
                            >
                              🗑️ ລົບ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
            {filteredWarehouseProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍ່ມີລາຍການສິນຄ້າໃນສາງ_t9ybju', `ບໍ່ມີລາຍການສິນຄ້າໃນສາງ`)}</div>
            ) : filteredWarehouseProducts.map(p => {
              const isService = db.isServiceCategory(p.category);
              const isLow = !isService && (p.warehouseStock || 0) <= p.minStock;
              return (
                <div key={p.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid ' + (isLow ? 'var(--accent-amber)' : 'var(--success-green)') }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {p.image ? (
                      <img src={p.image} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', fontSize: '1.2rem' }}>📦</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{db.getLabel('auto_ບາໂຄ້ດ__nc7thx', `ບາໂຄ້ດ:`)} {p.barcode || '-'}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຕົ້ນທຶນ__4t4aie', `ຕົ້ນທຶນ:`)} </span>
                      <span>{hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} ₭` : '*** ₭'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ລາຄາຂາຍ__hgcj88', `ລາຄາຂາຍ:`)} </span>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{p.price.toLocaleString()} ₭</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ສະຕັອກສາງໃຫຍ່__gyhn1u', `ສະຕັອກສາງໃຫຍ່:`)} </span>
                      {isService ? (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>
                      ) : (
                        <span style={{ fontWeight: 'bold', color: isLow ? 'var(--alert-red)' : 'white' }}>{p.warehouseStock || 0} / {p.minStock} {p.unit}</span>
                      )}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ສະຕັອກໜ້າຮ້____63c8j7', `ສະຕັອກໜ້າຮ້ាន:`)} </span>
                      <span>{p.stock} {p.unit}</span>
                    </div>
                  </div>

                  {!isService && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ປັບສະຕັອກສາງໃຫຍ່__8f1j4e', `ປັບສະຕັອກສາງໃຫຍ່:`)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                          <button type="button" className="qty-btn" style={{ width: '32px', height: '32px', fontSize: '1rem' }} onClick={() => adjustWarehouseStock(p, -1)}>-</button>
                          <input 
                            type="text" 
                            value={p.warehouseStock || 0} 
                            readOnly 
                            style={{ width: '40px', background: '#0c0b09', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white', textAlign: 'center', fontSize: '0.9rem', padding: '4px 0', fontWeight: 'bold' }} 
                          />
                          <button type="button" className="qty-btn" style={{ width: '32px', height: '32px', fontSize: '1rem' }} onClick={() => adjustWarehouseStock(p, 1)}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => {
                            setWarehouseActiveProduct(p);
                            setShowWarehouseRestockModal(true);
                          }}
                        >
                          📥 ຮັບເຂົ້າສາງໃຫຍ່
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => {
                            setWarehouseActiveProduct(p);
                            setShowWarehouseTransferModal(true);
                          }}
                        >
                          🚚 ໂອນຍ້າຍໜ້າຮ້ານ
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenBarcodeGen(p)}>{db.getLabel('auto_____ບາໂຄ້ດ_hc240f', `🏷️ ບາໂຄ້ດ`)}</button>
                    {hasInventoryPermission('inventoryEditProduct') && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleOpenEdit(p)}>{db.getLabel('auto____ແກ້ໄຂ_mmb6rr', `📝 ແກ້ໄຂ`)}</button>
                    )}
                    {hasInventoryPermission('inventoryDeleteProduct') && (
                      <button type="button" className="btn btn-sm" style={{ background: '#c0392b', color: 'white', border: 'none' }} onClick={() => handleDeleteProduct(p)}>{db.getLabel('auto_____ລົບ_ps8okf', `🗑️ ລົບ`)}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
  
      
      {/* Warehouse Restock Modal */}
      {showWarehouseRestockModal && warehouseActiveProduct && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card animate-fade-in" style={{ maxWidth: '400px', padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ecc71' }}>{db.getLabel('auto____ຮັບສິນຄ້າເຂົ້າສາງໃຫຍ່_po8lyb', `📥 ຮັບສິນຄ້າເຂົ້າສາງໃຫຍ່`)}</span>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowWarehouseRestockModal(false);
                    setWarehouseActiveProduct(null);
                  }}
                >✕</button>
              </div>
              <form onSubmit={handleWarehouseRestockSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{warehouseActiveProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      ບາໂຄ້ດ: {warehouseActiveProduct.barcode || '-'} {db.getLabel('auto___ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ__27s7xe', `| ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ:`)} {warehouseActiveProduct.warehouseStock || 0} {warehouseActiveProduct.unit}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຈຳນວນຮັບເຂົ້າສາງໃຫຍ່___1t3af5', `ຈຳນວນຮັບເຂົ້າສາງໃຫຍ່ (`)}{warehouseActiveProduct.unit}) <span style={{ color: 'var(--alert-red)' }}>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0.001"
                      step="any"
                      placeholder={db.getLabel('auto_ປ້ອນຈຳນວນ____4gla08', `ປ້ອນຈຳນວນ...`)} 
                      value={warehouseRestockQty} 
                      onChange={(e) => setWarehouseRestockQty(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ໝາຍເຫດ__ເຊັ່ນ__ຊື່ຜູ້ສະໜອ_1y84u', `ໝາຍເຫດ (ເຊັ່ນ: ຊື່ຜູ້ສະໜອງ, ເລກທີບິນ...)`)}</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      placeholder={db.getLabel('auto_ປ້ອນໝາຍເຫດ____yl0co3', `ປ້ອນໝາຍເຫດ...`)}
                      value={warehouseRestockNotes} 
                      onChange={(e) => setWarehouseRestockNotes(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowWarehouseRestockModal(false);
                      setWarehouseActiveProduct(null);
                    }}
                  >{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#2ecc71', color: 'black', borderColor: '#2ecc71', fontWeight: 'bold' }}>{db.getLabel('auto____ຢືນຢັນຮັບເຂົ້າ_esw8jb', `📥 ຢືນຢັນຮັບເຂົ້າ`)}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Warehouse Transfer Modal */}
      {showWarehouseTransferModal && warehouseActiveProduct && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card animate-fade-in" style={{ maxWidth: '400px', padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{db.getLabel('auto____ໂອນຍ້າຍສິນຄ້າໄປໜ້າຮ້ານ_jlz7ao', `🚚 ໂອນຍ້າຍສິນຄ້າໄປໜ້າຮ້ານ`)}</span>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowWarehouseTransferModal(false);
                    setWarehouseActiveProduct(null);
                  }}
                >✕</button>
              </div>
              <form onSubmit={handleWarehouseTransferSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{warehouseActiveProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{db.getLabel('auto____ສະຕັອກໜ້າຮ້ານປັດຈຸບັນ__1dsiwk', `📦 ສະຕັອກໜ້າຮ້ານປັດຈຸບັນ:`)} {warehouseActiveProduct.stock || 0} {warehouseActiveProduct.unit}</span>
                      <span>{db.getLabel('auto____ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ__zevqh6', `🏠 ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ:`)} {warehouseActiveProduct.warehouseStock || 0} {warehouseActiveProduct.unit}</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຈຳນວນທີ່ຕ້ອງການໂອນຍ້າຍ___m081er', `ຈຳນວນທີ່ຕ້ອງການໂອນຍ້າຍ (`)}{warehouseActiveProduct.unit}) <span style={{ color: 'var(--alert-red)' }}>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0.001"
                      step="any"
                      placeholder={db.getLabel('auto_ປ້ອນຈຳນວນໂອນຍ້າຍ____hhlycx', `ປ້ອນຈຳນວນໂອນຍ້າຍ...`)} 
                      value={warehouseTransferQty} 
                      onChange={(e) => setWarehouseTransferQty(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ໝາຍເຫດ__ເຊັ່ນ__ໂອນໄປເພີ່ມ_bz6fte', `ໝາຍເຫດ (ເຊັ່ນ: ໂອນໄປເພີ່ມໜ້າຮ້ານ...)`)}</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      placeholder={db.getLabel('auto_ປ້ອນໝາຍເຫດ____yl0co3', `ປ້ອນໝາຍເຫດ...`)}
                      value={warehouseTransferNotes} 
                      onChange={(e) => setWarehouseTransferNotes(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowWarehouseTransferModal(false);
                      setWarehouseActiveProduct(null);
                    }}
                  >{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: 'bold' }}>{db.getLabel('auto____ຢືນຢັນການໂອນ_secis1', `🚚 ຢືນຢັນການໂອນ`)}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

            {/* Barcode Canvas printing modal */}
      {showBarcodeModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{db.getLabel('auto_____ລະບົບສ້າງ___ປຣິນບາໂຄ້_qqfe0a', `🏷️ ລະບົບສ້າງ & ປຣິນບາໂຄ້ດ`)}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowBarcodeModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {selectedBarcodeProd 
                  ? `ສິນຄ້າ: ${selectedBarcodeProd.name}`
                  : 'ປ້ອນລະຫັດເພື່ອສ້າງບາໂຄ້ດສະເພາະກິດ'}
              </p>

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ຄົ້ນຫາປະເພດບາໂຄ້ດ__Search_bpn7ui', `ຄົ້ນຫາປະເພດບາໂຄ້ດ (Search Barcode Format)`)}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={db.getLabel('auto____ພິມເພື່ອຄົ້ນຫາປະເພດບາໂ_pni3jb', `🔍 ພິມເພື່ອຄົ້ນຫາປະເພດບາໂຄ້ດ...`)}
                  value={barcodeFormatSearch}
                  onChange={(e) => setBarcodeFormatSearch(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <label className="form-label">{db.getLabel('auto_ປະເພດບາໂຄ້ດ__Barcode_Type_35owif', `ປະເພດບາໂຄ້ດ (Barcode Type / Format)`)}</label>
                <select
                  className="form-control"
                  value={barcodeFormat}
                  onChange={(e) => handleBarcodeFormatChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {ALL_BARCODE_FORMATS.filter(f => 
                    f.value.toLowerCase().includes(barcodeFormatSearch.toLowerCase()) || 
                    f.label.toLowerCase().includes(barcodeFormatSearch.toLowerCase())
                  ).map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {!selectedBarcodeProd && (
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label">{db.getLabel('auto_ລະຫັດບາໂຄ້ດ__ສະເພາະຕົວເລກ_htsrrc', `ລະຫັດບາໂຄ້ດ (ສະເພາະຕົວເລກ ແລະ ຕົວອັກສອນ A-Z)`)}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customBarcodeText}
                    onChange={(e) => setCustomBarcodeText(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                  />
                </div>
              )}

              <div className="form-group" style={{ textAlign: 'left', marginTop: '12px' }}>
                <label className="form-label">{db.getLabel('auto_ຈຳນວນສະຕິກເກີທີ່ຕ້ອງການປຣ_4bqeoi', `ຈຳນວນສະຕິກເກີທີ່ຕ້ອງການປຣິນ (Print Quantity)`)}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="cart-qty-btn"
                    style={{ width: '36px', height: '36px', fontSize: '1.2rem', padding: 0 }}
                    onClick={() => setBarcodePrintQty(Math.max(1, barcodePrintQty - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ textAlign: 'center', flex: 1, fontFamily: 'monospace', fontSize: '1.1rem', margin: 0 }}
                    value={barcodePrintQty}
                    onChange={(e) => setBarcodePrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button
                    type="button"
                    className="cart-qty-btn"
                    style={{ width: '36px', height: '36px', fontSize: '1.2rem', padding: 0 }}
                    onClick={() => setBarcodePrintQty(barcodePrintQty + 1)}
                  >
                    +
                  </button>
                  {selectedBarcodeProd && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px' }}
                      onClick={() => setBarcodePrintQty(Math.max(1, selectedBarcodeProd.stock))}
                    >
                      ເທົ່າສະຕັອກ ({selectedBarcodeProd.stock})
                    </button>
                  )}
                </div>
              </div>

              {/* Barcode Canvas */}
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'inline-block', marginTop: '12px' }}>
                <canvas
                  ref={barcodeCanvasRef}
                  width="300"
                  height="120"
                  style={{ display: 'block' }}
                />
              </div>

              <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                *ສາມາດນຳບາໂຄ້ດນີ້ໄປປຣິນຕິດກັບຖົງພຣະ ຫຼື ຂອບພຣະ ເພື່ອໃຊ້ເຄື່ອງສະແກນຍິງຂາຍໄດ້ທັນທີ
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBarcodeModal(false)}>{db.getLabel('auto_ປິດ_27lff', `ປິດ`)}</button>
              <button className="btn btn-primary" onClick={handlePrintBarcode}>{db.getLabel('auto_____ປຣິນສະຕິກເກີບາໂຄ້ດ_6up43q', `🖨️ ປຣິນສະຕິກເກີບາໂຄ້ດ`)}</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Bulk Barcode Modal */}
      {showBulkBarcodeModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{db.getLabel('auto_____ປຣິນບາໂຄ້ດຫຼາຍລາຍການ__mztvh9', `🏷️ ປຣິນບາໂຄ້ດຫຼາຍລາຍການ (Bulk Printer)`)}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowBulkBarcodeModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                ເລືອກຈຳນວນປຣິນບາໂຄ້ດໃຫ້ແຕ່ລະສິນຄ້າ. ລະບົບຈະລວມເປັນໜ້າດຽວເພື່ອໃຫ້ປຣິນອອກເຄື່ອງສະຕິກເກີໄດ້ງ່າຍ.
              </p>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ຄົ້ນຫາປະເພດບາໂຄ້ດ__Search_bpn7ui', `ຄົ້ນຫາປະເພດບາໂຄ້ດ (Search Barcode Format)`)}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={db.getLabel('auto____ພິມເພື່ອຄົ້ນຫາປະເພດບາໂ_pni3jb', `🔍 ພິມເພື່ອຄົ້ນຫາປະເພດບາໂຄ້ດ...`)}
                  value={bulkBarcodeFormatSearch}
                  onChange={(e) => setBulkBarcodeFormatSearch(e.target.value)}
                  style={{ marginBottom: '8px', padding: '6px 10px', height: '34px', fontSize: '0.85rem' }}
                />
                <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ປະເພດບາໂຄ້ດ__Barcode_Type_35owif', `ປະເພດບາໂຄ້ດ (Barcode Type / Format)`)}</label>
                <select
                  className="form-control"
                  value={barcodeFormat}
                  onChange={(e) => handleBarcodeFormatChange(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', height: '34px', fontSize: '0.85rem' }}
                >
                  {ALL_BARCODE_FORMATS.filter(f => 
                    f.value.toLowerCase().includes(bulkBarcodeFormatSearch.toLowerCase()) || 
                    f.label.toLowerCase().includes(bulkBarcodeFormatSearch.toLowerCase())
                  ).map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Filters inside Modal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder={db.getLabel('auto____ຄົ້ນຫາຊື່_ຫຼື_ບາໂຄ້ດ___mjmwlw', `🔍 ຄົ້ນຫາຊື່ ຫຼື ບາໂຄ້ດ...`)}
                  className="form-control"
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '6px' }}>
                {[
                  { id: 'all', name: 'ທັງໝົດ' },
                  ...categories.filter(cat => cat.type !== 'service').map(cat => ({
                    id: cat.id,
                    name: cat.name
                  }))
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`nav-tab ${bulkCatFilter === cat.id ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '15px' }}
                    onClick={() => setBulkCatFilter(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Global Preset Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    const updated = { ...bulkPrintQtys };
                    products.filter(p => {
                      const matchesCat = bulkCatFilter === 'all' || p.category === bulkCatFilter;
                      const matchesSearch = p.name.toLowerCase().includes(bulkSearch.toLowerCase()) || p.barcode.includes(bulkSearch);
                      return matchesCat && matchesSearch && !db.isServiceCategory(p.category);
                    }).forEach(p => {
                      updated[p.id] = Math.max(0, p.stock);
                    });
                    setBulkPrintQtys(updated);
                  }}
                >
                  📋 ຕັ້ງທັງໝົດເທົ່າກັບສະຕັອກ
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}
                  onClick={() => {
                    const updated = { ...bulkPrintQtys };
                    products.filter(p => {
                      const matchesCat = bulkCatFilter === 'all' || p.category === bulkCatFilter;
                      const matchesSearch = p.name.toLowerCase().includes(bulkSearch.toLowerCase()) || p.barcode.includes(bulkSearch);
                      return matchesCat && matchesSearch;
                    }).forEach(p => {
                      updated[p.id] = 0;
                    });
                    setBulkPrintQtys(updated);
                  }}
                >
                  🗑️ ລ້າງທັງໝົດ
                </button>
              </div>

              {/* Products List */}
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '6px', background: 'rgba(0,0,0,0.2)' }}>
                {products.filter(p => {
                  const matchesCat = bulkCatFilter === 'all' || p.category === bulkCatFilter;
                  const matchesSearch = p.name.toLowerCase().includes(bulkSearch.toLowerCase()) || p.barcode.includes(bulkSearch);
                  return matchesCat && matchesSearch;
                }).length === 0 ? (
                  <div style={{ padding: '30px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    ບໍ່ພົບສິນຄ້າທີ່ຄົ້ນຫາ
                  </div>
                ) : (
                  products.filter(p => {
                    const matchesCat = bulkCatFilter === 'all' || p.category === bulkCatFilter;
                    const matchesSearch = p.name.toLowerCase().includes(bulkSearch.toLowerCase()) || p.barcode.includes(bulkSearch);
                    return matchesCat && matchesSearch;
                  }).map(p => {
                    const qty = bulkPrintQtys[p.id] || 0;
                    const isLow = !db.isServiceCategory(p.category) && p.stock <= p.minStock;
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: isLow ? 'var(--alert-red)' : 'var(--text-secondary)' }}>
                              ບາໂຄ້ດ: <span style={{ fontFamily: 'monospace' }}>{p.barcode}</span> {db.getLabel('auto___ສະຕັອກ__teoxy8', `| ສະຕັອກ:`)} {db.isServiceCategory(p.category) ? 'ບໍລິການ' : `${p.stock} ${p.unit}`}
                            </div>
                          </div>
                        </div>

                        {!db.isServiceCategory(p.category) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              style={{ width: '26px', height: '26px', padding: 0 }}
                              onClick={() => setBulkPrintQtys({ ...bulkPrintQtys, [p.id]: Math.max(0, qty - 1) })}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => setBulkPrintQtys({ ...bulkPrintQtys, [p.id]: Math.max(0, parseInt(e.target.value) || 0) })}
                              style={{
                                width: '50px',
                                background: '#000',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '4px',
                                color: qty > 0 ? 'var(--gold-primary)' : '#999',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                padding: '2px',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              type="button"
                              className="cart-qty-btn"
                              style={{ width: '26px', height: '26px', padding: 0 }}
                              onClick={() => setBulkPrintQtys({ ...bulkPrintQtys, [p.id]: qty + 1 })}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '2px 6px', fontSize: '0.75rem', marginLeft: '4px' }}
                              onClick={() => setBulkPrintQtys({ ...bulkPrintQtys, [p.id]: Math.max(0, p.stock) })}
                            >
                              ເທົ່າສະຕັອກ
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{db.getLabel('auto_ບໍ່ມີສະຕັອກ_fc08f5', `ບໍ່ມີສະຕັອກ`)}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total labels selected counter */}
              <div style={{ marginTop: '14px', textAlign: 'right', fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                ລວມສະຕິກເກີທີ່ຈະປຣິນທັງໝົດ: {Object.values(bulkPrintQtys).reduce((a, b) => a + b, 0)} ໃບ
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBulkBarcodeModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
              <button className="btn btn-primary" onClick={handlePrintBulkBarcodes}>{db.getLabel('auto_____ປຣິນບາໂຄ້ດທັງໝົດທີ່ເລ_dkuxzn', `🖨️ ປຣິນບາໂຄ້ດທັງໝົດທີ່ເລືອກ`)}</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Category Management Modal */}
            {/* Add / Edit Product Modal */}
      {showModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{editProduct ? '📝 ແກ້ໄຂລາຍລະອຽດສິນຄ້າ' : '➕ ເພີ່ມສິນຄ້າໃໝ່'}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຊື່ສິນຄ້າ__ພາສາລາວ_ໄທ__f7rz6s', `ຊື່ສິນຄ້າ (ພາສາລາວ/ໄທ)`)}</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    autoComplete="off"
                  />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">{db.getLabel('auto_ໝວດໝູ່__Category__1el2u7', `ໝວດໝູ່ (Category)`)}</label>
                  <div 
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#221e1a',
                      color: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      minHeight: '38px'
                    }}
                  >
                    {(() => {
                      const selectedCat = categories.find(c => c.id === formData.category || c.name === formData.category);
                      if (selectedCat) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {selectedCat.icon && (selectedCat.icon.startsWith('data:image/') || selectedCat.icon.startsWith('http')) ? (
                              <img src={selectedCat.icon} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '2px' }} alt="" />
                            ) : (
                              <span>{selectedCat.icon || '📦'}</span>
                            )}
                            <span>{selectedCat.name}</span>
                          </div>
                        );
                      }
                      return <span style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ເລືອກໝວດໝູ່____4x00h2', `ເລືອກໝວດໝູ່...`)}</span>;
                    })()}
                    <span style={{ transition: 'transform 0.2s', transform: showCategoryDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </div>

                  {showCategoryDropdown && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#1a1715',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}
                    >
                      {categories.map(cat => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            const isService = db.isServiceCategory(cat.id);
                            setFormData({
                              ...formData,
                              category: cat.id,
                              stock: isService ? '0' : (formData.stock || '10'),
                              minStock: isService ? '0' : (formData.minStock || '2'),
                              unit: isService ? 'ຄັ້ງ' : (formData.unit || 'ອັນ')
                            });
                            setShowCategoryDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: formData.category === cat.id ? 'rgba(212,175,55,0.1)' : 'transparent'
                          }}
                        >
                          {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                            <img src={cat.icon} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '2px' }} alt="" />
                          ) : (
                            <span>{cat.icon || '📦'}</span>
                          )}
                          <span>{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ລາຄາຂາຍ__ກີບ__nwpdmb', `ລາຄາຂາຍ (ກີບ)`)}</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
{hasInventoryPermission('inventoryViewCost') && (
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ລາຄ_ຕົ້ນທຶນ__ກີບ__h4un78', `ລາຄาຕົ້ນທຶນ (ກີບ)`)}</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      autoComplete="off"
                      placeholder="0"
                    />
                  </div>
)}
                </div>

                {!db.isServiceCategory(formData.category) ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ຈຳນວນໃນສະຕັອກ_l9wofo', `ຈຳນວນໃນສະຕັອກ`)}</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{db.getLabel('auto_ແຈ້ງເຕືອນເມື່ອຕໍ່າກວ່າ_8xzqv8', `ແຈ້ງເຕືອນເມື່ອຕໍ່າກວ່າ`)}</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 12px', border: '1px dashed var(--gold-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    ຄໍາແນະນຳ: ໝວດບໍລິການຈະບໍ່ໃຊ້ສະຕັອກ. ລະບົບຈະບັງຄັບ stock/min stock ເປັນ 0 ໃຫ້ອັດຕະໂນມັດ.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ຫົວໜ່ວ__7dd5s2', `ຫົວໜ່ວย`)}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder={db.getLabel('auto_ອັນ__ເສັ້ນ__ອົງ_jx95pz', `ອັນ, ເສັ້ນ, ອົງ`)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ລະຫັດບາໂຄ້ດ__Barcode__njohbt', `ລະຫັດບາໂຄ້ດ (Barcode)`)}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        style={{ flex: 1, margin: 0 }}
                        placeholder={db.getLabel('auto_ລະຫັດບາໂຄ້ດ____bukxvq', `ລະຫັດບາໂຄ້ດ...`)}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
                        onClick={() => {
                          setScanHelperInput('');
                          setShowScanHelperModal(true);
                        }}
                      >
                        🔌 ສະແກນ
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!formData.showOnline}
                        onChange={(e) => setFormData({ ...formData, showOnline: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                      />
                      <span>{db.getLabel('auto_ສະແດງໃນ_Online_Shop_fglr8n', `ສະແດງໃນ Online Shop`)}</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ລາຄາອອນລາຍ__ກີບ__mofhwt', `ລາຄາອອນລາຍ (ກີບ)`)}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.priceOnline}
                      onChange={(e) => setFormData({ ...formData, priceOnline: e.target.value })}
                      placeholder={formData.price || '0'}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ລາຍລະອຽດສິນຄ້າ__Product_D_t54qv7', `ລາຍລະອຽດສິນຄ້າ (Product Description)`)}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}
                    placeholder={db.getLabel('auto_ປ້ອນລາຍລະອຽດສິນຄ້າ____8y7bpf', `ປ້ອນລາຍລະອຽດສິນຄ້າ...`)}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{db.getLabel('auto_ຮູບພາບສິນຄ້າ__Product_Pho_7o79nw', `ຮູບພາບສິນຄ້າ (Product Photos - ອັບໂຫຼດໄດ້ຫຼາຍຮູບ)`)}</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-control"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        const promises = files.map(file => {
                          return compressImage(file).catch(err => {
                            console.error('Compression failed, falling back:', err);
                            return new Promise((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result);
                              reader.readAsDataURL(file);
                            });
                          });
                        });
                        Promise.all(promises).then(base64s => {
                          setFormData(prev => {
                            const newImages = [...(prev.images || []), ...base64s];
                            return {
                              ...prev,
                              images: newImages,
                              image: prev.image || base64s[0]
                            };
                          });
                        });
                      }
                    }}
                  />
                  {formData.images && formData.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px', marginTop: '10px' }}>
                      {formData.images.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                          <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEditImageIdx(idx);
                              setEditorImageToEdit(img);
                              setShowImageEditorModal(true);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              background: 'rgba(212,175,55,0.95)',
                              color: 'black',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 5,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.5)'
                            }}
                            title={db.getLabel('auto_ແຕ່ງຮູບດ້ວຍ_AI_9ecmj5', `ແຕ່ງຮູບດ້ວຍ AI`)}
                          >
                            🎨
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedImages = formData.images.filter((_, i) => i !== idx);
                              setFormData(prev => ({
                                ...prev,
                                images: updatedImages,
                                image: updatedImages.length > 0 ? updatedImages[0] : ''
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              background: 'rgba(231,76,60,0.85)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 1
                            }}
                          >
                            ✕
                          </button>
                          {idx === 0 && (
                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(212,175,55,0.85)', color: 'black', fontSize: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditProduct(null);
                  setFormData({
                    name: '',
                    category: '',
                    price: '',
                    cost: '',
                    stock: '',
                    minStock: '',
                    unit: 'ອັນ',
                    barcode: '',
                    image: '',
                    showOnline: true,
                    priceOnline: '',
                    priceVip: ''
                  });
                }}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                <button type="submit" className="btn btn-primary">{db.getLabel('auto____ບັນທຶກສິນຄ້າ_92od6r', `💾 ບັນທຶກສິນຄ້າ`)}</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Warehouse Restock Modal */}
      {showWarehouseRestockModal && warehouseActiveProduct && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal-content modal-sm animate-fade-in" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <span className="modal-title">{db.getLabel('auto____ຮັບສິນຄ້າເຂົ້າສາງໃຫຍ່_po8lyb', `📥 ຮັບສິນຄ້າເຂົ້າສາງໃຫຍ່`)}</span>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowWarehouseRestockModal(false);
                    setWarehouseActiveProduct(null);
                  }}
                >✕</button>
              </div>
              <form onSubmit={handleWarehouseRestockSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{warehouseActiveProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      ບາໂຄ້ດ: {warehouseActiveProduct.barcode || '-'} {db.getLabel('auto___ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ__27s7xe', `| ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ:`)} {warehouseActiveProduct.warehouseStock || 0} {warehouseActiveProduct.unit}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ຈຳນວນຮັບເຂົ້າສາງໃຫຍ່___1t3af5', `ຈຳນວນຮັບເຂົ້າສາງໃຫຍ່ (`)}{warehouseActiveProduct.unit}) <span style={{ color: 'var(--alert-red)' }}>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0.001"
                      step="any"
                      placeholder={db.getLabel('auto_ປ້ອນຈຳນວນ____4gla08', `ປ້ອນຈຳນວນ...`)} 
                      value={warehouseRestockQty} 
                      onChange={(e) => setWarehouseRestockQty(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ໝາຍເຫດ__ເຊັ່ນ__ຊື່ຜູ້ສະໜອ_1y84u', `ໝາຍເຫດ (ເຊັ່ນ: ຊື່ຜູ້ສະໜອງ, ເລກທີບິນ...)`)}</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      placeholder={db.getLabel('auto_ປ້ອນໝາຍເຫດ____yl0co3', `ປ້ອນໝາຍເຫດ...`)}
                      value={warehouseRestockNotes} 
                      onChange={(e) => setWarehouseRestockNotes(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowWarehouseRestockModal(false);
                      setWarehouseActiveProduct(null);
                    }}
                  >{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary">{db.getLabel('auto____ຢືນຢັນຮັບເຂົ້າ_esw8jb', `📥 ຢືນຢັນຮັບເຂົ້າ`)}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Warehouse Transfer Modal */}
      {showWarehouseTransferModal && warehouseActiveProduct && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal-content modal-sm animate-fade-in" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <span className="modal-title">{db.getLabel('auto____ໂອນຍ້າຍສິນຄ້າໄປໜ້າຮ້ານ_jlz7ao', `🚚 ໂອນຍ້າຍສິນຄ້າໄປໜ້າຮ້ານ`)}</span>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowWarehouseTransferModal(false);
                    setWarehouseActiveProduct(null);
                  }}
                >✕</button>
              </div>
              <form onSubmit={handleWarehouseTransferSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{warehouseActiveProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{db.getLabel('auto____ສະຕັອກໜ້າຮ້ານປັດຈຸບັນ__1dsiwk', `📦 ສະຕັອກໜ້າຮ້ານປັດຈຸບັນ:`)} {warehouseActiveProduct.stock || 0} {warehouseActiveProduct.unit}</span>
                      <span>{db.getLabel('auto____ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ__zevqh6', `🏠 ສະຕັອກສາງໃຫຍ່ປັດຈຸບັນ:`)} {warehouseActiveProduct.warehouseStock || 0} {warehouseActiveProduct.unit}</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ຈຳນວນທີ່ຕ້ອງການໂອນຍ້າຍ___m081er', `ຈຳນວນທີ່ຕ້ອງການໂອນຍ້າຍ (`)}{warehouseActiveProduct.unit}) <span style={{ color: 'var(--alert-red)' }}>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0.001"
                      step="any"
                      placeholder={db.getLabel('auto_ປ້ອນຈຳນວນໂອນຍ້າຍ____hhlycx', `ປ້ອນຈຳນວນໂອນຍ້າຍ...`)} 
                      value={warehouseTransferQty} 
                      onChange={(e) => setWarehouseTransferQty(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{db.getLabel('auto_ໝາຍເຫດ__ເຊັ່ນ__ໂອນໄປເພີ່ມ_bz6fte', `ໝາຍເຫດ (ເຊັ່ນ: ໂອນໄປເພີ່ມໜ້າຮ້ານ...)`)}</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      placeholder={db.getLabel('auto_ປ້ອນໝາຍເຫດ____yl0co3', `ປ້ອນໝາຍເຫດ...`)}
                      value={warehouseTransferNotes} 
                      onChange={(e) => setWarehouseTransferNotes(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowWarehouseTransferModal(false);
                      setWarehouseActiveProduct(null);
                    }}
                  >{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary">{db.getLabel('auto____ຢືນຢັນການໂອນ_secis1', `🚚 ຢືນຢັນການໂອນ`)}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {showCategoryModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">🗂️ {editingCategory ? 'ແກ້ໄຂໝວດໝູ່ສິນຄ້າ' : 'ຈັດການໝວດໝູ່ສິນຄ້າ'}</span>
              <button
                className="btn-secondary"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setNewCatName('');
                  setNewCatIcon('📦');
                  setNewCatType('physical');
                  setCategoryError('');
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Form to Add / Edit Category */}
              <form
                onSubmit={handleCategorySubmit}
                style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '20px' }}
              >
                <h4 style={{ color: 'var(--gold-primary)', marginTop: 0, marginBottom: '12px', fontSize: '0.95rem' }}>{editingCategory ? '✏️ ແກ້ໄຂໝວດໝູ່' : '➕ ເພີ່ມໝວດໝູ່ໃໝ່'}</h4>
                {categoryError && (
                  <div style={{ color: 'var(--alert-red)', fontSize: '0.8rem', marginBottom: '10px', padding: '8px', background: 'rgba(231,76,60,0.1)', borderRadius: '4px', border: '1px solid var(--alert-red)' }}>
                    ⚠️ {categoryError}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Icon Preview */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      border: '2px dashed var(--gold-primary)',
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {newCatIcon && (newCatIcon.startsWith('data:image/') || newCatIcon.startsWith('http')) ? (
                        <img src={newCatIcon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Icon preview" />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>{newCatIcon || '📦'}</span>
                      )}
                    </div>
                    
                    {/* Icon source selection */}
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginBottom: '4px' }}>{db.getLabel('auto_ອັບໂຫຼດໄອຄອນສ່ວນຕົວ__Uplo_mm1idz', `ອັບໂຫຼດໄອຄອນສ່ວນຕົວ (Upload Custom Icon)`)}</label>
                      <input
                        type="file"
                        accept="image/*"
                        id="cat-icon-uploader"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            compressImage(file).then(compressedBase64 => {
                              setNewCatIcon(compressedBase64);
                            }).catch(err => {
                              console.error('Compression failed, falling back:', err);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setNewCatIcon(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                      <label htmlFor="cat-icon-uploader" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}>
                        📤 ເລືອກຮູບພາບ
                      </label>
                      {newCatIcon && (newCatIcon.startsWith('data:image/') || newCatIcon.startsWith('http')) && (
                        <button
                          type="button"
                          className="btn"
                          style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => setNewCatIcon('📦')}
                        >
                          ລ້າງຮູບ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable emoji selection list */}
                  <div>
                    <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຫຼື_ເລືອກຈາກອີໂມຈິ__Choos_yhdgwk', `ຫຼື ເລືອກຈາກອີໂມຈິ (Choose Emoji):`)}</label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      maxHeight: '110px',
                      overflowY: 'auto',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {[
                        '📦', '🖼️', '📿', '⛓️', '🛠️', '💎', '🏺', '📜', '🔱', '🎒', '🎁', '🔑',
                        '👑', '🏆', '🔮', '🛡️', '⚔️', '🪞', '🪔', '🔔', '🏮', '💮', '⚜️', '🏵️',
                        '💠', '♻️', '🎐', '🧧', '✉️', '🏷️', '🛍️', '🛒', '🔗', '🪛', '🔧', '🔨',
                        '🪵', '🪨', '🍀', '🌸', '🐉', '🐅', '🦅', '🐘', '🦁', '🐍', '🐢', '☯️',
                        '🕉️', '☸️', '🌟', '✨', '💫', '🪙', '💵'
                      ].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCatIcon(emoji)}
                          style={{
                            fontSize: '1.25rem',
                            background: newCatIcon === emoji ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)',
                            border: newCatIcon === emoji ? '1px solid var(--gold-primary)' : '1px solid transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">{db.getLabel('auto_ຊື່ໝວດໝູ່_p6u319', `ຊື່ໝວດໝູ່`)}</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder={db.getLabel('auto_ຕົວຢ່າງ__ພຣະຜົງ__ຂອງຂວັນ__ncoyew', `ຕົວຢ່າງ: ພຣະຜົງ, ຂອງຂວັນ...`)}
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>
                  <div style={{ width: '160px' }}>
                    <label className="form-label">{db.getLabel('auto_ປະເພດໝວດໝູ່_pmuceb', `ປະເພດໝວດໝູ່`)}</label>
                    <select
                      className="form-control"
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                    >
                      <option value="physical">{db.getLabel('auto____ສິນຄ້າ__ມີສະຕັອກ__816oji', `📦 ສິນຄ້າ (ມີສະຕັອກ)`)}</option>
                      <option value="service">{db.getLabel('auto_____ບໍລິການ__ບໍ່ມີສະຕັອກ__6tds78', `🛠️ ບໍລິການ (ບໍ່ມີສະຕັອກ)`)}</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    💾 {editingCategory ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກໝວດໝູ່'}
                  </button>
                </div>
              </form>

              {/* List of Categories */}
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '10px', fontSize: '0.95rem' }}>{db.getLabel('auto____ລາຍການໝວດໝູ່ທັງໝົດ_21a3bv', `📋 ລາຍການໝວດໝູ່ທັງໝົດ`)}</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
                {categories.map(cat => {
                  const hasProducts = products.some(p => p.category === cat.id);
                  const catType = cat.type || (db.isServiceCategory(cat.id) ? 'service' : 'physical');
                  
                  return (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                          <img src={cat.icon} style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }} alt="" />
                        ) : (
                          <span style={{ fontSize: '1.3rem' }}>{cat.icon || '📦'}</span>
                        )}
                        <div>
                          <span style={{ fontWeight: '500', color: 'white' }}>{db.getLabel('cat_' + cat.id, cat.name)}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: catType === 'service' ? '#e5a93b' : '#27ae60',
                            background: catType === 'service' ? 'rgba(229,169,59,0.1)' : 'rgba(39,174,96,0.1)',
                            border: `1px solid ${catType === 'service' ? 'rgba(229,169,59,0.2)' : 'rgba(39,174,96,0.2)'}`,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginLeft: '8px',
                            display: 'inline-block'
                          }}>
                            {catType === 'service' ? '🛠️ ບໍລິການ' : '📦 ສິນຄ້າ'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            marginRight: '8px',
                            color: 'var(--gold-primary)',
                            borderColor: 'var(--gold-primary)',
                            background: 'none',
                            border: '1px solid var(--gold-primary)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => openCategoryEdit(cat)}
                        >
                          ✏️ ແກ້ໄຂ
                        </button>
                        {hasProducts ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ມີ {products.filter(p => p.category === cat.id).length} ສິນຄ້າ
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: 'var(--alert-red)',
                              borderColor: 'var(--alert-red)',
                              background: 'none',
                              border: '1px solid var(--alert-red)',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (confirm(`ຕ້ອງການລຶບໝວດໝູ່ "${cat.name}" ແມ່ນບໍ່?`)) {
                                try {
                                  db.deleteCategory(cat.id);
                                  setCategories(db.getCategories());
                                  setCategoryError('');
                                } catch (err) {
                                  setCategoryError(err.message);
                                }
                              }
                            }}
                          >
                            🗑️ ລຶບ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}>{db.getLabel('auto_ປິດ_27lff', `ປິດ`)}</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Scan Capture Modal Overlay */}
      {showScanHelperModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{db.getLabel('auto____ສະແກນບາໂຄ້ດສິນຄ້າ__Sca_97alnl', `🔌 ສະແກນບາໂຄ້ດສິນຄ້າ (Scan Barcode)`)}</span>
              <button
                className="btn-secondary"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowScanHelperModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔌</div>
              <p style={{ fontSize: '1rem', color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>
                ກະລຸນາສະແກນບາໂຄ້ດສິນຄ້າຂອງທ່ານ
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                ລະບົບຈະກວດຈັບການສະແກນ ແລະ ປ້ອນຂໍ້ມູນເຂົ້າຟອມໂດຍອັດຕະໂນມັດ.
              </p>
              
              <input
                ref={scanInputRef}
                type="text"
                className="form-control"
                placeholder={db.getLabel('auto_ລໍຖ້າການສະແກນ____m13898', `ລໍຖ້າການສະແກນ...`)}
                value={scanHelperInput}
                onChange={(e) => setScanHelperInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = scanHelperInput.trim();
                    if (val) {
                      setFormData(prev => ({ ...prev, barcode: val }));
                      
                      // Audio feedback
                      const settings = db.getSettings();
                      if (settings.barcodeBeep !== false) {
                        try {
                          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                          const osc = audioCtx.createOscillator();
                          const gain = audioCtx.createGain();
                          osc.connect(gain);
                          gain.connect(audioCtx.destination);
                          osc.type = 'sine';
                          osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
                          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                          osc.start();
                          osc.stop(audioCtx.currentTime + 0.08);
                        } catch (err) {
                          console.error("Audio error:", err);
                        }
                      }
                      
                      setShowScanHelperModal(false);
                    }
                  }
                }}
                style={{
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  letterSpacing: '2px',
                  fontFamily: 'monospace',
                  background: 'rgba(25, 20, 15, 0.45)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  width: '100%',
                  color: 'white'
                }}
              />
              
              <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                * ສາມາດປ້ອນດ້ວຍຄີບອດ ແລ້ວກົດ Enter ໄດ້ເຊັ່ນກັນ
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowScanHelperModal(false)}
              >
                ຍົກເລີກ
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const val = scanHelperInput.trim();
                  if (val) {
                    setFormData(prev => ({ ...prev, barcode: val }));
                    
                    // Audio feedback
                    const settings = db.getSettings();
                    if (settings.barcodeBeep !== false) {
                      try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
                        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                        osc.start();
                        osc.stop(audioCtx.currentTime + 0.08);
                      } catch (err) {
                        console.error("Audio error:", err);
                      }
                    }
                    
                    setShowScanHelperModal(false);
                  }
                }}
                disabled={!scanHelperInput.trim()}
              >
                ຕົກລົງ
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {showImageEditorModal && (
        <AmuletImageEditor
          imageUrl={editorImageToEdit}
          onClose={() => setShowImageEditorModal(false)}
          onSave={(newImg) => {
            setFormData(prev => {
              const updatedImages = [...prev.images];
              updatedImages[selectedEditImageIdx] = newImg;
              return {
                ...prev,
                images: updatedImages,
                image: prev.image === editorImageToEdit ? newImg : prev.image
              };
            });
            setShowImageEditorModal(false);
            alert('✓ ບັນທຶກຮູບພາບແຕ່ງແລ້ວຮຽບຮ້ອຍ! (Edited image saved successfully!)');
          }}
        />
      )}

    </div>
  );
}
