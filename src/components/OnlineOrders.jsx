import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

export default function OnlineOrders({ activeUser, isMobile }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterShipping, setFilterShipping] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomSlip, setZoomSlip] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archive'

  // Shipping input states
  const [shippingCompany, setShippingCompany] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingImage, setShippingImage] = useState('');
  const [shippingNote, setShippingNote] = useState('');

  // Chat reply state
  const [chatReply, setChatReply] = useState('');

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('db-updated', handleUpdate);
    return () => window.removeEventListener('db-updated', handleUpdate);
  }, []);

  function loadOrders() {
    setOrders(db.getOnlineOrders());
  }

  useEffect(() => {
    if (selectedOrder) {
      // Refresh selected order if list changes
      const fresh = db.getOnlineOrders().find(o => o.id === selectedOrder.id);
      if (fresh) {
        setSelectedOrder(fresh);
        // Automatically mark customer messages as read if we are looking at this order
        const hasUnread = fresh.messages && fresh.messages.some(m => m.sender === 'customer' && !m.read);
        if (hasUnread) {
          db.markOnlineOrderMessagesAsRead(fresh.id, 'customer');
        }
      }
    }
  }, [orders]);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setShippingCompany(order.shippingCompany || '');
    setTrackingNumber(order.trackingNumber || '');
    setShippingImage(order.shippingImage || '');
    setShippingNote('');
    setChatReply('');
    db.markOnlineOrderMessagesAsRead(order.id, 'customer');
  };

  const handleApprovePayment = () => {
    if (!selectedOrder) return;
    if (window.confirm(`ຢືນຢັນການຊຳລະເງິນສຳລັບອໍເດີ້ ${selectedOrder.id} ແມ່ນບໍ່?`)) {
      db.updateOnlineOrderStatus(selectedOrder.id, 'paid', 'packing', {
        statusNote: 'ເຈົ້າໜ້າທີ່ຢືນຢັນການຊຳລະເງິນ ແລະ ກວດສອບສະລິບສຳເລັດ'
      });
      alert('✓ ຢືນຢັນການຊຳລະເງິນສຳເລັດ!');
      loadOrders();
    }
  };

  const handleRejectPayment = () => {
    if (!selectedOrder) return;
    const reason = prompt('ກະລຸນາລະບຸເຫດຜົນໃນການປະຕິເສດສະລິບ:', 'ສະລິບບໍ່ຖືກຕ້ອງ ຫຼື ຍອດເງິນບໍ່ກົງກັນ');
    if (reason !== null) {
      db.updateOnlineOrderStatus(selectedOrder.id, 'rejected', 'cancelled', {
        statusNote: `ປະຕິເສດການຊຳລະ: ${reason}`
      });
      alert('✓ ປະຕິເສດການຊຳລະເງິນແລ້ວ!');
      loadOrders();
    }
  };

  const handleUpdateShipping = (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    db.updateOnlineOrderStatus(selectedOrder.id, null, null, {
      shippingCompany,
      trackingNumber,
      shippingImage,
      statusNote: shippingNote || 'ອັບເດດຂໍ້ມູນການຈັດສົ່ງພັດສະດຸ'
    });
    alert('✓ อັບເດດຂໍ້ມູນການຈັດສົ່ງສຳເລັດ!');
    setShippingNote('');
    loadOrders();
  };

  const handleChangeShippingStatus = (nextStatus, statusName) => {
    if (!selectedOrder) return;
    if (nextStatus === 'delivered') {
      if (!window.confirm("ຢືນຢັນການຈັດສົ່ງສຳເລັດ? (ອໍເດີ້ນີ້ຈະຍ້າຍໄປເກັບໄວ້ໃນ Archive)")) {
        return;
      }
    }
    db.updateOnlineOrderStatus(selectedOrder.id, null, nextStatus, {
      statusNote: `ປ່ຽນສະຖານະການຈັດສົ່ງເປັນ: ${statusName}`
    });
    alert(`✓ ປ່ຽນສະຖານະການຈັດສົ່ງເປັນ ${statusName} ແລ້ວ!`);
    if (nextStatus === 'delivered') {
      setSelectedOrder(null);
    }
    loadOrders();
  };

  // ---- Admin chat reply ----
  const handleSendAdminReply = () => {
    if (!selectedOrder || !chatReply.trim()) return;
    db.addMessageToOnlineOrder(selectedOrder.id, 'admin', chatReply.trim(), 'ຮ້ານ');
    setChatReply('');
    loadOrders();
  };

  // Filtering logic
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerPhone.includes(searchQuery);
    const isInquiry = o.type === 'inquiry';
    const matchesPayment = isInquiry || filterPayment === 'all' || o.paymentStatus === filterPayment;
    const matchesShipping = isInquiry || filterShipping === 'all' || o.shippingStatus === filterShipping;
    const matchesTab = activeTab === 'active'
      ? o.shippingStatus !== 'delivered'
      : o.shippingStatus === 'delivered';
    return matchesSearch && matchesPayment && matchesShipping && matchesTab;
  });

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'unpaid': return '🛑 ລໍຖ້າຊຳລະ';
      case 'pending_verification': return '⏳ ລໍຖ້າກວດສອບສະລິບ';
      case 'paid': return '✅ ຊຳລະແລ້ວ';
      case 'rejected': return '❌ ສະລິບຖືກປະຕิເສດ';
      case 'inquiry': return '💬 ສອບຖາມຂໍ້ມູນ';
      default: return status;
    }
  };

  const getShippingStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ ລໍຖ້າດຳເນີນການ';
      case 'packing': return '📦 ກຳລັງແພັກພັດສະດຸ';
      case 'ready_to_ship': return '🚚 ພ້ອມສົ່ງ';
      case 'shipped': return '✈️ ສົ່ງແລ້ວ';
      case 'delivered': return '🎁 ສຳເລັດແລ້ວ';
      case 'cancelled': return '❌ ຍົກເລີກ';
      case 'inquiry': return '📋 ບໍ່ມີອໍເດີ້';
      default: return status;
    }
  };

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* LEFT PANEL: Orders List */}
      {(!isMobile || !selectedOrder) && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
        <div>
          <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 4px', fontSize: isMobile ? '1.2rem' : '1.35rem' }}>🛒 ອໍເດີ້ອອນລາຍ (Online Orders)</h3>
          {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>ຈັດການອໍເດີ້ ແລະ ກວດສອບສະລິບລູກຄ້າ</p>}
        </div>

        {/* Tab switcher active/archive */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('active'); setSelectedOrder(null); }}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              background: activeTab === 'active' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'active' ? '#000' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              transition: 'all 0.2s'
            }}
          >
            📥 ປະຈຸບັນ ({orders.filter(o => o.shippingStatus !== 'delivered').length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('archive'); setSelectedOrder(null); }}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              background: activeTab === 'archive' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'archive' ? '#000' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              transition: 'all 0.2s'
            }}
          >
            🗄️ Archive ({orders.filter(o => o.shippingStatus === 'delivered').length})
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 ຄົ້ນຫາເລກອໍເດີ້, ຊື່, ເບີໂທ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select className="form-control" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} style={{ fontSize: '0.75rem' }}>
              <option value="all">💳 ຊຳລະ (ທັງໝົດ)</option>
              <option value="unpaid">🛑 ລໍຖ້າຊຳລະ</option>
              <option value="pending_verification">⏳ ລໍຖ້າກວດສອບ</option>
              <option value="paid">✅ ຊຳລະແລ້ວ</option>
              <option value="rejected">❌ ປະຕິເສດ</option>
            </select>
            <select className="form-control" value={filterShipping} onChange={(e) => setFilterShipping(e.target.value)} style={{ fontSize: '0.75rem' }}>
              <option value="all">🚚 ຂົນສົ່ງ (ທັງໝົດ)</option>
              <option value="pending">ລໍຖ້າເຮັດ</option>
              <option value="packing">ກຳລັງແພັກ</option>
              <option value="ready_to_ship">ພ້ອມສົ່ງ</option>
              <option value="shipped">ສົ່ງແລ້ວ</option>
              <option value="delivered">ສຳເລັດ</option>
              <option value="cancelled">ຍົກເລີກ</option>
            </select>
          </div>
        </div>

        {/* List of Orders */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '0.85rem' }}>ບໍ່ພົບລາຍການອໍເດີ້</div>
          ) : (
            filteredOrders.map(o => {
              const unreadCount = o.messages ? o.messages.filter(m => m.sender === 'customer' && m.read === false).length : 0;
              return (
                <div
                  key={o.id}
                  onClick={() => handleSelectOrder(o)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: selectedOrder?.id === o.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                    border: selectedOrder?.id === o.id ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>{o.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {unreadCount > 0 && (
                        <span style={{
                          fontSize: '0.6rem',
                          background: '#e74c3c',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontWeight: 'bold'
                        }}>
                          💬 {unreadCount}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(o.date).toLocaleDateString('lo-LA')}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>👤 {o.customerName} ({o.customerPhone})</div>
                  {o.type === 'inquiry' ? (
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#3498db' }}>💬 ສອບຖາມຂໍ້ມູນທົ່ວໄປ</div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>💰 {o.total.toLocaleString()} LAK</div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: o.paymentStatus === 'paid' ? 'rgba(46,204,113,0.15)' : o.paymentStatus === 'pending_verification' ? 'rgba(241,196,15,0.15)' : 'rgba(231,76,60,0.15)',
                      color: o.paymentStatus === 'paid' ? '#2ecc71' : o.paymentStatus === 'pending_verification' ? '#f1c40f' : '#e74c3c'
                    }}>
                      {getPaymentStatusText(o.paymentStatus)}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: o.shippingStatus === 'delivered' ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.08)',
                      color: o.shippingStatus === 'delivered' ? '#2ecc71' : 'var(--text-secondary)'
                    }}>
                      {getShippingStatusText(o.shippingStatus)}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: (o.shippingMethod === 'pickup' || (o.shippingAddress && o.shippingAddress.province && o.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'))) ? 'rgba(52,152,219,0.15)' : 'rgba(155,89,182,0.15)',
                      color: (o.shippingMethod === 'pickup' || (o.shippingAddress && o.shippingAddress.province && o.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'))) ? '#3498db' : '#9b59b6'
                    }}>
                      {(o.shippingMethod === 'pickup' || (o.shippingAddress && o.shippingAddress.province && o.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'))) ? '🏪 ຮັບຢູ່ໜ້າຮ້ານ' : '🚚 ຈັດສົ່ງ'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* RIGHT PANEL: Order Details View */}
      {(!isMobile || selectedOrder) && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
          {isMobile && selectedOrder && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedOrder(null)}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '16px' }}
            >
              ⬅️ ກັບຄືນ (Back to List)
            </button>
          )}
        {selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ເລກທີອໍເດີ້:</span>
                <h2 style={{ color: 'var(--gold-primary)', margin: 0 }}>{selectedOrder.id}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  📅 ສ້າງເມື່ອ: {new Date(selectedOrder.date).toLocaleString('lo-LA')}
                </div>
              </div>

              {/* Status control buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ການຊຳລະ:</span>
                  <span style={{
                    fontWeight: 'bold',
                    color: selectedOrder.paymentStatus === 'paid' ? '#2ecc71' : selectedOrder.paymentStatus === 'pending_verification' ? '#f1c40f' : '#e74c3c'
                  }}>
                    {getPaymentStatusText(selectedOrder.paymentStatus)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ສະຖານະຂົນສົ່ງ:</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{getShippingStatusText(selectedOrder.shippingStatus)}</span>
                </div>
              </div>
            </div>

            {/* Layout divided into details and slip section */}
            {selectedOrder.type === 'inquiry' ? (
              /* Full-width Inquiry Chat view */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(52,152,219,0.04)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 ການສອບຖາມຈາກລູກຄ້າ: {selectedOrder.customerName} ({selectedOrder.customerPhone})
                  </h4>
                  
                  {/* Message history */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', maxHeight: '450px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    {(!selectedOrder.messages || selectedOrder.messages.length === 0) ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '80px' }}>
                        📭 ຍັງບໍ່ມີຂໍ້ຄວາມ
                      </div>
                    ) : (
                      selectedOrder.messages.map((msg, idx) => (
                        <div key={idx} style={{
                          alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                          background: msg.sender === 'admin' ? 'rgba(212,175,55,0.12)' : 'rgba(52,152,219,0.12)',
                          border: `1px solid ${msg.sender === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(52,152,219,0.3)'}`,
                          borderRadius: '10px',
                          padding: '8px 12px',
                          maxWidth: '85%'
                        }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                            {msg.sender === 'admin' ? '🏪 ຮ້ານ' : `👤 ${msg.senderName || 'ລູກຄ້າ'}`}
                            {' · '}{new Date(msg.timestamp).toLocaleString('lo-LA')}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'white', wordBreak: 'break-word' }}>{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Admin reply input */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ຕອບກັບລູກຄ້າ... (Enter ເພື່ອສົ່ງ)"
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendAdminReply(); }}
                      style={{ flex: 1, fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendAdminReply}
                      disabled={!chatReply.trim()}
                      style={{ padding: '6px 20px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      📤 ສົ່ງ
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
              {/* Left detail column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Items ordered list */}
                <div>
                  <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>📦 ລາຍການສິນຄ້າໃນອໍເດີ້:</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 4px' }}>ສິນຄ້າ</th>
                        <th style={{ textAlign: 'right', padding: '8px 4px' }}>ລາຄາ</th>
                        <th style={{ textAlign: 'center', padding: '8px 4px' }}>ຈຳນວນ</th>
                        <th style={{ textAlign: 'right', padding: '8px 4px' }}>ລວມ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{item.name}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right' }}>{item.price.toLocaleString()} LAK</td>
                          <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.qty}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{item.total.toLocaleString()} LAK</td>
                        </tr>
                      ))}
                      <tr style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ padding: '12px 4px', textAlign: 'right', color: 'var(--text-secondary)' }}>ຍອດລວມທັງໝົດ:</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', color: 'var(--gold-primary)' }}>{selectedOrder.total.toLocaleString()} LAK</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Customer delivery address */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {(() => {
                    const isPickup = selectedOrder.shippingMethod === 'pickup' || (selectedOrder.shippingAddress && selectedOrder.shippingAddress.province && selectedOrder.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'));
                    return (
                      <>
                        <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>
                          {isPickup ? '🏪 ຂໍ້ມູນການຮັບເຄື່ອງຢູ່ໜ້າຮ້ານ:' : '🚚 ຂໍ້ມູນການຈັດສົ່ງພັດສະດຸ:'}
                        </h4>
                        {selectedOrder.shippingAddress ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                            <div><b>ຊື່ຜູ້ຮັບ/ມາຮັບ:</b> {selectedOrder.shippingAddress.recipientName}</div>
                            <div><b>ເບີໂທຕິດຕໍ່:</b> {selectedOrder.shippingAddress.phone}</div>
                            {isPickup ? (
                              <div><b>ວັນທີ/ເວລາ ທີ່ຈະມາຮັບ:</b> <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{selectedOrder.shippingAddress.addressLine || 'N/A'}</span></div>
                            ) : (
                              <>
                                <div><b>ທີ່ຢູ່:</b> ບ້ານ {selectedOrder.shippingAddress.village || 'N/A'}, ເມືອງ {selectedOrder.shippingAddress.city || 'N/A'}, ແຂວງ {selectedOrder.shippingAddress.province || 'N/A'} ({selectedOrder.shippingAddress.country || 'N/A'})</div>
                                {selectedOrder.shippingAddress.addressLine && <div><b>ລາຍລະອຽດເພີ່ມເຕີມ:</b> {selectedOrder.shippingAddress.addressLine}</div>}
                              </>
                            )}
                            {selectedOrder.shippingAddress.notes && <div style={{ color: 'var(--accent-amber)', marginTop: '4px' }}><b>📝 ໝາຍເຫດຈາກລູກຄ້າ:</b> {selectedOrder.shippingAddress.notes}</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ບໍ່ມີຂໍ້ມູນການຈັດສົ່ງ</div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 3. Shipping info editing form */}
                <form onSubmit={handleUpdateShipping} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 4px' }}>📦 ຈັດການຂໍ້ມູນການຈັດສົ່ງ:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>ບໍລິສັດຂົນສົ່ງ (Carrier)</label>
                      <input type="text" className="form-control" placeholder="Anousith, HAL,..." value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>ເລກພັດສະດຸ (Tracking Number)</label>
                      <input type="text" className="form-control" placeholder="ANXXXXXXXX" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>ຮູບພາບໃບຝາກສົ່ງ / ກ່ອງພັດສະດຸ</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setShippingImage(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {shippingImage && (
                      <div style={{ marginTop: '6px' }}>
                        <img src={shippingImage} alt="Shipping Label Preview" style={{ maxHeight: '80px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>ໝາຍເຫດ / ຂໍ້ຄວາມອັບເດດສະຖານະ</label>
                    <input type="text" className="form-control" placeholder="ກຳລັງດຳເນີນການຈັດສົ່ງ,..." value={shippingNote} onChange={(e) => setShippingNote(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', alignSelf: 'flex-end' }}>💾 ບັນທຶກຂໍ້ມູນການສົ່ງ</button>
                </form>

                {/* 4. Timeline status log */}
                <div>
                  <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>🕒 ປະຫວັດຄວາມເຄື່ອນໄຫວ (Timeline Log):</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--border-color)', paddingLeft: '14px', marginLeft: '6px' }}>
                    {selectedOrder.timeline?.map((evt, idx) => (
                      <div key={idx} style={{ position: 'relative', fontSize: '0.8rem', paddingBottom: '4px' }}>
                        <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-primary)' }} />
                        <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{evt.status}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(evt.date).toLocaleString('lo-LA')}</div>
                        <div style={{ color: 'white', marginTop: '2px' }}>{evt.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Customer Chat Panel */}
                <div style={{ background: 'rgba(52,152,219,0.04)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 ຂໍ້ຄວາມຈາກລູກຄ້າ:
                    {selectedOrder.messages && selectedOrder.messages.filter(m => m.sender === 'customer' && m.read === false).length > 0 && (
                      <span style={{ fontSize: '0.7rem', background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {selectedOrder.messages.filter(m => m.sender === 'customer' && m.read === false).length} ໃໝ່
                      </span>
                    )}
                  </h4>

                  {/* Message history */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', padding: '4px 0' }}>
                    {(!selectedOrder.messages || selectedOrder.messages.length === 0) ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '20px 0' }}>
                        📭 ຍັງບໍ່ມີຂໍ້ຄວາມ
                      </div>
                    ) : (
                      selectedOrder.messages.map((msg, idx) => (
                        <div key={idx} style={{
                          alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                          background: msg.sender === 'admin' ? 'rgba(212,175,55,0.12)' : 'rgba(52,152,219,0.12)',
                          border: `1px solid ${msg.sender === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(52,152,219,0.3)'}`,
                          borderRadius: '10px',
                          padding: '8px 12px',
                          maxWidth: '85%'
                        }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                            {msg.sender === 'admin' ? '🏪 ຮ້ານ' : `👤 ${msg.senderName || 'ລູກຄ້າ'}`}
                            {' · '}{new Date(msg.timestamp).toLocaleString('lo-LA')}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'white', wordBreak: 'break-word' }}>{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Admin reply input */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ຕອບກັບລູກຄ້າ... (Enter ເພື່ອສົ່ງ)"
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendAdminReply(); }}
                      style={{ flex: 1, fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendAdminReply}
                      disabled={!chatReply.trim()}
                      style={{ padding: '6px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      📤 ສົ່ງ
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column: Slip review and actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📱 ສະລິບການໂອນເງິນ:</h4>

                {selectedOrder.slipImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div
                      onClick={() => setZoomSlip(true)}
                      style={{
                        width: '100%',
                        height: '350px',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'zoom-in',
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img src={selectedOrder.slipImage} alt="Payment Slip" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', display: 'block' }}>💡 ຄລິກທີ່ຮູບເພື່ອຊູມ/ຂະຫຍາຍ</span>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '240px',
                    border: '1.5px dashed var(--border-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    🛑 ຍັງບໍ່ມີການອັບໂຫຼດສະລິບຊຳລະເງິນ
                  </div>
                )}

                {/* Actions based on payment Status */}
                {selectedOrder.paymentStatus === 'pending_verification' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <button className="btn btn-primary" onClick={handleApprovePayment} style={{ width: '100%', fontWeight: 'bold' }}>
                      ✅ ຢືນຢັນຍອດເງິນ / Approve
                    </button>
                    <button className="btn" onClick={handleRejectPayment} style={{ width: '100%', background: 'var(--alert-red)', color: 'white', borderColor: 'var(--alert-red)', fontWeight: 'bold' }}>
                      ❌ ປະຕິເສດສະລິບ / Reject
                    </button>
                  </div>
                )}

                {/* Status adjustment buttons */}
                {selectedOrder.paymentStatus === 'paid' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>⚙️ ປ່ຽນສະຖານະການຈັດສົ່ງ:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleChangeShippingStatus('packing', 'ກຳລັງແພັກພັດສະດຸ')}>📦 ແພັກພັດສະດຸ</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleChangeShippingStatus('ready_to_ship', 'ພ້ອມຈັດສົ່ງ')}>🚚 ພ້ອມຈັດສົ່ງ</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleChangeShippingStatus('shipped', 'ຈັດສົ່ງອອກແລ້ວ')}>✈️ ຈັດສົ່ງແລ້ວ</button>
                      <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px', background: '#2ecc71', borderColor: '#2ecc71' }} onClick={() => handleChangeShippingStatus('delivered', 'ສົ່ງມອບສຳເລັດ')}>🎁 ສຳເລັດແລ້ວ</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '4rem' }}>🛒</span>
            <h3>ກະລຸນາເລືອກອໍເດີ້ຈາກລາຍການດ້ານຊ້າຍ</h3>
            <p style={{ fontSize: '0.85rem' }}>ເລືອກອໍເດີ້ເພື່ອເບິ່ງລາຍການສິນຄ້າ, ກວດສອບສະລິບໂອນເງິນ ແລະ ອັບເດດຂໍ້ມູນຂົນສົ່ງ</p>
          </div>
        )}
      </div>
      )}

      {/* ZOOM SLIP MODAL OVERLAY */}
      {zoomSlip && selectedOrder?.slipImage && (
        <Portal>
        <div
          className="modal-overlay"
          onClick={() => setZoomSlip(false)}
          style={{ zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setZoomSlip(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <img
              src={selectedOrder.slipImage}
              alt="Payment Slip Zoomed"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
            />
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <a
                href={selectedOrder.slipImage}
                download={`slip-${selectedOrder.id}.png`}
                onClick={(e) => e.stopPropagation()}
                className="btn btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none', padding: '8px 20px', fontSize: '0.85rem' }}
              >
                📥 ດາວໂຫຼດສະລິບ (Download Slip)
              </a>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
