import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import Portal from './Portal';
import AmuletImageEditor from './AmuletImageEditor';

const ALL_BARCODE_FORMATS = [
  { value: 'QRCODE', label: 'QR Code (àºªàº³àº¥àº±àºšàºšàº²à»‚àº„à»‰àº”àºªàº±à»‰àº™/2D)' },
  { value: 'CODE128', label: 'Code 128 (à»àº™àº°àº™àº³ / Auto Alphanumeric)' },
  { value: 'CODE128A', label: 'Code 128 A (àº•àº»àº§àºžàº´àº¡à»ƒàº«àºà»ˆ & àº„àº§àºšàº„àº¸àº¡)' },
  { value: 'CODE128B', label: 'Code 128 B (àº•àº»àº§àºžàº´àº¡à»ƒàº«àºà»ˆ & àº™à»‰àº­àº)' },
  { value: 'CODE128C', label: 'Code 128 C (àº•àº»àº§à»€àº¥àºà»€àº—àº»à»ˆàº²àº™àº±à»‰àº™)' },
  { value: 'CODE39', label: 'Code 39 (àº•àº»àº§à»€àº¥àº & àº•àº»àº§àº­àº±àºàºªàº­àº™àº„àº¥àº²àºªàºªàº´àº)' },
  { value: 'EAN13', label: 'EAN-13 (àº¡àº²àº”àº•àº°àº–àº²àº™àºªàº²àºàº»àº™ 13 àº«àº¼àº±àº)' },
  { value: 'EAN8', label: 'EAN-8 (àº¡àº²àº”àº•àº°àº–àº²àº™àºªàº±à»‰àº™ 8 àº«àº¼àº±àº)' },
  { value: 'EAN5', label: 'EAN-5 (à»€àºžàºµà»ˆàº¡à»€àº•àºµàº¡àº›àº¶à»‰àº¡ 5 àº«àº¼àº±àº)' },
  { value: 'EAN2', label: 'EAN-2 (à»€àºžàºµà»ˆàº¡à»€àº•àºµàº¡àº§àº²àº¥àº°àºªàº²àº™ 2 àº«àº¼àº±àº)' },
  { value: 'UPC', label: 'UPC-A (àº¡àº²àº”àº•àº°àº–àº²àº™àº­àº²à»€àº¡àº¥àº´àºàº² 12 àº«àº¼àº±àº)' },
  { value: 'UPCE', label: 'UPC-E (àº¡àº²àº”àº•àº°àº–àº²àº™àº­àº²à»€àº¡àº¥àº´àºàº²àºªàº±à»‰àº™ 8 àº«àº¼àº±àº)' },
  { value: 'ITF', label: 'ITF / Interleaved 2 of 5 (àº•àº»àº§à»€àº¥àºàº„àº¹à»ˆ)' },
  { value: 'ITF14', label: 'ITF-14 (àº‚àº»àº™àºªàº»à»ˆàº‡/àºªàº²àº‡àºªàº´àº™àº„à»‰àº² 14 àº«àº¼àº±àº)' },
  { value: 'MSI', label: 'MSI Plessey (àº•àº»àº§à»€àº¥àº)' },
  { value: 'MSI10', label: 'MSI Mod 10 (àº•àº»àº§à»€àº¥àº)' },
  { value: 'MSI11', label: 'MSI Mod 11 (àº•àº»àº§à»€àº¥àº)' },
  { value: 'MSI1010', label: 'MSI Mod 1010 (àº•àº»àº§à»€àº¥àº)' },
  { value: 'MSI1110', label: 'MSI Mod 1110 (àº•àº»àº§à»€àº¥àº)' },
  { value: 'pharmacode', label: 'Pharmacode (àº¥àº°àº«àº±àº”àº¢àº²/àºàº²àº™à»àºžàº”)' },
  { value: 'codabar', label: 'Codabar (àº•àº»àº§à»€àº¥àº/àº­àº±àºàºªàº­àº™àºžàº´à»€àºªàº”)' }
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
    ctx.fillText('âŒ àº‚à»à»‰àº¡àº¹àº™àºšà»à»ˆàº–àº·àºàº•à»‰àº­àº‡àºªàº³àº¥àº±àºš ' + format, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('(' + text + ')', canvas.width / 2, canvas.height / 2 + 10);
    return canvas.toDataURL();
  }
  
  const handleDisburse = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(disburseForm.qty);
    if (!qtyVal || qtyVal <= 0) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºˆàº³àº™àº§àº™à»€àºšàºµàºàº­àº­àº');
    if (qtyVal > (activeItem.stock || 0)) {
      if (!window.confirm('âš ï¸ àºˆàº³àº™àº§àº™à»€àºšàºµàºàº­àº­àºàº«àº¼àº²àºàºàº§à»ˆàº²àº„àº»àº‡à»€àº«àº¼àº·àº­à»ƒàº™àºªàº²àº‡. àº•à»‰àº­àº‡àºàº²àº™àº”àº³à»€àº™àºµàº™àºàº²àº™àº•à»à»ˆàºšà»à»ˆ?')) return;
    }
    
    db.disburseConsumable(activeItem.id, qtyVal, disburseForm.notes);
    alert('âœ“ à»€àºšàºµàºàº­àº­àºàº­àº¸àº›àº°àºàº­àº™àºªàº³à»€àº¥àº±àº”!');
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
    const cat = ex.categoryName || ex.category || 'àº­àº·à»ˆàº™à»†';
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
        <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>ðŸ”§ àºˆàº±àº”àºàº²àº™àºªàº²àº‡àº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡ (Consumables Stock)</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowReportModal(true)}>
            ðŸ“Š àº¥àº²àºàº‡àº²àº™àº¥àº²àºàºˆà»ˆàº²àºàº›àº°àºˆàº³à»€àº”àº·àº­àº™
          </button>
          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowHistoryModal(true)}>
            ðŸ“‹ àº›àº°àº«àº§àº±àº”àº®àº±àºš-à»€àºšàºµàº
          </button>
          <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }} onClick={() => setShowAddModal(true)}>
            âž• à»€àºžàºµà»ˆàº¡àº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™
          </button>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
          <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>àº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>àº•àº»à»‰àº™àº—àº¶àº™/à»œà»ˆàº§àº</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>àºàº­àº”àº„àº»àº‡à»€àº«àº¼àº·àº­</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>àº‚àº±à»‰àº™àº•à»ˆàº³</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>àº¡àº¹àº™àº„à»ˆàº²àºªàº²àº‡</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>àº—àº¸àº¥àº°àºàº³àºªàº²àº‡</th>
              </tr>
            </thead>
            <tbody>
              {consumables.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    àºšà»à»ˆàº¡àºµàº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡
                  </td>
                </tr>
              ) : consumables.map(item => {
                const totalVal = (item.stock || 0) * (item.costPerUnit || 0);
                const isLow = (item.stock || 0) <= (item.minStock || 0);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: isLow ? 'rgba(231,76,60,0.04)' : 'none' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      {isLow && <span style={{ fontSize: '0.65rem', color: '#e74c3c', background: 'rgba(231,76,60,0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>âš ï¸ à»ƒàºà»‰àºˆàº°à»àº»àº”àºªàº²àº‡</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{(item.costPerUnit || 0).toLocaleString()} â‚­</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: isLow ? '#e74c3c' : 'white' }}>
                      {(item.stock || 0).toLocaleString()} {item.unit || 'àº­àº±àº™'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {(item.minStock || 0).toLocaleString()} {item.unit || 'àº­àº±àº™'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                      {totalVal.toLocaleString()} â‚­
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#2ecc71', color: '#2ecc71', background: 'rgba(46,204,113,0.05)' }} onClick={() => { setActiveItem(item); setShowRestockModal(true); }}>
                          ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#e74c3c', color: '#e74c3c', background: 'rgba(231,76,60,0.05)' }} onClick={() => { setActiveItem(item); setShowDisburseModal(true); }}>
                          ðŸ“¤ à»€àºšàºµàºàº­àº­àº
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
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>âž• à»€àºžàºµà»ˆàº¡àº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>âœ•</button>
              </div>
              <form onSubmit={handleAddConsumable} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">àºŠàº·à»ˆàº­àº¸àº›àº°àºàº­àº™ *</label>
                  <input type="text" className="form-control" placeholder="àº•àº»àº§àº¢à»ˆàº²àº‡: à»€àºˆà»‰àºàº«à»‰àº­àº‡àº™à»‰àº³, àºªàº°àºšàº¹, àºªàº°àºàº±àº­àº”à»€àº—àºš..." value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™àº•à»à»ˆà»œà»ˆàº§àº (LAK)</label>
                    <input type="number" className="form-control" placeholder="0" value={addForm.costPerUnit} onChange={(e) => setAddForm({ ...addForm, costPerUnit: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">àº«àº»àº§à»œà»ˆàº§àº (Unit)</label>
                    <input type="text" className="form-control" placeholder="àº­àº±àº™, àº¡à»‰àº§àº™, à»àºàº±àº”..." value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àºàº­àº”à»€àº¥àºµà»ˆàº¡àº•àº»à»‰àº™</label>
                    <input type="number" className="form-control" placeholder="0" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">àº¥àº°àº”àº±àºšàº‚àº±à»‰àº™àº•à»ˆàº³</label>
                    <input type="number" className="form-control" placeholder="5" value={addForm.minStock} onChange={(e) => setAddForm({ ...addForm, minStock: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }}>àºšàº±àº™àº—àº¶àº</button>
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
                <h3 style={{ color: '#2ecc71', margin: 0 }}>ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²àº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowRestockModal(false)}>âœ•</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <b>àº¥àº²àºàºàº²àº™:</b> {activeItem.name} (àºàº­àº”àº„àº»àº‡à»€àº«àº¼àº·àº­: {activeItem.stock} {activeItem.unit})
              </div>
              <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àºˆàº³àº™àº§àº™àº®àº±àºšà»€àº‚àº»à»‰àº² *</label>
                    <input type="number" className="form-control" placeholder="10" value={restockForm.qty} onChange={(e) => setRestockForm({ ...restockForm, qty: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™àº•à»à»ˆà»œà»ˆàº§àº (LAK)</label>
                    <input type="number" className="form-control" placeholder={activeItem.costPerUnit} value={restockForm.costPerUnit} onChange={(e) => setRestockForm({ ...restockForm, costPerUnit: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">àº§àº´àº—àºµàºàº²àº™àºŠàº³àº¥àº°à»€àº‡àº´àº™</label>
                  <select className="form-control" value={restockForm.paymentMethod} onChange={(e) => setRestockForm({ ...restockForm, paymentMethod: e.target.value })}>
                    <option value="cash">ðŸ’µ à»€àº‡àº´àº™àºªàº»àº” (Cash)</option>
                    <option value="transfer">ðŸ“± à»‚àº­àº™àºœà»ˆàº²àº™ BCEL One (Transfer)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">à»àº²àºà»€àº«àº”/Supplier (Notes)</label>
                  <input type="text" className="form-control" placeholder="àºŠàº·à»‰àº¢àº¹à»ˆàº®à»‰àº²àº™àºªàº°àº”àº§àºàºŠàº·à»‰, àºŠàº·à»‰àº¡àº²à»€àºžàºµà»ˆàº¡..." value={restockForm.notes} onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })} />
                </div>
                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--gold-primary)' }}>
                  âš ï¸ <b>àº«àº¡àº²àºà»€àº«àº”:</b> àºàº²àº™àº®àº±àºšà»€àº‚àº»à»‰àº²àºˆàº°à»€àº®àº±àº”àºàº²àº™ **àºšàº±àº™àº—àº¶àºàº¥àº²àºàºˆà»ˆàº²àºàº®à»‰àº²àº™àº­àº±àº”àº•àº°à»‚àº™àº¡àº±àº”** àº¡àº¹àº™àº„à»ˆàº² {((parseFloat(restockForm.qty) || 0) * (parseFloat(restockForm.costPerUnit) || activeItem.costPerUnit || 0)).toLocaleString()} àºàºµàºš.
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRestockModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#2ecc71', color: 'black', borderColor: '#2ecc71', fontWeight: 'bold' }}> Restock ðŸ“¥</button>
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
                <h3 style={{ color: '#e74c3c', margin: 0 }}>ðŸ“¤ à»€àºšàºµàºàº­àº­àºàº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowDisburseModal(false)}>âœ•</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <b>àº¥àº²àºàºàº²àº™:</b> {activeItem.name} (àºàº­àº”àº„àº»àº‡à»€àº«àº¼àº·àº­: {activeItem.stock} {activeItem.unit})
              </div>
              <form onSubmit={handleDisburse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">àºˆàº³àº™àº§àº™à»€àºšàºµàºàº­àº­àº *</label>
                  <input type="number" className="form-control" placeholder="5" value={disburseForm.qty} onChange={(e) => setDisburseForm({ ...disburseForm, qty: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">àºˆàº¸àº”àº›àº°àºªàº»àº‡/à»àº²àºà»€àº«àº”</label>
                  <input type="text" className="form-control" placeholder="à»€àºšàºµàºà»„àº›à»ƒàºŠà»‰àº¢àº¹à»ˆàº«à»‰àº­àº‡àº™à»‰àº³, à»€àºšàºµàºà»„àº›à»àºžàº±àºà»€àº„àº·à»ˆàº­àº‡..." value={disburseForm.notes} onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })} />
                </div>
                <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#FAB1A0' }}>
                  â„¹ï¸ àºàº²àº™à»€àºšàºµàºàº­àº­àºà»ƒàºŠà»‰àºˆàº°àºšà»à»ˆàº¡àºµàºàº²àº™àºšàº±àº™àº—àº¶àºàº¥àº²àºàºˆà»ˆàº²àºà»€àºžàºµà»ˆàº¡ (àºà»‰àº­àº™àº§à»ˆàº²à»„àº”à»‰àºšàº±àº™àº—àº¶àºà»€àº›àº±àº™àº¥àº²àºàºˆà»ˆàº²àºà»„àº›à»àº¥à»‰àº§àº•àº­àº™àºŠàº·à»‰àº®àº±àºšà»€àº‚àº»à»‰àº²).
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDisburseModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#e74c3c', color: 'white', borderColor: '#e74c3c', fontWeight: 'bold' }}>Disburse ðŸ“¤</button>
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
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ“‹ àº›àº°àº«àº§àº±àº”àº®àº±àºš-à»€àºšàºµàºàº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowHistoryModal(false)}>âœ•</button>
              </div>
              <div className="desktop-table-view">
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>àº§àº±àº™àº—àºµ/à»€àº§àº¥àº²</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>àº¥àº²àºàºàº²àº™</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>àº›àº°à»€àºžàº”</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>àºˆàº³àº™àº§àº™</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>àº¡àº¹àº™àº„à»ˆàº²</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>à»àº²àºà»€àº«àº”/àºœàº¹à»‰à»€àº®àº±àº”</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          àºšà»à»ˆàº¡àºµàº›àº°àº«àº§àº±àº”àº—àº¸àº¥àº°àºàº³
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
                            {tx.type === 'restock' ? 'àº®àº±àºšà»€àº‚àº»à»‰àº²' : 'à»€àºšàºµàºàº­àº­àº'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                          {tx.qty} {tx.unit}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'var(--gold-primary)' }}>
                          {tx.type === 'restock' ? `${(tx.totalCost || 0).toLocaleString()} â‚­` : '-'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ color: 'white' }}>{tx.notes || '-'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>à»‚àº”àº: {tx.createdByName}</div>
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
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ“Š àº¥àº²àºàº‡àº²àº™àºªàº°àº«àº¼àº¸àºšàº¥àº²àºàºˆà»ˆàº²àºàº®à»‰àº²àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowReportModal(false)}>âœ•</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>à»€àº¥àº·àº­àºà»€àº”àº·àº­àº™:</label>
                <input type="month" className="form-control" style={{ width: '160px', background: '#1c1915' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>

              <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.22)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ðŸ’µ àº¥àº§àº¡àº¥àº²àºàºˆà»ˆàº²àºàº—àº±àº‡à»àº»àº”àº›àº°àºˆàº³à»€àº”àº·àº­àº™:</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#FAB1A0', marginTop: '4px' }}>
                    {totalMonthExpenseVal.toLocaleString()} â‚­
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  àºˆàº³àº™àº§àº™àº¥àº²àºàºàº²àº™: <b>{monthExpenses.length} àº¥àº²àºàºàº²àº™</b>
                </div>
              </div>

              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>ðŸ“ à»àºàºàº•àº²àº¡àº›àº°à»€àºžàº”àº¥àº²àºàºˆà»ˆàº²àº (Category Summary):</h4>
              <div className="desktop-table-view" style={{ marginBottom: '20px' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>àº›àº°à»€àºžàº”àº¥àº²àºàºˆà»ˆàº²àº</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>àºˆàº³àº™àº§àº™àºšàº´àº™</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>àºàº­àº”àº¥àº§àº¡ (LAK)</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>à»€àº›àºµà»€àºŠàº±àº™ (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGroupedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          àºšà»à»ˆàº¡àºµàº¥àº²àºàºˆà»ˆàº²àºà»ƒàº™à»€àº”àº·àº­àº™àº™àºµà»‰
                        </td>
                      </tr>
                    ) : sortedGroupedExpenses.map(row => {
                      const pct = totalMonthExpenseVal > 0 ? Math.round((row.total / totalMonthExpenseVal) * 100) : 0;
                      return (
                        <tr key={row.name} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: 'white' }}>{row.name}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{row.count}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#FAB1A0' }}>
                            {row.total.toLocaleString()} â‚­
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

              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>ðŸ“‹ àº¥àº²àºàºàº²àº™àºšàº±àº™àº—àº¶àºàº¥àº²àºàºˆà»ˆàº²àº (Expenses Log):</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {monthExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>àºšà»à»ˆàº¡àºµàº¥àº²àºàºàº²àº™</div>
                ) : monthExpenses.map(ex => (
                  <div key={ex.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{ex.categoryName || ex.category}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {new Date(ex.date).toLocaleDateString('lo-LA')} {ex.notes ? ` â€¢ ${ex.notes}` : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#FAB1A0' }}>
                      {(ex.convertedAmount || ex.amount).toLocaleString()} â‚­
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
// ðŸ”§ CONSUMABLES STOCK SUB-VIEW
// ==========================================
function ConsumablesSubView({ isMobile, activeUser, onUpdate }) {
  const [consumables, setConsumables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState('none');

  // Category manager states
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('ðŸ“¦');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryError, setCategoryError] = useState('');

  const [addForm, setAddForm] = useState({ name: '', costPerUnit: '', stock: '', minStock: '', unit: 'àº­àº±àº™', category: 'other' });
  const [editForm, setEditForm] = useState({ id: '', name: '', costPerUnit: '', minStock: '', unit: 'àº­àº±àº™', category: 'other' });
  const [restockForm, setRestockForm] = useState({ qty: '', costPerUnit: '', paymentMethod: 'cash', notes: '' });
  const [disburseForm, setDisburseForm] = useState({ qty: '', notes: '' });

  const loadData = () => {
    setConsumables((db.getConsumables() || []).filter(Boolean));
    setCategories(db.getConsumableCategories() || []);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(); }, [showCategoryModal]);

  const handleAddConsumable = (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºŠàº·à»ˆàº­àº¸àº›àº°àºàº­àº™');
    db.addConsumable({
      name: addForm.name,
      costPerUnit: parseFloat(addForm.costPerUnit) || 0,
      stock: parseFloat(addForm.stock) || 0,
      minStock: parseFloat(addForm.minStock) || 0,
      unit: addForm.unit || 'àº­àº±àº™',
      category: addForm.category || 'other'
    });
    alert('âœ“ à»€àºžàºµà»ˆàº¡àº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™àºªàº³à»€àº¥àº±àº”!');
    setAddForm({ name: '', costPerUnit: '', stock: '', minStock: '', unit: 'àº­àº±àº™', category: categories[0]?.id || 'other' });
    setShowAddModal(false);
    loadData();
    if (onUpdate) onUpdate();
  };

  const handleEditConsumable = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºŠàº·à»ˆàº­àº¸àº›àº°àºàº­àº™');
    db.updateConsumable(editForm.id, {
      name: editForm.name,
      costPerUnit: parseFloat(editForm.costPerUnit) || 0,
      minStock: parseFloat(editForm.minStock) || 0,
      unit: editForm.unit || 'àº­àº±àº™',
      category: editForm.category || 'other'
    });
    alert('âœ“ à»àºà»‰à»„àº‚àº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™àºªàº³à»€àº¥àº±àº”!');
    setShowEditModal(false);
    loadData();
    if (onUpdate) onUpdate();
  };

  const handleDeleteConsumable = (item) => {
    if (window.confirm(`âš ï¸ àº—à»ˆàº²àº™àº•à»‰àº­àº‡àºàº²àº™àº¥àº¶àºšàº­àº¸àº›àº°àºàº­àº™: ${item.name} à»àº—à»‰àºšà»à»ˆ?`)) {
      db.deleteConsumable(item.id);
      alert('âœ“ àº¥àº¶àºšàº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™àºªàº³à»€àº¥àº±àº”!');
      loadData();
      if (onUpdate) onUpdate();
    }
  };

  const handleRestock = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(restockForm.qty);
    if (!qtyVal || qtyVal <= 0) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºˆàº³àº™àº§àº™àº®àº±àºšà»€àº‚àº»à»‰àº²');
    const costVal = parseFloat(restockForm.costPerUnit) || activeItem.costPerUnit || 0;
    db.restockConsumable(activeItem.id, qtyVal, costVal, restockForm.paymentMethod, restockForm.notes);
    alert('âœ“ àº®àº±àºšà»€àº‚àº»à»‰àº²àº­àº¸àº›àº°àºàº­àº™àºªàº³à»€àº¥àº±àº” (à»àº¥àº° àºšàº±àº™àº—àº¶àºàº¥àº²àºàºˆà»ˆàº²àºàº­àº±àº”àº•àº°à»‚àº™àº¡àº±àº”)!');
    setRestockForm({ qty: '', costPerUnit: '', paymentMethod: 'cash', notes: '' });
    setShowRestockModal(false);
    setActiveItem(null);
    loadData();
    if (onUpdate) onUpdate();
  };

  const handleDisburse = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(disburseForm.qty);
    if (!qtyVal || qtyVal <= 0) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºˆàº³àº™àº§àº™à»€àºšàºµàºàº­àº­àº');
    if (qtyVal > (activeItem.stock || 0)) {
      if (!window.confirm('âš ï¸ àºˆàº³àº™àº§àº™à»€àºšàºµàºàº­àº­àºàº«àº¼àº²àºàºàº§à»ˆàº²àº„àº»àº‡à»€àº«àº¼àº·àº­à»ƒàº™àºªàº²àº‡. àº•à»‰àº­àº‡àºàº²àº™àº”àº³à»€àº™àºµàº™àºàº²àº™àº•à»à»ˆàºšà»à»ˆ?')) return;
    }
    db.disburseConsumable(activeItem.id, qtyVal, disburseForm.notes);
    alert('âœ“ à»€àºšàºµàºàº­àº­àºàº­àº¸àº›àº°àºàº­àº™àºªàº³à»€àº¥àº±àº”!');
    setDisburseForm({ qty: '', notes: '' });
    setShowDisburseModal(false);
    setActiveItem(null);
    loadData();
    if (onUpdate) onUpdate();
  };

  // Category Manager handlers
  const handleAddCategory = () => {
    if (!newCatName.trim()) { setCategoryError('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºŠàº·à»ˆà»àº§àº”à»àº¹à»ˆ'); return; }
    db.addConsumableCategory({ name: newCatName.trim(), icon: newCatIcon });
    setNewCatName(''); setNewCatIcon('ðŸ“¦'); setCategoryError('');
    setCategories(db.getConsumableCategories());
  };
  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) { setCategoryError('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºŠàº·à»ˆ'); return; }
    db.updateConsumableCategory(editingCategory.id, { name: editingCategory.name, icon: editingCategory.icon });
    setEditingCategory(null); setCategoryError('');
    setCategories(db.getConsumableCategories());
  };
  const handleDeleteCategory = (cat) => {
    const inUse = consumables.some(c => c.category === cat.id);
    if (inUse) return alert(`âš ï¸ à»àº§àº”à»àº¹à»ˆ "${cat.icon} ${cat.name}" àºàº³àº¥àº±àº‡àº–àº·àºà»ƒàºŠà»‰àº‡àº²àº™. à»‚àºàº/àº¥àº¶àºšàº¥àº²àºàºàº²àº™àºà»ˆàº­àº™.`);
    if (window.confirm(`àº¥àº¶àºšà»àº§àº”à»àº¹à»ˆ "${cat.name}" à»àº—à»‰àºšà»à»ˆ?`)) {
      db.deleteConsumableCategory(cat.id);
      setCategories(db.getConsumableCategories());
    }
  };

  const getCategoryInfo = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? `${cat.icon} ${cat.name}` : 'ðŸ“ àº­àº·à»ˆàº™à»†';
  };

  // Derived data
  const filteredConsumables = React.useMemo(() => {
    let list = consumables.filter(c => {
      if (!c) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === '' || c.name.toLowerCase().includes(q) || (c.id && c.id.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'low') return (c.stock || 0) <= (c.minStock || 0);
      return c.category === activeFilter;
    });
    switch (sortMode) {
      case 'name_az': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_za': list = [...list].sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'cost_hl': list = [...list].sort((a, b) => (b.costPerUnit || 0) - (a.costPerUnit || 0)); break;
      case 'cost_lh': list = [...list].sort((a, b) => (a.costPerUnit || 0) - (b.costPerUnit || 0)); break;
      case 'stock_hl': list = [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0)); break;
      case 'stock_lh': list = [...list].sort((a, b) => (a.stock || 0) - (b.stock || 0)); break;
      default: break;
    }
    return list;
  }, [consumables, searchQuery, activeFilter, sortMode]);

  const lowStockItems = consumables.filter(c => c && (c.stock || 0) <= (c.minStock || 0));
  const totalStockValue = consumables.reduce((s, c) => s + ((c.stock || 0) * (c.costPerUnit || 0)), 0);

  // Monthly disburse cost
  const currentMonth = selectedMonth;
  let totalDisburseMonth = 0;
  consumables.forEach(c => {
    (c.history || []).forEach(h => {
      if (h.type === 'disburse' && h.date && h.date.startsWith(currentMonth)) {
        totalDisburseMonth += (h.qty || 0) * (h.costPerUnit || c.costPerUnit || 0);
      }
    });
  });

  const allHistory = [];
  consumables.forEach(c => {
    (c.history || []).forEach(h => {
      allHistory.push({ ...h, itemName: c.name, unit: c.unit });
    });
  });
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  const allExpenses = db.getExpenses();
  const monthExpenses = allExpenses.filter(ex => ex.date && ex.date.startsWith(selectedMonth));
  const totalMonthExpenseVal = monthExpenses.reduce((sum, ex) => sum + (ex.convertedAmount || ex.amount), 0);
  const groupedExpenses = {};
  monthExpenses.forEach(ex => {
    const cat = ex.categoryName || ex.category || 'àº­àº·à»ˆàº™à»†';
    if (!groupedExpenses[cat]) groupedExpenses[cat] = { name: cat, total: 0, count: 0 };
    groupedExpenses[cat].total += (ex.convertedAmount || ex.amount);
    groupedExpenses[cat].count++;
  });
  const sortedGroupedExpenses = Object.values(groupedExpenses).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* â”€â”€â”€ TOP ACTION BAR â”€â”€â”€ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>ðŸ”§ àºˆàº±àº”àºàº²àº™àºªàº²àº‡àº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowCategoryModal(true)}>
            ðŸ—‚ï¸ àºˆàº±àº”àºàº²àº™à»àº§àº”à»àº¹à»ˆ
          </button>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowReportModal(true)}>
            ðŸ“Š àº¥àº²àºàº‡àº²àº™àº¥àº²àºàºˆà»ˆàº²àº
          </button>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowHistoryModal(true)}>
            ðŸ“‹ àº›àº°àº«àº§àº±àº”àº®àº±àºš-à»€àºšàºµàº
          </button>
          <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)', fontWeight: 'bold' }} onClick={() => setShowAddModal(true)}>
            âž• à»€àºžàºµà»ˆàº¡àº¥àº²àºàºàº²àº™
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ KPI SUMMARY CARDS â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px' }}>
        {[
          { icon: 'ðŸ“¦', label: 'àº¥àº²àºàºàº²àº™àº—àº±àº‡à»àº»àº”', value: consumables.length + ' àº¥àº²àºàºàº²àº™', color: '#4fc3f7' },
          { icon: 'ðŸ’°', label: 'àº¡àº¹àº™àº„à»ˆàº²àºªàº²àº‡àº¥àº§àº¡', value: totalStockValue.toLocaleString() + ' â‚­', color: 'var(--gold-primary)' },
          { icon: 'âš ï¸', label: 'àºªàº²àº‡à»ƒàºà»‰à»àº»àº”', value: lowStockItems.length + ' àº¥àº²àºàºàº²àº™', color: lowStockItems.length > 0 ? '#e74c3c' : '#2ecc71' },
          { icon: 'ðŸ“¤', label: 'à»€àºšàºµàºà»ƒàºŠà»‰à»€àº”àº·àº­àº™àº™àºµà»‰', value: totalDisburseMonth.toLocaleString() + ' â‚­', color: '#e17055' },
        ].map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: '1.5rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{card.label}</div>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* â”€â”€â”€ CATEGORY BREAKDOWN GRID â”€â”€â”€ */}
      {categories.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>ðŸ“ àºªàº°àº«àº¼àº¸àºšàº•àº²àº¡à»àº§àº”à»àº¹à»ˆ:</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(180px,1fr))', gap: '10px' }}>
            {categories.map(cat => {
              const items = consumables.filter(c => c.category === cat.id);
              const catVal = items.reduce((s, c) => s + ((c.stock || 0) * (c.costPerUnit || 0)), 0);
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveFilter(isActive ? 'all' : cat.id)}
                  style={{
                    background: isActive ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'var(--gold-primary)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{cat.icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isActive ? 'var(--gold-primary)' : 'white' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{items.length} àº¥àº²àºàºàº²àº™</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{catVal.toLocaleString()} â‚­</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€â”€ LOW STOCK ALERT BANNER â”€â”€â”€ */}
      {lowStockItems.length > 0 && (
        <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1rem' }}>ðŸš¨</span>
            <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '0.9rem' }}>àº­àº¸àº›àº°àºàº­àº™à»ƒàºà»‰à»àº»àº”àºªàº²àº‡ ({lowStockItems.length} àº¥àº²àºàºàº²àº™)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lowStockItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(231,76,60,0.06)', borderRadius: '6px', padding: '8px 12px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>{item.name}</span>
                  <span style={{ marginLeft: '8px', color: '#e74c3c', fontSize: '0.8rem' }}>àºàº­àº”: {item.stock} / àº‚àº±à»‰àº™àº•à»ˆàº³: {item.minStock} {item.unit}</span>
                </div>
                <button type="button" className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: '#2ecc71', color: '#2ecc71', background: 'rgba(46,204,113,0.05)', whiteSpace: 'nowrap' }}
                  onClick={() => { setActiveItem(item); setShowRestockModal(true); }}>
                  ðŸ“¥ àº•àº·à»ˆàº¡àºªàº°àº•àº±àº­àº
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€â”€ SEARCH + SORT + FILTER TABS â”€â”€â”€ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.01)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ðŸ”</span>
            <input type="text" className="form-control" style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }} placeholder="àº„àº»à»‰àº™àº«àº²àº­àº¸àº›àº°àºàº­àº™..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>âœ•</button>
            )}
          </div>
          <select className="form-control" style={{ width: isMobile ? '100%' : '200px', height: '38px', fontSize: '0.85rem', background: '#1c1915' }}
            value={sortMode} onChange={e => setSortMode(e.target.value)}>
            <option value="none">ðŸ“‹ àº®àº½àº‡: àº„à»ˆàº²à»€àº¥àºµà»ˆàº¡àº•àº»à»‰àº™</option>
            <option value="name_az">ðŸ”¤ àºŠàº·à»ˆ àº-àºˆ (A-Z)</option>
            <option value="name_za">ðŸ”¤ àºŠàº·à»ˆ àºˆ-àº (Z-A)</option>
            <option value="cost_hl">ðŸ’° àº•àº»à»‰àº™àº—àº¶àº™ àºªàº¹àº‡â†’àº•à»ˆàº³</option>
            <option value="cost_lh">ðŸ’° àº•àº»à»‰àº™àº—àº¶àº™ àº•à»ˆàº³â†’àºªàº¹àº‡</option>
            <option value="stock_hl">ðŸ“¦ àºªàº²àº‡ àº«àº¼àº²àºâ†’à»œà»‰àº­àº</option>
            <option value="stock_lh">ðŸ“¦ àºªàº²àº‡ à»œà»‰àº­àºâ†’àº«àº¼àº²àº</option>
          </select>
        </div>

        <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[{ id: 'all', icon: 'ðŸ“‹', label: 'àº—àº±àº‡à»àº»àº”' }, { id: 'low', icon: 'âš ï¸', label: 'à»ƒàºà»‰à»àº»àº”' }, ...categories.map(c => ({ id: c.id, icon: c.icon, label: c.name }))].map(tab => {
            const count = tab.id === 'all' ? consumables.length
              : tab.id === 'low' ? consumables.filter(c => (c.stock || 0) <= (c.minStock || 0)).length
              : consumables.filter(c => c.category === tab.id).length;
            const isActive = activeFilter === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveFilter(tab.id)} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap',
                cursor: 'pointer', border: '1px solid', display: 'flex', alignItems: 'center', gap: '5px',
                borderColor: isActive ? 'var(--gold-primary)' : 'var(--border-color)',
                background: isActive ? 'var(--gold-primary)' : 'rgba(255,255,255,0.02)',
                color: isActive ? 'black' : 'var(--text-secondary)', transition: 'all 0.2s'
              }}>
                <span>{tab.icon}</span><span>{tab.label}</span>
                <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '10px', background: isActive ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)', color: isActive ? 'black' : 'var(--text-secondary)' }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* â”€â”€â”€ ITEMS TABLE (DESKTOP) + CARDS (MOBILE) â”€â”€â”€ */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
          <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>àº¥àº°àº«àº±àº” / àº­àº¸àº›àº°àºàº­àº™</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>à»àº§àº”à»àº¹à»ˆ</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>àº•àº»à»‰àº™àº—àº¶àº™/à»œà»ˆàº§àº</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>àºàº­àº”àº„àº»àº‡à»€àº«àº¼àº·àº­</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>àº‚àº±à»‰àº™àº•à»ˆàº³</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>àº¡àº¹àº™àº„à»ˆàº²àºªàº²àº‡</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>àº—àº¸àº¥àº°àºàº³</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>àºˆàº±àº”àºàº²àº™</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsumables.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>àºšà»à»ˆàº¡àºµàº¥àº²àºàºàº²àº™àº—àºµà»ˆàºàº»àº‡àºàº±àºšà»€àº‡àº·à»ˆàº­àº™à»„àº‚</td></tr>
              ) : filteredConsumables.map(item => {
                const totalVal = (item.stock || 0) * (item.costPerUnit || 0);
                const isLow = (item.stock || 0) <= (item.minStock || 0);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: isLow ? 'rgba(231,76,60,0.04)' : 'none' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.id}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginTop: '2px' }}>{item.name}</div>
                      {isLow && <span style={{ fontSize: '0.65rem', color: '#e74c3c', background: 'rgba(231,76,60,0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '3px', display: 'inline-block' }}>âš ï¸ à»ƒàºà»‰àºˆàº°à»àº»àº”</span>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {getCategoryInfo(item.category)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{(item.costPerUnit || 0).toLocaleString()} â‚­</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: isLow ? '#e74c3c' : 'white' }}>{(item.stock || 0).toLocaleString()} {item.unit || 'àº­àº±àº™'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{(item.minStock || 0).toLocaleString()} {item.unit || 'àº­àº±àº™'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{totalVal.toLocaleString()} â‚­</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '3px 7px', fontSize: '0.72rem', borderColor: '#2ecc71', color: '#2ecc71', background: 'rgba(46,204,113,0.05)' }} onClick={() => { setActiveItem(item); setShowRestockModal(true); }}>ðŸ“¥ àº®àº±àºš</button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '3px 7px', fontSize: '0.72rem', borderColor: '#e74c3c', color: '#e74c3c', background: 'rgba(231,76,60,0.05)' }} onClick={() => { setActiveItem(item); setShowDisburseModal(true); }}>ðŸ“¤ à»€àºšàºµàº</button>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-primary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={() => { setEditForm({ id: item.id, name: item.name, costPerUnit: item.costPerUnit || 0, minStock: item.minStock || 0, unit: item.unit || 'àº­àº±àº™', category: item.category || 'other' }); setShowEditModal(true); }}>ðŸ“</button>
                        <button type="button" className="btn" style={{ padding: '3px 8px', fontSize: '0.75rem', background: '#c0392b', color: 'white', border: 'none' }} onClick={() => handleDeleteConsumable(item)}>ðŸ—‘ï¸</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
          {filteredConsumables.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>àºšà»à»ˆàº¡àºµàº¥àº²àºàºàº²àº™àº—àºµà»ˆàºàº»àº‡àºàº±àºšà»€àº‡àº·à»ˆàº­àº™à»„àº‚</div>
          ) : filteredConsumables.map(item => {
            const totalVal = (item.stock || 0) * (item.costPerUnit || 0);
            const isLow = (item.stock || 0) <= (item.minStock || 0);
            return (
              <div key={item.id} className="glass-card animate-fade-in" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: `4px solid ${isLow ? '#e74c3c' : '#2ecc71'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.id} | {getCategoryInfo(item.category)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="button" className="btn btn-primary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      onClick={() => { setEditForm({ id: item.id, name: item.name, costPerUnit: item.costPerUnit || 0, minStock: item.minStock || 0, unit: item.unit || 'àº­àº±àº™', category: item.category || 'other' }); setShowEditModal(true); }}>ðŸ“</button>
                    <button type="button" className="btn" style={{ padding: '3px 8px', fontSize: '0.72rem', background: '#c0392b', color: 'white', border: 'none' }} onClick={() => handleDeleteConsumable(item)}>ðŸ—‘ï¸</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>àºàº­àº”:</span> <strong style={{ color: isLow ? '#e74c3c' : 'white' }}>{(item.stock || 0).toLocaleString()} {item.unit || 'àº­àº±àº™'}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>àº‚àº±à»‰àº™àº•à»ˆàº³:</span> <span>{(item.minStock || 0).toLocaleString()}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>àº•àº»à»‰àº™àº—àº¶àº™:</span> <span>{(item.costPerUnit || 0).toLocaleString()} â‚­</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>àº¡àº¹àº™àº„à»ˆàº²:</span> <strong style={{ color: 'var(--gold-primary)' }}>{totalVal.toLocaleString()} â‚­</strong></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderColor: '#2ecc71', color: '#2ecc71' }} onClick={() => { setActiveItem(item); setShowRestockModal(true); }}>ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderColor: '#e74c3c', color: '#e74c3c' }} onClick={() => { setActiveItem(item); setShowDisburseModal(true); }}>ðŸ“¤ à»€àºšàºµàºàº­àº­àº</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€â”€ MODAL: ADD CONSUMABLE â”€â”€â”€ */}
      {showAddModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>âž• à»€àºžàºµà»ˆàº¡àº¥àº²àºàºàº²àº™àº­àº¸àº›àº°àºàº­àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>âœ•</button>
              </div>
              <form onSubmit={handleAddConsumable} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">àºŠàº·à»ˆàº­àº¸àº›àº°àºàº­àº™ *</label>
                  <input type="text" className="form-control" placeholder="àº•àº»àº§àº¢à»ˆàº²àº‡: à»€àºˆà»‰àºàº«à»‰àº­àº‡àº™à»‰àº³, àºªàº°àºšàº¹..." value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">à»àº§àº”à»àº¹à»ˆ *</label>
                  <select className="form-control" value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™/à»œà»ˆàº§àº (LAK)</label>
                    <input type="number" className="form-control" placeholder="0" value={addForm.costPerUnit} onChange={(e) => setAddForm({ ...addForm, costPerUnit: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">àº«àº»àº§à»œà»ˆàº§àº</label>
                    <input type="text" className="form-control" placeholder="àº­àº±àº™, àº¡à»‰àº§àº™..." value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àºàº­àº”à»€àº¥àºµà»ˆàº¡àº•àº»à»‰àº™</label>
                    <input type="number" className="form-control" placeholder="0" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">àº¥àº°àº”àº±àºšàº‚àº±à»‰àº™àº•à»ˆàº³</label>
                    <input type="number" className="form-control" placeholder="5" value={addForm.minStock} onChange={(e) => setAddForm({ ...addForm, minStock: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }}>àºšàº±àº™àº—àº¶àº</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* â”€â”€â”€ MODAL: EDIT CONSUMABLE â”€â”€â”€ */}
      {showEditModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ“ à»àºà»‰à»„àº‚àº¥àº²àºàºàº²àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowEditModal(false)}>âœ•</button>
              </div>
              <form onSubmit={handleEditConsumable} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">àºŠàº·à»ˆàº­àº¸àº›àº°àºàº­àº™ *</label>
                  <input type="text" className="form-control" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">à»àº§àº”à»àº¹à»ˆ *</label>
                  <select className="form-control" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™/à»œà»ˆàº§àº (LAK)</label>
                    <input type="number" className="form-control" value={editForm.costPerUnit} onChange={(e) => setEditForm({ ...editForm, costPerUnit: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">àº«àº»àº§à»œà»ˆàº§àº</label>
                    <input type="text" className="form-control" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">àº¥àº°àº”àº±àºšàº‚àº±à»‰àº™àº•à»ˆàº³</label>
                  <input type="number" className="form-control" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })} />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }}>àºšàº±àº™àº—àº¶àºàºàº²àº™à»àºà»‰à»„àº‚</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* â”€â”€â”€ MODAL: RESTOCK â”€â”€â”€ */}
      {showRestockModal && activeItem && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#2ecc71', margin: 0 }}>ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²àº­àº¸àº›àº°àºàº­àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowRestockModal(false)}>âœ•</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <b>{activeItem.name}</b> | àºàº­àº”àº„àº»àº‡: {activeItem.stock} {activeItem.unit}
              </div>
              <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">àºˆàº³àº™àº§àº™àº®àº±àºšà»€àº‚àº»à»‰àº² *</label>
                    <input type="number" className="form-control" placeholder="10" value={restockForm.qty} onChange={(e) => setRestockForm({ ...restockForm, qty: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™/à»œà»ˆàº§àº (LAK)</label>
                    <input type="number" className="form-control" placeholder={activeItem.costPerUnit} value={restockForm.costPerUnit} onChange={(e) => setRestockForm({ ...restockForm, costPerUnit: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">àº§àº´àº—àºµàºŠàº³àº¥àº°</label>
                  <select className="form-control" value={restockForm.paymentMethod} onChange={(e) => setRestockForm({ ...restockForm, paymentMethod: e.target.value })}>
                    <option value="cash">ðŸ’µ à»€àº‡àº´àº™àºªàº»àº”</option>
                    <option value="transfer">ðŸ“± à»‚àº­àº™ BCEL One</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">à»àº²àºà»€àº«àº” / Supplier</label>
                  <input type="text" className="form-control" placeholder="àºŠàº·à»‰àº¢àº¹à»ˆàº®à»‰àº²àº™..." value={restockForm.notes} onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })} />
                </div>
                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--gold-primary)' }}>
                  âš ï¸ àºˆàº°àºšàº±àº™àº—àº¶àºàº¥àº²àºàºˆà»ˆàº²àº <b>{((parseFloat(restockForm.qty) || 0) * (parseFloat(restockForm.costPerUnit) || activeItem.costPerUnit || 0)).toLocaleString()} â‚­</b> àº­àº±àº”àº•àº°à»‚àº™àº¡àº±àº”
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRestockModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#2ecc71', color: 'black', borderColor: '#2ecc71', fontWeight: 'bold' }}>ðŸ“¥ àº¢àº·àº™àº¢àº±àº™àº®àº±àºšà»€àº‚àº»à»‰àº²</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* â”€â”€â”€ MODAL: DISBURSE â”€â”€â”€ */}
      {showDisburseModal && activeItem && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#e74c3c', margin: 0 }}>ðŸ“¤ à»€àºšàºµàºàº­àº­àºàº­àº¸àº›àº°àºàº­àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowDisburseModal(false)}>âœ•</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <b>{activeItem.name}</b> | àºàº­àº”àº„àº»àº‡: {activeItem.stock} {activeItem.unit}
              </div>
              <form onSubmit={handleDisburse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">àºˆàº³àº™àº§àº™à»€àºšàºµàºàº­àº­àº *</label>
                  <input type="number" className="form-control" placeholder="5" value={disburseForm.qty} onChange={(e) => setDisburseForm({ ...disburseForm, qty: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">àºˆàº¸àº”àº›àº°àºªàº»àº‡ / à»àº²àºà»€àº«àº”</label>
                  <input type="text" className="form-control" placeholder="à»€àºšàºµàºà»„àº›à»ƒàºŠà»‰..." value={disburseForm.notes} onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })} />
                </div>
                <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#FAB1A0' }}>
                  â„¹ï¸ àºàº²àº™à»€àºšàºµàºàº­àº­àºàºˆàº°àºšà»à»ˆàºªà»‰àº²àº‡àº¥àº²àºàºˆà»ˆàº²àºà»ƒà»à»ˆ (àº¥àº²àºàºˆà»ˆàº²àºàº–àº·àºàºšàº±àº™àº—àº¶àºàº•àº­àº™àº®àº±àºšà»€àº‚àº»à»‰àº²à»àº¥à»‰àº§)
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDisburseModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#e74c3c', color: 'white', borderColor: '#e74c3c', fontWeight: 'bold' }}>ðŸ“¤ àº¢àº·àº™àº¢àº±àº™à»€àºšàºµàºàº­àº­àº</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* â”€â”€â”€ MODAL: CATEGORY MANAGER â”€â”€â”€ */}
      {showCategoryModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm glass-card" style={{ padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ—‚ï¸ àºˆàº±àº”àºàº²àº™à»àº§àº”à»àº¹à»ˆàº­àº¸àº›àº°àºàº­àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryError(''); }}>âœ•</button>
              </div>

              {/* Add new category */}
              <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginBottom: '10px' }}>âž• à»€àºžàºµà»ˆàº¡à»àº§àº”à»àº¹à»ˆà»ƒà»à»ˆ</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input type="text" className="form-control" style={{ width: '60px', textAlign: 'center', fontSize: '1.2rem' }}
                    placeholder="ðŸ”§" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} />
                  <input type="text" className="form-control" style={{ flex: 1 }} placeholder="àºŠàº·à»ˆà»àº§àº”à»àº¹à»ˆ..."
                    value={newCatName} onChange={e => { setNewCatName(e.target.value); setCategoryError(''); }} />
                  <button type="button" className="btn btn-primary" style={{ background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)', whiteSpace: 'nowrap', fontWeight: 'bold' }} onClick={handleAddCategory}>à»€àºžàºµà»ˆàº¡</button>
                </div>
                {categoryError && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: '6px' }}>{categoryError}</div>}
              </div>

              {/* List existing categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map(cat => {
                  const usageCount = consumables.filter(c => c.category === cat.id).length;
                  const isEditing = editingCategory && editingCategory.id === cat.id;
                  return (
                    <div key={cat.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input type="text" className="form-control" style={{ width: '60px', textAlign: 'center', fontSize: '1.1rem' }}
                            value={editingCategory.icon} onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })} />
                          <input type="text" className="form-control" style={{ flex: 1 }}
                            value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                          <button type="button" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)' }} onClick={handleUpdateCategory}>àºšàº±àº™àº—àº¶àº</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setEditingCategory(null)}>àºàº»àºà»€àº¥àºµàº</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                            <div>
                              <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{cat.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{usageCount} àº¥àº²àºàºàº²àº™ â€¢ ID: {cat.id}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => { setEditingCategory({ ...cat }); setCategoryError(''); }}>ðŸ“</button>
                            <button type="button" className="btn" style={{ padding: '3px 8px', fontSize: '0.75rem', background: '#c0392b', color: 'white', border: 'none' }} onClick={() => handleDeleteCategory(cat)}>ðŸ—‘ï¸</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* â”€â”€â”€ MODAL: HISTORY â”€â”€â”€ */}
      {showHistoryModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-md glass-card" style={{ padding: '24px', maxHeight: '80%', overflowY: 'auto' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ“‹ àº›àº°àº«àº§àº±àº”àº®àº±àºš-à»€àºšàºµàº</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowHistoryModal(false)}>âœ•</button>
              </div>
              <div className="desktop-table-view">
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>àº§àº±àº™àº—àºµ</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>àº¥àº²àºàºàº²àº™</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>àº›àº°à»€àºžàº”</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>àºˆàº³àº™àº§àº™</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>àº¡àº¹àº™àº„à»ˆàº²</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>à»àº²àºà»€àº«àº”</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHistory.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>àºšà»à»ˆàº¡àºµàº›àº°àº«àº§àº±àº”</td></tr>
                    ) : allHistory.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <td style={{ padding: '10px' }}>{new Date(tx.date).toLocaleString('lo-LA')}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{tx.itemName}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', background: tx.type === 'restock' ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)', color: tx.type === 'restock' ? '#2ecc71' : '#e74c3c', border: `1px solid ${tx.type === 'restock' ? '#2ecc71' : '#e74c3c'}` }}>
                            {tx.type === 'restock' ? 'àº®àº±àºšà»€àº‚àº»à»‰àº²' : 'à»€àºšàºµàºàº­àº­àº'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{tx.qty} {tx.unit}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'var(--gold-primary)' }}>{tx.type === 'restock' ? `${(tx.totalCost || 0).toLocaleString()} â‚­` : '-'}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ color: 'white' }}>{tx.notes || '-'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>à»‚àº”àº: {tx.createdByName}</div>
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

      {/* â”€â”€â”€ MODAL: MONTHLY EXPENSE REPORT â”€â”€â”€ */}
      {showReportModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-md glass-card" style={{ padding: '24px', maxHeight: '80%', overflowY: 'auto' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ“Š àº¥àº²àºàº‡àº²àº™àºªàº°àº«àº¼àº¸àºšàº¥àº²àºàºˆà»ˆàº²àºàº®à»‰àº²àº™</h3>
                <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowReportModal(false)}>âœ•</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>à»€àº¥àº·àº­àºà»€àº”àº·àº­àº™:</label>
                <input type="month" className="form-control" style={{ width: '160px', background: '#1c1915' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.22)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ðŸ’µ àº¥àº§àº¡àº¥àº²àºàºˆà»ˆàº²àºàº—àº±àº‡à»àº»àº”:</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#FAB1A0', marginTop: '4px' }}>{totalMonthExpenseVal.toLocaleString()} â‚­</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>àºˆàº³àº™àº§àº™: <b>{monthExpenses.length} àº¥àº²àºàºàº²àº™</b></div>
              </div>
              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>ðŸ“ à»àºàºàº•àº²àº¡à»àº§àº”à»àº¹à»ˆ (Category Summary):</h4>
              <div className="desktop-table-view" style={{ marginBottom: '20px' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>à»àº§àº”à»àº¹à»ˆ</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>àºˆàº³àº™àº§àº™</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>àºàº­àº”àº¥àº§àº¡</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGroupedExpenses.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>àºšà»à»ˆàº¡àºµàº¥àº²àºàºˆà»ˆàº²àº</td></tr>
                    ) : sortedGroupedExpenses.map(row => {
                      const pct = totalMonthExpenseVal > 0 ? Math.round((row.total / totalMonthExpenseVal) * 100) : 0;
                      return (
                        <tr key={row.name} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: 'white' }}>{row.name}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{row.count}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#FAB1A0' }}>{row.total.toLocaleString()} â‚­</td>
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
              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>ðŸ“‹ àº¥àº²àºàºàº²àº™àº¥àº²àºàºˆà»ˆàº²àº:</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {monthExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>àºšà»à»ˆàº¡àºµàº¥àº²àºàºàº²àº™</div>
                ) : monthExpenses.map(ex => (
                  <div key={ex.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{ex.categoryName || ex.category}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(ex.date).toLocaleDateString('lo-LA')}{ex.notes ? ` â€¢ ${ex.notes}` : ''}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#FAB1A0' }}>{(ex.convertedAmount || ex.amount).toLocaleString()} â‚­</div>
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
// ðŸ’Ž RAW MATERIALS SUB-VIEW
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
    category: 'àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)',
    unit: 'à»àºœà»ˆàº™',
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
      category: 'àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)',
      unit: 'à»àºœà»ˆàº™',
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
      category: m.category || 'àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)',
      unit: m.unit || 'à»àºœà»ˆàº™',
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
    if (window.confirm('àº•à»‰àº­àº‡àºàº²àº™àº¥àº¶àºšàº§àº±àº”àº–àº¸àº”àº´àºšàº™àºµà»‰à»àº¡à»ˆàº™àºšà»à»ˆ?')) {
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
            unit: cols[3] || 'àº­àº±àº™',
            stock_qty: Number(cols[4] || 0),
            min_stock: Number(cols[5] || 0),
            cost_price: Number(cols[6] || 0),
            supplier: cols[7] || ''
          });
          importedCount++;
        }
      }
      alert('âœ“ àº™àº³à»€àº‚àº»à»‰àº²àº§àº±àº”àº–àº¸àº”àº´àºšàºªàº³à»€àº¥àº±àº” ' + importedCount + ' àº¥àº²àºàºàº²àº™!');
      setShowCsvModal(false);
      setCsvText('');
      loadMaterials();
    } catch (err) {
      alert('âš  àº‚à»à»‰àºœàº´àº”àºžàº²àº”à»ƒàº™àºàº²àº™àº™àº³à»€àº‚àº»à»‰àº² CSV: ' + err.message);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const existingRawCategories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));
  const defaultRawCategories = ['àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)', 'à»„àº¡à»‰/àº‚àº­àºšà»„àº¡à»‰ (Wood)', 'à»àºà»‰àº§/à»€àº¥àº™ (Glass)', 'àºàº²àº§/àº­àº¸àº›àº°àºàº­àº™ (Glue/Chemicals)', 'àº­àº·à»ˆàº™à»† (Other)'];
  const rawCategoriesToSuggest = Array.from(new Set([...defaultRawCategories, ...existingRawCategories]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: isMobile ? '100%' : '400px', width: '100%' }}>
          <input
            type="text"
            className="form-control"
            placeholder="ðŸ” àº„àº»à»‰àº™àº«àº²àº§àº±àº”àº–àº¸àº”àº´àºš..."
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
            ðŸ“¤ àºªàº»à»ˆàº‡àº­àº­àº CSV
          </button>
)}
{hasInventoryPermission('inventoryAddProduct') && (
          <button 
            className="btn btn-secondary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={() => setShowCsvModal(true)}
          >
            ðŸ“¥ àº™àº³à»€àº‚àº»à»‰àº² CSV
          </button>
)}
{hasInventoryPermission('inventoryAddProduct') && (
          <button 
            className="btn btn-primary" 
            style={isMobile ? { flex: '1 1 100%', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={handleOpenAdd}
          >
            âž• à»€àºžàºµà»ˆàº¡àº§àº±àº”àº–àº¸àº”àº´àºšà»ƒà»à»ˆ
          </button>
)}
        </div>
      </div>

      <div className="desktop-table-view">
        <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>àºŠàº·à»ˆàº§àº±àº”àº–àº¸àº”àº´àºš</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>à»àº§àº”à»àº¹à»ˆ</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>àº«àº»àº§à»œà»ˆàº§àº</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>àºˆàº³àº™àº§àº™àºªàº°àº•àº±àº­àº</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>àºˆàº³àº™àº§àº™àº•à»à»ˆàº²àºªàº¸àº”</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>àº•àº»à»‰àº™àº—àº¶àº™ (LAK)</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>àºœàº¹à»‰àºªàº°à»œàº­àº‡</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>àºˆàº±àº”àºàº²àº™</th>
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
                <td style={{ padding: '12px', textAlign: 'right' }}>{hasInventoryPermission('inventoryViewCost') ? `${m.cost_price.toLocaleString()} â‚­` : '*** â‚­'}</td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{m.supplier || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
{hasInventoryPermission('inventoryEditProduct') && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }} onClick={() => handleOpenEdit(m)}>âœï¸ à»àºà»‰à»„àº‚</button>
)}
{hasInventoryPermission('inventoryDeleteProduct') && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.1)' }} onClick={() => handleDelete(m.id)}>ðŸ—‘ï¸ àº¥àº¶àºš</button>
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
                <span style={{ color: 'var(--text-secondary)' }}>àºˆàº³àº™àº§àº™: </span>
                <span style={{ fontWeight: 'bold', color: m.stock_qty <= m.min_stock ? 'var(--alert-red)' : 'white' }}>{m.stock_qty.toLocaleString()} {m.unit}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>àº‚àº±à»‰àº™àº•à»ˆàº³: </span>
                <span>{m.min_stock} {m.unit}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>àº•àº»à»‰àº™àº—àº¶àº™: </span>
                <span>{hasInventoryPermission('inventoryViewCost') ? `${m.cost_price.toLocaleString()} â‚­` : '*** â‚­'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>àºœàº¹à»‰àºªàº°à»œàº­àº‡: </span>
                <span>{m.supplier || '-'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
{hasInventoryPermission('inventoryEditProduct') && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(m)}>âœï¸ à»àºà»‰à»„àº‚</button>
)}
{hasInventoryPermission('inventoryDeleteProduct') && (
              <button className="btn btn-secondary btn-sm" style={{ color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.1)' }} onClick={() => handleDelete(m.id)}>ðŸ—‘ï¸ àº¥àº¶àºš</button>
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
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{editMaterial ? 'âœï¸ à»àºà»‰à»„àº‚àº‚à»à»‰àº¡àº¹àº™àº§àº±àº”àº–àº¸àº”àº´àºš' : 'âž• à»€àºžàºµà»ˆàº¡àº§àº±àº”àº–àº¸àº”àº´àºšà»ƒà»à»ˆ'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>âœ•</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '10px 0' }}>
                <div className="grid-2col">
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">àºŠàº·à»ˆàº§àº±àº”àº–àº¸àº”àº´àºš (Ingredient Name) *</label>
                      <input type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">à»àº§àº”à»àº¹à»ˆ (Category) *</label>
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
                        <label className="form-label">àº«àº»àº§à»œà»ˆàº§àº (Unit) *</label>
                        <input type="text" className="form-control" placeholder="à»àºœà»ˆàº™, àº­àº±àº™,..." required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">àºšàº²à»‚àº„à»‰àº” (Barcode)</label>
                        <input type="text" className="form-control" placeholder="Barcode..." value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">àºœàº¹à»‰àºªàº°à»œàº­àº‡ (Supplier)</label>
                      <input type="text" className="form-control" placeholder="Supplier name..." value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">àº„àº³àº­àº°àº—àº´àºšàº²àº (Description)</label>
                      <input type="text" className="form-control" placeholder="Description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">àºªàº°àº•àº±àº­àºàº›àº±àº”àºˆàº¸àºšàº±àº™ *</label>
                        <input type="number" className="form-control" required value={formData.stock_qty} onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">à»àºˆà»‰àº‡à»€àº•àº·àº­àº™àº•à»à»ˆàº²àºªàº¸àº” *</label>
                        <input type="number" className="form-control" required value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
                      </div>
                    </div>

{hasInventoryPermission('inventoryViewCost') && (
                    <div className="form-group">
                      <label className="form-label">àº¥àº²àº„àº²àºŠàº·à»‰ / àº•àº»à»‰àº™àº—àº¶àº™ (LAK) *</label>
                      <input type="number" className="form-control" required value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} />
                    </div>
)}

                    <div className="form-group">
                      <label className="form-label">àº®àº¹àºšàºžàº²àºšàº§àº±àº”àº–àº¸àº”àº´àºš (Ingredient Photo)</label>
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
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px', height: '30px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }} onClick={() => setFormData(prev => ({ ...prev, image: '' }))}>àº¥àº¶àºšàº®àº¹àºš</button>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">à»àº²àºà»€àº«àº” (Notes)</label>
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
                    category: 'àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)',
                    unit: 'à»àºœà»ˆàº™',
                    stock_qty: '',
                    min_stock: '',
                    cost_price: '',
                    supplier: '',
                    barcode: '',
                    image: '',
                    description: '',
                    notes: ''
                  });
                }}>àºàº»àºà»€àº¥àºµàº</button>
                <button type="submit" className="btn btn-primary">ðŸ’¾ àº¢àº·àº™àº¢àº±àº™</button>
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
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>ðŸ“¥ àº™àº³à»€àº‚àº»à»‰àº²àº§àº±àº”àº–àº¸àº”àº´àºšàºœà»ˆàº²àº™ CSV</h3>
              <button className="close-btn" onClick={() => setShowCsvModal(false)}>âœ•</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                àº§àº²àº‡à»€àº™àº·à»‰àº­àº«àº²à»„àºŸàº¥à»Œ CSV àº‚àº­àº‡àº§àº±àº”àº–àº¸àº”àº´àºšàº•àº²àº¡àº®àº¹àºšà»àºšàºšàº”à»‰àº²àº™àº¥àº¸à»ˆàº¡àº™àºµà»‰ (àº«à»‰àº²àº¡àº¥àº»àºšà»àº–àº§àº«àº»àº§àº‚à»à»‰àº—àº³àº­àº´àº”):
              </p>
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.75rem', background: '#1c1915' }}
                placeholder="ID,Name,Category,Unit,Stock Qty,Min Stock,Cost Price,Supplier&#10;,Acrylic sheet 2mm,acrylic,sheet,50,5,45000,PT Supplier"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <div className="modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCsvModal(false);
                  setCsvText('');
                }}>àºàº»àºà»€àº¥àºµàº</button>
                <button type="button" className="btn btn-primary" onClick={handleImportCsv} disabled={!csvText.trim()}>ðŸ’¾ àº¢àº·àº™àº¢àº±àº™àºàº²àº™àº™àº³à»€àº‚àº»à»‰àº²</button>
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
        title="à»€àºžàºµà»ˆàº¡àº§àº±àº”àº–àº¸àº”àº´àºšà»ƒà»à»ˆ (Add Raw Material)"
      >
        âž•
      </button>

    </div>
  );
}

// ==========================================
// ðŸ­ BOM FORMULA & MANUFACTURING SUB-VIEW
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
  const [prodUnit, setProdUnit] = useState('àº­àº±àº™');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodImage, setProdImage] = useState('');

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)');
  const [matUnit, setMatUnit] = useState('à»àºœà»ˆàº™');
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
    setProdUnit('àº­àº±àº™');
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
      const newCat = db.addCategory({ name: prodCategory.trim(), icon: 'ðŸ“¦', type: 'physical' });
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
      unit: prodUnit || (isService ? 'àº„àº±à»‰àº‡' : 'àº­àº±àº™'),
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
    setProdUnit('àº­àº±àº™');
    setProdBarcode('');
    setProdImage('');
    loadData();
    handleSelectProduct(newProd);
  };

  const handleOpenAddMaterial = () => {
    setMatName('');
    setMatCategory('àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)');
    setMatUnit('à»àºœà»ˆàº™');
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
    setMatCategory('àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)');
    setMatUnit('à»àºœà»ˆàº™');
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
      alert('àºàº°àº¥àº¸àº™àº²à»€àº¥àº·àº­àºàº§àº±àº”àº–àº¸àº”àº´àºš à»àº¥àº° àº›à»‰àº­àº™àºˆàº³àº™àº§àº™àº—àºµà»ˆàº–àº·àºàº•à»‰àº­àº‡');
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
    alert('âœ“ àºšàº±àº™àº—àº¶àºàºªàº¹àº”àºàº²àº™àºœàº°àº¥àº´àº”àºªàº³à»€àº¥àº±àº”!');
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
      alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºˆàº³àº™àº§àº™àº—àºµà»ˆàº•à»‰àº­àº‡àºàº²àº™àºœàº°àº¥àº´àº”');
      return;
    }

    try {
      db.addProductionJob(selectedProduct.id, qty);
      alert('âœ“ àºœàº°àº¥àº´àº”àºªàº´àº™àº„à»‰àº² ' + selectedProduct.name + ' àºˆàº³àº™àº§àº™ ' + qty + ' àº­àº±àº™ àºªàº³à»€àº¥àº±àº”!');
      loadData();
      const updatedProd = db.getProducts().find(p => p.id === selectedProduct.id);
      setSelectedProduct(updatedProd);
    } catch (err) {
      alert('âš  àº‚à»à»‰àºœàº´àº”àºžàº²àº”à»ƒàº™àºàº²àº™àºœàº°àº¥àº´àº”: ' + err.message);
    }
  };

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
      
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: 0 }}>ðŸ“¦ à»€àº¥àº·àº­àºàºªàº´àº™àº„à»‰àº²à»€àºžàº·à»ˆàº­àºˆàº±àº”àºàº²àº™</h3>
{hasInventoryPermission('inventoryAddProduct') && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}
            onClick={handleOpenAddProduct}
          >
            âž• à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ
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
                  background: selectedProduct?.id === p.id ? 'rgba(212,175,55,0.06)' : '#1c1915',
                  color: selectedProduct?.id === p.id ? 'var(--gold-primary)' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handleSelectProduct(p)}
              >
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                <span style={{ fontSize: '0.7rem', color: hasBOM ? 'var(--success-green)' : 'var(--text-secondary)' }}>
                  {hasBOM ? 'âœ“ àº¡àºµàºªàº¹àº”' : 'âš  àºšà»à»ˆàº¡àºµàºªàº¹àº”'}
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
                  ðŸ§ª àºªàº¹àº”àºàº²àº™àºœàº°àº¥àº´àº” (BOM Formula Recipe) - {selectedProduct.name}
                </h3>
                <form onSubmit={handleAddRecipeMaterial} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <select
                    className="form-control"
                    required
                    style={{ flexGrow: 1 }}
                    value={selectedMatId}
                    onChange={(e) => setSelectedMatId(e.target.value)}
                  >
                    <option value="">-- à»€àº¥àº·àº­àºàº§àº±àº”àº–àº¸àº”àº´àºš --</option>
                    {rawMaterials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.stock_qty} {m.unit})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 10px', fontSize: '0.85rem' }}
                    onClick={handleOpenAddMaterial}
                    title="à»€àºžàºµà»ˆàº¡àº§àº±àº”àº–àº¸àº”àº´àºšà»ƒà»à»ˆ"
                  >
                    âž•
                  </button>
                  <input
                    type="number"
                    step="0.001"
                    required
                    className="form-control"
                    style={{ width: '90px' }}
                    placeholder="àºˆàº³àº™àº§àº™"
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>à»€àºžàºµà»ˆàº¡</button>
                </form>

                <div style={{ minHeight: '120px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', background: 'rgba(0,0,0,0.1)' }}>
                  {bomList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      àºàº±àº‡àºšà»à»ˆàº—àº±àº™àº¡àºµàº§àº±àº”àº–àº¸àº”àº´àºšà»ƒàº™àºªàº¹àº”àºàº²àº™àºœàº°àº¥àº´àº”.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {bomList.map(item => (
                        <div key={item.materialId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1915', padding: '6px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.materialName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>{item.qty}</span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '1rem' }}
                              onClick={() => handleRemoveRecipeMaterial(item.materialId)}
                            >
                              âœ•
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '14px' }} onClick={handleSaveRecipe}>
                  ðŸ’¾ àºšàº±àº™àº—àº¶àºàºªàº¹àº”àºàº²àº™àºœàº°àº¥àº´àº” (Save BOM)
                </button>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                    ðŸ­ àºœàº°àº¥àº´àº”àºªàº´àº™àº„à»‰àº² (Execute Manufacturing)
                  </h3>
                  
                  <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed var(--gold-primary)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>àºàº³àº¥àº±àº‡àºàº²àº™àºœàº°àº¥àº´àº”àºªàº¹àº‡àºªàº¸àº” (Max Yield Capacity):</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>
                      {calculateCapacity(selectedProduct)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>àº­àº±àº™</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      * àº„àº³àº™àº§àº™àºˆàº²àºàº§àº±àº”àº–àº¸àº”àº´àºšàº„àº»àº‡à»€àº«àº¼àº·àº­à»ƒàº™àºªàº°àº•àº±àº­àº
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">àºˆàº³àº™àº§àº™àº—àºµà»ˆàº•à»‰àº­àº‡àºàº²àº™àºœàº°àº¥àº´àº”</label>
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
                  ðŸš€ àºªàº±à»ˆàº‡àºœàº°àº¥àº´àº”àºªàº´àº™àº„à»‰àº² (Manufacture)
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 14px' }}>
                ðŸ“ à»€àº„àº·à»ˆàº­àº‡àº„àº´àº”à»„àº¥à»ˆà»àºœà»ˆàº™àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic Sheet Cutting Solver)
              </h3>
              
              <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>àºàº§à»‰àº²àº‡à»àºœà»ˆàº™ (Sheet W - cm)</label>
                      <input type="number" className="form-control" value={sheetW} onChange={(e) => setSheetW(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>àºªàº¹àº‡à»àºœà»ˆàº™ (Sheet H - cm)</label>
                      <input type="number" className="form-control" value={sheetH} onChange={(e) => setSheetH(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>àºàº§à»‰àº²àº‡àºŠàº´à»‰àº™àº‡àº²àº™ (Piece W - cm)</label>
                      <input type="number" className="form-control" value={pieceW} onChange={(e) => setPieceW(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>àºªàº¹àº‡àºŠàº´à»‰àº™àº‡àº²àº™ (Piece H - cm)</label>
                      <input type="number" className="form-control" value={pieceH} onChange={(e) => setPieceH(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>à»„àº¥àºàº°àº«à»ˆàº²àº‡/àº„àº§àº²àº¡à»œàº²à»ƒà¸šàº•àº±àº” (Waste margin - cm)</label>
                    <input type="number" step="0.1" className="form-control" value={margin} onChange={(e) => setMargin(e.target.value)} />
                  </div>

{hasInventoryPermission('inventoryViewCost') && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>àº•àº»à»‰àº™àº—àº¶àº™à»àºœà»ˆàº™àº­àº²àº„àº£àºµàº¥àº´àº (Sheet Cost - LAK)</label>
                    <input type="number" className="form-control" value={sheetCost} onChange={(e) => setSheetCost(e.target.value)} />
                  </div>
)}

                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '12px', marginTop: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>àºˆàº³àº™àº§àº™àºŠàº´à»‰àº™àº‡àº²àº™àº—àºµà»ˆà»„àº”à»‰:</span>
                      <b style={{ color: 'var(--gold-primary)' }}>{solverResult.yieldCount} àºŠàº´à»‰àº™</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>àº­àº±àº”àº•àº²à»ƒàºŠà»‰àº‡àº²àº™ (Yield):</span>
                      <b style={{ color: 'var(--success-green)' }}>{solverResult.efficiency}%</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>àº­àº±àº”àº•àº²à»€àºªàºà»€àºªàº” (Waste):</span>
                      <b style={{ color: 'var(--alert-red)' }}>{solverResult.waste}%</b>
                    </div>
{hasInventoryPermission('inventoryViewCost') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                      <span>àº•àº»à»‰àº™àº—àº¶àº™àºªàº°à»€àº¥à»ˆàº:</span>
                      <b style={{ color: 'white' }}>{solverResult.costPerUnit.toLocaleString()} â‚­ / àºŠàº´à»‰àº™</b>
                    </div>
)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ðŸ“º àº•àº»àº§àº¢à»ˆàº²àº‡àºàº²àº™àºˆàº±àº”àº§àº²àº‡à»àºœà»ˆàº™àº•àº±àº” (Simulated Cutting Layout Grid):</span>
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
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>àº‚àº°à»œàº²àº”àºŠàº´à»‰àº™àº‡àº²àº™à»ƒàº«àºà»ˆà»€àºàºµàº™à»àºœà»ˆàº™àº­àº²àº„àº£àºµàº¥àº´àº!</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 12px' }}>
                ðŸ“œ àº›àº°àº«àº§àº±àº”àºàº²àº™àºœàº°àº¥àº´àº”àºªàº´àº™àº„à»‰àº² (Production History)
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>àº§àº±àº™àº—àºµ</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>àºŠàº·à»ˆàºªàº´àº™àº„à»‰àº²</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>àºˆàº³àº™àº§àº™</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>àº•àº»à»‰àº™àº—àº¶àº™àºªàº°à»€àº¥à»ˆàº</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>àº•àº»à»‰àº™àº—àº¶àº™àº¥àº§àº¡</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>àºœàº¹à»‰àºªàº±à»ˆàº‡àºœàº°àº¥àº´àº”</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionHistory.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <td style={{ padding: '8px' }}>{new Date(h.createdAt).toLocaleDateString('lo-LA')}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{h.productName}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--success-green)', fontWeight: 'bold' }}>+{h.qty}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{hasInventoryPermission('inventoryViewCost') ? `${h.costPerUnit.toLocaleString()} â‚­` : '*** â‚­'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{hasInventoryPermission('inventoryViewCost') ? `${h.totalCost.toLocaleString()} â‚­` : '*** â‚­'}</td>
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
            ðŸ‘ˆ àºàº°àº¥àº¸àº™àº²à»€àº¥àº·àº­àºàºªàº´àº™àº„à»‰àº²àºˆàº²àºàº¥àº²àºàºàº²àº™àº”à»‰àº²àº™àºŠà»‰àº²àºàº¡àº·à»€àºžàº·à»ˆàº­àºˆàº±àº”àºàº²àº™àºªàº¹àº”àºàº²àº™àºœàº°àº¥àº´àº” àº«àº¼àº· àºªàº±à»ˆàº‡àºœàº°àº¥àº´àº”.
          </div>
        )}
      </div>

      {/* Modal overlays for Product & Raw Material creation inside BOM */}
      {showAddProductModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>âž• à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ (Add Product)</h3>
              <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAddProductModal(false)}>âœ•</button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">àºŠàº·à»ˆàºªàº´àº™àº„à»‰àº² (Product Name)</label>
                <input type="text" className="form-control" required value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">à»àº§àº”à»àº¹à»ˆ (Category)</label>
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
                  <label className="form-label">àº«àº»àº§à»œà»ˆàº§àº (Unit)</label>
                  <input type="text" className="form-control" required value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">àº¥àº²àº„àº²àº‚àº²àº (Price LAK)</label>
                  <input type="number" className="form-control" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™ (Cost LAK)</label>
                  <input type="number" className="form-control" required value={prodCost} onChange={(e) => setProdCost(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">àºˆàº³àº™àº§àº™àºªàº°àº•àº±àº­àº</label>
                  <input type="number" className="form-control" required value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">à»€àº•àº·àº­àº™àº•à»à»ˆàº²àºªàº¸àº”</label>
                  <input type="number" className="form-control" required value={prodMinStock} onChange={(e) => setProdMinStock(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">àº¥àº°àº«àº±àº”àºšàº²à»‚àº„à»‰àº” (Barcode)</label>
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
                  setProdUnit('àº­àº±àº™');
                  setProdBarcode('');
                  setProdImage('');
                }}>àºàº»àºà»€àº¥àºµàº</button>
                <button type="submit" className="btn btn-primary">ðŸ’¾ àº¢àº·àº™àº¢àº±àº™</button>
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
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>âž• à»€àºžàºµà»ˆàº¡àº§àº±àº”àº–àº¸àº”àº´àºšà»ƒà»à»ˆ (Add Raw Material)</h3>
              <button type="button" className="close-btn" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAddMaterialModal(false)}>âœ•</button>
            </div>
            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">àºŠàº·à»ˆàº§àº±àº”àº–àº¸àº”àº´àºš (Material Name)</label>
                <input type="text" className="form-control" required value={matName} onChange={(e) => setMatName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">à»àº§àº”à»àº¹à»ˆ (Category)</label>
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
                      'àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)', 'à»„àº¡à»‰/àº‚àº­àºšà»„àº¡à»‰ (Wood)', 'à»àºà»‰àº§/à»€àº¥àº™ (Glass)', 'àºàº²àº§/àº­àº¸àº›àº°àºàº­àº™ (Glue/Chemicals)', 'àº­àº·à»ˆàº™à»† (Other)',
                      ...rawMaterials.map(m => m.category).filter(Boolean)
                    ])).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">àº«àº»àº§à»œà»ˆàº§àº (Unit)</label>
                  <input type="text" className="form-control" placeholder="à»àºœà»ˆàº™, àº­àº±àº™, àºà»ˆàº­àº‡,..." required value={matUnit} onChange={(e) => setMatUnit(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">àºˆàº³àº™àº§àº™àºªàº°àº•àº±àº­àº</label>
                  <input type="number" className="form-control" required value={matStockQty} onChange={(e) => setMatStockQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">àºˆàº³àº™àº§àº™à»€àº•àº·àº­àº™àº•à»à»ˆàº²àºªàº¸àº”</label>
                  <input type="number" className="form-control" required value={matMinStock} onChange={(e) => setMatMinStock(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">àº•àº»à»‰àº™àº—àº¶àº™àº•à»à»ˆà»œà»ˆàº§àº (Cost LAK)</label>
                <input type="number" className="form-control" required value={matCostPrice} onChange={(e) => setMatCostPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">àºœàº¹à»‰àºªàº°à»œàº­àº‡ (Supplier)</label>
                <input type="text" className="form-control" value={matSupplier} onChange={(e) => setMatSupplier(e.target.value)} />
              </div>
              <div className="modal-footer" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddMaterialModal(false);
                  setMatName('');
                  setMatCategory('àº­àº²àº„àº£àºµàº¥àº´àº (Acrylic)');
                  setMatUnit('à»àºœà»ˆàº™');
                  setMatStockQty('0');
                  setMatMinStock('0');
                  setMatCostPrice('0');
                  setMatSupplier('');
                }}>àºàº»àºà»€àº¥àºµàº</button>
                <button type="submit" className="btn btn-primary">ðŸ’¾ àº¢àº·àº™àº¢àº±àº™</button>
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

  // â”€â”€ Suppliers â”€â”€
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
    if (window.confirm(`àº¥àº¶àºšàºœàº¹à»‰àºªàº°à»œàº­àº‡ "${s.name}"?`)) {
      db.deleteSupplier(s.id);
      refresh();
    }
  };

  // â”€â”€ Purchase Orders â”€â”€
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
      setPoError('àºàº°àº¥àº¸àº™àº²à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº² à»àº¥àº° à»ƒàºªà»ˆàºˆàº³àº™àº§àº™');
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
    if (window.confirm(`àº®àº±àºšàºªàº´àº™àº„à»‰àº²àº‚àº­àº‡à»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ ${po.id} à»€àº‚àº»à»‰àº²àºªàº°àº•àº±àº­àº? àºˆàº³àº™àº§àº™àºªàº°àº•àº±àº­àºàºˆàº°àº–àº·àºà»€àºžàºµà»ˆàº¡àº­àº±àº”àº•àº°à»‚àº™àº¡àº±àº”.`)) {
      db.receivePurchaseOrder(po.id);
      refresh();
    }
  };
  const handleDeletePo = (po) => {
    if (window.confirm(`àº¥àº¶àºšà»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ ${po.id}?`)) {
      db.deletePurchaseOrder(po.id);
      refresh();
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { label: 'â³ àº¥à»àº–à»‰àº²àº®àº±àºš', color: '#f39c12', bg: 'rgba(243,156,18,0.12)' },
      received: { label: 'âœ… àº®àº±àºšà»àº¥à»‰àº§', color: '#2ecc71', bg: 'rgba(46,204,113,0.12)' },
      cancelled: { label: 'âŒ àºàº»àºà»€àº¥àºµàº', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' }
    };
    const s = map[status] || map.pending;
    return <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold', color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>{s.label}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" className={`nav-tab ${section === 'orders' ? 'active' : ''}`} onClick={() => setSection('orders')}>ðŸ§¾ à»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ (Purchase Orders)</button>
        <button type="button" className={`nav-tab ${section === 'suppliers' ? 'active' : ''}`} onClick={() => setSection('suppliers')}>ðŸ¢ àºœàº¹à»‰àºªàº°à»œàº­àº‡ (Suppliers)</button>
      </div>

      {section === 'suppliers' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.4rem', margin: 0 }}>ðŸ¢ àºœàº¹à»‰àºªàº°à»œàº­àº‡ (Suppliers)</h2>
            <button type="button" className="btn btn-primary" onClick={openAddSupplier}>âž• à»€àºžàºµà»ˆàº¡àºœàº¹à»‰àºªàº°à»œàº­àº‡</button>
          </div>
          {suppliers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>àºàº±àº‡àºšà»à»ˆàº¡àºµàºœàº¹à»‰àºªàº°à»œàº­àº‡ â€” àºàº»àº” "à»€àºžàºµà»ˆàº¡àºœàº¹à»‰àºªàº°à»œàº­àº‡" à»€àºžàº·à»ˆàº­à»€àº¥àºµà»ˆàº¡</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 8px' }}>àº¥àº°àº«àº±àº”</th>
                    <th style={{ padding: '10px 8px' }}>àºŠàº·à»ˆ</th>
                    <th style={{ padding: '10px 8px' }}>à»€àºšàºµà»‚àº—</th>
                    <th style={{ padding: '10px 8px' }}>àºœàº¹à»‰àº•àº´àº”àº•à»à»ˆ</th>
                    <th style={{ padding: '10px 8px' }}>àº—àºµà»ˆàº¢àº¹à»ˆ</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>àºˆàº±àº”àºàº²àº™</th>
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
                        <button type="button" className="btn btn-sm btn-secondary" style={{ marginRight: '6px' }} onClick={() => openEditSupplier(s)}>âœï¸</button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteSupplier(s)}>ðŸ—‘ï¸</button>
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
            <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.4rem', margin: 0 }}>ðŸ§¾ à»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ (Purchase Orders)</h2>
            <button type="button" className="btn btn-primary" onClick={openCreatePo}>âž• àºªà»‰àº²àº‡à»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰</button>
          </div>
          {purchaseOrders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>àºàº±àº‡àºšà»à»ˆàº¡àºµà»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ â€” àºªà»‰àº²àº‡à»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰à»€àºžàº·à»ˆàº­àºªàº±à»ˆàº‡à»€àº•àºµàº¡àºªàº°àº•àº±àº­àº, à»€àº¡àº·à»ˆàº­àº®àº±àºšàº‚àº­àº‡à»àº¥à»‰àº§àºàº»àº” "àº®àº±àºšà»€àº‚àº»à»‰àº²àºªàº°àº•àº±àº­àº"</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 8px' }}>àº¥àº°àº«àº±àº”</th>
                    <th style={{ padding: '10px 8px' }}>àº§àº±àº™àº—àºµ</th>
                    <th style={{ padding: '10px 8px' }}>àºœàº¹à»‰àºªàº°à»œàº­àº‡</th>
                    <th style={{ padding: '10px 8px' }}>àº¥àº²àºàºàº²àº™</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>àº¡àº¹àº™àº„à»ˆàº² (â‚­)</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>àºªàº°àº–àº²àº™àº°</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>àºˆàº±àº”àºàº²àº™</th>
                  </tr>
                </thead>
                <tbody>
                  {[...purchaseOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).map(po => (
                    <tr key={po.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--gold-primary)' }}>{po.id}</td>
                      <td style={{ padding: '10px 8px' }}>{new Date(po.date).toLocaleDateString('lo-LA')}</td>
                      <td style={{ padding: '10px 8px' }}>{po.supplierName || '-'}</td>
                      <td style={{ padding: '10px 8px' }}>{(po.items || []).map(it => `${it.name} Ã—${it.qty}`).join(', ')}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: hasInventoryPermission('inventoryViewCost') ? 'white' : 'var(--text-secondary)' }}>{hasInventoryPermission('inventoryViewCost') ? (po.total || 0).toLocaleString() : '***'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{statusBadge(po.status)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {po.status === 'pending' && (
                          <button type="button" className="btn btn-sm btn-primary" style={{ marginRight: '6px' }} onClick={() => handleReceivePo(po)}>ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²àºªàº°àº•àº±àº­àº</button>
                        )}
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeletePo(po)}>ðŸ—‘ï¸</button>
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
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{editSupplier ? 'âœï¸ à»àºà»‰à»„àº‚àºœàº¹à»‰àºªàº°à»œàº­àº‡' : 'âž• à»€àºžàºµà»ˆàº¡àºœàº¹à»‰àºªàº°à»œàº­àº‡'}</h3>
                <button className="close-btn" onClick={() => setShowSupplierModal(false)}>âœ•</button>
              </div>
              <form onSubmit={handleSaveSupplier}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
                  <div className="form-group">
                    <label className="form-label">àºŠàº·à»ˆàºœàº¹à»‰àºªàº°à»œàº­àº‡ *</label>
                    <input type="text" className="form-control" required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">à»€àºšàºµà»‚àº—</label>
                    <input type="text" className="form-control" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">àºœàº¹à»‰àº•àº´àº”àº•à»à»ˆ</label>
                    <input type="text" className="form-control" value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">àº—àºµà»ˆàº¢àº¹à»ˆ</label>
                    <input type="text" className="form-control" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">à»àº²àºà»€àº«àº”</label>
                    <input type="text" className="form-control" value={supplierForm.note} onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary">àºšàº±àº™àº—àº¶àº âœ“</button>
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
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>âž• àºªà»‰àº²àº‡à»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ (Purchase Order)</h3>
                <button className="close-btn" onClick={() => setShowPoModal(false)}>âœ•</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">àºœàº¹à»‰àºªàº°à»œàº­àº‡ (Supplier)</label>
                    <select className="form-control" value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)}>
                      <option value="">â€” àºšà»à»ˆàº¥àº°àºšàº¸ â€”</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">à»àº²àºà»€àº«àº”</label>
                    <input type="text" className="form-control" value={poNote} onChange={(e) => setPoNote(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº²</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="form-control" value={poProductId} onChange={(e) => setPoProductId(e.target.value)}>
                      <option value="">â€” à»€àº¥àº·àº­àºàºªàº´àº™àº„à»‰àº² â€”</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={addPoLine}>âž• à»€àºžàºµà»ˆàº¡</button>
                  </div>
                </div>

                {poLines.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {poLines.map(l => (
                      <div key={l.productId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>àºˆàº³àº™àº§àº™</span>
                          <input type="number" min="1" className="form-control" value={l.qty} onChange={(e) => updatePoLine(l.productId, 'qty', e.target.value)} style={{ width: '72px', textAlign: 'center' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>àº•àº»à»‰àº™àº—àº¶àº™/à»œà»ˆàº§àº</span>
                          <input type="number" min="0" className="form-control" value={l.cost} onChange={(e) => updatePoLine(l.productId, 'cost', e.target.value)} style={{ width: '100px', textAlign: 'right' }} />
                        </div>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removePoLine(l.productId)}>âœ•</button>
                      </div>
                    ))}
                  </div>
                )}

                {poError && <p style={{ color: 'var(--alert-red)', fontSize: '0.85rem', margin: 0 }}>âš ï¸ {poError}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>àº¡àº¹àº™àº„à»ˆàº²àº¥àº§àº¡</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{poTotal.toLocaleString()} â‚­</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPoModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
                <button type="button" className="btn btn-primary" disabled={poLines.length === 0} onClick={handleCreatePo}>àºšàº±àº™àº—àº¶àºà»ƒàºšàºªàº±à»ˆàº‡àºŠàº·à»‰ âœ“</button>
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
  const [newCatIcon, setNewCatIcon] = useState('ðŸ“¦');
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
    unit: 'àº­àº±àº™',
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
    const pass = prompt('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºœàº¹à»‰àº”àº¹à»àº¥àº¥àº°àºšàº»àºš (Admin Passcode) à»€àºžàº·à»ˆàº­àº¥àº»àºšàºªàº´àº™àº„à»‰àº²:');
    if (!pass) return;
    
    const users = db.getUsers();
    const isAdmin = users.some(u => u.passcode === pass && (u.permissions?.admin || u.role === 'owner'));
    if (!isAdmin) {
      alert('àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºšà»à»ˆàº–àº·àºàº•à»‰àº­àº‡!');
      return;
    }
    
    if (confirm(`àº—à»ˆàº²àº™àº•à»‰àº­àº‡àºàº²àº™àº¥àº»àºšàºªàº´àº™àº„à»‰àº² "${p.name}" à»àº—à»‰àº«àº¼àº·àºšà»à»ˆ?`)) {
      db.deleteProduct(p.id);
      setProducts(db.getProducts());
      alert('âœ“ àº¥àº»àºšàºªàº´àº™àº„à»‰àº²àºªàº³à»€àº¥àº±àº”!');
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
      unit: isService ? 'àº„àº±à»‰àº‡' : 'àº­àº±àº™',
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
      const newCat = db.addCategory({ name: formData.category.trim(), icon: 'ðŸ“¦', type: 'physical' });
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
      unit: formData.unit || (isService ? 'àº„àº±à»‰àº‡' : 'àº­àº±àº™')
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
    setNewCatIcon('ðŸ“¦');
    setNewCatType('physical');
    setShowCategoryModal(true);
  };

  const openCategoryEdit = (cat) => {
    setCategoryError('');
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon || 'ðŸ“¦');
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
      setNewCatIcon('ðŸ“¦');
      setNewCatType('physical');
      setEditingCategory(null);
      setCategoryError('');
      setCategories(db.getCategories());
    } catch (err) {
      setCategoryError(err.message);
    }
  };

  const verifyAdminPin = () => {
    const pin = prompt('ðŸ”’ àº•à»‰àº­àº‡àºàº²àº™àº­àº°àº™àº¸àº¡àº±àº”: àºàº°àº¥àº¸àº™àº²à»ƒàºªà»ˆàº¥àº°àº«àº±àº” PIN àº‚àº­àº‡ Admin/à»€àºˆàº»à»‰àº²àº‚àº­àº‡àº®à»‰àº²àº™:');
    if (!pin) return false;
    const users = db.getUsers();
    const settings = db.getSettings();
    const matchedOwner = users.find(u => u.role === 'owner' && u.passcode === pin);
    const isMasterPin = pin === settings.masterAdminPin;
    if (matchedOwner || isMasterPin) return true;
    alert('âŒ àº¥àº°àº«àº±àº” PIN àºšà»à»ˆàº–àº·àºàº•à»‰àº­àº‡!');
    return false;
  };

  const handleWarehouseRestockSubmit = (e) => {
    e.preventDefault();
    const qty = Number(warehouseRestockQty);
    if (!qty || qty <= 0) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºˆàº³àº™àº§àº™à»ƒàº«à»‰àº–àº·àºàº•à»‰àº­àº‡');
    
    const prodList = db.getProducts();
    const idx = prodList.findIndex(p => p.id === warehouseActiveProduct.id);
    if (idx !== -1) {
      prodList[idx].warehouseStock = (prodList[idx].warehouseStock || 0) + qty;
      db.saveProducts(prodList);
      db.addAuditLog('warehouse_restock', `àº®àº±àºšà»€àº‚àº»à»‰àº²àºªàº²àº‡à»ƒàº«àºà»ˆ: ${warehouseActiveProduct.name} +${qty} ${warehouseActiveProduct.unit || 'àº­àº±àº™'} (${warehouseRestockNotes || ''})`);
      alert('âœ“ àº®àº±àºšà»€àº‚àº»à»‰àº²àºªàº²àº‡à»ƒàº«àºà»ˆàºªàº³à»€àº¥àº±àº”!');
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
    if (!qty || qty <= 0) return alert('àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºˆàº³àº™àº§àº™à»ƒàº«à»‰àº–àº·àºàº•à»‰àº­àº‡');
    
    const currentWarehouseStock = warehouseActiveProduct.warehouseStock || 0;
    if (qty > currentWarehouseStock) {
      if (!window.confirm(`âš ï¸ àºˆàº³àº™àº§àº™àº—àºµà»ˆà»‚àº­àº™ (${qty}) àº«àº¼àº²àºàºàº§à»ˆàº²àºªàº°àº•àº±àº­àºàºªàº²àº‡à»ƒàº«àºà»ˆàº—àºµà»ˆàº¡àºµ (${currentWarehouseStock}). àº¢àº·àº™àº¢à¸±à¸™àº—àºµà»ˆàºˆàº°à»‚àº­àº™àºšà»à»ˆ?`)) {
        return;
      }
    }
    
    const prodList = db.getProducts();
    const idx = prodList.findIndex(p => p.id === warehouseActiveProduct.id);
    if (idx !== -1) {
      prodList[idx].warehouseStock = Math.max(0, (prodList[idx].warehouseStock || 0) - qty);
      prodList[idx].stock = (prodList[idx].stock || 0) + qty;
      db.saveProducts(prodList);
      db.addAuditLog('warehouse_transfer', `à»‚àº­àº™àºªàº´àº™àº„à»‰àº²à»„àº›à»œà»‰àº²àº®à»‰àº²àº™: ${warehouseActiveProduct.name} à»‚àº­àº™ ${qty} ${warehouseActiveProduct.unit || 'àº­àº±àº™'} (àºªàº²àº‡à»ƒàº«àºà»ˆ -${qty} -> à»œà»‰àº²àº®à»‰àº²àº™ +${qty}) (${warehouseTransferNotes || ''})`);
      alert('âœ“ à»‚à¸­à¸™àºà»‰àº²àºàºªàº´àº™àº„à»‰àº²à»„àº›à»œà»‰àº²àº®à»‰àº²àº™àºªàº³à»€àº¥àº±àº”!');
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
      ctx.fillText('âŒ àº‚à»à»‰àº¡àº¹àº™àºšà»à»ˆàº–àº·àºàº•à»‰àº­àº‡àºªàº³àº¥àº±àºš ' + format, canvas.width / 2, canvas.height / 2 - 10);
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
      
      let name = productName || 'àºªàº´àº™àº„à»‰àº²àº—àº»à»ˆàº§à»„àº›';
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
      ctx.fillText('âŒ Error: ' + barcodeFormat, width / 2, currentY + 15);
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
    const name = selectedBarcodeProd ? selectedBarcodeProd.name : 'àºªàº´àº™àº„à»‰àº²àº—àº»à»ˆàº§à»„àº›';
    const priceVal = selectedBarcodeProd ? selectedBarcodeProd.price.toLocaleString() + ' àºàºµàºš' : '';
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
          alert('àºœàº´àº”àºžàº²àº”à»ƒàº™àºàº²àº™àº›àº£àº´àº™: ' + result.error);
        } else {
          setShowBarcodeModal(false);
        }
      } catch (e) {
        alert('àºœàº´àº”àºžàº²àº”à»ƒàº™àºàº²àº™à»€àºŠàº·à»ˆàº­àº¡àº•à»à»ˆ: ' + e.message);
      }
      return;
    }

    const canvas = barcodeCanvasRef.current;
    if (!canvas) {
      alert("àºœàº´àº”àºžàº²àº”: àºšà»à»ˆàºžàº»àºšàºžàº·à»‰àº™àº—àºµà»ˆàº§àº²àº”àºšàº²à»‚àº„à»‰àº” / Error: Barcode canvas not found.");
      return;
    }
    const dataUrl = canvas.toDataURL();
    
    const paperWidth = ensureUnit(settings.barcodePaperWidth || settings.barcodeStickerWidth || '40mm', 'mm');
    const paperHeight = ensureUnit(settings.barcodePaperHeight || settings.barcodeStickerHeight || '25mm', 'mm');
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
    for (let i = 0; i < barcodePrintQty; i++) {
      stickersHtml += `
        <div class="sticker">
          ${showName ? `<p class="name">${name}</p>` : ''}
          <img src="${dataUrl}" />
          ${showPrice ? `<p class="price">${priceVal}</p>` : ''}
        </div>
      `;
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
          <title>àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº” - àº‚àº­àºšàºžàº£àº°àº£àº±àº—à»€àºàºŠ</title>
          <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${paperWidth} ${paperHeight};
              margin: 0;
            }
            html, body {
              width: ${paperWidth};
              height: auto;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Phetsarath', 'Phetsarath OT', Arial, sans-serif;
              background: white;
              color: black;
              display: grid;
              grid-template-columns: repeat(${columns}, ${stickerWidth});
              column-gap: ${gapX};
              row-gap: ${gapY};
              justify-content: start;
              padding-left: ${marginLeft};
              padding-top: ${marginTop};
              box-sizing: border-box;
            }
             .sticker {
              display: flex;
              flex-direction: column;
              align-items: ${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              justify-content: center;
              width: ${stickerWidth};
              height: ${columns === 1 ? `calc(${stickerHeight} - ${marginTop} - 1.5mm)` : stickerHeight};
              max-height: ${columns === 1 ? `calc(${stickerHeight} - ${marginTop} - 1.5mm)` : stickerHeight};
              padding: ${stickerMargin}px;
              box-sizing: border-box;
              overflow: hidden;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sticker:not(:last-child) {
              page-break-after: ${columns === 1 ? 'always' : 'auto'};
              break-after: ${columns === 1 ? 'always' : 'auto'};
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
      alert('àºàº°àº¥àº¸àº™àº²à»€àº¥àº·àº­àºàºˆàº³àº™àº§àº™àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”àº¢à»ˆàº²àº‡à»œà»‰àº­àº 1 àº¥àº²àºàºàº²àº™');
      return;
    }

    const settings = db.getSettings();
    const format = barcodeFormat || settings.barcodeFormat || 'CODE128';

    if (settings.barcodeDirectPrint) {
      try {
        for (const p of itemsToPrint) {
          const qty = bulkPrintQtys[p.id] || 0;
          const name = p.name;
          const priceVal = p.price.toLocaleString() + ' àºàºµàºš';
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
            alert(`àºœàº´àº”àºžàº²àº”à»ƒàº™àºàº²àº™àº›àº£àº´àº™ ${p.name}: ${result.error}`);
            return;
          }
        }
        setShowBulkBarcodeModal(false);
        setBulkPrintQtys({});
      } catch (e) {
        alert('àºœàº´àº”àºžàº²àº”à»ƒàº™àºàº²àº™à»€àºŠàº·à»ˆàº­àº¡àº•à»à»ˆ: ' + e.message);
      }
      return;
    }

    const paperWidth = ensureUnit(settings.barcodePaperWidth || settings.barcodeStickerWidth || '40mm', 'mm');
    const paperHeight = ensureUnit(settings.barcodePaperHeight || settings.barcodeStickerHeight || '25mm', 'mm');
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
    for (const p of itemsToPrint) {
      const qty = bulkPrintQtys[p.id] || 0;
      const dataUrl = await generateBarcodeDataUrl(p.barcode, format);
      const name = p.name;
      const priceVal = p.price.toLocaleString() + ' àºàºµàºš';
      for (let i = 0; i < qty; i++) {
        stickersHtml += `
          <div class="sticker">
            ${showName ? `<p class="name">${name}</p>` : ''}
            <img src="${dataUrl}" />
            ${showPrice ? `<p class="price">${priceVal}</p>` : ''}
          </div>
        `;
      }
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
          <title>àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”àº«àº¼àº²àºàº¥àº²àºàºàº²àº™ - àº‚àº­àºšàºžàº£àº°àº£àº±àº—à»€àºàºŠ</title>
          <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${paperWidth} ${paperHeight};
              margin: 0;
            }
            html, body {
              width: ${paperWidth};
              height: auto;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Phetsarath', 'Phetsarath OT', Arial, sans-serif;
              background: white;
              color: black;
              display: grid;
              grid-template-columns: repeat(${columns}, ${stickerWidth});
              column-gap: ${gapX};
              row-gap: ${gapY};
              justify-content: start;
              padding-left: ${marginLeft};
              padding-top: ${marginTop};
              box-sizing: border-box;
            }
             .sticker {
              display: flex;
              flex-direction: column;
              align-items: ${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              justify-content: center;
              width: ${stickerWidth};
              height: ${columns === 1 ? `calc(${stickerHeight} - ${marginTop} - 1.5mm)` : stickerHeight};
              max-height: ${columns === 1 ? `calc(${stickerHeight} - ${marginTop} - 1.5mm)` : stickerHeight};
              padding: ${stickerMargin}px;
              box-sizing: border-box;
              overflow: hidden;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sticker:not(:last-child) {
              page-break-after: ${columns === 1 ? 'always' : 'auto'};
              break-after: ${columns === 1 ? 'always' : 'auto'};
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub Tab Bar Navigation */}
      <div className="nav-tabs" style={{ margin: 0, display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('products')}
        >
          {db.getLabel('inv_tab_products', 'ðŸ“¦ àºªàº°àº•àº±àº­àºàºªàº´àº™àº„à»‰àº² (Products)')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'raw_materials' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('raw_materials')}
        >
          {db.getLabel('inv_tab_raw_materials', 'ðŸ’Ž àº§àº±àº”àº–àº¸àº”àº´àºš (Raw Materials)')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'manufacturing' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('manufacturing')}
        >
          {db.getLabel('inv_tab_manufacturing', 'ðŸ­ àºªàº¹àº”àºàº²àº™àºœàº°àº¥àº´àº” & BOM')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'purchasing' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('purchasing')}
        >
          {db.getLabel('inv_tab_purchasing', 'ðŸ§¾ àºªàº±à»ˆàº‡àºŠàº·à»‰ & àºœàº¹à»‰àºªàº°à»œàº­àº‡')}
        </button>
        <button
          type="button"
          className={`nav-tab ${activeSubTab === 'consumables' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('consumables')}
        >
          ðŸ”§ àºªàº²àº‡àº­àº¸àº›àº°àºàº­àº™àºªàº´à»‰àº™à»€àº›àº·àº­àº‡ (Consumables)
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
            {db.getLabel('title_inventory', 'ðŸ“¦ àºˆàº±àº”àºàº²àº™àº„àº±àº‡àºªàº´àº™àº„à»‰àº² & àºªàº°àº•àº±àº­àº (Inventory)')}
          </h2>
          {!isMobile && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              àºˆàº±àº”àºàº²àº™àº¥àº²àºàºàº²àº™àºªàº´àº™àº„à»‰àº², àº‚àº­àºšàºžàº£à¸°, àºªà»‰àº­àºàº„à», à»àº¥àº° àº›àº±àºšàºªàº°àº•àº±àº­àºà»„àº”à»‰à»‚àº”àºàºàº»àº‡
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button 
            className="btn btn-secondary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={() => { setSelectedBarcodeProd(null); setBarcodePrintQty(1); setShowBarcodeModal(true); }}
          >
            ðŸ·ï¸ àºªà»‰àº²àº‡àºšàº²à»‚àº„à»‰àº”à»€àº›àº»à»ˆàº²
          </button>
          <button 
            className="btn btn-secondary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={() => { setBulkPrintQtys({}); setBulkSearch(''); setBulkCatFilter('all'); setShowBulkBarcodeModal(true); }}
          >
            ðŸ·ï¸ àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”àº«àº¼àº²àº
          </button>
          <button 
            className="btn btn-secondary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={openCategoryAdd}
          >
            ðŸ—‚ï¸ àºˆàº±àº”àºàº²àº™à»àº§àº”à»àº¹à»ˆ
          </button>
{hasInventoryPermission('inventoryAddProduct') && (
          <button 
            className="btn btn-primary" 
            style={isMobile ? { flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' } : {}}
            onClick={handleOpenAdd}
          >
            âž• à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ
          </button>
)}
        </div>
      </div>

      {/* Stock Valuation KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--gold-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ðŸ“¦ àºˆàº³àº™àº§àº™àºªàº´àº™àº„à»‰àº²àº„àº»àº‡à»€àº«àº¼àº·àº­àº—àº±àº‡à»àº»àº”</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
            {totalStockCount.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>àºŠàº´à»‰àº™/àº­àº±àº™ (àºˆàº²àº {physicalProducts.length} àº¥àº²àºàºàº²àº™)</span>
          </span>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber, #e67e22)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ðŸ’° àº¡àº¹àº™àº„à»ˆàº²àº•àº»à»‰àº™àº—àº¶àº™àºªàº°àº•àº±àº­àºàº¥àº§àº¡</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
            {hasInventoryPermission('inventoryViewCost') ? `${totalCostValue.toLocaleString()} àºàºµàºš` : '*** àºàºµàºš'}
          </span>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--success-green, #27ae60)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ðŸ“ˆ àº¡àº¹àº™àº„à»ˆàº²àº¥àº²àº„àº²àº‚àº²àºàºªàº°àº•àº±àº­àºàº¥àº§àº¡</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
            {totalRetailValue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>àºàºµàºš</span>
          </span>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-primary, #3498db)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>âœ¨ àºàº³à»„àº¥àº„àº²àº”àº„àº°à»€àº™àº—àº±àº‡à»àº»àº”</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
            {hasInventoryPermission('inventoryViewCost') ? `${totalPotentialProfit.toLocaleString()} àºàºµàºš` : '*** àºàºµàºš'}
          </span>
        </div>
      </div>

      {/* Category Summary Card */}
      <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--gold-primary)', marginTop: '4px' }}>
        <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.92rem', marginBottom: '14px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ðŸ“Š àºªàº°àº«àº¼àº¸àºšàºªàº´àº™àº„à»‰àº²àº•àº²àº¡àº«àº¡àº§àº”àº«àº¡àº¹à»ˆ (Category Summary)
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
                  background: 'rgba(255,255,255,0.03)',
                  border: selectedCatFilter === cat.id ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                    <img src={cat.icon} style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '3px' }} alt="" />
                  ) : (
                    <span style={{ fontSize: '1rem' }}>{cat.icon || 'ðŸ“¦'}</span>
                  )}
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    ðŸ“‹ àº¥àº²àºàºàº²àº™: <b style={{ color: 'white' }}>{catProducts.length}</b> àº¥àº²àºàºàº²àº™
                  </span>
                  {!isService && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      ðŸ“¦ àºªàº°àº•àº±àº­àº: <b style={{ color: stockTotal === 0 ? 'var(--alert-red)' : 'var(--gold-primary)' }}>{stockTotal}</b> àºŠàº´à»‰àº™
                    </span>
                  )}
                  {isService && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber, #e67e22)' }}>ðŸ› ï¸ àºšà»àº¥àº´àºàº²àº™ (àºšà»à»ˆàº¡àºµàºªàº°àº•àº±àº­àº)</span>
                  )}
                  {!isService && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        ðŸ’° àº•àº»à»‰àº™àº—àº¶àº™:{' '}
                        <b style={{ color: 'var(--accent-amber, #e67e22)' }}>
                          {hasInventoryPermission('inventoryViewCost') ? `${catTotalCost.toLocaleString()} àºàºµàºš` : '***'}
                        </b>
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        ðŸ“ˆ àº‚àº²àº:{' '}
                        <b style={{ color: 'var(--success-green, #27ae60)' }}>
                          {catTotalRetail.toLocaleString()} àºàºµàºš
                        </b>
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        âœ¨ àºàº³à»„àº¥:{' '}
                        <b style={{ color: catProfit >= 0 ? 'var(--gold-primary)' : 'var(--alert-red)' }}>
                          {hasInventoryPermission('inventoryViewCost') ? `${catProfit.toLocaleString()} àºàºµàºš` : '***'}
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
            âš ï¸ à»àºˆà»‰àº‡à»€àº•àº·àº­àº™: àºªàº´àº™àº„à»‰àº²à»ƒàºà»‰à»àº»àº”àºªàº°àº•àº±àº­àº ({lowStockProducts.length} àº¥àº²àºàºàº²àº™)
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {lowStockProducts.map(p => (
              <div
                key={p.id}
                style={{ background: 'rgba(20, 10, 10, 0.5)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>{p.name} (<b>àº„àº»àº‡à»€àº«àº¼àº·àº­: {p.stock} {p.unit}</b>)</span>
{hasInventoryPermission('inventoryEditProduct') && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                  onClick={() => handleOpenEdit(p)}
                >
                  àº•àº·à»ˆàº¡àºªàº°àº•àº±àº­àº
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
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ðŸ”</span>
          <input
            type="text"
            className="form-control"
            placeholder="àº„àº»à»‰àº™àº«àº²àºªàº´àº™àº„à»‰àº² àº”à»‰àº§àºàºŠàº·à»ˆ àº«àº¼àº· àºšàº²à»‚àº„à»‰àº” (Search name/barcode)..."
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
              âœ•
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>àºˆàº±àº”àº¥àº½àº‡ / Sort:</span>
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
            <option value="none">à»€àº¥àº·àº­àºàºàº²àº™àºˆàº±àº”àº¥àº½àº‡ (None)</option>
            <option value="name-asc">ðŸ”  àºŠàº·à»ˆ: àº - àº® (A-Z)</option>
            <option value="name-desc">ðŸ”  àºŠàº·à»ˆ: àº® - àº (Z-A)</option>
            <option value="stock-asc">ðŸ“‰ àºªàº°àº•àº±àº­àº: àº•à»ˆàº³ &rarr; àºªàº¹àº‡ (Low to High)</option>
            <option value="stock-desc">ðŸ“ˆ àºªàº°àº•àº±àº­àº: àºªàº¹àº‡ &rarr; àº•à»ˆàº³ (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Category Tabs for easier visualization (à¹à¸¢à¸à¸«à¸¡à¸§à¸”à¸«à¸¡à¸¹à¹ˆà¹ƒà¸«à¹‰à¸”à¸¹à¸‡à¹ˆà¸²à¸¢) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {[
          { id: 'all', icon: 'ðŸ“¦', name: 'àº—àº±àº‡à»àº»àº”', count: products.length },
          { id: 'low_stock', icon: 'âš ï¸', name: 'àºªàº°àº•àº±àº­àºà»ƒàºà»‰à»àº»àº”', count: lowStockProducts.length },
          { id: 'physical', icon: 'ðŸ“¦', name: 'àºªàº´àº™àº„à»‰àº²', count: physicalProducts.length },
          { id: 'service', icon: 'ðŸ› ï¸', name: 'àºšà»àº¥àº´àºàº²àº™', count: products.length - physicalProducts.length },
          ...categories.map(cat => ({
            id: cat.id,
            icon: cat.icon || 'ðŸ“¦',
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
              <th style={{ padding: '16px' }}>àº®àº¹àºšàºžàº²àºš</th>
              <th style={{ padding: '16px' }}>àº¥àº°àº«àº±àº”àºšàº²à»‚àº„à»‰à¸”</th>
              <th style={{ padding: '16px' }}>àºŠàº·à»ˆàºªàº´àº™àº„à»‰àº²</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>àº•àº»à»‰àº™àº—àº¶àº™</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>àº¥àº²àº„àº²àº‚àº²àº</th>
              <th style={{ padding: '16px', textAlign: 'center', width: '160px' }}>àºªàº°àº•àº±àº­àºà»œà»‰àº²àº®à»‰àº²àº™</th>
              <th style={{ padding: '16px', textAlign: 'center', width: '240px' }}>àºªàº°àº•àº±àº­àºàºªàº²àº‡à»ƒàº«àºà»ˆ</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>àºˆàº±àº”àºàº²àº™</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
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
                          return isService ? `ðŸ› ï¸ ${catName || 'àºšà»àº¥àº´àºàº²àº™'}` : `ðŸ“¦ ${catName || 'àºªàº´àº™àº„à»‰àº²'}`;
                        })()}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} àºàºµàºš` : '*** àºàºµàºš'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                    {p.price.toLocaleString()} àºàºµàºš
                  </td>
                  
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isService ? (
                      <span style={{ color: 'var(--text-secondary)' }}>àºšà»àº¥àº´àºàº²àº™ (àºšà»à»ˆàº¡àºµàºªàº°àº•àº±àº­àº)</span>
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

                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isService ? (
                      <span style={{ color: 'var(--text-secondary)' }}>â€”</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'right', color: 'var(--accent-amber)' }}>
                          {p.warehouseStock || 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '4px' }}>{p.unit}</span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '2px 6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
                          onClick={() => {
                            setWarehouseActiveProduct(p);
                            setShowWarehouseRestockModal(true);
                          }}
                        >
                          ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '2px 6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                          onClick={() => {
                            setWarehouseActiveProduct(p);
                            setShowWarehouseTransferModal(true);
                          }}
                        >
                          ðŸšš à»‚àº­àº™àºà»‰àº²àº
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
                        ðŸ·ï¸ àºšàº²à»‚àº„à»‰àº”
                      </button>
{hasInventoryPermission('inventoryEditProduct') && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        ðŸ“ à»àºà»‰à»„àº‚
                      </button>
)}
{hasInventoryPermission('inventoryDeleteProduct') && (
                      <button
                        className="btn"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#c0392b', color: 'white', border: 'none' }}
                        onClick={() => handleDeleteProduct(p)}
                      >
                        ðŸ—‘ï¸ àº¥àº»àºš
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
        {filteredProducts.map(p => {
          const isService = db.isServiceCategory(p.category);
          const isLow = !isService && p.stock <= p.minStock;
          return (
            <div key={p.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid ' + (isLow ? 'var(--alert-red)' : 'var(--success-green)') }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {p.image ? (
                  <img src={p.image} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', fontSize: '1.2rem' }}>ðŸ“¦</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>àºšàº²à»‚àº„à»‰àº”: {p.barcode || '-'} â€¢ SKU: {p.sku || '-'}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>àº•àº»à»‰àº™àº—àº¶à¸™: </span>
                  <span>{hasInventoryPermission('inventoryViewCost') ? `${p.cost.toLocaleString()} â‚­` : '*** â‚­'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>àº¥àº²àº„àº²àº‚àº²àº: </span>
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{p.price.toLocaleString()} â‚­</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>à»àº§àº”à»àº¹à»ˆ: </span>
                  <span style={{ textTransform: 'capitalize' }}>{p.category}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>àºªàº°àº•àº±àº­àºà»œà»‰àº²àº®à»‰àº²àº™: </span>
                  {isService ? (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>àºšà»àº¥àº´àºàº²àº™ (No Stock)</span>
                  ) : (
                    <span style={{ fontWeight: 'bold', color: isLow ? 'var(--alert-red)' : 'white' }}>{p.stock} / {p.minStock} {p.unit}</span>
                  )}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>àºªàº°àº•àº±àº­àºàºªàº²àº‡à»ƒàº«àºà»ˆ: </span>
                  {isService ? (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>â€”</span>
                  ) : (
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-amber)' }}>{p.warehouseStock || 0} {p.unit}</span>
                  )}
                </div>
              </div>

              {!isService && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>àº›àº±àºšàºªàº°àº•àº±àº­àºà»œà»‰àº²àº®à»‰àº²àº™:</span>
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
                      ðŸ“¥ àº®àº±àºšà»€àº‚àº»à»‰àº²àºªàº²àº‡à»ƒàº«àºà»ˆ
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
                      ðŸšš à»‚àº­àº™àºà»‰àº²àºà»œà»‰àº²àº®à»‰àº²àº™
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenBarcodeGen(p)}>ðŸ·ï¸ àºšàº²à»‚àº„à»‰àº”</button>
{hasInventoryPermission('inventoryEditProduct') && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleOpenEdit(p)}>ðŸ“ à»àºà»‰à»„àº‚</button>
)}
{hasInventoryPermission('inventoryDeleteProduct') && (
                <button type="button" className="btn btn-sm" style={{ background: '#c0392b', color: 'white', border: 'none' }} onClick={() => handleDeleteProduct(p)}>ðŸ—‘ï¸ àº¥àº»àºš</button>
)}
              </div>
            </div>
          );
        })}
      </div>

      
      {/* Add / Edit Product Modal */}
      {showModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{editProduct ? 'ðŸ“ à»àºà»‰à»„àº‚àº¥àº²àºàº¥àº°àº­àº½àº”àºªàº´àº™àº„à»‰àº²' : 'âž• à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ'}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>âœ•</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">àºŠàº·à»ˆàºªàº´àº™àº„à»‰àº² (àºžàº²àºªàº²àº¥àº²àº§/à»„àº—)</label>
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
                  <label className="form-label">à»àº§àº”à»àº¹à»ˆ (Category)</label>
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
                              <span>{selectedCat.icon || 'ðŸ“¦'}</span>
                            )}
                            <span>{selectedCat.name}</span>
                          </div>
                        );
                      }
                      return <span style={{ color: 'var(--text-secondary)' }}>à»€àº¥àº·àº­àºà»àº§àº”à»àº¹à»ˆ...</span>;
                    })()}
                    <span style={{ transition: 'transform 0.2s', transform: showCategoryDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>â–¼</span>
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
                              unit: isService ? 'àº„àº±à»‰àº‡' : (formData.unit || 'àº­àº±àº™')
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
                            <span>{cat.icon || 'ðŸ“¦'}</span>
                          )}
                          <span>{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">àº¥àº²àº„àº²àº‚àº²àº (àºàºµàºš)</label>
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
                    <label className="form-label">àº¥àº²àº„à¸²àº•àº»à»‰àº™àº—àº¶àº™ (àºàºµàºš)</label>
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
                      <label className="form-label">àºˆàº³àº™àº§àº™à»ƒàº™àºªàº°àº•àº±àº­àº</label>
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
                      <label className="form-label">à»àºˆà»‰àº‡à»€àº•àº·àº­àº™à»€àº¡àº·à»ˆàº­àº•à»à»ˆàº²àºàº§à»ˆàº²</label>
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
                    àº„à»àº²à»àº™àº°àº™àº³: à»àº§àº”àºšà»àº¥àº´àºàº²àº™àºˆàº°àºšà»à»ˆà»ƒàºŠà»‰àºªàº°àº•àº±àº­àº. àº¥àº°àºšàº»àºšàºˆàº°àºšàº±àº‡àº„àº±àºš stock/min stock à»€àº›àº±àº™ 0 à»ƒàº«à»‰àº­àº±àº”àº•àº°à»‚àº™àº¡àº±àº”.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">àº«àº»àº§à»œà»ˆàº§à¸¢</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="àº­àº±àº™, à»€àºªàº±à»‰àº™, àº­àº»àº‡"
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">àº¥àº°àº«àº±àº”àºšàº²à»‚àº„à»‰àº” (Barcode)</label>
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
                        placeholder="àº¥àº°àº«àº±àº”àºšàº²à»‚àº„à»‰àº”..."
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
                        ðŸ”Œ àºªàº°à»àºàº™
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
                      <span>àºªàº°à»àº”àº‡à»ƒàº™ Online Shop</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="form-label">àº¥àº²àº„àº²àº­àº­àº™àº¥àº²àº (àºàºµàºš)</label>
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
                  <label className="form-label">àº¥àº²àºàº¥àº°àº­àº½àº”àºªàº´àº™àº„à»‰àº² (Product Description)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    style={{ background: '#1c1916', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}
                    placeholder="àº›à»‰àº­àº™àº¥àº²àºàº¥àº°àº­àº½àº”àºªàº´àº™àº„à»‰àº²..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">àº®àº¹àºšàºžàº²àºšàºªàº´àº™àº„à»‰àº² (Product Photos - àº­àº±àºšà»‚àº«àº¼àº”à»„àº”à»‰àº«àº¼àº²àºàº®àº¹àºš)</label>
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
                            title="à»àº•à»ˆàº‡àº®àº¹àºšàº”à»‰àº§àº AI"
                          >
                            ðŸŽ¨
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
                            âœ•
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
                    unit: 'àº­àº±àº™',
                    barcode: '',
                    image: '',
                    showOnline: true,
                    priceOnline: '',
                    priceVip: ''
                  });
                }}>àºàº»àºà»€àº¥àºµàº</button>
                <button type="submit" className="btn btn-primary">ðŸ’¾ àºšàº±àº™àº—àº¶àºàºªàº´àº™àº„à»‰àº²</button>
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
                <span className="modal-title">ðŸ“¥ àº®àº±àºšàºªàº´àº™àº„à»‰àº²à»€àº‚àº»à»‰àº²àºªàº²àº‡à»ƒàº«àºà»ˆ</span>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowWarehouseRestockModal(false);
                    setWarehouseActiveProduct(null);
                  }}
                >âœ•</button>
              </div>
              <form onSubmit={handleWarehouseRestockSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{warehouseActiveProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      àºšàº²à»‚àº„à»‰àº”: {warehouseActiveProduct.barcode || '-'} | àºªàº°àº•àº±àº­àºàºªàº²àº‡à»ƒàº«àºà»ˆàº›àº±àº”àºˆàº¸àºšàº±àº™: {warehouseActiveProduct.warehouseStock || 0} {warehouseActiveProduct.unit}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">àºˆàº³àº™àº§àº™àº®àº±àºšà»€àº‚àº»à»‰àº²àºªàº²àº‡à»ƒàº«àºà»ˆ ({warehouseActiveProduct.unit}) <span style={{ color: 'var(--alert-red)' }}>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0.001"
                      step="any"
                      placeholder="àº›à»‰àº­àº™àºˆàº³àº™àº§àº™..." 
                      value={warehouseRestockQty} 
                      onChange={(e) => setWarehouseRestockQty(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">à»àº²àºà»€àº«àº” (à»€àºŠàº±à»ˆàº™: àºŠàº·à»ˆàºœàº¹à»‰àºªàº°à»œàº­àº‡, à»€àº¥àºàº—àºµàºšàº´àº™...)</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      placeholder="àº›à»‰àº­àº™à»àº²àºà»€àº«àº”..."
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
                  >àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary">ðŸ“¥ àº¢àº·àº™àº¢àº±àº™àº®àº±àºšà»€àº‚àº»à»‰àº²</button>
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
                <span className="modal-title">ðŸšš à»‚àº­àº™àºà»‰àº²àºàºªàº´àº™àº„à»‰àº²à»„àº›à»œà»‰àº²àº®à»‰àº²àº™</span>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowWarehouseTransferModal(false);
                    setWarehouseActiveProduct(null);
                  }}
                >âœ•</button>
              </div>
              <form onSubmit={handleWarehouseTransferSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{warehouseActiveProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>ðŸ“¦ àºªàº°àº•àº±àº­àºà»œà»‰àº²àº®à»‰àº²àº™àº›àº±àº”àºˆàº¸àºšàº±àº™: {warehouseActiveProduct.stock || 0} {warehouseActiveProduct.unit}</span>
                      <span>ðŸ  àºªàº°àº•àº±àº­àºàºªàº²àº‡à»ƒàº«àºà»ˆàº›àº±àº”àºˆàº¸àºšàº±àº™: {warehouseActiveProduct.warehouseStock || 0} {warehouseActiveProduct.unit}</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">àºˆàº³àº™àº§àº™àº—àºµà»ˆàº•à»‰àº­àº‡àºàº²àº™à»‚àº­àº™àºà»‰àº²àº ({warehouseActiveProduct.unit}) <span style={{ color: 'var(--alert-red)' }}>*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0.001"
                      step="any"
                      placeholder="àº›à»‰àº­àº™àºˆàº³àº™àº§àº™à»‚àº­àº™àºà»‰àº²àº..." 
                      value={warehouseTransferQty} 
                      onChange={(e) => setWarehouseTransferQty(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">à»àº²àºà»€àº«àº” (à»€àºŠàº±à»ˆàº™: à»‚àº­àº™à»„àº›à»€àºžàºµà»ˆàº¡à»œà»‰àº²àº®à»‰àº²àº™...)</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      placeholder="àº›à»‰àº­àº™à»àº²àºà»€àº«àº”..."
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
                  >àºàº»àºà»€àº¥àºµàº</button>
                  <button type="submit" className="btn btn-primary">ðŸšš àº¢àº·àº™àº¢àº±àº™àºàº²àº™à»‚àº­àº™</button>
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
              <span className="modal-title">ðŸ·ï¸ àº¥àº°àºšàº»àºšàºªà»‰àº²àº‡ & àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowBarcodeModal(false)}>âœ•</button>
            </div>
            
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {selectedBarcodeProd 
                  ? `àºªàº´àº™àº„à»‰àº²: ${selectedBarcodeProd.name}`
                  : 'àº›à»‰àº­àº™àº¥àº°àº«àº±àº”à»€àºžàº·à»ˆàº­àºªà»‰àº²àº‡àºšàº²à»‚àº„à»‰àº”àºªàº°à»€àºžàº²àº°àºàº´àº”'}
              </p>

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>àº„àº»à»‰àº™àº«àº²àº›àº°à»€àºžàº”àºšàº²à»‚àº„à»‰àº” (Search Barcode Format)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ðŸ” àºžàº´àº¡à»€àºžàº·à»ˆàº­àº„àº»à»‰àº™àº«àº²àº›àº°à»€àºžàº”àºšàº²à»‚àº„à»‰àº”..."
                  value={barcodeFormatSearch}
                  onChange={(e) => setBarcodeFormatSearch(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <label className="form-label">àº›àº°à»€àºžàº”àºšàº²à»‚àº„à»‰àº” (Barcode Type / Format)</label>
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
                  <label className="form-label">àº¥àº°àº«àº±àº”àºšàº²à»‚àº„à»‰àº” (àºªàº°à»€àºžàº²àº°àº•àº»àº§à»€àº¥àº à»àº¥àº° àº•àº»àº§àº­àº±àºàºªàº­àº™ A-Z)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customBarcodeText}
                    onChange={(e) => setCustomBarcodeText(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                  />
                </div>
              )}

              <div className="form-group" style={{ textAlign: 'left', marginTop: '12px' }}>
                <label className="form-label">àºˆàº³àº™àº§àº™àºªàº°àº•àº´àºà»€àºàºµàº—àºµà»ˆàº•à»‰àº­àº‡àºàº²àº™àº›àº£àº´àº™ (Print Quantity)</label>
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
                      à»€àº—àº»à»ˆàº²àºªàº°àº•àº±àº­àº ({selectedBarcodeProd.stock})
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
                *àºªàº²àº¡àº²àº”àº™àº³àºšàº²à»‚àº„à»‰àº”àº™àºµà»‰à»„àº›àº›àº£àº´àº™àº•àº´àº”àºàº±àºšàº–àº»àº‡àºžàº£àº° àº«àº¼àº· àº‚àº­àºšàºžàº£àº° à»€àºžàº·à»ˆàº­à»ƒàºŠà»‰à»€àº„àº·à»ˆàº­àº‡àºªàº°à»àºàº™àºàº´àº‡àº‚àº²àºà»„àº”à»‰àº—àº±àº™àº—àºµ
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBarcodeModal(false)}>àº›àº´àº”</button>
              <button className="btn btn-primary" onClick={handlePrintBarcode}>ðŸ–¨ï¸ àº›àº£àº´àº™àºªàº°àº•àº´àºà»€àºàºµàºšàº²à»‚àº„à»‰àº”</button>
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
              <span className="modal-title">ðŸ·ï¸ àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”àº«àº¼àº²àºàº¥àº²àºàºàº²àº™ (Bulk Printer)</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowBulkBarcodeModal(false)}>âœ•</button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                à»€àº¥àº·àº­àºàºˆàº³àº™àº§àº™àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”à»ƒàº«à»‰à»àº•à»ˆàº¥àº°àºªàº´àº™àº„à»‰àº². àº¥àº°àºšàº»àºšàºˆàº°àº¥àº§àº¡à»€àº›àº±àº™à»œà»‰àº²àº”àº½àº§à»€àºžàº·à»ˆàº­à»ƒàº«à»‰àº›àº£àº´àº™àº­àº­àºà»€àº„àº·à»ˆàº­àº‡àºªàº°àº•àº´àºà»€àºàºµà»„àº”à»‰àº‡à»ˆàº²àº.
              </p>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>àº„àº»à»‰àº™àº«àº²àº›àº°à»€àºžàº”àºšàº²à»‚àº„à»‰àº” (Search Barcode Format)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ðŸ” àºžàº´àº¡à»€àºžàº·à»ˆàº­àº„àº»à»‰àº™àº«àº²àº›àº°à»€àºžàº”àºšàº²à»‚àº„à»‰àº”..."
                  value={bulkBarcodeFormatSearch}
                  onChange={(e) => setBulkBarcodeFormatSearch(e.target.value)}
                  style={{ marginBottom: '8px', padding: '6px 10px', height: '34px', fontSize: '0.85rem' }}
                />
                <label className="form-label" style={{ fontSize: '0.8rem' }}>àº›àº°à»€àºžàº”àºšàº²à»‚àº„à»‰àº” (Barcode Type / Format)</label>
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
                  placeholder="ðŸ” àº„àº»à»‰àº™àº«àº²àºŠàº·à»ˆ àº«àº¼àº· àºšàº²à»‚àº„à»‰àº”..."
                  className="form-control"
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '6px' }}>
                {[
                  { id: 'all', name: 'àº—àº±àº‡à»àº»àº”' },
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
                  ðŸ“‹ àº•àº±à»‰àº‡àº—àº±àº‡à»àº»àº”à»€àº—àº»à»ˆàº²àºàº±àºšàºªàº°àº•àº±àº­àº
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
                  ðŸ—‘ï¸ àº¥à»‰àº²àº‡àº—àº±àº‡à»àº»àº”
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
                    àºšà»à»ˆàºžàº»àºšàºªàº´àº™àº„à»‰àº²àº—àºµà»ˆàº„àº»à»‰àº™àº«àº²
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
                              àºšàº²à»‚àº„à»‰àº”: <span style={{ fontFamily: 'monospace' }}>{p.barcode}</span> | àºªàº°àº•àº±àº­àº: {db.isServiceCategory(p.category) ? 'àºšà»àº¥àº´àºàº²àº™' : `${p.stock} ${p.unit}`}
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
                              à»€àº—àº»à»ˆàº²àºªàº°àº•àº±àº­àº
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>àºšà»à»ˆàº¡àºµàºªàº°àº•àº±àº­àº</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total labels selected counter */}
              <div style={{ marginTop: '14px', textAlign: 'right', fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                àº¥àº§àº¡àºªàº°àº•àº´àºà»€àºàºµàº—àºµà»ˆàºˆàº°àº›àº£àº´àº™àº—àº±àº‡à»àº»àº”: {Object.values(bulkPrintQtys).reduce((a, b) => a + b, 0)} à»ƒàºš
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBulkBarcodeModal(false)}>àºàº»àºà»€àº¥àºµàº</button>
              <button className="btn btn-primary" onClick={handlePrintBulkBarcodes}>ðŸ–¨ï¸ àº›àº£àº´àº™àºšàº²à»‚àº„à»‰àº”àº—àº±àº‡à»àº»àº”àº—àºµà»ˆà»€àº¥àº·àº­àº</button>
            </div>
          </div>
        </div>
        </Portal>
      )}
          {/* Mobile FAB to Add Product */}
          <button 
            type="button" 
            className="fab-btn" 
            onClick={handleOpenAdd} 
            title="à»€àºžàºµà»ˆàº¡àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ (Add Product)"
          >
            âž•
          </button>
        </div>
      )}
  
      {/* Category Management Modal */}
      {showCategoryModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">ðŸ—‚ï¸ {editingCategory ? 'à»àºà»‰à»„àº‚à»àº§àº”à»àº¹à»ˆàºªàº´àº™àº„à»‰àº²' : 'àºˆàº±àº”àºàº²àº™à»àº§àº”à»àº¹à»ˆàºªàº´àº™àº„à»‰àº²'}</span>
              <button
                className="btn-secondary"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setNewCatName('');
                  setNewCatIcon('ðŸ“¦');
                  setNewCatType('physical');
                  setCategoryError('');
                }}
              >
                âœ•
              </button>
            </div>
            
            <div className="modal-body">
              {/* Form to Add / Edit Category */}
              <form
                onSubmit={handleCategorySubmit}
                style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '20px' }}
              >
                <h4 style={{ color: 'var(--gold-primary)', marginTop: 0, marginBottom: '12px', fontSize: '0.95rem' }}>{editingCategory ? 'âœï¸ à»àºà»‰à»„àº‚à»àº§àº”à»àº¹à»ˆ' : 'âž• à»€àºžàºµà»ˆàº¡à»àº§àº”à»àº¹à»ˆà»ƒà»à»ˆ'}</h4>
                {categoryError && (
                  <div style={{ color: 'var(--alert-red)', fontSize: '0.8rem', marginBottom: '10px', padding: '8px', background: 'rgba(231,76,60,0.1)', borderRadius: '4px', border: '1px solid var(--alert-red)' }}>
                    âš ï¸ {categoryError}
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
                        <span style={{ fontSize: '2rem' }}>{newCatIcon || 'ðŸ“¦'}</span>
                      )}
                    </div>
                    
                    {/* Icon source selection */}
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginBottom: '4px' }}>àº­àº±àºšà»‚àº«àº¼àº”à»„àº­àº„àº­àº™àºªà»ˆàº§àº™àº•àº»àº§ (Upload Custom Icon)</label>
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
                        ðŸ“¤ à»€àº¥àº·àº­àºàº®àº¹àºšàºžàº²àºš
                      </label>
                      {newCatIcon && (newCatIcon.startsWith('data:image/') || newCatIcon.startsWith('http')) && (
                        <button
                          type="button"
                          className="btn"
                          style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => setNewCatIcon('ðŸ“¦')}
                        >
                          àº¥à»‰àº²àº‡àº®àº¹àºš
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable emoji selection list */}
                  <div>
                    <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>àº«àº¼àº· à»€àº¥àº·àº­àºàºˆàº²àºàº­àºµà»‚àº¡àºˆàº´ (Choose Emoji):</label>
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
                        'ðŸ“¦', 'ðŸ–¼ï¸', 'ðŸ“¿', 'â›“ï¸', 'ðŸ› ï¸', 'ðŸ’Ž', 'ðŸº', 'ðŸ“œ', 'ðŸ”±', 'ðŸŽ’', 'ðŸŽ', 'ðŸ”‘',
                        'ðŸ‘‘', 'ðŸ†', 'ðŸ”®', 'ðŸ›¡ï¸', 'âš”ï¸', 'ðŸªž', 'ðŸª”', 'ðŸ””', 'ðŸ®', 'ðŸ’®', 'âšœï¸', 'ðŸµï¸',
                        'ðŸ’ ', 'â™»ï¸', 'ðŸŽ', 'ðŸ§§', 'âœ‰ï¸', 'ðŸ·ï¸', 'ðŸ›ï¸', 'ðŸ›’', 'ðŸ”—', 'ðŸª›', 'ðŸ”§', 'ðŸ”¨',
                        'ðŸªµ', 'ðŸª¨', 'ðŸ€', 'ðŸŒ¸', 'ðŸ‰', 'ðŸ…', 'ðŸ¦…', 'ðŸ˜', 'ðŸ¦', 'ðŸ', 'ðŸ¢', 'â˜¯ï¸',
                        'ðŸ•‰ï¸', 'â˜¸ï¸', 'ðŸŒŸ', 'âœ¨', 'ðŸ’«', 'ðŸª™', 'ðŸ’µ'
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
                    <label className="form-label">àºŠàº·à»ˆà»àº§àº”à»àº¹à»ˆ</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="àº•àº»àº§àº¢à»ˆàº²àº‡: àºžàº£àº°àºœàº»àº‡, àº‚àº­àº‡àº‚àº§àº±àº™..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>
                  <div style={{ width: '160px' }}>
                    <label className="form-label">àº›àº°à»€àºžàº”à»àº§àº”à»àº¹à»ˆ</label>
                    <select
                      className="form-control"
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                    >
                      <option value="physical">ðŸ“¦ àºªàº´àº™àº„à»‰àº² (àº¡àºµàºªàº°àº•àº±àº­àº)</option>
                      <option value="service">ðŸ› ï¸ àºšà»àº¥àº´àºàº²àº™ (àºšà»à»ˆàº¡àºµàºªàº°àº•àº±àº­àº)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    ðŸ’¾ {editingCategory ? 'àºšàº±àº™àº—àº¶àºàºàº²àº™à»àºà»‰à»„àº‚' : 'àºšàº±àº™àº—àº¶àºà»àº§àº”à»àº¹à»ˆ'}
                  </button>
                </div>
              </form>

              {/* List of Categories */}
              <h4 style={{ color: 'var(--gold-primary)', marginBottom: '10px', fontSize: '0.95rem' }}>ðŸ“‹ àº¥àº²àºàºàº²àº™à»àº§àº”à»àº¹à»ˆàº—àº±àº‡à»àº»àº”</h4>
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
                          <span style={{ fontSize: '1.3rem' }}>{cat.icon || 'ðŸ“¦'}</span>
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
                            {catType === 'service' ? 'ðŸ› ï¸ àºšà»àº¥àº´àºàº²àº™' : 'ðŸ“¦ àºªàº´àº™àº„à»‰àº²'}
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
                          âœï¸ à»àºà»‰à»„àº‚
                        </button>
                        {hasProducts ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            àº¡àºµ {products.filter(p => p.category === cat.id).length} àºªàº´àº™àº„à»‰àº²
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
                              if (confirm(`àº•à»‰àº­àº‡àºàº²àº™àº¥àº¶àºšà»àº§àº”à»àº¹à»ˆ "${cat.name}" à»àº¡à»ˆàº™àºšà»à»ˆ?`)) {
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
                            ðŸ—‘ï¸ àº¥àº¶àºš
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}>àº›àº´àº”</button>
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
              <span className="modal-title">ðŸ”Œ àºªàº°à»àºàº™àºšàº²à»‚àº„à»‰àº”àºªàº´àº™àº„à»‰àº² (Scan Barcode)</span>
              <button
                className="btn-secondary"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowScanHelperModal(false)}
              >
                âœ•
              </button>
            </div>
            
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>ðŸ”Œ</div>
              <p style={{ fontSize: '1rem', color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>
                àºàº°àº¥àº¸àº™àº²àºªàº°à»àºàº™àºšàº²à»‚àº„à»‰àº”àºªàº´àº™àº„à»‰àº²àº‚àº­àº‡àº—à»ˆàº²àº™
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                àº¥àº°àºšàº»àºšàºˆàº°àºàº§àº”àºˆàº±àºšàºàº²àº™àºªàº°à»àºàº™ à»àº¥àº° àº›à»‰àº­àº™àº‚à»à»‰àº¡àº¹àº™à»€àº‚àº»à»‰àº²àºŸàº­àº¡à»‚àº”àºàº­àº±àº”àº•àº°à»‚àº™àº¡àº±àº”.
              </p>
              
              <input
                ref={scanInputRef}
                type="text"
                className="form-control"
                placeholder="àº¥à»àº–à»‰àº²àºàº²àº™àºªàº°à»àºàº™..."
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
                  background: '#1c1915',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '12px',
                  width: '100%',
                  color: 'white'
                }}
              />
              
              <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                * àºªàº²àº¡àº²àº”àº›à»‰àº­àº™àº”à»‰àº§àºàº„àºµàºšàº­àº” à»àº¥à»‰àº§àºàº»àº” Enter à»„àº”à»‰à»€àºŠàº±à»ˆàº™àºàº±àº™
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowScanHelperModal(false)}
              >
                àºàº»àºà»€àº¥àºµàº
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
                àº•àº»àºàº¥àº»àº‡
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
            alert('âœ“ àºšàº±àº™àº—àº¶àºàº®àº¹àºšàºžàº²àºšà»àº•à»ˆàº‡à»àº¥à»‰àº§àº®àº½àºšàº®à»‰àº­àº! (Edited image saved successfully!)');
          }}
        />
      )}

    </div>
  );
}
