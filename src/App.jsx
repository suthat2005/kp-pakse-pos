import React, { useState, useEffect } from 'react';
import { db, DEFAULT_LABEL_KEYS } from './utils/db';
import Login from './components/Login';
import POS from './components/POS';
import Inventory from './components/Inventory';
import FramingBoard from './components/FramingBoard';
import Reports from './components/Reports';
import AIDetector from './components/AIDetector';
import Settings from './components/Settings';
import Debts from './components/Debts';
import HRM from './components/HRM';
import OrderTracking from './components/OrderTracking';
import Customers from './components/Customers';
import OnlineShop from './components/OnlineShop';
import OnlineOrders from './components/OnlineOrders';
import Portal from './components/Portal';

// Authorization helper to check custom permissions with backward-compatible role fallbacks
const hasPermission = (user, tabKey) => {
  if (!user) return false;

  // Protect Settings: ONLY allow owners/admins to manage hardware configurations
  if (tabKey === 'settings') {
    return user.role === 'owner' || (user.permissions && user.permissions.settings);
  }

  if (user.role === 'owner') return true;
  if (user.permissions) {
    if (user.permissions.admin) return true;
    return !!user.permissions[tabKey];
  }
  // Fallback defaults for legacy users:
  if (tabKey === 'pos') return true;
  if (tabKey === 'inventory') return user.role === 'owner';
  if (tabKey === 'hrm') return user.role === 'owner';
  if (tabKey === 'reports') return user.role === 'owner';
  if (tabKey === 'debts') return user.role === 'owner' || user.role === 'cashier';
  if (tabKey === 'ai') return user.role !== 'cashier';
  if (tabKey === 'settings') return user.role === 'owner';
  if (tabKey === 'customers') return user.role === 'owner' || user.role === 'cashier';
  return false;
};

