import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

// Optimized Isolated Modal Component to prevent parent re-renders and keypress lag
function CustomerModal({ show, editingCust, onClose, onSave }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [tier, setTier] = useState('Regular');
  const [points, setPoints] = useState(0);
  // Address fields
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addrNotes, setAddrNotes] = useState('');

  useEffect(() => {
    if (editingCust) {
      setName(editingCust.name || '');
      setPhone(editingCust.phone || '');
      setEmail(editingCust.email || '');
      setPassword(editingCust.password || '');
      setDiscountType(editingCust.discountType || 'percent');
      setDiscountValue(editingCust.discountValue || '');
      setTier(editingCust.tier || 'Regular');
      setPoints(editingCust.points ?? 0);
      // Load first address
      const addr = editingCust.addresses?.[0] || {};
      setProvince(addr.province || '');
      setCity(addr.city || '');
      setVillage(addr.village || '');
      setAddressLine(addr.addressLine || '');
      setAddrNotes(addr.notes || '');
    } else {
      setName(''); setPhone(''); setEmail('');
      setPassword('123456'); // Default password for new members
      setDiscountType('percent'); setDiscountValue(''); setTier('Regular'); setPoints(0);
      setProvince(''); setCity(''); setVillage(''); setAddressLine(''); setAddrNotes('');
    }
  }, [editingCust, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const addressData = (province || city || village) ? {
      recipientName: name,
      phone,
      province,
      city,
      village,
      addressLine,
      notes: addrNotes,
      isDefault: true
    } : null;
    onSave({
      id: editingCust?.id,
      name, phone, email, password,
      discountType,
      discountValue: Number(discountValue || 0),
      tier,
      points: Number(points || 0),
      addressData
    });
  };

  const inputStyle = { width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' };
  const sectionLabel = (txt) => (
    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gold-primary)', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '4px', marginTop: '8px' }}>{txt}</div>
  );

  return (
    <Portal>
    <div className="modal-overlay" style={{ zIndex: 1300, background: 'rgba(0,0,0,0.65)' }}>
      <div className="modal-content modal-sm animate-fade-in" style={{ padding: 0 }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>
            {editingCust ? '✏️ ແກ້ໄຂຂໍ້ມູນສະມາຊິກ' : '👥 ສະໝັກສະມາຊິກໃໝ່'}
          </h3>
          <button type="button" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {sectionLabel('👤 ຂໍ້ມູນຫຼັກ (Basic Info)')}

            <div className="form-group">
              <label className="form-label">{db.getLabel('auto_ຊື່ສະມາຊິກ___q10v3j', `ຊື່ສະມາຊິກ *`)}</label>
              <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} placeholder={db.getLabel('auto_ປ້ອນຊື່_ແລະ_ນາມສະກຸນ____nl83h5', `ປ້ອນຊື່ ແລະ ນາມສະກຸນ...`)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ເບີໂທ___1b60l6', `ເບີໂທ *`)}</label>
                <input type="text" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020XXXXXXXX" style={inputStyle} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (ອີເມວ)</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" style={inputStyle} />
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ລະຫັດຜ່ານ__Password____j9g52e', `ລະຫັດຜ່ານ (Password) *`)}</label>
                <input type="text" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ປ້ອນລະຫັດຜ່ານ..." style={inputStyle} />
              </div>
            </div>

            {sectionLabel('🏷️ ລະດັບ ແລະ ສ່ວນຫຼຸດ (Tier & Discount)')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ລະດັບ__Tier__hxumsz', `ລະດັບ (Tier)`)}</label>
                <select value={tier} onChange={(e) => setTier(e.target.value)} className="form-control" style={inputStyle}>
                  <option value="Bronze">Bronze</option>
                  <option value="Regular">Regular</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ປະເພດສ່ວນຫຼຸດ_3u22se', `ປະເພດສ່ວນຫຼຸດ`)}</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="form-control" style={inputStyle}>
                  <option value="percent">% (Percent)</option>
                  <option value="fixed">₭ (Fixed LAK)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ມູນຄ່າ_e6cxhv', `ມູນຄ່າ`)}</label>
                <input type="number" className="form-control" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">💎 ຄະແນນສະສົມ (Loyalty Points)</label>
              <input type="number" className="form-control" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="0" style={inputStyle} />
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '4px' }}>{db.getLabel('auto_ໄດ້ຮັບ_1_ຄະແນນ_ຕໍ່ການຊື້__ud5dse', `ໄດ້ຮັບ 1 ຄະແນນ ຕໍ່ການຊື້ 10,000 ₭ • ແລກ 1 ຄະແນນ = 100 ₭ (ແກ້ໄຂດ້ວຍມືເພື່ອປັບປ່ຽນ)`)}</div>
            </div>

            {sectionLabel('📍 ທີ່ຢູ່ຈັດສົ່ງ (Delivery Address)')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ແຂວງ__Province__fmll8w', `ແຂວງ (Province)`)}</label>
                <input type="text" className="form-control" value={province} onChange={(e) => setProvince(e.target.value)} placeholder={db.getLabel('auto_ຈຳປາສັກ_rv6new', `ຈຳປາສັກ`)} style={inputStyle} />
              </div>
              <div className="form-group">
                <label className="form-label">{db.getLabel('auto_ເມືອງ__City__effp52', `ເມືອງ (City)`)}</label>
                <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} placeholder={db.getLabel('auto_ປາກເຊ_c0c4b0', `ປາກເຊ`)} style={inputStyle} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{db.getLabel('auto_ບ້ານ__Village__2ijkaj', `ບ້ານ (Village)`)}</label>
              <input type="text" className="form-control" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="ບ້ານ..." style={inputStyle} />
            </div>
            <div className="form-group">
              <label className="form-label">{db.getLabel('auto_ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ_85nqhb', `ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ`)}</label>
              <input type="text" className="form-control" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder={db.getLabel('auto_ຮ່ອມ__ເລກທີເຮືອນ____qrunzj', `ຮ່ອມ, ເລກທີເຮືອນ...`)} style={inputStyle} />
            </div>
            <div className="form-group">
              <label className="form-label">{db.getLabel('auto_ໝາຍເຫດເຖິງຂົນສົ່ງ_hn885y', `ໝາຍເຫດເຖິງຂົນສົ່ງ`)}</label>
              <input type="text" className="form-control" value={addrNotes} onChange={(e) => setAddrNotes(e.target.value)} placeholder="ຝາກຂົນສົ່ງອະນຸສິດ, HAL..." style={inputStyle} />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{db.getLabel('auto_ປິດ___Cancel_zeu6ts', `ປິດ / Cancel`)}</button>
            <button type="submit" className="btn btn-primary">💾 ບັນທຶກຂໍ້ມູນ</button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}

function CustomerDetailModal({ show, customer, onClose }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'pos' | 'online' | 'jobs' | 'addresses'

  if (!show || !customer) return null;

  const allOrders = db.getOrders();
  const allOnlineOrders = typeof db.getOnlineOrders === 'function' ? db.getOnlineOrders() : [];
  const allFramingJobs = typeof db.getFramingJobs === 'function' ? db.getFramingJobs() : [];

  const normalizePhone = (num) => {
    if (!num) return '';
    let clean = num.replace(/\D/g, '');
    if (clean.startsWith('020')) clean = clean.substring(3);
    else if (clean.startsWith('20')) clean = clean.substring(2);
    return clean;
  };

  const posOrders = allOrders.filter(o => o.customerPhone === customer.phone || o.customerId === customer.id);
  const onlineOrders = allOnlineOrders.filter(o => o.customerPhone === customer.phone || o.customerId === customer.id);
  const framingJobs = allFramingJobs.filter(j => normalizePhone(j.customerPhone) === normalizePhone(customer.phone));

  const posTotal = posOrders.reduce((sum, o) => sum + o.total, 0);
  const onlineTotal = onlineOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
  const framingTotal = framingJobs.reduce((sum, j) => sum + (j.totalPrice || 0), 0);
  const grandTotal = posTotal + onlineTotal + framingTotal;

  const jobStatusLabel = (s) => {
    if (s === 'picked_up') return { text: 'ຮັບເຄື່ອງແລ້ວ', color: '#2ecc71' };
    if (s === 'done') return { text: 'ສຳເລັດແລ້ວ', color: '#3498db' };
    if (s === 'in_progress') return { text: 'ກຳລັງເຮັດ', color: '#f1c40f' };
    return { text: 'ລໍຖ້າ', color: '#e67e22' };
  };

  return (
    <Portal>
    <div className="modal-overlay" style={{ zIndex: 1300, background: 'rgba(0,0,0,0.72)' }}>
      <div className="modal-content animate-fade-in" style={{ padding: '24px', maxWidth: '720px', width: '96%', background: '#1c1917', border: '1px solid var(--border-color)', borderRadius: '14px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '2px solid var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
              👤
            </div>
            <div>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.1rem' }}>{customer.name}</h3>
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                ID: {customer.id} · {customer.tier || 'Regular'}
                {customer.hasOnlineAccount && <span style={{ marginLeft: '8px', background: 'rgba(52,152,219,0.2)', color: '#3498db', padding: '1px 7px', borderRadius: '10px', fontSize: '0.7rem' }}>🌐 Online Member</span>}
              </div>
            </div>
          </div>
          <button type="button" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={onClose}>✕</button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', flexShrink: 0 }}>
          {[
            { label: 'POS ໜ້າຮ້ານ', value: posTotal.toLocaleString() + ' ₭', color: '#2ecc71', count: posOrders.length + ' ໃບ' },
            { label: 'Online Orders', value: onlineTotal.toLocaleString() + ' ₭', color: '#3498db', count: onlineOrders.length + ' ໃບ' },
            { label: 'ກອບຮູບ (POS Jobs)', value: framingTotal.toLocaleString() + ' ₭', color: '#f39c12', count: framingJobs.length + ' ງານ' },
            { label: 'ລວມທັງໝົດ', value: grandTotal.toLocaleString() + ' ₭', color: 'var(--gold-primary)', count: '' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
              {s.count && <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '2px' }}>{s.count}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '2px', marginBottom: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
          {[
            { id: 'info', name: '👤 ຂໍ້ມູນ' },
            { id: 'pos', name: `🏪 POS (${posOrders.length})` },
            { id: 'online', name: `🌐 Online (${onlineOrders.length})` },
            { id: 'jobs', name: `🖼️ ກອບ (${framingJobs.length})` },
            { id: 'addresses', name: '📍 ທີ່ຢູ່' },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{ padding: '6px 12px', border: 'none', background: activeTab === t.id ? 'rgba(212,175,55,0.1)' : 'transparent', color: activeTab === t.id ? 'var(--gold-primary)' : 'var(--text-secondary)', borderBottom: activeTab === t.id ? '2px solid var(--gold-primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', outline: 'none', whiteSpace: 'nowrap' }}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '👤 ຊື່ສະມາຊິກ', value: customer.name },
                { label: '📞 ເບີໂທ', value: customer.phone },
                { label: '📧 Email', value: customer.email || '— ບໍ່ໄດ້ລົງທະບຽນ' },
                { label: '🏷️ ລະດັບ (Tier)', value: customer.tier || 'Regular' },
                { label: '💎 ຄະແນນສະສົມ (Points)', value: `${(customer.points || 0).toLocaleString()} ຄະແນນ (≈ ${((customer.points || 0) * 100).toLocaleString()} ₭)` },
                { label: '💰 ຍອດຊື້ສະສົມ', value: `${(customer.totalSpend || 0).toLocaleString()} ₭` },
                { label: '🎁 ສ່ວນຫຼຸດ', value: customer.discountType === 'percent' ? `${customer.discountValue}%` : `-${(customer.discountValue || 0).toLocaleString()} ₭` },
                { label: '🌐 ບັນຊີ Online', value: customer.hasOnlineAccount ? '✅ ມີບັນຊີ Online' : '❌ ຍັງບໍ່ທັນສ້າງ' },
                { label: '🔑 ລະຫັດຜ່ານ', value: customer.password ? '🔒 ຕັ້ງໄວ້ແລ້ວ' : '— ຍັງບໍ່ທັນຕັ້ງ' },
                { label: '📅 ວັນທີສ້າງ', value: customer.createdAt ? new Date(customer.createdAt).toLocaleString('lo-LA') : '— ບໍ່ຮູ້' },
                { label: '🆔 Customer ID', value: customer.id },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', color: '#888', minWidth: '130px', flexShrink: 0, marginTop: '1px' }}>{row.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold', wordBreak: 'break-all' }}>{row.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* POS ORDERS TAB */}
          {activeTab === 'pos' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px' }}>{db.getLabel('auto_ເລກບິນ_6mkzn', `ເລກບິນ`)}</th>
                  <th style={{ padding: '8px' }}>{db.getLabel('auto_ວັນທີ_btqrbn', `ວັນທີ`)}</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>{db.getLabel('auto_ຍອດ_27avo', `ຍອດ`)}</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>{db.getLabel('auto_ຊຳລະ_1w8o2c', `ຊຳລະ`)}</th>
                </tr>
              </thead>
              <tbody>
                {posOrders.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>{db.getLabel('auto_ບໍ່ມີປະຫວັດການຊື້ໜ້າຮ້ານ_vi3lai', `ບໍ່ມີປະຫວັດການຊື້ໜ້າຮ້ານ`)}</td></tr>
                ) : posOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '8px', color: 'var(--gold-primary)', fontWeight: 'bold' }}>{o.id}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{new Date(o.date).toLocaleDateString('lo-LA')}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{o.total.toLocaleString()} ₭</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#aaa' }}>{o.paymentMethod === 'cash' ? '💵 ເງິນສົດ' : o.paymentMethod === 'split' ? '🔀 ຜ່ານ' : '📱 ໂອນ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ONLINE ORDERS TAB */}
          {activeTab === 'online' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px' }}>{db.getLabel('auto_ເລກ_Order_m33j5i', `ເລກ Order`)}</th>
                  <th style={{ padding: '8px' }}>{db.getLabel('auto_ວັນທີ_btqrbn', `ວັນທີ`)}</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>{db.getLabel('auto_ຍອດ_27avo', `ຍອດ`)}</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>{db.getLabel('auto_ຊຳລະ_1w8o2c', `ຊຳລະ`)}</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>{db.getLabel('auto_ຂົນສົ່ງ_tvsefk', `ຂົນສົ່ງ`)}</th>
                </tr>
              </thead>
              <tbody>
                {onlineOrders.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>{db.getLabel('auto_ບໍ່ມີປະຫວັດ_Online_Order_g06gs', `ບໍ່ມີປະຫວັດ Online Order`)}</td></tr>
                ) : onlineOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '8px', color: '#3498db', fontWeight: 'bold' }}>{o.id}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{new Date(o.date).toLocaleDateString('lo-LA')}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{o.total.toLocaleString()} ₭</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: o.paymentStatus === 'paid' ? 'rgba(46,204,113,0.15)' : 'rgba(241,196,15,0.15)', color: o.paymentStatus === 'paid' ? '#2ecc71' : '#f1c40f' }}>{o.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span></td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#aaa', fontSize: '0.75rem' }}>{o.shippingStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* FRAMING JOBS TAB */}
          {activeTab === 'jobs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {framingJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#666', fontSize: '0.85rem' }}>{db.getLabel('auto_ບໍ່ມີປະຫວັດກອບຮູບຂອງລູກຄ້_57vd9t', `ບໍ່ມີປະຫວັດກອບຮູບຂອງລູກຄ້ານີ້`)}</div>
              ) : framingJobs.map(j => {
                const st = jobStatusLabel(j.status);
                return (
                  <div key={j.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>{j.id}</div>
                      <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>{j.amuletDescription || (j.amulets && j.amulets.map(a => a.description).join(', ')) || 'ກອບຮູບພຣະ'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>{db.getLabel('auto_ວັນທີ__bgh93n', `ວັນທີ:`)} {j.createdDate ? new Date(j.createdDate).toLocaleDateString('lo-LA') : '-'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{(j.totalPrice || 0).toLocaleString()} ₭</div>
                      <div style={{ fontSize: '0.7rem', color: st.color, fontWeight: 'bold', marginTop: '2px' }}>{st.text}</div>
                      {j.balance > 0 && <div style={{ fontSize: '0.7rem', color: '#e74c3c', marginTop: '2px' }}>{db.getLabel('auto_ຍັງຄ້າງ__m3733x', `ຍັງຄ້າງ:`)} {j.balance.toLocaleString()} ₭</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!customer.addresses || customer.addresses.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', padding: '24px' }}>{db.getLabel('auto_ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ_couia0', `ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ`)}</p>
              ) : customer.addresses.map((addr, idx) => (
                <div key={idx} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  {addr.isDefault && <span style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold-primary)', padding: '1px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', display: 'inline-block' }}>⭐ ທີ່ຢູ່ຫຼັກ</span>}
                  {typeof addr === 'object' ? (
                    <div>
                      {addr.recipientName && <div><b>{db.getLabel('auto_ຊື່ຜູ້ຮັບ__lsjnak', `ຊື່ຜູ້ຮັບ:`)}</b> {addr.recipientName}</div>}
                      {addr.phone && <div><b>{db.getLabel('auto_ເບີ__1x6kcf', `ເບີ:`)}</b> {addr.phone}</div>}
                      {addr.province && <div><b>{db.getLabel('auto_ແຂວງ__bg9x53', `ແຂວງ:`)}</b> {addr.province}</div>}
                      {addr.city && <div><b>{db.getLabel('auto_ເມືອງ__5e62y', `ເມືອງ:`)}</b> {addr.city}</div>}
                      {addr.village && <div><b>{db.getLabel('auto_ບ້ານ__c0gbmk', `ບ້ານ:`)}</b> {addr.village}</div>}
                      {addr.addressLine && <div><b>{db.getLabel('auto_ທີ່ຢູ່__j60jfx', `ທີ່ຢູ່:`)}</b> {addr.addressLine}</div>}
                      {addr.notes && <div><b>{db.getLabel('auto_ໝາຍເຫດ__bj4oax', `ໝາຍເຫດ:`)}</b> {addr.notes}</div>}
                    </div>
                  ) : <div>{addr}</div>}
                </div>
              ))}
            </div>
          )}

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{db.getLabel('auto_ປິດ___Close_cld5j2', `ປິດ / Close`)}</button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

export default function Customers({ activeUser, onUpdate }) {
  const hasCustomersPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };
  const [customersList, setCustomersList] = useState([]);
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [custSearchQuery, setCustSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Details Modal States
  const [selectedDetailCust, setSelectedDetailCust] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadCustomers = () => {
    setCustomersList(db.getCustomersWithOnlineData());
  };

  useEffect(() => {
    loadCustomers();
    const handleUpdate = () => {
      loadCustomers();
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('db-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('db-updated', handleUpdate);
    };
  }, []);

  const handleSaveCustomer = (formData) => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທ / Please fill in name and phone.');
      return;
    }
    // Build addresses array from address fields
    const addresses = formData.addressData ? [formData.addressData] : undefined;

    if (formData.id) {
      db.updateCustomer(formData.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        password: formData.password?.trim() || '',
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        tier: formData.tier,
        points: Number(formData.points || 0),
        ...(addresses ? { addresses } : {})
      });
      setSuccessMsg('✓ ແກ້ໄຂຂໍ້ມູນສະມາຊິກສຳເລັດ!');
    } else {
      db.addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        password: formData.password?.trim() || '123456',
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        tier: formData.tier,
        points: Number(formData.points || 0),
        ...(addresses ? { addresses } : {})
      });
      setSuccessMsg('✓ ເພີ່ມສະມາຊິກໃໝ່ສຳເລັດ!');
    }
    loadCustomers();
    if (onUpdate) onUpdate();
    setShowCustModal(false);
    setEditingCust(null);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEditCustomerClick = (c) => {
    if (!hasCustomersPermission('membersEdit')) {
      alert('🔒 ທ່ານບໍ່ມີສິດໃນການແກ້ໄຂສະມາຊິກ!');
      return;
    }
    setEditingCust(c);
    setShowCustModal(true);
  };

  const handleDeleteCustomerClick = (id, name) => {
    if (!hasCustomersPermission('membersDelete')) {
      alert('🔒 ທ່ານບໍ່ມີສິດໃນການລຶບສະມາຊິກ!');
      return;
    }
    if (window.confirm(`ຕ້ອງການລົບສະມາຊິກ "${name}" ແທ້ບໍ່?`)) {
      db.deleteCustomer(id);
      loadCustomers();
      if (onUpdate) onUpdate();
      setSuccessMsg('✓ ລົບສະມາຊິກສຳເລັດ!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', padding: '4px' }}>
      
      {successMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(46, 204, 113, 0.95)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          zIndex: 2000,
          fontWeight: 'bold',
          animation: 'slide-in 0.3s ease-out'
        }}>
          {successMsg}
        </div>
      )}

      {/* Main Glass Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, var(--gold-primary) 0%, #fff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {db.getLabel('settings_tab_customers', '👥 ຈັດການສະມາຊິກ (Members)')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            ຈັດການຖານຂໍ້ມູນລູກຄ້າປະຈຳ, ສ່ວນຫຼຸດສະມາຊິກ ແລະ ການສະໝັກສະມາຊິກໃຫມ່
          </p>
        </div>
      {hasCustomersPermission('membersAdd') && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingCust(null);
            setShowCustModal(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(212,175,55,0.25)' }}
        >
          ➕ {db.getLabel('pos_register_member_btn', '＋ ສະໝັກສະມາຊິກໃໝ່')}
        </button>
      )}
      </div>

      {/* Content Section */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search filter row */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            placeholder={db.getLabel('auto____ຄົ້ນຫາສະມາຊິກດ້ວຍ_ຊື່__5rfwn4', `🔍 ຄົ້ນຫາສະມາຊິກດ້ວຍ ຊື່ ຫຼື ເບີໂທ...`)}
            value={custSearchQuery}
            onChange={(e) => setCustSearchQuery(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 16px', fontSize: '0.85rem', width: '100%' }}
          />
        </div>

        {/* Members Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--gold-primary)' }}>
                <th style={{ padding: '14px 20px' }}>{db.getLabel('cust_id_col', 'ລະຫັດສະມາຊິກ')}</th>
                <th style={{ padding: '14px 20px' }}>{db.getLabel('cust_name_col', 'ຊື່ສະມາຊິກ')}</th>
                <th style={{ padding: '14px 20px' }}>{db.getLabel('cust_phone_col', 'ເບີໂທ / Email')}</th>
                <th style={{ padding: '14px 20px' }}>{db.getLabel('cust_tier_col', 'ລະດັບສະມາຊິກ')}</th>
                <th style={{ padding: '14px 20px' }}>{db.getLabel('cust_discount_col', 'ສ່ວນຫຼຸດ')}</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>{db.getLabel('cust_points_col', '💎 ຄະແນນ')}</th>
                <th style={{ padding: '14px 20px', textAlign: 'center' }}>{db.getLabel('cust_actions_col', 'ຈັດການ')}</th>
              </tr>
            </thead>
            <tbody>
              {customersList.filter(c => {
                if (!custSearchQuery.trim()) return true;
                const q = custSearchQuery.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.phone.includes(q);
              }).map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                    {c.id}
                    {c.isOnlineOnly && <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: 'rgba(52,152,219,0.2)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)', borderRadius: '8px', padding: '1px 6px' }}>🌐 Online</span>}
                    {c.password && !c.isOnlineOnly && <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '8px', padding: '1px 6px' }}>🔑 App</span>}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 'bold', color: 'white' }}>{c.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                    <div>{c.phone}</div>
                    {c.email && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>✉️ {c.email}</div>}
                    {c.password && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', marginTop: '2.5px', fontWeight: 'bold' }}>
                        🔑 {c.password}
                      </div>
                    )}
                    {c.addresses && c.addresses.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '2px' }}>📍 {[c.addresses[0].village, c.addresses[0].city, c.addresses[0].province].filter(Boolean).join(', ')}</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: c.tier === 'VIP' || c.tier === 'VVIP' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      color: c.tier === 'VIP' || c.tier === 'VVIP' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                      border: '1px solid ' + (c.tier === 'VIP' || c.tier === 'VVIP' ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.1)')
                    }}>
                      {c.tier}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: 'rgba(46,204,113,0.12)',
                      color: '#2ecc71',
                      border: '1px solid rgba(46,204,113,0.2)'
                    }}>
                      {c.discountType === 'percent' ? `${c.discountValue}%` : `-${c.discountValue.toLocaleString()} ₭`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                    💎 {(c.points || 0).toLocaleString()}
                  </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => { setSelectedDetailCust(c); setShowDetailModal(true); }}
                        style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '1.1rem', padding: '4px' }}
                        title={db.getLabel('auto_ເບິ່ງປະຫວັດການຊື້__POS____56gi44', `ເບິ່ງປະຫວັດການຊື້ (POS + Online)`)}
                      >
                        👁️
                      </button>
                      {hasCustomersPermission('membersEdit') && (
                      <button
                        type="button"
                        onClick={() => handleEditCustomerClick(c)}
                        style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px' }}
                        title={db.getLabel('auto_ແກ້ໄຂສະມາຊິກ_dgugnb', `ແກ້ໄຂສະມາຊິກ`)}
                      >
                        ✏️
                      </button>
                      )}
                      {hasCustomersPermission('membersDelete') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomerClick(c.id, c.name)}
                        style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px' }}
                        title={db.getLabel('auto_ລົບສະມາຊິກ_4rc4ro', `ລົບສະມາຊິກ`)}
                      >
                        🗑️
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {customersList.filter(c => {
                if (!custSearchQuery.trim()) return true;
                const q = custSearchQuery.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.phone.includes(q);
              }).length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    ❌ ບໍ່ພົບຂໍ້ມູນສະມາຊິກໃນລະບົບ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Member Add/Edit Modal (Isolated component) */}
      <CustomerModal 
        show={showCustModal} 
        editingCust={editingCust} 
        onClose={() => {
          setShowCustModal(false);
          setEditingCust(null);
        }} 
        onSave={handleSaveCustomer} 
      />

      {/* Customer Detail Viewer Modal */}
      <CustomerDetailModal
        show={showDetailModal}
        customer={selectedDetailCust}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDetailCust(null);
        }}
      />
    </div>
  );
}
