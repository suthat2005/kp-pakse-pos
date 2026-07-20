import React, { useState, useEffect, Suspense, lazy, useRef, useCallback } from 'react';
import { db, DEFAULT_LABEL_KEYS } from './utils/db';
import Portal from './components/Portal';

const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const POS = lazy(() => import('./components/POS'));
const Inventory = lazy(() => import('./components/Inventory'));
const FramingBoard = lazy(() => import('./components/FramingBoard'));
const Reports = lazy(() => import('./components/Reports'));
const AIDetector = lazy(() => import('./components/AIDetector'));
const Settings = lazy(() => import('./components/Settings'));
const Debts = lazy(() => import('./components/Debts'));
const HRM = lazy(() => import('./components/HRM'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const Customers = lazy(() => import('./components/Customers'));
const OnlineShop = lazy(() => import('./components/OnlineShop'));
const OnlineOrders = lazy(() => import('./components/OnlineOrders'));

// Authorization helper to check custom permissions with backward-compatible role fallbacks
const hasPermission = (user, tabKey) => {
  if (!user) return false;

  // Protect Settings: ONLY allow owners/admins to manage hardware configurations
  if (tabKey === 'settings') {
    return user.role === 'owner' || (user.permissions && user.permissions.settings);
  }

  // Dashboard: visible to owners/admins or anyone allowed to see reports
  if (tabKey === 'dashboard') {
    return (
      user.role === 'owner' ||
      (user.permissions &&
        (user.permissions.admin ||
          user.permissions.dashboard ||
          user.permissions.reports))
    );
  }

  if (user.role === 'owner') return true;
  if (user.permissions) {
    if (user.permissions.admin) return true;
    if (tabKey === 'framing_board') return !!user.permissions.framing;
    return !!user.permissions[tabKey];
  }
  // Fallback defaults for legacy users:
  if (tabKey === 'pos') return user.role !== 'technician';
  if (tabKey === 'framing_board') return user.role === 'owner' || user.role === 'technician';
  if (tabKey === 'inventory') return user.role === 'owner';
  if (tabKey === 'hrm') return user.role === 'owner';
  if (tabKey === 'reports') return user.role === 'owner';
  if (tabKey === 'debts') return user.role === 'owner' || user.role === 'cashier';
  if (tabKey === 'ai') return user.role !== 'cashier';
  if (tabKey === 'settings') return user.role === 'owner';
  if (tabKey === 'customers') return user.role === 'owner' || user.role === 'cashier';
  return false;
};

// ─── Theme Color Utilities ────────────────────────────────────────────────────
// Defined outside App component to avoid re-creation on every render
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
// ──────────────────────────────────────────────────────────────────────────────

// ─── Enterprise SVG Icon System ────────────────────────────────────────────────
// Consistent 20×20 SVG icons for sidebar navigation (stroke-based, 1.6 weight)
const Icons = {
  dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  pos: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M7 15h.01M12 15h.01M17 15h.01M7 11h.01M12 11h.01M17 11h.01"/>
      <path d="M2 8h20"/>
    </svg>
  ),
  framing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  ),
  onlineOrders: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  inventory: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  customers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  debts: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <path d="M9 8h6M9 12h4"/>
    </svg>
  ),
  reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  hrm: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  ai: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="2.2"/>
      <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="2.2"/>
      <path d="M9 19h6"/>
    </svg>
  ),
  settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  chevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};
