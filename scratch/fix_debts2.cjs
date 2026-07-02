// Fix Debts.jsx - write with ACTUAL Lao characters (not escape sequences)
const fs = require('fs');
const path = require('path');

const content = `import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

export default function Debts({ activeUser, onUpdate }) {
  const [debts, setDebts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDebt, setSelectedDebt] = useState(null);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [bankTxRef, setBankTxRef] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const settings = db.getSettings();

  const ensureUnit = (val, defaultUnit = 'mm') => {
    if (!val) return '';
    const trimmed = String(val).trim();
    if (/^[0-9.]+$/.test(trimmed)) return trimmed + defaultUnit;
    return trimmed;
  };

  const handlePrintReceipt = (debt) => {
    const paperWidth = ensureUnit(settings.receiptPaperWidth || '80mm', 'mm');
    const fontSize = ensureUnit(settings.receiptFontSize || '10pt', 'pt');
    const shopLogo = settings.receiptLogoUrl || '';
    const shopName = settings.shopName || '\u0e82\u0ead\u0e9a\u0e9e\u0ea3\u0eb0\u0ea3\u0eb1\u0e97\u0ec0\u0e81\u0e8a';
    const shopSubtitle = settings.shopSubtitle || '';
    const shopAddress = settings.shopAddress || '';
    const shopPhone = settings.shopPhone || '';

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document || printFrame.contentDocument;

    let itemsHtml = '';
    debt.items.forEach(item => {
      itemsHtml += '<tr><td style="padding:4px 0;line-height:1.2;">' + item.name + '</td><td style="text-align:center;padding:4px 0;">' + item.qty + '</td><td style="text-align:right;padding:4px 0;">' + (item.total || (item.price * item.qty)).toLocaleString() + '</td></tr>';
    });

    const statusText = debt.status === 'unpaid' ? '\ud83d\udd34 \u0e8d\u0eb1\u0e87\u0e9a\u0ecd\u0ec8\u0e97\u0eb1\u0e99\u0e8a\u0eb3\u0ea5\u0eb0 (UNPAID)' : '\ud83d\udfe2 \u0e8a\u0eb3\u0ea5\u0eb0\u0ec1\u0ea5\u0ec9\u0ea7 (PAID)';

    doc.write('<html><head><title>\u0ec3\u0e9a\u0e9a\u0eb4\u0e99\u0edc\u0eb5\u0ec9 - ' + debt.id + '</title><style>@page{size:' + paperWidth + ' auto;margin:0}body{margin:0;padding:10px;font-family:Arial,sans-serif;background:white;color:black;font-size:' + fontSize + ';line-height:1.4}.header{text-align:center;margin-bottom:10px}.logo{width:50px;height:50px;border-radius:50%;object-fit:cover;margin-bottom:6px}.title{font-size:calc(' + fontSize + ' + 2pt);font-weight:bold}.subtitle{font-size:calc(' + fontSize + ' - 1.5pt);color:#555}.divider{border-bottom:1px dashed black;margin:8px 0}.details{font-size:calc(' + fontSize + ' - 1.5pt);margin-bottom:8px}.details div{margin-bottom:2px}.totals{display:flex;justify-content:space-between;font-weight:bold;margin-top:4px}.status-badge{text-align:center;font-weight:bold;font-size:calc(' + fontSize + ' - 0.5pt);margin:8px 0;padding:4px;border:1px solid black}</style></head><body onload="window.print();"><div class="header">' + ((settings.receiptShowLogo !== false && shopLogo) ? '<img src="' + shopLogo + '" class="logo" />' : '') + (settings.receiptShowHeader !== false ? '<div class="title">' + shopName + '</div>' : '') + (settings.receiptShowContactInfo !== false ? '<div class="subtitle">' + shopSubtitle + '</div><div class="subtitle">' + shopAddress + ' | \u0ec2\u0e97: ' + shopPhone + '</div>' : '') + '</div><div class="status-badge">' + statusText + '</div><div class="details">' + (settings.receiptShowBillId !== false ? '<div><b>\u0ec0\u0ea5\u0e81\u0e9a\u0eb4\u0e99:</b> ' + debt.id + '</div>' : '') + (settings.receiptShowDate !== false ? '<div><b>\u0ea7\u0eb1\u0e99\u0e97\u0eb5:</b> ' + new Date(debt.date).toLocaleString('lo-LA') + '</div>' : '') + (settings.receiptShowCustomer !== false ? '<div><b>\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2:</b> ' + debt.customerName + '</div><div><b>\u0ec2\u0e97\u0ea5\u0eb0\u0eaa\u0eb1\u0e9a:</b> ' + debt.customerPhone + '</div>' : '') + (debt.notes ? '<div><b>\u0edd\u0eb2\u0e8d\u0ec0\u0eab\u0e94:</b> ' + debt.notes + '</div>' : '') + '</div><div class="divider"></div><table style="width:100%;border-collapse:collapse;font-size:calc(' + fontSize + ' - 1.5pt);"><thead><tr style="border-bottom:1px solid black;text-align:left;"><th style="padding-bottom:4px;">\u0ea5\u0eb2\u0e8d\u0e81\u0eb2\u0e99</th><th style="width:30px;text-align:center;padding-bottom:4px;">\u0e88\u0eb3\u0e99\u0ea7\u0e99</th><th style="width:80px;text-align:right;padding-bottom:4px;">\u0ea5\u0eb2\u0e84\u0eb2</th></tr></thead><tbody>' + itemsHtml + '</tbody></table><div class="divider"></div>' + (settings.receiptShowTotal !== false ? '<div class="totals" style="font-size:calc(' + fontSize + ' + 1pt);"><span>\u0e8d\u0ead\u0e94\u0e8a\u0eb3\u0ea5\u0eb0\u0eaa\u0eb8\u0e94\u0e97\u0eb4:</span><span>' + debt.total.toLocaleString() + ' \u0e81\u0eb5\u0e9a</span></div>' : '') + (settings.receiptShowSignatures !== false ? '<div style="display:flex;justify-content:space-between;font-size:calc(' + fontSize + ' - 2.5pt);margin-top:30px;text-align:center;color:black;"><div style="width:45%;"><div>..................................</div><div style="margin-top:4px;">' + db.getLabel('rcpt_paid_by', '\u0e9c\u0eb9\u0ec9\u0e88\u0ec8\u0eb2\u0e8d\u0ec0\u0e87\u0eb4\u0e99') + '</div></div><div style="width:45%;"><div>..................................</div><div style="margin-top:4px;">' + db.getLabel('rcpt_received_by', '\u0e9c\u0eb9\u0ec9\u0eae\u0eb1\u0e9a\u0ec0\u0e87\u0eb4\u0e99') + '</div></div></div>' : '') + '<div class="divider"></div>' + (settings.receiptShowFooter !== false ? '<div style="text-align:center;font-size:calc(' + fontSize + ' - 2pt);margin-top:10px;">' + (settings.receiptFooterNote || '\u0e82\u0ead\u0e9a\u0ec3\u0e88\u0e97\u0eb5\u0ec8\u0ec3\u0e8a\u0ec9\u0e9a\u0ecd\u0ea5\u0eb4\u0e81\u0eb2\u0e99!') + '</div>' : '') + '</body></html>');
    doc.close();
    printFrame.contentWindow.focus();
    setTimeout(() => { document.body.removeChild(printFrame); }, 1000);
  };

  useEffect(() => {
    setDebts(db.getDebts());
  }, [showCheckout]);

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const handlePayClick = (debt) => {
    setSelectedDebt(debt);
    setCashReceived(debt.total);
    setPaymentMethod('cash');
    setShowCheckout(true);
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'cash') {
      const rcv = Number(cashReceived);
      if (isNaN(rcv) || rcv < selectedDebt.total) {
        alert('\u0e88\u0eb3\u0e99\u0ea7\u0e99\u0ec0\u0e87\u0eb4\u0e99\u0e9a\u0ecd\u0ec8\u0e9e\u0ebd\u0e87\u0e9e\u0ecd!');
        return;
      }
    } else {
      if (!bankTxRef.trim()) {
        alert('\u0e81\u0eb0\u0ea5\u0eb8\u0e99\u0eb2\u0e9b\u0ec9\u0ead\u0e99\u0ec0\u0ea5\u0e81\u0ead\u0ec9\u0eb2\u0e87\u0ead\u0eb4\u0e87 (Reference)!');
        return;
      }
    }
    db.payDebt(selectedDebt.id);
    const paidDebt = { ...selectedDebt, status: 'paid' };
    handlePrintReceipt(paidDebt);
    const orderData = {
      cashierId: activeUser.id,
      cashierName: activeUser.name,
      items: selectedDebt.items,
      subtotal: selectedDebt.total,
      discount: 0,
      total: selectedDebt.total,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? Number(cashReceived) : selectedDebt.total,
      change: paymentMethod === 'cash' ? Math.max(0, Number(cashReceived) - selectedDebt.total) : 0,
      bankTxRef: paymentMethod === 'transfer' ? bankTxRef : '',
      notes: '\u0e8a\u0eb3\u0ea5\u0eb0\u0edc\u0eb5\u0ec9\u0e88\u0eb2\u0e81 ' + selectedDebt.id + ' \u0ec2\u0e94\u0e8d ' + selectedDebt.customerName,
      skipStockReduction: true
    };
    db.addOrder(orderData);
    setShowCheckout(false);
    setSelectedDebt(null);
    setSuccessMsg('\u2705 \u0e8a\u0eb3\u0ea5\u0eb0\u0edc\u0eb5\u0ec9 \u0ec1\u0ea5\u0eb0 \u0e9a\u0eb1\u0e99\u0e97\u0eb6\u0e81\u0eaa\u0eb3\u0ec0\u0ea5\u0eb1\u0e94\u0ec1\u0ea5\u0ec9\u0ea7!');
    setDebts(db.getDebts());
    if (onUpdate) onUpdate();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredDebts = debts.filter(d =>
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customerPhone.includes(searchQuery) ||
    d.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {successMsg && (
        <div style={{ background: 'rgba(39, 174, 96, 0.15)', border: '1px solid var(--success-green)', color: 'var(--success-green)', padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
          {successMsg}
        </div>
      )}

      <div>
        <h2 style={{ color: 'var(--gold-primary)' }}>{db.getLabel('title_debts', '\ud83d\udcd2 \u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0e95\u0eb4\u0e94\u0edc\u0eb5\u0ec9\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2 (Customer Credit Ledger)')}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{'\u0e95\u0eb4\u0e94\u0e95\u0eb2\u0ea1\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2\u0e95\u0eb4\u0e94\u0edc\u0eb5\u0ec9, \u0e8a\u0eb3\u0ea5\u0eb0\u0edc\u0eb5\u0ec9\u0e84\u0ec9\u0eb2\u0e87, \u0e9e\u0eb4\u0ea1\u0ec3\u0e9a\u0e9a\u0eb4\u0e99'}</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          className="form-control"
          placeholder={'\ud83d\udd0d \u0e84\u0ebb\u0ec9\u0e99\u0eab\u0eb2 \u0e8a\u0eb7\u0ec8\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2 / \u0ec0\u0e9a\u0eb5\u0ec2\u0e97 / \u0ec0\u0ea5\u0e81\u0e9a\u0eb4\u0e99...'}
          value={searchQuery}
          onChange={handleSearch}
          style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', color: 'white' }}
        />
      </div>

      {/* Desktop Table */}
      <div className="glass-card desktop-table-view" style={{ padding: '0px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
              <th style={{ padding: '16px' }}>{'\u0ec0\u0ea5\u0e81\u0e9a\u0eb4\u0e99\u0edc\u0eb5\u0ec9'}</th>
              <th style={{ padding: '16px' }}>{'\u0ea7\u0eb1\u0e99\u0e97\u0eb5\u0e84\u0ec9\u0eb2\u0e87\u0e8a\u0eb3\u0ea5\u0eb0'}</th>
              <th style={{ padding: '16px' }}>{'\u0e8a\u0eb7\u0ec8\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2'}</th>
              <th style={{ padding: '16px' }}>{'\u0ec0\u0e9a\u0eb5\u0ec2\u0e97\u0e95\u0eb4\u0e94\u0e95\u0ecd\u0ec8'}</th>
              <th style={{ padding: '16px' }}>{'\u0ea5\u0eb2\u0e8d\u0e81\u0eb2\u0e99\u0eaa\u0eb4\u0e99\u0e84\u0ec9\u0eb2'}</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>{'\u0e8d\u0ead\u0e94\u0e95\u0eb4\u0e94\u0edc\u0eb5\u0ec9'}</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>{'\u0eaa\u0eb0\u0e96\u0eb2\u0e99\u0eb0'}</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>{'\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDebts.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  {'\u0e9a\u0ecd\u0ec8\u0e9e\u0ebb\u0e9a\u0ea5\u0eb2\u0e8d\u0e81\u0eb2\u0e99\u0edc\u0eb5\u0ec9\u0e84\u0ec9\u0eb2\u0e87'}
                </td>
              </tr>
            ) : (
              filteredDebts.map(debt => (
                <tr key={debt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{debt.id}</td>
                  <td style={{ padding: '12px 16px' }}>{new Date(debt.date).toLocaleDateString('lo-LA')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{debt.customerName}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{debt.customerPhone}</td>
                  <td style={{ padding: '12px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {debt.items.map(item => item.name + ' (x' + item.qty + ')').join(', ')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--alert-red)', fontSize: '0.95rem' }}>
                    {debt.total.toLocaleString() + ' \u0e81\u0eb5\u0e9a'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
                      background: debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(39, 174, 96, 0.15)',
                      color: debt.status === 'unpaid' ? 'var(--alert-red)' : 'var(--success-green)',
                      border: '1px solid ' + (debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(39, 174, 96, 0.3)')
                    }}>
                      {debt.status === 'unpaid' ? '\ud83d\udd34 \u0e8d\u0eb1\u0e87\u0e9a\u0ecd\u0ec8\u0e97\u0eb1\u0e99\u0e8a\u0eb3\u0ea5\u0eb0' : '\ud83d\udfe2 \u0e8a\u0eb3\u0ea5\u0eb0\u0ec1\u0ea5\u0ec9\u0ea7'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handlePrintReceipt(debt)}>
                        {'\ud83d\udda8\ufe0f \u0e9e\u0eb4\u0ea1\u0e9a\u0eb4\u0e99'}
                      </button>
                      {debt.status === 'unpaid' ? (
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handlePayClick(debt)}>
                          {'\ud83d\udcb5 \u0e8a\u0eb3\u0ea5\u0eb0\u0edc\u0eb5\u0ec9'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success-green)', fontSize: '0.75rem', alignSelf: 'center' }}>{'\u2705 \u0e8a\u0eb3\u0ea5\u0eb0\u0ec1\u0ea5\u0ec9\u0ea7'}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
        {filteredDebts.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {'\u0e9a\u0ecd\u0ec8\u0e9e\u0ebb\u0e9a\u0ea5\u0eb2\u0e8d\u0e81\u0eb2\u0e99\u0edc\u0eb5\u0ec9\u0e84\u0ec9\u0eb2\u0e87'}
          </div>
        ) : (
          filteredDebts.map(debt => (
            <div key={debt.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid ' + (debt.status === 'unpaid' ? 'var(--alert-red)' : 'var(--success-green)') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '1rem' }}>{debt.id}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(debt.date).toLocaleDateString('lo-LA')}</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{'\ud83d\udc64 ' + debt.customerName + (debt.customerPhone ? ' (' + debt.customerPhone + ')' : '')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <b>{'\u0ea5\u0eb2\u0e8d\u0e81\u0eb2\u0e99:'}</b> {debt.items.map(item => item.name + ' (x' + item.qty + ')').join(', ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{'\u0e8d\u0ead\u0e94\u0e95\u0eb4\u0e94\u0edc\u0eb5\u0ec9:'}</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--alert-red)' }}>{debt.total.toLocaleString() + ' \u0e81\u0eb5\u0e9a'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0 10px', height: '36px' }} onClick={() => handlePrintReceipt(debt)}>{'\ud83d\udda8\ufe0f \u0e9e\u0eb4\u0ea1'}</button>
                  {debt.status === 'unpaid' ? (
                    <button type="button" className="btn btn-primary btn-sm" style={{ padding: '0 12px', height: '36px' }} onClick={() => handlePayClick(debt)}>{'\ud83d\udcb5 \u0e8a\u0eb3\u0ea5\u0eb0'}</button>
                  ) : (
                    <span style={{ color: 'var(--success-green)', fontSize: '0.78rem', alignSelf: 'center', fontWeight: 'bold' }}>{'\u2705 \u0e8a\u0eb3\u0ea5\u0eb0\u0ec1\u0ea5\u0ec9\u0ea7'}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showCheckout && selectedDebt && (
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{'\ud83d\udcb5 \u0e8a\u0eb3\u0ea5\u0eb0\u0edc\u0eb5\u0ec9\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2 (' + selectedDebt.customerName + ')'}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowCheckout(false)}>{'\u2715'}</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#0e0d0b', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>{'\u0ec0\u0ea5\u0e81\u0e9a\u0eb4\u0e99\u0edc\u0eb5\u0ec9: '}<span style={{ color: 'white', fontWeight: 'bold' }}>{selectedDebt.id}</span></p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                  <span>{'\u0e8d\u0ead\u0e94\u0e97\u0eb5\u0ec8\u0e95\u0ec9\u0ead\u0e87\u0e8a\u0eb3\u0ea5\u0eb0:'}</span>
                  <span>{selectedDebt.total.toLocaleString() + ' \u0e81\u0eb5\u0e9a'}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{'\u0ec0\u0ea5\u0eb7\u0ead\u0e81\u0ea7\u0eb4\u0e97\u0eb5\u0e8a\u0eb3\u0ea5\u0eb0'}</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className={'btn ' + (paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary')}
                    style={{ flex: 1 }}
                    onClick={() => setPaymentMethod('cash')}
                  >{'\ud83d\udcb5 \u0ec0\u0e87\u0eb4\u0e99\u0eaa\u0ebb\u0e94 (Cash)'}</button>
                  <button
                    className={'btn ' + (paymentMethod === 'transfer' ? 'btn-primary' : 'btn-secondary')}
                    style={{ flex: 1 }}
                    onClick={() => setPaymentMethod('transfer')}
                  >{'\ud83d\udcf1 \u0ec2\u0ead\u0e99\u0e97\u0eb0\u0e99\u0eb2\u0e84\u0eb2\u0e99 (BCEL One)'}</button>
                </div>
              </div>

              {paymentMethod === 'cash' ? (
                <div className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">{'\u0eae\u0eb1\u0e9a\u0ec0\u0e87\u0eb4\u0e99\u0eaa\u0ebb\u0e94 (\u0e81\u0eb5\u0e9a)'}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}
                    />
                  </div>
                  {Number(cashReceived) >= selectedDebt.total && (
                    <div style={{ background: 'rgba(39, 174, 96, 0.1)', border: '1px solid var(--success-green)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>{'\u0ec0\u0e87\u0eb4\u0e99\u0e97\u0ead\u0e99 (Change)'}</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success-green)' }}>
                        {(Number(cashReceived) - selectedDebt.total).toLocaleString() + ' \u0e81\u0eb5\u0e9a'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="qr-container animate-fade-in">
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {'\u0eaa\u0eb0\u0ec1\u0e81\u0e99 QR \u0e9c\u0ec8\u0eb2\u0e99 BCEL One \u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0ec2\u0ead\u0e99\u0ec0\u0e87\u0eb4\u0e99\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0e9a\u0eb1\u0e99\u0e8a\u0eb5'}
                  </p>
                  <div className="qr-frame">
                    <img src={settings.bankQrTemplate + selectedDebt.total} alt="BCEL One QR" className="qr-img" />
                  </div>
                  <div style={{ fontSize: '0.85rem', width: '100%', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px', background: '#0e0d0b' }}>
                    <p style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{settings.bankName}</p>
                    <p>{'\u0e8a\u0eb7\u0ec8\u0e9a\u0eb1\u0e99\u0e8a\u0eb5: ' + settings.bankAccountName}</p>
                    <p>{'\u0ec0\u0ea5\u0e81\u0e9a\u0eb1\u0e99\u0e8a\u0eb5: '}<span style={{ fontWeight: 'bold', color: 'white' }}>{settings.bankAccountNumber}</span></p>
                  </div>
                  <div className="form-group" style={{ width: '100%', marginTop: '12px' }}>
                    <label className="form-label">{'\u0ec0\u0ea5\u0e81\u0ead\u0ec9\u0eb2\u0e87\u0ead\u0eb5\u0e87 (App Tx Ref / App Ref No.)'}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={'\u0e9b\u0ec9\u0ead\u0e99\u0ec0\u0ea5\u0e81\u0ead\u0ec9\u0eb2\u0e87\u0ead\u0eb4\u0e87...'}
                      value={bankTxRef}
                      onChange={(e) => setBankTxRef(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckout(false)}>{'\u0e8d\u0ebb\u0e81\u0ec0\u0ea5\u0eb5\u0e81'}</button>
              <button className="btn btn-primary" onClick={handleConfirmPayment}>{'\u0ea2\u0eb7\u0e99\u0ea2\u0eb1\u0e99\u0e81\u0eb2\u0e99\u0e8a\u0eb3\u0ea5\u0eb0'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const filePath = path.join(__dirname, '..', 'src', 'components', 'Debts.jsx');
// Write with BOM for better charset detection
const BOM = '\uFEFF';
fs.writeFileSync(filePath, BOM + content, 'utf8');
console.log('Debts.jsx written successfully!');
console.log('File size:', fs.statSync(filePath).size, 'bytes');
// Verify first few chars
const check = fs.readFileSync(filePath, 'utf8');
const line1 = check.split('\n')[0];
console.log('First line:', line1.substring(0, 50));
