import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { db } from '../utils/db';
import Portal from './Portal';
import OrderTracking from './OrderTracking';

const _accountConfig = {
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
  const [_chatOrderId, _setChatOrderId] = useState('');
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
    if (savedCustomer && savedCustomer !== 'null' && savedCustomer !== 'undefined') {
      try {
        const parsed = JSON.parse(savedCustomer);
        if (parsed && typeof parsed === 'object') {
          queueMicrotask(() => {
            setCustomer(parsed);
            setRecipientName(parsed.name || '');
            setPhone(parsed.phone || '');
          });
        } else {
          localStorage.removeItem('online_customer');
        }
      } catch (e) {
        console.error('Failed to restore customer session:', e);
        localStorage.removeItem('online_customer');
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
      queueMicrotask(() => setChatOrder(inq));
      localStorage.setItem('active_chat_id', inq.id);
      db.markOnlineOrderMessagesAsRead(inq.id, 'admin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="online-shop-container" style={{ maxWidth: '480px', margin: '0 auto', background: 'var(--shop-bg)', minHeight: '100vh', paddingBottom: '90px', color: 'var(--shop-text)' }}>
      <style>{`
        /* ─── Online Shop Light Theme Variables ────────────────── */
        .online-shop-container {
          font-family: ${settings.onlineShopFontFamily || 'Outfit, Phetsarath OT, sans-serif'} !important;
          font-size: ${settings.onlineShopFontSize === 'small' ? '13px' : settings.onlineShopFontSize === 'large' ? '17px' : '15px'} !important;
          --shop-brand:    ${settings.onlineShopThemeColor || '#7c3aed'};
          --shop-brand-lt: ${settings.onlineShopThemeColor ? settings.onlineShopThemeColor + '1a' : '#7c3aed1a'};
          --shop-accent:   ${settings.onlineShopAccentColor || '#ec4899'};
          --shop-bg:       #faf8f5;
          --shop-bg2:      #ffffff;
          --shop-card:     #ffffff;
          --shop-card2:    #f3f0eb;
          --shop-text:     #1a1a2e;
          --shop-muted:    #6b7280;
          --shop-border:   rgba(0,0,0,0.08);
          --shop-shadow:   0 2px 16px rgba(0,0,0,0.08);
          --shop-shadow-h: 0 8px 32px rgba(0,0,0,0.14);
          --shop-radius:   16px;
          --shop-radius-s: 10px;
          --shop-success:  #059669;
          --shop-danger:   #dc2626;
          --shop-warn:     #d97706;
        }
        /* Override POS dark globals inside shop */
        .online-shop-container .form-control {
          background: #ffffff !important;
          border: 1.5px solid rgba(0,0,0,0.12) !important;
          color: var(--shop-text) !important;
          border-radius: 10px !important;
        }
        .online-shop-container .form-control:focus {
          border-color: var(--shop-brand) !important;
          box-shadow: 0 0 0 3px ${settings.onlineShopThemeColor || '#7c3aed'}26 !important;
        }
        .online-shop-container .form-label {
          color: var(--shop-muted) !important;
          font-size: 0.78rem !important;
          font-weight: 600 !important;
        }
        .online-shop-container .btn-primary {
          background: var(--shop-brand) !important;
          border-color: var(--shop-brand) !important;
          color: #ffffff !important;
        }
        .online-shop-container .btn-primary:hover {
          filter: brightness(1.1);
        }
        .online-shop-container .btn-secondary {
          background: rgba(0,0,0,0.06) !important;
          border-color: rgba(0,0,0,0.1) !important;
          color: var(--shop-text) !important;
        }
        .online-shop-container .glass-card {
          background: var(--shop-card) !important;
          border: 1px solid var(--shop-border) !important;
          box-shadow: var(--shop-shadow) !important;
        }
        /* Select elements (dropdown) */
        .online-shop-container select.form-control,
        .online-shop-container select {
          background: #ffffff !important;
          color: var(--shop-text) !important;
          border: 1.5px solid rgba(0,0,0,0.12) !important;
          border-radius: 10px !important;
        }
        /* File input */
        .online-shop-container input[type="file"] {
          background: var(--shop-card2) !important;
          color: var(--shop-text) !important;
          border: 1.5px dashed var(--shop-border) !important;
          border-radius: 10px !important;
          padding: 10px !important;
        }
        /* Modal background */
        .online-shop-container .modal-overlay {
          background: rgba(0,0,0,0.45) !important;
        }
        /* Scrollbar light */
        .online-shop-container ::-webkit-scrollbar { width: 4px; height: 4px; }
        .online-shop-container ::-webkit-scrollbar-track { background: #f3f0eb; }
        .online-shop-container ::-webkit-scrollbar-thumb { background: var(--shop-brand); border-radius: 99px; }
        /* Bottom nav */
        .shop-bottom-nav {
          position: fixed;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 100%; max-width: 480px;
          background: #ffffff;
          border-top: 1px solid rgba(0,0,0,0.07);
          display: flex;
          z-index: 200;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
        }
        .shop-nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 0 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          gap: 3px;
          transition: color 0.15s;
          font-family: inherit;
          color: #9ca3af;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .shop-nav-btn.active { color: var(--shop-brand); }
        .shop-nav-btn svg { transition: transform 0.15s; }
        .shop-nav-btn.active svg { transform: scale(1.15); }
        /* Category pills */
        .shop-cat-pill {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1.5px solid rgba(0,0,0,0.1);
          background: #ffffff;
          color: var(--shop-muted);
          font-size: 0.73rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.18s;
          font-family: inherit;
          font-weight: 500;
        }
        .shop-cat-pill.active {
          background: var(--shop-brand);
          border-color: var(--shop-brand);
          color: #ffffff;
          font-weight: 700;
        }
        /* Product card */
        .shop-product-card {
          background: var(--shop-card);
          border-radius: var(--shop-radius);
          border: 1px solid var(--shop-border);
          overflow: hidden;
          box-shadow: var(--shop-shadow);
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .shop-product-card:hover {
          box-shadow: var(--shop-shadow-h);
          transform: translateY(-2px);
        }
        /* Animations */
        @keyframes shopFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shop-fade { animation: shopFadeIn 0.3s ease; }
      `}</style>
      
      {/* 1. TOP HEADER BRAND */}
      <header style={{
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--shop-border)',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {settings.onlineShopLogo ? (
            <img src={settings.onlineShopLogo} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--shop-brand)' }} alt="Logo" />
          ) : settings.shopLogo ? (
            <img src={settings.shopLogo} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--shop-brand)' }} alt="Logo" />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--shop-brand-lt)', border: '2px solid var(--shop-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--shop-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1rem', margin: 0, color: 'var(--shop-text)', fontWeight: 800, letterSpacing: '-0.3px' }}>{settings.onlineShopTitle || settings.onlineShopName || settings.shopName || 'KP Pakse'}</h1>
            <p style={{ fontSize: '0.6rem', color: 'var(--shop-muted)', margin: 0, fontWeight: 500 }}>Online Store</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {customer ? (
            <div onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--shop-brand-lt)', padding: '5px 12px', borderRadius: '20px', border: '1.5px solid var(--shop-brand)', fontSize: '0.72rem', color: 'var(--shop-brand)', fontWeight: 700 }}>
              {customer.tier}
            </div>
          ) : (
            <button className="btn" onClick={() => setActiveTab('profile')} style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '20px', background: 'var(--shop-brand)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Login</button>
          )}
        </div>
      </header>

      {/* 2. MAIN TABS CONTENT */}
      <div style={{ padding: '16px' }}>
        {!customer ? (
          /* LOGIN & SIGNUP VIEWS */
          <div style={{ background: '#ffffff', borderRadius: 'var(--shop-radius)', padding: '28px 24px', boxShadow: 'var(--shop-shadow)', border: '1px solid var(--shop-border)' }}>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', textAlign: 'center', fontSize: '1rem' }}>{db.getLabel('auto____ເົ້າສູ່ລະບົບສະມາຊິກ__L_h7mn8', `🔒 ເົ້າສູ່ລະບົບສະມາຊິກ (Login)`)}</h3>
                
                {authError && <div style={{ color: '#e74c3c', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(231,76,60,0.1)', padding: '6px', borderRadius: '4px' }}>{authError}</div>}
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເບີໂທລະສັບ_ຫຼື_ອີເມວ__Pho_a012b0', `ເບີໂທລະສັບ ຫຼື ອີເມວ (Phone or Email)`)}</label>
                  <input type="text" className="form-control" required placeholder={db.getLabel('auto_020XXXXXXXX_ຫຼື_email_gma_8hluxr', `020XXXXXXXX ຫຼື email@gmail.com`)} value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ລະຫັດຜ່ານ__Password__jpqgy8', `ລະຫັດຜ່ານ (Password)`)}</label>
                  <input type="password" className="form-control" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontWeight: 'bold' }}>{db.getLabel('auto____ເຂົ້າສູ່ລະບົບ_1vfcey', `🚀 ເຂົ້າສູ່ລະບົບ`)}</button>
                
                <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '10px', color: '#888' }}>
                  ຍັງບໍ່ທັນມີບັນຊີແມ່ນບໍ່?{' '}
                  <span onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ color: 'var(--gold-primary)', cursor: 'pointer', textDecoration: 'underline' }}>{db.getLabel('auto_ສະໝັກສະມາຊິກໃໝ່_l508k5', `ສະໝັກສະມາຊິກໃໝ່`)}</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 10px', textAlign: 'center', fontSize: '1rem' }}>{db.getLabel('auto____ສະໝັກສະມາຊິກໃໝ່__Regis_o4nsbt', `📝 ສະໝັກສະມາຊິກໃໝ່ (Register)`)}</h3>
                
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_Email__ອີເມວ__aa0jwx', `Email (ອີເມວ)`)}</label>
                  <input type="email" className="form-control" placeholder="example@gmail.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ຕັ້ງລະຫັດຜ່ານ__Password___ygoe4s', `ຕັ້ງລະຫັດຜ່ານ (Password) *`)}</label>
                  <input type="password" className="form-control" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ background: '#1c1916' }} />
                </div>
                <h4 style={{ color: 'var(--gold-primary)', margin: '10px 0 5px', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>{db.getLabel('auto____ທີ່ຢູ່ຈັດສົ່ງເລີ່ມຕົ້ນ_rl6ksp', `📍 ທີ່ຢູ່ຈັດສົ່ງເລີ່ມຕົ້ນ (Default Address)`)}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ແຂວງ___50pwr', `ແຂວງ *`)}</label>
                    <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຕົວຢ່າງ__ຈຳປາສັກ_i9stiu', `ຕົວຢ່າງ: ຈຳປາສັກ`)} value={regProvince} onChange={(e) => setRegProvince(e.target.value)} style={{ background: '#1c1916' }} />
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
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px', fontWeight: 'bold' }}>{db.getLabel('auto____ຢືນຢັນການສະໝັກ_ps2p50', `💾 ຢືນຢັນການສະໝັກ`)}</button>
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
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>{db.getLabel('auto___ຈັດສົ່ງໄວ_dwb9s1', `⚡ ຈັດສົ່ງໄວ`)}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>{db.getLabel('auto_____ຮັບປະກັນແທ້_pcj2yn', `🛡️ ຮັບປະກັນແທ້`)}</span>
                  </div>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--shop-muted)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    placeholder={db.getLabel('auto____ຄົ້ນຫາສິນຄ້າ_ຫຼື_ບາໂຄ້_ihvnuz', `ຄົ້ນຫາສິນຄ້າ ຫຼື ບາໂຄ້ດ...`)}
                    className="form-control"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                  />
                </div>

                {/* Category horizontal scroller */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => setSelectedCat('all')}
                    className={`shop-cat-pill ${selectedCat === 'all' ? 'active' : ''}`}
                  >
                    ທັງໝົດ
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      className={`shop-cat-pill ${selectedCat === cat.id ? 'active' : ''}`}
                    >
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
                    let badgeBg = '';
                    let badgeTxt = '#fff';
                    if (idx === 0) { badgeText = 'BEST'; badgeBg = '#ef4444'; }
                    else if (idx === 1) { badgeText = 'NEW'; badgeBg = '#10b981'; }
                    else if (p.stock < 5 && p.stock > 0) { badgeText = 'LOW'; badgeBg = '#f59e0b'; badgeTxt = '#000'; }

                    return (
                      <div key={p.id} className="shop-product-card shop-fade">
                        
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
                            background: badgeBg,
                            color: badgeTxt,
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            zIndex: 10,
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}>
                            {badgeText}
                          </span>
                        )}

                        <div
                          style={{ width: '100%', height: '140px', overflow: 'hidden', background: '#f3f0eb', cursor: 'pointer' }}
                          onClick={() => setSelectedDetailProduct(p)}
                          title={db.getLabel('auto_ຄລິກເພື່ອເບິ່ງລາຍລະອຽດ__C_llxi4h', `ຄລິກເພື່ອເບິ່ງລາຍລະອຽດ (Click to view details)`)}
                        >
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                          <h4 
                            style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333', cursor: 'pointer' }}
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
                            <span style={{ fontSize: '0.95rem', color: 'var(--shop-brand)', fontWeight: 'bold' }}>{(basePrice || 0).toLocaleString()} ₭</span>
                            {showVipPrice && (
                              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                                💎 VIP: <b style={{ color: '#3498db' }}>{(p.priceVip || 0).toLocaleString()} ₭</b>
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
                <div style={{ background: '#fff', border: '1px solid var(--shop-border)', borderRadius: 'var(--shop-radius)', padding: '20px', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', textAlign: 'center', boxShadow: 'var(--shop-shadow)' }}>
                  <h4 style={{ color: 'var(--shop-brand)', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{db.getLabel('auto____ຕິດຕົ່ພວກເຮົາ__Contact_1e71k0', `ຕິດຕົ່ພວກເຮົາ`)}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--shop-muted)' }}>
                    <div><b style={{ color: 'var(--shop-text)' }}>ທີ່૪dda້ານ:</b> {settings.onlineShopAddress || settings.shopAddress || 'ປາກເຊ, ແຂວງຈຳປາສັກ'}</div>
                    <div><b style={{ color: 'var(--shop-text)' }}>ເບີໂທຕິດຕົ່:</b> {settings.onlineShopPhone || settings.shopPhone || '02023304555'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
                    {(settings.onlineShopFacebook || settings.facebook) && (
                      <a href={settings.onlineShopFacebook || settings.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                        Facebook
                      </a>
                    )}
                    {(settings.onlineShopTelegram || settings.telegram) && (
                      <a href={settings.onlineShopTelegram || settings.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
                        Telegram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}



        {/* TABS CART & CHECKOUT */}
        {activeTab === 'cart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--shop-text)', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
              {db.getLabel('auto____ຕະກ່າສິນຄ້າ___67ep6z', `ຕະກ່າສິນຄ້າ`)} ({cart.length} {db.getLabel('auto_ລາຍການ__t3ypbz', `ລາຍການ`)})
            </h3>
            
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--shop-muted)', background: '#fff', borderRadius: 'var(--shop-radius)', boxShadow: 'var(--shop-shadow)' }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--shop-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <p style={{ marginTop: '16px', fontWeight: 600, color: 'var(--shop-text)' }}>{db.getLabel('auto_ບໍ່ມີສິນຄ້າໃນຕະກ່າຂອງທ່ານ_5npb4v', `ຕະກ່າຫວ່າງ`)}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--shop-muted)', marginTop: 4 }}>ເລືອກສິນຄ້າເພີ່ມ</p>
                <button className="btn btn-primary" style={{ marginTop: 16, padding: '10px 24px', borderRadius: 20, fontWeight: 700 }} onClick={() => setActiveTab('catalog')}>{db.getLabel('auto_ໄປຊື້ສິນຄ້າ_opywnx', `ເລືອກຊື້ສິນຄ້າ`)}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Cart items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#fff', borderRadius: 'var(--shop-radius-s)', border: '1px solid var(--shop-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', alignItems: 'center' }}>
                      <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--shop-border)' }} />
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--shop-text)', lineHeight: 1.3 }}>{item.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--shop-brand)', fontWeight: 700 }}>{(item.price || 0).toLocaleString()} ₭</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <button onClick={() => updateCartQty(item.productId, item.qty - 1)} style={{ width: '26px', height: '26px', borderRadius: '8px', border: '1.5px solid var(--shop-border)', background: '#f3f0eb', color: 'var(--shop-text)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--shop-text)', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => updateCartQty(item.productId, item.qty + 1)} style={{ width: '26px', height: '26px', borderRadius: '8px', border: '1.5px solid var(--shop-border)', background: '#f3f0eb', color: 'var(--shop-text)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                      <button onClick={() => updateCartQty(item.productId, 0)} style={{ background: 'none', border: 'none', color: 'var(--shop-muted)', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Member Discounts breakdown */}
                <div style={{ background: '#fff', borderRadius: 'var(--shop-radius-s)', border: '1px solid var(--shop-border)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', boxShadow: 'var(--shop-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--shop-muted)' }}>{db.getLabel('auto_ຍອດລວມສິນຄ້າ__hn05jl', `ຍອດລວມ:`)}</span>
                    <span style={{ color: 'var(--shop-text)', fontWeight: 600 }}>{(cartSubtotal || 0).toLocaleString()} ₭</span>
                  </div>
                  {customer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}>
                      <span>{db.getLabel('auto_ສ່ວນຫຼຸດສະມາຊິກ___7qua5n', `ສ່ວນຫຼຸດສະມາຊິກ (`)}{customer.tier} - {discountPercent}%):</span>
                      <span>-{(discountAmount || 0).toLocaleString()} ₭</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--shop-success)' }}>
                      <span>{db.getLabel('auto_ສ່ວນຫຼຸດຄູປອງ___elebl7', `ສ່ວນຫຼຸດຄູປອງ (`)}{appliedCoupon.code}):</span>
                      <span>-{(couponDiscount || 0).toLocaleString()} ₭</span>
                    </div>
                  )}
                  {redeemPoints > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--shop-brand)' }}>
                      <span>{db.getLabel('auto_ສ່ວນຫຼຸດຄະແນນສະສົມ___p9cgyu', `ສ່ວນຫຼຸດຄະແນນສະສົມ (`)}{redeemPoints} points):</span>
                      <span>-{(pointsDiscount || 0).toLocaleString()} ₭</span>
                    </div>
                  )}
                  {shippingMethod !== 'pickup' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--shop-muted)' }}>
                      <span>{db.getLabel('auto_ຄ່າຈັດສົ່ງສິນຄ້າ__55wbv3', `ຄ່າຈັດສົ່ງສິນຄ້າ:`)}</span>
                      <span>{isFreeShipping ? 'ສົ່ງຟຣີ' : `${shippingFee.toLocaleString()} ₭`}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', borderTop: '2px solid var(--shop-border)', paddingTop: '8px', color: 'var(--shop-brand)', marginTop: '4px' }}>
                    <span>{db.getLabel('auto_ຍອດຊຳລະສຸດທິ__gth873', `ຍອດຊຳລະສຸດທິ:`)}</span>
                    <span>{(cartTotal || 0).toLocaleString()} ₭</span>
                  </div>
                </div>

                {/* Coupons & Points Inputs */}
                <div style={{ background: '#fff', borderRadius: 'var(--shop-radius-s)', border: '1px solid var(--shop-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shop-shadow)' }}>
                  <h4 style={{ color: 'var(--shop-brand)', margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{db.getLabel('auto_____ສ່ວນຫຼຸດ___ຄະແນນສະສົມ_fw1tb6', `ສ່ວນຫຼຸດ & ຄະແນນ`)}</h4>
                  
                  {/* Coupon Input */}
                  <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('coupon', 'ລະຫັດສ່ວນຫຼຸດ')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                      style={{ flex: 1, textTransform: 'uppercase' }}
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
                      >{db.getLabel('auto___ຍົກເລີກ_il20hl', `✕ ຍົກເລີກ`)}</button>
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
                      ✓ ນຳໃຊ້ຄູປອງ: <b>{appliedCoupon.name}</b> {db.getLabel('auto__ສ່ວນຫຼຸດ___gj9w36', `(ສ່ວນຫຼຸດ -`)}{couponDiscount.toLocaleString()} ₭)
                    </span>
                  )}

                  {/* Loyalty Points Input */}
                  {customer && customer.points > 0 && (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--shop-border)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--shop-muted)' }}>{db.getLabel('auto_ຄະແນນສະສົມຂອງທ່ານ__ovguvv', `ຄະແນນສະສົມ:`)}</span>
                        <span style={{ color: 'var(--shop-brand)', fontWeight: 'bold' }}>{(customer.points || 0)} Points</span>
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
                          style={{ flex: 1 }}
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
                        <span style={{ fontSize: '0.72rem', color: 'var(--shop-brand)' }}>
                          ✓ ໃຊ້ຄະແນນສະສົມ: <b>{redeemPoints}</b> Points (ສ່ວນຫຼຸດ -{(redeemPoints * 100).toLocaleString()} ₭)
                        </span>
                      )}
                    </div>
                  )}
                {/* Shipping Form & QR Payment */}
                </div>
                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: 'var(--shop-brand)', margin: '10px 0 0', fontWeight: 700 }}>{db.getLabel('auto____ທີ່ຢູ່ຈັດສົ່ງສິນຄ້າ__S_wh7yl2', `ທີ່ຢູ່ຈັດສົ່ງ:`)}</h4>
                  {customer && customer.addresses && customer.addresses.length > 0 && (
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--shop-brand)' }}>{db.getLabel('auto____ເລືອກທີ່ຢູ່ຈັດສົ່ງທີ່ບ_bblquy', `ເລືອກທີ່ຢູ່ທີ່ບັນທຶກໄວ້`)}</label>
                      <select
                        className="form-control"
                        style={{ width: '100%' }}
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
                        <option value="">{db.getLabel('auto____ເລືອກຈາກທີ່ຢູ່ທີ່ບັນທຶ_e3c9ak', `-- ເລືອກຈາກທີ່ຢູ່ທີ່ບັນທຶກໄວ້ --`)}</option>
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
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--shop-brand)' }}>{db.getLabel('auto____ວິທີການຮັບສິນຄ້າ__Deli_1aokn9', `ວິທີການຮັບ:`)}</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            flex: 1,
                            padding: '8px',
                            fontSize: '0.85rem',
                            background: shippingMethod === 'delivery' ? 'var(--shop-brand)' : 'rgba(0,0,0,0.04)',
                            color: shippingMethod === 'delivery' ? '#fff' : 'var(--shop-muted)',
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
                            background: shippingMethod === 'pickup' ? 'var(--shop-brand)' : 'rgba(0,0,0,0.04)',
                            color: shippingMethod === 'pickup' ? '#fff' : 'var(--shop-muted)',
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
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto____ເລືອກຊ່ອງທາງການຈັດສົ່ງ_25x69w', `📦 ເລືອກຊ່ອງທາງການຈັດສົ່ງ (Shipping Method):`)}</label>
                      <select
                        className="form-control"
                        required
                        value={selectedShippingMethodId}
                        onChange={(e) => setSelectedShippingMethodId(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">{db.getLabel('auto____ເລືອກຊ່ອງທາງຈັດສົ່ງ____i0dbgz', `-- ເລືອກຊ່ອງທາງຈັດສົ່ງ --`)}</option>
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
                    <input type="text" className="form-control" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເບີໂທລະສັບຕິດຕໍ່___xeo5er', `ເບີໂທລະສັບຕິດຕໍ່ *`)}</label>
                    <input type="tel" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  {shippingMethod === 'delivery' ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ແຂວງ___50pwr', `ແຂວງ *`)}</label>
                          <input type="text" className="form-control" placeholder={db.getLabel('auto_ຈຳປາສັກ_rv6new', `ຈຳປາສັກ`)} required value={province} onChange={(e) => setProvince(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ເມືອງ___4n77y2', `ເມືອງ *`)}</label>
                          <input type="text" className="form-control" placeholder={db.getLabel('auto_ປາກເຊ_c0c4b0', `ປາກເຊ`)} required value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ບ້ານ___h8hr4w', `ບ້ານ *`)}</label>
                        <input type="text" className="form-control" required value={village} onChange={(e) => setVillage(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ_85nqhb', `ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ`)}</label>
                        <input type="text" className="form-control" placeholder={db.getLabel('auto_ຮ່ອມ__ເລກທີເຮືອນ_____mdwq67', `ຮ່ອມ, ເລກທີເຮືອນ,...`)} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--shop-brand)' }}>{db.getLabel('auto____ວັນທີ_ແລະ_ເວລາທີ່ຈະມາຮ_h6q1qp', `ວັນ/ເວລາທີ່ຈະມາຮັບ *`)}</label>
                      <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຕົວຢ່າງ__ວັນເສົາ_10_00_ໂມ_n6gjvt', `ຕົວຢ່າງ: ວັນເສົາ 10:00 ໂມງເຊົ້າ`)} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{db.getLabel('auto_ໝາຍເຫດເຖິງຮ້ານ_qbu7gk', `ໝາຍເຫດເຖິງຮ້ານ`)}</label>
                    <input type="text" className="form-control" placeholder={db.getLabel('auto_ຝ__ຂົນສົ່ງອະນຸສິດ__ຝາກ_HA_if0mif', `ໝາຍເຫດ...`)} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  {/* BCEL ONE QR CODE DISPLAY */}
                  <div style={{ background: '#fff', borderRadius: 'var(--shop-radius-s)', border: '1px solid var(--shop-border)', padding: '16px', textAlign: 'center', marginTop: '10px', boxShadow: 'var(--shop-shadow)' }}>
                    <h4 style={{ color: 'var(--shop-brand)', margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700 }}>{db.getLabel('auto____ສະແກນຊຳລະຜ່ານ_BCEL_One_cfl4qh', `ຊຳລະຜ່ານ BCEL One QR:`)}</h4>
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
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--shop-text)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: 'var(--shop-card2)', padding: '10px', borderRadius: '8px', fontSize: '0.78rem' }}>
                        {settings.onlineShopBankAccounts && settings.onlineShopBankAccounts.length > 0 ? (
                          settings.onlineShopBankAccounts.map((acc, idx) => (
                            <div key={acc.id} style={{ borderBottom: idx < settings.onlineShopBankAccounts.length - 1 ? '1px dashed var(--shop-border)' : 'none', paddingBottom: '6px', marginTop: idx > 0 ? '6px' : '0' }}>
                              <div><b>{db.getLabel('auto_ທະນາຄານ__kph0bl', `ທະນາຄານ:`)}</b> {acc.bankName}</div>
                              <div><b>{db.getLabel('auto_ຊື່ບັນຊີ__6dn914', `ຊື່ບັນຊີ:`)}</b> {acc.accName}</div>
                              <div><b>{db.getLabel('auto_ເລກບັນຊີ__ewzcax', `ເລກບັນຊີ:`)}</b> <span style={{ fontFamily: 'monospace', color: 'var(--shop-brand)', fontWeight: 700 }}>{acc.accNum}</span></div>
                            </div>
                          ))
                        ) : (
                          <div>
                            <div><b>{db.getLabel('auto_ທະນາຄານ__kph0bl', `ທະນາຄານ:`)}</b> {settings.bankName || 'BCEL One'}</div>
                            <div><b>{db.getLabel('auto_ຊື່ບັນຊີ__6dn914', `ຊື່ບັນຊີ:`)}</b> {settings.bankAccountName || 'ຮ້ານຂອບພຣະ'}</div>
                             <div><b>{db.getLabel('auto_ເລກບັນຊີ__ewzcax', `ເລກບັນຊີ:`)}</b> <span style={{ fontFamily: 'monospace', color: 'var(--shop-brand)', fontWeight: 700 }}>{settings.bankAccountNumber || '010XXXXXXXXXXXX'}</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SLIP UPLOAD */}
                  <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--shop-brand)' }}>{db.getLabel('auto____ແນບຫຼັກຖານສະລິບການໂອນເ_lmx9mq', `ແນບສະລິບການໂອນເງິນ *`)}</label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      className="form-control"
                      style={{ }}
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
                <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--shop-brand) 0%, var(--shop-accent) 100%)', borderRadius: 'var(--shop-radius)', display: 'flex', flexDirection: 'column', gap: '6px', color: '#fff', boxShadow: 'var(--shop-shadow-h)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontWeight: 800 }}>{db.getLabel('auto____ຂໍ້ມູນສະມາຊິກ_c9v969', `ຂໍ້ມູນສະມາຊິກ`)}</h3>
                    <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }}>{customer.tier}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '6px', color: '#fff' }}>{customer.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{db.getLabel('auto____ເບີໂທ__zk8oa', `ເບີໂທ:`)} {customer.phone}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{db.getLabel('auto____ຍອດຊື້ສະສົມລວມ__89uufk', `ຍອດຊື້ສະສົມ:`)} <b style={{ color: '#fff' }}>{(customer.totalSpend || 0).toLocaleString()} ₭</b></div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{db.getLabel('auto_____ສ່ວນຫຼຸດຂອງທ່ານ__1iwaz5', `ສ່ວນຫຼຸດ:`)} <b style={{ color: '#fff' }}>{customer.discountValue || 0}%</b></div>
                  
                  <button className="btn" onClick={handleLogout} style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', width: 'fit-content', borderRadius: '8px', cursor: 'pointer' }}>
                    ອອກຈາກລະບົບ
                  </button>
                </div>

                {/* Saved Addresses list & management */}
                <div style={{ background: '#fff', borderRadius: 'var(--shop-radius)', border: '1px solid var(--shop-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shop-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: 'var(--shop-brand)', fontWeight: 700 }}>{db.getLabel('auto____ທີ່ຢູ່ຈັດສົ່ງຂອງທ່ານ__fllt86', `ທີ່ຢູ່ຂອງທ່ານ`)}</h4>
                    <button
                      onClick={() => setShowAddAddrForm(!showAddAddrForm)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        background: 'var(--shop-brand-lt)',
                        color: 'var(--shop-brand)',
                        border: '1px solid var(--shop-brand)',
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
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--shop-border)', paddingTop: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ຊື່ຜູ້ຮັບ_5aa6oq', `ຊື່ຜູ້ຮັບ`)}</label>
                        <input type="text" className="form-control" placeholder={customer.name} value={newRecipientName} onChange={(e) => setNewRecipientName(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ເບີໂທລະສັບ_nrnku0', `ເບີໂທລະສັບ`)}</label>
                        <input type="tel" className="form-control" placeholder={customer.phone} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ແຂວງ___50pwr', `ແຂວງ *`)}</label>
                           <input type="text" className="form-control" required placeholder={db.getLabel('auto_ຈຳປາສັກ_rv6new', `ຈຳປາສັກ`)} value={newProvince} onChange={(e) => setNewProvince(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ເມືອງ___4n77y2', `ເມືອງ *`)}</label>
                           <input type="text" className="form-control" required placeholder={db.getLabel('auto_ປາກເຊ_c0c4b0', `ປາກເຊ`)} value={newCity} onChange={(e) => setNewCity(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ບ້ານ___h8hr4w', `ບ້ານ *`)}</label>
                         <input type="text" className="form-control" required placeholder={db.getLabel('auto_ບ້ານ____xxmd3s', `ບ້ານ...`)} value={newVillage} onChange={(e) => setNewVillage(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ_85nqhb', `ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ`)}</label>
                         <input type="text" className="form-control" placeholder={db.getLabel('auto_ຮ່ອມ__ເລກທີເຮືອນ____qrunzj', `ຮ່ອມ, ເລກທີເຮືອນ...`)} value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>{db.getLabel('auto_ໝາຍເຫດຂົນສົ່ງ_vy84gv', `ໝາຍເຫດຂົນສົ່ງ`)}</label>
                         <input type="text" className="form-control" placeholder={db.getLabel('auto_ຝາກຂົນສົ່ງ____hppccq', `ໝາຍເຫດ...`)} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>{db.getLabel('auto____ບັນທຶກທີ່ຢູ່ໃໝ່_vkfico', `💾 ບັນທຶກທີ່ຢູ່ໃໝ່`)}</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {!customer.addresses || customer.addresses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.75rem', color: 'var(--shop-muted)' }}>{db.getLabel('auto_ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ_couia0', `ຍັງບໍ່ທັນມີທີ່ຢູ່`)}</div>
                      ) : (
                        customer.addresses.map((addr, idx) => (
                          <div key={idx} style={{ padding: '10px', background: 'var(--shop-card2)', borderRadius: '8px', border: addr.isDefault ? '2px solid var(--shop-brand)' : '1px solid var(--shop-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ fontSize: '0.75rem', flexGrow: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--shop-text)' }}>
                                {addr.recipientName || customer.name} ({addr.phone || customer.phone})
                                {addr.isDefault && <span style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'var(--shop-brand)', color: '#fff', borderRadius: '20px', fontWeight: 700 }}>{db.getLabel('auto_ຫຼັກ_1wtxk1', `ຫຼັກ`)}</span>}
                              </div>
                              <div style={{ color: 'var(--shop-muted)', marginTop: '2px', fontSize: '0.75rem' }}>
                                {addr.village}, {addr.city}, {addr.province}
                                {addr.addressLine ? ` (${addr.addressLine})` : ''}
                              </div>
                              {addr.notes && <div style={{ color: 'var(--shop-muted)', fontStyle: 'italic', marginTop: '2px', fontSize: '0.72rem' }}>* {addr.notes}</div>}
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
                    <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>{db.getLabel('auto____ປະຫວັດການສັ່ງຊື້ຂອງທ່າ_rw1fmt', `📋 ປະຫວັດການສັ່ງຊື້ຂອງທ່ານ (Online Orders):`)}</h4>
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
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{(o.total || 0).toLocaleString()} ₭</div>
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
                    <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px' }}>{db.getLabel('auto_____ບັດຕິດຕາມສະຖານະຮ້ານຂອ_577d9q', `🖼️ ບັດຕິດຕາມສະຖານະຮ້ານຂອງທ່ານ (POS Framing Jobs):`)}</h4>
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
            <h3 style={{ color: 'var(--shop-text)', margin: 0, fontWeight: 800 }}>{db.getLabel('auto____ຕິດຕາມສະຖານະອໍເດີ້_t4to3k', `ຕິດຕາມສະຖານະ`)}</h3>
            
            <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder={db.getLabel('auto__້ອນເລກອໍເດີ້_ຫຼື_ບັດຕິດຕ_o82k08', `ປ້ອນເລກອໍເດີ້ ຫຼື ບັດຕິດຕາມ (ຕົວຢ່າງ: JOB10001)...`)}
                value={trackingOrderId}
                onChange={(e) => setTrackingOrderId(e.target.value)}
                style={{ margin: 0 }}
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
                <div style={{ padding: '20px', background: '#fff', borderRadius: 'var(--shop-radius)', border: '1px solid var(--shop-border)', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shop-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--shop-border)', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--shop-muted)' }}>{db.getLabel('auto_ອໍເດີ້ເລກທີ__gfpyfc', `ອໍເດີ້ເລກທີ:`)}</span>
                      <h4 style={{ color: 'var(--shop-brand)', margin: 0, fontWeight: 700 }}>{trackedOrder.id}</h4>
                    </div>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: getOrderStatusColor(trackedOrder.paymentStatus)
                    }}>
                      {getOrderStatusColor(trackedOrder.paymentStatus) === '#2ecc71' ? 'ຊຳລະແລ້ວ' : 'ລໍຖ້າກວດສອບ'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><b>{db.getLabel('auto_ຜູ້ຮັບ__ew7fbl', `ຜູ້ຮັບ:`)}</b> {trackedOrder.customerName} ({trackedOrder.customerPhone})</div>
                    <div><b>{db.getLabel('auto_ຍອດລວມ__sgo11t', `ຍອດລວມ:`)}</b> {(trackedOrder.total || 0).toLocaleString()} LAK</div>
                    {trackedOrder.shippingCompany && <div><b>{db.getLabel('auto_ຂົນສົ່ງ__2yzpre', `ຂົນສົ່ງ:`)}</b> {trackedOrder.shippingCompany}</div>}
                    {trackedOrder.trackingNumber && <div><b>{db.getLabel('auto_ເລກພັດສະດຸ__smih8r', `ເລກພັດສະດຸ:`)}</b> <b style={{ color: 'var(--shop-brand)', fontFamily: 'monospace' }}>{trackedOrder.trackingNumber}</b></div>}
                  </div>

                  {/* Parcel photo if available */}
                  {trackedOrder.shippingImage && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '160px' }}>
                      <img src={trackedOrder.shippingImage} alt="Shipping parcel" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f3f0eb' }} />
                    </div>
                  )}

                  {/* Timeline progress steps */}
                  <div style={{ marginTop: '10px' }}>
                    <h5 style={{ color: 'var(--shop-brand)', margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700 }}>{db.getLabel('auto____ສະຖານະອໍເດີ້__34z0ky', `ສະຖານະ:`)}</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '2px solid var(--shop-brand)', paddingLeft: '14px', marginLeft: '6px' }}>
                      {trackedOrder.timeline?.map((evt, idx) => (
                        <div key={idx} style={{ position: 'relative', fontSize: '0.75rem' }}>
                          <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--shop-brand)' }} />
                          <div style={{ color: 'var(--shop-brand)', fontWeight: 700 }}>{evt.status}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--shop-muted)' }}>{new Date(evt.date).toLocaleString('lo-LA')}</div>
                          <div style={{ color: 'var(--shop-text)', marginTop: '2px' }}>{evt.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--shop-muted)', fontSize: '0.85rem', background: '#fff', borderRadius: 'var(--shop-radius)', boxShadow: 'var(--shop-shadow)' }}>
                ກະລຸນາປ້ອນເລກອໍເດີ້ ເພື່ອຕິດຕາມສະຖານະ
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
          <h3 style={{ color: 'var(--shop-text)', margin: 0, fontWeight: 800 }}>{db.getLabel('auto____ສົ່ງຂໍ້ຄວາມຫາຮ້ານ_h72xbs', `ສົ່ງຂໍ້ຄວາມ`)}</h3>

          {!customer ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', background: '#fff', border: '1px solid var(--shop-border)', borderRadius: 'var(--shop-radius)', boxShadow: 'var(--shop-shadow)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--shop-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <div style={{ color: 'var(--shop-brand)', fontWeight: 700, fontSize: '1rem' }}>{db.getLabel('auto_ກະລຸນາ_Login_ກ່ອນ_bj9te9', `ກະລຸນາ Login ກ່ອນ`)}</div>
              <div style={{ color: 'var(--shop-muted)', fontSize: '0.82rem' }}>{db.getLabel('auto_ເພື່ອສົ່ງຂໍ້ຄວາມຫາທາງຮ້ານ_2zeqx5', `ສ້າງບັນຊີ ຫຼື Login ກ່ອນ`)}</div>
              <button type="button" className="btn btn-primary" onClick={() => setActiveTab('profile')} style={{ padding: '10px 28px', fontSize: '0.85rem' }}>
                ໄປຫນ້າ Login
              </button>
            </div>
          ) : !chatOrder ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>{db.getLabel('auto___ກຳລັງໂຫຼດຫ້ອງແຊັດ____tvbv9p', `⏳ ກຳລັງໂຫຼດຫ້ອງແຊັດ...`)}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--shop-brand-lt)', border: '1.5px solid var(--shop-brand)', borderRadius: '10px', padding: '10px 14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--shop-muted)' }}>{db.getLabel('auto____ຫ້ອງສົນທະນາ__jjme4p', `ຫ້ອງສົນທະນາ:`)}</div>
                  <div style={{ color: 'var(--shop-brand)', fontWeight: 700, fontSize: '0.9rem' }}>{chatOrder.customerName}</div>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--shop-muted)' }}>ID: {chatOrder.id}</div>
              </div>

              {/* Messages */}
              <div id="chat-messages-customer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', background: 'var(--shop-card2)', border: '1px solid var(--shop-border)', borderRadius: '10px', padding: '12px' }}>
                {(() => {
                  const liveOrder = db.getOnlineOrders().find(o => o.id === chatOrder.id);
                  const msgs = liveOrder?.messages || [];
                  if (msgs.length === 0) return <div style={{ textAlign: 'center', color: 'var(--shop-muted)', fontSize: '0.8rem', paddingTop: '60px' }}>{db.getLabel('auto____ຍັງບໍ່ມີຂໍ້ຄວາມ___ພິມແ_2gyce7', `ຍັງບໍ່ມີຂໍ້ຄວາມ — ພິມຂໍ້ຄວາມໄດ້ເລີຍ!`)}</div>;
                  return msgs.map((msg, idx) => (
                    <div key={idx} style={{ alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start', background: msg.sender === 'customer' ? 'var(--shop-brand)' : '#f3f0eb', border: 'none', borderRadius: msg.sender === 'customer' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', maxWidth: '82%' }}>
                       <div style={{ fontSize: '0.62rem', color: msg.sender === 'customer' ? 'rgba(255,255,255,0.7)' : 'var(--shop-muted)', marginBottom: '3px' }}>
                         {msg.sender === 'customer' ? 'ທ່ານ' : 'ຮ້ານ'}{' • '}{new Date(msg.timestamp).toLocaleString('lo-LA')}
                      </div>
                       {msg.text && <div style={{ fontSize: '0.85rem', color: msg.sender === 'customer' ? '#fff' : 'var(--shop-text)', wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.text}</div>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: msg.text ? '8px' : 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.attachments.map((att, ai) => (
                            att.type === 'image' ? <img key={ai} src={att.data} alt={att.name} style={{ maxWidth: '160px', maxHeight: '160px', borderRadius: '8px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => window.open(att.data)} />
                            : att.type === 'video' ? <video key={ai} src={att.data} controls style={{ maxWidth: '200px', borderRadius: '8px' }} />
                             : <a key={ai} href={att.data} download={att.name} style={{ fontSize: '0.75rem', color: 'var(--shop-brand)', textDecoration: 'underline' }}>📎 {att.name}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Attachment preview */}
              {chatAttachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'var(--shop-card2)', borderRadius: '8px', border: '1px solid var(--shop-border)' }}>
                  {chatAttachments.map((att, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      {att.type === 'image' ? <img src={att.data} alt={att.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                       : att.type === 'video' ? <div style={{ width: '56px', height: '56px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
                       : <div style={{ padding: '4px 8px', background: 'var(--shop-brand-lt)', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--shop-brand)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {att.name}</div>}
                      <button onClick={() => setChatAttachments(prev => prev.filter((_,j) => j !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', border: 'none', borderRadius: '50%', width: '16px', height: '16px', color: 'white', cursor: 'pointer', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input bar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '42px', height: '42px', background: 'var(--shop-card2)', border: '1.5px solid var(--shop-border)', borderRadius: '10px', cursor: 'pointer', fontSize: '1.15rem', flexShrink: 0 }}>
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
                  placeholder={db.getLabel('auto_ພິມຂໍ້ຄວາມ_____Enter_ເພື່_w6mwz0', `ພິມຂໍ້ຄວາມ... (Enter ເພື່ອສົ່ງ)`)}
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
                  style={{ flex: 1, margin: 0, fontSize: '0.85rem', height: '42px' }}
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
                  ສົ່ງ
                </button>
              </div>
            </div>
          )}
        </div>
      )}


            {/* 3. MOBILE BOTTOM NAVIGATION */}
            {/* 3. MOBILE BOTTOM NAVIGATION */}
      <nav className="shop-bottom-nav">
        <button onClick={() => setActiveTab('catalog')} className={`shop-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>{t('home', 'ສິນຄ້າ')}</span>
        </button>

        <button onClick={() => setActiveTab('cart')} className={`shop-nav-btn ${activeTab === 'cart' ? 'active' : ''}`} style={{ position: 'relative' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: '6px', right: 'calc(50% - 18px)', background: 'var(--shop-danger)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cart.reduce((sum, i) => sum + i.qty, 0)}
            </span>
          )}
          <span>{t('cart', 'ຕະກ່າ')}</span>
        </button>

        <button onClick={() => setActiveTab('tracking')} className={`shop-nav-btn ${activeTab === 'tracking' ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>{t('tracking', 'ຕິດຕາມ')}</span>
        </button>

        <button onClick={() => setActiveTab('chat')} className={`shop-nav-btn ${activeTab === 'chat' ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>{t('chat', 'ສອບຖາມ')}</span>
        </button>

        <button onClick={() => setActiveTab('profile')} className={`shop-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>{db.getLabel('auto_ໂປຣໄຟລ໌_uv7wgc', `ໂປຣໄຟລ໌`)}</span>
        </button>
      </nav>

      {/* Product Detail Modal */}
      {selectedDetailProduct && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px', background: '#ffffff', color: 'var(--shop-text)', borderRadius: 'var(--shop-radius)', border: '1px solid var(--shop-border)', padding: '16px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            
            {/* Close button */}
            <button 
              type="button"
              className="btn-secondary" 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.08)', border: 'none', color: 'var(--shop-text)', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, zIndex: 10 }}
              onClick={() => setSelectedDetailProduct(null)}
            >
              ✕
            </button>

            {/* Product Image */}
            <div style={{ width: '100%', height: '280px', overflow: 'hidden', borderRadius: 'var(--shop-radius-s)', background: '#f3f0eb', border: '1px solid var(--shop-border)', marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                              style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === activeImageIdx ? 'var(--shop-brand)' : 'rgba(0,0,0,0.2)', cursor: 'pointer', display: 'inline-block' }}
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
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: 'var(--shop-text)', lineHeight: '1.4' }}>
                {selectedDetailProduct.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.3rem', color: 'var(--shop-brand)', fontWeight: 800 }}>
                  {(selectedDetailProduct.priceOnline || selectedDetailProduct.price || 0).toLocaleString()} ₭
                </span>
                {selectedDetailProduct.priceVip && selectedDetailProduct.priceVip !== (selectedDetailProduct.priceOnline || selectedDetailProduct.price) && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--shop-muted)', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                    VIP: <b style={{ color: '#3b82f6' }}>{(selectedDetailProduct.priceVip || 0).toLocaleString()} ₭</b>
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--shop-muted)', display: 'flex', gap: '15px' }}>
                <span>{db.getLabel('auto_ຄົງເຫຼືອໃນສາງ__mm7zmg', `ຄົງເຫຼືອ:`)} <b style={{ color: selectedDetailProduct.stock > 0 ? 'var(--shop-success)' : 'var(--shop-danger)' }}>{selectedDetailProduct.stock} {selectedDetailProduct.unit || 'ອັນ'}</b></span>
                <span>{db.getLabel('auto_ໝວດໝູ່__6g08d4', `ໝວດໝູ່:`)} <b>{categories.find(c => c.id === selectedDetailProduct.category)?.name || 'ທົ່ວໄປ'}</b></span>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--shop-border)', margin: '8px 0' }} />

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--shop-brand)', margin: '0 0 6px 0', fontWeight: 700 }}>
                  ລາຍລະອຽດສິນຄ້າ:
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--shop-muted)', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
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
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={selectedDetailProduct.stock <= 0}
                >
                  {selectedDetailProduct.stock > 0 ? (
                    <>{db.getLabel('auto____ໃສ່ຕະກ່າສິນຄ້າ_3o9euw', `ໃສ່ກະຕ່າສິນຄ້າ`)}</>
                  ) : (
                    <>{db.getLabel('auto____ສິນຄ້າໝົດ_ym35v8', `ສິນຄ້າໝົດ`)}</>
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
