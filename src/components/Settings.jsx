import React, { useState, useEffect, useRef } from 'react';
import { db, DEFAULT_LABEL_KEYS } from '../utils/db';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import OrderTracking from './OrderTracking';
import Portal from './Portal';

// Decode QR image → EMVCo text payload (for dynamic amount injection)
const decodeQrFromImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);
        if (decoded && decoded.data) {
          resolve({ payload: decoded.data, dataUrl }); // EMVCo text
        } else {
          resolve({ payload: dataUrl, dataUrl }); // fallback: raw image
        }
      } catch (e) { resolve({ payload: dataUrl, dataUrl }); }
    };
    img.onerror = () => resolve({ payload: dataUrl, dataUrl });
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
});

const getQrSizePx = (size) => {
  if (size === 'small') return '70px';
  if (size === 'medium') return '100px';
  if (size === 'large') return '150px';
  if (size === 'xlarge') return '200px';
  if (size && size.endsWith('px')) return size;
  return '100px';
};

const LotusIcon = ({ color = '#d4af37' }) => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
    <path d="M50 15C50 15 42 35 45 55C47 70 50 85 50 85C50 85 53 70 55 55C58 35 50 15 50 15Z" fill={color} />
    <path d="M50 25C50 25 35 42 30 60C26 73 35 83 35 83C35 83 45 78 50 72C55 78 65 83 65 83C65 83 74 73 70 60C65 42 50 25 50 25Z" fill={color} opacity="0.85" />
    <path d="M50 40C50 40 25 52 20 68C16 80 25 85 25 85C25 85 38 78 50 75C62 78 75 85 75 85C75 85 84 80 80 68C75 52 50 40 50 40Z" fill={color} opacity="0.7" />
  </svg>
);

