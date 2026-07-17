import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { db } from '../utils/db';
import Portal from './Portal';
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
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('delivery');
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Translation helper
  const t = (key, defaultText) => {
    const lang = settings.onlineShopLang || 'lo';
    const override = settings.onlineShopTranslations?.[lang]?.[key];
    if (override !== undefined && override !== '') {
      return override;
    }
    return defaultText;
  };

  // Online price helper factoring in markup rate
  const getProductOnlinePrice = (product) => {
    let unitPrice = product.priceOnline || product.price;
    if (customer && customer.tier === 'VIP') {
      unitPrice = product.priceVip || product.price;
    }
    const markupPercent = settings.onlineShopMarkupPercent || 0;
    if (markupPercent > 0) {
      return Math.round(unitPrice * (1 + markupPercent / 100));
    }
    return unitPrice;
  };
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, cart, profile, tracking, chat
  
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

  // Chat states (customer messaging)
  const [chatOrderId, setChatOrderId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatOrder, setChatOrder] = useState(null);
  const [chatAttachments, setChatAttachments] = useState([]);

  const loadData = () => {
    const activeSettings = db.getSettings();
    const disabledCategories = activeSettings.onlineShopDisabledCategories || [];
    
    setProducts(db.getProducts().filter(p => p.showOnline && !disabledCategories.includes(p.categoryId)));
    setCategories(db.getCategories().filter(c => c.type !== 'service' && !disabledCategories.includes(c.id)));
    setSettings(activeSettings);
  };

  // Calculating totals and discounts with markup, coupon, and points
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Dynamic member discount %
  const discountPercent = customer ? (customer.discountValue || 0) : 0;
  const discountAmount = Math.round(cartSubtotal * (discountPercent / 100));

  // Coupon discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      couponDiscount = Math.round(cartSubtotal * (appliedCoupon.value / 100));
    } else {
      couponDiscount = appliedCoupon.value;
    }
  }

  // Points discount
  const maxRedeemablePoints = Math.floor(Math.max(0, cartSubtotal - discountAmount - couponDiscount) / 100);
  const actualRedeemPoints = Math.min(redeemPoints || 0, customer ? (customer.points || 0) : 0, maxRedeemablePoints || 0);
  const pointsDiscount = (actualRedeemPoints || 0) * 100;

  // Shipping Fee calculation
  const customShippingMethods = settings.onlineShopShippingMethods || [];
  const selectedMethod = customShippingMethods.find(m => m.id === selectedShippingMethodId);
  const baseShippingFee = selectedMethod ? (Number(selectedMethod.baseRate) || 0) : (settings.onlineShopShippingFee !== undefined ? (Number(settings.onlineShopShippingFee) || 0) : 15000);
  const isFreeShipping = settings.onlineShopFreeShippingThreshold > 0 && cartSubtotal >= settings.onlineShopFreeShippingThreshold;
  const shippingFee = (shippingMethod === 'pickup' || isFreeShipping) ? 0 : baseShippingFee;

  const cleanSubtotal = Number(cartSubtotal) || 0;
  const cleanDiscount = Number(discountAmount) || 0;
  const cleanCoupon = Number(couponDiscount) || 0;
  const cleanPoints = Number(pointsDiscount) || 0;
  const cleanShipping = Number(shippingFee) || 0;
  const cartTotal = Math.max(0, cleanSubtotal - cleanDiscount - cleanCoupon - cleanPoints + cleanShipping);

  useEffect(() => {
    // Restore customer session from localStorage if it exists
    const savedCustomer = localStorage.getItem('online_customer');
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        setCustomer(parsed);
        setRecipientName(parsed.name || '');
        setPhone(parsed.phone || '');
      } catch (e) {
        console.error('Failed to restore customer session:', e);
      }
    }
    
    setTimeout(() => {
      loadData();
    }, 0);
    const handleUpdate = () => {
      loadData();
      setChatOrder(prev => {
        if (!prev) return null;
        const fresh = db.getOnlineOrders().find(o => o.id === prev.id);
        if (fresh) {
          const hasUnread = fresh.messages && fresh.messages.some(m => m.sender === 'admin' && !m.read);
          if (hasUnread) {
            setTimeout(() => {
              db.markOnlineOrderMessagesAsRead(fresh.id, 'admin');
            }, 0);
          }
          return fresh;
        }
        return prev;
      });
    };
    window.addEventListener('db-updated', handleUpdate);
    return () => window.removeEventListener('db-updated', handleUpdate);
  }, []);

  // Auto-open chat room for logged-in customer when they switch to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && customer && !chatOrder) {
      const inq = db.getOrCreateOnlineInquiry(customer.name, customer.phone);
      setChatOrder(inq);
      localStorage.setItem('active_chat_id', inq.id);
      db.markOnlineOrderMessagesAsRead(inq.id, 'admin');
    }
  }, [activeTab, customer]);

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
      const amount = cartTotal;
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
  }, [settings.bankQrTemplate, cart, customer, cartTotal]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      let user;
      try {
        user = db.authenticateOnlineCustomer(authPhone, authPassword);
      } catch (firstErr) {
        // If local authentication fails, dynamically fetch latest customers from server
        const baseUrl = window.location.protocol + '//' + window.location.host;
        const res = await fetch(`${baseUrl}/api/db/sync?customers=0`);
        const serverData = await res.json();
        if (serverData && serverData.customers) {
          const serverTable = serverData.customers;
          localStorage.setItem('amulet_pos_customers', JSON.stringify(serverTable.data));
          localStorage.setItem('amulet_pos_ts_customers', String(serverTable.updatedAt));
          
          user = db.authenticateOnlineCustomer(authPhone, authPassword);
        } else {
          throw firstErr;
        }
      }
      
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
      const price = getProductOnlinePrice(product);
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        image: product.image,
        price,
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

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (shippingMethod === 'delivery') {
      if (!recipientName.trim() || !phone.trim() || !province.trim() || !city.trim() || !village.trim()) {
        alert('ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງໃຫ້ຄົບຖ້ວນ!');
        return;
      }
    } else {
      if (!recipientName.trim() || !phone.trim() || !addressLine.trim()) {
        alert('ກະລຸນາປ້ອນຊື່, ເບີໂທ ແລະ ວັນທີ/ເວລາທີ່ຈະມາຮັບເຄື່ອງ!');
        return;
      }
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
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponDiscount: couponDiscount,
        redeemedPoints: actualRedeemPoints,
        pointsDiscount: pointsDiscount,
        paymentStatus: 'pending_verification',
        slipImage: slipImage,
        shippingMethod: shippingMethod,
        shippingAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          country: 'Laos',
          province: shippingMethod === 'pickup' ? 'ຮັບຢູ່ໜ້າຮ້ານ (Store Pickup)' : province.trim(),
          city: shippingMethod === 'pickup' ? 'ຮັບຢູ່ໜ້າຮ້ານ' : city.trim(),
          village: shippingMethod === 'pickup' ? 'ຮັບຢູ່ໜ້າຮ້ານ' : village.trim(),
          addressLine: addressLine.trim(),
          notes: notes.trim()
        }
      };

      const newOrder = db.addOnlineOrder(orderData);
      
      // Deduct loyalty points if used
      if (customer && actualRedeemPoints > 0) {
        db.redeemCustomerPoints(customer.id, actualRedeemPoints, pointsDiscount);
        // Refresh customer session state
        const updatedCust = db.getCustomers().find(c => c.id === customer.id);
        if (updatedCust) {
          localStorage.setItem('online_customer', JSON.stringify(updatedCust));
          setCustomer(updatedCust);
        }
      }

      // Deduct stock if auto-sync is active
      if (settings.onlineShopAutoSyncStock !== false) {
        const prodList = db.getProducts();
        cart.forEach(item => {
          const pIdx = prodList.findIndex(p => p.id === item.productId);
          if (pIdx !== -1) {
            prodList[pIdx].stock = Math.max(0, prodList[pIdx].stock - item.qty);
          }
        });
        db.saveProducts(prodList);
      }

      alert(`✓ ສັ່ງຊື້ສິນຄ້າສຳເລັດ! ເລກທີອໍເດີ້: ${newOrder.id}\nກະລຸນາລໍຖ້າການກວດສອບສະລິບຈາກຮ້ານ.`);
      setCart([]);
      setSlipImage('');
      setProvince('');
      setCity('');
      setVillage('');
      setAddressLine('');
      setNotes('');
      setCouponCode('');
      setAppliedCoupon(null);
      setRedeemPoints(0);
      
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

  // Catalog filter and sort
  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
      if (selectedCat === 'wishlist') {
        return matchSearch && wishlist.includes(p.id);
      }
      const matchCat = selectedCat === 'all' || p.category === selectedCat || p.categoryId === selectedCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const sortType = settings.onlineShopProductSort || 'default';
      const aPrice = getProductOnlinePrice(a);
      const bPrice = getProductOnlinePrice(b);
      
      if (sortType === 'priceAsc') return aPrice - bPrice;
      if (sortType === 'priceDesc') return bPrice - aPrice;
      if (sortType === 'newest') {
        return b.id.localeCompare(a.id);
      }
      return 0; // default
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
    <div className="online-shop-container" style={{ maxWidth: '480px', margin: '0 auto', background: '#0e0c0a', minHeight: '100vh', paddingBottom: '90px', color: '#fff' }}>
      <style>{`
        :root {
          --gold-primary: ${settings.onlineShopThemeColor || '#d4af37'} !important;
          --accent-amber: ${settings.onlineShopAccentColor || '#f1c40f'} !important;
        }
        .online-shop-container {
          font-family: ${settings.onlineShopFontFamily || 'Outfit, Phetsarath OT, sans-serif'} !important;
          font-size: ${settings.onlineShopFontSize === 'small' ? '13px' : settings.onlineShopFontSize === 'large' ? '17px' : '15px'} !important;
        }
      `}</style>
      
      {/* 1. TOP HEADER BRAND */}
      <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#141210', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {settings.onlineShopLogo ? (
            <img src={settings.onlineShopLogo} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold-primary)' }} alt="Logo" />
          ) : settings.shopLogo ? (
            <img src={settings.shopLogo} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold-primary)' }} alt="Logo" />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1rem' }}>🪷</div>
          )}
          <div>
            <h1 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--gold-primary)', fontWeight: 'bold' }}>{settings.onlineShopTitle || settings.onlineShopName || settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</h1>
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເບີໂທລະສັບ_ຫຼື_ອີເມວ__Pho_a012b0', `ເບີໂທລະສັບ ຫຼື ອີເມວ (Phone or Email)`)}</label>
                  <input type="text" className="form-control" required placeholder={db.getLabel('auto_020XXXXXXXX_ຫຼື_email_gma_8hluxr', `020XXXXXXXX ຫຼື email@gmail.com`)} value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ລະຫັດຜ່ານ__Password__jpqgy8', `ລະຫັດຜ່ານ (Password)`)}</label>
                  <input type="password" className="form-control" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontWeight: 'bold' }}>🚀 ເຂົ້າສູ່ລະບົບ</button>
                
                <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
                  ຍັງບໍ່ທັນມີບັນຊີແມ່ນບໍ່?{' '}
                  <span onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline' }}>{db.getLabel('auto_ສະໝັກສະມາຊິກໃໝ່_l508k5', `ສະໝັກສະມາຊິກໃໝ່`)}</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', textAlign: 'center', fontSize: '1rem' }}>📝 ສະໝັກສະມາຊິກໃໝ່ (Register)</h3>
                
                {authError && <div style={{ color: '#e74c3c', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(231,76,60,0.1)', padding: '6px', borderRadius: '4px' }}>{authError}</div>}
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ຊື່ລູກຄ້າ___opit3v', `ຊື່ລູກຄ້າ *`)}</label>
                  <input type="text" className="form-control" required placeholder={db.getLabel('auto_ປ້ອນຊື່ຂອງທ່ານ____esn5b9', `ປ້ອນຊື່ຂອງທ່ານ...`)} value={authName} onChange={(e) => setAuthName(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເບີໂທຕິດຕໍ່___fvvciz', `ເບີໂທຕິດຕໍ່ *`)}</label>
                  <input type="tel" className="form-control" required placeholder="020XXXXXXXX" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email (ອີເມວ)</label>
                  <input type="email" className="form-control" placeholder="example@gmail.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ຕັ້ງລະຫັດຜ່ານ__Password___ygoe4s', `ຕັ້ງລະຫັດຜ່ານ (Password) *`)}</label>
                  <input type="password" className="form-control" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <h4 style={{ color: 'var(--gold-primary)', margin: '10px 0 5px', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>📍 ທີ່ຢູ່ຈັດສົ່ງເລີ່ມຕົ້ນ (Default Address)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ແຂວງ___50pwr', `ແຂວງ *`)}</label>
                    <input type="text" className="form-control" required placeholder="ຕົວຢ່າງ: ຈຳປາສັກ" value={regProvince} onChange={(e) => setRegProvince(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເມືອງ___4n77y2', `ເມືອງ *`)}</label>
                    <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຕົວຢ່າງ__ປາກເຊ_j0axbm', `ຕົວຢ່າງ: ປາກເຊ`)} value={regCity} onChange={(e) => setRegCity(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ບ້ານ___h8hr4w', `ບ້ານ *`)}</label>
                  <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຕົວຢ່າງ__ບ້ານພັດທະນາ_3pm0ed', `ຕົວຢ່າງ: ບ້ານພັດທະນາ`)} value={regVillage} onChange={(e) => setRegVillage(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ_85nqhb', `ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ`)}</label>
                  <input type="text" className="form-control" placeholder={db.getLabel('auto_ຮ່ອມ__ເລກທີເຮືອນ____qrunzj', `ຮ່ອມ, ເລກທີເຮືອນ...`)} value={regAddressLine} onChange={(e) => setRegAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ໝາຍເຫດເຖິງຂົນສົ່ງ_hn885y', `ໝາຍເຫດເຖິງຂົນສົ່ງ`)}</label>
                  <input type="text" className="form-control" placeholder={db.getLabel('auto_ຝາກຂົນສົ່ງອະນຸສິດ__ຝາກ_HA_vmqq87', `ຝາກຂົນສົ່ງອະນຸສິດ, ຝາກ HAL...`)} value={regNotes} onChange={(e) => setRegNotes(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontWeight: 'bold' }}>💾 ຢືນຢັນການສະໝັກ</button>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
                  ມີບັນຊີສະມາຊິກແລ້ວ?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline' }}>{db.getLabel('auto_ເຂົ້າສູ່ລະບົບ_gl5wix', `ເຂົ້າສູ່ລະບົບ`)}</span>
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
                  background: settings.onlineShopBannerImg ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${settings.onlineShopBannerImg})` : 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(52,152,219,0.1) 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
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
                    {settings.onlineShopSubtitle || 'ບູຊາພຣະເຄື່ອງແທ້, ກອບຄຸນນະພາບສູງ ຮັບປະກັນ 100%'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>⚡ ຈັດສົ່ງໄວ</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>🛡️ ຮັບປະກັນແທ້</span>
                  </div>
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder={db.getLabel('auto____ຄົ້ນຫາສິນຄ້າ_ຫຼື_ບາໂຄ້_ihvnuz', `🔍 ຄົ້ນຫາສິນຄ້າ ຫຼື ບາໂຄ້ດ...`)}
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
                      {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                        <img src={cat.icon} style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} alt="" />
                      ) : (
                        <span style={{ marginRight: '4px' }}>{cat.icon || '📦'}</span>
                      )}
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Products grid list */}
                <div style={{ display: 'grid', gridTemplateColumns: (settings.onlineShopLayout || 'grid') === 'list' ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  {filteredProducts.map((p, idx) => {
                    const basePrice = getProductOnlinePrice(p);
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

                        <div 
                          style={{ width: '100%', height: '130px', overflow: 'hidden', background: '#000', cursor: 'pointer' }}
                          onClick={() => setSelectedDetailProduct(p)}
                          title="ຄລິກເພື່ອເບິ່ງລາຍລະອຽດ (Click to view details)"
                        >
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                          <h4 
                            style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white', cursor: 'pointer' }}
                            onClick={() => setSelectedDetailProduct(p)}
                            title={db.getLabel('auto_ຄລິກເພື່ອເບິ່ງລາຍລະອຽດ__C_llxi4h', `ຄລິກເພື່ອເບິ່ງລາຍລະອຽດ (Click to view details)`)}
                          >
                            {p.name}
                          </h4>
                          
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
                            <span>{db.getLabel('auto_ຄົງເຫຼືອ__8l71ml', `ຄົງເຫຼືອ:`)} <b>{p.stock} {p.unit || 'ອັນ'}</b></span>
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
                {/* Store Footer / Contact Block */}
                <div className="glass-card" style={{ padding: '16px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.9rem' }}>📞 ຕິດຕໍ່ພວກເຮົາ (Contact Us)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#ccc' }}>
                    <div><b>🏢 ທີ່ຢູ່ຮ້ານ:</b> {settings.onlineShopAddress || settings.shopAddress || 'ປາກເຊ, ແຂວງຈຳປາສັກ'}</div>
                    <div><b>📞 ເບີໂທຕິດຕໍ່:</b> {settings.onlineShopPhone || settings.shopPhone || '02023304555'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
                    {(settings.onlineShopFacebook || settings.facebook) && (
                      <a href={settings.onlineShopFacebook || settings.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🔵 Facebook
                      </a>
                    )}
                    {(settings.onlineShopTelegram || settings.telegram) && (
                      <a href={settings.onlineShopTelegram || settings.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#2ecc71', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🟢 Telegram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

        {/* TABS CART & CHECKOUT */}
        {activeTab === 'cart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🛒 ຕະກ່າສິນຄ້າ ({cart.length} {db.getLabel('auto_ລາຍການ__t3ypbz', `ລາຍການ)`)}</h3>
            
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                <span style={{ fontSize: '3rem' }}>🛒</span>
                <p style={{ marginTop: '12px' }}>{db.getLabel('auto_ບໍ່ມີສິນຄ້າໃນຕະກ່າຂອງທ່ານ_5npb4v', `ບໍ່ມີສິນຄ້າໃນຕະກ່າຂອງທ່ານ`)}</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('catalog')}>{db.getLabel('auto_ໄປຊື້ສິນຄ້າ_opywnx', `ໄປຊື້ສິນຄ້າ`)}</button>
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
                    <span style={{ color: '#888' }}>{db.getLabel('auto_ຍອດລວມສິນຄ້າ__hn05jl', `ຍອດລວມສິນຄ້າ:`)}</span>
                    <span>{cartSubtotal.toLocaleString()} ₭</span>
                  </div>
                  {customer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3498db' }}>
                      <span>{db.getLabel('auto_ສ່ວນຫຼຸດສະມາຊິກ___7qua5n', `ສ່ວນຫຼຸດສະມາຊິກ (`)}{customer.tier} - {discountPercent}%):</span>
                      <span>-{discountAmount.toLocaleString()} ₭</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-green)' }}>
                      <span>{db.getLabel('auto_ສ່ວນຫຼຸດຄູປອງ___elebl7', `ສ່ວນຫຼຸດຄູປອງ (`)}{appliedCoupon.code}):</span>
                      <span>-{couponDiscount.toLocaleString()} ₭</span>
                    </div>
                  )}
                  {redeemPoints > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold-primary)' }}>
                      <span>{db.getLabel('auto_ສ່ວນຫຼຸດຄະແນນສະສົມ___p9cgyu', `ສ່ວນຫຼຸດຄະແນນສະສົມ (`)}{redeemPoints} points):</span>
                      <span>-{pointsDiscount.toLocaleString()} ₭</span>
                    </div>
                  )}
                  {shippingMethod !== 'pickup' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                      <span>{db.getLabel('auto_ຄ່າຈັດສົ່ງສິນຄ້າ__55wbv3', `ຄ່າຈັດສົ່ງສິນຄ້າ:`)}</span>
                      <span>{isFreeShipping ? 'ສົ່ງຟຣີ' : `${shippingFee.toLocaleString()} ₭`}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', color: 'var(--gold-primary)', marginTop: '4px' }}>
                    <span>{db.getLabel('auto_ຍອດຊຳລະສຸດທິ__gth873', `ຍອດຊຳລະສຸດທິ:`)}</span>
                    <span>{cartTotal.toLocaleString()} ₭</span>
                  </div>
                </div>

                {/* Coupons & Points Inputs */}
                <div className="glass-card" style={{ padding: '16px', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.85rem' }}>🎟️ ສ່ວນຫຼຸດ & ຄະແນນສະສົມ (Discounts & Points):</h4>
                  
                  {/* Coupon Input */}
                  <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('coupon', 'ລະຫັດສ່ວນຫຼຸດ')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                      style={{ background: '#1c1916', flex: 1, textTransform: 'uppercase', padding: '8px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                        }}
                        style={{ color: 'var(--alert-red)', borderColor: 'var(--alert-red)', padding: '8px 12px', background: 'rgba(231,76,60,0.1)', cursor: 'pointer' }}
                      >✕ ຍົກເລີກ</button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (!couponCode.trim()) return;
                          const promo = db.getPromotions().find(p => p.code.toUpperCase() === couponCode.trim().toUpperCase() && p.active);
                          if (!promo) {
                            alert('❌ ລະຫັດສ່ວນຫຼຸດນີ້ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ!');
                            return;
                          }
                          if (cartSubtotal < promo.minPurchase) {
                            alert(`❌ ຍອດຊື້ຂັ້ນຕ່ຳເພື່ອໃຊ້ຄູປອງນີ້ແມ່ນ: ${promo.minPurchase.toLocaleString()} ₭`);
                            return;
                          }
                          setAppliedCoupon(promo);
                          alert(`✓ ນຳໃຊ້ຄູປອງສຳເລັດ: ${promo.name}`);
                        }}
                        style={{ padding: '8px 16px', cursor: 'pointer' }}
                      >{db.getLabel('auto_ນຳໃຊ້_c1dqt4', `ນຳໃຊ້`)}</button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--success-green)' }}>
                      ✓ ນຳໃຊ້ຄູປອງ: <b>{appliedCoupon.name}</b> (ສ່ວນຫຼຸດ -{couponDiscount.toLocaleString()} ₭)
                    </span>
                  )}

                  {/* Loyalty Points Input */}
                  {customer && customer.points > 0 && (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#888' }}>{db.getLabel('auto_ຄະແນນສະສົມຂອງທ່ານ__ovguvv', `ຄະແນນສະສົມຂອງທ່ານ:`)}</span>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{(customer.points || 0)} Points</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          className="form-control"
                          placeholder={db.getLabel('auto_ຈຳນວນຄະແນນທີ່ຈະໃຊ້_x06emz', `ຈຳນວນຄະແນນທີ່ຈະໃຊ້`)}
                          value={redeemPoints || ''}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            const maxRedeem = Math.floor(Math.max(0, cartSubtotal - discountAmount - couponDiscount) / 100);
                            const allowed = Math.min(val, (customer.points || 0), maxRedeem);
                            setRedeemPoints(allowed);
                          }}
                          style={{ background: '#1c1916', flex: 1, padding: '8px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            const maxRedeem = Math.floor(Math.max(0, cartSubtotal - discountAmount - couponDiscount) / 100);
                            setRedeemPoints(Math.min((customer.points || 0), maxRedeem));
                          }}
                          style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '8px 12px', cursor: 'pointer' }}
                        >{db.getLabel('auto_ໃຊ້ທັງໝົດ_apdt05', `ໃຊ້ທັງໝົດ`)}</button>
                      </div>
                      {redeemPoints > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)' }}>
                          ✓ ໃຊ້ {redeemPoints} {db.getLabel('auto_ຄະແນນ_ແທນສ່ວນຫຼຸດ__96p7fp', `ຄະແນນ ແທນສ່ວນຫຼຸດ:`)} <b>-{pointsDiscount.toLocaleString()} ₭</b>
                        </span>
                      )}
                    </div>
                  )}
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
                  
                  {/* Shipping Method Selector */}
                  {settings.onlineShopEnablePickup !== false && (
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>🚚 ວິທີການຮັບສິນຄ້າ (Delivery Method):</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            flex: 1,
                            padding: '8px',
                            fontSize: '0.85rem',
                            background: shippingMethod === 'delivery' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                            color: shippingMethod === 'delivery' ? 'black' : 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          onClick={() => setShippingMethod('delivery')}
                        >
                          🚚 ຈັດສົ່ງດ່ວນ
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            flex: 1,
                            padding: '8px',
                            fontSize: '0.85rem',
                            background: shippingMethod === 'pickup' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                            color: shippingMethod === 'pickup' ? 'black' : 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          onClick={() => setShippingMethod('pickup')}
                        >
                          🏪 ຮັບຢູ່ໜ້າຮ້ານ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Custom Shipping Methods List */}
                  {shippingMethod === 'delivery' && settings.onlineShopShippingMethods && settings.onlineShopShippingMethods.length > 0 && (
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>📦 ເລືອກຊ່ອງທາງການຈັດສົ່ງ (Shipping Method):</label>
                      <select
                        className="form-control"
                        required
                        value={selectedShippingMethodId}
                        onChange={(e) => setSelectedShippingMethodId(e.target.value)}
                        style={{ background: '#1c1916', width: '100%', padding: '8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff' }}
                      >
                        <option value="">-- ເລືອກຊ່ອງທາງຈັດສົ່ງ --</option>
                        {settings.onlineShopShippingMethods.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} (+{m.baseRate.toLocaleString()} ₭)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ຊື່ຜູ້ຮັບສິນຄ້າ___qml1rm', `ຊື່ຜູ້ຮັບສິນຄ້າ *`)}</label>
                    <input type="text" className="form-control" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເບີໂທລະສັບຕິດຕໍ່___xeo5er', `ເບີໂທລະສັບຕິດຕໍ່ *`)}</label>
                    <input type="tel" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} style={{ background: '#1c1916' }} />
                  </div>

                  {shippingMethod === 'delivery' ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ແຂວງ___50pwr', `ແຂວງ *`)}</label>
                          <input type="text" className="form-control" placeholder={db.getLabel('auto_ຈຳປາສັກ_rv6new', `ຈຳປາສັກ`)} required value={province} onChange={(e) => setProvince(e.target.value)} style={{ background: '#1c1916' }} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເມືອງ___4n77y2', `ເມືອງ *`)}</label>
                          <input type="text" className="form-control" placeholder={db.getLabel('auto_ປາກເຊ_c0c4b0', `ປາກເຊ`)} required value={city} onChange={(e) => setCity(e.target.value)} style={{ background: '#1c1916' }} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ບ້ານ___h8hr4w', `ບ້ານ *`)}</label>
                        <input type="text" className="form-control" required value={village} onChange={(e) => setVillage(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ_85nqhb', `ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ`)}</label>
                        <input type="text" className="form-control" placeholder={db.getLabel('auto_ຮ່ອມ__ເລກທີເຮືອນ_____mdwq67', `ຮ່ອມ, ເລກທີເຮືອນ,...`)} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>📅 ວັນທີ ແລະ ເວລາທີ່ຈະມາຮັບສິນຄ້າ *</label>
                      <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຕົວຢ່າງ__ວັນເສົາ_10_00_ໂມ_n6gjvt', `ຕົວຢ່າງ: ວັນເສົາ 10:00 ໂມງເຊົ້າ`)} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ໝາຍເຫດເຖິງຮ້ານ_qbu7gk', `ໝາຍເຫດເຖິງຮ້ານ`)}</label>
                    <input type="text" className="form-control" placeholder={db.getLabel('auto_ຝ__ຂົນສົ່ງອະນຸສິດ__ຝາກ_HA_if0mif', `ຝากຂົນສົ່ງອະນຸສິດ, ຝາກ HAL,...`)} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ background: '#1c1916' }} />
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.78rem' }}>
                        {settings.onlineShopBankAccounts && settings.onlineShopBankAccounts.length > 0 ? (
                          settings.onlineShopBankAccounts.map((acc, idx) => (
                            <div key={acc.id} style={{ borderBottom: idx < settings.onlineShopBankAccounts.length - 1 ? '1px dashed rgba(255,255,255,0.05)' : 'none', paddingBottom: '6px', marginTop: idx > 0 ? '6px' : '0' }}>
                              <div><b>{db.getLabel('auto_ທະນາຄານ__kph0bl', `ທະນາຄານ:`)}</b> {acc.bankName}</div>
                              <div><b>{db.getLabel('auto_ຊື່ບັນຊີ__6dn914', `ຊື່ບັນຊີ:`)}</b> {acc.accName}</div>
                              <div><b>{db.getLabel('auto_ເລກບັນຊີ__ewzcax', `ເລກບັນຊີ:`)}</b> <span style={{ fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{acc.accNum}</span></div>
                            </div>
                          ))
                        ) : (
                          <div>
                            <div><b>{db.getLabel('auto_ທະນາຄານ__kph0bl', `ທະນາຄານ:`)}</b> {settings.bankName || 'BCEL One'}</div>
                            <div><b>{db.getLabel('auto_ຊື່ບັນຊີ__6dn914', `ຊື່ບັນຊີ:`)}</b> {settings.bankAccountName || 'ຮ້ານຂອບພຣະ'}</div>
                            <div><b>{db.getLabel('auto_ເລກບັນຊີ__ewzcax', `ເລກບັນຊີ:`)}</b> <span style={{ fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{settings.bankAccountNumber || '010XXXXXXXXXXXX'}</span></div>
                          </div>
                        )}
                      </div>
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
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ຊື່ຜູ້ຮັບ_5aa6oq', `ຊື່ຜູ້ຮັບ`)}</label>
                        <input type="text" className="form-control" placeholder={customer.name} value={newRecipientName} onChange={(e) => setNewRecipientName(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ເບີໂທລະສັບ_nrnku0', `ເບີໂທລະສັບ`)}</label>
                        <input type="tel" className="form-control" placeholder={customer.phone} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ແຂວງ___50pwr', `ແຂວງ *`)}</label>
                          <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຈຳປາສັກ_rv6new', `ຈຳປາສັກ`)} value={newProvince} onChange={(e) => setNewProvince(e.target.value)} style={{ background: '#1c1916' }} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ເມືອງ___4n77y2', `ເມືອງ *`)}</label>
                          <input type="text" className="form-control" required placeholder={db.getLabel('auto_ປາກເຊ_c0c4b0', `ປາກເຊ`)} value={newCity} onChange={(e) => setNewCity(e.target.value)} style={{ background: '#1c1916' }} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ບ້ານ___h8hr4w', `ບ້ານ *`)}</label>
                        <input type="text" className="form-control" required placeholder={db.getLabel('auto_ບ້ານ____xxmd3s', `ບ້ານ...`)} value={newVillage} onChange={(e) => setNewVillage(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ_85nqhb', `ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ`)}</label>
                        <input type="text" className="form-control" placeholder={db.getLabel('auto_ຮ່ອມ__ເລກທີເຮືອນ____qrunzj', `ຮ່ອມ, ເລກທີເຮືອນ...`)} value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ໝາຍເຫດຂົນສົ່ງ_vy84gv', `ໝາຍເຫດຂົນສົ່ງ`)}</label>
                        <input type="text" className="form-control" placeholder={db.getLabel('auto_ຝາກຂົນສົ່ງ____hppccq', `ຝາກຂົນສົ່ງ...`)} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ background: '#1c1916' }} />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>💾 ບັນທຶກທີ່ຢູ່ໃໝ່</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {!customer.addresses || customer.addresses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.75rem', color: '#888' }}>{db.getLabel('auto_ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ_couia0', `ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ`)}</div>
                      ) : (
                        customer.addresses.map((addr, idx) => (
                          <div key={idx} style={{ padding: '10px', background: '#0e0c0a', borderRadius: '8px', border: addr.isDefault ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ fontSize: '0.75rem', flexGrow: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                👤 {addr.recipientName || customer.name} ({addr.phone || customer.phone})
                                {addr.isDefault && <span style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'var(--gold-primary)', color: '#000', borderRadius: '4px', fontWeight: 'bold' }}>{db.getLabel('auto_ຫຼັກ_1wtxk1', `ຫຼັກ`)}</span>}
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
                placeholder={db.getLabel('auto__້ອນເລກອໍເດີ້_ຫຼື_ບັດຕິດຕ_o82k08', `ป້ອນເລກອໍເດີ້ ຫຼື ບັດຕິດຕາມ (ຕົວຢ່າງ: JOB10001)...`)}
                value={trackingOrderId}
                onChange={(e) => setTrackingOrderId(e.target.value)}
                style={{ background: '#1c1916', margin: 0 }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', whiteSpace: 'nowrap', margin: 0 }}>{db.getLabel('auto_ຄົ້ນຫາ_rupbhu', `ຄົ້ນຫາ`)}</button>
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
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{db.getLabel('auto_ອໍເດີ້ເລກທີ__gfpyfc', `ອໍເດີ້ເລກທີ:`)}</span>
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
                    <div><b>{db.getLabel('auto_ຜູ້ຮັບ__ew7fbl', `ຜູ້ຮັບ:`)}</b> {trackedOrder.customerName} ({trackedOrder.customerPhone})</div>
                    <div><b>{db.getLabel('auto_ຍອດລວມ__sgo11t', `ຍອດລວມ:`)}</b> {trackedOrder.total.toLocaleString()} LAK</div>
                    {trackedOrder.shippingCompany && <div><b>{db.getLabel('auto_ຂົນສົ່ງ__2yzpre', `ຂົນສົ່ງ:`)}</b> {trackedOrder.shippingCompany}</div>}
                    {trackedOrder.trackingNumber && <div><b>{db.getLabel('auto_ເລກພັດສະດຸ__smih8r', `ເລກພັດສະດຸ:`)}</b> <b style={{ color: 'var(--gold-primary)' }}>{trackedOrder.trackingNumber}</b></div>}
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

      {/* === CHAT TAB === */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>💬 ສົ່ງຂໍ້ຄວາມຫາຮ້ານ</h3>

          {!customer ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', background: '#141210', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2.5rem' }}>🔒</div>
              <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '1rem' }}>{db.getLabel('auto_ກະລຸນາ_Login_ກ່ອນ_bj9te9', `ກະລຸນາ Login ກ່ອນ`)}</div>
              <div style={{ color: '#aaa', fontSize: '0.82rem' }}>{db.getLabel('auto_ເພື່ອສົ່ງຂໍ້ຄວາມຫາທາງຮ້ານ_2zeqx5', `ເພື່ອສົ່ງຂໍ້ຄວາມຫາທາງຮ້ານ ກະລຸນາ Login ເຂົ້າສູ່ລະບົບກ່ອນ`)}</div>
              <button type="button" className="btn btn-primary" onClick={() => setActiveTab('profile')} style={{ padding: '10px 28px', fontSize: '0.85rem' }}>
                👤 ໄປຫນ້າ Login
              </button>
            </div>
          ) : !chatOrder ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>⏳ ກຳລັງໂຫຼດຫ້ອງແຊັດ...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>💬 ຫ້ອງສົນທະນາ:</div>
                  <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>{chatOrder.customerName}</div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#555' }}>ID: {chatOrder.id}</div>
              </div>

              {/* Messages */}
              <div id="chat-messages-customer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px' }}>
                {(() => {
                  const liveOrder = db.getOnlineOrders().find(o => o.id === chatOrder.id);
                  const msgs = liveOrder?.messages || [];
                  if (msgs.length === 0) return <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', paddingTop: '60px' }}>📭 ຍັງບໍ່ມີຂໍ້ຄວາມ — ພິມແລ້ວສົ່ງຫາຮ້ານໄດ້ເລີຍ!</div>;
                  return msgs.map((msg, idx) => (
                    <div key={idx} style={{ alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start', background: msg.sender === 'customer' ? 'rgba(212,175,55,0.15)' : 'rgba(52,152,219,0.15)', border: `1px solid ${msg.sender === 'customer' ? 'rgba(212,175,55,0.3)' : 'rgba(52,152,219,0.3)'}`, borderRadius: msg.sender === 'customer' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', maxWidth: '82%' }}>
                      <div style={{ fontSize: '0.62rem', color: '#888', marginBottom: '3px' }}>
                        {msg.sender === 'customer' ? '✦ ທ່ານ' : '🏪 ຮ້ານ'}{' • '}{new Date(msg.timestamp).toLocaleString('lo-LA')}
                      </div>
                      {msg.text && <div style={{ fontSize: '0.85rem', color: 'white', wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.text}</div>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: msg.text ? '8px' : 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.attachments.map((att, ai) => (
                            att.type === 'image' ? <img key={ai} src={att.data} alt={att.name} style={{ maxWidth: '160px', maxHeight: '160px', borderRadius: '8px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => window.open(att.data)} />
                            : att.type === 'video' ? <video key={ai} src={att.data} controls style={{ maxWidth: '200px', borderRadius: '8px' }} />
                            : <a key={ai} href={att.data} download={att.name} style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textDecoration: 'underline' }}>📎 {att.name}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Attachment preview */}
              {chatAttachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {chatAttachments.map((att, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      {att.type === 'image' ? <img src={att.data} alt={att.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                       : att.type === 'video' ? <div style={{ width: '56px', height: '56px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
                       : <div style={{ padding: '4px 8px', background: 'rgba(212,175,55,0.1)', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--gold-primary)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {att.name}</div>}
                      <button onClick={() => setChatAttachments(prev => prev.filter((_,j) => j !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', border: 'none', borderRadius: '50%', width: '16px', height: '16px', color: 'white', cursor: 'pointer', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input bar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '42px', height: '42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '1.15rem', flexShrink: 0 }}>
                  📎
                  <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={(e) => {
                      Array.from(e.target.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file';
                          setChatAttachments(prev => [...prev, { type, name: file.name, data: ev.target.result }]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ພິມຂໍ້ຄວາມ... (Enter ເພື່ອສົ່ງ)"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (chatMessage.trim() || chatAttachments.length > 0)) {
                      db.addMessageToOnlineOrder(chatOrder.id, 'customer', chatMessage.trim(), chatOrder.customerName || 'ລູກຄ້າ', chatAttachments);
                      setChatMessage(''); setChatAttachments([]);
                      const fresh = db.getOnlineOrders().find(o => o.id === chatOrder.id);
                      if (fresh) setChatOrder(fresh);
                      setTimeout(() => { const b = document.getElementById('chat-messages-customer'); if (b) b.scrollTop = b.scrollHeight; }, 100);
                    }
                  }}
                  style={{ flex: 1, background: '#1c1916', margin: 0, fontSize: '0.85rem', height: '42px' }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!chatMessage.trim() && chatAttachments.length === 0}
                  style={{ padding: '0 18px', height: '42px', margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => {
                    if (!chatMessage.trim() && chatAttachments.length === 0) return;
                    db.addMessageToOnlineOrder(chatOrder.id, 'customer', chatMessage.trim(), chatOrder.customerName || 'ລູກຄ້າ', chatAttachments);
                    setChatMessage(''); setChatAttachments([]);
                    const fresh = db.getOnlineOrders().find(o => o.id === chatOrder.id);
                    if (fresh) setChatOrder(fresh);
                    setTimeout(() => { const b = document.getElementById('chat-messages-customer'); if (b) b.scrollTop = b.scrollHeight; }, 100);
                  }}
                >
                  📤 ສົ່ງ
                </button>
              </div>
            </div>
          )}
        </div>
      )}


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
          <span>{t('home', 'ສິນຄ້າ')}</span>
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
          <span>{t('cart', 'ຕະກ່າ')}</span>
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
          <span>{t('tracking', 'ຕິດຕາມ')}</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'chat' ? 'var(--gold-primary)' : '#888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>💬</span>
          <span>{t('chat', 'ສອບຖາມ')}</span>
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
          <span>{db.getLabel('auto_ໂປຣໄຟລ໌_uv7wgc', `ໂປຣໄຟລ໌`)}</span>
        </button>
      </nav>

      {/* Product Detail Modal */}
      {selectedDetailProduct && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px', background: '#12100e', color: 'white', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.2)', padding: '16px', position: 'relative' }}>
            
            {/* Close button */}
            <button 
              type="button"
              className="btn-secondary" 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} 
              onClick={() => setSelectedDetailProduct(null)}
            >
              ✕
            </button>

            {/* Product Image */}
            <div style={{ width: '100%', height: '280px', overflow: 'hidden', borderRadius: '12px', background: '#000', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const imgs = selectedDetailProduct.images && selectedDetailProduct.images.length > 0
                  ? selectedDetailProduct.images
                  : [selectedDetailProduct.image];
                const currentImg = imgs[activeImageIdx] || selectedDetailProduct.image;
                
                return (
                  <>
                    <img 
                      src={currentImg} 
                      alt={selectedDetailProduct.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                    
                    {imgs.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx(prev => (prev - 1 + imgs.length) % imgs.length)}
                          style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 5 }}
                        >
                          ‹
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx(prev => (prev + 1) % imgs.length)}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 5 }}
                        >
                          ›
                        </button>
                        
                        <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '6px', zIndex: 5 }}>
                          {imgs.map((_, i) => (
                            <span
                              key={i}
                              onClick={() => setActiveImageIdx(i)}
                              style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === activeImageIdx ? 'var(--gold-primary)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'inline-block' }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Product Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'white', lineHeight: '1.4' }}>
                {selectedDetailProduct.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                  {(selectedDetailProduct.priceOnline || selectedDetailProduct.price).toLocaleString()} ₭
                </span>
                {selectedDetailProduct.priceVip && selectedDetailProduct.priceVip !== (selectedDetailProduct.priceOnline || selectedDetailProduct.price) && (
                  <span style={{ fontSize: '0.8rem', color: '#888', background: 'rgba(52,152,219,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                    💎 VIP: <b style={{ color: '#3498db' }}>{selectedDetailProduct.priceVip.toLocaleString()} ₭</b>
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', gap: '15px' }}>
                <span>{db.getLabel('auto_ຄົງເຫຼືອໃນສາງ__mm7zmg', `ຄົງເຫຼືອໃນສາງ:`)} <b style={{ color: selectedDetailProduct.stock > 0 ? '#2ecc71' : '#e74c3c' }}>{selectedDetailProduct.stock} {selectedDetailProduct.unit || 'ອັນ'}</b></span>
                <span>{db.getLabel('auto_ໝວດໝູ່__6g08d4', `ໝວດໝູ່:`)} <b>{categories.find(c => c.id === selectedDetailProduct.category)?.name || 'ທົ່ວໄປ'}</b></span>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                  📝 ລາຍລະອຽດສິນຄ້າ (Description):
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#ccc', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedDetailProduct.description || 
                    "ສິນຄ້າຄຸນນະພາບສູງຈາກຮ້ານ ຂອບພຣະ ປາກເຊ, ຜະລິດ ແລະ ອອກແບບດ້ວຍຄວາມປານີດ ຮັບປະກັນຄວາມເພິ່ງພໍໃຈ 100%."}
                </p>
              </div>

              {/* Add to cart action */}
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedDetailProduct);
                    setSelectedDetailProduct(null);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={selectedDetailProduct.stock <= 0}
                >
                  {selectedDetailProduct.stock > 0 ? (
                    <>🛒 ໃສ່ຕະກ່າສິນຄ້າ</>
                  ) : (
                    <>🛑 ສິນຄ້າໝົດ</>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