// ──────────────────────────────────────────────────────────────────────────────

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
  const [clockStr, setClockStr] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time clock — updates every 1s (displays full date, time, and seconds)
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const day = String(n.getDate()).padStart(2, '0');
      const month = String(n.getMonth() + 1).padStart(2, '0');
      const year = n.getFullYear();
      const d = `${day}/${month}/${year}`;
      const t = n.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setClockStr(`${d} • ${t}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandQuery('');
      }
      if (e.key === 'Escape') setShowCommandPalette(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      queueMicrotask(() => setTrackingJobId(trackId));
    }
  }, []);
  
  // Shared state to bridge Framing Board payments into POS cart
  const [redirectedCartItem, setRedirectedCartItem] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const handleViewLowStock = () => {
    setInventoryFilter('low');
    setActiveTab('inventory');
  };
  
  // Global online chat notifications state
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [toasts, setToasts] = useState([]); // Array of { id, title, body, orderId }
  const appLoadTimeRef = useRef(new Date().toISOString());
  
  const getSafeLocalStorageItem = (key, def = '') => {
    try {
      return localStorage.getItem(key) || def;
    } catch (e) {
      return def;
    }
  };
  const lastNotifiedMsgTimeRef = useRef(getSafeLocalStorageItem('last_notified_msg_time', ''));

  const playPremiumNotificationChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); 
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.08); 
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.48);
    } catch (e) {}
  };

  const checkNewChatMessages = useCallback(() => {
    try {
      const rawOrders = db.getOnlineOrders();
      const orders = (Array.isArray(rawOrders) ? rawOrders : []).filter(Boolean);
      
      const totalUnread = orders.reduce((sum, o) => {
        if (o && o.messages) {
          return sum + o.messages.filter(m => m && m.sender === 'customer' && !m.read).length;
        }
        return sum;
      }, 0);
      setUnreadChatCount(totalUnread);

      let highestTimestamp = lastNotifiedMsgTimeRef.current;
      let shouldPlaySound = false;
      const newToasts = [];

      orders.forEach(order => {
        if (order && order.messages) {
          order.messages.forEach(msg => {
            if (msg && msg.sender === 'customer') {
              if (msg.timestamp > appLoadTimeRef.current && msg.timestamp > lastNotifiedMsgTimeRef.current) {
                shouldPlaySound = true;
                
                let body = msg.text || '';
                if (msg.attachments && msg.attachments.length > 0) {
                  body = body ? `${body} (🖼️ ສົ່ງຮູບພາບ)` : '🖼️ ສົ່ງຮູບພາບ / File Attached';
                }

                newToasts.push({
                  id: `${order.id}-${msg.timestamp}`,
                  title: `💬 ຂໍ້ຄວາມແຊັດໃໝ່ຈາກ: ${msg.senderName || 'ລູກຄ້າ'}`,
                  body: body,
                  orderId: order.id
                });
                
                if (msg.timestamp > highestTimestamp) {
                  highestTimestamp = msg.timestamp;
                }
              }
            }
          });
        }
      });

      if (newToasts.length > 0) {
        setToasts(prev => [...prev, ...newToasts]);
        newToasts.forEach(toast => {
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 6000);
        });
      }

      if (shouldPlaySound) {
        playPremiumNotificationChime();
      }

      if (highestTimestamp !== lastNotifiedMsgTimeRef.current) {
        lastNotifiedMsgTimeRef.current = highestTimestamp;
        try {
          localStorage.setItem('last_notified_msg_time', highestTimestamp);
        } catch (e) {}
      }
    } catch (err) {
      console.error('[App] checkNewChatMessages error:', err);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(checkNewChatMessages);
    window.addEventListener('db-updated', checkNewChatMessages);
    window.addEventListener('storage', checkNewChatMessages);
    // Reduced from 3000ms to 5000ms — saves 40% localStorage reads with imperceptible UX delay
    const interval = setInterval(checkNewChatMessages, 5000);
    
    return () => {
      window.removeEventListener('db-updated', checkNewChatMessages);
      window.removeEventListener('storage', checkNewChatMessages);
      clearInterval(interval);
    };
  }, [checkNewChatMessages]);

  const handleToastClick = (orderId) => {
    setActiveTab('online_orders');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('select-online-chat', { detail: { orderId } }));
    }, 100);
    setToasts(prev => prev.filter(t => !t.id.startsWith(orderId)));
  };
  
  // Expense Logging states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', paymentMethod: 'cash', supplier: '', currency: 'LAK' });
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [expensePrintId, setExpensePrintId] = useState(null);

  useEffect(() => {
    const handleTriggerExpense = () => {
      setShowExpenseModal(true);
    };
    window.addEventListener('trigger-expense-modal', handleTriggerExpense);
    return () => {
      window.removeEventListener('trigger-expense-modal', handleTriggerExpense);
    };
  }, []);

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
      queueMicrotask(() => setTodayAttendance(record || null));
    } else {
      queueMicrotask(() => setTodayAttendance(null));
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

  // Theme helper tools — hexToRgba, darkenColor, lightenColor are now defined
  // outside App component (above) to avoid re-creation on every render

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Strict Authorization: ONLY suthathvs@gmail.com has permission to edit translation texts.
      // Other accounts will return silently with absolutely no popup or alert message.
      const currentUser = db.getActiveUser();
      const isAuthorized = currentUser && currentUser.email && currentUser.email.toLowerCase() === 'suthathvs@gmail.com';
      if (!isAuthorized) return;

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const text = e.target.textContent ? e.target.textContent.trim() : '';
      if (!text) return;

      const activeSettings = db.getSettings();
      const labels = activeSettings.labels || {};
      
      let matchedKey = null;
      let matchedDefault = '';

      const cleanEmoji = (str) => String(str || '').replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();

      // Look up inside renderedLabels map
      const rendered = window.renderedLabels || {};
      for (const key of Object.keys(rendered)) {
        const item = rendered[key];
        const defaultValue = String(item.defaultValue || '').trim();
        const customValue = String(item.currentValue || '').trim();
        
        if (
          text === defaultValue ||
          text === customValue ||
          cleanEmoji(defaultValue) === text ||
          cleanEmoji(customValue) === text
        ) {
          matchedKey = key;
          matchedDefault = item.defaultValue;
          break;
        }
      }

      // Fallback to DEFAULT_LABEL_KEYS list
      if (!matchedKey) {
        for (const item of DEFAULT_LABEL_KEYS) {
          const customValue = labels[item.key];
          const defaultValue = item.defaultValue.trim();
          
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
      }

      if (matchedKey) {
        const currentVal = labels[matchedKey] || matchedDefault;
        const newVal = prompt(`ແກ້ໄຂຂໍ້ຄວາມພາສາລາວສຳລັບ [${matchedKey}]:\n\nຄ່າເກົ່າ: "${currentVal}"\n\nປ້ອນຂໍ້ຄວາມໃໝ່ທີ່ຕ້ອງການສະແດງ:`, currentVal);
        if (newVal !== null) {
          const updatedLabels = { ...labels, [matchedKey]: newVal };
          db.saveLabels(updatedLabels);
          // Clear Service Worker caches so reload gets fresh content from localStorage
          if ('caches' in window) {
            caches.keys().then(names => names.forEach(n => caches.delete(n))).finally(() => {
              window.location.reload(true);
            });
          } else {
            window.location.reload(true);
          }
        }
      }
    };

    window.addEventListener('dblclick', handleGlobalDoubleClick);
    return () => window.removeEventListener('dblclick', handleGlobalDoubleClick);
  }, []);

  function loadSystemConfig() {
    setSettings(db.getSettings());
    checkStockAlerts();
  }

  const checkStockAlerts = () => {
    const products = db.getProducts();
    const hasLow = products.some(p => !db.isServiceCategory(p.category) && p.stock <= p.minStock);
    setLowStockWarning(hasLow);
  };

  function adjustDefaultTabForRole(role) {
    if (role === 'technician') {
      setActiveTab('framing_board');
    } else {
      setActiveTab('pos');
    }
  }

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

  function handleSystemUpdate() {
    loadSystemConfig();
    const current = db.getActiveUser();
    if (current) {
      setActiveUser(current);
    }
  }

  const _handleRedirectToPOSPayment = (itemToPay) => {
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
    return (
      <Suspense fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px', background: '#0e0c0a', color: '#fff' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span>{db.getLabel('auto___ກຳລັງໂຫຼດໜ້າຮ້ານຄ້າອອນລ_fncjhg', `⏳ ກຳລັງໂຫຼດໜ້າຮ້ານຄ້າອອນລາຍ...`)}</span>
        </div>
      }>
        <OnlineShop />
      </Suspense>
    );
  }

  if (trackingJobId) {
    return (
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>⏳ Loading tracking...</div>}>
        <OrderTracking jobId={trackingJobId} onClose={() => setTrackingJobId(null)} />
      </Suspense>
    );
  }

  if (!activeUser) {
    return (
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>⏳ Loading login...</div>}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  const cleanSidebarLabel = (text) => {
    if (!text) return '';
    // Strip leading emojis and optional space
    /* eslint-disable-next-line no-misleading-character-class */
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
            size: auto;
            margin: 0mm !important;
          }
        }
        /* ──── Collapsible Sidebar ──── */
        .app-container {
          display: flex !important;
          flex-direction: row !important;
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-primary);
        }
        .app-sidebar {
          background: linear-gradient(180deg, #080e1c 0%, #060a14 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          transition: width 0.3s var(--ease-smooth);
          z-index: 101;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 4px 0 30px rgba(0,0,0,0.45);
          flex-shrink: 0;
        }
        .sidebar-logo {
          padding: 14px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          min-height: 66px;
          background: rgba(255,255,255,0.02);
        }
        .sidebar-logo .logo-img {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid var(--gold-primary);
          box-shadow: 0 0 10px var(--gold-glow);
          flex-shrink: 0;
          object-fit: cover;
        }
        .sidebar-logo .logo-img-fallback {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(212,175,55,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          border: 1.5px solid var(--gold-primary);
          box-shadow: 0 0 8px var(--gold-glow);
          flex-shrink: 0;
        }
        .sidebar-logo .logo-text { display: flex; flex-direction: column; overflow: hidden; }
        .sidebar-logo .logo-text h1 {
          font-size: 0.82rem;
          color: var(--gold-primary);
          font-weight: 800;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin: 0;
          letter-spacing: 0.2px;
        }
        .sidebar-logo .logo-text p {
          font-size: 0.6rem;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          margin: 0;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 8px;
          flex-grow: 1;
        }
        /* Section group label */
        .sidebar-section-label {
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          padding: 10px 12px 4px;
          white-space: nowrap;
          overflow: hidden;
        }
        .sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 6px 10px;
          flex-shrink: 0;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.83rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
          width: 100%;
          position: relative;
        }
        .sidebar-item:hover {
          background: rgba(212,175,55,0.07);
          color: var(--text-primary);
        }
        .sidebar-item:hover .sidebar-icon svg {
          stroke: var(--gold-primary);
          filter: drop-shadow(0 0 4px rgba(212,175,55,0.4));
        }
        .sidebar-item.active {
          background: linear-gradient(135deg, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.07) 100%);
          color: var(--gold-primary);
          font-weight: 700;
          box-shadow: inset 3px 0 0 var(--gold-primary);
        }
        .sidebar-item.active .sidebar-icon svg {
          stroke: var(--gold-primary);
          filter: drop-shadow(0 0 5px rgba(212,175,55,0.5));
        }
        .sidebar-item.active::after {
          content: '';
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold-primary);
          box-shadow: 0 0 8px rgba(212,175,55,0.7);
        }
        .sidebar-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          transition: filter 0.18s ease;
        }
        .sidebar-icon svg {
          transition: stroke 0.18s ease, filter 0.18s ease;
        }
        .sidebar-label {
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.2s;
          font-size: 0.82rem;
        }
        .sidebar-toggle-btn {
          background: rgba(255,255,255,0.02);
          border: none;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          transition: background 0.2s, color 0.2s;
        }
        .sidebar-toggle-btn:hover {
          background: rgba(212,175,55,0.07);
          color: var(--gold-primary);
        }
        .sidebar-toggle-btn svg {
          transition: transform 0.3s ease;
        }
        .main-layout {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }
        /* ──── Topbar ──── */
        .app-topbar {
          background: linear-gradient(135deg, rgba(8,14,28,0.95) 0%, rgba(6,10,20,0.95) 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          min-height: 62px;
          flex-shrink: 0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          z-index: 100;
          position: sticky;
          top: 0;
        }
        .active-route-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.2px;
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        /* ──── Dashboard content ──── */
        .dashboard-content {
          flex-grow: 1;
          overflow-y: auto !important;
          padding: 20px 22px;
          background-color: var(--bg-main);
          animation: fadeInFast 0.18s ease;
        }
        .no-animations * {
          transition: none !important;
          animation: none !important;
        }
        /* ──── Hamburger (Mobile) ──── */
        .hamburger-menu-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 7px;
          margin-right: 8px;
          line-height: 1;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .hamburger-menu-btn:hover { background: rgba(255,255,255,0.08); }
        .sidebar-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 998;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) {
          .app-sidebar {
            position: fixed !important;
            left: 0 !important; top: 0 !important; bottom: 0 !important;
            width: 260px !important;
            transform: translateX(-100%);
            z-index: 1000 !important;
            transition: transform 0.3s var(--ease-smooth) !important;
          }
          .app-sidebar.mobile-open { transform: translateX(0) !important; }
          .sidebar-toggle-btn { display: none !important; }
          .app-topbar { padding: 0 14px !important; }
          .hamburger-menu-btn { display: block !important; }
          .dashboard-content { padding: 14px !important; }
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ເຂົ້າງານ (Clock In)
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ອອກງານ (Clock Out)
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
          {/* ── ກຸ່ມ 1: ຫຼັກ ── */}
          {hasPermission(activeUser, 'dashboard') && (
            <button type="button" className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_dashboard', 'ພາບລວມ')) : undefined}
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.dashboard /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_dashboard', 'ພາບລວມ'))}</span>}
            </button>
          )}

          {/* ── divider: ຂາຍ ── */}
          {!sidebarCollapsed && <div className="sidebar-section-label">ການຂາຍ</div>}
          {sidebarCollapsed && <div className="sidebar-divider"/>}

          {hasPermission(activeUser, 'pos') && (
            <button type="button" className={`sidebar-item ${activeTab === 'pos' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_pos', 'ຂາຍໜ້າຮ້ານ')) : undefined}
              onClick={() => { setActiveTab('pos'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.pos /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_pos', 'ຂາຍໜ້າຮ້ານ'))}</span>}
            </button>
          )}

          {hasPermission(activeUser, 'framing_board') && (
            <button type="button" className={`sidebar-item ${activeTab === 'framing_board' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_framing', 'ງານອັດກອບ')) : undefined}
              onClick={() => { setActiveTab('framing_board'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.framing /></span>
              {!sidebarCollapsed && (
                <span className="sidebar-label">
                  {cleanSidebarLabel(db.getLabel('tab_framing', 'ງານອັດກອບ'))}
                </span>
              )}
            </button>
          )}

          {(activeUser.role === 'owner' || activeUser.role === 'manager') && (
            <button type="button" className={`sidebar-item ${activeTab === 'online_orders' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_online_orders', 'ອໍເດີ້ອອນລາຍ')) : undefined}
              onClick={() => { setActiveTab('online_orders'); setMobileSidebarOpen(false); }}
              style={{ position: 'relative' }}>
              <span className="sidebar-icon"><Icons.onlineOrders /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_online_orders', 'ອໍເດີ້ອອນລາຍ'))}</span>}
              {unreadChatCount > 0 && (
                <span style={{
                  position: sidebarCollapsed ? 'absolute' : 'relative',
                  top: sidebarCollapsed ? '4px' : 'auto',
                  right: sidebarCollapsed ? '4px' : 'auto',
                  marginLeft: sidebarCollapsed ? '0' : '6px',
                  background: 'var(--alert-red)',
                  color: 'white',
                  borderRadius: '999px',
                  padding: '1px 5px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  boxShadow: '0 0 8px rgba(239,68,68,0.7)',
                  minWidth: 18, textAlign: 'center',
                  animation: 'pulse-gold 1.5s infinite',
                }}>{unreadChatCount}</span>
              )}
            </button>
          )}

          {/* ── divider: ຈັດການ ── */}
          {!sidebarCollapsed && <div className="sidebar-section-label">ຈັດການ</div>}
          {sidebarCollapsed && <div className="sidebar-divider"/>}

          {hasPermission(activeUser, 'inventory') && (
            <button type="button" className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_inventory', 'ສະຕັອກ')) : undefined}
              onClick={() => { setActiveTab('inventory'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.inventory /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_inventory', 'ສະຕັອກ'))}</span>}
            </button>
          )}

          {hasPermission(activeUser, 'customers') && (
            <button type="button" className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_customers', 'ສະມາຊິກ')) : undefined}
              onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.customers /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_customers', 'ສະມາຊິກ'))}</span>}
            </button>
          )}

          {hasPermission(activeUser, 'debts') && (
            <button type="button" className={`sidebar-item ${activeTab === 'debts' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_debts', 'ໜີ້ສິນ')) : undefined}
              onClick={() => { setActiveTab('debts'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.debts /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_debts', 'ໜີ້ສິນ'))}</span>}
            </button>
          )}

          {/* ── divider: ລາຍງານ ── */}
          {!sidebarCollapsed && <div className="sidebar-section-label">ລາຍງານ</div>}
          {sidebarCollapsed && <div className="sidebar-divider"/>}

          {hasPermission(activeUser, 'reports') && (
            <button type="button" className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_reports', 'ລາຍງານ')) : undefined}
              onClick={() => { setActiveTab('reports'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.reports /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_reports', 'ລາຍງານ'))}</span>}
            </button>
          )}

          {hasPermission(activeUser, 'hrm') && (
            <button type="button" className={`sidebar-item ${activeTab === 'hrm' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_hrm', 'ພະນັກງານ')) : undefined}
              onClick={() => { setActiveTab('hrm'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.hrm /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_hrm', 'ພະນັກງານ'))}</span>}
            </button>
          )}

          {/* ── divider: ເຄື່ອງມື ── */}
          {!sidebarCollapsed && <div className="sidebar-section-label">ເຄື່ອງມື</div>}
          {sidebarCollapsed && <div className="sidebar-divider"/>}

          {hasPermission(activeUser, 'ai') && (
            <button type="button" className={`sidebar-item ${activeTab === 'ai' ? 'active' : ''}`}
              data-tooltip={sidebarCollapsed ? cleanSidebarLabel(db.getLabel('tab_ai', 'ລະບົບ AI')) : undefined}
              onClick={() => { setActiveTab('ai'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.ai /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_ai', 'ລະບົບ AI'))}</span>}
            </button>
          )}

          {hasPermission(activeUser, 'settings') && (
            <button type="button" className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}>
              <span className="sidebar-icon"><Icons.settings /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{cleanSidebarLabel(db.getLabel('tab_settings', 'ຕັ້ງຄ່າ'))}</span>}
            </button>
          )}
        </nav>

        <button type="button" className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'ຂະຫຍາຍ' : 'ຫຍໍ້'}>
          {sidebarCollapsed ? <Icons.chevronRight /> : <Icons.chevronLeft />}
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
              title={db.getLabel('auto_ເມນູ__Menu__wthrb5', `ເມນູ (Menu)`)}
            >
              <Icons.menu />
            </button>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.22)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3), 0 0 12px rgba(212, 175, 55, 0.08)',
              whiteSpace: 'nowrap'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(52,152,219,0.4))' }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {(() => {
                const parts = clockStr.includes('•') ? clockStr.split('•') : clockStr.includes('·') ? clockStr.split('·') : clockStr.split('-');
                if (parts.length >= 2) {
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                      <span style={{ color: '#3498db', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', letterSpacing: '0.5px' }}>{parts[0].trim()}</span>
                      <span style={{ color: 'rgba(212, 175, 55, 0.45)', fontWeight: 'bold' }}>•</span>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.78rem', letterSpacing: '0.5px' }}>{parts[1].trim()}</span>
                    </span>
                  );
                }
                return <span style={{ color: 'var(--gold-primary)', fontWeight: 700, fontFamily: 'monospace' }}>{clockStr}</span>;
              })()}
            </div>

            {/* Connection Status Badge */}
            <div 
              title={isOnline ? "ລະບົບອອນລາຍ (System Online)" : "ລະບົບອອຟລາຍ (System Offline)"}
              style={{
                width: 34, height: 34,
                borderRadius: '10px',
                background: isOnline ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: isOnline ? '1.5px solid rgba(34, 197, 94, 0.4)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                color: isOnline ? '#22c55e' : '#ef4444',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: '8px',
                transition: 'all 0.3s',
                flexShrink: 0
              }}
            >
              {isOnline ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'pulse-blue 2s infinite' }}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.83-2.84"/><path d="M1 9a15.72 15.72 0 0 1 2.06-1.57"/><path d="M16.71 5.21A15.86 15.86 0 0 1 22.58 9"/><path d="M8.53 16.11a6 6 0 0 1 5.09-1"/><circle cx="12" cy="20" r="1"/></svg>
              )}
            </div>
          </div>

          <div className="topbar-actions">
            



            {lowStockWarning && activeUser.role === 'owner' && (
              <button
                type="button"
                title="ສະຕັອກໃກ້ໝົດ! (Low Stock Warning)"
                onClick={() => {
                  setActiveTab('inventory');
                  setInventoryFilter('low_stock');
                }}
                style={{
                  width: 34, height: 34,
                  borderRadius: '10px',
                  background: 'rgba(231, 76, 60, 0.08)',
                  border: '1.5px solid var(--alert-red)',
                  color: 'var(--alert-red)',
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                  flexShrink: 0,
                  marginRight: '8px',
                  animation: 'pulse-gold 1.5s infinite'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </button>
            )}

            {/* Online Shop QR Code Button */}
            <button
              type="button"
              title="QR ເບິ່ງສິນຄ້າ (Online Shop QR Code)"
              style={{
                width: 34, height: 34,
                borderRadius: '10px',
                cursor: 'pointer',
                background: 'rgba(52, 152, 219, 0.08)',
                color: '#3498db',
                border: '1.5px solid rgba(52, 152, 219, 0.4)',
                marginRight: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.18s',
                flexShrink: 0
              }}
              onClick={() => setShowOnlineShopQrModal(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><line x1="7" y1="7" x2="7" y2="7.01"/><line x1="17" y1="7" x2="17" y2="7.01"/><line x1="7" y1="17" x2="7" y2="17.01"/><line x1="17" y1="17" x2="17" y2="17.01"/></svg>
            </button>

            {/* Quick-action Expense Logger */}
            {!isMobile && (
              <button
                type="button"
                title="ບັນທຶກລາຍຈ່າຍ (Record Expense)"
                style={{
                  width: 34, height: 34,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: 'rgba(46, 204, 113, 0.08)',
                  color: '#2ecc71',
                  border: '1.5px solid rgba(46, 204, 113, 0.4)',
                  marginRight: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s',
                  flexShrink: 0
                }}
                onClick={() => {
                  setExpenseFormData({ category: 'food', categoryName: 'ຄ່າກັບເຂົ້າ', amount: '', notes: '', currency: 'LAK' });
                  setShowExpenseModal(true);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M6 14h.01M10 14h.01M14 14h.01M18 14h.01"/></svg>
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



            {/* ── User Pill ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: isMobile ? '4px' : '5px 12px 5px 5px',
              borderRadius: 40,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              cursor: 'default',
            }}>
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.08))',
                border: '1.5px solid rgba(212,175,55,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', flexShrink: 0, overflow: 'hidden',
              }}>
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : settings.shopLogo ? (
                  <img src={settings.shopLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  activeUser.role === 'owner' ? '👑' : activeUser.role === 'cashier' ? '💵' : '🛠️'
                )}
              </div>

              {!isMobile && (
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{activeUser.name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.32)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {activeUser.roleName?.split(' ')[0] || (activeUser.role === 'owner' ? 'ເຈົ້າຂອງຮ້ານ' : activeUser.role === 'cashier' ? 'ພະນັກງານຂາຍ' : 'ຊ່າງ')}
                    {todayAttendance && !todayAttendance.clockOut && (
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>
                        · {db.getShiftSales(activeUser.id).toLocaleString()} ₭
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Clock-in / Clock-out */}
              {!isMobile && (
                <div style={{ marginLeft: 2 }}>
                  {!todayAttendance ? (
                    <button type="button"
                      style={{
                        padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800,
                        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                        color: 'white', border: 'none', borderRadius: 8,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                        boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
                      }}
                      onClick={() => { setOpeningCashInput(''); setShowClockInModal(true); }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ເຂົ້າງານ
                    </button>
                  ) : !todayAttendance.clockOut ? (
                    <button type="button"
                      style={{
                        padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800,
                        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                        color: 'white', border: 'none', borderRadius: 8,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                        boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                      }}
                      onClick={handleClockOut}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ອອກງານ
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.62rem', color: '#22c55e', fontWeight: 700 }}>✓ ເຄີຍແລ້ວ</span>
                  )}
                </div>
              )}

              {/* Logout */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={handleLogout}
                  title={db.getLabel('auto_ອອກຈາກລະບົບ_9t08zc', 'ອອກຈາກລະບົບ')}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: 'rgba(239,68,68,0.7)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s', flexShrink: 0,
                    marginLeft: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            /* ── Shift Locked Premium Screen ── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', minHeight: '75vh', padding: '32px 24px',
              textAlign: 'center', gap: 0, position: 'relative', overflow: 'hidden',
            }}>
              {/* ambient orb */}
              <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents: 'none' }}/>

              {/* lock icon ring */}
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))', border: '1.5px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 40px rgba(212,175,55,0.12)', animation: 'pulse-gold 3s ease-in-out infinite' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>

              <h2 style={{ color: 'white', margin: '0 0 10px', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
                ລໍຖ້າໃຊ້ງານ — ຕ້ອງເຂົ້າງານກ່ອນ
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.38)', maxWidth: 440, margin: '0 0 32px', fontSize: '0.86rem', lineHeight: 1.65 }}>
                ທ່ານ <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{activeUser?.name}</strong> ຍັງບໍ່ໄດ້ເຂົ້າງານ.
                ກ່ອນໃຊ້ລະບົບ, ກະລຸນາ Clock-In ເພື່ອເປີດກະ ແລະ ຕິດຕາມລາຍຮັບ.
              </p>

              {/* 3 info pills */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { icon: <Icons.pos style={{ width: 16, height: 16, color: 'var(--gold-primary)' }} />, label: 'ລາຍຮັບ', desc: 'ຕິດຕາມກະ' },
                  { icon: <Icons.reports style={{ width: 16, height: 16, color: '#3498db' }} />, label: 'ລາຍງານ', desc: 'ສະຫຼຸບທ້າຍກະ' },
                  { icon: <Icons.settings style={{ width: 16, height: 16, color: '#e74c3c' }} />, label: 'ຄວາມປອດໄພ', desc: 'ຄຸ້ມຄອງ Access' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.78rem',
                  }}>
                    <span>{item.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: 'white' }}>{item.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                style={{
                  padding: '14px 36px', fontSize: '0.96rem', fontWeight: 800,
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', border: 'none', borderRadius: 16, cursor: 'pointer',
                  boxShadow: '0 8px 28px rgba(34,197,94,0.4), 0 1px 0 rgba(255,255,255,0.15) inset',
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  transition: 'all 0.2s', letterSpacing: '0.1px',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(34,197,94,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(34,197,94,0.4)'; }}
                onClick={() => { setOpeningCashInput(''); setShowClockInModal(true); }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginRight: 2 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ເຂົ້າງານດຽວນີ້ (Clock In)
              </button>

              <p style={{ marginTop: 18, fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                ກົດ <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 6px' }}>ເຂົ້າງານ</kbd> ໃນ Topbar ດ້ານເທິງ ຫຼື ກົດປຸ່ມນີ້
              </p>
            </div>
          ) : (
            <Suspense fallback={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
                {/* Premium skeleton loader */}
                <div style={{ position: 'relative', width: 54, height: 54 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--gold-primary)', animation: 'spin 0.9s linear infinite' }}/>
                  <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.04)', borderTopColor: 'rgba(212,175,55,0.35)', animation: 'spin 1.4s linear infinite reverse' }}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 160, height: 10, borderRadius: 6, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
                  <div style={{ width: 110, height: 8, borderRadius: 5, background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite 0.3s' }}/>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            }>
              <>
              {activeTab === 'dashboard' && hasPermission(activeUser, 'dashboard') && (
                <Dashboard activeUser={activeUser} onTabChange={setActiveTab} isMobile={isMobile} />
              )}

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

              {activeTab === 'framing_board' && hasPermission(activeUser, 'framing_board') && (
                <POS
                  key={`framing-${activeUser.id}`}
                  activeUser={activeUser}
                  onUpdate={handleSystemUpdate}
                  redirectedCartItem={redirectedCartItem}
                  clearRedirectedCartItem={() => setRedirectedCartItem(null)}
                  onTabChange={setActiveTab}
                  onTrackJob={setTrackingJobId}
                  isMobile={isMobile}
                  initialViewMode="framing"
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
                <Reports activeUser={activeUser} isMobile={isMobile} onTabChange={setActiveTab} onViewLowStock={handleViewLowStock} />
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
            </Suspense>
          )}
        </main>
      </div>

      {/* Expense Logging Modal Overlay */}
      {showExpenseModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '680px', padding: '28px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.15rem' }}>{db.getLabel('auto____ບັນທຶກລາຍຈ່າຍ__Record__5ndejm', `💸 ບັນທຶກລາຍຈ່າຍ (Record Expense)`)}</h3>
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
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ບໍ່ມີລາຍຈ່າຍ_kbp5aq', `ບໍ່ມີລາຍຈ່າຍ`)}</div>
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
                const newEx = db.addExpense({
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

                if (newEx) {
                  setExpensePrintId(newEx.id);
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
                  }, 150);
                }
              }}>
                {/* Row 1: Category & Supplier */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ປະເພດລາຍຈ່າຍ___vgiym7', `📂 ປະເພດລາຍຈ່າຍ *`)}</label>
                    <input
                      type="text"
                      list="expense-categories-datalist"
                      required
                      placeholder={db.getLabel('auto_ເລືອກ_ຫຼື_ປ້ອນປະເພດ____sqs91', `ເລືອກ ຫຼື ປ້ອນປະເພດ...`)}
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ຜູ້ສະໜອງ___ຮ້ານ_jyccsr', `🏢 ຜູ້ສະໜອງ / ຮ້ານ`)}</label>
                    <input
                      type="text"
                      placeholder={db.getLabel('auto_ຊື່ຮ້ານ_ຜູ້ສະໜອງ__ຖ້າມີ__dq7klw', `ຊື່ຮ້ານ/ຜູ້ສະໜອງ (ຖ້າມີ)`)}
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ຈຳນວນເງິນ___v3pxx3', `💰 ຈຳນວນເງິນ *`)}</label>
                    <input
                      type="number"
                      required
                      placeholder={db.getLabel('auto_ຈຳນວນເງິນ____dac86a', `ຈຳນວນເງິນ...`)}
                      className="form-control"
                      style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontSize: '1rem', fontWeight: 'bold' }}
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ສະກຸນເງິນ___9aqgzu', `💵 ສະກຸນເງິນ *`)}</label>
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ວິທີຊຳລະ___pxh5d9', `💳 ວິທີຊຳລະ *`)}</label>
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
                      >{db.getLabel('auto____ສົດ_acni3f', `💵 ສົດ`)}</button>
                      <button
                        type="button"
                        onClick={() => setExpenseFormData({ ...expenseFormData, paymentMethod: 'transfer' })}
                        style={{
                          flex: 1, padding: '10px 4px', borderRadius: '8px', border: expenseFormData.paymentMethod === 'transfer' ? '2px solid #3498db' : '1px solid var(--border-color)',
                          background: expenseFormData.paymentMethod === 'transfer' ? 'rgba(52,152,219,0.15)' : '#221e1a',
                          color: expenseFormData.paymentMethod === 'transfer' ? '#3498db' : 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                      >{db.getLabel('auto____ໂອນ_b9nn5u', `📱 ໂອນ`)}</button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Notes */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto____ຄຳອະທິບາຍ___ໝາຍເຫດ_rrmun8', `📝 ຄຳອະທິບາຍ / ໝາຍເຫດ`)}</label>
                  <textarea
                    className="form-control"
                    placeholder={db.getLabel('auto_ລະບຸລາຍລະອຽດ_____ຕົວຢ່າງ__2nzs5h', `ລະບຸລາຍລະອຽດ... (ຕົວຢ່າງ: ຊື້ອາໄຫຼ່ XX 5 ອັນ)`)}
                    style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', minHeight: '70px', resize: 'vertical' }}
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>{db.getLabel('auto_ຍົກເລີກ_m404cc', `ຍົກເລີກ`)}</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 28px', fontSize: '0.95rem' }}>{db.getLabel('auto____ບັນທຶກລາຍຈ່າຍ_o0nvo', `💾 ບັນທຶກລາຍຈ່າຍ`)}</button>
                </div>
              </form>
            )}

            {/* Hidden print template */}
            {expensePrintId && (() => {
              const ex = (db.getExpenses() || []).find(e => e.id === expensePrintId);
              if (!ex) return null;
              return (
                <div id="expense-receipt-print" style={{ display: 'none' }}>
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                    <div style={{ fontSize: '12px' }}>{settings.shopSubtitle}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px' }}>{db.getLabel('auto_ໃບບິນລາຍຈ່າຍ___Expense_Re_llbioi', `ໃບບິນລາຍຈ່າຍ / Expense Receipt`)}</div>
                  </div>
                  <div className="dashed"></div>
                  <table>
                    <tbody>
                      <tr><td><b>{db.getLabel('auto_ເລກທີ__6mfy8', `ເລກທີ:`)}</b></td><td style={{ textAlign: 'right' }}>{ex.id}</td></tr>
                      <tr><td><b>{db.getLabel('auto_ວັນທີ__bgh93n', `ວັນທີ:`)}</b></td><td style={{ textAlign: 'right' }}>{new Date(ex.date).toLocaleString('lo-LA')}</td></tr>
                      <tr><td><b>{db.getLabel('auto_ປະເພດ__h4vhjb', `ປະເພດ:`)}</b></td><td style={{ textAlign: 'right' }}>{ex.categoryName || ex.category}</td></tr>
                      {ex.supplier && <tr><td><b>{db.getLabel('auto_ຜູ້ສະໜອງ__wp5lme', `ຜູ້ສະໜອງ:`)}</b></td><td style={{ textAlign: 'right' }}>{ex.supplier}</td></tr>}
                      <tr><td><b>{db.getLabel('auto_ວິທີຊຳລະ__x0czj9', `ວິທີຊຳລະ:`)}</b></td><td style={{ textAlign: 'right' }}>{ex.paymentMethod === 'transfer' ? 'ໂອນທະນາຄານ' : 'ເງິນສົດ'}</td></tr>
                    </tbody>
                  </table>
                  <div className="dashed"></div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                    ມູນຄ່າ: {(ex.amount || 0).toLocaleString()} {ex.currency || 'LAK'}
                    {ex.currency && ex.currency !== 'LAK' && ` (≈ ${ex.convertedAmount?.toLocaleString()} ₭)`}
                  </div>
                  <div className="dashed"></div>
                  {ex.notes && <div><b>{db.getLabel('auto_ໝາຍເຫດ__bj4oax', `ໝາຍເຫດ:`)}</b> {ex.notes}</div>}
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>{db.getLabel('auto_ຜູ້ບັນທຶກ__32urrm', `ຜູ້ບັນທຶກ:`)} {ex.createdByName || 'N/A'}</div>
                </div>
              );
            })()}
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
              <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {db.getLabel('pos_drawer_open_title', 'ເປີດກະລິ້ນຊັກ / ເຂົ້າງານ')}
              </h3>
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {db.getLabel('pos_confirm_clock_in', 'ຢືນຢັນເຂົ້າງານ')}
                  </span>
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
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('auto_____ໃບບິນສະຫຼຸບກະ__Shift__yz2mwr', `🖨️ ໃບບິນສະຫຼຸບກະ (Shift Report)`)}</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowShiftReportModal(false)}>✕</button>
            </div>
            
            {/* Printable Area */}
            <div id="print-shift-report" style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.4' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                {settings.shopLogo && <img src={settings.shopLogo} alt="Logo" style={{ maxHeight: '40px', marginBottom: '6px' }} />}
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                <div style={{ fontSize: '12px' }}>{settings.shopSubtitle}</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px' }}>{db.getLabel('auto_ໃບສະຫຼຸບຍອດປິດກະ__Shift_R_92ahh3', `ໃບສະຫຼຸບຍອດປິດກະ (Shift Report)`)}</div>
              </div>
              
              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div><b>{db.getLabel('auto_ພະນັກງານ__5ytakj', `ພະນັກງານ:`)}</b> {shiftReportData.cashierName}</div>
                <div><b>{db.getLabel('auto_ເວລາເຂົ້າງານ__uw7u0q', `ເວລາເຂົ້າງານ:`)}</b> {new Date(shiftReportData.clockIn).toLocaleString('lo-LA')}</div>
                <div><b>{db.getLabel('auto_ເວລາອອກງານ__rty413', `ເວລາອອກງານ:`)}</b> {shiftReportData.clockOut ? new Date(shiftReportData.clockOut).toLocaleString('lo-LA') : 'ຍັງບໍ່ທັນອອກກະ'}</div>
              </div>

              {shiftReportData.soldProducts && shiftReportData.soldProducts.length > 0 && (
                <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{db.getLabel('auto_ລາຍການສິນຄ້າທີ່ຂາຍໄດ້__Pr_s8a2iv', `ລາຍການສິນຄ້າທີ່ຂາຍໄດ້ (Products Sold):`)}</div>
                  {shiftReportData.soldProducts.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '12px' }}>
                      <span>- {p.name}:</span>
                      <b>{p.qty} {db.getLabel('auto_ອັນ_27yph', `ອັນ`)}</b>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>{db.getLabel('auto_ຈຳນວນບິນຂາຍ__qazbz8', `ຈຳນວນບິນຂາຍ:`)}</span>
                  <span>{shiftReportData.ordersCount} {db.getLabel('auto_ບິນ_27kov', `ບິນ`)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                  <span>{db.getLabel('auto_ຍອດຂາຍລວມ__LAK___17i9vb', `ຍອດຂາຍລວມ (LAK):`)}</span>
                  <span>{(shiftReportData.totalSalesLak || 0).toLocaleString()} ₭</span>
                </div>
              </div>

              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{db.getLabel('auto_ແຍກຕາມການຊຳລະ__nq8x59', `ແຍກຕາມການຊຳລະ:`)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                  <span>{db.getLabel('auto___ເງິນທອນເລີ່ມຕົ້ນ__Openi_7melox', `- ເງິນທອນເລີ່ມຕົ້ນ (Opening Cash):`)}</span>
                  <span>{(shiftReportData.openingCash || 0).toLocaleString()} ₭</span>
                </div>
                
                {/* Cash portion */}
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>{db.getLabel('auto____ລວມຮັບເງິນສົດ__Cash___yuudel', `💵 ລວມຮັບເງິນສົດ (Cash):`)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>{db.getLabel('auto___ເງິນສົດ_LAK__ssxtmd', `• ເງິນສົດ LAK:`)}</span>
                  <span>{(shiftReportData.totalCashLak || 0).toLocaleString()} ₭</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>{db.getLabel('auto___ເງິນສົດ_THB__ssskr1', `• ເງິນສົດ THB:`)}</span>
                  <span>{(shiftReportData.totalCashThb || 0).toLocaleString()} ฿</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>{db.getLabel('auto___ເງິນສົດ_USD__ssrpk5', `• ເງິນສົດ USD:`)}</span>
                  <span>${(shiftReportData.totalCashUsd || 0).toLocaleString()}</span>
                </div>

                {/* Transfer portion */}
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>{db.getLabel('auto____ລວມຮັບເງິນໂອນ__Transfe_cfdyiq', `📱 ລວມຮັບເງິນໂອນ (Transfer):`)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>{db.getLabel('auto___ເງິນໂອນ_LAK__xn1cu8', `• ເງິນໂອນ LAK:`)}</span>
                  <span>{(shiftReportData.totalTransferLak || 0).toLocaleString()} ₭</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>{db.getLabel('auto___ເງິນໂອນ_THB__xn6lpk', `• ເງິນໂອນ THB:`)}</span>
                  <span>{(shiftReportData.totalTransferThb || 0).toLocaleString()} ฿</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>{db.getLabel('auto___ເງິນໂອນ_USD__xn7gwg', `• ເງິນໂອນ USD:`)}</span>
                  <span>${(shiftReportData.totalTransferUsd || 0).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', color: '#c0392b', marginTop: '4px' }}>
                  <span>{db.getLabel('auto___ຍອດຕິດໜີ້__Debts___tbi26r', `- ຍອດຕິດໜີ້ (Debts):`)}</span>
                  <span>{(shiftReportData.totalDebtLak || 0).toLocaleString()} ₭</span>
                </div>
              </div>

              <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b' }}>
                  <span>{db.getLabel('auto_ລາຍຈ່າຍໃນກະ__Expenses___di2zv8', `ລາຍຈ່າຍໃນກະ (Expenses):`)}</span>
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
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{db.getLabel('auto_ການຄິດໄລ່ເງິນສົດໃນລິ້ນຊັກ_cihwoq', `ການຄິດໄລ່ເງິນສົດໃນລິ້ນຊັກ (LAK):`)}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  ເງິນທອນເລີ່ມຕົ້ນ + ເງິນສົດ LAK + (ເງິນສົດ THB * {settings.exchangeRateThb || 750}) - ລາຍຈ່າຍ LAK
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '6px', borderTop: '1px solid #ccc', paddingTop: '4px' }}>
                  <span>{db.getLabel('auto_ຍອດເງິນສົດທີ່ຕ້ອງມີ__uy0kk1', `ຍອດເງິນສົດທີ່ຕ້ອງມີ:`)}</span>
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
                  <div style={{ marginTop: '4px' }}>{db.getLabel('auto_ພະນັກງານລາຍງານ_45tpqd', `ພະນັກງານລາຍງານ`)}</div>
                </div>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
                  <div style={{ marginTop: '4px' }}>{db.getLabel('auto_ເຈົ້າຂອງຮ້ານກວດສອບ_etdcph', `ເຈົ້າຂອງຮ້ານກວດສອບ`)}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowShiftReportModal(false)}>{db.getLabel('auto_ປິດ_27lff', `ປິດ`)}</button>
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
      

      {/* Toast Notifications Container */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '350px',
          width: '100%'
        }}
      >
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="glass-card animate-slide-in"
            style={{
              padding: '16px',
              borderLeft: '4px solid var(--gold-primary)',
              boxShadow: 'var(--shadow-premium)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(22, 20, 17, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
            onClick={() => handleToastClick(toast.orderId)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--gold-primary)' }}>{toast.title}</strong>
              <button 
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 0,
                  marginLeft: '8px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
              >✕</button>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'white', lineHeight: '1.4' }}>
              {toast.body}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', textAlign: 'right' }}>
              ຄລິກເພື່ອເບິ່ງຂໍ້ຄວາມ 💬
            </div>
            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: 'var(--gold-primary)',
                width: '100%',
                animation: 'toast-progress 6s linear forwards'
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Command Palette ── */}
      {showCommandPalette && activeUser && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '15vh',
          }}
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, #0d1424 0%, #080e1c 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 18,
              width: '100%',
              maxWidth: 560,
              margin: '0 16px',
              boxShadow: '0 32px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: '1rem', opacity: 0.5 }}>🔍</span>
              <input
                autoFocus
                type="text"
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                placeholder="ຄົ້ນຫາໜ້າ, ຟັງຊັ່ນ... (Search pages, features...)"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'white', fontSize: '0.95rem', fontFamily: 'inherit',
                }}
              />
              <kbd style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '2px 7px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)',
              }}>ESC</kbd>
            </div>
            {/* Quick Nav Items */}
            <div style={{ padding: '8px 0', maxHeight: 380, overflowY: 'auto' }}>
              {[
                { icon: <Icons.dashboard style={{ width: 16, height: 16 }} />, label: 'ພາບລວມ (Dashboard)', tab: 'dashboard', role: 'all' },
                { icon: <Icons.pos style={{ width: 16, height: 16 }} />, label: 'ຂາຍໜ້າຮ້ານ (POS)', tab: 'pos', role: 'all' },
                { icon: <Icons.framing style={{ width: 16, height: 16 }} />, label: 'ງານອັດກອບ (Framing)', tab: 'framing_board', role: 'all' },
                { icon: <Icons.onlineOrders style={{ width: 16, height: 16 }} />, label: 'ອໍເດີ້ອອນລາຢ (Online Orders)', tab: 'online_orders', role: 'owner' },
                { icon: <Icons.inventory style={{ width: 16, height: 16 }} />, label: 'ສະຕັອກ (Inventory)', tab: 'inventory', role: 'owner' },
                { icon: <Icons.customers style={{ width: 16, height: 16 }} />, label: 'ສະມາຊິກ (Members)', tab: 'customers', role: 'all' },
                { icon: <Icons.debts style={{ width: 16, height: 16 }} />, label: 'ໜີ້ສິນ (Debts)', tab: 'debts', role: 'owner' },
                { icon: <Icons.reports style={{ width: 16, height: 16 }} />, label: 'ລາຍງານ (Reports)', tab: 'reports', role: 'owner' },
                { icon: <Icons.hrm style={{ width: 16, height: 16 }} />, label: 'ພະນັກງານ (HRM)', tab: 'hrm', role: 'owner' },
                { icon: <Icons.ai style={{ width: 16, height: 16 }} />, label: 'ລະບົບ AI', tab: 'ai', role: 'owner' },
                { icon: <Icons.settings style={{ width: 16, height: 16 }} />, label: 'ຕັ້ງຄ່າ (Settings)', tab: 'settings', role: 'owner' },
              ]
                .filter(item => {
                  const q = commandQuery.toLowerCase();
                  return item.label.toLowerCase().includes(q) || item.tab.includes(q);
                })
                .map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setActiveTab(item.tab); setShowCommandPalette(false); setMobileSidebarOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 18px', background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
                      fontSize: '0.88rem', fontFamily: 'inherit', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>↵</span>
                  </button>
                ))
              }
            </div>
            {/* Footer hint */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)' }}>
              <span><kbd style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px', border: '1px solid rgba(255,255,255,0.12)' }}>Ctrl</kbd> + <kbd style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px', border: '1px solid rgba(255,255,255,0.12)' }}>K</kbd> ເປີດ/ປິດ</span>
              <span><kbd style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px', border: '1px solid rgba(255,255,255,0.12)' }}>ESC</kbd> ປິດ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
