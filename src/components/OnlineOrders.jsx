import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

export default function OnlineOrders({ isMobile }) {
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
  const [adminAttachments, setAdminAttachments] = useState([]);

  const prevUnreadCountRef = useRef(null);

  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      if (type === 'beep') {
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('db-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const handleSelectChat = (e) => {
      const { orderId } = e.detail;
      const freshOrders = db.getOnlineOrders();
      const order = freshOrders.find(o => o.id === orderId);
      if (order) {
        handleSelectOrder(order);
      }
    };
    window.addEventListener('select-online-chat', handleSelectChat);

    return () => {
      window.removeEventListener('db-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('select-online-chat', handleSelectChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadOrders() {
    const freshOrders = db.getOnlineOrders();
    setOrders(freshOrders);

    // Count unread customer messages
    const currentUnread = freshOrders.reduce((sum, o) => {
      if (o.messages) {
        return sum + o.messages.filter(m => m.sender === 'customer' && !m.read).length;
      }
      return sum;
    }, 0);

    if (prevUnreadCountRef.current !== null && currentUnread > prevUnreadCountRef.current) {
      playSound('beep');
    }
    prevUnreadCountRef.current = currentUnread;
  }

  useEffect(() => {
    if (selectedOrder) {
      // Refresh selected order if list changes
      const fresh = db.getOnlineOrders().find(o => o.id === selectedOrder.id);
      if (fresh) {
        queueMicrotask(() => setSelectedOrder(fresh));
        // Automatically mark customer messages as read if we are looking at this order
        const hasUnread = fresh.messages && fresh.messages.some(m => m.sender === 'customer' && !m.read);
        if (hasUnread) {
          db.markOnlineOrderMessagesAsRead(fresh.id, 'customer');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    alert('✓ ອັບເດດຂໍ້ມູນການຈັດສົ່ງສຳເລັດ!');
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
    if (!selectedOrder || (!chatReply.trim() && adminAttachments.length === 0)) return;
    db.addMessageToOnlineOrder(selectedOrder.id, 'admin', chatReply.trim(), 'ຮ້ານ', adminAttachments);
    setChatReply('');
    setAdminAttachments([]);
    loadOrders();
  };

  const handleAdminFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file';
        setAdminAttachments(prev => [...prev, { type, name: file.name, data: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Filtering logic — INQ records only appear in Chat tab, not Orders/Archive
  const filteredOrders = orders.filter(o => {
    if (o.type === 'inquiry') return false;
    const matchesSearch = (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.customerPhone || '').includes(searchQuery);
    const matchesPayment = filterPayment === 'all' || o.paymentStatus === filterPayment;
    const matchesShipping = filterShipping === 'all' || o.shippingStatus === filterShipping;
    const isArchived = o.shippingStatus === 'delivered' || o.shippingStatus === 'cancelled' || o.paymentStatus === 'rejected';
    const matchesTab = activeTab === 'active' ? !isArchived : isArchived;
    return matchesSearch && matchesPayment && matchesShipping && matchesTab;
  });

  // Chat conversations logic
  const chatSessions = orders.filter(o => (o.messages && o.messages.length > 0) || o.type === 'inquiry');
  const sortedChatSessions = [...chatSessions].sort((a, b) => {
    const aTime = a.messages && a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].timestamp).getTime() : new Date(a.date).getTime();
    const bTime = b.messages && b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].timestamp).getTime() : new Date(b.date).getTime();
    return bTime - aTime;
  });
  const filteredChatSessions = sortedChatSessions.filter(o => {
    const q = searchQuery.toLowerCase();
    return (o.id || '').toLowerCase().includes(q) ||
           (o.customerName || '').toLowerCase().includes(q) ||
           (o.customerPhone || '').includes(q);
  });
  const totalUnreadChats = orders.filter(o => o.messages && o.messages.some(m => m.sender === 'customer' && !m.read)).length;

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'unpaid': return 'ລໍຖ້າຊຳລະ';
      case 'pending_verification': return 'ລໍຖ້າກວດສອບສະລິບ';
      case 'paid': return 'ຊຳລະແລ້ວ';
      case 'rejected': return '❌ ສະລິບຖືກປະຕິເສດ';
      case 'inquiry': return 'ສອບຖາມຂໍ້ມູນ';
      default: return status;
    }
  };

  const getShippingStatusText = (status) => {
    switch (status) {
      case 'pending': return 'ລໍຖ້າດຳເນີນການ';
      case 'packing': return 'ກຳລັງແພັກພັດສະດຸ';
      case 'ready_to_ship': return 'ພ້ອມສົ່ງ';
      case 'shipped': return 'ສົ່ງແລ້ວ';
      case 'delivered': return 'ສຳເລັດແລ້ວ';
      case 'cancelled': return 'ຍົກເລີກ';
      case 'inquiry': return 'ບໍ່ມີອໍເດີ້';
      default: return status;
    }
  };

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* LEFT PANEL: Orders List */}
      {(!isMobile || !selectedOrder) && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
        <div>
          <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 4px', fontSize: isMobile ? '1.2rem' : '1.35rem' }}>{db.getLabel('tab_online_orders', 'ອໍເດີ້ອອນລາຍ (Online Orders)')}</h3>
          {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{db.getLabel('auto_ຈັດການອໍເດີ້_ແລະ_ກວດສອບສະ_9ulacz', `ຈັດການອໍເດີ້ ແລະ ກວດສອບສະລິບລູກຄ້າ`)}</p>}
        </div>

        {/* Tab switcher active/archive/chat */}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0 -1.79 1.11z"/></svg> ອໍເດີ້ ({orders.filter(o => o.type !== 'inquiry' && !(o.shippingStatus === 'delivered' || o.shippingStatus === 'cancelled' || o.paymentStatus === 'rejected')).length})
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> Archive ({orders.filter(o => o.type !== 'inquiry' && (o.shippingStatus === 'delivered' || o.shippingStatus === 'cancelled' || o.paymentStatus === 'rejected')).length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('chat'); setSelectedOrder(null); }}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              background: activeTab === 'chat' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'chat' ? '#000' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ຫ້ອງແຊັດ {totalUnreadChats > 0 ? `(${totalUnreadChats})` : ''}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="form-control"
            placeholder={activeTab === 'chat' ? "ຄົ້ນຫາຫ້ອງສົນທະນາ..." : "ຄົ້ນຫາເລກອໍເດີ້, ຊື່, ເບີໂທ..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {activeTab !== 'chat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select className="form-control" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} style={{ fontSize: '0.75rem' }}>
                <option value="all">{db.getLabel('auto____ຊຳລະ__ທັງໝົດ__c69856', `ຊຳລະ (ທັງໝົດ)`)}</option>
                <option value="unpaid">{db.getLabel('auto____ລໍຖ້າຊຳລະ_soqhc1', `ລໍຖ້າຊຳລະ`)}</option>
                <option value="pending_verification">{db.getLabel('auto___ລໍຖ້າກວດສອບ_bqmral', `ລໍຖ້າກວດສອບ`)}</option>
                <option value="paid">{db.getLabel('auto___ຊຳລະແລ້ວ_evb829', `ຊຳລະແລ້ວ`)}</option>
                <option value="rejected">{db.getLabel('auto___ປະຕິເສດ_49z6u6', `ປະຕິເສດ`)}</option>
              </select>
              <select className="form-control" value={filterShipping} onChange={(e) => setFilterShipping(e.target.value)} style={{ fontSize: '0.75rem' }}>
                <option value="all">{db.getLabel('auto____ຂົນສົ່ງ__ທັງໝົດ__78g5x1', `ຂົນສົ່ງ (ທັງໝົດ)`)}</option>
                <option value="pending">{db.getLabel('auto_ລໍຖ້າເຮັດ_wg2uko', `ລໍຖ້າເຮັດ`)}</option>
                <option value="packing">{db.getLabel('auto_ກຳລັງແພັກ_xsmx6', `ກຳລັງແພັກ`)}</option>
                <option value="ready_to_ship">{db.getLabel('auto_ພ້ອມສົ່ງ_ue3hfz', `ພ້ອມສົ່ງ`)}</option>
                <option value="shipped">{db.getLabel('auto_ສົ່ງແລ້ວ_twzl7y', `ສົ່ງແລ້ວ`)}</option>
                <option value="delivered">{db.getLabel('auto_ສຳເລັດ_9zjj4f', `ສຳເລັດ`)}</option>
                <option value="cancelled">{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</option>
              </select>
            </div>
          )}
        </div>

        {/* List of Orders / Chats */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeTab === 'chat' ? (
            filteredChatSessions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '0.85rem' }}>{db.getLabel('auto_ບໍ່ພົບການສົນທະນາ_23v5h6', `ບໍ່ພົບການສົນທະນາ`)}</div>
            ) : (
              filteredChatSessions.map(o => {
                const unreadCount = o.messages ? o.messages.filter(m => m.sender === 'customer' && m.read === false).length : 0;
                const lastMsg = o.messages && o.messages.length > 0 ? o.messages[o.messages.length - 1] : null;
                const isGuest = o.customerPhone.startsWith('GUEST-');
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
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isGuest ? 'rgba(52,152,219,0.15)' : 'rgba(212,175,55,0.15)',
                      border: `1.5px solid ${isGuest ? '#3498db' : 'var(--gold-primary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      color: isGuest ? '#3498db' : 'var(--gold-primary)',
                      flexShrink: 0
                    }}>
                      {o.customerName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.customerName} {isGuest ? '(Guest)' : ''}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                          {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) : new Date(o.date).toLocaleDateString('lo-LA')}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          color: unreadCount > 0 ? '#fff' : 'var(--text-secondary)',
                          fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          width: '100%'
                        }}>
                          {lastMsg ? lastMsg.text : 'ເລີ່ມຕົ້ນຫ້ອງສົນທະນາ'}
                        </span>
                        
                        {unreadCount > 0 && (
                          <span style={{
                            fontSize: '0.65rem',
                            background: '#2ecc71',
                            color: '#000',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            marginLeft: '6px'
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '0.85rem' }}>{db.getLabel('auto_ບໍ່ພົບລາຍການອໍເດີ້_7a1j60', `ບໍ່ພົບລາຍການອໍເດີ້`)}</div>
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
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--gold-primary)' }}>{o.id}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(o.date).toLocaleString('lo-LA')}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>{o.customerName} ({o.customerPhone})</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        color: o.paymentStatus === 'paid' ? '#2ecc71' : o.paymentStatus === 'pending_verification' ? '#f1c40f' : '#e74c3c'
                      }}>
                        {getPaymentStatusText(o.paymentStatus)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ລວມ: <span style={{ color: 'white', fontWeight: 'bold' }}>{(o.total || o.totalAmount || 0).toLocaleString()} LAK</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {unreadCount > 0 && (
                          <span style={{
                            fontSize: '0.65rem',
                            background: '#e74c3c',
                            color: 'white',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 'bold'
                          }}>
                            {unreadCount} ໃໝ່
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: (o.shippingMethod === 'pickup' || (o.shippingAddress && o.shippingAddress.province && o.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'))) ? 'rgba(52,152,219,0.15)' : 'rgba(155,89,182,0.15)',
                          color: (o.shippingMethod === 'pickup' || (o.shippingAddress && o.shippingAddress.province && o.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'))) ? '#3498db' : '#9b59b6'
                        }}>
                          {(o.shippingMethod === 'pickup' || (o.shippingAddress && o.shippingAddress.province && o.shippingAddress.province.includes('ຮັບຢູ່ໜ້າຮ້ານ'))) ? 'ຮັບຢູ່ໜ້າຮ້ານ' : 'ຈັດສົ່ງ'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>ກັບຄືນ
            </button>
          )}
        {selectedOrder ? (
          activeTab === 'chat' ? (
            /* WhatsApp-style Chat Center thread on the right */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: selectedOrder.customerPhone.startsWith('GUEST-') ? 'rgba(52,152,219,0.15)' : 'rgba(212,175,55,0.15)',
                    border: `1.5px solid ${selectedOrder.customerPhone.startsWith('GUEST-') ? '#3498db' : 'var(--gold-primary)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.15rem',
                    color: selectedOrder.customerPhone.startsWith('GUEST-') ? '#3498db' : 'var(--gold-primary)'
                  }}>
                    {selectedOrder.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
                      {selectedOrder.customerName} {selectedOrder.customerPhone.startsWith('GUEST-') ? '(ແຂກທົ່ວໄປ)' : ''}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {selectedOrder.customerPhone} | ID: {selectedOrder.id}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedOrder.id.startsWith('ONL-') && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('active')}
                      style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      ເບິ່ງລາຍລະອຽດອໍເດີ້
                    </button>
                  )}
                  {isMobile && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedOrder(null)}
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      ປິດ
                    </button>
                  )}
                </div>
              </div>

              {/* Message box */}
              <div style={{
                flexGrow: 1,
                overflowY: 'auto',
                padding: '16px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '260px'
              }}>
                {(!selectedOrder.messages || selectedOrder.messages.length === 0) ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '100px' }}>
                    ຍັງບໍ່ມີຂໍ້ຄວາມສຳລັບການສົນທະນານີ້
                  </div>
                ) : (
                  selectedOrder.messages.map((msg, idx) => (
                    <div key={idx} style={{
                      alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                      background: msg.sender === 'admin' ? 'rgba(212,175,55,0.12)' : 'rgba(52,152,219,0.12)',
                      border: `1px solid ${msg.sender === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(52,152,219,0.3)'}`,
                      borderRadius: msg.sender === 'admin' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                      padding: '10px 14px',
                      maxWidth: '75%'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        {msg.sender === 'admin' ? 'ຮ້ານ' : `${msg.senderName || 'ລູກຄ້າ'}`}
                        {' · '}{new Date(msg.timestamp).toLocaleString('lo-LA')}
                      </div>
                      {msg.text && <div style={{ fontSize: '0.85rem', color: 'white', wordBreak: 'break-word' }}>{msg.text}</div>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: msg.text ? '8px' : 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.attachments.map((att, ai) => (
                            att.type === 'image' ? (
                              <img key={ai} src={att.data} alt={att.name} style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '6px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => window.open(att.data)} />
                            ) : att.type === 'video' ? (
                              <video key={ai} src={att.data} controls style={{ maxWidth: '200px', borderRadius: '6px' }} />
                            ) : (
                              <a key={ai} href={att.data} download={att.name} style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textDecoration: 'underline' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> {att.name}</a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Input box */}
              {adminAttachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  {adminAttachments.map((att, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      {att.type === 'image' ? (
                        <img src={att.data} alt={att.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : att.type === 'video' ? (
                        <div style={{ width: '50px', height: '50px', background: '#222', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🎬</div>
                      ) : (
                        <div style={{ padding: '4px 8px', background: 'rgba(212,175,55,0.1)', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--gold-primary)' }}>📎 {att.name}</div>
                      )}
                      <button onClick={() => setAdminAttachments(prev => prev.filter((_,j) => j !== i))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', border: 'none', borderRadius: '50%', width: '15px', height: '15px', color: 'white', cursor: 'pointer', fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '38px', height: '38px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>
                  📎
                  <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleAdminFileChange} />
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={db.getLabel('auto_ພິມຂໍ້ຄວາມຕອບກັບ_____Ente_ytwjl8', `ພິມຂໍ້ຄວາມຕອບກັບ... (Enter ເພື່ອສົ່ງ)`)}
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendAdminReply(); }}
                  style={{ flex: 1, fontSize: '0.85rem', height: '38px' }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendAdminReply}
                  disabled={!chatReply.trim() && adminAttachments.length === 0}
                  style={{ padding: '0 20px', height: '38px', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  ສົ່ງ
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ເລກທີອໍເດີ້__x02ooo', `ເລກທີອໍເດີ້:`)}</span>
                <h2 style={{ color: 'var(--gold-primary)', margin: 0 }}>{selectedOrder.id}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ສ້າງເມື່ອ: {new Date(selectedOrder.date).toLocaleString('lo-LA')}
                </div>
              </div>

              {/* Status control buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{db.getLabel('auto_ການຊຳລະ__gdqf7m', `ການຊຳລະ:`)}</span>
                  <span style={{
                    fontWeight: 'bold',
                    color: selectedOrder.paymentStatus === 'paid' ? '#2ecc71' : selectedOrder.paymentStatus === 'pending_verification' ? '#f1c40f' : '#e74c3c'
                  }}>
                    {getPaymentStatusText(selectedOrder.paymentStatus)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{db.getLabel('auto_ສະຖານະຂົນສົ່ງ__hx1myr', `ສະຖານະຂົນສົ່ງ:`)}</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{getShippingStatusText(selectedOrder.shippingStatus)}</span>
                </div>
              </div>
            </div>

            {/* Layout divided into details and slip section */}
            {selectedOrder.type === 'inquiry' ? (
              /* Full-width Inquiry Chat view */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(52,152,219,0.04)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ການສອບຖາມຈາກລູກຄ້າ: {selectedOrder.customerName} ({selectedOrder.customerPhone})
                  </h4>
                  
                  {/* Message history */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', maxHeight: '450px', overflowY: 'auto', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    {(!selectedOrder.messages || selectedOrder.messages.length === 0) ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '80px' }}>
                        ຍັງບໍ່ມີຂໍ້ຄວາມ
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
                      placeholder={db.getLabel('auto_ຕອບກັບລູກຄ້າ_____Enter_ເພ_ycpywh', `ຕອບກັບລູກຄ້າ... (Enter ເພື່ອສົ່ງ)`)}
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
                  <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: '0 0 10px' }}>{db.getLabel('auto____ລາຍການສິນຄ້າໃນອໍເດີ້__vspin3', `ລາຍການສິນຄ້າໃນອໍເດີ້:`)}</h4>
                  <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 4px' }}>{db.getLabel('auto_ສິນຄ້າ_9zpaw2', `ສິນຄ້າ`)}</th>
                        <th style={{ textAlign: 'right', padding: '8px 4px' }}>{db.getLabel('auto_ລາຄາ_1wpv6j', `ລາຄາ`)}</th>
                        <th style={{ textAlign: 'center', padding: '8px 4px' }}>{db.getLabel('auto_ຈຳນວນ_car3ds', `ຈຳນວນ`)}</th>
                        <th style={{ textAlign: 'right', padding: '8px 4px' }}>{db.getLabel('auto_ລວມ_27sjj', `ລວມ`)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{item.name || 'N/A'}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right' }}>{(item.price || 0).toLocaleString()} LAK</td>
                          <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.qty || 0}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{(item.total || 0).toLocaleString()} LAK</td>
                        </tr>
                      ))}
                      <tr style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ padding: '12px 4px', textAlign: 'right', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຍອດລວມທັງໝົດ__l8gc2u', `ຍອດລວມທັງໝົດ:`)}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', color: 'var(--gold-primary)' }}>{(selectedOrder.total || 0).toLocaleString()} LAK</td>
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
                        <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: '0 0 10px' }}>
                          {isPickup ? 'ຂໍ້ມູນການຮັບເຄື່ອງຢູ່ໜ້າຮ້ານ:' : 'ຂໍ້ມູນການຈັດສົ່ງພັດສະດຸ:'}
                        </h4>
                        {selectedOrder.shippingAddress ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                            <div><b>{db.getLabel('auto_ຊື່ຜູ້ຮັບ_ມາຮັບ__f8hjq5', `ຊື່ຜູ້ຮັບ/ມາຮັບ:`)}</b> {selectedOrder.shippingAddress.recipientName}</div>
                            <div><b>{db.getLabel('auto_ເບີໂທຕິດຕໍ່__k3xudr', `ເບີໂທຕິດຕໍ່:`)}</b> {selectedOrder.shippingAddress.phone}</div>
                            {isPickup ? (
                              <div><b>{db.getLabel('auto_ວັນທີ_ເວລາ_ທີ່ຈະມາຮັບ__c9n1y4', `ວັນທີ/ເວລາ ທີ່ຈະມາຮັບ:`)}</b> <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{selectedOrder.shippingAddress.addressLine || 'N/A'}</span></div>
                            ) : (
                              <>
                                <div><b>{db.getLabel('auto_ທີ່ຢູ່__j60jfx', `ທີ່ຢູ່:`)}</b> {db.getLabel('auto_ບ້ານ_1wjcgm', `ບ້ານ`)} {selectedOrder.shippingAddress.village || 'N/A'}{db.getLabel('auto___ເມືອງ_a8mf3w', `, ເມືອງ`)} {selectedOrder.shippingAddress.city || 'N/A'}{db.getLabel('auto___ແຂວງ_n8rkd1', `, ແຂວງ`)} {selectedOrder.shippingAddress.province || 'N/A'} ({selectedOrder.shippingAddress.country || 'N/A'})</div>
                                {selectedOrder.shippingAddress.addressLine && <div><b>{db.getLabel('auto_ລາຍລະອຽດເພີ່ມເຕີມ__85xv4u', `ລາຍລະອຽດເພີ່ມເຕີມ:`)}</b> {selectedOrder.shippingAddress.addressLine}</div>}
                              </>
                            )}
                            {selectedOrder.shippingAddress.notes && <div style={{ color: 'var(--accent-amber)', marginTop: '4px' }}><b>{db.getLabel('auto____ໝາຍເຫດຈາກລູກຄ້າ__2yhsic', `ໝາຍເຫດຈາກລູກຄ້າ:`)}</b> {selectedOrder.shippingAddress.notes}</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍ່ມີຂໍ້ມູນການຈັດສົ່ງ_1l8hun', `ບໍ່ມີຂໍ້ມູນການຈັດສົ່ງ`)}</div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 3. Shipping info editing form */}
                <form onSubmit={handleUpdateShipping} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: '0 0 4px' }}>{db.getLabel('auto____ຈັດກາຣຂໍ້ມູນການຈັດສົ່ງ_sg2s4w', `ຈັດການຂໍ້ມູນການຈັດສົ່ງ:`)}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ບໍລິສັດຂົນສົ່ງ__Carrier__x1eojm', `ບໍລິສັດຂົນສົ່ງ (Carrier)`)}</label>
                      <input type="text" className="form-control" placeholder="Anousith, HAL,..." value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ເລກພັດສະດຸ__Tracking_Numb_e1mqc2', `ເລກພັດສະດຸ (Tracking Number)`)}</label>
                      <input type="text" className="form-control" placeholder="ANXXXXXXXX" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ຮູບພາບໃບຝາກສົ່ງ___ກ່ອງພັດ_q6ipdz', `ຮູບພາບໃບຝາກສົ່ງ / ກ່ອງພັດສະດຸ`)}</label>
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
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>{db.getLabel('auto_ໝາຍເຫດ___ຂໍ້ຄວາມອັບເດດສະຖ_6yrvrn', `ໝາຍເຫດ / ຂໍ້ຄວາມອັບເດດສະຖານະ`)}</label>
                    <input type="text" className="form-control" placeholder={db.getLabel('auto_ກຳລັງດຳເນີນການຈັດສົ່ງ_____bjwjzu', `ກຳລັງດຳເນີນການຈັດສົ່ງ,...`)} value={shippingNote} onChange={(e) => setShippingNote(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', alignSelf: 'flex-end' }}>{db.getLabel('auto____ບັນທຶກຂໍ້ມູນການສົ່ງ_tk7gru', `ບັນທຶກຂໍ້ມູນການສົ່ງ`)}</button>
                </form>

                {/* 4. Timeline status log */}
                <div>
                  <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: '0 0 10px' }}>{db.getLabel('auto____ປະຫວັດຄວາມເຄື່ອນໄຫວ__T_jw29cc', `ປະຫວັດຄວາມເຄື່ອນໄຫວ (Timeline Log):`)}</h4>
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
                  <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ຂໍ້ຄວາມຈາກລູກຄ້າ:
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
                      placeholder={db.getLabel('auto_ຕອບກັບລູກຄ້າ_____Enter_ເພ_ycpywh', `ຕອບກັບລູກຄ້າ... (Enter ເພື່ອສົ່ງ)`)}
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
                <h4 style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.98rem', margin: 0 }}>{db.getLabel('auto____ສະລິບການໂອນເງິນ__qz8usx', `ສະລິບການໂອນເງິນ:`)}</h4>

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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', display: 'block' }}>{db.getLabel('auto____ຄລິກທີ່ຮູບເພື່ອຊູມ_ຂະຫ_f4tnrr', `ຄລິກທີ່ຮູບເພື່ອຊູມ/ຂະຫຍາຍ`)}</span>
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
                    ຍັງບໍ່ມີການອັບໂຫຼດສະລິບຊຳລະເງິນ
                  </div>
                )}

                {/* Actions based on payment Status */}
                {selectedOrder.paymentStatus === 'pending_verification' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <button className="btn btn-primary" onClick={handleApprovePayment} style={{ width: '100%', fontWeight: 'bold' }}>
                      ຢືນຢັນຍອດເງິນ / Approve
                    </button>
                    <button className="btn" onClick={handleRejectPayment} style={{ width: '100%', background: 'var(--alert-red)', color: 'white', borderColor: 'var(--alert-red)', fontWeight: 'bold' }}>
                      ປະຕິເສດສະລິບ / Reject
                    </button>
                  </div>
                )}

                {/* Status adjustment buttons */}
                {selectedOrder.paymentStatus === 'paid' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{db.getLabel('auto____ປ່ຽນສະຖານະການຈັດສົ່ງ__gpi7i3', `ປ່ຽນສະຖານະການຈັດສົ່ງ:`)}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleChangeShippingStatus('packing', 'ກຳລັງແພັກພັດສະດຸ')}>{db.getLabel('auto____ແພັກພັດສະດຸ_sl6dev', `ແພັກພັດສະດຸ`)}</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleChangeShippingStatus('ready_to_ship', 'ພ້ອມຈັດສົ່ງ')}>{db.getLabel('auto____ພ້ອມຈັດສົ່ງ_tka0m1', `ພ້ອມຈັດສົ່ງ`)}</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleChangeShippingStatus('shipped', 'ຈັດສົ່ງອອກແລ້ວ')}>{db.getLabel('auto____ຈັດສົ່ງແລ້ວ_opbcuc', `ຈັດສົ່ງແລ້ວ`)}</button>
                      <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px', background: '#2ecc71', borderColor: '#2ecc71' }} onClick={() => handleChangeShippingStatus('delivered', 'ສົ່ງມອບສຳເລັດ')}>{db.getLabel('auto____ສຳເລັດແລ້ວ_ao0c32', `ສຳເລັດແລ້ວ`)}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '4rem' }}>{activeTab === 'chat' ? '💬' : '🛒'}</span>
            <h3>{activeTab === 'chat' ? 'ກະລຸນາເລືອກຫ້ອງສົນທະນາເພື່ອເລີ່ມແຊັດ' : 'ກະລຸນາເລືອກອໍເດີ້ຈາກລາຍການດ້ານຊ້າຍ'}</h3>
            <p style={{ fontSize: '0.85rem' }}>{activeTab === 'chat' ? 'ເລືອກລາຍການສົນທະນາດ້ານຊ້າຍເພື່ອເບິ່ງຂໍ້ຄວາມ ແລະ ສົ່ງຄຳຕອບ' : 'ເລືອກອໍເດີ້ເພື່ອເບິ່ງລາຍການສິນຄ້າ, ກວດສອບສະລິບໂອນເງິນ ແລະ ອັບເດດຂໍ້ມູນຂົນສົ່ງ'}</p>
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
                ດາວໂຫຼດສະລິບ (Download Slip)
              </a>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