export default function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [trackingJobId, setTrackingJobId] = useState(null);
  const [showOnlineShopQrModal, setShowOnlineShopQrModal] = useState(false);
  const [settings, setSettings] = useState({ shopName: '', shopSubtitle: '', appTheme: 'gold', themeColors: {}, shopLogo: '' });
  const [lowStockWarning, setLowStockWarning] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check URL query parameter for order tracking (?track=JOBXXXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    if (trackId) {
      setTrackingJobId(trackId);
    }
  }, []);
  
  // Shared state to bridge Framing Board payments into POS cart
  const [redirectedCartItem, setRedirectedCartItem] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  
  // Expense Logging states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', paymentMethod: 'cash', supplier: '', currency: 'LAK' });
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [expensePrintId, setExpensePrintId] = useState(null);

  // Shift Report modal states
  const [showShiftReportModal, setShowShiftReportModal] = useState(false);
  const [shiftReportData, setShiftReportData] = useState(null);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('');

  // Sync today's attendance check-in status
  useEffect(() => {
    if (activeUser) {
      const logs = db.getAttendance();
      const record = logs.find(l => l.userId === activeUser.id && !l.clockOut);
      setTodayAttendance(record || null);
    } else {
      setTodayAttendance(null);
    }
  }, [activeUser]);

  // Inject Custom Theme Colors Dynamically
  useEffect(() => {
    const root = document.documentElement;
    const customKeys = [
      'gold-primary', 'bg-main', 'bg-card', 'success-green', 'alert-red', 
      'radius-lg', 'radius-md', 'radius-sm', 'gold-dark', 'gold-glow', 'bg-card-hover',
      'accent-amber', 'text-primary', 'text-secondary', 'border-color', 'font-lao', 'shadow-premium'
    ];
    customKeys.forEach(k => {
      root.style.removeProperty(`--user-${k}`);
      root.style.removeProperty(`--${k}`);
    });

    if (settings && settings.themeConfig) {
      const cfg = settings.themeConfig;
      if (cfg.colors) {
        root.style.setProperty('--user-gold-primary', cfg.colors.primary || '#d4af37');
        root.style.setProperty('--user-bg-main', cfg.colors.background || '#0c0b09');
        root.style.setProperty('--user-bg-card', cfg.colors.card || '#161411');
        root.style.setProperty('--user-success-green', cfg.colors.success || '#2ecc71');
        root.style.setProperty('--user-alert-red', cfg.colors.danger || '#e74c3c');
        root.style.setProperty('--border-color', cfg.colors.border || '#3D352E');
        root.style.setProperty('--accent-amber', cfg.colors.secondary || '#4A3B32');
        
        const primary = cfg.colors.primary || '#d4af37';
        root.style.setProperty('--user-gold-dark', darkenColor(primary, 0.2));
        root.style.setProperty('--user-gold-glow', hexToRgba(primary, 0.25));
        
        const cardBg = cfg.colors.card || '#161411';
        root.style.setProperty('--user-bg-card-hover', lightenColor(cardBg, 0.15));
      }
      
      if (cfg.typography) {
        root.style.setProperty('--font-lao', cfg.typography.fontFamily || 'Phetsarath, Noto Sans Lao, sans-serif');
      }
      
      if (cfg.layout) {
        root.style.setProperty('--user-radius-lg', cfg.layout.borderRadius || '8px');
        const rVal = parseInt(cfg.layout.borderRadius || '8px');
        root.style.setProperty('--user-radius-md', `${Math.round(rVal / 2)}px`);
        root.style.setProperty('--user-radius-sm', `${Math.round(rVal / 4)}px`);
        
        root.style.setProperty('--sidebar-width', cfg.layout.sidebarWidth || '260px');
        root.style.setProperty('--sidebar-collapsed-width', cfg.layout.sidebarCollapsedWidth || '70px');
      }
    } else if (settings && settings.themeColors) {
      Object.entries(settings.themeColors).forEach(([key, val]) => {
        if (val) {
          root.style.setProperty(`--user-${key}`, val);
          if (key === 'gold-primary') {
            root.style.setProperty('--user-gold-dark', darkenColor(val, 0.2));
            root.style.setProperty('--user-gold-glow', hexToRgba(val, 0.25));
          }
          if (key === 'bg-card') {
            root.style.setProperty('--user-bg-card-hover', lightenColor(val, 0.15));
          }
        }
      });
    }

    if (settings && settings.uiControls) {
      const uic = settings.uiControls;
      if (!uic.roundedCorners) {
        root.style.setProperty('--user-radius-lg', '0px');
        root.style.setProperty('--user-radius-md', '0px');
        root.style.setProperty('--user-radius-sm', '0px');
      }
      if (!uic.shadowsEnabled) {
        root.style.setProperty('--shadow-premium', 'none');
      }
      if (!uic.animationEnabled) {
        document.body.classList.add('no-animations');
      } else {
        document.body.classList.remove('no-animations');
      }
    }
  }, [settings]);

  // Theme helper tools
  function hexToRgba(hex, alpha) {
    if (!hex || hex.length < 7) return `rgba(212,175,55,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function darkenColor(hex, percent) {
    if (!hex || hex.length < 7) return '#aa8412';
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.floor(r * (1 - percent)));
    g = Math.max(0, Math.floor(g * (1 - percent)));
    b = Math.max(0, Math.floor(b * (1 - percent)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }
  function lightenColor(hex, percent) {
    if (!hex || hex.length < 7) return '#211e19';
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * percent));
    g = Math.min(255, Math.floor(g + (255 - g) * percent));
    b = Math.min(255, Math.floor(b + (255 - b) * percent));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  // Initialize DB and load active session
  useEffect(() => {
    db.init();
    
    // Pull the latest database (users, settings, products) immediately on app startup
    db.syncOnStartup().then(() => {
      const current = db.getActiveUser();
      if (current) {
        setActiveUser(current);
        adjustDefaultTabForRole(current.role);
      }
      loadSystemConfig();
    });
  }, []);

  // Background Database synchronization effect
  useEffect(() => {
    if (activeUser) {
      db.startSync(handleSystemUpdate);
    } else {
      db.stopSync();
    }
    return () => {
      db.stopSync();
    };
  }, [activeUser]);

  // Dynamic favicon and apple-touch-icon update effect
  useEffect(() => {
    if (settings.shopLogo) {
      // Update standard favicon
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.shopLogo;
      link.type = 'image/png';

      // Update apple-touch-icon
      let linkApple = document.querySelector("link[rel='apple-touch-icon']");
      if (!linkApple) {
        linkApple = document.createElement('link');
        linkApple.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(linkApple);
      }
      linkApple.href = '/logo.jpg';

      // Update apple-touch-icon-precomposed
      let linkApplePre = document.querySelector("link[rel='apple-touch-icon-precomposed']");
      if (!linkApplePre) {
        linkApplePre = document.createElement('link');
        linkApplePre.rel = 'apple-touch-icon-precomposed';
        document.getElementsByTagName('head')[0].appendChild(linkApplePre);
      }
      linkApplePre.href = '/logo.jpg';
    }
  }, [settings.shopLogo]);

  // Global Double Click Translation listener
  useEffect(() => {
    const handleGlobalDoubleClick = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const text = e.target.textContent ? e.target.textContent.trim() : '';
      if (!text) return;

      const activeSettings = db.getSettings();
      const labels = activeSettings.labels || {};
      
      let matchedKey = null;
      let matchedDefault = '';

      for (const item of DEFAULT_LABEL_KEYS) {
        const customValue = labels[item.key];
        const defaultValue = item.defaultValue.trim();
        
        const cleanEmoji = (str) => str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();

        if (
          (customValue && customValue.trim() === text) ||
          defaultValue === text ||
          cleanEmoji(defaultValue) === text ||
          (customValue && cleanEmoji(customValue) === text)
        ) {
          matchedKey = item.key;
          matchedDefault = item.defaultValue;
          break;
        }
      }

      if (matchedKey) {
        const currentUser = db.getActiveUser();
        const settings = db.getSettings();
        let isAuthorized = currentUser && (currentUser.role === 'owner' || (currentUser.permissions && currentUser.permissions.admin));
        
        if (!isAuthorized) {
          const pin = prompt('🔒 ປ້ອງກັນການແກ້ໄຂ: ກະລຸນາໃສ່ລະຫັດ PIN ຂອງ Admin/ເຈົ້າຂອງຮ້ານ ເພື່ອອະນຸມັດ:');
          if (!pin) return;
          const users = db.getUsers();
          const matchedOwner = users.find(u => u.role === 'owner' && u.passcode === pin);
          const isMasterPin = pin === settings.masterAdminPin;
          if (matchedOwner || isMasterPin) {
            isAuthorized = true;
          } else {
            alert('❌ ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ! ທ່ານບໍ່ມີສິດແກ້ໄຂ.');
            return;
          }
        }

        if (isAuthorized) {
          const currentVal = labels[matchedKey] || matchedDefault;
          const newVal = prompt(`ແກ້ໄຂຂໍ້ຄວາມພາສາລາວສຳລັບ [${matchedKey}]:\n\nຄ່າເກົ່າ: "${currentVal}"\n\nປ້ອນຂໍ້ຄວາມໃໝ່ທີ່ຕ້ອງການສະແດງ:`, currentVal);
          if (newVal !== null) {
            const updatedLabels = { ...labels, [matchedKey]: newVal };
            db.saveLabels(updatedLabels);
            alert(`✓ ແກ້ໄຂຂໍ້ຄວາມສຳເລັດ! ລະບົບຈະໂຫຼດໜ້າຈໍຄືນໃໝ່ເພື່ອປັບປຸງ.`);
            window.location.reload();
          }
        }
      }
    };

    window.addEventListener('dblclick', handleGlobalDoubleClick);
    return () => window.removeEventListener('dblclick', handleGlobalDoubleClick);
  }, []);

  const loadSystemConfig = () => {
    setSettings(db.getSettings());
    checkStockAlerts();
  };

  const checkStockAlerts = () => {
    const products = db.getProducts();
    const hasLow = products.some(p => !db.isServiceCategory(p.category) && p.stock <= p.minStock);
    setLowStockWarning(hasLow);
  };

  const adjustDefaultTabForRole = (role) => {
    setActiveTab('pos');
  };

  const handleLoginSuccess = (user) => {
    setActiveUser(user);
    adjustDefaultTabForRole(user.role);
    loadSystemConfig();
  };

  const handleLogout = () => {
    db.setActiveUser(null);
    setActiveUser(null);
  };

  const handleClockOut = () => {
    const rec = db.clockOutUser(activeUser.id);
    setTodayAttendance(null); // Clear state so user can clock in again
    
    // Clean up delivered framing jobs to keep DB size compact
    db.cleanupDeliveredJobs();
    
    // Fetch summary for the shift
    const summary = db.getSalesSummary(activeUser.id, rec.clockIn, rec.clockOut, true);
    setShiftReportData({
      cashierName: activeUser.name,
      clockIn: rec.clockIn,
      clockOut: rec.clockOut,
      openingCash: rec.openingCash || 0,
      ...summary
    });
    setShowShiftReportModal(true);
    handleSystemUpdate();
  };

  const handleSystemUpdate = () => {
    loadSystemConfig();
    const current = db.getActiveUser();
    if (current) {
      setActiveUser(current);
    }
  };

  const handleRedirectToPOSPayment = (itemToPay) => {
    setRedirectedCartItem(itemToPay);
    setActiveTab('pos');
  };

  const getThemeStyle = () => {
    const theme = settings.appTheme || 'gold';
    const themes = {
      gold: {
        '--gold-primary': '#d4af37',
        '--gold-dark': '#aa8412',
        '--gold-glow': 'rgba(212, 175, 55, 0.25)',
        '--accent-amber': '#e5a93b'
      },
      amber: {
        '--gold-primary': '#e67e22',
        '--gold-dark': '#d35400',
        '--gold-glow': 'rgba(230, 126, 34, 0.25)',
        '--accent-amber': '#f39c12'
      },
      emerald: {
        '--gold-primary': '#2ecc71',
        '--gold-dark': '#27ae60',
        '--gold-glow': 'rgba(46, 204, 113, 0.25)',
        '--accent-amber': '#16a085'
      },
      blue: {
        '--gold-primary': '#3498db',
        '--gold-dark': '#2980b9',
        '--gold-glow': 'rgba(52, 152, 219, 0.25)',
        '--accent-amber': '#1abc9c'
      },
      crimson: {
        '--gold-primary': '#e74c3c',
        '--gold-dark': '#c0392b',
        '--gold-glow': 'rgba(231, 76, 60, 0.25)',
        '--accent-amber': '#e67e22'
      }
    };
    
    const baseTheme = themes[theme] || themes.gold;
    const customTheme = {};
    if (settings.themeColors) {
      Object.entries(settings.themeColors).forEach(([key, val]) => {
        if (val) {
          customTheme[`--${key}`] = val;
          if (key === 'gold-primary') {
            customTheme['--gold-dark'] = darkenColor(val, 0.2);
            customTheme['--gold-glow'] = hexToRgba(val, 0.25);
          }
          if (key === 'bg-card') {
            customTheme['--bg-card-hover'] = lightenColor(val, 0.15);
          }
        }
      });
    }
    
    return { ...baseTheme, ...customTheme };
  };

  const _cleanPath = window.location.pathname.replace(/\/+$/, ''); // strip trailing slashes
  const isPosMode = (_cleanPath === '/pos' || _cleanPath === '/pos/index.html' || window.location.search.includes('mode=pos')) && !window.location.search.includes('track=');

  if (!isPosMode) {
    return <OnlineShop />;
  }

  if (trackingJobId) {
    return <OrderTracking jobId={trackingJobId} onClose={() => setTrackingJobId(null)} />;
  }

  if (!activeUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const cleanSidebarLabel = (text) => {
    if (!text) return '';
    // Strip leading emojis and optional space
    return text.replace(/^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2B50}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}🐾🛠️💵📦👥💳📊🛒📒🤖⚙️⚡️✨🌟👑🔥]+[\s]*/u, '');
  };

  const widths = db.getPaperPrintWidths(settings.receiptPaperWidth || '80mm');
  const computedStyle = getThemeStyle();

  return (
    <div className="app-container" style={computedStyle}>
      <style>{`
        :root {
          --receipt-paper-width: ${widths.paper};
          --receipt-printable-width: ${widths.printable};
          --receipt-font-size: ${settings.receiptFontSize || '10pt'};
          --receipt-padding: ${settings.receiptPadding || '3mm'};
          --receipt-line-height: ${settings.receiptLineHeight || '1.3'};
          --receipt-divider-thickness: ${settings.receiptDividerThickness || '1px'};
          --receipt-divider-style: ${settings.receiptDividerStyle || 'dashed'};
        }
        @media print {
          @page {
            size: ${widths.paper.includes('landscape') ? 'A5 landscape' : widths.paper === 'A5' ? 'A5' : widths.paper === 'A4' ? 'A4' : 'portrait'};
            margin: 0mm !important;
          }
        }
        /* Collapsible Sidebar Styles */
        .app-container {
          display: flex !important;
          flex-direction: row !important;
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-primary);
        }
        .app-sidebar {
          background: var(--bg-card);
          border-right: 1.5px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 101;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 4px 0 20px rgba(0,0,0,0.3);
          flex-shrink: 0;
        }
        .sidebar-logo {
          padding: 16px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1.5px solid var(--border-color);
          min-height: 70px;
        }
        .sidebar-logo .logo-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px solid var(--gold-primary);
          box-shadow: 0 0 8px var(--gold-glow);
          flex-shrink: 0;
          object-fit: cover;
        }
        .sidebar-logo .logo-img-fallback {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(212,175,55,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          border: 1.5px solid var(--gold-primary);
          flex-shrink: 0;
        }
        .sidebar-logo .logo-text {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-logo .logo-text h1 {
          font-size: 0.9rem;
          color: var(--gold-primary);
          font-weight: 700;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin: 0;
        }
        .sidebar-logo .logo-text p {
          font-size: 0.65rem;
          color: var(--text-secondary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin: 0;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 8px;
          flex-grow: 1;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: transparent;
          border: 1.5px solid transparent;
          border-radius: var(--user-radius-md, var(--radius-md, 6px));
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: white;
        }
        .sidebar-item.active {
          background: linear-gradient(95deg, var(--user-gold-glow, var(--gold-glow)) 0%, rgba(212,175,55,0.02) 100%);
          border-color: rgba(212, 175, 55, 0.3);
          color: var(--user-gold-primary, var(--gold-primary));
        }
        .sidebar-icon {
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        .sidebar-label {
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.2s;
        }
        .sidebar-toggle-btn {
          background: rgba(255,255,255,0.02);
          border: none;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .sidebar-toggle-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .main-layout {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }
        .app-topbar {
          background: var(--bg-card);
          border-bottom: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          min-height: 70px;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          z-index: 100;
        }
        .active-route-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--user-gold-primary, var(--gold-primary));
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dashboard-content {
          flex-grow: 1;
          overflow-y: auto !important;
          padding: 24px;
          background-color: var(--bg-main);
        }
        .no-animations * {
          transition: none !important;
          animation: none !important;
        }
        .hamburger-menu-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 8px;
          margin-right: 12px;
          line-height: 1;
        }
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 998;
        }
        @media (max-width: 768px) {
          .app-sidebar {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 260px !important;
            transform: translateX(-100%);
            z-index: 1000 !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .app-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .sidebar-toggle-btn {
            display: none !important;
          }
          .app-topbar {
            padding: 0 16px !important;
          }
          .hamburger-menu-btn {
            display: block !important;
          }
          .dashboard-content {
            padding: 16px !important;
          }
        }
      `}</style>

      {/* Left Sidebar Navigation Overlay for Mobile */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* Left Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`} style={{ width: sidebarCollapsed ? '70px' : '260px' }}>
        <div className="sidebar-logo">
          {settings.shopLogo ? (
            <img src={settings.shopLogo} className="logo-img" alt="Shop Logo" />
          ) : (
            <div className="logo-img-fallback">🪷</div>
          )}
          {!sidebarCollapsed && (
            <div className="logo-text">
              <h1>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</h1>
              <p>{settings.shopSubtitle || 'ຮ້ານອັດກອບພຣະເຄື່ອງ & ວັດຖຸມຸງຄຸນ'}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              {/* Record Expense Button */}
              <button
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(229, 169, 59, 0.15)',
                  color: 'var(--accent-amber)',
                  border: '1px solid rgba(229, 169, 59, 0.3)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', currency: 'LAK' });
                  setShowExpenseModal(true);
                  setMobileSidebarOpen(false);
                }}
              >
                💸 ບັນທຶກລາຍຈ່າຍ (Expense)
              </button>

              {/* Attendance Button */}
              {!todayAttendance ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(46, 204, 113, 0.15)',
                    color: '#2ecc71',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    setOpeningCashInput('');
                    setShowClockInModal(true);
                    setMobileSidebarOpen(false);
                  }}
                >
                  🕒 ເຂົ້າງານ (Clock In)
                </button>
              ) : !todayAttendance.clockOut ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(231, 76, 60, 0.15)',
                    color: '#e74c3c',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    handleClockOut();
                    setMobileSidebarOpen(false);
                  }}
                >
                  🕒 ອອກງານ (Clock Out)
                </button>
              ) : (
                <div style={{
                  padding: '8px',
                  fontSize: '0.8rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  ✓ ເຮັດວຽກແລ້ວ (Shift Done)
                </div>
              )}

              {/* Reprint Shift Report for Cashier */}
              {activeUser.role === 'cashier' && (
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    const logs = db.getAttendance();
                    const activeRecord = logs.find(l => l.userId === activeUser.id && !l.clockOut);
                    const lastRecord = logs.find(l => l.userId === activeUser.id);
                    const recordToUse = activeRecord || lastRecord;
                    if (recordToUse) {
                      const summary = db.getSalesSummary(activeUser.id, recordToUse.clockIn, recordToUse.clockOut || new Date().toISOString(), true);
                      setShiftReportData({
                        cashierName: activeUser.name,
                        clockIn: recordToUse.clockIn,
                        clockOut: recordToUse.clockOut || null,
                        openingCash: recordToUse.openingCash || 0,
                        ...summary
                      });
                      setShowShiftReportModal(true);
                      setMobileSidebarOpen(false);
                    } else {
                      alert('ບໍ່ພົບຂໍ້ມູນກະການເຮັດວຽກ!');
                    }
                  }}
                >
                  🖨️ ສະຫຼຸບກະ (Shift Summary)
                </button>
              )}
            </div>
          )}
                    {/* 1. Reports */}
          {hasPermission(activeUser, 'reports') && !isMobile && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reports'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">📊</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_reports', '📊 ລາຍງານ (Reports)'))}</span>}
            </button>
          )}

          {/* 2. POS */}
          {hasPermission(activeUser, 'pos') && !isMobile && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pos'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">{activeUser.role === 'technician' ? '🛠️' : '💵'}</span>
              {!sidebarCollapsed && (
                <span className="sidebar-label">
                  {activeUser.role === 'technician'
                    ? cleanSidebarLabel(db.getLabel('tab_framing', '🛠️ ງານອັດກອບ (Framing)'))
                    : cleanSidebarLabel(db.getLabel('tab_pos', '💵 ຂາຍໜ້າຮ້ານ (POS)'))}
                </span>
              )}
            </button>
          )}

          {/* 3. Online Orders */}
          {(activeUser.role === 'owner' || activeUser.role === 'manager') && !isMobile && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'online_orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('online_orders'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">🛒</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel('🛒 ອໍເດີ້ອອນລາຍ (Online Orders)')}</span>}
            </button>
          )}

          {/* 4. Inventory */}
          {hasPermission(activeUser, 'inventory') && !isMobile && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setActiveTab('inventory'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">📦</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_inventory', '📦 ສະຕັອກ (Inventory)'))}</span>}
            </button>
          )}

          {/* 5. Debts */}
          {hasPermission(activeUser, 'debts') && !isMobile && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'debts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('debts'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">📒</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_debts', '📒 ບັນຊີຕິດໜີ້ (Debts)'))}</span>}
            </button>
          )}

          {/* 6. Members */}
          {hasPermission(activeUser, 'customers') && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">💳</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_customers', '💳 ສະມາຊິກ (Members)'))}</span>}
            </button>
          )}

          {/* 7. HRM */}
          {hasPermission(activeUser, 'hrm') && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'hrm' ? 'active' : ''}`}
              onClick={() => { setActiveTab('hrm'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">👥</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_hrm', '👥 ຈັດການບຸກຄະລາກອນ (HRM)'))}</span>}
            </button>
          )}

          {/* 8. AI System */}
          {hasPermission(activeUser, 'ai') && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ai'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">🤖</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_ai', '🤖 ລະບົບ AI'))}</span>}
            </button>
          )}

          {/* 9. Settings */}
          {hasPermission(activeUser, 'settings') && !isMobile && (
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-icon">⚙️</span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_settings', '⚙️ ຕັ້ງຄ່າ (Settings)'))}</span>}
            </button>
          )}
        </nav>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'ຂະຫຍາຍເມນູ' : 'ພັບເມນູ'}
        >
          {sidebarCollapsed ? '➡️' : '⬅️'}
        </button>
      </aside>

      {/* Main Right Content Panel */}
      <div className="main-layout">
        {/* Topbar Utility Header */}
        <header className="app-topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              type="button"
              className="hamburger-menu-btn" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              title="ເມນູ (Menu)"
            >
              ☰
            </button>
            <span className="active-route-name" style={isMobile ? { fontSize: '0.85rem', whiteSpace: 'nowrap', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis' } : {}}>
              {activeTab === 'pos' && (isMobile ? 'POS' : (activeUser.role === 'technician' ? '🛠️ ງານອັດກອບ' : '💵 ຂາຍໜ້າຮ້ານ (POS)'))}
              {activeTab === 'inventory' && (isMobile ? 'ສະຕັອກ' : '📦 ຈັດການສະຕັອກ & ວັດຖຸດິບ (Inventory)')}
              {activeTab === 'hrm' && (isMobile ? 'HRM' : '👥 ຈັດການບຸກຄະລາກອນ & ເງິນເດືອນ (HRM)')}
              {activeTab === 'reports' && (isMobile ? 'ລາຍງານ' : '📊 ບົດລາຍງານຍອດຂາຍ & ລາຍຈ່າຍ (Reports)')}
              {activeTab === 'debts' && (isMobile ? 'ຕິດໜີ້' : '📒 ບັນຊີລູກຄ້າຕິດໜີ້ (Debts)')}
              {activeTab === 'ai' && 'CCTV AI'}
              {activeTab === 'settings' && (isMobile ? 'ຕັ້ງຄ່າ' : '⚙️ ຕັ້ງຄ່າລະບົບ (Settings)')}
            </span>

            {/* Connection Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: isMobile ? '6px' : '12px',
              padding: isMobile ? '4px 6px' : '4px 10px',
              borderRadius: '12px',
              background: isOnline ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.15)',
              border: `1px solid ${isOnline ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.3)'}`,
              fontSize: '0.72rem',
              color: isOnline ? '#2ecc71' : '#e74c3c',
              fontWeight: '600',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}>
              <span className={isOnline ? 'pulse-dot-online' : 'pulse-dot-offline'} style={{
                width: '6.5px',
                height: '6.5px',
                borderRadius: '50%',
                background: isOnline ? '#2ecc71' : '#e74c3c',
                display: 'inline-block'
              }} />
              {!isMobile && <span className="no-select">{isOnline ? 'Online' : 'Offline'}</span>}
            </div>
          </div>

          <div className="topbar-actions">
            {lowStockWarning && activeUser.role === 'owner' && (
              <div
                onClick={() => {
                  setActiveTab('inventory');
                  setInventoryFilter('low_stock');
                }}
                style={{
                  background: 'rgba(231, 76, 60, 0.2)',
                  color: 'var(--alert-red)',
                  border: '1px solid var(--alert-red)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  animation: 'pulse-gold 1.5s infinite',
                  cursor: 'pointer'
                }}
              >
                {isMobile ? '⚠️ ສະຕັອກ' : '⚠️ ສະຕັອກໃກ້ໝົດ!'}
              </div>
            )}

            {/* Online Shop QR Code Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'rgba(52, 152, 219, 0.12)',
                color: '#3498db',
                borderColor: 'rgba(52, 152, 219, 0.3)',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                marginRight: '8px'
              }}
              onClick={() => setShowOnlineShopQrModal(true)}
            >
              {isMobile ? '🌐 QR' : '🌐 QR ເບິ່ງສິນຄ້າ'}
            </button>

            {/* Quick-action Expense Logger */}
            {!isMobile && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(229, 169, 59, 0.12)',
                  color: 'var(--accent-amber)',
                  borderColor: 'rgba(229, 169, 59, 0.3)',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold'
                }}
                onClick={() => {
                  setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', currency: 'LAK' });
                  setShowExpenseModal(true);
                }}
              >
                💸 ບັນທຶກລายຈ່າຍ
              </button>
            )}

            {/* Shift Report reprint button for active / last shift */}
            {activeUser.role === 'cashier' && !isMobile && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold'
                }}
                onClick={() => {
                  const logs = db.getAttendance();
                  const activeRecord = logs.find(l => l.userId === activeUser.id && !l.clockOut);
                  const lastRecord = logs.find(l => l.userId === activeUser.id);
                  const recordToUse = activeRecord || lastRecord;
                  if (recordToUse) {
                    const summary = db.getSalesSummary(activeUser.id, recordToUse.clockIn, recordToUse.clockOut || new Date().toISOString(), true);
                    setShiftReportData({
                      cashierName: activeUser.name,
                      clockIn: recordToUse.clockIn,
                      clockOut: recordToUse.clockOut || null,
                      openingCash: recordToUse.openingCash || 0,
                      ...summary
                    });
                    setShowShiftReportModal(true);
                  } else {
                    alert('ບໍ່ພົບຂໍ້ມູນກະການເຮັດວຽກ!');
                  }
                }}
              >
                🖨️ ສະຫຼຸບກະ
              </button>
            )}

            <div className="user-badge" style={{ border: 'none', background: 'transparent', padding: 0 }}>
              <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}>
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : settings.shopLogo ? (
                  <img src={settings.shopLogo} alt="Shop Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  activeUser.role === 'owner' ? '👑' : activeUser.role === 'cashier' ? '💵' : '🛠️'
                )}
              </div>
              {!isMobile && (
                <div className="user-info-text">
                  <div className="user-name">{activeUser.name}</div>
                  <div className="user-role">
                    {activeUser.roleName?.split(' ')[0] || (activeUser.role === 'owner' ? 'ເຈົ້າຂອງຮ້ານ' : activeUser.role === 'cashier' ? 'ພະນັກງານຂາຍ' : 'ຊ່າງອັດກອບ')}
                    {todayAttendance && !todayAttendance.clockOut && (
                      <span style={{ color: 'var(--success-green)', fontWeight: 'bold', marginLeft: '6px' }}>
                        (ກະ: {db.getShiftSales(activeUser.id).toLocaleString()} ₭)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Clock-In / Clock-Out Button */}
              {!isMobile && (
                <div style={{ marginLeft: '6px', marginRight: '6px', display: 'flex', alignItems: 'center' }}>
                  {!todayAttendance ? (
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        background: 'var(--success-green)',
                        color: 'black',
                        fontWeight: 'bold',
                        borderColor: 'var(--success-green)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        setOpeningCashInput('');
                        setShowClockInModal(true);
                      }}
                    >
                      🕒 ເຂົ້າງານ
                    </button>
                  ) : !todayAttendance.clockOut ? (
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        background: 'var(--alert-red)',
                        color: 'white',
                        fontWeight: 'bold',
                        borderColor: 'var(--alert-red)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        handleClockOut();
                      }}
                    >
                      🕒 ອອກງານ
                    </button>
                  ) : (
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.65rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      ✓ ເຮັດວຽກແລ້ວ
                    </span>
                  )}
                </div>
              )}

              {!isMobile && (
                <button className="logout-btn" onClick={handleLogout} title="ອອກຈາກລະບົບ">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Tabs Renderer */}
        <main className="dashboard-content">
          {!todayAttendance ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '60vh',
              padding: '40px 24px',
              textAlign: 'center',
              background: 'rgba(22, 20, 17, 0.45)',
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              margin: '20px',
              boxShadow: 'var(--shadow-premium)',
              gap: '16px'
            }}>
              <div style={{ fontSize: '4.5rem', marginBottom: '8px' }}>🔒</div>
              <h2 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>
                ລະບົບປິດລັອກຊົ່ວຄາວ (Shift Locked)
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: 0, fontSize: '0.92rem', lineHeight: '1.6' }}>
                ກະລຸນາກົດປຸ່ມ **"🕒 ເຂົ້າງານ"** ຢູ່ແຖບເມນູດ້ານເທິງ ຫຼື ກົດປຸ່ມດ້ານລຸ່ມນີ້ ເພື່ອເປີດກະລິ້ນຊັກເງິນສົດ ແລະ ເປີດໃຊ້ງານລະບົບການຂາຍ ແລະ ຈັດການສິນຄ້າ.
              </p>
              <button
                type="button"
                className="btn"
                style={{
                  marginTop: '8px',
                  padding: '12px 32px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  background: 'var(--success-green)',
                  color: 'black',
                  borderColor: 'var(--success-green)',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(46, 204, 113, 0.4)'
                }}
                onClick={() => {
                  setOpeningCashInput('');
                  setShowClockInModal(true);
                }}
              >
                🕒 ກົດເຂົ້າງານດຽວນີ້ (Clock In Shift)
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'pos' && hasPermission(activeUser, 'pos') && (
                <POS
                  key={activeUser.id}
                  activeUser={activeUser}
                  onUpdate={handleSystemUpdate}
                  redirectedCartItem={redirectedCartItem}
                  clearRedirectedCartItem={() => setRedirectedCartItem(null)}
                  onTabChange={setActiveTab}
                  onTrackJob={setTrackingJobId}
                  isMobile={isMobile}
                />
              )}
              
              {activeTab === 'inventory' && hasPermission(activeUser, 'inventory') && (
                <Inventory
                  activeUser={activeUser}
                  onUpdate={handleSystemUpdate}
                  initialFilter={inventoryFilter}
                  onFilterChange={setInventoryFilter}
                  isMobile={isMobile}
                />
              )}

              {activeTab === 'hrm' && hasPermission(activeUser, 'hrm') && (
                <HRM activeUser={activeUser} onUpdate={handleSystemUpdate} isMobile={isMobile} />
              )}
              
              {activeTab === 'reports' && hasPermission(activeUser, 'reports') && (
                <Reports activeUser={activeUser} isMobile={isMobile} />
              )}
              
              {activeTab === 'ai' && hasPermission(activeUser, 'ai') && (
                <AIDetector activeUser={activeUser} isMobile={isMobile} />
              )}

              {activeTab === 'debts' && hasPermission(activeUser, 'debts') && (
                <Debts activeUser={activeUser} onUpdate={handleSystemUpdate} isMobile={isMobile} />
              )}

              {activeTab === 'customers' && hasPermission(activeUser, 'customers') && (
                <Customers activeUser={activeUser} onUpdate={handleSystemUpdate} isMobile={isMobile} />
              )}

              {activeTab === 'settings' && hasPermission(activeUser, 'settings') && (
                <Settings activeUser={activeUser} onUpdate={handleSystemUpdate} isMobile={isMobile} />
              )}

              {activeTab === 'online_orders' && (activeUser.role === 'owner' || activeUser.role === 'manager') && (
                <OnlineOrders activeUser={activeUser} isMobile={isMobile} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Expense Logging Modal Overlay */}
      {showExpenseModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '680px', padding: '28px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.15rem' }}>💸 ບັນທຶກລາຍຈ່າຍ (Record Expense)</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setShowExpenseHistory(!showExpenseHistory)}>
                  {showExpenseHistory ? '📝 ຟອມໃໝ່' : '📋 ປະຫວັດລາຍຈ່າຍ'}
                </button>
                <button className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowExpenseModal(false)}>✕</button>
              </div>
            </div>

            {/* ===== Expense History View ===== */}
            {showExpenseHistory ? (
              <div>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {(db.getExpenses() || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>ບໍ່ມີລາຍຈ່າຍ</div>
                  ) : (db.getExpenses() || []).slice(0, 50).map(ex => (
                    <div key={ex.id} className="glass-card" style={{ padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>{ex.categoryName || ex.category}</span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: ex.paymentMethod === 'transfer' ? 'rgba(52,152,219,0.2)' : 'rgba(46,204,113,0.2)', color: ex.paymentMethod === 'transfer' ? '#3498db' : '#2ecc71' }}>
                            {ex.paymentMethod === 'transfer' ? '📱 ໂອນ' : '💵 ເງິນສົດ'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(ex.date).toLocaleString('lo-LA')}
                          {ex.supplier ? ` • ${ex.supplier}` : ''}
                          {ex.notes ? ` • ${ex.notes}` : ''}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          ຜູ້ບັນທຶກ: {ex.createdByName || 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1rem' }}>
                          -{(ex.amount || 0).toLocaleString()} {ex.currency || 'LAK'}
                          {ex.currency && ex.currency !== 'LAK' && ` (≈ ${ex.convertedAmount?.toLocaleString()} ₭)`}
                        </span>
                        <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem' }} onClick={() => {
                          setExpensePrintId(ex.id);
                          setTimeout(() => {
                            const el = document.getElementById('expense-receipt-print');
                            if (el) {
                              const w = window.open('', '_blank', 'width=400,height=600');
                              w.document.write('<html><head><title>Expense Receipt</title><style>body{font-family:monospace;font-size:13px;padding:10px;color:#000}table{width:100%;border-collapse:collapse}td{padding:3px 0}.dashed{border-top:1px dashed #000;margin:8px 0}</style></head><body>');
                              w.document.write(el.innerHTML);
                              w.document.write('</body></html>');
                              w.document.close();
                              w.print();
                            }
                            setExpensePrintId(null);
                          }, 100);
                        }}>🖨️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hidden print template */}
                {expensePrintId && (() => {
                  const ex = (db.getExpenses() || []).find(e => e.id === expensePrintId);
                  if (!ex) return null;
                  return (
                    <div id="expense-receipt-print" style={{ display: 'none' }}>
                      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                        <div style={{ fontSize: '12px' }}>{settings.shopSubtitle}</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px' }}>ໃບບິນລາຍຈ່າຍ / Expense Receipt</div>
                      </div>
                      <div className="dashed"></div>
                      <table>
                        <tbody>
                          <tr><td><b>ເລກທີ:</b></td><td style={{ textAlign: 'right' }}>{ex.id}</td></tr>
                          <tr><td><b>ວັນທີ:</b></td><td style={{ textAlign: 'right' }}>{new Date(ex.date).toLocaleString('lo-LA')}</td></tr>
                          <tr><td><b>ປະເພດ:</b></td><td style={{ textAlign: 'right' }}>{ex.categoryName || ex.category}</td></tr>
                          {ex.supplier && <tr><td><b>ຜູ້ສະໜອງ:</b></td><td style={{ textAlign: 'right' }}>{ex.supplier}</td></tr>}
                          <tr><td><b>ວິທີຊຳລະ:</b></td><td style={{ textAlign: 'right' }}>{ex.paymentMethod === 'transfer' ? 'ໂອນທະນາຄານ' : 'ເງິນສົດ'}</td></tr>
                        </tbody>
                      </table>
                      <div className="dashed"></div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                        ມູນຄ່າ: {(ex.amount || 0).toLocaleString()} {ex.currency || 'LAK'}
                        {ex.currency && ex.currency !== 'LAK' && ` (≈ ${ex.convertedAmount?.toLocaleString()} ₭)`}
                      </div>
                      <div className="dashed"></div>
                      {ex.notes && <div><b>ໝາຍເຫດ:</b> {ex.notes}</div>}
                      <div style={{ fontSize: '11px', marginTop: '6px' }}>ຜູ້ບັນທຶກ: {ex.createdByName || 'N/A'}</div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* ===== Expense Entry Form ===== */
              <form onSubmit={(e) => {
                e.preventDefault();
                const amountVal = parseFloat(expenseFormData.amount);
                if (!amountVal || amountVal <= 0) {
                  alert('ກະລຸນາປ້ອນຈຳນວນເງິນໃຫ້ຖືກຕ້ອງ');
                  return;
                }
                db.addExpense({
                  category: expenseFormData.category,
                  categoryName: expenseFormData.categoryName,
                  amount: amountVal,
                  notes: expenseFormData.notes || '',
                  paymentMethod: expenseFormData.paymentMethod || 'cash',
                  supplier: expenseFormData.supplier || '',
                  currency: expenseFormData.currency || 'LAK'
                });
                alert('✓ ບັນທຶກລາຍຈ່າຍສຳເລັດ!');
                setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', paymentMethod: 'cash', supplier: '', currency: 'LAK' });
                handleSystemUpdate();
              }}>
                {/* Row 1: Category & Supplier */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📂 ປະເພດລາຍຈ່າຍ *</label>
                    <input
                      type="text"
                      list="expense-categories-datalist"
                      required
                      placeholder="ເລືອກ ຫຼື ປ້ອນປະເພດ..."
                      className="form-control"
                      style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}
                      value={expenseFormData.categoryName}
                      onChange={(e) => {
                        const typed = e.target.value;
                        const categories = db.getExpenseCategories();
                        const matched = categories.find(c => c.name === typed || c.rawName === typed);
                        if (matched) {
                          setExpenseFormData({
                            ...expenseFormData,
                            category: matched.id,
                            categoryName: matched.rawName
                          });
                        } else {
                          setExpenseFormData({
                            ...expenseFormData,
                            category: typed.toLowerCase().trim(),
                            categoryName: typed
                          });
                        }
                      }}
                    />
                    <datalist id="expense-categories-datalist">
                      {db.getExpenseCategories().map(cat => (
                        <option key={cat.id} value={cat.name} />
                      ))}
                      {(() => {
                        const existingExpenses = db.getExpenses() || [];
                        const customExpenseNames = Array.from(new Set(existingExpenses.map(ex => ex.categoryName)));
                        const standardNames = db.getExpenseCategories().map(c => c.rawName);
                        return customExpenseNames.filter(name => name && !standardNames.includes(name));
                      })().map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🏢 ຜູ້ສະໜອງ / ຮ້ານ</label>
                    <input
                      type="text"
                      placeholder="ຊື່ຮ້ານ/ຜູ້ສະໜອງ (ຖ້າມີ)"
                      className="form-control"
                      style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}
                      value={expenseFormData.supplier}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, supplier: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 2: Amount & Currency & Payment Method */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💰 ຈຳນວນເງິນ *</label>
                    <input
                      type="number"
                      required
                      placeholder="ຈຳນວນເງິນ..."
                      className="form-control"
                      style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontSize: '1rem', fontWeight: 'bold' }}
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💵 ສະກຸນເງິນ *</label>
                    <select
                      className="form-control"
                      value={expenseFormData.currency || 'LAK'}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, currency: e.target.value })}
                      style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', height: '41px' }}
                    >
                      <option value="LAK">₭ LAK</option>
                      <option value="THB">฿ THB</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💳 ວິທີຊຳລະ *</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, paymentMethod: 'cash' })}
                        style={{
                          flex: 1, padding: '10px 4px', borderRadius: '8px', border: expenseFormData.paymentMethod === 'cash' ? '2px solid #2ecc71' : '1px solid var(--border-color)',
                          background: expenseFormData.paymentMethod === 'cash' ? 'rgba(46,204,113,0.15)' : '#221e1a',
                          color: expenseFormData.paymentMethod === 'cash' ? '#2ecc71' : 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                      >💵 ສົດ</button>
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, paymentMethod: 'transfer' })}
                        style={{
                          flex: 1, padding: '10px 4px', borderRadius: '8px', border: expenseFormData.paymentMethod === 'transfer' ? '2px solid #3498db' : '1px solid var(--border-color)',
                          background: expenseFormData.paymentMethod === 'transfer' ? 'rgba(52,152,219,0.15)' : '#221e1a',
                          color: expenseFormData.paymentMethod === 'transfer' ? '#3498db' : 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                      >📱 ໂອນ</button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Notes */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📝 ຄຳອະທິບາຍ / ໝາຍເຫດ</label>
                  <textarea
                    className="form-control"
                    placeholder="ລະບຸລາຍລະອຽດ... (ຕົວຢ່າງ: ຊື້ອາໄຫຼ່ XX 5 ອັນ)"
                    style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', minHeight: '70px', resize: 'vertical' }}
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>ຍົກເລີກ</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 28px', fontSize: '0.95rem' }}>💾 ບັນທຶກລາຍຈ່າຍ</button>
                </div>
              </form>
            )}
          </div>
        </div>
        </Portal>
      )}

      {/* Clock In Modal Overlay */}
      {showClockInModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.15rem' }}>🕒 ເປີດກະລິ້ນຊັກ / ເຂົ້າງານ</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowClockInModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                ກະລຸນາປ້ອນຈຳນວນເງິນສົດທອນເລີ່ມຕົ້ນໃນລິ້ນຊັກ (ກີບ):
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  style={{
                    fontSize: '1.25rem',
                    textAlign: 'right',
                    paddingRight: '45px',
                    fontWeight: 'bold',
                    color: 'var(--gold-primary)',
                    background: 'rgba(0,0,0,0.3)',
                    borderColor: 'var(--border-color)',
                    height: '48px',
                    borderRadius: '8px'
                  }}
                  autoFocus
                />
                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>₭</span>
              </div>

              {/* Quick cash options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[100000, 200000, 500000, 1000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      padding: '8px',
                      fontSize: '0.85rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setOpeningCashInput(val.toString())}
                  >
                    {val.toLocaleString()} ₭
                  </button>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClockInModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px' }}
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 24px',
                    borderRadius: '6px',
                    background: 'var(--success-green)',
                    color: 'black',
                    borderColor: 'var(--success-green)',
                    fontWeight: 'bold'
                  }}
                  onClick={() => {
                    const cash = parseFloat(openingCashInput) || 0;
                    const rec = db.clockInUser(activeUser.id, cash);
                    setTodayAttendance(rec);
                    setShowClockInModal(false);
                    alert('✓ ບັນທຶກເວລາເຂົ້າງານສຳເລັດ!');
                    handleSystemUpdate();
                  }}
                >
                  🕒 ຢືນຢັນເຂົ້າງານ
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Shift Report Modal Overlay */}
      {showShiftReportModal && shiftReportData && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '20px', maxHeight: '85%', overflowY: 'auto' }}>
            <div className="modal-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🖨️ ໃບບິນສະຫຼຸບກະ (Shift Report)</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowShiftReportModal(false)}>✕</button>
            </div>
            
            {/* Printable Area */}
            <div id="print-shift-report" style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.4' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                {settings.shopLogo && <img src={settings.shopLogo} alt="Logo" style={{ maxHeight: '40px', marginBottom: '6px' }} />}
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                <div style={{ fontSize: '12px' }}>{settings.shopSubtitle}</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px' }}>ໃບສະຫຼຸບຍອດປິດກະ (Shift Report)</div>
              </div>
              
              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div><b>ພະນັກງານ:</b> {shiftReportData.cashierName}</div>
                <div><b>ເວລາເຂົ້າງານ:</b> {new Date(shiftReportData.clockIn).toLocaleString('lo-LA')}</div>
                <div><b>ເວລາອອກງານ:</b> {shiftReportData.clockOut ? new Date(shiftReportData.clockOut).toLocaleString('lo-LA') : 'ຍັງບໍ່ທັນອອກກະ'}</div>
              </div>

              {shiftReportData.soldProducts && shiftReportData.soldProducts.length > 0 && (
                <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ລາຍການສິນຄ້າທີ່ຂາຍໄດ້ (Products Sold):</div>
                  {shiftReportData.soldProducts.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '12px' }}>
                      <span>- {p.name}:</span>
                      <b>{p.qty} ອັນ</b>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>ຈຳນວນບິນຂາຍ:</span>
                  <span>{shiftReportData.ordersCount} ບິນ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                  <span>ຍອດຂາຍລວມ (LAK):</span>
                  <span>{(shiftReportData.totalSalesLak || 0).toLocaleString()} ₭</span>
                </div>
              </div>

              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ແຍກຕາມການຊຳລະ:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  <span>- ເງິນທອນເລີ່ມຕົ້ນ (Opening Cash):</span>
                  <span>{(shiftReportData.openingCash || 0).toLocaleString()} ₭</span>
                </div>
                
                {/* Cash portion */}
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>💵 ລວມຮັບເງິນສົດ (Cash):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>• ເງິນສົດ LAK:</span>
                  <span>{(shiftReportData.totalCashLak || 0).toLocaleString()} ₭</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>• ເງິນສົດ THB:</span>
                  <span>{(shiftReportData.totalCashThb || 0).toLocaleString()} ฿</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>• ເງິນສົດ USD:</span>
                  <span>${(shiftReportData.totalCashUsd || 0).toLocaleString()}</span>
                </div>

                {/* Transfer portion */}
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>📱 ລວມຮັບເງິນໂອນ (Transfer):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>• ເງິນໂອນ LAK:</span>
                  <span>{(shiftReportData.totalTransferLak || 0).toLocaleString()} ₭</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>• ເງິນໂອນ THB:</span>
                  <span>{(shiftReportData.totalTransferThb || 0).toLocaleString()} ฿</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>• ເງິນໂອນ USD:</span>
                  <span>${(shiftReportData.totalTransferUsd || 0).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', color: '#c0392b', marginTop: '4px' }}>
                  <span>- ຍອດຕິດໜີ້ (Debts):</span>
                  <span>{(shiftReportData.totalDebtLak || 0).toLocaleString()} ₭</span>
                </div>
              </div>

              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b' }}>
                  <span>ລາຍຈ່າຍໃນກະ (Expenses):</span>
                  <span>-{(shiftReportData.totalExpenseLak || 0).toLocaleString()} ₭</span>
                </div>
                {shiftReportData.expenses && shiftReportData.expenses.length > 0 && (
                  <div style={{ paddingLeft: '8px', fontSize: '11px', color: '#555' }}>
                    {shiftReportData.expenses.map((ex, idx) => (
                      <div key={idx}>
                        • {ex.categoryName}: {ex.amount.toLocaleString()} {ex.currency || 'LAK'} 
                        {ex.currency && ex.currency !== 'LAK' && ` (≈ ${ex.convertedAmount?.toLocaleString()} ₭)`} ({ex.notes})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '15px', padding: '6px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>ການຄິດໄລ່ເງິນສົດໃນລິ້ນຊັກ (LAK):</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  ເງິນທອນເລີ່ມຕົ້ນ + ເງິນສົດ LAK + (ເງິນສົດ THB * {settings.exchangeRateThb || 750}) - ລາຍຈ່າຍ LAK
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '6px', borderTop: '1px solid #ccc', paddingTop: '4px' }}>
                  <span>ຍອດເງິນສົດທີ່ຕ້ອງມີ:</span>
                  <span>
                    {(
                      (shiftReportData.openingCash || 0) +
                      (shiftReportData.totalCashLak || 0) +
                      (shiftReportData.totalCashThb || 0) * (settings.exchangeRateThb || 750) -
                      (shiftReportData.totalExpenseLak || 0)
                    ).toLocaleString()} ₭
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
                  <div style={{ marginTop: '4px' }}>ພະນັກງານລາຍງານ</div>
                </div>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
                  <div style={{ marginTop: '4px' }}>ເຈົ້າຂອງຮ້ານກວດສອບ</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowShiftReportModal(false)}>ປິດ</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const reportElement = document.getElementById('print-shift-report');
                  if (!reportElement) return;

                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = '0';
                  document.body.appendChild(iframe);

                  const reportHtml = reportElement.innerHTML;
                  const doc = iframe.contentWindow.document || iframe.contentDocument;
                  doc.open();
                  doc.write(`
                    <html>
                      <head>
                        <title>Shift Report</title>
                        <style>
                          @page { size: 80mm auto; margin: 0; }
                          body {
                            background: white;
                            color: black;
                            margin: 0;
                            padding: 0;
                            font-family: monospace;
                            width: 80mm;
                          }
                          #print-shift-report {
                            width: 80mm;
                            padding: 2mm;
                            margin: 0 auto;
                          }
                        </style>
                      </head>
                      <body onload="window.print();">
                        <div id="print-shift-report">${reportHtml}</div>
                      </body>
                    </html>
                  `);
                  doc.close();

                  setTimeout(() => {
                    try {
                      document.body.removeChild(iframe);
                    } catch (err) {
                      console.error('Failed to clean up shift report print iframe:', err);
                    }
                  }, 1500);
                }}
              >
                🖨️ ພິມບິນສະຫຼຸບ
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Online Shop QR Code Modal */}
      {showOnlineShopQrModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px', width: '90%', padding: '24px', textAlign: 'center', background: 'linear-gradient(145deg, #1a1614 0%, #0f0d0b 100%)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 15px 40px rgba(0,0,0,0.8)' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
              🌐 QR Code ສິນຄ້າອອນລາຍ
            </h3>
            
            <div style={{ margin: '20px auto', display: 'inline-block', padding: '16px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(settings.onlineShopUrl || window.location.origin)}`} 
                alt="Online Shop QR" 
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}>
              {settings.onlineShopLabel || 'ສະແກນເບິ່ງເມນູອອນລາຍ (Scan Menu Online)'}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <a 
                href={settings.onlineShopUrl || window.location.origin} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--gold-primary)', wordBreak: 'break-all', fontSize: '0.82rem', textDecoration: 'underline' }}
              >
                {settings.onlineShopUrl || window.location.origin}
              </a>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a 
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(settings.onlineShopUrl || window.location.origin)}`} 
                download="online_shop_qr.png"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                📥 ດາວໂຫຼດ QR
              </a>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowOnlineShopQrModal(false)}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                ປິດ (Close)
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Bottom Navigation for Mobile */}
      {activeUser && (
        <nav className="bottom-nav">
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'pos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pos')}
          >
            <span className="bottom-nav-icon">💵</span>
            <span>POS</span>
          </button>

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={`bottom-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <span className="bottom-nav-icon">📦</span>
              <span>Stock</span>
            </button>
          )}

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={`bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="bottom-nav-icon">📊</span>
              <span>Reports</span>
            </button>
          )}

          {(activeUser.role === 'owner' || activeUser.role === 'manager') && (
            <button
              type="button"
              className={`bottom-nav-item ${activeTab === 'online_orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('online_orders')}
            >
              <span className="bottom-nav-icon">🛒</span>
              <span>Orders</span>
            </button>
          )}

          {(activeUser.role === 'owner' || activeUser.role === 'cashier') && (
            <button
              type="button"
              className={`bottom-nav-item ${activeTab === 'debts' ? 'active' : ''}`}
              onClick={() => setActiveTab('debts')}
            >
              <span className="bottom-nav-icon">📒</span>
              <span>Debts</span>
            </button>
          )}

          {activeUser.role === 'owner' && (
            <button
              type="button"
              className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="bottom-nav-icon">⚙️</span>
              <span>Settings</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
