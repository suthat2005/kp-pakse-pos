import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { db } from '../utils/db';
import OrderTracking from './OrderTracking';

const accountConfig = {
  LAK: { mid: 'mch64f01defcb310', code: '418' },
  THB: { mid: 'mch64f01defcb310_THB', code: '764' },
  USD: { mid: 'mch64f01defcb310_USD', code: '840' }
};

const normalizePhone = (num) => {
  if (!num) return '';
  let clean = num.replace(/\D/g, '');
  if (clean.startsWith('020')) {
    clean = clean.substring(3);
  } else if (clean.startsWith('20')) {
    clean = clean.substring(2);
  }
  return clean;
};

const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function OnlineShop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, cart, profile, tracking
  
  // Auth states
  const [customer, setCustomer] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Registration detailed address states
  const [regProvince, setRegProvince] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regAddressLine, setRegAddressLine] = useState('');
  const [regNotes, setRegNotes] = useState('');

  // Wishlist states
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('online_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const toggleWishlist = (id) => {
    const next = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    setWishlist(next);
    localStorage.setItem('online_wishlist', JSON.stringify(next));
  };

  // Profile addresses management states
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddAddrForm, setShowAddAddrForm] = useState(false);
  
  // Catalog states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  
  // Cart states
  const [cart, setCart] = useState([]);
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [notes, setNotes] = useState('');
  const [slipImage, setSlipImage] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutQrUrl, setCheckoutQrUrl] = useState('');
  
  // Tracking states
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);

  const loadData = () => {
    setProducts(db.getProducts().filter(p => p.showOnline));
    setCategories(db.getCategories().filter(c => c.type !== 'service'));
    setSettings(db.getSettings());
  };

  useEffect(() => {
    // Clear session to force login on every load/visit
    localStorage.removeItem('online_customer');
    
    setTimeout(() => {
      loadData();
    }, 0);
    const handleUpdate = () => loadData();
    window.addEventListener('db-updated', handleUpdate);
    return () => window.removeEventListener('db-updated', handleUpdate);
  }, []);

  useEffect(() => {
    // Decode a data:image base64 QR using jsQR to get the EMVCo payload
    const decodeImageToPayload = (dataUrl) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(decoded && decoded.data ? decoded.data : null);
        } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });

    const injectAmountAndGenerate = async (payload, amount, setter, fallbackUrl) => {
      try {
        const tags = {};
        let index = 0;
        
        // Parse the EMVCo string into tag-length-value map
        while (index < payload.length) {
          if (index + 4 > payload.length) break;
          const tag = payload.substring(index, index + 2);
          const len = parseInt(payload.substring(index + 2, index + 4), 10);
          index += 4;
          if (index + len > payload.length) break;
          const val = payload.substring(index, index + len);
          index += len;
          tags[tag] = val;
        }

        // Keep Tag 01 as "11" (Static QR) to bypass UnionPay/WeChat selector gateways!
        tags['01'] = '11';

        // Set or update Tag 54 (Amount) dynamically
        const amountVal = Math.round(Number(amount) || 0);
        if (amountVal > 0) {
          tags['54'] = String(amountVal);
        } else {
          delete tags['54'];
        }

        // Remove old CRC tag 63
        delete tags['63'];

        // Serialize tags in sorted numerical order to comply strictly with EMVCo standards
        let serialized = '';
        Object.keys(tags).sort().forEach(tag => {
          const val = tags[tag];
          const lenStr = String(val.length).padStart(2, '0');
          serialized += tag + lenStr + val;
        });

        // Append Tag 63 (CRC-16) header
        serialized += '6304';

        // Calculate CRC-16 (CCITT, Polynomial 1021)
        let crc = 0xFFFF;
        for (let c = 0; c < serialized.length; c++) {
          crc ^= (serialized.charCodeAt(c) << 8);
          for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
              crc = (crc << 1) ^ 0x1021;
            } else {
              crc = crc << 1;
            }
          }
        }
        const crcStr = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        const finalPayload = serialized + crcStr;

        const dataUrl = await QRCode.toDataURL(finalPayload, { width: 300, margin: 1 });
        setter(dataUrl);
      } catch (err) {
        console.error('QR inject error:', err);
        setter(fallbackUrl || '');
      }
    };

    const generateQr = async () => {
      // Compute amount directly from cart to avoid temporal dead zone
      const sub = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const disc = customer ? Math.round(sub * ((customer.discountValue || 0) / 100)) : 0;
      const amount = Math.max(0, sub - disc);
      const template = settings.bankQrTemplate;

      if (!template) {
        setCheckoutQrUrl('');
        return;
      }

      try {
        // Case 1: already an EMVCo text payload → inject amount directly
        if (template.startsWith('000201')) {
          await injectAmountAndGenerate(template, amount, setCheckoutQrUrl, '');
          return;
        }
        // Case 2: data:image (uploaded QR photo) → decode with jsQR → inject amount
        if (template.startsWith('data:image/')) {
          const decoded = await decodeImageToPayload(template);
          if (decoded && decoded.startsWith('000201')) {
            await injectAmountAndGenerate(decoded, amount, setCheckoutQrUrl, template);
          } else {
            setCheckoutQrUrl(template);
          }
          return;
        }
        // Case 3: qrserver.com URL → extract data param → append amount → generate locally
        let payload = template;
        if (template.includes('api.qrserver.com/v1/create-qr-code/')) {
          const urlObj = new URL(template);
          const dataParam = urlObj.searchParams.get('data');
          if (dataParam) payload = dataParam + amount;
          else payload = template + amount;
        } else {
          payload = template + amount;
        }
        const dataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
        setCheckoutQrUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR:', err);
        setCheckoutQrUrl('');
      }
    };

    generateQr();
  }, [settings.bankQrTemplate, cart, customer]);

  useEffect(() => {
    if (customer) {
      setTimeout(() => {
        setRecipientName(customer.name || '');
        setPhone(customer.phone || '');
        if (customer.addresses && customer.addresses.length > 0) {
          const def = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
          setProvince(def.province || '');
          setCity(def.city || '');
          setVillage(def.village || '');
          setAddressLine(def.addressLine || '');
          setNotes(def.notes || '');
        }
        
        const params = new URLSearchParams(window.location.search);
        const trackId = params.get('track');
        if (trackId) {
          setTrackingOrderId(trackId);
          const queryId = trackId.toUpperCase().trim();
          const matchOnline = db.getOnlineOrders().find(o => o.id.toUpperCase().trim() === queryId);
          if (matchOnline) {
            setTrackedOrder({ type: 'online', ...matchOnline });
            setActiveTab('tracking');
          } else {
            const matchJob = db.getFramingJobs().find(j => j.id.toUpperCase().trim() === queryId);
            if (matchJob) {
              setTrackedOrder({ type: 'job', ...matchJob });
              setActiveTab('tracking');
            }
          }
        }
      }, 0);
    }
  }, [customer]);

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const user = db.authenticateOnlineCustomer(authPhone, authPassword);
      setCustomer(user);
      localStorage.setItem('online_customer', JSON.stringify(user));
      setRecipientName(user.name);
      setPhone(user.phone);
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authName.trim() || !authPhone.trim() || !authPassword.trim()) {
      setAuthError('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!');
      return;
    }
    try {
      const addressData = regProvince.trim() ? {
        recipientName: authName.trim(),
        phone: authPhone.trim(),
        province: regProvince.trim(),
        city: regCity.trim(),
        village: regVillage.trim(),
        addressLine: regAddressLine.trim(),
        notes: regNotes.trim()
      } : null;

      const user = db.registerOnlineCustomer(
        authName.trim(), authPhone.trim(), authPassword.trim(),
        addressData, authEmail.trim()
      );
      setCustomer(user);
      localStorage.setItem('online_customer', JSON.stringify(user));
      setRecipientName(user.name);
      setPhone(user.phone);
      setAuthName('');
      setAuthPhone('');
      setAuthEmail('');
      setAuthPassword('');
      setRegProvince('');
      setRegCity('');
      setRegVillage('');
      setRegAddressLine('');
      setRegNotes('');
      alert('✓ ສະໝັກສະມາຊິກສຳເລັດ!');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setCustomer(null);
    localStorage.removeItem('online_customer');
  };

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      // Determine base price based on customer VIP tier status
      let unitPrice = product.priceOnline || product.price;
      if (customer && customer.tier === 'VIP') {
        unitPrice = product.priceVip || product.price;
      }
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        image: product.image,
        price: unitPrice,
        qty: 1
      }]);
    }
    alert('✓ ເພີ່ມສິນຄ້າໃສ່ຕະກ່າແລ້ວ!');
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => item.productId === productId ? { ...item, qty } : item));
    }
  };

  // Calculating totals and discounts
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Dynamic member discount %
  const discountPercent = customer ? (customer.discountValue || 0) : 0;
  const discountAmount = Math.round(cartSubtotal * (discountPercent / 100));
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!recipientName.trim() || !phone.trim() || !province.trim() || !city.trim() || !village.trim()) {
      alert('ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງໃຫ້ຄົບຖ້ວນ!');
      return;
    }
    if (!slipImage) {
      alert('ກະລຸນາອັບໂຫຼດສະລິບການໂອນເງິນເພື່ອແນບຫຼັກຖານຊຳລະ!');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderData = {
        customerId: customer ? customer.id : null,
        customerName: recipientName.trim(),
        customerPhone: phone.trim(),
        items: cart.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          total: i.price * i.qty
        })),
        total: cartTotal,
        paymentStatus: 'pending_verification',
        slipImage: slipImage,
        shippingAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          country: 'Laos',
          province: province.trim(),
          city: city.trim(),
          village: village.trim(),
          addressLine: addressLine.trim(),
          notes: notes.trim()
        }
      };

      const newOrder = db.addOnlineOrder(orderData);
      alert(`✓ ສັ່ງຊື້ສິນຄ້າສຳເລັດ! ເລກທີອໍເດີ້: ${newOrder.id}\nກະລຸນາລໍຖ້າການກວດສອບສະລິບຈາກຮ້ານ.`);
      setCart([]);
      setSlipImage('');
      setProvince('');
      setCity('');
      setVillage('');
      setAddressLine('');
      setNotes('');
      
      // Auto redirect to tracking page
      setTrackedOrder(newOrder);
      setTrackingOrderId(newOrder.id);
      setActiveTab('tracking');
    } catch (err) {
      alert('ຜິດພາດ: ' + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    const queryId = trackingOrderId.toUpperCase().trim();
    const matchOnline = db.getOnlineOrders().find(o => o.id.toUpperCase().trim() === queryId);
    if (matchOnline) {
      setTrackedOrder({ type: 'online', ...matchOnline });
      return;
    }
    const matchJob = db.getFramingJobs().find(j => j.id.toUpperCase().trim() === queryId);
    if (matchJob) {
      setTrackedOrder({ type: 'job', ...matchJob });
      return;
    }
    setTrackedOrder(null);
    alert('❌ ບໍ່ພົບຂໍ້ມູນອໍເດີ້ ຫຼື ບັດຕິດຕາມເລກທີນີ້!');
  };

  // Catalog filter
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.barcode && p.barcode.includes(searchQuery));
    if (selectedCat === 'wishlist') {
      return matchSearch && wishlist.includes(p.id);
    }
    const matchCat = selectedCat === 'all' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'unpaid': return '#e74c3c';
      case 'pending_verification': return '#f1c40f';
      case 'paid': return '#2ecc71';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#0e0c0a', minHeight: '100vh', paddingBottom: '90px', color: '#fff', fontFamily: 'Outfit, Phetsarath OT, sans-serif' }}>
      
      {/* 1. TOP HEADER BRAND */}
      <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#141210', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1rem' }}>🪷</div>
          <div>
            <h1 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--gold-primary)', fontWeight: 'bold' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</h1>
            <p style={{ fontSize: '0.6rem', color: '#888', margin: 0 }}>Online Store • Mobile First</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {customer ? (
            <div onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(212,175,55,0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', fontSize: '0.75rem' }}>
              👑 {customer.tier}
            </div>
          ) : (
            <button className="btn" onClick={() => setActiveTab('profile')} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}>🔒 Login</button>
          )}
        </div>
      </header>

      {/* 2. MAIN TABS CONTENT */}
      <div style={{ padding: '16px' }}>
        {!customer ? (
          /* LOGIN & SIGNUP VIEWS - Forced */
          <div className="glass-card" style={{ padding: '24px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)' }}>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', textAlign: 'center', fontSize: '1rem' }}>🔒 ເົ້າສູ່ລະບົບສະມາຊິກ (Login)</h3>
                
                {authError && <div style={{ color: '#e74c3c', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(231,76,60,0.1)', padding: '6px', borderRadius: '4px' }}>{authError}</div>}
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ເບີໂທລະສັບ (Phone)</label>
                  <input type="tel" className="form-control" required placeholder="020XXXXXXXX" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ລະຫັດຜ່ານ (Password)</label>
                  <input type="password" className="form-control" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontWeight: 'bold' }}>🚀 ເຂົ້າສູ່ລະບົບ</button>
                
                <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
                  ຍັງບໍ່ທັນມີບັນຊີແມ່ນບໍ່?{' '}
                  <span onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline' }}>ສະໝັກສະມາຊິກໃໝ່</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', textAlign: 'center', fontSize: '1rem' }}>📝 ສະໝັກສະມາຊິກໃໝ່ (Register)</h3>
                
                {authError && <div style={{ color: '#e74c3c', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(231,76,60,0.1)', padding: '6px', borderRadius: '4px' }}>{authError}</div>}
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ຊື່ລູກຄ້າ *</label>
                  <input type="text" className="form-control" required placeholder="ປ້ອນຊື່ຂອງທ່ານ..." value={authName} onChange={(e) => setAuthName(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ເບີໂທຕິດຕໍ່ *</label>
                  <input type="tel" className="form-control" required placeholder="020XXXXXXXX" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email (ອີເມວ)</label>
                  <input type="email" className="form-control" placeholder="example@gmail.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ຕັ້ງລະຫັດຜ່ານ (Password) *</label>
                  <input type="password" className="form-control" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <h4 style={{ color: 'var(--gold-primary)', margin: '10px 0 5px', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>📍 ທີ່ຢູ່ຈັດສົ່ງເລີ່ມຕົ້ນ (Default Address)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ແຂວງ *</label>
                    <input type="text" className="form-control" required placeholder="ຕົວຢ່າງ: ຈຳປາສັກ" value={regProvince} onChange={(e) => setRegProvince(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ເມືອງ *</label>
                    <input type="text" className="form-control" required placeholder="ຕົວຢ່າງ: ປາກເຊ" value={regCity} onChange={(e) => setRegCity(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ບ້ານ *</label>
                  <input type="text" className="form-control" required placeholder="ຕົວຢ່າງ: ບ້ານພັດທະນາ" value={regVillage} onChange={(e) => setRegVillage(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ</label>
                  <input type="text" className="form-control" placeholder="ຮ່ອມ, ເລກທີເຮືອນ..." value={regAddressLine} onChange={(e) => setRegAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>ໝາຍເຫດເຖິງຂົນສົ່ງ</label>
                  <input type="text" className="form-control" placeholder="ຝາກຂົນສົ່ງອະນຸສິດ, ຝາກ HAL..." value={regNotes} onChange={(e) => setRegNotes(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontWeight: 'bold' }}>💾 ຢືນຢັນການສະໝັກ</button>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
                  ມີບັນຊີສະມາຊິກແລ້ວ?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline' }}>ເຂົ້າສູ່ລະບົບ</span>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* TABS CATALOG VIEW */}
            {activeTab === 'catalog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Hero Promotion Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(52,152,219,0.1) 100%)',
                  border: '1.5px solid rgba(212,175,55,0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '4.5rem', opacity: 0.15 }}>🪷</div>
                  <h2 style={{ fontSize: '1.15rem', color: 'var(--gold-primary)', margin: 0, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {settings.onlineShopBanner || 'ຮ້ານພຣະເຄື່ອງອອນລາຍ KP Pakse'}
                  </h2>
                  <p style={{ fontSize: '0.72rem', color: '#ccc', margin: 0 }}>
                    ບູຊາພຣະເຄື່ອງແທ້, ກອບຄຸນນະພາບສູງ ຮັບປະກັນ 100%
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>⚡ ຈັດສົ່ງໄວ</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>🛡️ ຮັບປະກັນແທ້</span>
                  </div>
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="🔍 ຄົ້ນຫາສິນຄ້າ ຫຼື ບາໂຄ້ດ..."
                  className="form-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: '#1c1916', border: '1px solid rgba(255,255,255,0.08)', margin: 0 }}
                />

                {/* Category horizontal scroller */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                  <button
                    onClick={() => setSelectedCat('all')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: selectedCat === 'all' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                      background: selectedCat === 'all' ? 'rgba(212,175,55,0.12)' : '#1c1916',
                      color: selectedCat === 'all' ? 'var(--gold-primary)' : '#888',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    ທັງໝົດ
                  </button>
                  <button
                    onClick={() => setSelectedCat('wishlist')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: selectedCat === 'wishlist' ? '#e74c3c' : 'rgba(255,255,255,0.08)',
                      background: selectedCat === 'wishlist' ? 'rgba(231,76,60,0.12)' : '#1c1916',
                      color: selectedCat === 'wishlist' ? '#e74c3c' : '#888',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    ❤️ Wishlist ({wishlist.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: selectedCat === cat.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                        background: selectedCat === cat.id ? 'rgba(212,175,55,0.12)' : '#1c1916',
                        color: selectedCat === cat.id ? 'var(--gold-primary)' : '#888',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Products grid list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {filteredProducts.map((p, idx) => {
                    const basePrice = p.priceOnline || p.price;
                    const showVipPrice = p.priceVip && p.priceVip !== basePrice;
                    const isWishlisted = wishlist.includes(p.id);
                    
                    // Assign simple decorative labels
                    let badgeText = '';
                    let badgeColor = '';
                    if (idx === 0) { badgeText = '🔥 BEST'; badgeColor = '#e74c3c'; }
                    else if (idx === 1) { badgeText = '✨ ມາໃໝ່'; badgeColor = '#2ecc71'; }
                    else if (p.stock < 5 && p.stock > 0) { badgeText = '⚠️ ໃກ້ໝົດ'; badgeColor = '#f1c40f'; }

                    return (
                      <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#141210', padding: 0, position: 'relative' }}>
                        
                        {/* Wishlist toggle button */}
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: isWishlisted ? '#e74c3c' : '#ccc',
                            transition: 'all 0.2s',
                            zIndex: 10
                          }}
                        >
                          {isWishlisted ? '❤️' : '🤍'}
                        </button>

                        {/* Decorative Badge */}
                        {badgeText && (
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: badgeColor,
                            color: '#000',
                            fontSize: '0.58rem',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            zIndex: 10
                          }}>
                            {badgeText}
                          </span>
                        )}

                        <div style={{ width: '100%', height: '130px', overflow: 'hidden', background: '#000' }}>
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                          <h4 style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>{p.name}</h4>
                          
                          {/* Rating and review mockup */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#f1c40f' }}>
                            <span>⭐️ 4.8</span>
                            <span style={{ color: '#888' }}>(12 reviews)</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>{basePrice.toLocaleString()} ₭</span>
                            {showVipPrice && (
                              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                                💎 VIP: <b style={{ color: '#3498db' }}>{p.priceVip.toLocaleString()} ₭</b>
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#888', marginTop: '6px' }}>
                            <span>ຄົງເຫຼືອ: <b>{p.stock} {p.unit || 'ອັນ'}</b></span>
                          </div>

                          <button
                            onClick={() => addToCart(p)}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '6px', fontSize: '0.75rem', marginTop: '8px', borderRadius: '6px', fontWeight: 'bold' }}
                            disabled={p.stock <= 0}
                          >
                            {p.stock > 0 ? '🛒 ໃສ່ກະຕ່າ' : '🛑 ສິນຄ້າໝົດ'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

        {/* TABS CART & CHECKOUT */}
        {activeTab === 'cart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🛒 ຕະກ່າສິນຄ້າ ({cart.length} ລາຍການ)</h3>
            
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                <span style={{ fontSize: '3rem' }}>🛒</span>
                <p style={{ marginTop: '12px' }}>ບໍ່ມີສິນຄ້າໃນຕະກ່າຂອງທ່ານ</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('catalog')}>ໄປຊື້ສິນຄ້າ</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Cart items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cart.map(item => (
                    <div key={item.productId} className="glass-card" style={{ display: 'flex', gap: '12px', padding: '10px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', maxHeight: '20px', overflow: 'hidden' }}>{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{item.price.toLocaleString()} ₭</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                          <button onClick={() => updateCartQty(item.productId, item.qty - 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: '#1c1916', color: '#fff', cursor: 'pointer' }}>-</button>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.qty}</span>
                          <button onClick={() => updateCartQty(item.productId, item.qty + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: '#1c1916', color: '#fff', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                      <button onClick={() => updateCartQty(item.productId, 0)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '1.1rem', cursor: 'pointer', padding: '0 8px' }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Member Discounts breakdown */}
                <div className="glass-card" style={{ padding: '14px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>ຍອດລວມສິນຄ້າ:</span>
                    <span>{cartSubtotal.toLocaleString()} ₭</span>
                  </div>
                  {customer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3498db' }}>
                      <span>ສ່ວນຫຼຸດສະມາຊິກ ({customer.tier} - {discountPercent}%):</span>
                      <span>-{discountAmount.toLocaleString()} ₭</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', color: 'var(--gold-primary)', marginTop: '4px' }}>
                    <span>ຍອດຊຳລະສຸດທິ:</span>
                    <span>{cartTotal.toLocaleString()} ₭</span>
                  </div>
                </div>

                {/* Shipping Form & QR Payment */}
                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: '10px 0 0' }}>🚚 ທີ່ຢູ່ຈັດສົ່ງສິນຄ້າ (Shipping Address):</h4>
                  {customer && customer.addresses && customer.addresses.length > 0 && (
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--gold-primary)' }}>📍 ເລືອກທີ່ຢູ່ຈັດສົ່ງທີ່ບັນທຶກໄວ້</label>
                      <select
                        className="form-control"
                        style={{ background: '#1c1916', width: '100%', padding: '8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff' }}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          if (idx >= 0 && customer.addresses[idx]) {
                            const addr = customer.addresses[idx];
                            setRecipientName(addr.recipientName || customer.name);
                            setPhone(addr.phone || customer.phone);
                            setProvince(addr.province || '');
                            setCity(addr.city || '');
                            setVillage(addr.village || '');
                            setAddressLine(addr.addressLine || '');
                            setNotes(addr.notes || '');
                          }
                        }}
                      >
                        <option value="">-- ເລືອກຈາກທີ່ຢູ່ທີ່ບັນທຶກໄວ້ --</option>
                        {customer.addresses.map((addr, idx) => (
                          <option key={idx} value={idx}>
                            📍 {addr.village}, {addr.city}, {addr.province} ({addr.recipientName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ຊື່ຜູ້ຮັບພັດສະດຸ *</label>
                    <input type="text" className="form-control" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ເບີໂທລະສັບຕິດຕໍ່ *</label>
                    <input type="tel" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ແຂວງ *</label>
                      <input type="text" className="form-control" placeholder="ຈຳປາສັກ" required value={province} onChange={(e) => setProvince(e.target.value)} style={{ background: '#1c1916' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ເມືອງ *</label>
                      <input type="text" className="form-control" placeholder="ປາກເຊ" required value={city} onChange={(e) => setCity(e.target.value)} style={{ background: '#1c1916' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ບ້ານ *</label>
                    <input type="text" className="form-control" required value={village} onChange={(e) => setVillage(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ</label>
                    <input type="text" className="form-control" placeholder="ຮ່ອມ, ເລກທີເຮືອນ,..." value={addressLine} onChange={(e) => setAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>ໝາຍເຫດເຖິງຮ້ານ</label>
                    <input type="text" className="form-control" placeholder="ຝາກຂົນສົ່ງອະນຸສິດ, ຝາກ HAL,..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>

                  {/* BCEL ONE QR CODE DISPLAY */}
                  <div className="glass-card" style={{ padding: '16px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', marginTop: '10px' }}>
                    <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', fontSize: '0.85rem' }}>📱 ສະແກນຊຳລະຜ່ານ BCEL One QR:</h4>
                    <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', display: 'inline-block', marginBottom: '10px' }}>
                      {checkoutQrUrl ? (
                        <img
                          src={checkoutQrUrl}
                          alt="BCEL QR Code"
                          style={{ width: '160px', height: '160px', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.75rem' }}>
                          ກຳລັງໂຫຼດ QR Code...
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px', color: '#fff' }}>
                      <div><b>ທະນາຄານ:</b> {settings.bankName || 'BCEL One'}</div>
                      <div><b>ຊື່ບັນຊີ:</b> {settings.bankAccountName || 'ຮ້ານຂອບພຣະ'}</div>
                      <div><b>ເລກບັນຊີ:</b> {settings.bankAccountNumber || '010XXXXXXXXXXXX'}</div>
                    </div>
                  </div>

                  {/* SLIP UPLOAD */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>📸 ແນບຫຼັກຖານສະລິບການໂອນເງິນ *</label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      className="form-control"
                      style={{ background: '#1c1916' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const compressed = await compressImage(reader.result);
                            setSlipImage(compressed);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {slipImage && (
                      <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <img src={slipImage} alt="Payment Slip Preview" style={{ maxHeight: '150px', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold', marginTop: '10px' }}
                    disabled={submittingOrder}
                  >
                    {submittingOrder ? '🔄 ກຳລັງສົ່ງອໍເດີ້...' : '💾 ຢືນຢັນການສັ່ງຊື້'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TABS PROFILE & REGISTRATION */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* VIP info card */}
                <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(20,18,16,0.5) 100%)', border: '1.5px solid var(--gold-primary)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--gold-primary)' }}>👑 ຂໍ້ມູນສະມາຊິກ</h3>
                    <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: '#3498db', color: 'white', fontWeight: 'bold' }}>{customer.tier} Tier</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '6px' }}>{customer.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#aaa' }}>📱 ເບີໂທ: {customer.phone}</div>
                  <div style={{ fontSize: '0.85rem', color: '#aaa' }}>💰 ຍອດຊື້ສະສົມລວມ: <b style={{ color: 'var(--gold-primary)' }}>{(customer.totalSpend || 0).toLocaleString()} ₭</b></div>
                  <div style={{ fontSize: '0.85rem', color: '#aaa' }}>🏷️ ສ່ວນຫຼຸດຂອງທ່ານ: <b style={{ color: '#2ecc71' }}>{customer.discountValue || 0}%</b></div>
                  
                  <button className="btn" onClick={handleLogout} style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)', width: 'fit-content' }}>
                    🚪 ອອກຈາກລະບົບ
                  </button>
                </div>

                {/* Saved Addresses list & management */}
                <div className="glass-card" style={{ padding: '16px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: 'var(--gold-primary)' }}>📍 ທີ່ຢູ່ຈັດສົ່ງຂອງທ່ານ:</h4>
                    <button
                      onClick={() => setShowAddAddrForm(!showAddAddrForm)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        background: 'rgba(212,175,55,0.1)',
                        color: 'var(--gold-primary)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {showAddAddrForm ? '✕ ປິດຟອມ' : '➕ ເພີ່ມທີ່ຢູ່ໃໝ່'}
                    </button>
                  </div>

                  {showAddAddrForm ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const newAddr = {
                        recipientName: newRecipientName.trim() || customer.name,
                        phone: newPhone.trim() || customer.phone,
                        province: newProvince.trim(),
                        city: newCity.trim(),
                        village: newVillage.trim(),
                        addressLine: newAddressLine.trim(),
                        notes: newNotes.trim(),
                        isDefault: (customer.addresses || []).length === 0
                      };
                      const updated = [...(customer.addresses || []), newAddr];
                      const freshCust = db.saveCustomerAddresses(customer.id, updated);
                      if (freshCust) {
                        setCustomer(freshCust);
                        setShowAddAddrForm(false);
                        setNewRecipientName('');
                        setNewPhone('');
                        setNewProvince('');
                        setNewCity('');
                        setNewVillage('');
                        setNewAddressLine('');
                        setNewNotes('');
                        alert('✓ ເພີ່ມທີ່ຢູ່ຈັດສົ່ງໃໝ່ສຳເລັດ!');
                      }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>ຊື່ຜູ້ຮັບ</label>
                        <input type="text" className="form-control" placeholder={customer.name} value={newRecipientName} onChange={(e) => setNewRecipientName(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>ເບີໂທລະສັບ</label>
                        <input type="tel" className="form-control" placeholder={customer.phone} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>ແຂວງ *</label>
                          <input type="text" className="form-control" required placeholder="ຈຳປາສັກ" value={newProvince} onChange={(e) => setNewProvince(e.target.value)} style={{ background: '#1c1916' }} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>ເມືອງ *</label>
                          <input type="text" className="form-control" required placeholder="ປາກເຊ" value={newCity} onChange={(e) => setNewCity(e.target.value)} style={{ background: '#1c1916' }} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>ບ້ານ *</label>
                        <input type="text" className="form-control" required placeholder="ບ້ານ..." value={newVillage} onChange={(e) => setNewVillage(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ</label>
                        <input type="text" className="form-control" placeholder="ຮ່ອມ, ເລກທີເຮືອນ..." value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>ໝາຍເຫດຂົນສົ່ງ</label>
                        <input type="text" className="form-control" placeholder="ຝາກຂົນສົ່ງ..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>💾 ບັນທຶກທີ່ຢູ່ໃໝ່</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {!customer.addresses || customer.addresses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.75rem', color: '#888' }}>ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ</div>
                      ) : (
                        customer.addresses.map((addr, idx) => (
                          <div key={idx} style={{ padding: '10px', background: '#0e0c0a', borderRadius: '8px', border: addr.isDefault ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ fontSize: '0.75rem', flexGrow: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                👤 {addr.recipientName || customer.name} ({addr.phone || customer.phone})
                                {addr.isDefault && <span style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'var(--gold-primary)', color: '#000', borderRadius: '4px', fontWeight: 'bold' }}>ຫຼັກ</span>}
                              </div>
                              <div style={{ color: '#ccc', marginTop: '2px' }}>
                                {addr.village}, {addr.city}, {addr.province}
                                {addr.addressLine ? ` (${addr.addressLine})` : ''}
                              </div>
                              {addr.notes && <div style={{ color: '#888', fontStyle: 'italic', marginTop: '2px' }}>* {addr.notes}</div>}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {!addr.isDefault && (
                                <button
                                  onClick={() => {
                                    const updated = customer.addresses.map((a, i) => ({ ...a, isDefault: i === idx }));
                                    const fresh = db.saveCustomerAddresses(customer.id, updated);
                                    if (fresh) setCustomer(fresh);
                                  }}
                                  style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '0.65rem', textDecoration: 'underline', padding: 0 }}
                                >
                                  ຕັ້ງເປັນທີ່ຢູ່ຫຼັກ
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (window.confirm("ຕ້ອງການລົບທີ່ຢູ່ນີ້ແທ້ບໍ່?")) {
                                    const updated = customer.addresses.filter((_, i) => i !== idx);
                                    if (updated.length > 0 && !updated.some(a => a.isDefault)) updated[0].isDefault = true;
                                    const fresh = db.saveCustomerAddresses(customer.id, updated);
                                    if (fresh) setCustomer(fresh);
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.65rem', textDecoration: 'underline', padding: 0, alignSelf: 'flex-end' }}
                              >
                                ລົບ
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Customer order history list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>📋 ປະຫວັດການສັ່ງຊື້ຂອງທ່ານ (Online Orders):</h4>
                    {db.getOnlineOrders().filter(o => o.customerId === customer.id).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', fontSize: '0.8rem', background: '#141210', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        ທ່ານຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {db.getOnlineOrders().filter(o => o.customerId === customer.id).map(o => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setTrackingOrderId(o.id);
                              setTrackedOrder({ type: 'online', ...o });
                              setActiveTab('tracking');
                            }}
                            style={{
                              padding: '10px 14px',
                              background: '#141210',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>{o.id}</div>
                              <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(o.date).toLocaleDateString('lo-LA')}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{o.total.toLocaleString()} ₭</div>
                              <div style={{ fontSize: '0.7rem', color: getOrderStatusColor(o.paymentStatus), fontWeight: 'bold' }}>
                                {o.paymentStatus === 'paid' ? 'ຊຳລະແລ້ວ' : o.paymentStatus === 'pending_verification' ? 'ລໍຖ້າກວດສອບ' : 'ປະຕິເສດ'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* POS Framing Jobs History */}
                  <div>
                    <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>🖼️ ບັດຕິດຕາມສະຖານະຮ້ານຂອງທ່ານ (POS Framing Jobs):</h4>
                    {db.getFramingJobs().filter(j => normalizePhone(j.customerPhone) === normalizePhone(customer.phone)).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', fontSize: '0.8rem', background: '#141210', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        ບໍ່ມີຂໍ້ມູນບັດຕິດຕາມສະຖານະຮ້ານ
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {db.getFramingJobs().filter(j => normalizePhone(j.customerPhone) === normalizePhone(customer.phone)).map(j => (
                          <div
                            key={j.id}
                            onClick={() => {
                              setTrackingOrderId(j.id);
                              setTrackedOrder({ type: 'job', ...j });
                              setActiveTab('tracking');
                            }}
                            style={{
                              padding: '10px 14px',
                              background: '#141210',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>{j.id}</div>
                              <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                {j.amuletDescription || (j.amulets && j.amulets.map(a => a.description).join(', ')) || 'ກອບຮູບພຣະ'}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '2px' }}>
                                ວັນທີ: {j.createdDate ? new Date(j.createdDate).toLocaleDateString('lo-LA') : '-'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{(j.totalPrice || 0).toLocaleString()} ₭</div>
                              <div style={{ fontSize: '0.7rem', color: j.status === 'picked_up' ? '#2ecc71' : j.status === 'done' ? '#3498db' : '#f1c40f', fontWeight: 'bold' }}>
                                {j.status === 'picked_up' ? 'ຮັບເຄື່ອງແລ້ວ' : j.status === 'done' ? 'ສໍາເລັດແລ້ວ' : j.status === 'in_progress' ? 'ກຳລັງເຮັດ' : 'ລໍຖ້າຄິວ'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
          </div>
        )}

        {/* TABS TRACKING VIEW */}
        {activeTab === 'tracking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🔍 ຕິດຕາມສະຖານະອໍເດີ້</h3>
            
            <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="ป້ອນເລກອໍເດີ້ ຫຼື ບັດຕິດຕາມ (ຕົວຢ່າງ: JOB10001)..."
                value={trackingOrderId}
                onChange={(e) => setTrackingOrderId(e.target.value)}
                style={{ background: '#1c1916', margin: 0 }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', whiteSpace: 'nowrap', margin: 0 }}>ຄົ້ນຫາ</button>
            </form>

            {/* Tracking Result View */}
            {trackedOrder ? (
              trackedOrder.type === 'job' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <OrderTracking jobId={trackedOrder.id} isInline={true} />
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '20px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>ອໍເດີ້ເລກທີ:</span>
                      <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>{trackedOrder.id}</h4>
                    </div>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: getOrderStatusColor(trackedOrder.paymentStatus)
                    }}>
                      {getOrderStatusColor(trackedOrder.paymentStatus) === '#2ecc71' ? 'ชຳລະແລ້ວ' : 'ລໍຖ້າກວດສອບ'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><b>ຜູ້ຮັບ:</b> {trackedOrder.customerName} ({trackedOrder.customerPhone})</div>
                    <div><b>ຍອດລວມ:</b> {trackedOrder.total.toLocaleString()} LAK</div>
                    {trackedOrder.shippingCompany && <div><b>ຂົນສົ່ງ:</b> {trackedOrder.shippingCompany}</div>}
                    {trackedOrder.trackingNumber && <div><b>ເລກພັດສະດຸ:</b> <b style={{ color: 'var(--gold-primary)' }}>{trackedOrder.trackingNumber}</b></div>}
                  </div>

                  {/* Parcel photo if available */}
                  {trackedOrder.shippingImage && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '160px' }}>
                      <img src={trackedOrder.shippingImage} alt="Shipping parcel" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                    </div>
                  )}

                  {/* Timeline progress steps */}
                  <div style={{ marginTop: '10px' }}>
                    <h5 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', fontSize: '0.85rem' }}>🕒 ສະຖານະອໍເດີ້:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '14px', marginLeft: '6px' }}>
                      {trackedOrder.timeline?.map((evt, idx) => (
                        <div key={idx} style={{ position: 'relative', fontSize: '0.75rem' }}>
                          <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-primary)' }} />
                          <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{evt.status}</div>
                          <div style={{ fontSize: '0.65rem', color: '#888' }}>{new Date(evt.date).toLocaleString('lo-LA')}</div>
                          <div style={{ color: '#fff', marginTop: '2px' }}>{evt.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.85rem' }}>
                ກະລຸນາປ້ອນເລກອໍເດີ້ ຫຼື ບັດຕິດຕາມຂ້າງເທິງເພື່ອຕິດຕາມສະຖານະ
              </div>
            )}
          </div>
        )}
      </>
    )}
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: '#141210',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100
      }}>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'catalog' ? 'var(--gold-primary)' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🛍️</span>
          <span>ສິນຄ້າ</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'cart' ? 'var(--gold-primary)' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🛒</span>
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e74c3c', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.6rem', fontWeight: 'bold' }}>
              {cart.reduce((sum, i) => sum + i.qty, 0)}
            </span>
          )}
          <span>ຕະກ່າ</span>
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'tracking' ? 'var(--gold-primary)' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🔍</span>
          <span>ຕິດຕາມ</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'profile' ? 'var(--gold-primary)' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>ໂປຣໄຟລ໌</span>
        </button>
      </nav>
    </div>
  );
}
