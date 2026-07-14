import React, { useState } from 'react';

const resizeImage = (file, maxDim = 300, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
};

export default function OnlineShopSettings({ settings, setSettings, categories, handleSave }) {
  const [onlineSubTab, setOnlineSubTab] = useState('info');

  const addShippingMethod = () => {
    const list = settings.onlineShopShippingMethods || [];
    const updated = [...list, { id: 'ship_' + Date.now(), name: 'ຈັດສົ່ງດ່ວນ (Express)', baseRate: 20000 }];
    setSettings({ ...settings, onlineShopShippingMethods: updated });
  };

  const removeShippingMethod = (idx) => {
    const list = (settings.onlineShopShippingMethods || []).filter((_, i) => i !== idx);
    setSettings({ ...settings, onlineShopShippingMethods: list });
  };

  const updateShippingMethod = (idx, key, val) => {
    const list = [...(settings.onlineShopShippingMethods || [])];
    if (list[idx]) {
      list[idx][key] = val;
      setSettings({ ...settings, onlineShopShippingMethods: list });
    }
  };

  const addBankAccount = () => {
    const list = settings.onlineShopBankAccounts || [];
    const updated = [...list, { id: 'bank_' + Date.now(), bankName: 'BCEL', accName: 'ຮ້ານຂອບພຣະ', accNum: '010-XX-XXXXXX' }];
    setSettings({ ...settings, onlineShopBankAccounts: updated });
  };

  const removeBankAccount = (idx) => {
    const list = (settings.onlineShopBankAccounts || []).filter((_, i) => i !== idx);
    setSettings({ ...settings, onlineShopBankAccounts: list });
  };

  const updateBankAccount = (idx, key, val) => {
    const list = [...(settings.onlineShopBankAccounts || [])];
    if (list[idx]) {
      list[idx][key] = val;
      setSettings({ ...settings, onlineShopBankAccounts: list });
    }
  };

  const toggleCategory = (catId, checked) => {
    const list = settings.onlineShopDisabledCategories || [];
    const updated = checked
      ? list.filter(id => id !== catId)
      : [...list, catId];
    setSettings({ ...settings, onlineShopDisabledCategories: updated });
  };

  const updateTranslation = (lang, key, val) => {
    const trans = { ...(settings.onlineShopTranslations || {}) };
    if (!trans[lang]) trans[lang] = {};
    trans[lang][key] = val;
    setSettings({ ...settings, onlineShopTranslations: trans });
  };

  const translationKeys = [
    { key: 'home', defaultLo: 'ໜ້າແລກ', defaultTh: 'หน้าแรก', defaultEn: 'Home' },
    { key: 'cart', defaultLo: 'ກະຕ່າສິນຄ້າ', defaultTh: 'ตะกร้าสินค้า', defaultEn: 'Cart' },
    { key: 'checkout', defaultLo: 'ຊຳລະເງິນ', defaultTh: 'ชำระเงิน', defaultEn: 'Checkout' },
    { key: 'tracking', defaultLo: 'ຕິດຕາມອໍເດີ້', defaultTh: 'ติดตามออเดอร์', defaultEn: 'Track' },
    { key: 'chat', defaultLo: 'ຕິດຕໍ່ສອບຖາມ', defaultTh: 'ติดต่อสอบถาม', defaultEn: 'Chat' },
    { key: 'buyNow', defaultLo: 'ຊື້ເລີຍ', defaultTh: 'ซื้อเลย', defaultEn: 'Buy Now' },
    { key: 'addCart', defaultLo: 'ໃສ່ກະຕ່າ', defaultTh: 'ใส่ตะกร้า', defaultEn: 'Add to Cart' },
    { key: 'coupon', defaultLo: 'ລະຫັດສ່ວນຫຼຸດ', defaultTh: 'รหัสส่วนลด', defaultEn: 'Coupon' },
    { key: 'points', defaultLo: 'ຄະແນນສະສົມ', defaultTh: 'คะแนนสะสม', defaultEn: 'Loyalty Points' },
    { key: 'searchPlaceHolder', defaultLo: 'ຄົ້ນຫາສິນຄ້າ...', defaultTh: 'ค้นหาสินค้า...', defaultEn: 'Search products...' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
        <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
          🌐 ຕັ້ງຄ່າ ແລະ ປັບແຕ່ງຮ້ານອອນລາຍ (Online Shop Settings)
        </h3>
        <button type="button" className="btn btn-primary" onClick={handleSave}>บันทึก / Save</button>
      </div>

      {/* Sub-navigation inside online settings */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', overflowX: 'auto', marginBottom: '8px' }}>
        {[
          { key: 'info', label: '🏪 ຂໍ້ມູນຮ້ານ & ຄວາມສວຍງາມ (Info & Styles)' },
          { key: 'sales', label: '⚙️ ການຂາຍ & ການຈັດສົ່ງ (Sales & Shipping)' },
          { key: 'payment', label: '💳 ການຊຳລະເງິນ & POS Link (Payment & POS)' },
          { key: 'notifications', label: '🔔 ແຈ້ງເຕືອນ & ຄວາມປອດໄພ (Alerts & Security)' },
          { key: 'translations', label: '📝 ປັບແຕ່ງພາສາ (Translations Override)' }
        ].map(t => (
          <button
            key={t.key}
            type="button"
            className={`btn ${onlineSubTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOnlineSubTab(t.key)}
            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INFO & STYLING */}
      {onlineSubTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ຊື່ຮ້ານອອນລາຍ (Online Shop Title)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopTitle || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopTitle: e.target.value })}
                placeholder="ຂອບພຣະຣັທເກຊ Online"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ຄຳອະທິບາຍ (Announcement Description)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopDescription || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopDescription: e.target.value })}
                placeholder="ຍິນດີຕ້ອນຮັບສູ່ ຮ້ານອອນລາຍ..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ເບີໂທຕິດຕໍ່ (Contact Phone)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopPhone || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopPhone: e.target.value })}
                placeholder="02023304555"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ອີເມວຕິດຕໍ່ (Email)</label>
              <input
                type="email"
                className="form-control"
                value={settings.onlineShopEmail || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopEmail: e.target.value })}
                placeholder="contact@kppakse.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ທີ່ຢູ່ຮ້ານ (Shop Address)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopAddress || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopAddress: e.target.value })}
                placeholder="ປາກເຊ, ແຂວງຈຳປາສັກ"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ລິ້ງ Facebook (Facebook Link)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopFacebook || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopFacebook: e.target.value })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ລິ້ງ Telegram (Telegram Link)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopTelegram || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopTelegram: e.target.value })}
                placeholder="https://t.me/username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ລິ້ງ Instagram (Instagram Link)</label>
              <input
                type="text"
                className="form-control"
                value={settings.onlineShopInstagram || ''}
                onChange={(e) => setSettings({ ...settings, onlineShopInstagram: e.target.value })}
                placeholder="https://instagram.com/username"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ເວລາເປີດຮ້ານ (Open Time)</label>
              <input
                type="time"
                className="form-control"
                value={settings.onlineShopOpenTime || '08:00'}
                onChange={(e) => setSettings({ ...settings, onlineShopOpenTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ເວລາປິດຮ້ານ (Close Time)</label>
              <input
                type="time"
                className="form-control"
                value={settings.onlineShopCloseTime || '21:00'}
                onChange={(e) => setSettings({ ...settings, onlineShopCloseTime: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ໂລໂກ້ຮ້ານອອນລາຍ (Online Shop Logo)</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const compressed = await resizeImage(file, 300, 0.7);
                    if (compressed) {
                      setSettings(prev => ({ ...prev, onlineShopLogo: compressed }));
                    }
                  }
                }}
              />
              {settings.onlineShopLogo && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={settings.onlineShopLogo} alt="Shop Logo" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  <button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }} onClick={() => setSettings({ ...settings, onlineShopLogo: '' })}>ລຶບຮູບ (Delete)</button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">ຮູບແບນເນີຫົວເວັບ (Shop Header Banner Image)</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const compressed = await resizeImage(file, 800, 0.7);
                    if (compressed) {
                      setSettings(prev => ({ ...prev, onlineShopBannerImg: compressed }));
                    }
                  }
                }}
              />
              {settings.onlineShopBannerImg && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={settings.onlineShopBannerImg} alt="Shop Banner" style={{ width: '120px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  <button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }} onClick={() => setSettings({ ...settings, onlineShopBannerImg: '' })}>ລຶບຮູບ (Delete)</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ຂໍ້ຄວາມຕ້ອນຮັບ / ແບນເນີຫົວຂໍ້ (Welcome Banner Text)</label>
            <input
              type="text"
              className="form-control"
              value={settings.onlineShopBanner || ''}
              onChange={(e) => setSettings({ ...settings, onlineShopBanner: e.target.value })}
              placeholder="ຍິນດີຕ້ອນຮັບສູ່ ຮ້ານອອນລາຍ KP Pakse!"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ສີຫຼັກຂອງແອັບອອນລາຍ (Theme Color)</label>
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
            </div>
            <div className="form-group">
              <label className="form-label">ຟອນສະແດງຜົນ (Font Family)</label>
              <select
                className="form-control"
                value={settings.onlineShopFontFamily || 'Outfit, Phetsarath OT, sans-serif'}
                onChange={(e) => setSettings({ ...settings, onlineShopFontFamily: e.target.value })}
              >
                <option value="Outfit, Phetsarath OT, sans-serif">Outfit & Phetsarath OT (Default)</option>
                <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                <option value="Roboto, sans-serif">Roboto</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ຂະໜາດຕົວອັກສອນ (Font Size)</label>
              <select
                className="form-control"
                value={settings.onlineShopFontSize || 'medium'}
                onChange={(e) => setSettings({ ...settings, onlineShopFontSize: e.target.value })}
              >
                <option value="small">ນ້ອຍ (Small)</option>
                <option value="medium">ກາງ (Medium)</option>
                <option value="large">ໃຫຍ່ (Large)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ຮູບແບບ Layout ໜ້າທຳອິດ</label>
              <select
                className="form-control"
                value={settings.onlineShopLayout || 'grid'}
                onChange={(e) => setSettings({ ...settings, onlineShopLayout: e.target.value })}
              >
                <option value="grid">ຕາຕະລາງ (Grid - Multi columns)</option>
                <option value="list">ລາຍການລຽງລົງ (List - Single column)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ລຽງລໍາດັບສິນຄ້າ (Sorting)</label>
              <select
                className="form-control"
                value={settings.onlineShopProductSort || 'default'}
                onChange={(e) => setSettings({ ...settings, onlineShopProductSort: e.target.value })}
              >
                <option value="default">ຄ່າເລີ່ມຕົ້ນ (Default Order)</option>
                <option value="priceAsc">ລາຄາຕໍ່າຫາສູງ (Price: Low to High)</option>
                <option value="priceDesc">ລາຄາສູງຫາຕໍ່າ (Price: High to Low)</option>
                <option value="newest">ສິນຄ້າມາໃໝ່ (Newest First)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & SHIPPING */}
      {onlineSubTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.onlineShopSalesEnabled !== false}
                  onChange={(e) => setSettings({ ...settings, onlineShopSalesEnabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>🛒 ເປີດໃຊ້ງານການຂາຍອອນລາຍ (Enable Online Sales)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ຫາກປິດ, ລູກຄ້າຈະບໍ່ສາມາດກົດສັ່ງຊື້ສິນຄ້າອອນລາຍໄດ້.</span>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.onlineShopMemberDiscountEnabled !== false}
                  onChange={(e) => setSettings({ ...settings, onlineShopMemberDiscountEnabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>💎 ຮອງຮັບສ່ວນຫຼຸດສະມາຊິກອອນລາຍ (Enable Member Discounts)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ອະນຸຍາດໃຫ້ລູກຄ້າທີ່ເຂົ້າສູ່ລະບົບໄດ້ຮັບສ່ວນຫຼຸດຕາມລະດັບສະມາຊິກ.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ບວກລາຄາສິນຄ້າອອນລາຍເພີ່ມເຕີມ (%) (Online Markup Rate)</label>
              <input
                type="number"
                className="form-control"
                value={settings.onlineShopMarkupPercent || 0}
                onChange={(e) => setSettings({ ...settings, onlineShopMarkupPercent: Number(e.target.value) || 0 })}
                placeholder="0"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ລາຄາສິນຄ້າໃນໜ້າເວັບອອນລາຍຈະບວກເພີ່ມ % ນີ້ຈາກລາຄາໜ້າຮ້ານ (0 = ລາຄາເທົ່າກັນ).</span>
            </div>
            <div className="form-group">
              <label className="form-label">ຍອດຊື້ຂັ້ນຕ່ຳເພື່ອຈັດສົ່ງຟຣີ (Free Shipping Threshold - ກີບ)</label>
              <input
                type="number"
                className="form-control"
                value={settings.onlineShopFreeShippingThreshold || 0}
                onChange={(e) => setSettings({ ...settings, onlineShopFreeShippingThreshold: Number(e.target.value) || 0 })}
                placeholder="0"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ປ້ອນ 0 ຫາກບໍ່ຕ້ອງການເປີດໂປຣໂມຊັ່ນສົ່ງຟຣີ.</span>
            </div>
          </div>

          {/* Disabled Categories */}
          <div className="form-group">
            <label className="form-label">🚫 ເລືອກໝວດໝູ່ທີ່ບໍ່ຕ້ອງການຂາຍອອນລາຍ (Hide Categories Online)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {categories.map(cat => {
                const disabledList = settings.onlineShopDisabledCategories || [];
                const isEnabled = !disabledList.includes(cat.id);
                return (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => toggleCategory(cat.id, e.target.checked)}
                    />
                    <span>{cat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Shipping Methods Table */}
          <div className="form-group" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>🚚 ຊ່ອງທາງການຈັດສົ່ງ (Shipping Methods)</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addShippingMethod}
              >+ ເພີ່ມຊ່ອງທາງ</button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {(settings.onlineShopShippingMethods || []).map((method, idx) => (
                <div key={method.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={method.name}
                    onChange={(e) => updateShippingMethod(idx, 'name', e.target.value)}
                    placeholder="ຊື່ວິທີການຈັດສົ່ງ"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    className="form-control"
                    value={method.baseRate}
                    onChange={(e) => updateShippingMethod(idx, 'baseRate', Number(e.target.value) || 0)}
                    placeholder="ຄ່າຈັດສົ່ງ (LAK)"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}
                    onClick={() => removeShippingMethod(idx)}
                  >ລຶບ</button>
                </div>
              ))}
              {(settings.onlineShopShippingMethods || []).length === 0 && (
                <div style={{ text: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ບໍ່ມີຊ່ອງທາງການຈັດສົ່ງທີ່ກຳນົດ</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT & POS LINK */}
      {onlineSubTab === 'payment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.onlineShopEnableQR !== false}
                  onChange={(e) => setSettings({ ...settings, onlineShopEnableQR: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>📱 ເປີດໃຊ້ງານຊຳລະຜ່ານ BCEL QR (Enable BCEL QR Payment)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ສະແດງ QR ໂອນເງິນໃນຂັ້ນຕອນການຊຳລະເງິນ.</span>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.onlineShopEnableCOD === true}
                  onChange={(e) => setSettings({ ...settings, onlineShopEnableCOD: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>💵 ເກັບເງິນປາຍທາງ (Cash on Delivery - COD)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ອະນຸຍາດໃຫ້ລູກຄ້າເລືອກຈ່າຍເງິນສົດຕອນຮັບເຄື່ອງ.</span>
            </div>
          </div>

          {/* Bank Accounts Table */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>💳 ບັນຊີທະນາຄານຮັບເງິນ (Bank Accounts)</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addBankAccount}
              >+ ເພີ່ມບັນຊີ</button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {(settings.onlineShopBankAccounts || []).map((acc, idx) => (
                <div key={acc.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={acc.bankName}
                    onChange={(e) => updateBankAccount(idx, 'bankName', e.target.value)}
                    placeholder="ຊື່ທະນາຄານ (e.g. BCEL)"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={acc.accName}
                    onChange={(e) => updateBankAccount(idx, 'accName', e.target.value)}
                    placeholder="ຊື່ບັນຊີ"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={acc.accNum}
                    onChange={(e) => updateBankAccount(idx, 'accNum', e.target.value)}
                    placeholder="ເລກບັນຊີ"
                    style={{ flex: 2 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }}
                    onClick={() => removeBankAccount(idx)}
                  >ລຶບ</button>
                </div>
              ))}
              {(settings.onlineShopBankAccounts || []).length === 0 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ບໍ່ມີບັນຊີຮັບເງິນທີ່ກຳນົດ</div>
              )}
            </div>
          </div>

          {/* POS Integration */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', marginBottom: '12px' }}>🔌 ການເຊື່ອມຕໍ່ລະບົບ POS (POS Integration)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={settings.onlineShopAutoSyncStock !== false}
                    onChange={(e) => setSettings({ ...settings, onlineShopAutoSyncStock: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>🔄 ຕັດສະຕັອກ POS ອັດຕະໂນມັດ (Shared Stock API)</span>
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ເມື່ອມີການສັ່ງຊື້ອອນລາຍ ຈະຕັດສະຕັອກໃນ POS ຫຼັກທັນທີ.</span>
              </div>

              <div className="form-group">
                <label className="form-label">ສົ່ງອໍເດີ້ອອນລາຍເຂົ້າບັດຄິວ (POS Slot Routing)</label>
                <select
                  className="form-control"
                  value={settings.onlineShopPosRedirectSlot || 'SLOT1'}
                  onChange={(e) => setSettings({ ...settings, onlineShopPosRedirectSlot: e.target.value })}
                >
                  <option value="SLOT1">ບັດຄິວ 1 (Slot 1)</option>
                  <option value="SLOT2">ບັດຄິວ 2 (Slot 2)</option>
                  <option value="SLOT3">ບັດຄິວ 3 (Slot 3)</option>
                  <option value="SLOT4">ບັດຄິວ 4 (Slot 4)</option>
                  <option value="SLOT5">ບັດຄິວ 5 (Slot 5)</option>
                  <option value="SLOT6">ບັດຄິວ 6 (Slot 6)</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ເລືອກບັດຄິວຫຼັກທີ່ຕ້ອງການໃຫ້ອໍເດີ້ອອນລາຍແລ່ນເຂົ້າ.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERTS & SECURITY */}
      {onlineSubTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ຍອດສະຕັອກຕໍ່າສຸດເພື່ອແຈ້ງເຕືອນ (Low Stock Alert Threshold)</label>
              <input
                type="number"
                className="form-control"
                value={settings.onlineShopLowStockThreshold !== undefined ? settings.onlineShopLowStockThreshold : 5}
                onChange={(e) => setSettings({ ...settings, onlineShopLowStockThreshold: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.onlineShopAlertSound !== false}
                  onChange={(e) => setSettings({ ...settings, onlineShopAlertSound: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>🔊 ເປີດສຽງແຈ້ງເຕືອນອໍເດີ້ໃໝ່ (Play Sound for New Orders)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ຫຼິ້ນສຽງແຈ້ງເຕືອນເມື່ອມີລູກຄ້າສັ່ງຊື້ອອນລາຍເຂົ້າມາ.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.onlineShopAccessPinRequired === true}
                  onChange={(e) => setSettings({ ...settings, onlineShopAccessPinRequired: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>🔑 ຕ້ອງໃຊ້ PIN ເພື່ອເຂົ້າເຖິງການຕັ້ງຄ່າ (Admin PIN Protection)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ຕ້ອງການລະຫັດ PIN ຂອງແອດມິນເພື່ອແກ້ໄຂການຕັ້ງຄ່າຮ້ານອອນລາຍ.</span>
            </div>

            <div className="form-group">
              <label className="form-label">ລະຫັດ Admin PIN</label>
              <input
                type="password"
                maxLength="4"
                className="form-control"
                value={settings.masterAdminPin || '1111'}
                disabled
                placeholder="••••"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ລະຫັດດຽວກັນກັບ Master Admin PIN ຂອງລະບົບ POS.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRANSLATIONS OVERRIDE */}
      {onlineSubTab === 'translations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            📝 ແກ້ໄຂ ແລະ ປັບແຕ່ງຂໍ້ຄວາມສະແດງຜົນໃນໜ້າເວັບອອນລາຍໄດ້ເອງ (Localization Overrides)
          </p>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px' }}>ປຸ່ມ / ຂໍ້ຄວາມ (Label Key)</th>
                  <th style={{ padding: '8px 12px' }}>ພາສາລາວ (Lao)</th>
                  <th style={{ padding: '8px 12px' }}>ພາສາໄທ (Thai)</th>
                  <th style={{ padding: '8px 12px' }}>English (EN)</th>
                </tr>
              </thead>
              <tbody>
                {translationKeys.map((item) => {
                  const loVal = settings.onlineShopTranslations?.lo?.[item.key] !== undefined ? settings.onlineShopTranslations.lo[item.key] : item.defaultLo;
                  const thVal = settings.onlineShopTranslations?.th?.[item.key] !== undefined ? settings.onlineShopTranslations.th[item.key] : item.defaultTh;
                  const enVal = settings.onlineShopTranslations?.en?.[item.key] !== undefined ? settings.onlineShopTranslations.en[item.key] : item.defaultEn;

                  return (
                    <tr key={item.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{item.key}</td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          value={loVal}
                          onChange={(e) => updateTranslation('lo', item.key, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          value={thVal}
                          onChange={(e) => updateTranslation('th', item.key, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          value={enVal}
                          onChange={(e) => updateTranslation('en', item.key, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