export default function Settings({ activeUser, onUpdate, isMobile }) {
  const [scanTestResult, setScanTestResult] = useState('');
  const [labelsSearchQuery, setLabelsSearchQuery] = useState('');
  const [newFrameStyle, setNewFrameStyle] = useState('');

  const handleResetShopInfo = () => {
    if (!window.confirm('ຕ້ອງການລ້າງຂໍ້ມູນຮ້านຄ້າທັງໝົດແທ້ບໍ່?')) return;
    setSettings(prev => ({
      ...prev,
      shopName: '',
      shopSubtitle: '',
      shopPhone: '',
      shopAddress: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      shopLogo: null,
      bankQrTemplate: null
    }));
  };

  const handleRestoreDatabase = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.confirm('ຄຳເຕືອນ: ຂໍ້ມູນປະຈຸບັນທັງໝົດຈະຖືກຂຽນທັບ! ຕ້ອງການກູ້ຄືນແທ້ບໍ່? (Warning: All current data will be overwritten!)')) {
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const arrayBuffer = evt.target.result;
        const res = await fetch('/api/production/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: arrayBuffer
        });
        const result = await res.json();
        if (result.success) {
          alert('✓ ກູ້ຄືນຖານຂໍ້ມູນສຳເລັດແລ້ວ! ລະບົບຈະໂຫຼດໜ້າໃໝ່.');
          window.location.reload();
        } else {
          alert('❌ ຜິດພາດ: ' + result.error);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert('❌ ຜິດພາດ: ' + err.message);
    }
  };

  const handleResetDemoData = async () => {
    const confirmText = window.prompt('ແຈ້ງເຕືອນ: ທ່ານຕ້ອງການລຶບຂໍ້ມູນທົດລອງທັງໝົດແທ້ບໍ່? (ພິມ "RESET" ເພື່ອຢືນຢັນ)');
    if (confirmText !== 'RESET') {
      return;
    }

    try {
      const res = await fetch('/api/production/reset-demo', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        alert('✓ ລຶບຂໍ້ມູນທົດລອງສຳເລັດແລ້ວ! ລະບົບຈະໂຫຼດໜ້າໃໝ່.');
        window.location.reload();
      } else {
        alert('❌ ຜິດພາດ: ' + result.error);
      }
    } catch (err) {
      alert('❌ ຜິດພາດ: ' + err.message);
    }
  };

  const handleInitializeAdmin = async () => {
    if (!window.confirm('ຕ້ອງການສ້າງ/ຣີເຊັດ ບັນຊີ admin ເປັນ admin123 ພ້ອມບັງຄັບປ່ຽນລະຫັດຜ່ານແທ້ບໍ່?')) {
      return;
    }

    try {
      const res = await fetch('/api/production/initialize', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        alert('✓ ສ້າງບັນຊີ admin (admin / admin123) ສຳເລັດແລ້ວ! ລະບົບໄດ້ບັງຄັບໃຫ້ປ່ຽນລະຫັດຜ່ານເມື່ອເຂົ້າສູ່ລະບົບຄັ້ງທຳອິດ.');
        window.location.reload();
      } else {
        alert('❌ ຜິດພາດ: ' + result.error);
      }
    } catch (err) {
      alert('❌ ຜິດພາດ: ' + err.message);
    }
  };

  const [settings, setSettings] = useState({
    shopName: '',
    shopSubtitle: '',
    shopPhone: '',
    shopAddress: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankQrTemplate: '',
    lowStockThreshold: 5,
    receiptLogoUrl: '',
    receiptHeaderNote: '',
    receiptFooterNote: '',
    appTheme: 'gold',
    showQrOnReceipt: true,
    receiptMarginLeft: '0mm',
    receiptMarginRight: '0mm',
    receiptMarginTop: '0mm',
    receiptMarginBottom: '0mm',
    receiptPadding: '5mm',
    receiptLineHeight: '1.3',
    receiptFontSize: '10pt',
    receiptHeaderFontSize: 'calc(100% + 3pt)',
    receiptContactFontSize: 'calc(100% - 2pt)',
    receiptItemsFontSize: 'calc(100% - 2pt)',
    receiptTotalsFontSize: '100%',
    receiptFooterFontSize: 'calc(100% - 2pt)',
    receiptQrSize: 'medium',
    receiptQrMarginTop: '12px',
    receiptLogoWidth: '60px',
    receiptLogoShape: '50%',
    receiptDividerStyle: 'dashed',
    receiptDividerThickness: '1px',
    trackingBaseUrl: ''
  });



  const [activeSubTab, setActiveSubTab] = useState(isMobile ? '' : 'shop');
  const [bankSettingsCurrency, setBankSettingsCurrency] = useState('LAK');

  useEffect(() => {
    if (!isMobile && activeSubTab === '') {
      setActiveSubTab('shop');
    }
  }, [isMobile, activeSubTab]);
  const [successMsg, setSuccessMsg] = useState('');
  const [expenseCategories, setExpenseCategories] = useState(db.getExpenseCategories());
  const [newCatRawName, setNewCatRawName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('💸');
  const [selectedLabelSection, setSelectedLabelSection] = useState('all');




  const [promotions, setPromotions] = useState([]);



  const [promoFormData, setPromoFormData] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    minPurchase: ''
  });

  // Coupon Card Designer States
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [designPromo, setDesignPromo] = useState(null);
  const [designTheme, setDesignTheme] = useState('gold');
  const [designBgSolid, setDesignBgSolid] = useState('#0a0a0a');
  const [designBgGradient1, setDesignBgGradient1] = useState('#1a1a1a');
  const [designBgGradient2, setDesignBgGradient2] = useState('#0d0d0d');
  const [designBgGradientAngle, setDesignBgGradientAngle] = useState('45');
  const [designBgImage, setDesignBgImage] = useState('');
  const [designBorder, setDesignBorder] = useState('gold_ornate');
  const [designLotusOrnament, setDesignLotusOrnament] = useState(true);
  const [designTitle, setDesignTitle] = useState('ບັດສ່ວນຫຼຸດພіເສດ');
  const [designTitleColor, setDesignTitleColor] = useState('#d4af37');
  const [designTitleSize, setDesignTitleSize] = useState('11');
  const [designValueColor, setDesignValueColor] = useState('#ffffff');
  const [designValueSize, setDesignValueSize] = useState('18');
  const [designTerms, setDesignTerms] = useState('ໃຊ້ເປັນສ່ວນຫຼຸດໃນການຮັບບໍລິການອັດກອບພຣະເຄື່ອງ');
  const [designTermsColor, setDesignTermsColor] = useState('#aaaaaa');
  const [designTermsSize, setDesignTermsSize] = useState('6.5');
  const [designShowLogo, setDesignShowLogo] = useState(false);
  const [designLogoImage, setDesignLogoImage] = useState('');
  const [designCardHeight, setDesignCardHeight] = useState('270');
  
  const designBarcodeCanvasRef = useRef(null);

  useEffect(() => {
    if (showDesignModal && designPromo && designBarcodeCanvasRef.current) {
      try {
        JsBarcode(designBarcodeCanvasRef.current, designPromo.code, {
          format: 'CODE128',
          width: 1.2,
          height: 35,
          displayValue: true,
          fontSize: 8,
          font: 'Courier New',
          background: 'transparent',
          lineColor: designTheme === 'gold' || designTheme === 'red' || designTheme === 'emerald' || designTheme === 'sapphire' ? '#ffffff' : '#000000',
          margin: 0
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [showDesignModal, designPromo, designTheme, designBgSolid, designBgGradient1, designBgGradient2, designBgGradientAngle, designBgImage]);




  const handleDesignCouponClick = (promo) => {
    setDesignPromo(promo);
    if (promo.cardDesign) {
      const d = promo.cardDesign;
      setDesignTheme(d.theme || 'gold');
      setDesignBgSolid(d.bgSolid || '#0a0a0a');
      setDesignBgGradient1(d.bgGradient1 || '#1a1a1a');
      setDesignBgGradient2(d.bgGradient2 || '#0d0d0d');
      setDesignBgGradientAngle(d.bgGradientAngle || '45');
      setDesignBgImage(d.bgImage || '');
      setDesignBorder(d.border || 'gold_ornate');
      setDesignLotusOrnament(d.lotusOrnament !== false);
      setDesignTitle(d.title || 'ບັດສ່ວນຫຼຸດພິເສດ');
      setDesignTitleColor(d.titleColor || '#d4af37');
      setDesignTitleSize(d.titleSize || '11');
      setDesignValueColor(d.valueColor || '#ffffff');
      setDesignValueSize(d.valueSize || '18');
      setDesignTerms(d.terms || 'ໃຊ້ເປັນສ່ວນຫຼຸດໃນການຮັບບໍລິການອັດກອບພຣະເຄື່ອງ');
      setDesignTermsColor(d.termsColor || '#aaaaaa');
      setDesignTermsSize(d.termsSize || '6.5');
      setDesignShowLogo(d.showLogo || false);
      setDesignLogoImage(d.logoImage || '');
      setDesignCardHeight(d.cardHeight || '270');
    } else {
      setDesignTheme('gold');
      setDesignBgSolid('#0a0a0a');
      setDesignBgGradient1('#1a1a1a');
      setDesignBgGradient2('#0d0d0d');
      setDesignBgGradientAngle('45');
      setDesignBgImage('');
      setDesignBorder('gold_ornate');
      setDesignLotusOrnament(true);
      setDesignTitle('ບັດສ່ວນຫຼຸດພິເສດ');
      setDesignTitleColor('#d4af37');
      setDesignTitleSize('11');
      setDesignValueColor('#ffffff');
      setDesignValueSize('18');
      setDesignTerms('ໃຊ້ເປັນສ່ວນຫຼຸດໃນການຮັບບໍລິການອັດກອບພຣະເຄື່ອງ');
      setDesignTermsColor('#aaaaaa');
      setDesignTermsSize('6.5');
      setDesignShowLogo(false);
      setDesignLogoImage('');
      setDesignCardHeight('270');
    }
    setShowDesignModal(true);
  };

  const handleSaveCouponDesign = () => {
    const promos = db.getPromotions();
    const updated = promos.map(p => {
      if (p.id === designPromo.id) {
        return {
          ...p,
          cardDesign: {
            theme: designTheme,
            bgSolid: designBgSolid,
            bgGradient1: designBgGradient1,
            bgGradient2: designBgGradient2,
            bgGradientAngle: designBgGradientAngle,
            bgImage: designBgImage,
            border: designBorder,
            lotusOrnament: designLotusOrnament,
            title: designTitle,
            titleColor: designTitleColor,
            titleSize: designTitleSize,
            valueColor: designValueColor,
            valueSize: designValueSize,
            terms: designTerms,
            termsColor: designTermsColor,
            termsSize: designTermsSize,
            showLogo: designShowLogo,
            logoImage: designLogoImage,
            cardHeight: designCardHeight
          }
        };
      }
      return p;
    });
    db.savePromotions(updated);
    setPromotions(updated);
    setShowDesignModal(false);
    setSuccessMsg('✓ ບັນທຶກຮູບແບບຄູປອງສຳເລັດ!');
  };

  const handlePrintCoupon = () => {
    const cardEl = document.getElementById('print-coupon-card');
    if (!cardEl) return;

    // Clone the element to avoid modifying the live DOM
    const clone = cardEl.cloneNode(true);

    // Find the barcode canvas and replace it with an image of its content
    const originalCanvas = cardEl.querySelector('canvas');
    if (originalCanvas) {
      try {
        const imgUrl = originalCanvas.toDataURL('image/png');
        const cloneCanvas = clone.querySelector('canvas');
        if (cloneCanvas) {
          const img = document.createElement('img');
          img.src = imgUrl;
          img.style.width = '100%';
          img.style.height = '35px';
          img.style.display = 'block';
          cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
        }
      } catch (e) {
        console.error('Error copying barcode canvas to image:', e);
      }
    }

    const cardHtml = clone.outerHTML;

    // Open a new print window
    const printWindow = window.open('', '_blank', 'width=600,height=450');
    if (!printWindow) {
      alert('ກະລຸນາອະນຸຍາດໃຫ້ເປີດປັອບອັບ ເພື່ອພິມບັດຄູປອງ / Please allow popups to print.');
      return;
    }

    // Write content with exact CSS for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Coupon - ${designPromo.code}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background: #fff;
              font-family: 'Phetsarath', 'Noto Sans Lao', sans-serif;
            }
            #print-coupon-card {
              width: 85.6mm !important;
              height: 54mm !important;
              border-radius: 6px !important;
              padding: 10px !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              align-items: center !important;
              position: relative !important;
              box-shadow: none !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background: ${getCardBackground()} !important;
              border: ${designBorder === 'none' ? 'none' : (designBorder === 'double_gold' ? '3px double #d4af37' : '1.5px solid #d4af37')} !important;
              outline: ${designBorder === 'gold_ornate' ? '1px solid #d4af37' : 'none'} !important;
              outline-offset: ${designBorder === 'gold_ornate' ? '-4px' : '0'} !important;
            }
            #print-coupon-card * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${cardHtml}
          <script>
            // Auto trigger print and close after loaded
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getCardBackground = () => {
    if (designTheme === 'gold') {
      return 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)';
    }
    if (designTheme === 'red') {
      return 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)';
    }
    if (designTheme === 'emerald') {
      return 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)';
    }
    if (designTheme === 'sapphire') {
      return 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)';
    }
    if (designBgImage) {
      return `url(${designBgImage}) center/cover no-repeat`;
    }
    if (designBgGradient1 && designBgGradient2) {
      return `linear-gradient(${designBgGradientAngle}deg, ${designBgGradient1} 0%, ${designBgGradient2} 100%)`;
    }
    return designBgSolid || '#0a0a0a';
  };





  useEffect(() => {
    const s = db.getSettings();
    setSettings(s);
    setPromotions(db.getPromotions());
  }, [activeSubTab]);

    const [previewBarcodeUrl, setPreviewBarcodeUrl] = useState('');

  useEffect(() => {
    if (activeSubTab === 'barcode') {
      try {
        const testCode = 'CODE1234';
        const format = settings.barcodeFormat || 'CODE128';
        const canvas = document.createElement('canvas');
        if (format === 'QRCODE') {
          QRCode.toCanvas(canvas, testCode, {
            margin: 1,
            scale: 2,
            width: settings.barcodeHeight || 50
          }).then(() => {
            setPreviewBarcodeUrl(canvas.toDataURL());
          }).catch(err => console.error(err));
        } else {
          JsBarcode(canvas, testCode, {
            format: format,
            width: settings.barcodeWidth || 2,
            height: settings.barcodeHeight || 50,
            displayValue: settings.barcodeShowCode !== false,
            fontSize: settings.barcodeCodeSize || 10,
            margin: 4
          });
          setPreviewBarcodeUrl(canvas.toDataURL());
        }
      } catch (err) {
        console.error("Preview render failed:", err);
      }
    }
  }, [
    activeSubTab,
    settings.barcodeFormat,
    settings.barcodeWidth,
    settings.barcodeHeight,
    settings.barcodeShowCode,
    settings.barcodeCodeSize,
    settings.barcodeMargin
  ]);

  const handleSettingsSave = (e) => {
    e.preventDefault();
    db.saveSettings(settings);
    setSuccessMsg('✓ ບັນທຶກການຕັ້ງຄ່າລະບົບສຳເລັດແລ້ວ!');
    if (onUpdate) onUpdate();
    setTimeout(() => setSuccessMsg(''), 3000);
  };



  const handleResetDb = () => {
    if (window.confirm('ຄຳເຕືອນ: ທ່ານຕ້ອງການຣີເຊັດຖານຂໍ້ມູນທັງໝົດເປັນຄ່າເລີ່ມຕົ້ນ ຫຼື ບໍ່? ຂໍ້ມູນການຂາຍ ແລະ ສະຕັອກທັງໝົດຈະຖືກລຶບ!')) {
      db.resetDatabase();
      const s = db.getSettings();
      setSettings(s);
      setPromotions(db.getPromotions());
      setSuccessMsg('✓ ຣີເຊັດຖານຂໍ້ມູນທັງໝົດເປັນຄ່າເລີ່ມຕົ້ນແລ້ວ!');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddPromo = (e) => {
    e.preventDefault();
    const code = promoFormData.code.trim().toUpperCase();
    if (!code) return;

    const promos = db.getPromotions();
    if (promos.some(p => p.code === code)) {
      alert('ຂໍອະໄພ: ລະຫັດຄູປອງນີ້ມີໃນລະບົບແລ້ວ!');
      return;
    }

    const newPromo = {
      id: code,
      code: code,
      name: promoFormData.name,
      type: promoFormData.type,
      value: Number(promoFormData.value),
      minPurchase: Number(promoFormData.minPurchase || 0),
      active: true
    };

    const updated = [...promos, newPromo];
    db.savePromotions(updated);
    setPromotions(updated);
    setPromoFormData({
      code: '',
      name: '',
      type: 'percentage',
      value: '',
      minPurchase: ''
    });
    setSuccessMsg('✓ ເພີ່ມຄູປອງໂປຣໂມຊັ່ນສຳເລັດ!');
    if (onUpdate) onUpdate();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeletePromo = (id) => {
    if (window.confirm('ຕ້ອງການລຶບຄູປອງໂປຣໂມຊັ່ນນີ້ ຫຼື ບໍ່?')) {
      const promos = db.getPromotions();
      const updated = promos.filter(p => p.id !== id);
      db.savePromotions(updated);
      setPromotions(updated);
      setSuccessMsg('✓ ລຶບຄູປອງໂປຣໂມຊັ່ນສຳເລັດ!');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSaveWages = (e) => {
    e.preventDefault();
    const updated = {
      ...settings,
      dailyWages: {
        owner: Number(dailyWages.owner),
        cashier: Number(dailyWages.cashier),
        technician: Number(dailyWages.technician)
      },
      otHourlyRates: {
        owner: Number(otRates.owner),
        cashier: Number(otRates.cashier),
        technician: Number(otRates.technician)
      }
    };
    db.saveSettings(updated);
    setSettings(updated);
    setSuccessMsg('✓ ອັບເດດອັດຕາຄ່າຈ້າງ ແລະ OT ຂອງພະນັກງານສຳເລັດ!');
    if (onUpdate) onUpdate();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ color: 'var(--gold-primary)' }}>⚙️ ຕັ້ງຄ່າລະບົບຫຼັງບ້ານ (Developer Settings)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ຈັດການຂໍ້ມູນຮ້ານ, ຂໍ້ມູນບັນຊີທະນາຄານຮັບເງິນ, ພະນັກງານ, ປັບແຕ່ງຮູບແບບໃບບິນ ແລະ ປ່ຽນສີລະບົບ</p>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(39, 174, 96, 0.1)', border: '1.5px solid var(--success-green)', color: 'var(--success-green)', padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
          {successMsg}
        </div>
      )}

      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Settings Tab Sidebar */}
        {(!isMobile || activeSubTab === '') && (
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className={`nav-tab ${activeSubTab === 'shop' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('shop')}
          >
            {db.getLabel('settings_tab_shop', '🏪 ຂໍ້ມູນຮ້ານ (Shop Info)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'receipt' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('receipt')}
          >
            {db.getLabel('settings_tab_receipt', '🖨️ ຮູບແບບໃບບິນ (Receipt Design)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'barcode' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('barcode')}
          >
            {db.getLabel('settings_tab_barcode', '🔌 ບາໂຄດ & ສະແກນ (Barcode/Scanner)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'theme' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('theme')}
          >
            {db.getLabel('settings_tab_theme', '🎨 ສີ & ຄວາມໂຄ້ງ (Theme/Borders)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'labels' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('labels')}
          >
            {db.getLabel('settings_tab_labels', '📝 ປັບແຕ່ງພາສາ (Translate Labels)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'notifications' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('notifications')}
          >
            {db.getLabel('settings_tab_notifications', '🔔 ແຈ້ງເຕືອນໂທລະສັບ (Phone Alerts)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'general' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('general')}
          >
            {db.getLabel('settings_tab_rules', '⚙️ ກົດລະບຽບ (Rules)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'promotions' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('promotions')}
          >
            {db.getLabel('settings_tab_coupons', '🏷️ ໂປຣໂມຊັ່ນ (Coupons)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'framing_specs' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('framing_specs')}
          >
            {db.getLabel('settings_tab_framing_specs', '🛠️ ຕົວເລືອກງານເລ່ຽມ (Framing Options)')}
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'expenses' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('expenses')}
          >
            {db.getLabel('settings_tab_expenses', '💸 ປະເພດລາຍຈ່າຍ (Expense Categories)')}
          </button>


          <button
            className={`nav-tab ${activeSubTab === 'tracking' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('tracking')}
          >
            {db.getLabel('settings_tab_tracking', '🔍 ຕິດຕາມພຣະ (Amulet Tracking)')}
          </button>

          <button
            className={`nav-tab ${activeSubTab === 'data_retention' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('data_retention')}
          >
            🧹 ການຈັດການຂໍ້ມູນ (Data Retention)
          </button>

          <button
            className={`nav-tab ${activeSubTab === 'online_shop_settings' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
            onClick={() => setActiveSubTab('online_shop_settings')}
          >
            🌐 ຕັ້ງຄ່າຮ້ານອອນລາຍ (Online Shop)
          </button>

          <button
            className={`nav-tab ${activeSubTab === 'system' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: 'var(--alert-red)' }}
            onClick={() => setActiveSubTab('system')}
          >
            {db.getLabel('settings_tab_system', '⚠️ ຄວບຄຸມລະບົບ (System)')}
          </button>

          <button
            className={`nav-tab ${activeSubTab === 'production_tools' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: '#3498db' }}
            onClick={() => setActiveSubTab('production_tools')}
          >
            ⚙️ ເຄື່ອງມືລະບົບ (Production Tools)
          </button>
        </div>
      )}

      {/* Settings Tab Main Panel */}
      {(!isMobile || activeSubTab !== '') && (
        <div className="glass-card" style={isMobile ? { padding: '16px' } : undefined}>
          {isMobile && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveSubTab('')}
              style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              ⬅️ ກັບຄືນ (Back to Menu)
            </button>
          )}
          
          {/* Shop and Bank details settings */}
          {activeSubTab === 'shop' && (
            <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                🏪 ຕັ້ງຄ່າຂໍ້ມູນຮ້ານ ແລະ ບັນຊີທະນາຄານຮັບເງິນ
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ຊື່ຮ້ານ (Shop Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={settings.shopName}
                    onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ຄຳຂວັນ/ຄຳອະທິບາຍ (Subtitle)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={settings.shopSubtitle}
                    onChange={(e) => setSettings({ ...settings, shopSubtitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ໂລໂກ້ຮ້ານ / ໂລໂກ້ເຂົ້າສູ່ລະບົບ (Shop Logo / Login Logo)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                  {settings.shopLogo ? (
                    <img 
                      src={settings.shopLogo} 
                      alt="Shop Logo" 
                      style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#111' }} 
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      🏪
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSettings(prev => ({ ...prev, shopLogo: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                    />
                    {settings.shopLogo && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)', alignSelf: 'flex-start' }} 
                        onClick={() => setSettings({ ...settings, shopLogo: '' })}
                      >
                        ລຶບຮູບ (Remove Photo)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ເບີໂທຕິດຕໍ່ (Phone)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={settings.shopPhone}
                    onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ທີ່ຢູ່ຮ້ານ (Address)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={settings.shopAddress}
                    onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ລິ້ງ/IP ຕິດຕາມສະຖານະຮາຍການ (Tracking Base URL / IP Address)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ຕົວຢ່າງ: http://192.168.100.13:5173"
                  value={settings.trackingBaseUrl || ''}
                  onChange={(e) => setSettings({ ...settings, trackingBaseUrl: e.target.value })}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  ປ້ອນ IP ຂອງຄອມພິວເຕີເຄື່ອງນີ້ (ຕົວຢ່າງ: http://192.168.100.13:5173) ເພື່ອໃຫ້ໂທລະສັບສະແກນ QR ບິນແລ້ວຕິດຕາມສະຖານະໄດ້.
                </small>
              </div>

              {/* Deleted duplicate color theme selector */}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', marginBottom: '12px' }}>📱 ຕັ້ງຄ່າບັນຊີທະນາຄານຮັບເງິນ (Bank Accounts & QR Templates)</h4>
                
                {/* Currency Subtabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {['LAK', 'THB', 'USD'].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setBankSettingsCurrency(cur)}
                      className={`btn ${bankSettingsCurrency === cur ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '6px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        background: bankSettingsCurrency === cur ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                        borderColor: bankSettingsCurrency === cur ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)',
                        color: bankSettingsCurrency === cur ? 'black' : 'white'
                      }}
                    >
                      {cur === 'LAK' ? '🇱🇦 ກີບ (LAK)' : cur === 'THB' ? '🇹🇭 ບາດ (THB)' : '🇺🇸 ໂດລາ (USD)'}
                    </button>
                  ))}
                </div>

                {bankSettingsCurrency === 'LAK' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ชື່ທະນາຄານ (Bank Name)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankName || ''}
                          onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ຊື່ບັນຊີທະນາຄານ (Account Name)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankAccountName || ''}
                          onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ເລກບັນຊີທະນາຄານ (Account Number)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankAccountNumber || ''}
                          onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">ອັບໂຫຼດຮູບ QR Code (Bank QR Code Image)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const { payload, dataUrl } = await decodeQrFromImage(file);
                              setSettings(prev => ({
                                ...prev,
                                bankQrTemplate: payload,
                                bankQrPreview: dataUrl,
                              }));
                            }
                          }}
                        />
                        <div style={{ marginTop: '10px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ພຣີວິວ QR Code ທີ່ອັບໂຫຼດ:</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                            <img
                              src={settings.bankQrPreview || settings.bankQrTemplate}
                              alt="Bank QR Preview"
                              style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--border-color)' }}
                            />
                            {settings.bankQrTemplate && !settings.bankQrTemplate.startsWith('data:image/') && (
                              <span style={{ fontSize: '0.65rem', color: '#2ecc71', background: 'rgba(46,204,113,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(46,204,113,0.3)' }}>
                                ✅ ອ່ານ payload ໄດ້ — QR ຈະ embed ຍອດໄດ້
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}
                              onClick={() => setSettings({ ...settings, bankQrTemplate: '', bankQrPreview: '' })}
                            >ລຶບຮູບ</button>
                          </div>
                          {settings.bankQrTemplate && !settings.bankQrTemplate.startsWith('data:image/') && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '8px', fontSize: '0.73rem', color: '#2ecc71' }}>
                              ✅ Decode ສຳເລັດ! QR ຈະ embed ຍອດ dynamic ໄດ້<br/>
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                {settings.bankQrTemplate.substring(0, 40)}...
                              </span>
                            </div>
                          )}
                          {settings.bankQrTemplate && settings.bankQrTemplate.startsWith('data:image/') && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.4)', borderRadius: '8px', fontSize: '0.75rem', color: '#e67e22' }}>
                              ⚠️ Decode ບໍ່ໄດ້ — QR scan ໄດ້ຕາມປົກກະຕິ ແຕ່ບໍ່ມີຍອດເງິນ dynamic
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {bankSettingsCurrency === 'THB' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ຊື່ທະນາຄານ (Bank Name - THB)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankNameThb || ''}
                          onChange={(e) => setSettings({ ...settings, bankNameThb: e.target.value })}
                          placeholder="e.g. ກະສິກອນໄທ (KBank)"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ຊື່ບັນຊີທະນາຄານ (Account Name - THB)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankAccountNameThb || ''}
                          onChange={(e) => setSettings({ ...settings, bankAccountNameThb: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ເລກບັນຊີທະນາຄານ (Account Number - THB)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankAccountNumberThb || ''}
                          onChange={(e) => setSettings({ ...settings, bankAccountNumberThb: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">ອັບໂຫຼດຮູບ QR Code ບາດ (THB QR Code Image)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const { payload, dataUrl } = await decodeQrFromImage(file);
                              setSettings(prev => ({
                                ...prev,
                                bankQrTemplateThb: payload,
                                bankQrPreviewThb: dataUrl,
                              }));
                            }
                          }}
                        />
                        <div style={{ marginTop: '10px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ພຣີວິວ QR Code ທີ່ອັບໂຫຼດ:</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                            <img
                              src={settings.bankQrPreviewThb || settings.bankQrTemplateThb}
                              alt="THB Bank QR Preview"
                              style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--border-color)' }}
                            />
                            {settings.bankQrTemplateThb && !settings.bankQrTemplateThb.startsWith('data:image/') && (
                              <span style={{ fontSize: '0.65rem', color: '#2ecc71', background: 'rgba(46,204,113,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(46,204,113,0.3)' }}>
                                ✅ ອ່ານ payload ໄດ້ — QR ຈະ embed ຍອດໄດ້
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}
                              onClick={() => setSettings({ ...settings, bankQrTemplateThb: '', bankQrPreviewThb: '' })}
                            >ລຶບຮູບ</button>
                          </div>
                          {settings.bankQrTemplateThb && !settings.bankQrTemplateThb.startsWith('data:image/') && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '8px', fontSize: '0.73rem', color: '#2ecc71' }}>
                              ✅ Decode ສຳເລັດ! QR ຈະ embed ຍອດ dynamic ໄດ້<br/>
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                {settings.bankQrTemplateThb.substring(0, 40)}...
                              </span>
                            </div>
                          )}
                          {settings.bankQrTemplateThb && settings.bankQrTemplateThb.startsWith('data:image/') && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.4)', borderRadius: '8px', fontSize: '0.75rem', color: '#e67e22' }}>
                              ⚠️ Decode ບໍ່ໄດ້ — QR scan ໄດ້ຕາມປົກກະຕິ ແຕ່ບໍ່ມີຍອດເງິນ dynamic
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {bankSettingsCurrency === 'USD' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ຊື່ທະນາຄານ (Bank Name - USD)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankNameUsd || ''}
                          onChange={(e) => setSettings({ ...settings, bankNameUsd: e.target.value })}
                          placeholder="e.g. ທະນາຄານຮ່ວມພັດທະນາ (JDB)"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ຊື່ບັນຊີທະນາຄານ (Account Name - USD)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankAccountNameUsd || ''}
                          onChange={(e) => setSettings({ ...settings, bankAccountNameUsd: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ເລກບັນຊີທະນາຄານ (Account Number - USD)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={settings.bankAccountNumberUsd || ''}
                          onChange={(e) => setSettings({ ...settings, bankAccountNumberUsd: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">ອັບໂຫຼດຮູບ QR Code ໂດລາ (USD QR Code Image)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const { payload, dataUrl } = await decodeQrFromImage(file);
                              setSettings(prev => ({
                                ...prev,
                                bankQrTemplateUsd: payload,
                                bankQrPreviewUsd: dataUrl,
                              }));
                            }
                          }}
                        />
                        <div style={{ marginTop: '10px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ພຣີວິວ QR Code ທີ່ອັບໂຫຼດ:</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                            <img
                              src={settings.bankQrPreviewUsd || settings.bankQrTemplateUsd}
                              alt="USD Bank QR Preview"
                              style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--border-color)' }}
                            />
                            {settings.bankQrTemplateUsd && !settings.bankQrTemplateUsd.startsWith('data:image/') && (
                              <span style={{ fontSize: '0.65rem', color: '#2ecc71', background: 'rgba(46,204,113,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(46,204,113,0.3)' }}>
                                ✅ ອ່ານ payload ໄດ້ — QR ຈະ embed ຍອດໄດ້
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}
                              onClick={() => setSettings({ ...settings, bankQrTemplateUsd: '', bankQrPreviewUsd: '' })}
                            >ລຶບຮູບ</button>
                          </div>
                          {settings.bankQrTemplateUsd && !settings.bankQrTemplateUsd.startsWith('data:image/') && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '8px', fontSize: '0.73rem', color: '#2ecc71' }}>
                              ✅ Decode ສຳເລັດ! QR ຈະ embed ຍອດ dynamic ໄດ້<br/>
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                {settings.bankQrTemplateUsd.substring(0, 40)}...
                              </span>
                            </div>
                          )}
                          {settings.bankQrTemplateUsd && settings.bankQrTemplateUsd.startsWith('data:image/') && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.4)', borderRadius: '8px', fontSize: '0.75rem', color: '#e67e22' }}>
                              ⚠️ Decode ບໍ່ໄດ້ — QR scan ໄດ້ຕາມປົກກະຕິ ແຕ່ບໍ່ມີຍອດເງິນ dynamic
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleResetShopInfo} style={{ color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}>
                  🔄 ລ້າງຄ່າຂໍ້ມູນຮ້ານ (Reset)
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 ບັນທຶກການຕັ້ງຄ່າທັງໝົດ
                </button>
              </div>
            </form>
          )}

          {/* Receipt Customizer */}
          {activeSubTab === 'receipt' && (
            <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                🖨️ ປັບແຕ່ງຮູບແບບໃບບິນ ແລະ ໂລໂກ້ໃບບິນ (Receipt Customizer)
              </h3>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Left Column: Form Configuration Panels */}
                <div style={{ flex: '1 1 650px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Sizing & Spacing Group */}
                    <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', margin: 0 }}>📏 ຂະໜາດ & ໄລຍະຫ່າງ (Sizing & Spacing)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">ຂະໜາດເຈ້ຍ (Paper Width)</label>
                          <select
                            className="form-control"
                            value={settings.receiptPaperWidth || '80mm'}
                            onChange={(e) => setSettings({ ...settings, receiptPaperWidth: e.target.value })}
                          >
                            <option value="58mm">58mm (ເຈ້ຍນ້ອຍ)</option>
                            <option value="80mm">80mm (ເຈ້ຍມາດຕະຖານ)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂະໜາດຟອນຫຼັກ (Base Font)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptFontSize || '10pt'}
                            onChange={(e) => setSettings({ ...settings, receiptFontSize: e.target.value })}
                            placeholder="e.g. 10pt"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ໄລຍະຫ່າງໃນ (Padding)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptPadding || '5mm'}
                            onChange={(e) => setSettings({ ...settings, receiptPadding: e.target.value })}
                            placeholder="e.g. 5mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຄວາມສູງແຖວ (Line Height)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptLineHeight || '1.3'}
                            onChange={(e) => setSettings({ ...settings, receiptLineHeight: e.target.value })}
                            placeholder="e.g. 1.3"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Margins Group */}
                    <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', margin: 0 }}>📍 ໄລຍະຂອບໃບບິນ (Print Margins)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">ຂອບຊ້າຍ (Left Margin)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptMarginLeft || '0mm'}
                            onChange={(e) => setSettings({ ...settings, receiptMarginLeft: e.target.value })}
                            placeholder="e.g. 0mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂອບຂວາ (Right Margin)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptMarginRight || '0mm'}
                            onChange={(e) => setSettings({ ...settings, receiptMarginRight: e.target.value })}
                            placeholder="e.g. 0mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂອບເທິງ (Top Margin)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptMarginTop || '0mm'}
                            onChange={(e) => setSettings({ ...settings, receiptMarginTop: e.target.value })}
                            placeholder="e.g. 0mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂອບລຸ່ມ (Bottom Margin)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptMarginBottom || '0mm'}
                            onChange={(e) => setSettings({ ...settings, receiptMarginBottom: e.target.value })}
                            placeholder="e.g. 0mm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Font Sizes Group */}
                    <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', margin: 0 }}>🔤 ຂະໜາດຟອນແຕ່ລະສ່ວນ (Section Font Sizes)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">ຫົວບິນ (Header)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptHeaderFontSize || 'calc(100% + 3pt)'}
                            onChange={(e) => setSettings({ ...settings, receiptHeaderFontSize: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂໍ້ມູນຕິດຕໍ່ (Contact)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptContactFontSize || 'calc(100% - 2pt)'}
                            onChange={(e) => setSettings({ ...settings, receiptContactFontSize: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ລາຍການ (Items)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptItemsFontSize || 'calc(100% - 2pt)'}
                            onChange={(e) => setSettings({ ...settings, receiptItemsFontSize: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຍອດລວມ (Totals)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptTotalsFontSize || '100%'}
                            onChange={(e) => setSettings({ ...settings, receiptTotalsFontSize: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ທ້າຍບິນ (Footer)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptFooterFontSize || 'calc(100% - 2pt)'}
                            onChange={(e) => setSettings({ ...settings, receiptFooterFontSize: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo & QR Code Group */}
                    <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', margin: 0 }}>🖼️ ໂລໂກ້ & QR Code (Logo & QR Code Settings)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">ອັບໂຫຼດໂລໂກ້ໃບບິນ</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setSettings(prev => ({ ...prev, receiptLogoUrl: reader.result }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຄວາມກວ້າງໂລໂກ້</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptLogoWidth || '60px'}
                            onChange={(e) => setSettings({ ...settings, receiptLogoWidth: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຮູບຊົງໂລໂກ້</label>
                          <select
                            className="form-control"
                            value={settings.receiptLogoShape || '50%'}
                            onChange={(e) => setSettings({ ...settings, receiptLogoShape: e.target.value })}
                          >
                            <option value="50%">ວົງມົນ (Circle)</option>
                            <option value="8px">ມຸມມົນ (Rounded)</option>
                            <option value="0%">ສີ່ຫຼ່ຽມ (Square)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">ອັບໂຫຼດ QR Code ທະນາຄານ</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const { payload, dataUrl } = await decodeQrFromImage(file);
                                setSettings(prev => ({
                                  ...prev,
                                  bankQrTemplate: payload,
                                  bankQrPreview: dataUrl,
                                }));
                              }
                            }}
                          />
                          {settings.bankQrTemplate && (
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', fontSize: '0.7rem', padding: 0, marginTop: '2px', cursor: 'pointer' }}
                              onClick={() => setSettings({ ...settings, bankQrTemplate: '' })}
                            >
                              ✕ ລຶບ QR Code
                            </button>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂະໜາດ QR Code</label>
                          <select
                            className="form-control"
                            value={settings.receiptQrSize || 'medium'}
                            onChange={(e) => setSettings({ ...settings, receiptQrSize: e.target.value })}
                          >
                            <option value="small">ຂະໜາດນ້ອຍ (70px)</option>
                            <option value="medium">ຂະໜາດກາງ (100px)</option>
                            <option value="130px">ຂະໜາດກາງ-ໃຫຍ່ (130px)</option>
                            <option value="large">ຂະໜາດໃຫຍ່ (150px)</option>
                            <option value="180px">ຂະໜາດໃຫຍ່ຫຼາຍ (180px)</option>
                            <option value="xlarge">ຂະໜາດໃຫຍ່ສຸດ (200px)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂອບເທິງ QR Code</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptQrMarginTop || '12px'}
                            onChange={(e) => setSettings({ ...settings, receiptQrMarginTop: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dividers & Notes Group */}
                    <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: 'span 2' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', margin: 0 }}>➖ ເສັ້ນຄັ່ນ & ຂໍ້ຄວາມ (Dividers & Notes)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">ຮູບແບບເສັ້ນຄັ່ນ</label>
                          <select
                            className="form-control"
                            value={settings.receiptDividerStyle || 'dashed'}
                            onChange={(e) => setSettings({ ...settings, receiptDividerStyle: e.target.value })}
                          >
                            <option value="dashed">ເສັ້ນຂີດຕໍ່ (Dashed)</option>
                            <option value="dotted">ເສັ້ນຈຸດ (Dotted)</option>
                            <option value="solid">ເສັ້ນທຶບ (Solid)</option>
                            <option value="double">ເສັ້ນຄູ່ (Double)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຄວາມໜາເສັ້ນຄັ່ນ</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptDividerThickness || '1px'}
                            onChange={(e) => setSettings({ ...settings, receiptDividerThickness: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂໍ້ຄວາມຫົວໃບບິນ (Header Note)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptHeaderNote || ''}
                            onChange={(e) => setSettings({ ...settings, receiptHeaderNote: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຂໍ້ຄວາມທ້າຍໃບບິນ (Footer Note)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.receiptFooterNote || ''}
                            onChange={(e) => setSettings({ ...settings, receiptFooterNote: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {settings.receiptLogoUrl && (
                    <div style={{ marginTop: '5px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ພຣີວິວໂລໂກ້ໃບບິນ:</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                        <img src={settings.receiptLogoUrl} alt="Receipt Logo" style={{ width: settings.receiptLogoWidth || '60px', height: settings.receiptLogoWidth || '60px', objectFit: 'cover', borderRadius: settings.receiptLogoShape || '50%', border: '1px solid var(--border-color)' }} />
                        <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }} onClick={() => setSettings({ ...settings, receiptLogoUrl: '' })}>ລຶບຮູບ</button>
                      </div>
                    </div>
                  )}

                  {/* Section Visibilities */}
                  <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', marginTop: '16px' }}>
                    <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>⚙️ ເລືອກສະແດງຂໍ້ມູນຕ່າງໆໃນໃບບິນ (Receipt Sections Visibility)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { id: 'receiptShowLogo', label: 'ສະແດງ ໂລໂກ້ໃບບິນ' },
                        { id: 'receiptShowHeader', label: 'ສະແດງ ຊື່ຮ້ານຄ້າຫົວບິນ' },
                        { id: 'receiptShowContactInfo', label: 'ສະແດງ ທີ່ຢູ່ ແລະ ເບີໂທຕິດຕໍ່' },
                        { id: 'receiptShowBillId', label: 'ສະແດງ ເለກບິນ (Bill ID)' },
                        { id: 'receiptShowDate', label: 'ສະແດง ວັນທີ ແລະ ເວລາ' },
                        { id: 'receiptShowCashier', label: 'ສະແດງ ຊື່ພະນັກງານຂາຍ' },
                        { id: 'receiptShowPaymentMethod', label: 'ສະແດງ ວິທີການຊຳລະເງິນ' },
                        { id: 'receiptShowCustomer', label: 'ສະແດງ ຊື່ ແລະ ເບີໂທລູກຄ້າ' },
                        { id: 'receiptShowSubtotal', label: 'ສະແດງ ຍອດລວມກ່ອນສ່ວນຫຼຸດ' },
                        { id: 'receiptShowDiscount', label: 'ສະແດງ ຍອດສ່ວນຫຼຸດ' },
                        { id: 'receiptShowTotal', label: 'ສະແດງ ຍອດຊຳລະສຸດທິ' },
                        { id: 'receiptShowChange', label: 'ສະແດງ ຍອດເງິນສົດຮັບມາ ແລະ ເງິນທອນ' },
                        { id: 'receiptShowEquivalent', label: 'ສະແດງ ຍອດປຽບທຽບສະກຸນເງິນອື່ນ (THB/USD)' },
                        { id: 'showQrOnReceipt', label: 'ສະແດງ BCEL QR Code ຮັບເງິນ' },
                        { id: 'receiptShowSignatures', label: 'ສະແດງ ບ່ອນເຊັນຜູ້ຈ່າຍ & ຜູ້ຮັບເງິນ' },
                        { id: 'receiptShowFooter', label: 'ສະແດງ ຂໍ້ຄວາມຂອບໃຈທ້າຍໃບບິນ' },
                        { id: 'receiptShowTrackingQr', label: 'ສະແດງ QR Code ຕິດຕາມສະຖານະພຣະ (Amulet Tracking)' }
                      ].map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={settings[item.id] !== false}
                            onChange={(e) => setSettings({ ...settings, [item.id]: e.target.checked })}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Labels Section */}
                  <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', marginTop: '16px' }}>
                    <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', marginBottom: '12px' }}>✍️ ປັບແຕ່ງຂໍ້ຄວາມໃນໃບບິນເອງ (Custom Receipt Labels)</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      ທ່ານສາມາດປ່ຽນຂໍ້ຄວາມຫົວຂໍ້ຕ່າງໆໃນໃບບິນໄດ້ຕາມຄວາມຕ້ອງການ ເຊັ່ນ ຍອດລວມທີ່ຕ້ອງຊຳລະ, ສ່ວນຫຼຸດ, ຈຳນວນ, ລາຄາ ແລະ ອື່ນໆ.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">ຂໍ້ຄວາມ "ຍອດລວມກ່ອນຫຼຸດ" (Subtotal Label)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={(settings.labels && settings.labels.cart_subtotal) || ''}
                          placeholder="ຍອດລວມກ່ອນຫຼຸດ / ຍອດລວມທີ່ເຫຼືອຈາກມັດຈຳ"
                          onChange={(e) => {
                            const newLabels = { ...(settings.labels || {}), cart_subtotal: e.target.value };
                            setSettings({ ...settings, labels: newLabels });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ຂໍ້ຄວາມ "ຍອດລວມສຸດທິ" (Net Total Label)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={(settings.labels && settings.labels.cart_total) || ''}
                          placeholder="ຍອດລວມສຸດທິ / ຍອດທີ່ຕ້ອງຊຳລະ"
                          onChange={(e) => {
                            const newLabels = { ...(settings.labels || {}), cart_total: e.target.value };
                            setSettings({ ...settings, labels: newLabels });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ຂໍ້ຄວາມ "ສ່ວນຫຼຸດ" (Discount Label)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={(settings.labels && settings.labels.rcpt_discount_label) || ''}
                          placeholder="ສ່ວນຫຼຸດ"
                          onChange={(e) => {
                            const newLabels = { ...(settings.labels || {}), rcpt_discount_label: e.target.value };
                            setSettings({ ...settings, labels: newLabels });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ຂໍ້ຄວາມຫົວຕາຕະລາງ "ຈຳນວນ" (Qty Header)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={(settings.labels && settings.labels.rcpt_header_qty) || ''}
                          placeholder="ຈຳນວນ"
                          onChange={(e) => {
                            const newLabels = { ...(settings.labels || {}), rcpt_header_qty: e.target.value };
                            setSettings({ ...settings, labels: newLabels });
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">ຂໍ້ຄວາມຫົວຕາຕະລາງ "ລາຄາ/ຍອດລວມ" (Price/Total Header)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={(settings.labels && settings.labels.rcpt_header_price) || ''}
                          placeholder="ລາຄາ"
                          onChange={(e) => {
                            const newLabels = { ...(settings.labels || {}), rcpt_header_price: e.target.value };
                            setSettings({ ...settings, labels: newLabels });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Receipt Preview */}
                <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '10px' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', margin: '0 0 4px 0' }}>🔍 ຕົວຢ່າງໃບບິນ (Receipt Preview)</h4>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    maxHeight: '620px',
                    overflowY: 'auto',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      width: settings.receiptPaperWidth === '58mm' ? '200px' : '260px',
                      fontSize: settings.receiptFontSize || '10pt',
                      padding: settings.receiptPadding || '5mm',
                      background: 'white',
                      color: 'black',
                      lineHeight: settings.receiptLineHeight || '1.3',
                      marginLeft: settings.receiptMarginLeft || '0mm',
                      marginRight: settings.receiptMarginRight || '0mm',
                      marginTop: settings.receiptMarginTop || '0mm',
                      marginBottom: settings.receiptMarginBottom || '0mm',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      borderRadius: '2px',
                      textAlign: 'left'
                    }}>
                      
                      {/* Cashier Avatar (Printed on top of receipt if activeUser avatar is available) */}
                      {settings.receiptShowCashier !== false && activeUser && activeUser.avatar && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                          <img 
                            src={activeUser.avatar} 
                            alt="Cashier Avatar Preview" 
                            style={{ 
                              width: '70px', 
                              height: '70px', 
                              borderRadius: '50%', 
                              objectFit: 'cover', 
                              border: '2px solid #ddd' 
                            }} 
                          />
                        </div>
                      )}

                      {/* Logo */}
                      {settings.receiptShowLogo !== false && (
                        settings.receiptLogoUrl ? (
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                            <img src={settings.receiptLogoUrl} alt="Logo" style={{ width: settings.receiptLogoWidth || '60px', height: settings.receiptLogoWidth || '60px', borderRadius: settings.receiptLogoShape || '50%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                            <div style={{ width: settings.receiptLogoWidth || '60px', height: settings.receiptLogoWidth || '60px', borderRadius: settings.receiptLogoShape || '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#666', fontWeight: 'bold' }}>LOGO</div>
                          </div>
                        )
                      )}

                      {/* Header */}
                      {settings.receiptShowHeader !== false && (
                        <div style={{ fontWeight: 'bold', fontSize: settings.receiptHeaderFontSize || 'calc(100% + 3pt)', textAlign: 'center', marginBottom: '2px' }}>
                          {settings.shopName || 'ຂອບພຣະຣັທເກຊ'}
                        </div>
                      )}

                      {/* Contact Info */}
                      {settings.receiptShowContactInfo !== false && (
                        <div style={{ fontSize: settings.receiptContactFontSize || 'calc(100% - 2pt)', textAlign: 'center', color: '#333', marginBottom: '6px' }}>
                          <div>{settings.receiptHeaderNote || settings.shopSubtitle || 'ໃບບິນຮັບເງິນ / RECEIPT'}</div>
                          <div>{settings.shopAddress || 'ນະຄອນປາກເຊ'} | ໂທ: {settings.shopPhone || '020 5555 5555'}</div>
                        </div>
                      )}

                      {/* Bill Meta */}
                      <div style={{ fontSize: settings.receiptItemsFontSize || 'calc(100% - 2pt)', marginBottom: '6px', color: '#333' }}>
                        {settings.receiptShowBillId !== false && <div><b>{db.getLabel('rcpt_bill_no', 'ເລກບິນ:')}</b> RCPT-10023</div>}
                        {settings.receiptShowDate !== false && <div><b>ວันທີ:</b> {new Date().toLocaleString('lo-LA')}</div>}
                        {settings.receiptShowCashier !== false && <div><b>{db.getLabel('rcpt_cashier', 'ພະນັກງານຂາຍ:')}</b> ແອດມິນ</div>}
                        {settings.receiptShowPaymentMethod !== false && <div><b>{db.getLabel('rcpt_payment_method_label', 'ການຊຳລະ:')}</b> {db.getLabel('rcpt_payment_cash', 'ເງິນສົດ (Cash)')}</div>}
                        {settings.receiptShowCustomer !== false && <div><b>{db.getLabel('rcpt_customer_label', 'ລູກຄ້າ:')}</b> {db.getLabel('rcpt_customer_general', 'ລູກຄ້າທົ່ວໄປ')}</div>}
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, margin: '6px 0' }}></div>

                      {/* Items */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: settings.receiptItemsFontSize || 'calc(100% - 2pt)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid black', textAlign: 'left' }}>
                            <th>{db.getLabel('rcpt_header_item', 'ລາຍການ')}</th>
                            <th style={{ textAlign: 'center', width: '30px' }}>{db.getLabel('rcpt_header_qty', 'ຈຳນວນ')}</th>
                            <th style={{ textAlign: 'right', width: '60px' }}>{db.getLabel('rcpt_header_price', 'ລາຄາ')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '2px 0' }}>ອັດກອບພຣະ ທອງທິບ</td>
                            <td style={{ textAlign: 'center' }}>1</td>
                            <td style={{ textAlign: 'right' }}>150,000</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 0' }}>ສາຍຄໍ ຫ້ອຍພຣະ</td>
                            <td style={{ textAlign: 'center' }}>1</td>
                            <td style={{ textAlign: 'right' }}>50,000</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Divider */}
                      <div style={{ borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, margin: '6px 0' }}></div>

                      {/* Totals */}
                      {settings.receiptShowSubtotal !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: settings.receiptTotalsFontSize || '100%', padding: '1px 0' }}>
                          <span>{db.getLabel('rcpt_subtotal', 'ຍອດລວມ:')}</span>
                          <span>200,000 ₭</span>
                        </div>
                      )}
                      {settings.receiptShowDiscount !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, padding: '1px 0' }}>
                          <span>{db.getLabel('rcpt_discount_label', 'ສ່ວນຫຼຸດ:')}</span>
                          <span>-20,000 ₭</span>
                        </div>
                      )}
                      {settings.receiptShowTotal !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} + 1pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '4px', marginTop: '4px' }}>
                          <span>{db.getLabel('rcpt_total_label', 'ຍອດຊຳລະສຸດທິ:')}</span>
                          <span>180,000 ₭</span>
                        </div>
                      )}

                      {settings.receiptShowChange !== false && (
                        <div style={{ fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '4px', color: '#333' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{db.getLabel('rcpt_received_label', 'ຮັບເງິນ')} ({db.getLabel('rcpt_currency_lak', 'LAK (ກີບ):').replace(':', '')}):</span>
                            <span>200,000 ₭</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{db.getLabel('rcpt_change_label', 'ເງິນທອນ')}:</span>
                            <span>20,000 ₭</span>
                          </div>
                        </div>
                      )}

                      {/* Equivalents */}
                      {settings.receiptShowEquivalent !== false && (
                        <div style={{ marginTop: '8px', borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, fontSize: 'calc(100% - 2.5pt)', paddingTop: '4px' }}>
                          <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '2px' }}>{db.getLabel('rcpt_equivalent_totals_label', 'ມູນຄ່າທຽບເທົ່າ (Equivalent)')}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{db.getLabel('rcpt_currency_thb', 'THB (ບາດ):')}</span>
                            <span>240 ฿</span>
                          </div>
                        </div>
                      )}

                      {/* QR Code */}
                      {settings.showQrOnReceipt && (
                        <div style={{ marginTop: settings.receiptQrMarginTop || '12px', textAlign: 'center', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '8px' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{db.getLabel('rcpt_qr_payment_title', 'QR Code ຮັບເງິນ (BCEL One)')}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                            <div style={{ width: getQrSizePx(settings.receiptQrSize), height: getQrSizePx(settings.receiptQrSize), background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#666', border: '1px solid #ddd', borderRadius: '4px', fontWeight: 'bold' }}>BCEL QR</div>
                          </div>
                        </div>
                      )}

                      {/* Signatures */}
                      {settings.receiptShowSignatures !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, textAlign: 'center', color: '#333' }}>
                          <div>
                            <div>.......................</div>
                            <div>{db.getLabel('rcpt_paid_by', 'ຜູ້ຈ່າຍເງິນ (Paid By)')}</div>
                          </div>
                          <div>
                            <div>.......................</div>
                            <div>{db.getLabel('rcpt_received_by', 'ຜູ້ຮັບເງິນ (Received By)')}</div>
                          </div>
                        </div>
                      )}

                      {/* Footer Note */}
                      {settings.receiptShowFooter !== false && (
                        <div style={{ marginTop: '12px', borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '4px', textAlign: 'center', fontSize: settings.receiptFooterFontSize || 'calc(100% - 2pt)' }}>
                          <p>{settings.receiptFooterNote || 'ພຣະເຄື່ອງຄຸ້ມຄອງ, ໂຊກດີ ມີໄຊ!'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-end', marginTop: '10px' }}>
                💾 ບັນທຶກຮູບແບບໃບບิน
              </button>
            </form>
          )}

                    {activeSubTab === 'barcode' && (() => {
            const handleProfileChange = (profileKey) => {
              let paperW = '40mm';
              let paperH = '30mm';
              let stickerW = '40mm';
              let stickerH = '30mm';
              let cols = 1;
              let gapX = '0mm';
              let gapY = '0mm';
              let marginL = '0mm';
              let marginT = '0mm';

              if (profileKey === '1_col_30_20') {
                paperW = '30mm';
                paperH = '20mm';
                stickerW = '30mm';
                stickerH = '20mm';
                cols = 1;
                gapX = '0mm';
                gapY = '0mm';
                marginL = '0mm';
                marginT = '0mm';
              } else if (profileKey === '1_col_40_30') {
                paperW = '40mm';
                paperH = '30mm';
                stickerW = '40mm';
                stickerH = '30mm';
                cols = 1;
                gapX = '0mm';
                gapY = '0mm';
                marginL = '0mm';
                marginT = '0mm';
              } else if (profileKey === '2_col_32_25') {
                paperW = '70mm';
                paperH = '25mm';
                stickerW = '32mm';
                stickerH = '25mm';
                cols = 2;
                gapX = '2mm';
                gapY = '0mm';
                marginL = '2mm';
                marginT = '0mm';
              } else if (profileKey === '3_col_32_25') {
                paperW = '105mm';
                paperH = '25mm';
                stickerW = '32mm';
                stickerH = '25mm';
                cols = 3;
                gapX = '2mm';
                gapY = '0mm';
                marginL = '2.5mm';
                marginT = '0mm';
              }

              setSettings(prev => ({
                ...prev,
                barcodeProfile: profileKey,
                barcodePaperWidth: paperW,
                barcodePaperHeight: paperH,
                barcodeStickerWidth: stickerW,
                barcodeStickerHeight: stickerH,
                barcodeColumns: cols,
                barcodeGapX: gapX,
                barcodeGapY: gapY,
                barcodeMarginLeft: marginL,
                barcodeMarginTop: marginT
              }));
            };

            const handleResetBarcodeDefaults = () => {
              setSettings(prev => ({
                ...prev,
                barcodeHeight: 50,
                barcodeWidth: 2,
                barcodeMargin: 10,
                barcodeShowCode: true,
                barcodeShowName: true,
                barcodeShowPrice: true,
                barcodeShowDiscount: false,
                barcodeTextBold: false,
                barcodeTextItalic: false,
                barcodeTextAlign: 'center',
                barcodeCodeSize: 10,
                barcodeNameSize: 10,
                barcodePriceSize: 12,
                barcodeTextSpacing: 5,
                barcodeProfile: '1_col_40_30',
                barcodePaperWidth: '40mm',
                barcodePaperHeight: '30mm',
                barcodeStickerWidth: '40mm',
                barcodeStickerHeight: '30mm',
                barcodeColumns: 1,
                barcodeGapX: '0mm',
                barcodeGapY: '0mm',
                barcodeMarginLeft: '0mm',
                barcodeMarginTop: '0mm'
              }));
            };

            return (
              <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                  <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
                    🔌 ຕັ້ງຄ່າເຄື່ອງສະແກນ ແລະ ການພິມບາໂຄ້ດ (Barcode & Scanner Settings)
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleResetBarcodeDefaults}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      🔄 ໃຊ້ຄ່າເກົ່າ (Reset)
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      💾 ບັນທຶກ (Save)
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="alert alert-success animate-fade-in" style={{ padding: '8px 12px', fontSize: '0.9rem', marginBottom: '8px' }}>
                    {successMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Left Column: Sliders, Toggles, Live Preview */}
                  <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Live Preview Panel */}
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px', alignSelf: 'flex-start' }}>🔍 ຕົວຢ່າງສະຕິກເກີ (Label Preview)</h4>
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '16px',
                        background: 'rgba(0,0,0,0.25)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        boxSizing: 'border-box',
                        overflowX: 'auto'
                      }}>
                        {Array.from({ length: settings.barcodeColumns || 1 }).map((_, idx) => (
                          <div key={idx} style={{
                            width: '160px',
                            height: '110px',
                            background: 'white',
                            color: 'black',
                            borderRadius: '4px',
                            padding: '6px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            flex: '0 0 auto'
                          }}>
                            {settings.barcodeShowName !== false && (
                              <div style={{
                                fontSize: `${settings.barcodeNameSize || 10}pt`,
                                fontWeight: settings.barcodeTextBold ? 'bold' : 'normal',
                                fontStyle: settings.barcodeTextItalic ? 'italic' : 'normal',
                                textAlign: settings.barcodeTextAlign || 'center',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: `${settings.barcodeTextSpacing || 4}px`,
                                flex: '0 0 auto'
                              }}>
                                ສິນຄ້າທົດສອບ (Test Product)
                              </div>
                            )}

                            {previewBarcodeUrl ? (
                              <img 
                                src={previewBarcodeUrl} 
                                alt="Barcode Preview" 
                                style={{ maxWidth: '100%', maxHeight: '55%', objectFit: 'contain', flex: '1 1 auto', minHeight: 0 }} 
                              />
                            ) : (
                              <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>LOADING</div>
                            )}

                            {settings.barcodeShowPrice !== false && (
                              <div style={{
                                fontSize: `${settings.barcodePriceSize || 12}pt`,
                                fontWeight: settings.barcodeTextBold ? 'bold' : 'normal',
                                fontStyle: settings.barcodeTextItalic ? 'italic' : 'normal',
                                textAlign: settings.barcodeTextAlign || 'center',
                                width: '100%',
                                marginTop: `${settings.barcodeTextSpacing || 4}px`,
                                flex: '0 0 auto'
                              }}>
                                {settings.barcodeShowDiscount && <del style={{ marginRight: '6px', fontSize: '0.8em', color: '#666' }}>120,000 ₭</del>}
                                100,000 ₭
                              </div>
                            )}
                          </div>
                        ))}
                      </div>                  </div>

                    {/* Sliders & Format dropdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">ປະເພດບາໂຄ້ດ (Barcode Type)</label>
                        <select
                          className="form-control"
                          value={settings.barcodeFormat || 'CODE128'}
                          onChange={(e) => setSettings({ ...settings, barcodeFormat: e.target.value })}
                        >
                          <option value="QRCODE">QR Code (ສຳລັບບາໂຄ້ດສັ້ນ/2D)</option>
                          <option value="CODE128">CODE128 (ແນະນຳ)</option>
                          <option value="CODE39">CODE39 (ງານທົ່ວໄປ)</option>
                          <option value="EAN13">EAN-13 (ມາດຕະຖານສິນຄ້າ)</option>
                          <option value="EAN8">EAN-8 (ສິນຄ້າຂະໜາດນ້ອຍ)</option>
                          <option value="UPC">UPC-A</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">ຕຳແໜ່ງຂໍ້ຄວາມ (Text Alignment)</label>
                        <select
                          className="form-control"
                          value={settings.barcodeTextAlign || 'center'}
                          onChange={(e) => setSettings({ ...settings, barcodeTextAlign: e.target.value })}
                        >
                          <option value="left">ຊ້າຍ (Left)</option>
                          <option value="center">ກາງ (Center)</option>
                          <option value="right">ຂວາ (Right)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ສູງ (Height)</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodeHeight || 50}px</span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="150"
                          value={settings.barcodeHeight || 50}
                          onChange={(e) => setSettings({ ...settings, barcodeHeight: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ກວ້າງ (Line Width)</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodeWidth || 2}px</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          value={settings.barcodeWidth || 2}
                          onChange={(e) => setSettings({ ...settings, barcodeWidth: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຂອບຫວ່າງ (Margin)</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodeMargin || 10}px</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={settings.barcodeMargin || 10}
                          onChange={(e) => setSettings({ ...settings, barcodeMargin: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                    </div>

                    {/* Toggle Switches */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeShowCode !== false}
                          onChange={(e) => setSettings({ ...settings, barcodeShowCode: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        ສະແດງລະຫັດ (Show Code)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeShowName !== false}
                          onChange={(e) => setSettings({ ...settings, barcodeShowName: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        ສະແດງຊື່ສິນຄ້າ (Show Name)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeShowPrice !== false}
                          onChange={(e) => setSettings({ ...settings, barcodeShowPrice: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        ສະແດງລາຄา (Show Price)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeShowDiscount === true}
                          onChange={(e) => setSettings({ ...settings, barcodeShowDiscount: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        ສະແດງສ່ວນຫຼຸດ (Show Discount)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeTextBold === true}
                          onChange={(e) => setSettings({ ...settings, barcodeTextBold: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        ໂຕໜາ (Bold Text)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeTextItalic === true}
                          onChange={(e) => setSettings({ ...settings, barcodeTextItalic: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        ໂຕອຽງ (Italic Text)
                      </label>
                    </div>

                    {/* Font sizes & gaps */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຂະໜາດຟອນຕ໌ລະຫັດ</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodeCodeSize || 10}pt</span>
                        </label>
                        <input
                          type="range"
                          min="6"
                          max="24"
                          value={settings.barcodeCodeSize || 10}
                          onChange={(e) => setSettings({ ...settings, barcodeCodeSize: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຂະໜາດຟອນຕ໌ຊື່ສິນຄ້າ</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodeNameSize || 10}pt</span>
                        </label>
                        <input
                          type="range"
                          min="6"
                          max="24"
                          value={settings.barcodeNameSize || 10}
                          onChange={(e) => setSettings({ ...settings, barcodeNameSize: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຂະໜາດຟອນຕ໌ລາຄາ</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodePriceSize || 12}pt</span>
                        </label>
                        <input
                          type="range"
                          min="6"
                          max="24"
                          value={settings.barcodePriceSize || 12}
                          onChange={(e) => setSettings({ ...settings, barcodePriceSize: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ໄລຍະຫ່າງບาໂຄດ/ໂຕໜັງສື</span>
                          <span style={{ color: 'var(--gold-primary)' }}>{settings.barcodeTextSpacing || 5}px</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={settings.barcodeTextSpacing || 5}
                          onChange={(e) => setSettings({ ...settings, barcodeTextSpacing: parseInt(e.target.value) })}
                          style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">ຄວາມໄວເຄື່ອງສະແກນ (Scan Delay ms)</label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        className="form-control"
                        value={settings.barcodeDelay || 50}
                        onChange={(e) => setSettings({ ...settings, barcodeDelay: parseInt(e.target.value) || 50 })}
                      />
                      <small style={{ color: 'var(--text-secondary)' }}>ຄວາມໄວສົ່ງຄ່າຂອງເຄື່ອງສະແກນ (ມາດຕະຖານ: 50ms)</small>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={settings.barcodeBeep !== false}
                          onChange={(e) => setSettings({ ...settings, barcodeBeep: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                        />
                        ເປີດສຽງ Beep ເມື່ອສະແກນບາໂຄ້ດສຳເລັດ
                      </label>
                    </div>

                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid var(--accent-amber)' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', marginBottom: '8px' }}>⚡ ຕັ້ງຄ່າການພິມບາໂຄ້ດໂດຍກົງ (Direct/Silent Print Settings)</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          id="barcodeDirectPrint"
                          checked={settings.barcodeDirectPrint === true}
                          onChange={(e) => setSettings({ ...settings, barcodeDirectPrint: e.target.checked })}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold-primary)' }}
                        />
                        <label htmlFor="barcodeDirectPrint" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'white' }}>
                          ເປີດການພິມບາໂຄ້ດອັດຕະໂນມັດໂດຍກົງ (Direct Print via Backend API)
                        </label>
                      </div>
                      {settings.barcodeDirectPrint && (
                        <div className="form-group">
                          <label className="form-label">ຊື່ເຄື່ອງພິມບາໂຄ້ດໃນ Windows (Barcode Printer Name)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.windowsBarcodePrinterName || 'Barcode Printer'}
                            onChange={(e) => setSettings({ ...settings, windowsBarcodePrinterName: e.target.value })}
                            placeholder="e.g. Xprinter XP-365B"
                          />
                          <small style={{ color: 'var(--text-secondary)' }}>ປ້ອນຊື່ເຄື່ອງພິມໃຫ້ກົງກັບທີ່ຕັ້ງຄ່າໄວ້ໃນ Control Panel</small>
                        </div>
                      )}
                    </div>

                                        {/* General Printer & Hardware Settings */}
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', marginTop: '16px', borderLeft: '4px solid var(--gold-primary)' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', marginBottom: '12px' }}>📠 ຕັ້ງຄ່າເຄື່ອງພິມ & ອຸປະກອນເຊື່ອມຕໍ່ (Printer & Hardware Settings)</h4>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">ຮູບແບບການເຊື່ອມຕໍ່ເຄື່ອງພິມ (Printer Connection Type)</label>
                        <select
                          className="form-control"
                          value={settings.printerConnectionType || 'windows'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({ 
                              ...settings, 
                              printerConnectionType: val,
                              windowsPrinterName: val === 'lan' ? (settings.lanPrinterIp || '192.168.1.100') : (settings.windowsPrinterName || 'GP-L80250 Series')
                            });
                          }}
                          style={{ background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border-color)', height: '38px', borderRadius: '8px' }}
                        >
                          <option value="windows">🔌 ໃຊ້ Driver Windows (USB / Driver Spooler)</option>
                          <option value="lan">🌐 ເຊື່ອມຕໍ່ຜ່ານສາຍ LAN / Network IP (Direct TCP/IP)</option>
                        </select>
                      </div>

                      {settings.printerConnectionType === 'lan' ? (
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">ທີ່ຢູ່ IP ຂອງເຄື່ອງພິມ LAN (LAN Printer IP Address)</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              className="form-control"
                              value={settings.lanPrinterIp || ''}
                              onChange={(e) => {
                                const ip = e.target.value;
                                setSettings({ 
                                  ...settings, 
                                  lanPrinterIp: ip,
                                  windowsPrinterName: ip
                                });
                              }}
                              placeholder="e.g. 192.168.1.100"
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                              onClick={async (e) => {
                                try {
                                  const baseUrl = settings.printServerUrl || 'http://localhost:5173';
                                  const btn = e.currentTarget;
                                  const origText = btn.innerText;
                                  btn.innerText = '🔍 ກຳລັງຄົ້ນຫາ...';
                                  btn.disabled = true;
                                  
                                  const res = await fetch(`${baseUrl}/api/discover-printers`);
                                  const data = await res.json();
                                  
                                  btn.innerText = origText;
                                  btn.disabled = false;

                                  if (data.success && data.printers && data.printers.length > 0) {
                                    const detectedIp = data.printers[0];
                                    setSettings({ 
                                      ...settings, 
                                      lanPrinterIp: detectedIp,
                                      windowsPrinterName: detectedIp
                                    });
                                    alert(`✓ ພົບເຄື່ອງພິມ LAN ທີ່ IP: ${detectedIp}`);
                                  } else {
                                    alert('⚠️ ບໍ່ພົບເຄື່ອງພິມ LAN ໃດໆໃນເຄືອຂ່າຍ (ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ສາຍ LAN)');
                                  }
                                } catch (err) {
                                  alert('❌ ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີເວີການພິມເພື່ອຄົ້ນຫາໄດ້: ' + err.message);
                                }
                              }}
                            >
                              🔍 ຄົ້ນຫາອັດຕະໂນມັດ
                            </button>
                          </div>
                          <small style={{ color: 'var(--text-secondary)' }}>ປ້ອນ IP ຂອງເຄື່ອງພິມ LAN ເຊັ່ນ 192.168.1.100 ຫຼື ກົດປຸ່ມຄົ້ນຫາອັດຕະໂນມັດ (ພອດມາດຕະຖານ: 9100)</small>
                        </div>
                      ) : (
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label">ຊື່ເຄື່ອງພິມໃບບິນໃນ Windows (Windows Printer Name)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.windowsPrinterName || 'GP-L80250 Series'}
                            onChange={(e) => setSettings({ ...settings, windowsPrinterName: e.target.value })}
                            placeholder="e.g. GP-L80250 Series"
                          />
                          <small style={{ color: 'var(--text-secondary)' }}>ຊື່ເຄື່ອງພິມຫຼັກໃນ Control Panel (ໃຊ້ສຳລັບການປິ້ນ ແລະ ຍິງລິ້ນຊັກເກັບເງິນ)</small>
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">ທີ່ຢູ່ເຊີເວີການພິມ (Local Print Server URL)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.printServerUrl || 'http://localhost:5173'}
                          onChange={(e) => setSettings({ ...settings, printServerUrl: e.target.value })}
                          placeholder="e.g. http://localhost:5173"
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>ທີ່ຢູ່ຂອງ API ການພິມ (ເຊັ່ນ: http://192.168.1.50:5173 ຫາກພະນັກງານປິ້ນຜ່ານໂທລະສັບ)</small>
                      </div>

                      {/* LAN Printer & Bluetooth Scanner Instructions */}
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(212,175,55,0.05)', border: '1px dashed var(--gold-primary)', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <h5 style={{ color: 'var(--gold-primary)', margin: '0 0 8px', fontSize: '0.85rem' }}>ℹ️ ວິທີຕັ້ງຄ່າການພິມຜ່ານ LAN & ເຄື່ອງສະແກນ Bluetooth</h5>
                        <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                          <li><b>ເຄື່ອງພິມ LAN & ລิ້ນຊັກ:</b> ເຊື່ອມຕໍ່ສາຍ LAN ເຂົ້າເຄື່ອງພິມ, ຈາກນັ້ນເສີບສາຍ RJ11 ຂອງລິ້ນຊັກເກັບເງິນເຂົ້າເຄື່ອງພິມ. ເມື່ອມີການພິມບິນ ລະບົບຈະຍິງກະແສໄຟເປີດລິ້ນຊັກໂດຍກົງຜ່ານ IP ອັດຕະໂນມັດ.</li>
                          <li><b>ເຄື່ອງສະແກນ Bluetooth:</b> ເຊື່ອມຕໍ່ (Pair) ເຄື່ອງສະແກນເຂົ້າກັບໂທລະສັບ ຫຼື ຄອມພິວເຕີ ໂດຍຕັ້ງຄ່າໃຫ້ຢູ່ໃນໂໝດ <b>Keyboard Emulator (HID)</b>. ລະບົບ POS ຈະຮັບຄ່າບາໂຄ້ດ ແລະ ເພີ່ມສິນຄ້າເຂົ້າຕະກ່າໃຫ້ເອງໂດຍອັດຕະໂນມັດທັນທີເມື່ອສະແກນ.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Online Shop & QR Code Settings */}
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', marginTop: '16px', borderLeft: '4px solid #3498db' }}>
                      <h4 style={{ color: '#3498db', fontSize: '0.9rem', marginBottom: '12px' }}>🌐 ຕັ້ງຄ່າເວັບໄຊຕ໌/ເມนູອອນລາຍ (Online Shop & Menu QR Settings)</h4>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">ລິ້ງເວັບໄຊຕ໌/ເມນູອອນລາຍ (Online Shop Link URL)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.onlineShopUrl || ''}
                          onChange={(e) => setSettings({ ...settings, onlineShopUrl: e.target.value })}
                          placeholder={`e.g. ${window.location.origin}`}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>ລິ້ງສຳລັບໃຫ້ລູກຄ້າສະແກນເບິ່ງສິນຄ້າ ຫຼື ສັ່ງອາຫານອອນລາຍ (ຫາກວ່າງໄວ້ ຈະໃຊ້ທີ່ຢູ່ເວັບໄຊຕ໌ປັດຈຸບັນ)</small>
                      </div>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">ຫົວຂໍ້/ຄຳອະທິບາຍ QR (QR Label / Description)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.onlineShopLabel || ''}
                          onChange={(e) => setSettings({ ...settings, onlineShopLabel: e.target.value })}
                          placeholder="e.g. ສະແກນເບິ່ງເມນູອອນລາຍ (Scan Menu Online)"
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>ຂໍ้ຄວາມສະແດງໃຕ້ຮູບ QR Code (ປ່ຽນຂໍ້ຄວາມສະແກນເບິ່ງເມນູໃນຮ້ານໄດ້)</small>
                      </div>

                      {/* Live QR Code Preview */}
                      <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>👁️ ຕົວຢ່າງ QR Code ທີ່ລູກຄ້າຈະສະແກน:</div>
                        <div style={{ display: 'inline-block', padding: '10px', background: 'white', borderRadius: '12px' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(settings.onlineShopUrl || window.location.origin)}`} 
                            alt="Online Shop QR Preview" 
                            style={{ width: '120px', height: '120px', display: 'block' }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white', marginTop: '6px' }}>
                          {settings.onlineShopLabel || 'ສະແກນເບິ່ງເມນູອອນລາຍ (Scan Menu Online)'}
                        </div>
                      </div>
                    </div>

                    {/* Hardware Tester */}
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', marginBottom: '8px' }}>📟 ທົດສອບເຄື່ອງສະແກນບາໂຄ້ດ (Scanner Hardware Tester)</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        ຄລິກໃສ່ກ່ອງຂໍ້ຄວາມດ້ານລຸ່ມ ແລ້ວທົດລອງສະແກນບາໂຄ້ດສິນຄ້າ ເພື່ອທົດສອບການເຊື່ອມຕໍ່:
                      </p>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ຄລິກບ່ອນນີ້ແລ້ວທົດລອງສະແກນ..."
                          style={{ flex: 1, background: '#1c1915' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val) {
                                setScanTestResult("✓ ລະຫັດທີ່ສະແກນໄດ້: \"" + val + "\" (ຄວາມຍາວ: " + val.length + " ຕົວອັກສອນ)");
                                e.target.value = '';
                                
                                try {
                                  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                  const oscillator = audioCtx.createOscillator();
                                  const gainNode = audioCtx.createGain();
                                  oscillator.connect(gainNode);
                                  gainNode.connect(audioCtx.destination);
                                  oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                                  gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                                  oscillator.start();
                                  oscillator.stop(audioCtx.currentTime + 0.08);
                                } catch (err) {}
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            try {
                              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                              const oscillator = audioCtx.createOscillator();
                              const gainNode = audioCtx.createGain();
                              oscillator.connect(gainNode);
                              gainNode.connect(audioCtx.destination);
                              oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                              oscillator.start();
                              oscillator.stop(audioCtx.currentTime + 0.08);
                            } catch (err) {}
                          }}
                        >
                          🔊 ທົດສອບສຽງ Beep
                        </button>
                      </div>
                      {scanTestResult && (
                        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--success-green)', fontWeight: 'bold' }}>{scanTestResult}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Paper profile card */}
                  <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                      <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        📄 ຕັ້ງຄ່າໜ້າເຈ້ຍ (Paper Dimensions)
                      </h4>

                      <div className="form-group">
                        <label className="form-label">ໂປຣໄຟລ໌ເຈ້ຍສະຕິກເກີ (Sticker Profile)</label>
                        <select
                          className="form-control"
                          value={settings.barcodeProfile || '1_col_40_30'}
                          onChange={(e) => handleProfileChange(e.target.value)}
                        >
                          <option value="1_col_30_20">ບາໂຄ້ດ (1 ດວງ/ແຖວ) 30x20 ມມ.</option>
                          <option value="1_col_40_30">ບາໂຄ້ດ (1 ດວງ/ແຖວ) 40x30 ມມ.</option>
                          <option value="2_col_32_25">ບາໂຄ້ດ (2 ດວງ/ແຖວ) 32x25 ມມ.</option>
                          <option value="3_col_32_25">ບາໂຄ້ດ (3 ດວງ/ແຖວ) 32x25 ມມ.</option>
                          <option value="custom">ກຳນົດເອງ (Custom Profile)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="form-group">
                          <label className="form-label">ຄວາມກວ້າງເຈ້ຍ (Paper Width)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodePaperWidth || '40mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodePaperWidth: e.target.value })}
                            placeholder="e.g. 40mm, 80mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຄວາມສູງເຈ້ຍ (Paper Height)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodePaperHeight || '25mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodePaperHeight: e.target.value })}
                            placeholder="e.g. 25mm, auto"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຄວາມກວ້າງສະຕິກເກີ (Sticker Width)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodeStickerWidth || '40mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeStickerWidth: e.target.value })}
                            placeholder="e.g. 40mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຄວາມສູງສະຕິກເກີ (Sticker Height)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodeStickerHeight || '25mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeStickerHeight: e.target.value })}
                            placeholder="e.g. 25mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ຈຳນວນຖັນຕໍ່ແຖວ (Columns/Row)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            className="form-control"
                            value={settings.barcodeColumns || 1}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeColumns: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ໄລຍະຫ່າງແນວນອນ (Gap X)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodeGapX || '2mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeGapX: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ໄລຍະຫ່າງແນວຕັ້ງ (Gap Y)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodeGapY || '2mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeGapY: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ໄລຍະຂອບຊ້າຍ (Left Margin)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodeMarginLeft || '0mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeMarginLeft: e.target.value })}
                            placeholder="e.g. 0mm, 2mm"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">ໄລຍະຂອບເທິງ (Top Margin)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.barcodeMarginTop || '0mm'}
                            disabled={settings.barcodeProfile !== 'custom'}
                            onChange={(e) => setSettings({ ...settings, barcodeMarginTop: e.target.value })}
                            placeholder="e.g. 0mm, 2mm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            );
          })()}

          {activeSubTab === 'theme' && (
            <form onSubmit={(e) => {
              e.preventDefault();
              db.saveSettings(settings);
              setSuccessMsg('✓ ບັນທຶກການຕັ້ງຄ່າຮູບແບບສີ, UI ແລະ Dashboard ສຳເລັດ!');
              if (onUpdate) onUpdate();
              setTimeout(() => setSuccessMsg(''), 3000);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                🎨 ປັບແຕ່ງຮູບແບບ, UI & ໜ້າ Dashboard (Theme & Layout Configurator)
              </h3>
              
              {/* Preset Themes */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>🌈 ເለືອກໂທນສີຫຼັກເລີ່ມຕົ້ນ (Preset Themes)</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[
                    { id: 'gold', name: '🟡 ສີທອງ (Temple Gold)', primary: '#d4af37', bgMain: '#0c0b09', bgCard: '#161411', border: '#2e2a22' },
                    { id: 'amber', name: '🟠 ສີສົ້ມ (Warm Amber)', primary: '#e67e22', bgMain: '#0f0e0c', bgCard: '#1d1914', border: '#33271d' },
                    { id: 'emerald', name: '🟢 ສີຂຽວ (Emerald)', primary: '#2ecc71', bgMain: '#080d0a', bgCard: '#101c14', border: '#172e21' },
                    { id: 'blue', name: '🔵 ສີຟ້າ (Royal Blue)', primary: '#3498db', bgMain: '#080d12', bgCard: '#101720', border: '#1a2636' },
                    { id: 'crimson', name: '🔴 ສີແດງ (Crimson Red)', primary: '#e74c3c', bgMain: '#100a0a', bgCard: '#1e1111', border: '#331d1d' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className="btn"
                      style={{
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        border: settings.appTheme === t.id ? '2px solid white' : '1px solid var(--border-color)',
                        background: '#1a1815',
                        color: settings.appTheme === t.id ? t.primary : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        const updatedColors = {
                          ...(settings.themeColors || {}),
                          'gold-primary': t.primary,
                          'bg-main': t.bgMain,
                          'bg-card': t.bgCard,
                          'border-color': t.border
                        };
                        const updatedThemeConfig = {
                          ...(settings.themeConfig || {}),
                          colors: {
                            ...(settings.themeConfig?.colors || {}),
                            primary: t.primary,
                            background: t.bgMain,
                            card: t.bgCard,
                            border: t.border
                          }
                        };
                        setSettings({
                          ...settings,
                          appTheme: t.id,
                          themeColors: updatedColors,
                          themeConfig: updatedThemeConfig
                        });
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Colors Section */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>🎨 ປັບແຕ່ງສີລະບົບລະອຽດ (System Color Palette)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'ສີຫຼັກ (Primary Gold)', key: 'primary', defaultValue: '#D4AF37' },
                    { label: 'ສີຮອງ (Secondary Brown)', key: 'secondary', defaultValue: '#4A3B32' },
                    { label: 'ພື້ນຫຼັງ (Main Background)', key: 'background', defaultValue: '#13110F' },
                    { label: 'ພື້ນຫຼັງກ່ອງ (Card/Surface)', key: 'card', defaultValue: '#24201C' },
                    { label: 'ພື້ນຫຼັງເມນູ (Sidebar)', key: 'sidebar', defaultValue: '#1E1B18' },
                    { label: 'ແຖບເທິງ (Topbar)', key: 'topbar', defaultValue: '#191613' },
                    { label: 'ຂອບ (Border)', key: 'border', defaultValue: '#3D352E' },
                    { label: 'ສີສຳເລັດ (Success Green)', key: 'success', defaultValue: '#2ecc71' },
                    { label: 'ສີແຈ້ງເຕືອນ (Danger Red)', key: 'danger', defaultValue: '#e74c3c' }
                  ].map(c => {
                    const currentColor = settings.themeConfig?.colors?.[c.key] || c.defaultValue;
                    return (
                      <div key={c.key} className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>{c.label}</label>
                        <input
                          type="color"
                          className="form-control"
                          style={{ height: '36px', padding: '2px', cursor: 'pointer' }}
                          value={currentColor}
                          onChange={(e) => {
                            const updatedConfig = {
                              ...(settings.themeConfig || {}),
                              colors: {
                                ...(settings.themeConfig?.colors || {}),
                                [c.key]: e.target.value
                              }
                            };
                            const legacyMap = { primary: 'gold-primary', background: 'bg-main', card: 'bg-card', border: 'border-color', success: 'success-green', danger: 'alert-red' };
                            const updatedColors = { ...(settings.themeColors || {}) };
                            if (legacyMap[c.key]) {
                              updatedColors[legacyMap[c.key]] = e.target.value;
                            }
                            setSettings({
                              ...settings,
                              themeColors: updatedColors,
                              themeConfig: updatedConfig
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Layout & Typography Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Border Radius and Spacing */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>📐 ປັບແຕ່ງຂະໜາດ & ຄວາມໂຄ້ງມົນ (Layout Settings)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ຄວາມໂຄ້ງມົນຂອງຂອບ (Border Radius)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                          {parseInt(settings.themeConfig?.layout?.borderRadius || '8')}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        className="form-control"
                        value={parseInt(settings.themeConfig?.layout?.borderRadius || '8')}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            layout: {
                              ...(settings.themeConfig?.layout || {}),
                              borderRadius: val + 'px'
                            }
                          };
                          const updatedColors = {
                            ...(settings.themeColors || {}),
                            'radius-lg': val + 'px',
                            'radius-md': Math.round(val / 2) + 'px',
                            'radius-sm': Math.round(val / 4) + 'px'
                          };
                          setSettings({ ...settings, themeColors: updatedColors, themeConfig: updatedConfig });
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຄວາມກວ້າງເມນູຊ້າຍ (Sidebar Width)</label>
                      <select
                        className="form-control"
                        value={settings.themeConfig?.layout?.sidebarWidth || '260px'}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            layout: {
                              ...(settings.themeConfig?.layout || {}),
                              sidebarWidth: e.target.value
                            }
                          };
                          setSettings({ ...settings, themeConfig: updatedConfig });
                        }}
                      >
                        <option value="220px">220px (ເມນູຂະໜາດນ້ອຍ)</option>
                        <option value="240px">240px (ເມນູປານກາງ)</option>
                        <option value="260px">260px (ເມນູມາດຕະຖານ)</option>
                        <option value="280px">280px (ເມນູຂະໜາດໃຫຍ່)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>✍️ ປັບແຕ່ງຕົວໜັງສື (Typography)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຟອນຕົວໜັງສື (Font Family)</label>
                      <select
                        className="form-control"
                        value={settings.themeConfig?.typography?.fontFamily || 'Outfit, Phetsarath OT, sans-serif'}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            typography: {
                              ...(settings.themeConfig?.typography || {}),
                              fontFamily: e.target.value
                            }
                          };
                          setSettings({ ...settings, themeConfig: updatedConfig });
                        }}
                      >
                        <option value="Phetsarath, Noto Sans Lao, sans-serif">Phetsarath / Noto Sans Lao</option>
                        <option value="Outfit, Phetsarath OT, sans-serif">Outfit & Phetsarath (Premium Layout)</option>
                        <option value="Phetsarath OT, Inter, sans-serif">Inter & Phetsarath OT</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຂະໜາດຕົວໜັງສືເລີ່ມຕົ້ນ (Base Font Size)</label>
                      <select
                        className="form-control"
                        value={settings.themeConfig?.typography?.fontSizeBase || '14px'}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(settings.themeConfig || {}),
                            typography: {
                              ...(settings.themeConfig?.typography || {}),
                              fontSizeBase: e.target.value
                            }
                          };
                          setSettings({ ...settings, themeConfig: updatedConfig });
                        }}
                      >
                        <option value="13px">13px (ຕົວໜັງສືນ້ອຍ)</option>
                        <option value="14px">14px (ຕົວໜັງສືປົກກະຕິ)</option>
                        <option value="15px">15px (ຕົວໜັງສືໃຫຍ່)</option>
                        <option value="16px">16px (ຕົວໜັງສືໃຫຍ່ພິເສດ)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* UI Controls Toggles */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>⚙️ ການຄວບຄຸມເອັບເຟັກ UI & ລະບົບ (UI Toggles)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { label: '✨ ເອັບເຟັກການເຄື່ອນໄຫວ (Animations)', key: 'animationEnabled' },
                    { label: '🌓 ເງົາ ແລະ ມິຕິກ່ອງ (Card Shadows)', key: 'shadowsEnabled' },
                    { label: '🔲 ປຸ່ມຂອບມົນ (Rounded Corners)', key: 'roundedCorners' },
                    { label: '⚡ ເອັບເຟັກຊີ້ເມົາ (Hover Scale-up)', key: 'hoverEffects' },
                    { label: '⏳ ໂຫຼດແບບ Skeleton (Loading placeholders)', key: 'skeletonLoading' },
                    { label: '🔔 ແຈ້ງເຕືອນແອບພັອບອັບ (Toast alerts)', key: 'toastNotifications' },
                    { label: '🔄 ໂຫຼດແດຊບອດອັດຕະໂນມັດ (Auto dashboard refresh)', key: 'autoRefreshDashboard' },
                    { label: '🔊 ສຽງເອັບເຟັກກົດປຸ່ມ (Click sounds)', key: 'soundEffects' }
                  ].map(u => {
                    const isChecked = settings.uiControls?.[u.key] ?? true;
                    return (
                      <label key={u.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updatedUi = {
                              ...(settings.uiControls || {}),
                              [u.key]: e.target.checked
                            };
                            setSettings({
                              ...settings,
                              uiControls: updatedUi
                            });
                          }}
                        />
                        {u.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dashboard widgets builder */}
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>📊 ຕົວຈັດການກ່ອງສະແດງຜົນໜ້າ Dashboard (Dashboard Builder Widgets)</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  ເລືອກວິດເຈັດ (Widgets) ທີ່ຕ້ອງການໃຫ້ສະແດງຜົນໃນໜ້າທຳອິດ ຫຼື ໜ້າລາຍງານ.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                      { label: '💵 ຍອດຂາຍມື້ນີ້ (Sales Today)', id: 'sales_today' },
                      { label: '📈 ກຣາຟລາຍຮັບ (Revenue Chart)', id: 'revenue_chart' },
                      { label: '📦 ມູນຄ່າສະຕັອກ (Stock Valuation)', id: 'stock_valuation' },
                      { label: '🏭 ກຳລັງການຜະລິດ (Capacity Tool)', id: 'capacity_widget' },
                      { label: '👥 ລາຍຊື່ເຂົ້າງານ (Attendance list)', id: 'attendance_checklist' }
                    ].map(w => {
                      const activeWidgets = settings.dashboardBuilder?.widgets || [];
                      const isIncluded = activeWidgets.includes(w.id);
                      return (
                        <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={(e) => {
                              let updatedWidgets = [...activeWidgets];
                              if (e.target.checked) {
                                if (!updatedWidgets.includes(w.id)) updatedWidgets.push(w.id);
                              } else {
                                updatedWidgets = updatedWidgets.filter(id => id !== w.id);
                              }
                              setSettings({
                                ...settings,
                                dashboardBuilder: {
                                  ...(settings.dashboardBuilder || {}),
                                  widgets: updatedWidgets
                                }
                              });
                            }}
                          />
                          {w.label}
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ຮູບແບບກຣາຟລາຍຮັບ (Default Chart Type)</label>
                      <select
                        className="form-control"
                        value={settings.dashboardBuilder?.chartType || 'bar'}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            dashboardBuilder: {
                              ...(settings.dashboardBuilder || {}),
                              chartType: e.target.value
                            }
                          });
                        }}
                      >
                        <option value="bar">📊 ກຣາຟແທ່ງ (Bar Chart)</option>
                        <option value="line">📈 ກຣາຟເສັ້ນ (Line Chart)</option>
                        <option value="pie">🍕 ກຣາຟວົງກົມ (Pie Chart)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>ໄລຍະເວລາໂຫຼດໃໝ່ - ວິນາທີ (Auto Refresh Interval)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="10"
                        max="300"
                        value={settings.dashboardBuilder?.refreshInterval || 60}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            dashboardBuilder: {
                              ...(settings.dashboardBuilder || {}),
                              refreshInterval: parseInt(e.target.value) || 60
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-end', marginTop: '10px' }}>
                💾 ບັນທຶກຮູບແບບ, UI & ວິດເຈັດ
              </button>
            </form>
          )}

          {activeSubTab === 'labels' && (() => {
            const sectionNames = {
              all: '🌐 ທັງໝົດ (All)',
              navigation: '🧭 ເມນູຫຼັກ & ນຳທາງ',
              pos: '🛒 ຂາຍໜ້າຮ້ານ & ບັດຄິວ',
              inventory: '📦 ສະຕັອກ & ຄັງສິນຄ້າ',
              reports: '📊 ລາຍງານ & ການເງິນ',
              debts: '📒 ບັນຊີລູກຄ້າຕິດໜີ້',
              hrm: '👥 ບຸກຄະລາກອນ & ເງິນເດືອນ',
              receipt: '🖨️ ຮູບແບບໃບບິນ',
              tracking: '🔍 ຕິດຕາມສະຖານະພຣະ',
              settings: '⚙️ ຕັ້ງຄ່າລະບົບ',
              system: '🔔 ປ໋ອບອັບ & ຂໍ້ຄວາມລະບົບ'
            };

            const filteredKeys = DEFAULT_LABEL_KEYS.filter(item => {
              const matchesSearch = item.key.toLowerCase().includes(labelsSearchQuery.toLowerCase()) || 
                                    item.desc.toLowerCase().includes(labelsSearchQuery.toLowerCase()) || 
                                    item.defaultValue.toLowerCase().includes(labelsSearchQuery.toLowerCase());
              const matchesSection = selectedLabelSection === 'all' || item.section === selectedLabelSection;
              return matchesSearch && matchesSection;
            });

            return (
              <form onSubmit={(e) => {
                e.preventDefault();
                db.saveLabels(settings.labels || {});
                setSuccessMsg('✓ ບັນທຶກການປັບແຕ່ງຂໍ້ຄວາມສຳເລັດ!');
                if (onUpdate) onUpdate();
                setTimeout(() => setSuccessMsg(''), 3000);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                  📝 ປັບແຕ່ງຂໍ້ຄວາມ ແລະ ພາສາໃນແອັບ (Language & Label Customizer)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  ທ່ານສາມາດປ່ຽນແປງຄຳສັບ ຫຼື ປ່ຽນພາສາລາວ/ໄທ ຂອງປຸ່ມ, ຫົວຂໍ້ ແລະ ຂໍ້ຄວາມຕ່າງໆ ໃນແອັບພລິເຄຊັນໄດ້ທັງໝົດຕາມທີ່ຕ້ອງການ. ຫາກປະໃສ່ວ່າງ ລະບົບຈະໃຊ້ຄ່າເລີ່ມຕົ້ນ.
                </p>

                {/* Section filter pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {Object.entries(sectionNames).map(([key, name]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedLabelSection(key)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid ' + (selectedLabelSection === key ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)'),
                        background: selectedLabelSection === key ? 'rgba(212,175,55,0.1)' : 'transparent',
                        color: selectedLabelSection === key ? 'var(--gold-primary)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: selectedLabelSection === key ? '600' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 ຄົ້ນຫາຂໍ້ຄວາມ ຫຼື ຄີທີ່ຕ້ອງການແກ້ໄຂ..."
                    value={labelsSearchQuery}
                    onChange={(e) => setLabelsSearchQuery(e.target.value)}
                    style={{ background: '#1c1915' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                  {filteredKeys.length === 0 ? (
                    <p style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>ບໍ່ພົບລາຍການທີ່ຄົ້ນຫາ</p>
                  ) : filteredKeys.map((item) => {
                    const currentValue = settings.labels?.[item.key] !== undefined ? settings.labels[item.key] : '';
                    return (
                      <div key={item.key} className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{item.desc}</span>
                          <code style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontFamily: 'monospace' }}>{item.key}</code>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={"ຄ່າເລີ່ມຕົ້ນ: " + item.defaultValue}
                          value={currentValue}
                          onChange={(e) => {
                            const updatedLabels = { ...(settings.labels || {}) };
                            updatedLabels[item.key] = e.target.value;
                            setSettings({ ...settings, labels: updatedLabels });
                          }}
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-end', marginTop: '10px' }}>
                  💾 ບັນທຶກການແປພາສາ & ຂໍ້ຄວາມ
                </button>
              </form>
            );
          })()}

          {activeSubTab === 'notifications' && (
            <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                🔔 ຕັ້ງຄ່າການແຈ້ງເຕືອນຜ່ານໂທລະສັບ (Phone Notification Integration)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ເຊື່ອມຕໍ່ລະບົບຂາຍ ແລະ ລະບົບແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດສະຕັອກໄປຍັງ Telegram, Discord ຫຼື LINE Notify ເພື່ອຮັບຂໍ້ຄວາມແຈ້ງເຕືອນບົນໂທລະສັບຂອງທ່ານໄດ້ທັນທີ.
              </p>

              <div className="form-group">
                <label className="form-label">ຊ່ອງທາງການແຈ້ງເຕືອນ (Notification Channel)</label>
                <select
                  className="form-control"
                  value={settings.notifyProvider || 'none'}
                  onChange={(e) => setSettings({ ...settings, notifyProvider: e.target.value })}
                >
                  <option value="none">🔕 ປິດການແຈ້ງເຕືອນ (None)</option>
                  <option value="line_notify">💬 LINE Notify (ສົ່ງເຂົ້າ LINE ສ່ວນຕົວ ຫຼື ກຸ່ມ)</option>
                  <option value="telegram">✈️ Telegram Bot (ແນະນຳ - ໄວ ແລະ ປອດໄພ)</option>
                  <option value="discord">👾 Discord Webhook (ແຈ້ງເຕືອນໃນຫ້ອງ Discord)</option>
                </select>
              </div>

              {settings.notifyProvider === 'line_notify' && (
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid #06c755' }}>
                  <h4 style={{ color: '#06c755', fontSize: '0.9rem', marginBottom: '8px', marginTop: 0 }}>💬 ຕັ້ງຄ່າ LINE Notify</h4>
                  <div className="form-group">
                    <label className="form-label">LINE Notify Access Token</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.lineNotifyToken || ''}
                      onChange={(e) => setSettings({ ...settings, lineNotifyToken: e.target.value })}
                      placeholder="ປ້ອນ LINE Notify Access Token..."
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>
                      ຂໍ Token ໄດ້ທີ່ເວັບໄຊ LINE Notify. ຫາກຕ້ອງການແຈ້ງເຕືອນໃນກຸ່ມ, ຢ່າລືມດຶງ "LINE Notify" ເຂົ້າໄປໃນກຸ່ມນັ້ນ.
                    </small>
                  </div>
                </div>
              )}

              {settings.notifyProvider === 'telegram' && (
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid #0088cc' }}>
                  <h4 style={{ color: '#0088cc', fontSize: '0.9rem', marginBottom: '8px', marginTop: 0 }}>✈️ ຕັ້ງຄ່າ Telegram Bot</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Telegram Bot Token</label>
                      <input
                        type="password"
                        className="form-control"
                        value={settings.telegramBotToken || ''}
                        onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                        placeholder="Bot Token (e.g. 123456:ABC...)"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telegram Chat ID (Or Group ID)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.telegramChatId || ''}
                        onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                        placeholder="Chat ID (e.g. 987654321)"
                      />
                    </div>
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    ສ້າງ Bot ຜ່ານ @BotFather ເພື່ອຂໍ Bot Token ແລະ ໃຊ້ @userinfobot ຫຼື Bot ອື່ນໆເພື່ອຫາ Chat ID ຂອງທ່ານ.
                  </small>
                </div>
              )}

              {settings.notifyProvider === 'discord' && (
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid #7289da' }}>
                  <h4 style={{ color: '#7289da', fontSize: '0.9rem', marginBottom: '8px', marginTop: 0 }}>👾 ຕັ້ງຄ່າ Discord Webhook</h4>
                  <div className="form-group">
                    <label className="form-label">Discord Webhook URL</label>
                    <input
                      type="password"
                      className="form-control"
                      value={settings.discordWebhookUrl || ''}
                      onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                </div>
              )}

              {settings.notifyProvider !== 'none' && (
                <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      db.sendNotification("🔔 *ທົດສອບລະບົບແຈ້ງເຕືອນຜ່ານໂທລະສັບ!*\n\nຂໍ້ຄວາມນີ້ເປັນການທົດສອບການເຊື່ອມຕໍ່ລະບົບ Pos & Amulet POS. ລະບົບແຈ້ງເຕືອນຂອງທ່ານເຮັດວຽກໄດ້ຖືກຕ້ອງແລ້ວ! 🎉");
                      alert("✓ ສົ່ງຂໍ້ຄວາມທົດສອບໄປແລ້ວ! ກະລຸນາກວດສອບໂທລະສັບຂອງທ່ານ.");
                    }}
                  >
                    🚀 ທົດສອບສົ່ງຂໍ້ຄວາມ (Test Send)
                  </button>
                  <button type="submit" className="btn btn-primary">
                    💾 ບັນທຶກການແຈ້ງເຕືອນ
                  </button>
                </div>
              )}
            </form>
          )}


          {/* General Rules Settings */}
          {activeSubTab === 'general' && (
            <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                ⚙️ ຕັ້ງຄ່າທົ່ວໄປ (General Rules)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ລະຫັດ PIN ຜູ້ບໍລິຫານ (Master Admin PIN)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    maxLength="4"
                    pattern="\d{4}"
                    value={settings.masterAdminPin || ''}
                    onChange={(e) => setSettings({ ...settings, masterAdminPin: e.target.value.replace(/\D/g, '') })}
                  />
                  <small style={{ color: 'var(--text-secondary)' }}>ລະຫັດ 4 ຫຼັກສຳລັບຢືນຢັນການລົບລາຍການ/ສ່ວນຫຼຸດໃນ POS</small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">ອັດຕາແລກປ່ຽນ ບາດ/ກີບ (THB/LAK Exchange Rate)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={settings.exchangeRateThb || ''}
                    onChange={(e) => setSettings({ ...settings, exchangeRateThb: Number(e.target.value) })}
                  />
                  <small style={{ color: 'var(--text-secondary)' }}>1 THB ເທົ່າກັບຈຳນວນກີບ (ຕົວຢ່າງ: 750)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">ອັດຕາແລກປ່ຽນ ໂດລາ/ກີບ (USD/LAK Exchange Rate)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={settings.exchangeRateUsd || ''}
                    onChange={(e) => setSettings({ ...settings, exchangeRateUsd: Number(e.target.value) })}
                  />
                  <small style={{ color: 'var(--text-secondary)' }}>1 USD ເທົ່າກັບຈຳນວນກີບ (ຕົວຢ່າງ: 26000)</small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ອັດຕາພາສີ % (Tax Rate %)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={settings.taxRate || 0}
                    onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">ເວລາເຂົ້າງານ (Work Start Time)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={settings.workStartTime || '08:00'}
                    onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">ເວລາເລີກງານ (Work End Time)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={settings.workEndTime || '17:00'}
                    onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-end', marginTop: '10px' }}>
                💾 ບັນທຶກການຕັ້ງຄ່າທົ່ວໄປ
              </button>
            </form>
          )}

          {/* Promotions Manager */}
          {activeSubTab === 'promotions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
                  🏷️ ຈັດການຄູປອງ & ໂປຣໂມຊັ່ນສ່ວນຫຼຸດ (Promotions & Coupons)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
                {/* Form to add coupon */}
                <form onSubmit={handleAddPromo} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 8px 0', fontSize: '0.95rem' }}>➕ ເພີ່ມໂປຣໂມຊັ່ນໃໝ່</h4>
                  
                  <div className="form-group">
                    <label className="form-label">ລະຫັດຄູປອງ (Coupon Code)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ຕົວຢ່າງ: GOLD10"
                      required
                      value={promoFormData.code}
                      onChange={(e) => setPromoFormData({ ...promoFormData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ຊື່ໂປຣໂມຊັ່ນ (Description)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ຕົວຢ່າງ: ສ່ວນຫຼຸດພіເສດ 10%"
                      required
                      value={promoFormData.name}
                      onChange={(e) => setPromoFormData({ ...promoFormData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ປະເພດສ່ວນຫຼຸດ (Discount Type)</label>
                    <select
                      className="form-control"
                      value={promoFormData.type}
                      onChange={(e) => setPromoFormData({ ...promoFormData, type: e.target.value })}
                    >
                      <option value="percentage">ຫຼຸດເປັນເປີເຊັນ % (Percentage)</option>
                      <option value="fixed">ຫຼຸດເປັນຈຳນວນເງິນ ກີບ (LAK Fixed)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ມູນຄ່າສ່ວນຫຼຸດ (Discount Value)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder={promoFormData.type === 'percentage' ? '%' : 'ກີບ'}
                      required
                      value={promoFormData.value}
                      onChange={(e) => setPromoFormData({ ...promoFormData, value: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ຂັ້ນຕ່ຳໃນການຊື້ (Min Purchase Required)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="ກີບ (ໃສ່ 0 ຖ້າບໍ່ມີຂັ້ນຕ່ຳ)"
                      required
                      value={promoFormData.minPurchase}
                      onChange={(e) => setPromoFormData({ ...promoFormData, minPurchase: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                    ➕ ສ້າງຄູປອງສ່ວນຫຼຸດ
                  </button>
                </form>

                {/* Promotions list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '0.95rem' }}>📋 ລາຍການຄູປອງທັງໝົດ</h4>
                  {promotions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      ບໍ່ທັນມີໂປຣໂມຊັ່ນສ່ວນຫຼຸດໃນລະບົບ
                    </div>
                  ) : (
                    promotions.map(p => (
                      <div
                        key={p.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: 'var(--gold-glow)', color: 'var(--gold-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                              {p.code}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>{p.name}</span>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', rowGap: '2px' }}>
                            <span>ຄ່າສ່ວນຫຼຸດ:</span>
                            <span style={{ color: 'white' }}>
                              {p.type === 'percentage' ? `${p.value || 0}%` : `${(p.value || 0).toLocaleString()} ກີບ`}
                            </span>
                            <span>ຍອດຊື້ຂັ້ນຕ່ຳ:</span>
                            <span style={{ color: 'white' }}>{p.minPurchase && p.minPurchase > 0 ? `${Number(p.minPurchase).toLocaleString()} ກີບ` : 'ບໍ່ມີຂັ້ນຕ່ຳ'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--gold-primary)', borderColor: 'var(--gold-primary)', background: 'none' }}
                            onClick={() => handleDesignCouponClick(p)}
                          >
                            🎨 ອອກບັດ
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)', background: 'rgba(231,76,60,0.05)' }}
                            onClick={() => handleDeletePromo(p.id)}
                          >
                            🗑️ ລຶບ
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Framing Options Specifications Management */}
          {activeSubTab === 'framing_specs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                🛠️ ຈັດການຕົວເລືອກງານເລ່ຽມພຣະ (Framing Options Management)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
                {/* 1. Frame Styles Management */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    👑 ຊະນິດກອບ (Frame Styles)
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ເຊັ່ນ: ກອບໃສ, ກອບສີ, ເລເຊີລາຍ..."
                      value={newFrameStyle}
                      onChange={(e) => setNewFrameStyle(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const style = newFrameStyle.trim();
                        if (!style) return;
                        if (settings.frameStyles.includes(style)) {
                          alert('ຊະນິດກອບນີ້ມີຢູ່ໃນລະບົບແລ້ວ!');
                          return;
                        }
                        const updated = {
                          ...settings,
                          frameStyles: [...(settings.frameStyles || []), style]
                        };
                        db.saveSettings(updated);
                        setSettings(updated);
                        setNewFrameStyle('');
                        setSuccessMsg('✓ ເພີ່ມຊະນິດກອບສຳເລັດ!');
                        if (onUpdate) onUpdate();
                        setTimeout(() => setSuccessMsg(''), 2000);
                      }}
                      style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
                    >
                      ➕ ເພີ່ມ
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {(settings.frameStyles || []).map((style) => (
                      <div
                        key={style}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.03)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ color: 'white' }}>{style}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`ຕ້ອງການລຶບ "${style}" ຫຼື ບໍ່?`)) {
                              const updated = {
                                ...settings,
                                frameStyles: (settings.frameStyles || []).filter(s => s !== style)
                              };
                              db.saveSettings(updated);
                              setSettings(updated);
                              setSuccessMsg('✓ ລຶບຊະນິດກອບສຳເລັດ!');
                              if (onUpdate) onUpdate();
                              setTimeout(() => setSuccessMsg(''), 2000);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--alert-red)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          ✕ ລຶບ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            </div>
          )}

          {/* Expense Categories Management */}
          {activeSubTab === 'expenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                💸 ຈັດການປະເພດລາຍຈ່າຍ (Expense Categories Management)
              </h3>
              
              {/* Form to Add Category */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCatRawName.trim()) return;

                  const cleanRaw = newCatRawName.trim();
                  const cleanEmoji = newCatEmoji.trim() || '💸';
                  const cleanFullName = `${cleanEmoji} ${cleanRaw} (${cleanRaw})`;
                  
                  const newId = 'exp_' + Date.now();
                  const updated = [
                    ...expenseCategories,
                    { id: newId, name: cleanFullName, rawName: cleanRaw }
                  ];
                  db.saveExpenseCategories(updated);
                  setExpenseCategories(updated);
                  setNewCatRawName('');
                  setNewCatEmoji('💸');
                  setSuccessMsg('✓ ເພີ່ມປະເພດລາຍຈ່າຍສຳເລັດ!');
                  setTimeout(() => setSuccessMsg(''), 3000);
                }} 
                style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'flex-end' }}
              >
                <div style={{ width: '80px' }}>
                  <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Emoji</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    placeholder="💸"
                    style={{ textAlign: 'center', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ຊື່ປະເພດລາຍຈ່າຍ *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="ຕົວຢ່າງ: ຄ່າອິນເຕີເນັດ, ຄ່າເຊົ່າຮ້ານ..."
                    value={newCatRawName}
                    onChange={(e) => setNewCatRawName(e.target.value)}
                    style={{ background: '#221e1a', color: 'white', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--gold-primary)', borderColor: 'var(--gold-primary)', color: 'black', fontWeight: 'bold', padding: '10px 20px', height: '42px' }}>
                  ＋ ເພີ່ມປະເພດ
                </button>
              </form>

              {/* Categories List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ລາຍການທັງໝົດ ({expenseCategories.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                  {expenseCategories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'white' }}>{cat.name}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (window.confirm('ທ່ານຕ້ອງການລົບປະເພດລາຍຈ່າຍນີ້ແທ້ບໍ່?')) {
                            const updated = expenseCategories.filter(c => c.id !== cat.id);
                            db.saveExpenseCategories(updated);
                            setExpenseCategories(updated);
                            setSuccessMsg('✓ ລົບປະເພດລາຍຈ່າຍສຳເລັດ!');
                            setTimeout(() => setSuccessMsg(''), 3000);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px' }}
                        title="ລົບປະເພດນີ້"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}





          {/* System Control Settings */}
          {activeSubTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: 'var(--alert-red)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                ⚠️ ຈັດການລະບົບຂັ້ນສູງ & ຣີເຊັດຖານຂໍ້ມູນ (Developer Actions)
              </h3>
              
              <div style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--alert-red)', fontWeight: 'bold', fontSize: '0.95rem' }}>ຣີເຊັດຖານຂໍ້ມູນທັງໝົດ (Database Hard Reset)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '14px', lineHeight: '1.4' }}>
                  ການກົດປຸ່ມນີ້ຈະລຶບຂໍ້ມູນທັງໝົດທີ່ຖືກບັນທຶກໄວ້ໃນ LocalStorage ເຊັ່ນ: ສະຕັອກສິນຄ້າທີ່ເພີ່ມໃໝ່, ປະຫວັດໃບບິນ, ງານອັດກອບທີ່ລູກຄ້າຝາກໄວ້ ແລະ ຂໍ້ມູນການຕັ້ງຄ່າທັງໝົດ ໃຫ້ກັບໄປເປັນຄ່າເລີ່ມຕົ້ນຂອງລະບົບທັນທີ.
                </p>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleResetDb}
                >
                  🧨 ຣີເຊັດຖານຂໍ້ມູນທັງໝົດເປັນຄ່າເລີ່ມຕົ້ນ
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginTop: '10px' }}>
                <h4 style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.95rem' }}>ສະຖານະຂອງຖານຂໍ້ມູນ LocalStorage</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', rowGap: '4px' }}>
                  <span>Products Key:</span>
                  <span style={{ fontFamily: 'monospace', color: 'white' }}>amulet_pos_products ({localStorage.getItem('amulet_pos_products')?.length || 0} bytes)</span>
                  <span>Orders Key:</span>
                  <span style={{ fontFamily: 'monospace', color: 'white' }}>amulet_pos_orders ({localStorage.getItem('amulet_pos_orders')?.length || 0} bytes)</span>
                  <span>Framing Jobs Key:</span>
                  <span style={{ fontFamily: 'monospace', color: 'white' }}>amulet_pos_framing_jobs ({localStorage.getItem('amulet_pos_framing_jobs')?.length || 0} bytes)</span>
                  <span>Settings Key:</span>
                  <span style={{ fontFamily: 'monospace', color: 'white' }}>amulet_pos_settings ({localStorage.getItem('amulet_pos_settings')?.length || 0} bytes)</span>
                </div>
              </div>
            </div>
          )}

          {/* Amulet Tracking Settings & Preview */}
          

          {/* Production Tools Panel */}
          {activeSubTab === 'production_tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ color: '#3498db', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                ⚙️ ເຄື່ອງມືຈັດການລະບົບ Production (Production Tools)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* A. Full Backup & Restore */}
                <div style={{ background: 'rgba(52, 152, 219, 0.05)', border: '1px solid rgba(52, 152, 219, 0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ color: '#3498db', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>A. Full Backup & Restore</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    ສຳຮອງຂໍ້ມູນຖານຂໍ້ມູນທັງໝົດ, ການຕັ້ງຄ່າ, ລາຍການສິນຄ້າ, ແລະ ປະຫວັດທັງໝົດເປັນໄຟລ໌ບີບອັດ (.json.gz).
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => window.location.href = '/api/production/backup'}
                      style={{ background: '#3498db', borderColor: '#3498db', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      📥 ດາວໂຫຼດໄຟລ໌ Backup (.json.gz)
                    </button>
                    
                    <div style={{ borderTop: '1px dashed rgba(52, 152, 219, 0.2)', paddingTop: '10px', marginTop: '5px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        ກູ້ຄືນຖານຂໍ້ມູນຈາກໄຟລ໌ Backup:
                      </label>
                      <input
                        type="file"
                        accept=".gz"
                        onChange={handleRestoreDatabase}
                        style={{ fontSize: '0.8rem', color: 'white', background: '#1c1917', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* B. Reset Demo Data */}
                <div style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ color: 'var(--alert-red)', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>B. Reset Demo Data</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    ລຶບລ້າງຂໍ້ມູນທົດລອງທັງໝົດ (ສິນຄ້າ, ລູກຄ້າ, ປະຫວັດບິນ, ຄິວ, ງານອັດກອບ, ໜີ້ສິນ, ບັນທຶກການເງິນ) ເພື່ອຕຽມລະບົບໃຫ້ວ່າງ.
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleResetDemoData}
                    style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    🧨 ລຶບລ້າງຂໍ້ມູນທົດລອງທັງໝົດ
                  </button>
                </div>

                {/* C. Production Initialize */}
                <div style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid rgba(46, 204, 113, 0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ color: 'var(--success-green)', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>C. Production Initialize</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    ສ້າງ ຫຼື ຣີເຊັດບັນຊີ admin ສູນກາງ (admin / admin123) ພ້ອມຕັ້ງຄ່າບັງຄັບປ່ຽນລະຫັດຜ່ານໃນການເຂົ້າໃຊ້ງານຄັ້ງທຳອິດ.
                  </p>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleInitializeAdmin}
                    style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--success-green)', borderColor: 'var(--success-green)' }}
                  >
                    🔑 ຕັ້ງຄ່າບັນຊີ Admin ທຳອິດ
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeSubTab === 'tracking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
                  🔍 ຕັ້ງຄ່າໜ້າຕິດຕາມສະຖານະລູກຄ້າ (Amulet Tracking Settings)
                </h3>
                <button type="button" className="btn btn-primary" onClick={handleSettingsSave}>
                  💾 {db.getLabel('save', 'ບັນທຶກການຕັ້ງຄ່າ')}
                </button>
              </div>

              <div className="tracking-settings-layout" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                
                {/* Configuration form */}
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 'bold' }}>📢 ຂໍ້ຄວາມຫົວຂໍ້ຕິດຕາມ (Header Custom Description)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="ເຊັ່ນ: ຕິດຕາມຂັ້ນຕອນການອັດກອບພຣະເຄື່ອງຂອງທ່ານແບບ Real-time..."
                      value={settings.trackingHeaderNote || ''}
                      onChange={(e) => setSettings({ ...settings, trackingHeaderNote: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 'bold' }}>📝 ຂໍ້ຄວາມທ້າຍໃບບິນຕິດຕາມ (Footer Note)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="ເຊັ່ນ: ພຣະເຄື່ອງຄຸ້ມຄອງ, ໂຊກດີ ມີໄຊ! ຂອບໃຈທີ່ໃຊ້ບໍລິການ..."
                      value={settings.trackingFooterNote || ''}
                      onChange={(e) => setSettings({ ...settings, trackingFooterNote: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginBottom: '5px', display: 'block' }}>👁️ ປິດ-ເປີດ ການສະແດງຜົນ (Visibility Toggles)</span>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.trackingShowQueue !== false}
                        onChange={(e) => setSettings({ ...settings, trackingShowQueue: e.target.checked })}
                      />
                      ສະແດງຈຳນວນຄິວທີ່ເຫຼືອກ່ອນໜ້າ (Show Remaining Queues Ahead)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.trackingShowPricing !== false}
                        onChange={(e) => setSettings({ ...settings, trackingShowPricing: e.target.checked })}
                      />
                      ສະແດງລາຍລະອຽດລາຄา & ຍອດມັດຈຳ (Show Price & Deposit Details)
                    </label>
                  </div>
                  
                </div>

                {/* Real-time Phone Mockup Preview */}
                <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '0 auto' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    📱 ຕົວຢ່າງໜ້າຈໍໃນມືຖືຂອງລູກຄ້າ (Live Mobile Preview)
                  </span>
                  
                  {/* Phone frame container */}
                  <div style={{
                    width: '320px',
                    height: '520px',
                    border: '8px solid #2c2520',
                    borderRadius: '36px',
                    background: '#0d0c0a',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.7)',
                    overflowY: 'auto',
                    position: 'relative',
                    boxSizing: 'content-box'
                  }}>
                    {/* Status bar */}
                    <div style={{ height: '24px', background: '#1c1815', display: 'flex', justifyContent: 'space-between', padding: '0 16px', alignItems: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span>09:41 📱</span>
                      <span>📶 🔋 100%</span>
                    </div>
                    
                    {/* Inline Order Tracking component */}
                    <div style={{ padding: '12px' }}>
                      <OrderTracking
                        jobId="JOB10019"
                        isInline={true}
                        mockJobData={{
                          id: 'JOB10019',
                          customerName: 'ທ້າວ ສົມພອນ (Mock Customer)',
                          createdDate: new Date().toISOString(),
                          status: 'pending',
                          totalPrice: 3261000,
                          deposit: 1000000,
                          balance: 2261000,
                          amulets: [
                            { description: 'ພຣະພຸດທະຮູບສຳຣິດ', frameTypeName: 'ອັດກອບກັນນ້ຳ 90%', frameStyle: 'ຂອບທອງຄຳ', acrylicThickness: '3mm', specialNotes: 'ເລັ່ງດ່ວນໃຫ້ລູກຄ້າ' }
                          ]
                        }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeSubTab === 'data_retention' && (
            <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
                  🧹 ການຈັດການຂໍ້ມູນ ແລະ ການລຶບອັດຕະໂນມັດ (Data Retention & Auto-Delete)
                </h3>
                <button type="submit" className="btn btn-primary">บันทึก / Save</button>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ຕັ້ງຄ່າການລຶບຂໍ້ມູນເກົ່າອັດຕະໂນມັດເພື່ອຫຼຸດຜ່ອນການເກັບຂໍ້ມູນໜັກໃນ browser. ລະບົບຈະລຶບຂໍ້ມູນຕາມ queue (ເກົ່າທີ່ສຸດລຶບກ່ອນ) ທຸກຄັ້ງທີ່ເປີດແອັບ.
              </p>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="dataRetentionEnabled"
                  checked={!!settings.dataRetentionEnabled}
                  onChange={(e) => setSettings({ ...settings, dataRetentionEnabled: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="dataRetentionEnabled" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  เปิดใช้งานການລຶບຂໍ້ມູນອັດຕະໂນມັດ (Enable Auto-Delete)
                </label>
              </div>

              {settings.dataRetentionEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '3px solid var(--gold-primary)', paddingLeft: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">ລຶບໃບບິນຂາຍໜ້າຮ້ານ (POS Bills) ທີ່ເກົ່າກວ່າ (ມື້) *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        value={settings.dataRetentionDaysDaysBills !== undefined ? settings.dataRetentionDaysDaysBills : (settings.dataRetentionDaysBills || '')}
                        onChange={(e) => setSettings({ ...settings, dataRetentionDaysBills: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ໃບບິນເກົ່າກວ່ານີ້ຈະຖືກລຶບອອກຈາກຖານຂໍ້ມູນ.</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">ລຶບອໍເດີ້ອອນລາຍ (Online Orders - Delivered) ທີ່ເກົ່າກວ່າ (ມື້) *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        value={settings.dataRetentionDaysOrders || ''}
                        onChange={(e) => setSettings({ ...settings, dataRetentionDaysOrders: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ສະເພາະອໍເດີ້ທີ່ຈັດສົ່ງສຳເລັດແລ້ວເທົ່ານັ້ນ.</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">ລຶບປະຫວັດໜີ້ສິນທີ່ຊຳລະແລ້ວ (Paid Debts) ທີ່ເກົ່າກວ່າ (ມື້) *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        value={settings.dataRetentionDaysDebts || ''}
                        onChange={(e) => setSettings({ ...settings, dataRetentionDaysDebts: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ສະເພາະໜີ້ທີ່ປ່ຽນສະຖານةເປັນ Paid ແລ້ວ.</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">ຈຳນວນລຶບສູງສຸດຕໍ່ການເປີດແອັບ 1 ຄັ້ງ (Batch Size) *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        value={settings.dataRetentionMaxPerRun || ''}
                        onChange={(e) => setSettings({ ...settings, dataRetentionMaxPerRun: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ຈຳກັດການລຶບຕໍ່ຄັ້ງເພື່ອປ້ອງກັນແອັບຄ້າງ.</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {activeSubTab === 'online_shop_settings' && (
            <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
                  🌐 ຕັ້ງຄ່າ ແລະ ປັບແຕ່ງຮ້ານອອນລາຍ (Online Shop Settings)
                </h3>
                <button type="submit" className="btn btn-primary">บันทึก / Save</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">ສີຫຼັກຂອງແອັບອອນລາຍ (Primary Theme Color)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="color"
                      className="form-control"
                      value={settings.onlineShopThemeColor || '#3498db'}
                      onChange={(e) => setSettings({ ...settings, onlineShopThemeColor: e.target.value })}
                      style={{ width: '50px', height: '40px', padding: '2px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={settings.onlineShopThemeColor || '#3498db'}
                      onChange={(e) => setSettings({ ...settings, onlineShopThemeColor: e.target.value })}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sີປຸ່ມ ແລະ ຫົວຂໍ້ຫຼັກໃນໜ້າຮ້ານອອນລາຍ.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">ສີເນັ້ນ (Accent Color)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="color"
                      className="form-control"
                      value={settings.onlineShopAccentColor || '#f1c40f'}
                      onChange={(e) => setSettings({ ...settings, onlineShopAccentColor: e.target.value })}
                      style={{ width: '50px', height: '40px', padding: '2px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={settings.onlineShopAccentColor || '#f1c40f'}
                      onChange={(e) => setSettings({ ...settings, onlineShopAccentColor: e.target.value })}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ສີເນັ້ນຂໍ້ຄວາມ ຫຼື ໄອຄອນຕ່າງໆ.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ຂໍ້ຄວາມຕ້ອນຮັບ / ແບນເນີຫົວຂໍ້ (Welcome Banner Text) *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={settings.onlineShopBanner || ''}
                  onChange={(e) => setSettings({ ...settings, onlineShopBanner: e.target.value })}
                  placeholder="ຍິນດີຕ້ອນຮັບສູ່ ຮ້ານອອນລາຍ KP Pakse!"
                />
              </div>

              <div className="form-group">
                <label className="form-label">ພາສາສະແດງຜົນເລີ່ມຕົ້ນ (Default Language)</label>
                <select
                  className="form-control"
                  value={settings.onlineShopLang || 'lo'}
                  onChange={(e) => setSettings({ ...settings, onlineShopLang: e.target.value })}
                >
                  <option value="lo">ພາສາລາວ (Lao)</option>
                  <option value="th">ภาษาไทย (Thai)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
            </form>
          )}

          {/* Dummy elements to absorb the remaining closed tags from system block */}
          {activeSubTab === 'system' && (
            <div>
              <div>
                <div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      </div>

      {showDesignModal && designPromo && (
        <Portal>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '950px',
            maxWidth: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0d0d0d',
            border: '1.5px solid var(--gold-primary)',
            boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(212, 175, 55, 0.03)'
            }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎨 ອອກແບບບັດສ່ວນຫຼຸດຄູປອງ: <span style={{ color: 'white' }}>{designPromo.code}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDesignModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                &times;
              </button>
            </div>

            <div style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.3fr',
              gap: '28px',
              alignItems: 'start'
            }}>
              {/* Left: Preview Panel */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                position: 'sticky',
                top: 0
              }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, alignSelf: 'flex-start' }}>
                  👁️ ຕົວຢ່າງບັດຈິງ (Live Preview)
                </h4>

                <div
                  id="print-coupon-card"
                  style={{
                    width: '428px',
                    height: `${designCardHeight}px`,
                    borderRadius: '12px',
                    padding: '16px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    background: getCardBackground(),
                    overflow: 'hidden',
                    border: designBorder === 'none' ? 'none' : (designBorder === 'double_gold' ? '4px double #d4af37' : '2px solid #d4af37'),
                    outline: designBorder === 'gold_ornate' ? '1px solid #d4af37' : 'none',
                    outlineOffset: designBorder === 'gold_ornate' ? '-6px' : '0'
                  }}
                >
                  {designBorder === 'gold_ornate' && (
                    <>
                      <div style={{ position: 'absolute', top: '8px', left: '8px', width: '10px', height: '10px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
                      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />
                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '10px', height: '10px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '10px', height: '10px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />
                    </>
                  )}

                  {designLotusOrnament && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: 0.08,
                      pointerEvents: 'none',
                      zIndex: 1
                    }}>
                      <LotusIcon color={designTheme === 'custom' ? designTitleColor : '#d4af37'} />
                    </div>
                  )}

                  <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'space-between' }}>
                    
                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                      {designShowLogo && (designLogoImage || settings.shopLogo) && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                          <img 
                            src={designLogoImage || settings.shopLogo} 
                            alt="Logo" 
                            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      <div style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
                        {settings.shopName || 'KP PAKSE AMULET'}
                      </div>
                      <div style={{
                        fontSize: `${designTitleSize}px`,
                        color: designTheme === 'custom' ? designTitleColor : (designTheme === 'gold' ? '#d4af37' : '#ffffff'),
                        fontWeight: 'bold',
                        textShadow: '0 1px 4px rgba(0,0,0,0.6)'
                      }}>
                        {designTitle}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      fontSize: `${designValueSize}px`,
                      fontWeight: '900',
                      color: designTheme === 'custom' ? designValueColor : '#ffffff',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      margin: '2px 0'
                    }}>
                      {designPromo.type === 'percentage' 
                        ? `ຫຼຸດພິເສດ ${designPromo.value}%` 
                        : `ສ່ວນຫຼຸດ ${Number(designPromo.value).toLocaleString()} ກີບ`}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.08)',
                      padding: '6px 12px 4px 12px',
                      borderRadius: '6px',
                      width: '75%',
                      boxSizing: 'border-box'
                    }}>
                      <canvas ref={designBarcodeCanvasRef} style={{ width: '100%', height: '35px', display: 'block' }}></canvas>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      fontSize: `${designTermsSize}px`,
                      color: designTheme === 'custom' ? designTermsColor : (designTheme === 'gold' ? '#aaaaaa' : '#e0e0e0'),
                      maxWidth: '90%',
                      lineHeight: '1.2',
                      opacity: 0.95,
                      marginBottom: '2px'
                    }}>
                      {designTerms}
                    </div>

                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePrintCoupon}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
                  >
                    🖨️ ພิມບັດຄູປອງ (Print Card)
                  </button>
                </div>
                <small style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '380px' }}>
                  * ບັດຈະຖືກຈັດວາງຮູບແບບໃຫ້ພິມອອກມາມີຂະໜາດເທົ່າບັດນາມບັດມາດຕະຖານ (85.6mm x 54mm) ພໍດີໃນຕອນພິມ.
                </small>
              </div>

              {/* Right: Config Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', margin: '0 0 4px 0' }}>
                  ⚙️ ປັບແຕ່ງຮູບແບບບັດ (Customization Controls)
                </h4>

                <div className="form-group">
                  <label className="form-label">ເລືອກຮູບແບບພື້ນຫຼັງ (Preset Theme)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: designTheme === 'gold' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.02)',
                        color: designTheme === 'gold' ? '#000' : 'white',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        setDesignTheme('gold');
                        setDesignBorder('gold_ornate');
                        setDesignLotusOrnament(true);
                      }}
                    >
                      👑 Luxury Black-Gold
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: designTheme === 'red' ? '#e74c3c' : 'rgba(255,255,255,0.02)',
                        color: 'white',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        setDesignTheme('red');
                        setDesignBorder('gold_ornate');
                        setDesignLotusOrnament(true);
                      }}
                    >
                      🧧 Imperial Chinese Red
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: designTheme === 'emerald' ? '#2ecc71' : 'rgba(255,255,255,0.02)',
                        color: 'white',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        setDesignTheme('emerald');
                        setDesignBorder('gold_ornate');
                        setDesignLotusOrnament(true);
                      }}
                    >
                      💚 Emerald Premium Green
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: designTheme === 'sapphire' ? '#3498db' : 'rgba(255,255,255,0.02)',
                        color: 'white',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        setDesignTheme('sapphire');
                        setDesignBorder('gold_ornate');
                        setDesignLotusOrnament(true);
                      }}
                    >
                      💙 Sapphire Royal Blue
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: designTheme === 'custom' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.02)',
                        color: designTheme === 'custom' ? '#000' : 'white',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        gridColumn: 'span 2'
                      }}
                      onClick={() => {
                        setDesignTheme('custom');
                      }}
                    >
                      🎨 ປັບແຕ່ງເອງທັງໝົດ (Custom Theme)
                    </button>
                  </div>
                </div>

                {designTheme === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginBottom: '4px' }}>
                      🖌️ ຕັ້ງຄ່າພື້ນຫຼັງເອງ (Custom Background Settings)
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ສີພື້ນຫຼັງດ່ຽວ (Solid Color)</span>
                      <input
                        type="color"
                        value={designBgSolid}
                        onChange={(e) => {
                          setDesignBgSolid(e.target.value);
                          setDesignBgImage('');
                        }}
                        style={{ width: '100%', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ສີພື້ນຫຼັງໄລ່ລະດັບ (Gradient Background)</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: '#888' }}>ສີທີ 1</span>
                          <input
                            type="color"
                            value={designBgGradient1}
                            onChange={(e) => {
                              setDesignBgGradient1(e.target.value);
                              setDesignBgImage('');
                            }}
                            style={{ width: '100%', height: '24px', border: 'none', background: 'none' }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: '#888' }}>ສີທີ 2</span>
                          <input
                            type="color"
                            value={designBgGradient2}
                            onChange={(e) => {
                              setDesignBgGradient2(e.target.value);
                              setDesignBgImage('');
                            }}
                            style={{ width: '100%', height: '24px', border: 'none', background: 'none' }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: '#888' }}>ອົງສາ (Angle)</span>
                          <input
                            type="number"
                            className="form-control"
                            value={designBgGradientAngle}
                            onChange={(e) => setDesignBgGradientAngle(e.target.value)}
                            style={{ padding: '2px 6px', fontSize: '0.75rem', height: '24px' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ຫຼື ອັບໂຫຼດຮູບພື້ນຫຼັງເອງ (Background Image)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setDesignBgImage(event.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ fontSize: '0.75rem', marginTop: '4px', width: '100%' }}
                      />
                      {designBgImage && (
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: 'var(--alert-red)', fontSize: '0.7rem', padding: 0, marginTop: '4px', cursor: 'pointer', textAlign: 'left' }}
                          onClick={() => setDesignBgImage('')}
                        >
                          ❌ ລຶບຮູບພື້ນຫຼັງ
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">ຮູບແບບຂອບບັດ (Border Style)</label>
                    <select
                      className="form-control"
                      value={designBorder}
                      onChange={(e) => setDesignBorder(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '6px' }}
                    >
                      <option value="gold_ornate">👑 ຂອບຫຼູຫຼາ (Gold Ornate)</option>
                      <option value="solid_gold">🎗️ ຂອບເສັ້ນດ່ຽວ (Solid Gold)</option>
                      <option value="double_gold">📜 ຂອບເສັ້ນຄູ່ (Double Gold)</option>
                      <option value="none">🚫 ບໍ່ມີຂອບ (No Border)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                      <input
                        type="checkbox"
                        checked={designLotusOrnament}
                        onChange={(e) => setDesignLotusOrnament(e.target.checked)}
                      />
                      💮 ເພີ່ມລາຍນ້ຳດອກບົວ
                    </label>
                  </div>
                </div>

                {/* Logo & Card Height Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={designShowLogo}
                        onChange={(e) => setDesignShowLogo(e.target.checked)}
                      />
                      🖼️ ສະແດງໂລໂກ້ຮ້ານ
                    </label>
                    {designShowLogo && (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setDesignLogoImage(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ fontSize: '0.7rem', width: '100%' }}
                        />
                        {designLogoImage && (
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--alert-red)', fontSize: '0.65rem', padding: 0, marginTop: '2px', cursor: 'pointer' }}
                            onClick={() => setDesignLogoImage('')}
                          >
                            ❌ ລຶບໂລໂກ້ສະເພາะ (Use Main Logo)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">ຄວາມສູງຂອງບັດ (Card Height): {designCardHeight}px</label>
                    <input
                      type="range"
                      min="240"
                      max="350"
                      value={designCardHeight}
                      onChange={(e) => setDesignCardHeight(e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#888' }}>
                      <span>240px</span>
                      <span>350px</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">ຂໍ້ຄວາມຫົວຂໍ້ບັດ (Card Title)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={designTitle}
                        onChange={(e) => setDesignTitle(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">ຂະໜາດຕົວໜັງສື</label>
                      <input
                        type="number"
                        className="form-control"
                        value={designTitleSize}
                        onChange={(e) => setDesignTitleSize(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px' }}
                      />
                    </div>
                  </div>

                  {designTheme === 'custom' && (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">ສີຕົວໜັງສືຫົວຂໍ້</label>
                      <input
                        type="color"
                        value={designTitleColor}
                        onChange={(e) => setDesignTitleColor(e.target.value)}
                        style={{ width: '100%', height: '24px', border: 'none', background: 'none' }}
                      />
                    </div>
                  )}
                </div>

                {designTheme === 'custom' && (
                  <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">ສີມູນຄ່າສ່ວນຫຼຸດ</label>
                        <input
                          type="color"
                          value={designValueColor}
                          onChange={(e) => setDesignValueColor(e.target.value)}
                          style={{ width: '100%', height: '24px', border: 'none', background: 'none' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">ຂະໜາດຕົວໜັງສື</label>
                        <input
                          type="number"
                          className="form-control"
                          value={designValueSize}
                          onChange={(e) => setDesignValueSize(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '6px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">ເງື່ອນໄຂການນຳໃຊ້ (Terms & Conditions)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={designTerms}
                        onChange={(e) => setDesignTerms(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">ຂະໜາດຕົວໜັງສື</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-control"
                        value={designTermsSize}
                        onChange={(e) => setDesignTermsSize(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px' }}
                      />
                    </div>
                  </div>

                  {designTheme === 'custom' && (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">ສີຕົວໜັງສືເງື່ອນໄຂ</label>
                      <input
                        type="color"
                        value={designTermsColor}
                        onChange={(e) => setDesignTermsColor(e.target.value)}
                        style={{ width: '100%', height: '24px', border: 'none', background: 'none' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDesignModal(false)}
                    style={{ padding: '10px 20px' }}
                  >
                    ❌ ຍົກເລີກ (Cancel)
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveCouponDesign}
                    style={{ padding: '10px 24px' }}
                  >
                    💾 ບັນທຶກຮູບແບບ (Save Design)
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
        </Portal>
      )}



          </div>
  );
}
