import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

export default function Debts({ activeUser, onUpdate, isMobile }) {
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
    const shopName = settings.shopName || 'ຂອບພຣະຣັທເກຊ';
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

    const statusText = debt.status === 'unpaid' ? '🔴 ຍັງບໍ່ທັນຊຳລະ (UNPAID)' : '🟢 ຊຳລະແລ້ວ (PAID)';

    doc.write('<html><head><title>ໃບບິນໜີ້ - ' + debt.id + '</title><style>@page{size:' + paperWidth + ' auto;margin:0}body{margin:0;padding:10px;font-family:Arial,sans-serif;background:white;color:black;font-size:' + fontSize + ';line-height:1.4}.header{text-align:center;margin-bottom:10px}.logo{width:50px;height:50px;border-radius:50%;object-fit:cover;margin-bottom:6px}.title{font-size:calc(' + fontSize + ' + 2pt);font-weight:bold}.subtitle{font-size:calc(' + fontSize + ' - 1.5pt);color:#555}.divider{border-bottom:1px dashed black;margin:8px 0}.details{font-size:calc(' + fontSize + ' - 1.5pt);margin-bottom:8px}.details div{margin-bottom:2px}.totals{display:flex;justify-content:space-between;font-weight:bold;margin-top:4px}.status-badge{text-align:center;font-weight:bold;font-size:calc(' + fontSize + ' - 0.5pt);margin:8px 0;padding:4px;border:1px solid black}</style></head><body onload="window.print();"><div class="header">' + ((settings.receiptShowLogo !== false && shopLogo) ? '<img src="' + shopLogo + '" class="logo" />' : '') + (settings.receiptShowHeader !== false ? '<div class="title">' + shopName + '</div>' : '') + (settings.receiptShowContactInfo !== false ? '<div class="subtitle">' + shopSubtitle + '</div><div class="subtitle">' + shopAddress + ' | ໂທ: ' + shopPhone + '</div>' : '') + '</div><div class="status-badge">' + statusText + '</div><div class="details">' + (settings.receiptShowBillId !== false ? '<div><b>ເລກບິນ:</b> ' + debt.id + '</div>' : '') + (settings.receiptShowDate !== false ? '<div><b>ວັນທີ:</b> ' + new Date(debt.date).toLocaleString('lo-LA') + '</div>' : '') + (settings.receiptShowCustomer !== false ? '<div><b>ລູກຄ້າ:</b> ' + debt.customerName + '</div><div><b>ໂທລະສັບ:</b> ' + debt.customerPhone + '</div>' : '') + (debt.notes ? '<div><b>ໝາຍເຫດ:</b> ' + debt.notes + '</div>' : '') + '</div><div class="divider"></div><table style="width:100%;border-collapse:collapse;font-size:calc(' + fontSize + ' - 1.5pt);"><thead><tr style="border-bottom:1px solid black;text-align:left;"><th style="padding-bottom:4px;">ລາຍການ</th><th style="width:30px;text-align:center;padding-bottom:4px;">ຈຳນວນ</th><th style="width:80px;text-align:right;padding-bottom:4px;">ລາຄາ</th></tr></thead><tbody>' + itemsHtml + '</tbody></table><div class="divider"></div>' + (settings.receiptShowTotal !== false ? '<div class="totals" style="font-size:calc(' + fontSize + ' + 1pt);"><span>ຍອດຊຳລະສຸດທິ:</span><span>' + debt.total.toLocaleString() + ' ກີບ</span></div>' : '') + (settings.receiptShowSignatures !== false ? '<div style="display:flex;justify-content:space-between;font-size:calc(' + fontSize + ' - 2.5pt);margin-top:30px;text-align:center;color:black;"><div style="width:45%;"><div>..................................</div><div style="margin-top:4px;">' + db.getLabel('rcpt_paid_by', 'ຜູ້ຈ່າຍເງິນ') + '</div></div><div style="width:45%;"><div>..................................</div><div style="margin-top:4px;">' + db.getLabel('rcpt_received_by', 'ຜູ້ຮັບເງິນ') + '</div></div></div>' : '') + '<div class="divider"></div>' + (settings.receiptShowFooter !== false ? '<div style="text-align:center;font-size:calc(' + fontSize + ' - 2pt);margin-top:10px;">' + (settings.receiptFooterNote || 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ!') + '</div>' : '') + '</body></html>');
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
        alert('ຈຳນວນເງິນບໍ່ພຽງພໍ!');
        return;
      }
    } else {
      if (!bankTxRef.trim()) {
        alert('ກະລຸນາປ້ອນເລກອ້າງອິງ (Reference)!');
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
      notes: 'ຊຳລະໜີ້ຈາກ ' + selectedDebt.id + ' ໂດຍ ' + selectedDebt.customerName,
      skipStockReduction: true
    };
    db.addOrder(orderData);
    setShowCheckout(false);
    setSelectedDebt(null);
    setSuccessMsg('✅ ຊຳລະໜີ້ ແລະ ບັນທຶກສຳເລັດແລ້ວ!');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Fade-in Animation Content Wrapper */}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {successMsg && (
          <div style={{ background: 'rgba(39, 174, 96, 0.15)', border: '1px solid var(--success-green)', color: 'var(--success-green)', padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        <div>
          <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.25rem' : '1.5rem', margin: 0 }}>
            {db.getLabel('title_debts', '📒 ບັນຊີຕິດໜີ້ລູກຄ້າ (Customer Credit Ledger)')}
          </h2>
          {!isMobile && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>{'ຕິດຕາມລູກຄ້າຕິດໜີ້, ຊຳລະໜີ້ຄ້າງ, ພິມໃບບິນ'}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            placeholder={'🔍 ຄົ້ນຫາ ຊື່ລູກຄ້າ / ເບີໂທ / ເລກບິນ...'}
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
                <th style={{ padding: '16px' }}>{'ເລກບິນໜີ້'}</th>
                <th style={{ padding: '16px' }}>{'ວັນທີຄ້າງຊຳລະ'}</th>
                <th style={{ padding: '16px' }}>{'ຊື່ລູກຄ້າ'}</th>
                <th style={{ padding: '16px' }}>{'ເບີໂທຕິດຕໍ່'}</th>
                <th style={{ padding: '16px' }}>{'ລາຍການສິນຄ້າ'}</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>{'ຍອດຕິດໜີ້'}</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>{'ສະຖານະ'}</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>{'ຈັດການ'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    {'ບໍ່ພົບລາຍການໜີ້ຄ້າງ'}
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
                      {debt.total.toLocaleString() + ' ກີບ'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
                        background: debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(39, 174, 96, 0.15)',
                        color: debt.status === 'unpaid' ? 'var(--alert-red)' : 'var(--success-green)',
                        border: '1px solid ' + (debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(39, 174, 96, 0.3)')
                      }}>
                        {debt.status === 'unpaid' ? '🔴 ຍັງບໍ່ທັນຊຳລະ' : '🟢 ຊຳລະແລ້ວ'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handlePrintReceipt(debt)}>
                          {'🖨️ ພິມບິນ'}
                        </button>
                        {debt.status === 'unpaid' ? (
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handlePayClick(debt)}>
                            {'💵 ຊຳລະໜີ້'}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--success-green)', fontSize: '0.75rem', alignSelf: 'center' }}>{'✅ ຊຳລະແລ້ວ'}</span>
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
              {'ບໍ່ພົບລາຍການໜີ້ຄ້າງ'}
            </div>
          ) : (
            filteredDebts.map(debt => (
              <div key={debt.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '4px solid ' + (debt.status === 'unpaid' ? 'var(--alert-red)' : 'var(--success-green)') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '1rem' }}>{debt.id}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(debt.date).toLocaleDateString('lo-LA')}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{'👤 ' + debt.customerName + (debt.customerPhone ? ' (' + debt.customerPhone + ')' : '')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  <b>{'ລາຍການ:'}</b> {debt.items.map(item => item.name + ' (x' + item.qty + ')').join(', ')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{'ຍອດຕິດໜີ້:'}</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--alert-red)' }}>{debt.total.toLocaleString() + ' ກີບ'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0 10px', height: '36px' }} onClick={() => handlePrintReceipt(debt)}>{'🖨️ ພິມ'}</button>
                    {debt.status === 'unpaid' ? (
                      <button type="button" className="btn btn-primary btn-sm" style={{ padding: '0 12px', height: '36px' }} onClick={() => handlePayClick(debt)}>{'💵 ຊຳລະ'}</button>
                    ) : (
                      <span style={{ color: 'var(--success-green)', fontSize: '0.78rem', alignSelf: 'center', fontWeight: 'bold' }}>{'✅ ຊຳລະແລ້ວ'}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Payment Modal - Placed OUTSIDE the animate-fade-in transform boundary */}
      {showCheckout && selectedDebt && (
        <Portal>
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)', zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '1100px',
            width: '98%',
            padding: 0,
            borderRadius: '20px',
            border: '1px solid rgba(212,175,55,0.25)',
            background: 'linear-gradient(145deg, #1a1614 0%, #0f0d0b 100%)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.08)',
            overflow: 'hidden'
          }}>
            
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
              borderBottom: '1px solid rgba(212,175,55,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1.5px solid rgba(212,175,55,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>💵</div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #d4af37, #f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {db.getLabel('chk_title', 'ຂັ້ນຕອນການຊຳລະເງິນ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {'ລູກຄ້າ: ' + selectedDebt.customerName} {selectedDebt.customerPhone ? ` • 📞 ${selectedDebt.customerPhone}` : ''}
                  </div>
                </div>
              </div>
              <button
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', cursor: 'pointer', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onClick={() => setShowCheckout(false)}
              >✕</button>
            </div>

            {/* Two Column Grid */}
            <div className="checkout-grid" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* LEFT COLUMN: Summary & QR Scanner */}
              <div className="checkout-left-col">
                <div style={{
                  background: 'linear-gradient(145deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(212,175,55,0.3)',
                  padding: '16px 20px',
                  boxShadow: '0 4px 20px rgba(212,175,55,0.08)'
                }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{'ເລກບິນໜີ້: ' + selectedDebt.id}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(212,175,55,0.7)', fontWeight: 'bold' }}>{'ຍອດຄ້າງຊຳລະ'}</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(135deg, #d4af37, #f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                      {selectedDebt.total.toLocaleString() + ' ກີບ'}
                    </span>
                  </div>
                </div>

                {paymentMethod === 'transfer' && (
                  <div className="qr-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      {'ສະແກນ QR ຜ່ານ BCEL One ເພື່ອໂອນເງິນ'}
                    </p>
                    <div className="qr-frame" style={{ width: '160px', height: '160px', padding: '8px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.6)' }}>
                      <img src={settings.bankQrTemplate + selectedDebt.total} alt="BCEL One QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Payment Method & Inputs */}
              <div className="checkout-right-col">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.85rem' }}>{'ເລືອກວິທີຊຳລະ (Select Payment Method)'}</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className={'btn ' + (paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary')}
                      style={{ flex: 1, height: '44px', fontSize: '0.88rem', fontWeight: 'bold' }}
                      onClick={() => setPaymentMethod('cash')}
                    >{'💵 ເງິນສົດ (Cash)'}</button>
                    <button
                      type="button"
                      className={'btn ' + (paymentMethod === 'transfer' ? 'btn-primary' : 'btn-secondary')}
                      style={{ flex: 1, height: '44px', fontSize: '0.88rem', fontWeight: 'bold' }}
                      onClick={() => setPaymentMethod('transfer')}
                    >{'📱 ໂອນ (BCEL One)'}</button>
                  </div>
                </div>

                {paymentMethod === 'cash' ? (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{'ຮັບເງິນສົດ (ກີບ)'}</label>
                      <input
                        type="number"
                        className="form-control"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        style={{ fontSize: '1.5rem', height: '52px', fontWeight: 'bold', color: 'var(--gold-primary)', background: '#0e0d0b', border: '1px solid rgba(255,255,255,0.12)' }}
                        placeholder="ປ້ອນຈຳນວນເງິນສົດ..."
                      />
                    </div>
                    {Number(cashReceived) >= selectedDebt.total && (
                      <div style={{ background: 'rgba(39, 174, 96, 0.08)', border: '1px solid var(--success-green)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--success-green)', fontWeight: 'bold', fontSize: '0.88rem' }}>{'ເງິນທອນ (Change)'}</span>
                        <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--success-green)' }}>
                          {(Number(cashReceived) - selectedDebt.total).toLocaleString() + ' ກີບ'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '0.82rem', width: '100%', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px', borderRadius: '12px', background: '#0e0d0b' }}>
                      <p style={{ color: 'var(--gold-primary)', fontWeight: 'bold', margin: '0 0 6px 0', fontSize: '0.88rem' }}>{settings.bankName}</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{'ຊື່ບັນຊີ: ' + settings.bankAccountName}</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{'ເລກບັນຊີ: '}<span style={{ fontWeight: 'bold', color: 'white' }}>{settings.bankAccountNumber}</span></p>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{'ເລກອ້າງອີງ (App Tx Ref / App Ref No.)'}</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={'ປ້ອນເລກອ້າງອິງ...'}
                        value={bankTxRef}
                        onChange={(e) => setBankTxRef(e.target.value)}
                        style={{ height: '44px', background: '#0e0d0b', border: '1px solid rgba(255,255,255,0.12)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer" style={{
              padding: '18px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: '#12100e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button className="btn btn-secondary" style={{ height: '42px', padding: '0 24px', fontSize: '0.88rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowCheckout(false)}>✕ ຍົກເລີກ</button>
              <button className="btn btn-primary" style={{ height: '42px', padding: '0 28px', fontSize: '0.88rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleConfirmPayment}>💾 ຢືນຢັນການຊຳລະ</button>
            </div>

          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
