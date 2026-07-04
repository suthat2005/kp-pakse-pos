import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../utils/db';
import FramingBoard from './FramingBoard';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import Portal from './Portal';

const accountConfig = {
  LAK: { mid: 'mch64f01defcb310', code: '418' },
  THB: { mid: 'mch64f01defcb310', code: '764' },
  USD: { mid: 'mch64f01defcb310', code: '840' }
};

const getQrSizePx = (size) => {
  if (size === 'small') return '70px';
  if (size === 'medium') return '100px';
  if (size === 'large') return '150px';
  if (size === 'xlarge') return '200px';
  if (size && size.endsWith('px')) return size;
  return '100px';
};

export default function POS({ 
  activeUser, 
  onUpdate, 
  redirectedCartItem, 
  clearRedirectedCartItem,
  initialViewMode,
  onTabChange,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
  selectedSlotId: propSelectedSlotId,
  setSelectedSlotId: propSetSelectedSlotId,
  onTrackJob
}) {
  const [localViewMode, setLocalViewMode] = useState(initialViewMode || (activeUser.role === 'technician' ? 'framing' : 'slots'));
  const viewMode = propViewMode !== undefined ? propViewMode : localViewMode;
  const setViewMode = propSetViewMode !== undefined ? propSetViewMode : setLocalViewMode;

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode, setViewMode]);
  const [mobileTab, setMobileTab] = useState('products'); // 'products' or 'cart' for mobile responsive view toggling
  
  const [slots, setSlots] = useState({});
  const [localSelectedSlotId, setLocalSelectedSlotId] = useState('Walk-In');
  const selectedSlotId = propSelectedSlotId !== undefined ? propSelectedSlotId : localSelectedSlotId;
  const setSelectedSlotId = propSetSelectedSlotId !== undefined ? propSetSelectedSlotId : setLocalSelectedSlotId;
  
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [settings, setSettings] = useState({
    shopName: '',
    shopSubtitle: '',
    shopPhone: '',
    shopAddress: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankQrTemplate: '',
    receiptLogoUrl: '',
    receiptHeaderNote: '',
    receiptFooterNote: '',
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
    receiptDividerThickness: '1px'
  });
  const [checkoutQrUrl, setCheckoutQrUrl] = useState('');
  const [receiptQrUrl, setReceiptQrUrl] = useState('');
  const [depositQrUrl, setDepositQrUrl] = useState('');
  
  // Product Search / Filter (Always visible in left panel of 'menu' mode)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [framingJobs, setFramingJobs] = useState([]);
  const [showFramingAddModal, setShowFramingAddModal] = useState(false);
  const [showFramingEditModal, setShowFramingEditModal] = useState(false);
  const [showFramingPrintModal, setShowFramingPrintModal] = useState(false);
  const [currentFramingJob, setCurrentFramingJob] = useState(null);
  const [framingError, setFramingError] = useState('');
  const [framingFormData, setFramingFormData] = useState({
    customerName: '',
    customerPhone: '',
    amuletDescription: '',
    frameTypeId: 'S001',
    totalPrice: '',
    deposit: '',
    notes: '',
    pickupDate: '',
    status: 'pending',
    amuletImage: '',
    slotId: 'Walk-In'
  });

  // Quantity Dialog Modal (Image 3)
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qtyTargetProd, setQtyTargetProd] = useState(null);
  const [inputQty, setInputQty] = useState(1);
  const [initialQtyBeforeModal, setInitialQtyBeforeModal] = useState(0);

  // Admin PIN Dialog for Deletions (anti-fraud)
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(-1);
  const [pinError, setPinError] = useState('');

  // Rename Slot Modal (แก้ไขชื่อคิว)
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameSlotTarget, setRenameSlotTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameCustomerName, setRenameCustomerName] = useState('');
  const [renameCustomerPhone, setRenameCustomerPhone] = useState('');

  // Add Slot Modal (ເພີ່ມບັດຄິວ)
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotId, setNewSlotId] = useState('');
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [addSlotError, setAddSlotError] = useState('');

  // Service configuration modal states
  const [showServiceConfigModal, setShowServiceConfigModal] = useState(false);
  const [serviceConfigProduct, setServiceConfigProduct] = useState(null);
  const [serviceConfigQty, setServiceConfigQty] = useState(1);
  const [serviceConfigAmulets, setServiceConfigAmulets] = useState([]);
  const [serviceConfigDeposit, setServiceConfigDeposit] = useState('0');

  // Slot customer details prompt modal before entering menu
  const [showSlotEntryModal, setShowSlotEntryModal] = useState(false);
  const [slotEntryTarget, setSlotEntryTarget] = useState(null);
  const [slotEntryName, setSlotEntryName] = useState('');
  const [slotEntryPhone, setSlotEntryPhone] = useState('');

  // Discount Modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountAmountInput, setDiscountAmountInput] = useState('');
  const [discountTypeInput, setDiscountTypeInput] = useState('percent');
  const [discountError, setDiscountError] = useState('');

  // Debt Slot Selection Popup
  const [showDebtActionModal, setShowDebtActionModal] = useState(false);
  const [debtActionTargetSlot, setDebtActionTargetSlot] = useState(null);

  // Checkout & Debt registration modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payCurrency, setPayCurrency] = useState('LAK');
  const [cashReceived, setCashReceived] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [bankTxRef, setBankTxRef] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutAmountPaid, setCheckoutAmountPaid] = useState('');
  const [showDepositInputModal, setShowDepositInputModal] = useState(false);
  const [checkoutIsDepositMode, setCheckoutIsDepositMode] = useState(false);
  const [depositInputVal, setDepositInputVal] = useState('');
  const [depositPayMethod, setDepositPayMethod] = useState('cash');
  const [depositPayCurrency, setDepositPayCurrency] = useState('LAK');
  const [depositCashReceived, setDepositCashReceived] = useState('');
  const [depositBankTxRef, setDepositBankTxRef] = useState('');
  const [depositTransferAmount, setDepositTransferAmount] = useState('');
  // QR that updates with transferAmount (not grandTotal)
  const [checkoutTransferQrUrl, setCheckoutTransferQrUrl] = useState('');
  const [depositModalQrUrl, setDepositModalQrUrl] = useState('');
  
  // BCEL One QR status states
  const [bcelPaymentStatus, setBcelPaymentStatus] = useState('waiting'); // 'waiting' | 'success'
  
  // Debt Client Fields
  const [debtCustomerName, setDebtCustomerName] = useState('');
  const [debtCustomerPhone, setDebtCustomerPhone] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Receipt & Work Order States
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [trackingQrUrl, setTrackingQrUrl] = useState('');
  const [serverIp, setServerIp] = useState('127.0.0.1');

  useEffect(() => {
    fetch('/api/server-ip')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip) {
          setServerIp(data.ip);
        }
      })
      .catch(err => console.error('Error fetching server IP:', err));
  }, []);

  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [currentWorkOrder, setCurrentWorkOrder] = useState(null);

  // Search & Membership Autocomplete States
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [customerMembers, setCustomerMembers] = useState([]);
  const [renameCustomerId, setRenameCustomerId] = useState('');
  const [renameDiscountType, setRenameDiscountType] = useState('percent');
  const [renameDiscountPercent, setRenameDiscountPercent] = useState(0);
  const [renameDiscountAmount, setRenameDiscountAmount] = useState(0);
  const [memberSearchVal, setMemberSearchVal] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [isRegisteringMember, setIsRegisteringMember] = useState(false);
  const [newMemberDiscountType, setNewMemberDiscountType] = useState('percent');
  const [newMemberDiscountValue, setNewMemberDiscountValue] = useState('');
  const [newMemberTier, setNewMemberTier] = useState('Regular');

  // Slot Entry Modal Membership Autocomplete States
  const [entryMemberSearchVal, setEntryMemberSearchVal] = useState('');
  const [showEntryMemberDropdown, setShowEntryMemberDropdown] = useState(false);
  const [entryCustomerId, setEntryCustomerId] = useState('');
  const [entryDiscountType, setEntryDiscountType] = useState('percent');
  const [entryDiscountPercent, setEntryDiscountPercent] = useState(0);
  const [entryDiscountAmount, setEntryDiscountAmount] = useState(0);
  const [entryIsRegistering, setEntryIsRegistering] = useState(false);
  const [entryNewDiscountType, setEntryNewDiscountType] = useState('percent');
  const [entryNewDiscountValue, setEntryNewDiscountValue] = useState('');
  const [entryNewTier, setEntryNewTier] = useState('Regular');

  // Sound effects mock (Fixing native web audio node assignment error)
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
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'cash') {
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15); // Corrected property setter!
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  useEffect(() => {
    setProducts(db.getProducts());
    setPromotions(db.getPromotions());
    setSettings(db.getSettings());
    setSlots(db.getSlots());
    setCategories(db.getCategories());
    setFramingJobs(db.getFramingJobs());
    setCustomerMembers(db.getCustomers());
  }, [showReceipt, showCheckout, showWorkOrder, showDebtModal, showRenameModal, viewMode, showFramingAddModal, showFramingEditModal, showFramingPrintModal]);

  useEffect(() => {
    const handleSyncUpdate = () => {
      setSlots(db.getSlots());
      setProducts(db.getProducts());
      setFramingJobs(db.getFramingJobs());
      setCategories(db.getCategories());
      setSettings(db.getSettings());
      setPromotions(db.getPromotions());
      setCustomerMembers(db.getCustomers());
    };
    window.addEventListener('storage', handleSyncUpdate);
    window.addEventListener('db-updated', handleSyncUpdate);
    return () => {
      window.removeEventListener('storage', handleSyncUpdate);
      window.removeEventListener('db-updated', handleSyncUpdate);
    };
  }, []);

  // Handle bridged payments from framing board
  useEffect(() => {
    if (redirectedCartItem) {
      const updatedSlots = { ...slots };
      if (updatedSlots[selectedSlotId]) {
        const existingIdx = updatedSlots[selectedSlotId].items.findIndex(item => item.productId === redirectedCartItem.id);
        if (existingIdx !== -1) {
          updatedSlots[selectedSlotId].items[existingIdx].price = redirectedCartItem.balance;
          updatedSlots[selectedSlotId].items[existingIdx].total = redirectedCartItem.balance;
        } else {
        const serviceCat = db.getCategories().find(c => c.type === 'service') || { id: 'services' };
        const serviceName = redirectedCartItem.frameTypeName || 'ບໍລິການອັດກອບພຣະ';
        updatedSlots[selectedSlotId].items.push({
          productId: redirectedCartItem.id,
          name: serviceName,
          price: redirectedCartItem.balance,
          qty: 1,
          total: redirectedCartItem.balance,
          category: serviceCat.id
        });
        }
        
        // Copy amulet image to slot metadata
        if (redirectedCartItem.amuletImage) {
          updatedSlots[selectedSlotId].amuletImage = redirectedCartItem.amuletImage;
        }

        db.saveSlots(updatedSlots);
        setSlots(updatedSlots);
        
        // Open POS workspace menu directly
        setViewMode('menu');
        
        // Auto open checkout modal
        setCashReceived('');
        setPaymentMethod('cash');
        setShowCheckout(true);
      }
      clearRedirectedCartItem();
    }
  }, [redirectedCartItem, slots]);

  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const scannerLogRef = useRef([]);

  // WebUSB / WebSerial references for physical Cash Drawer trigger
  const usbDeviceRef = useRef(null);
  const serialPortRef = useRef(null);

  useEffect(() => {
    const autoConnectDevices = async () => {
      try {
        if ('usb' in navigator) {
          const devices = await navigator.usb.getDevices();
          if (devices.length > 0) {
            usbDeviceRef.current = devices[0];
            console.log('Auto-connected USB Printer for cash drawer:', devices[0].productName);
          }
        }
        if ('serial' in navigator) {
          const ports = await navigator.serial.getPorts();
          if (ports.length > 0) {
            serialPortRef.current = ports[0];
            console.log('Auto-connected Serial Port for cash drawer');
          }
        }
      } catch (err) {
        console.error('Auto-connect devices failed:', err);
      }
    };
    autoConnectDevices();
  }, []);

  const updateCartQty = (product, targetQty) => {
    if (!selectedSlotId) return false;
    const updatedSlots = { ...slots };
    const items = [...(updatedSlots[selectedSlotId]?.items || [])];
    const existingIdx = items.findIndex(item => item.productId === product.id);

    if (targetQty <= 0) {
      if (existingIdx !== -1) {
        items.splice(existingIdx, 1);
      }
    } else {
      if (!db.isServiceCategory(product.category) && targetQty > product.stock) {
        alert('ຂໍອະໄພ: ສິນຄ້າໃນສະຕັອກບໍ່ພໍ!');
        return false;
      }
      if (existingIdx !== -1) {
        items[existingIdx].qty = targetQty;
        items[existingIdx].total = targetQty * product.price;
      } else {
        items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          qty: targetQty,
          total: targetQty * product.price,
          category: product.category
        });
      }
    }

    updatedSlots[selectedSlotId].items = items;
    db.saveSlots(updatedSlots);
    setSlots(updatedSlots);
    if (onUpdate) onUpdate();
    return true;
  };

  const handleModalQtyChange = (newQty) => {
    const qtyVal = parseInt(newQty) || 0;
    if (qtyTargetProd && !db.isServiceCategory(qtyTargetProd.category)) {
      if (qtyVal > qtyTargetProd.stock) {
        alert(db.getLabel('stock_limit_alert', 'ບໍ່ສາມາດຂາຍເກີນຈຳນວນໃນສາງໄດ້! ສິນຄ້ານີ້ເຫຼືອພຽງ') + ' ' + qtyTargetProd.stock);
        setInputQty(qtyTargetProd.stock);
        updateCartQty(qtyTargetProd, qtyTargetProd.stock);
        return;
      }
    }
    setInputQty(newQty);
    if (qtyVal >= 1 && qtyTargetProd) {
      updateCartQty(qtyTargetProd, qtyVal);
    }
  };

  const handleBarcodeScanned = (product) => {
    if (!selectedSlotId) return;

    if (product.stock <= 0 && !db.isServiceCategory(product.category)) {
      alert('ຂໍອະໄພ: ສິນຄ້າຊິ້ນນີ້ໝົດສະຕັອກແລ້ວ!');
      return;
    }

    if (db.isServiceCategory(product.category)) {
      handleOpenServiceConfig(product);
      return;
    }

    if (settings.barcodeBeep !== false) {
      playSound('beep');
    }

    const activeSlot = slots[selectedSlotId] || { items: [] };
    const existing = activeSlot.items.find(item => item.productId === product.id);
    const currentQty = existing ? existing.qty : 0;

    if (showQtyModal && qtyTargetProd && qtyTargetProd.id === product.id) {
      const newQty = inputQty + 1;
      if (!db.isServiceCategory(product.category) && newQty > product.stock) {
        alert('ຂໍອະໄພ: ສິນຄ້າໃນສະຕັອກບໍ່ພໍ!');
        return;
      }
      setInputQty(newQty);
      updateCartQty(product, newQty);
    } else {
      setInitialQtyBeforeModal(currentQty);
      setQtyTargetProd(product);
      const newQty = currentQty + 1;
      setInputQty(newQty);
      updateCartQty(product, newQty);
      setShowQtyModal(true);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return;

      const currentTime = Date.now();
      const delayThreshold = settings.barcodeDelay || 50;

      // Add to scanner key log if single char or Enter
      if (e.key.length === 1 || e.key === 'Enter') {
        scannerLogRef.current.push({ key: e.key, time: currentTime });
        
        // Clean up log of items older than 2 seconds to keep it token-efficient
        scannerLogRef.current = scannerLogRef.current.filter(item => currentTime - item.time < 2000);
      }

      // Check if this key is part of a fast sequence
      let isFastSequence = false;
      const log = scannerLogRef.current;
      if (log.length >= 2) {
        const lastDiff = currentTime - log[log.length - 2].time;
        if (lastDiff < delayThreshold) {
          isFastSequence = true;
        }
      }

      const activeElement = document.activeElement;
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable
      );

      // If we are in a fast sequence and an input is focused, prevent the character from being entered
      if (isFastSequence && isInput && e.key.length === 1) {
        e.preventDefault();
      }

      // Legacy fallback buffering for slow/non-input scans
      const isFast = (currentTime - lastKeyTimeRef.current) < delayThreshold;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        // First try to detect if we have a fast scanned sequence in the key log
        const enterTime = currentTime;
        const scanCandidateKeys = [];
        for (let i = log.length - 2; i >= 0; i--) {
          const item = log[i];
          if (enterTime - item.time > 1500) break; // Too old
          if (item.key === 'Enter') break; // Previous enter boundary
          scanCandidateKeys.unshift(item);
        }

        let isDetectedScan = false;
        let scanCode = '';

        if (scanCandidateKeys.length >= 3) {
          let totalDiff = 0;
          for (let i = 1; i < scanCandidateKeys.length; i++) {
            totalDiff += (scanCandidateKeys[i].time - scanCandidateKeys[i - 1].time);
          }
          const avgDiff = totalDiff / (scanCandidateKeys.length - 1);
          if (avgDiff < delayThreshold) {
            isDetectedScan = true;
            scanCode = scanCandidateKeys.map(k => k.key).join('').trim();
          }
        }

        let code = isDetectedScan ? scanCode : barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        scannerLogRef.current = [];

        let matchedProd = null;
        let matchedPromo = null;
        if (code.length >= 2) {
          matchedProd = products.find(p => p.barcode === code);
          if (!matchedProd) {
            matchedPromo = promotions.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active);
          }
        }

        // Fallback: if search box is focused, check searchQuery
        if (!matchedProd && !matchedPromo && isInput && searchQuery) {
          const queryCode = searchQuery.trim();
          if (queryCode.length >= 2) {
            matchedProd = products.find(p => p.barcode === queryCode);
            if (!matchedProd) {
              matchedPromo = promotions.find(p => p.code.toUpperCase() === queryCode.toUpperCase() && p.active);
            }
            if (matchedProd || matchedPromo) {
              setSearchQuery(''); // Clear the search query
            }
          }
        }

        if (matchedProd) {
          e.preventDefault();
          
          // Since the first character was typed into the input before it was detected as fast, clean it up from input field
          if (isDetectedScan && isInput && activeElement.value) {
            const firstChar = scanCandidateKeys[0].key;
            const val = activeElement.value;
            if (val.endsWith(firstChar)) {
              activeElement.value = val.slice(0, -1);
              // Trigger input event to let React state update
              const event = new Event('input', { bubbles: true });
              activeElement.dispatchEvent(event);
            }
          }

          handleBarcodeScanned(matchedProd);
          setSearchQuery(''); // Clear the search bar
          return;
        }

        if (matchedPromo) {
          e.preventDefault();
          setCouponCode(matchedPromo.code.toUpperCase());
          if (settings.barcodeBeep !== false) {
            playSound('beep');
          }
          alert(`✓ ນຳໃຊ້ຄູປອງ [${matchedPromo.code}] ສຳເລັດ!`);
          return;
        }
      } else if (e.key.length === 1) {
        if (!isInput || isFast) {
          barcodeBufferRef.current += e.key;
        } else {
          barcodeBufferRef.current = '';
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [products, slots, selectedSlotId, showQtyModal, qtyTargetProd, settings, inputQty, searchQuery, promotions]);

  const activeSlot = slots[selectedSlotId] || { items: [], label: selectedSlotId };

  // 1. Open select qty dialog modal when adding product (Image 3)
  const handleProductSelect = (product) => {
    if (product.stock <= 0 && !db.isServiceCategory(product.category)) {
      alert('ຂໍອະໄພ: ສິນຄ້າຊິ້ນນີ້ໝົດສະຕັອກແລ້ວ!');
      return;
    }
    if (db.isServiceCategory(product.category)) {
      handleOpenServiceConfig(product);
      return;
    }

    const activeSlot = slots[selectedSlotId] || { items: [] };
    const existing = activeSlot.items.find(item => item.productId === product.id);
    const currentQty = existing ? existing.qty : 0;

    setInitialQtyBeforeModal(currentQty);
    setQtyTargetProd(product);
    const newQty = currentQty + 1;
    setInputQty(newQty);
    updateCartQty(product, newQty);
    setShowQtyModal(true);
  };

  // 2. Confirm quantity modal
  const handleConfirmQty = (e) => {
    if (e) e.preventDefault();
    let finalQty = parseInt(inputQty, 10) || 1;
    if (qtyTargetProd) {
      if (!db.isServiceCategory(qtyTargetProd.category)) {
        if (finalQty > qtyTargetProd.stock) {
          alert(db.getLabel('stock_limit_alert', 'ບໍ່ສາມາດຂາຍເກີນຈຳນວນໃນສາງໄດ້! ສິນຄ້ານີ້ເຫຼືອພຽງ') + ' ' + qtyTargetProd.stock);
          finalQty = qtyTargetProd.stock;
        }
      }
      if (finalQty < 1) {
        finalQty = initialQtyBeforeModal > 0 ? initialQtyBeforeModal : 1;
      }
      setInputQty(finalQty);
      updateCartQty(qtyTargetProd, finalQty);
    }
    setShowQtyModal(false);
    setQtyTargetProd(null);
    playSound('beep');
  };

  // 2.1 Cancel / Revert quantity changes
  const handleCancelQty = () => {
    if (qtyTargetProd) {
      updateCartQty(qtyTargetProd, initialQtyBeforeModal);
    }
    setShowQtyModal(false);
    setQtyTargetProd(null);
  };

  // 3. Request Admin Passcode PIN for deleting cart items (anti-fraud)
  const handleDeleteCartItemClick = (idx) => {
    setPendingDeleteIndex(idx);
    setAdminPinInput('');
    setPinError('');
    setShowAdminPinModal(true);
  };

  const handleConfirmAdminPin = (e) => {
    e.preventDefault();
    const users = db.getUsers();
    const settings = db.getSettings();
    const matchedOwner = users.find(u => u.role === 'owner' && u.passcode === adminPinInput);
    const isMasterPin = adminPinInput === settings.masterAdminPin;

    const updatedSlots = { ...slots };
    const items = [...updatedSlots[selectedSlotId].items];
    const targetItem = items[pendingDeleteIndex];

    if (matchedOwner || isMasterPin) {
      if (targetItem) {
        db.addAuditLog(
          'success_pin',
          `ລົບສິນຄ້າ "${targetItem.name}" (ຈຳນວນ: ${targetItem.qty}) ອອກຈາກບັດຄິວ ${selectedSlotId} (ອະນຸມັດໂດຍ Admin PIN)`,
          'info'
        );
      }
      
      items.splice(pendingDeleteIndex, 1);
      
      updatedSlots[selectedSlotId].items = items;
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);
      
      setShowAdminPinModal(false);
      setPendingDeleteIndex(-1);
    } else {
      if (targetItem) {
        db.addAuditLog(
          'failed_pin',
          `ພະຍາຍາມລົບສິນຄ້າ "${targetItem.name}" (ຈຳນວນ: ${targetItem.qty}) ອອກຈາກບັດຄິວ ${selectedSlotId} ແຕ່ໃສ່ລະຫັດ PIN ຜິດ`,
          'warning'
        );
      }
      setPinError('ລະຫັດ PIN ແອດມິນບໍ່ຖືກຕ້ອງ!');
    }
  };

  // 4. Rename Slot Card Dialog (แก้ไขชื่อบัตรคิว)
  const handleRenameClick = (e, slot) => {
    e.stopPropagation(); // prevent opening the menu view
    setRenameSlotTarget(slot);
    setRenameValue(slot.label);
    setRenameCustomerName(slot.customerName || '');
    setRenameCustomerPhone(slot.customerPhone || '');
    setRenameCustomerId(slot.customerId || '');
    setRenameDiscountType(slot.discountType || 'percent');
    setRenameDiscountPercent(slot.discountPercent || 0);
    setRenameDiscountAmount(slot.discountAmount || 0);
    setIsRegisteringMember(false);
    setNewMemberDiscountType('percent');
    setNewMemberDiscountValue('');
    setNewMemberTier('Regular');
    setMemberSearchVal('');
    setShowMemberDropdown(false);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (isRegisteringMember && renameCustomerPhone.trim()) {
      const val = Number(newMemberDiscountValue || 0);
      const newCust = db.addCustomer({
        name: renameCustomerName.trim(),
        phone: renameCustomerPhone.trim(),
        discountType: newMemberDiscountType,
        discountValue: val,
        tier: newMemberTier
      });
      db.renameSlot(
        renameSlotTarget.id,
        renameValue,
        renameCustomerName.trim(),
        renameCustomerPhone.trim(),
        newCust.id,
        newCust.discountType,
        newCust.discountType === 'percent' ? newCust.discountValue : 0,
        newCust.discountType === 'fixed' ? newCust.discountValue : 0
      );
    } else {
      db.renameSlot(
        renameSlotTarget.id,
        renameValue,
        renameCustomerName,
        renameCustomerPhone,
        renameCustomerId,
        renameDiscountType,
        renameDiscountPercent,
        renameDiscountAmount
      );
    }
    setSlots(db.getSlots());
    setShowRenameModal(false);
    setRenameSlotTarget(null);
  };

  const handleAddSlotSubmit = (e) => {
    e.preventDefault();
    try {
      const cleanId = newSlotId.trim();
      if (!cleanId) {
        throw new Error('ກະລຸນາໃສ່ລະຫັດບັດຄິວ');
      }
      db.addSlot(cleanId, newSlotLabel.trim() || cleanId);
      setSlots(db.getSlots());
      setShowAddSlotModal(false);
      setNewSlotId('');
      setNewSlotLabel('');
      setAddSlotError('');
    } catch (err) {
      setAddSlotError(err.message || 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const handleDeleteSlotClick = (e, slot) => {
    e.stopPropagation(); // prevent selecting the slot card
    if (window.confirm(`ທ່ານຕ້ອງການລຶບບັດຄິວ "${slot.label}" ແທ້ບໍ່?`)) {
      try {
        db.deleteSlot(slot.id);
        setSlots(db.getSlots());
      } catch (err) {
        alert(err.message || 'ບໍ່ສາມາດລຶບໄດ້');
      }
    }
  };

  // Slot customer details handlers
  const handleSlotEntrySubmit = (e) => {
    e.preventDefault();
    if (!slotEntryName.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ລູກຄ້າຢ່າງໜ້ອຍ / Please enter at least the customer name.');
      return;
    }
    if (entryIsRegistering && slotEntryPhone.trim()) {
      const val = Number(entryNewDiscountValue || 0);
      const newCust = db.addCustomer({
        name: slotEntryName.trim(),
        phone: slotEntryPhone.trim(),
        discountType: entryNewDiscountType,
        discountValue: val,
        tier: entryNewTier
      });
      db.renameSlot(
        slotEntryTarget.id,
        slotEntryTarget.label,
        slotEntryName.trim(),
        slotEntryPhone.trim(),
        newCust.id,
        newCust.discountType,
        newCust.discountType === 'percent' ? newCust.discountValue : 0,
        newCust.discountType === 'fixed' ? newCust.discountValue : 0
      );
    } else {
      db.renameSlot(
        slotEntryTarget.id,
        slotEntryTarget.label,
        slotEntryName.trim(),
        slotEntryPhone.trim(),
        entryCustomerId,
        entryDiscountType,
        entryDiscountPercent,
        entryDiscountAmount
      );
    }
    setSlots(db.getSlots());
    setShowSlotEntryModal(false);
    setViewMode('menu');
  };

  const handleSlotEntryDirectSale = () => {
    db.renameSlot(slotEntryTarget.id, slotEntryTarget.label, '', '');
    setSlots(db.getSlots());
    setShowSlotEntryModal(false);
    setViewMode('menu');
  };

  // 5. Click slot card triggers
  const handleSlotCardClick = (slot) => {
    setSelectedSlotId(slot.id);
    
    // Check if there is an active framing job linked to this slot
    const activeJob = framingJobs.find(j => j.slotId === slot.id && j.status !== 'picked_up');
    
    // If it's a debt slot (Red), show outstanding options modal
    if (slot.isDebt) {
      setDebtActionTargetSlot(slot);
      setShowDebtActionModal(true);
    } else if (activeJob) {
      // Automatically load the balance payment for the active framing job into the cart!
      handleCollectPayment(activeJob);
    } else if ((slot.customerName && slot.customerName.trim()) || (slot.items && slot.items.length > 0)) {
      // Already has customer info OR items in cart → go directly to menu (protect from accidental data loss)
      setViewMode('menu');
    } else {
      // Empty slot with no customer info and no items → show entry dialog
      setSlotEntryTarget(slot);
      setSlotEntryName('');
      setSlotEntryPhone('');
      setEntryCustomerId('');
      setEntryDiscountType('percent');
      setEntryDiscountPercent(0);
      setEntryDiscountAmount(0);
      setEntryMemberSearchVal('');
      setShowEntryMemberDropdown(false);
      setEntryIsRegistering(false);
      setEntryNewDiscountType('percent');
      setEntryNewDiscountValue('');
      setEntryNewTier('Regular');
      setShowSlotEntryModal(true);
    }
  };

  // Adjusted Cart Items for framing jobs deposits and balances: show full price and amulets count
  const adjustedCartItems = activeSlot.items.map(item => {
    if (item.productId && item.productId.startsWith('JOB')) {
      const linkedJob = db.getFramingJobs().find(j => j.id === item.productId);
      if (linkedJob) {
        const serviceName = linkedJob.frameTypeName || 'ບໍລິການອັດກອບພຣະ';
        const amuletCount = (linkedJob.amulets && linkedJob.amulets.length) || 1;
        const isDepositPayment = item.name && item.name.startsWith('ມັດຈຳ:');
        return {
          ...item,
          name: isDepositPayment ? `ມັດຈຳ: ${serviceName}` : serviceName,
          price: linkedJob.totalPrice / amuletCount,
          qty: amuletCount,
          total: linkedJob.totalPrice
        };
      }
    }
    return item;
  });

  // Subtotal calculations
  const subtotal = adjustedCartItems.reduce((sum, item) => sum + item.total, 0);

  // Promotions
  const applyPromotion = () => {
    if (couponCode.trim()) {
      const promo = promotions.find(p => p.code.toUpperCase() === couponCode.toUpperCase().trim() && p.active);
      if (promo && subtotal >= promo.minPurchase) {
        return promo;
      }
    }
    const hasGoldFrame = adjustedCartItems.some(item => item.productId === 'P001');
    const hasWaterproof = adjustedCartItems.some(item => item.productId === 'S001' || item.productId === 'S002');
    if (hasGoldFrame && hasWaterproof) {
      const freeWaterPromo = promotions.find(p => p.id === 'FREEWATER' && p.active);
      if (freeWaterPromo) return freeWaterPromo;
    }
    return null;
  };

  const activePromo = applyPromotion();

  const calculateDiscount = () => {
    let promoDiscount = 0;
    if (activePromo) {
      const val = Number(activePromo.value || 0);
      if (activePromo.type === 'percentage') {
        promoDiscount = (subtotal * val) / 100;
      } else if (activePromo.type === 'fixed') {
        promoDiscount = val;
      } else if (activePromo.id === 'FREEWATER') {
        const serviceItem = adjustedCartItems.find(item => item.productId === 'S001' || item.productId === 'S002');
        promoDiscount = serviceItem ? serviceItem.price : 0;
      }
    }

    let customDiscount = 0;
    if (activeSlot) {
      if (activeSlot.discountType === 'fixed') {
        customDiscount = activeSlot.discountAmount || 0;
      } else {
        const customPercent = activeSlot.discountPercent || 0;
        customDiscount = Math.round((subtotal * customPercent) / 100);
      }
    }

    return promoDiscount + customDiscount;
  };

  const discount = calculateDiscount();
  const getJobDeductions = () => {
    let totalDeduction = 0;
    activeSlot.items.forEach(item => {
      if (item.productId && item.productId.startsWith('JOB')) {
        const job = db.getFramingJobs().find(j => j.id === item.productId);
        if (job) {
          const isDepositPayment = item.name && item.name.startsWith('ມັດຈຳ:');
          if (isDepositPayment) {
            totalDeduction += job.balance;
          } else {
            totalDeduction += job.deposit;
          }
        }
      }
    });
    return totalDeduction;
  };

  const grandTotal = Math.max(0, subtotal - discount);

  const payRate = payCurrency === 'THB' ? (settings.exchangeRateThb || 750) : payCurrency === 'USD' ? (settings.exchangeRateUsd || 26000) : 1;
  const currentTotalInCurrency = payCurrency === 'LAK' ? grandTotal 
                               : payCurrency === 'THB' ? Math.ceil(grandTotal / payRate) 
                               : Math.ceil((grandTotal / payRate) * 100) / 100;

  const hasJobBalanceItem = activeSlot.items.some(item => 
    item.productId && 
    item.productId.startsWith('JOB') && 
    !(item.name && item.name.startsWith('ມັດຈຳ:'))
  );

  const targetRoundTotalLAK = checkoutIsDepositMode
    ? grandTotal
    : hasJobBalanceItem
      ? grandTotal
      : Math.max(0, grandTotal - (activeSlot.depositAmount || 0));

  const targetRoundTotalInCurrency = payCurrency === 'LAK' ? targetRoundTotalLAK
                                   : payCurrency === 'THB' ? Math.ceil(targetRoundTotalLAK / payRate)
                                   : Math.ceil((targetRoundTotalLAK / payRate) * 100) / 100;
  const currentPayRoundLAK = Number(checkoutAmountPaid !== '' ? checkoutAmountPaid : grandTotal);
  const currentPayRoundInCurrency = payCurrency === 'LAK' ? currentPayRoundLAK
                                  : payCurrency === 'THB' ? Math.ceil(currentPayRoundLAK / payRate)
                                  : Math.ceil((currentPayRoundLAK / payRate) * 100) / 100;

  useEffect(() => {
    if (showCheckout) {
      setPayCurrency('LAK');
      setPaymentMethod('cash');
      setBankTxRef('');
      if (checkoutIsDepositMode) {
        setCashReceived('');
        setTransferAmount('');
      } else {
        const targetLAK = Math.max(0, grandTotal - (activeSlot.depositAmount || 0));
        setCashReceived(String(targetLAK));
        setTransferAmount('');
      }
    }
  }, [grandTotal, showCheckout, activeSlot, checkoutIsDepositMode]);

  // Reactive sync to keep checkoutAmountPaid equal to target round payment amount
  useEffect(() => {
    const targetLAK = checkoutIsDepositMode
      ? 0
      : Math.max(0, grandTotal - (activeSlot.depositAmount || 0));
    
    if (checkoutIsDepositMode) {
      // In deposit mode, they define the deposit amount on the fly
      let computedLAK = 0;
      const rate = payCurrency === 'THB' ? (settings.exchangeRateThb || 750) : payCurrency === 'USD' ? (settings.exchangeRateUsd || 26000) : 1;
      if (paymentMethod === 'cash') {
        computedLAK = Math.round(Number(cashReceived || 0) * rate);
      } else if (paymentMethod === 'transfer') {
        computedLAK = Math.round(Number(transferAmount || 0) * rate);
      } else { // split
        computedLAK = Number(cashReceived || 0) + Number(transferAmount || 0);
      }
      setCheckoutAmountPaid(String(computedLAK));
    } else {
      setCheckoutAmountPaid(String(targetLAK));
    }
  }, [cashReceived, transferAmount, paymentMethod, payCurrency, grandTotal, activeSlot, settings, checkoutIsDepositMode]);
  const isCheckoutDisabled = (() => {
    if (checkoutIsDepositMode) {
      const amt = paymentMethod === 'cash' ? Number(cashReceived || 0)
                : paymentMethod === 'transfer' ? Number(transferAmount || 0)
                : (Number(cashReceived || 0) + Number(transferAmount || 0));
      
      const rate = payCurrency === 'THB' ? (settings.exchangeRateThb || 750) : payCurrency === 'USD' ? (settings.exchangeRateUsd || 26000) : 1;
      const amtLAK = paymentMethod === 'split' ? amt : Math.round(amt * rate);
      
      if (amtLAK <= 0 || amtLAK > grandTotal) return true;
      if (paymentMethod === 'transfer' && !bankTxRef.trim()) return true;
      if (paymentMethod === 'split' && !bankTxRef.trim()) return true;
      return false;
    } else {
      if (paymentMethod === 'cash') {
        return !cashReceived || Number(cashReceived) < currentPayRoundInCurrency;
      } else if (paymentMethod === 'transfer') {
        return !transferAmount || Number(transferAmount) < currentPayRoundInCurrency || !bankTxRef.trim();
      } else { // split
        const totalSplit = (Number(cashReceived) || 0) + (Number(transferAmount) || 0);
        return totalSplit < currentPayRoundInCurrency || !bankTxRef.trim();
      }
    }
  })();

  // Helper: generate a unique transaction reference number
  const generateTxRef = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = String(now.getFullYear()).slice(-2) + pad(now.getMonth()+1) + pad(now.getDate());
    const timePart = pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const randPart = String(Math.floor(Math.random() * 9000) + 1000);
    return `REF${datePart}${timePart}${randPart}`;
  };

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

    const generateQr = async (template, amount, setter) => {
      if (!template) { setter(''); return; }
      try {
        // Case 1: already an EMVCo text payload → inject amount directly
        if (template.startsWith('000201')) {
          await injectAmountAndGenerate(template, amount, setter, '');
          return;
        }
        // Case 2: data:image (uploaded QR photo) → decode with jsQR → inject amount
        if (template.startsWith('data:image/')) {
          const decoded = await decodeImageToPayload(template);
          if (decoded && decoded.startsWith('000201')) {
            await injectAmountAndGenerate(decoded, amount, setter, template);
          } else {
            setter(template);
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
        setter(dataUrl);
      } catch (err) {
        console.error('Error generating QR:', err);
        setter('');
      }
    };

    const txAmt = Number(transferAmount) || 0;
    generateQr(settings.bankQrTemplate, txAmt > 0 ? txAmt : grandTotal, setCheckoutQrUrl);

    const depAmt = Number(depositInputVal) || 0;
    generateQr(settings.bankQrTemplate, depAmt > 0 ? depAmt : grandTotal, setDepositModalQrUrl);

    setCheckoutTransferQrUrl('');

    if (currentReceipt) {
      generateQr(settings.bankQrTemplate, currentReceipt.paidAmount || currentReceipt.total, setReceiptQrUrl);
      const jobItem = currentReceipt.items.find(item => item.productId && item.productId.startsWith('JOB'));
      if (jobItem) {
        const baseOrigin = (settings.trackingBaseUrl && settings.trackingBaseUrl.trim() !== '')
          ? settings.trackingBaseUrl.trim()
          : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? `http://${serverIp}:${window.location.port || '5173'}`
            : window.location.origin;
        const trackUrl = `${baseOrigin}/?track=${jobItem.productId}`;
        generateQr(trackUrl, '', setTrackingQrUrl);
      } else {
        setTrackingQrUrl('');
      }
    } else {
      setReceiptQrUrl('');
      setTrackingQrUrl('');
    }

    if (currentFramingJob) {
      generateQr(settings.bankQrTemplate, currentFramingJob.balance, setDepositQrUrl);
    } else {
      setDepositQrUrl('');
    }
  }, [settings.bankQrTemplate, settings.trackingBaseUrl, serverIp, grandTotal, currentReceipt, currentFramingJob, transferAmount, depositInputVal]);

  // Checkout pay confirmation
  const handlePayClick = () => {
    if (activeSlot.items.length === 0) {
      alert('ກະລຸນາເລືອກສິນຄ້າໃສ່ກະຕ່າກ່ອນ!');
      return;
    }
    setCheckoutIsDepositMode(false);
    setCouponCode('');
    setPayCurrency('LAK');
    const remainingLAK = Math.max(0, grandTotal - (activeSlot.depositAmount || 0));
    setCashReceived(String(remainingLAK));
    setTransferAmount('');
    setPaymentMethod('cash');
    setShowCheckout(true);
  };

  const kickPhysicalDrawer = async () => {
    const method = localStorage.getItem('drawer_connect_method') || 'print';
    if (method === 'print') return false;

    // ESC/POS command to kick cash drawer 1: ESC p m t1 t2
    // Decimal: 27, 112, 0, 25, 250
    const kickCommand = new Uint8Array([27, 112, 0, 25, 250]);
    // Alternative real-time kick command: DLE DC4 1 m t
    // Decimal: 16, 20, 1, 0, 0
    const altKickCommand = new Uint8Array([16, 20, 1, 0, 0]);

    // 1. Try WebUSB if connected
    if (method === 'usb' && 'usb' in navigator) {
      try {
        const devices = await navigator.usb.getDevices();
        if (devices.length > 0) {
          const device = devices[0];
          await device.open();
          if (device.configuration === null) {
            await device.selectConfiguration(1);
          }
          
          let endpointNum = -1;
          let interfaceNum = -1;
          
          for (const iface of device.configuration.interfaces) {
            for (const alt of iface.alternates) {
              const outEndpoint = alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk');
              if (outEndpoint) {
                endpointNum = outEndpoint.endpointNumber;
                interfaceNum = iface.interfaceNumber;
                break;
              }
            }
            if (endpointNum !== -1) break;
          }

          if (endpointNum !== -1 && interfaceNum !== -1) {
            await device.claimInterface(interfaceNum);
            await device.transferOut(endpointNum, kickCommand);
            await device.transferOut(endpointNum, altKickCommand);
            await device.releaseInterface(interfaceNum);
            await device.close();
            console.log('Drawer kicked successfully via WebUSB');
            return true;
          }
        }
      } catch (err) {
        console.error('Failed to kick via WebUSB:', err);
      }
    }

    // 2. Try Web Serial if connected
    if (method === 'serial' && 'serial' in navigator) {
      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          const port = ports[0];
          if (port.readable === null || port.writable === null) {
            await port.open({ baudRate: 9600 });
          }
          const writer = port.writable.getWriter();
          await writer.write(kickCommand);
          await writer.write(altKickCommand);
          writer.releaseLock();
          await port.close();
          console.log('Drawer kicked successfully via Web Serial');
          return true;
        }
      } catch (err) {
        console.error('Failed to kick via Web Serial:', err);
      }
    }

    return false;
  };

  const handleOpenDrawer = async () => {
    playSound('cash');
    setDrawerOpen(true);
    setTimeout(() => setDrawerOpen(false), 2000);

    // 1. Try local server backend API first (PowerShell raw spooler kick)
    // This is the absolute best method: no print dialog, no paper wasted, works with standard driver!
    try {
      const printerName = settings.windowsPrinterName || 'GP-L80250 Series';
      const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? ''
        : (settings.printServerUrl || 'http://localhost:5173');
      const response = await fetch(`${baseUrl}/api/kick-drawer?printer=${encodeURIComponent(printerName)}`);
      const resData = await response.json();
      if (resData && resData.success) {
        console.log('Drawer kicked successfully via local server API');
        return;
      }
    } catch (e) {
      console.warn('Local server drawer kick failed, trying fallback WebUSB/Serial...', e);
    }

    // 2. Try WebUSB/Web Serial as fallback
    const kicked = await kickPhysicalDrawer();
    if (kicked) {
      return;
    }

    // 3. Fallback alert if everything fails
    alert(
      "⚠️ ບໍ່ພົບການເຊື່ອມຕໍ່ກັບເຄື່ອງພິມ!\n\n" +
      "ກະລຸນາກວດສອບວ່າ:\n" +
      "1. ໄດ້ເປີດໃຊ້ງານໂປຣແກຣມຜ່ານ 'Start-POS-Silent-Print.bat' (ໂໝດ Auto-Print) ຫຼື ບໍ່?\n" +
      "2. ໄດ້ໃສ່ຊື່ເຄື່ອງພິມຖືກຕ້ອງໃນໜ້າຕັ້ງຄ່າ ຫຼື ບໍ່? (ປັດຈຸບັນ: " + (settings.windowsPrinterName || 'GP-L80250 Series') + ")"
    );
  };

  const handleProcessPayment = () => {
    const rate = payCurrency === 'THB' ? (settings.exchangeRateThb || 750) : payCurrency === 'USD' ? (settings.exchangeRateUsd || 26000) : 1;
    
    // Use checkoutAmountPaid LAK limit for this round
    const finalLAKAmountToPay = Number(checkoutAmountPaid !== '' ? checkoutAmountPaid : grandTotal);
    
    const currentPayRoundInCurrency = payCurrency === 'LAK' ? finalLAKAmountToPay 
                                    : payCurrency === 'THB' ? Math.ceil(finalLAKAmountToPay / rate) 
                                    : Math.ceil((finalLAKAmountToPay / rate) * 100) / 100;

    if (paymentMethod === 'cash') {
      const rcv = Number(cashReceived);
      if (isNaN(rcv) || rcv < currentPayRoundInCurrency) {
        alert('ຈຳນວນເງິນສົດບໍ່ພຽງພໍ!');
        return;
      }
    } else if (paymentMethod === 'transfer') {
      if (!bankTxRef.trim()) {
        alert('ກະລຸນາປ້ອນເລກອ້າງອີງການໂອນ!');
        return;
      }
    } else if (paymentMethod === 'split') {
      const cashVal = Number(cashReceived) || 0;
      const transVal = Number(transferAmount) || 0;
      if (cashVal + transVal < currentPayRoundInCurrency) {
        alert('ຍອດຊຳລະເງິນສົດ + ໂອນ ຍັງບໍ່ຄົບຖ້ວນ!');
        return;
      }
      if (!bankTxRef.trim()) {
        alert('ກະລຸນາປ້ອນເລກອ້າງອີງການໂອນ!');
        return;
      }
    }

    // Auto Drawer Release - For Cash or Split transactions
    if (paymentMethod === 'cash' || paymentMethod === 'split') {
      handleOpenDrawer();
    }

    const calculatedChange = paymentMethod === 'cash' 
      ? Math.max(0, Number(cashReceived) - currentPayRoundInCurrency)
      : paymentMethod === 'split'
        ? Math.max(0, ((Number(cashReceived) || 0) + (Number(transferAmount) || 0)) - currentPayRoundInCurrency)
        : 0;

    const historyEntry = {
      date: new Date().toISOString(),
      amount: finalLAKAmountToPay,
      method: paymentMethod === 'cash' ? 'Cash' : (paymentMethod === 'transfer' ? 'BCEL One' : 'Split'),
      cashier: activeUser.name,
      bankTxRef: bankTxRef
    };

    const isBalancePayment = adjustedCartItems.some(item => {
      if (item.productId && item.productId.startsWith('JOB')) {
        const existingJob = db.getFramingJobs().find(j => j.id === item.productId);
        return existingJob && (existingJob.paidAmount > 0 || existingJob.deposit > 0);
      }
      return false;
    });

    const orderData = {
      cashierId: activeUser.id,
      cashierName: activeUser.name,
      items: adjustedCartItems,
      subtotal,
      discount,
      discountPercent: activeSlot.discountPercent || 0,
      total: grandTotal,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' 
        ? Number(cashReceived) 
        : (paymentMethod === 'split' ? Number(cashReceived) || 0 : 0),
      change: checkoutIsDepositMode ? 0 : calculatedChange,
      transferAmount: paymentMethod === 'transfer'
        ? finalLAKAmountToPay
        : (paymentMethod === 'split' ? Math.round((Number(transferAmount) || 0) * rate) : 0),
      currencyTransferAmount: paymentMethod === 'transfer'
        ? currentPayRoundInCurrency
        : (paymentMethod === 'split' ? Number(transferAmount) || 0 : 0),
      bankTxRef: (paymentMethod === 'transfer' || paymentMethod === 'split') ? bankTxRef : '',
      slotId: selectedSlotId,
      customerId: activeSlot.customerId || '',
      customerName: activeSlot.customerName || '',
      customerPhone: activeSlot.customerPhone || '',
      paidAmount: finalLAKAmountToPay,
      remainingAmount: Math.max(0, grandTotal - finalLAKAmountToPay),
      depositAmount: activeSlot.depositAmount || finalLAKAmountToPay,
      financialStatus: finalLAKAmountToPay === 0 ? 'Pending' : (Math.max(0, grandTotal - finalLAKAmountToPay) > 0 ? 'PartialPaid' : 'Paid'),
      pickupStatus: 'WaitingPickup',
      paymentHistory: [historyEntry],
      // Multi-currency details
      payCurrency,
      exchangeRateThb: settings.exchangeRateThb || 750,
      exchangeRateUsd: settings.exchangeRateUsd || 26000,
      currencyTotal: currentPayRoundInCurrency,
      currencyCashReceived: paymentMethod === 'cash'
        ? Number(cashReceived)
        : (paymentMethod === 'split' ? Number(cashReceived) || 0 : 0),
      currencyChange: calculatedChange,
      isBalancePayment: isBalancePayment
    };

    // If in deposit mode, save the deposit amount directly to the slot
    if (checkoutIsDepositMode) {
      const updatedSlots = { ...slots };
      if (updatedSlots[selectedSlotId]) {
        updatedSlots[selectedSlotId].depositAmount = finalLAKAmountToPay;
        updatedSlots[selectedSlotId].depositPayMethod = paymentMethod;
        updatedSlots[selectedSlotId].depositPayCurrency = payCurrency;
        updatedSlots[selectedSlotId].depositBankTxRef = bankTxRef;
        updatedSlots[selectedSlotId].depositCashReceived = cashReceived;
        updatedSlots[selectedSlotId].depositTransferAmount = transferAmount;
        db.saveSlots(updatedSlots);
        setSlots(updatedSlots);
      }
    }

    // Update active framing jobs for this slot
    const allJobs = db.getFramingJobs();
    allJobs.forEach(job => {
      if (job.slotId === selectedSlotId && job.status !== 'picked_up') {
        const isNewJob = !(job.paidAmount > 0);
        const newPaidAmount = isNewJob ? finalLAKAmountToPay : (job.paidAmount || 0) + finalLAKAmountToPay;
        const newRemainingAmount = isNewJob 
          ? Math.max(0, job.totalPrice - newPaidAmount) 
          : Math.max(0, (job.remainingAmount !== undefined ? job.remainingAmount : job.balance) - finalLAKAmountToPay - discount);
        const newTotalPrice = isNewJob ? job.totalPrice : job.totalPrice - discount;
        const isJobFullyPaid = newRemainingAmount === 0;

        db.updateFramingJob({
          ...job,
          totalPrice: newTotalPrice,
          totalAmount: newTotalPrice,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          financialStatus: newPaidAmount === 0 ? 'Pending' : (newRemainingAmount > 0 ? 'PartialPaid' : 'Paid'),
          pickupStatus: isJobFullyPaid ? 'Delivered' : 'WaitingPickup',
          status: isJobFullyPaid ? 'picked_up' : job.status,
          paymentHistory: [...(job.paymentHistory || []), historyEntry],
          customerId: activeSlot.customerId || '',
          customerName: activeSlot.customerName || '',
          customerPhone: activeSlot.customerPhone || '',
          // backward compatibility
          deposit: isNewJob ? finalLAKAmountToPay : job.deposit,
          balance: newRemainingAmount
        });
      }
    });

    const debtItem = activeSlot.items.find(i => i.productId.startsWith('DBT'));
    if (debtItem) {
      db.payDebt(debtItem.productId);
    }

    const savedOrder = db.addOrder(orderData);
    
    // Log audit events
    if (paymentMethod === 'cash') {
      db.addAuditLog(
        'open_drawer',
        `ລິ້ນຊັກເປີດອັດຕະໂນມັດ ຈາກການຊຳລະເງິນສົດ (TX: ${savedOrder.id}, ຍອດລວມ: ${grandTotal.toLocaleString()} ກີບ, ສະກຸນເງິນ: ${payCurrency})`,
        'info'
      );
    }
    if (discount > 0) {
      db.addAuditLog(
        'discount_applied',
        `ໃສ່ສ່ວນຫຼຸດ ${discount.toLocaleString()} ກີບ (${activeSlot.discountPercent || 0}%) ໃຫ້ກັບບັດຄິວ ${selectedSlotId} (TX: ${savedOrder.id})`,
        'warning'
      );
    }

    setCurrentReceipt(savedOrder);
    
    // Clear slot only if not in deposit mode
    if (!checkoutIsDepositMode) {
      db.clearSlot(selectedSlotId);
      setCouponCode('');
    }
    setSlots(db.getSlots());
    setFramingJobs(db.getFramingJobs());
    
    setShowCheckout(false);
    setShowReceipt(true);
    setViewMode('slots'); // Redirect back to slots board
    if (onUpdate) onUpdate();
  };

  // พิมพ์บิล (Work Order / Bill Slip) -> Now prints a Draft Invoice/Receipt instead of Work Order
  const handlePrintWorkOrder = () => {
    if (adjustedCartItems.length === 0) {
      alert('ບໍ່ມີລາຍການສິນຄ້າໃນຄິວນີ້!');
      return;
    }

    setCurrentReceipt({
      id: `INV-${selectedSlotId}-${Date.now().toString().slice(-4)}`,
      slotId: selectedSlotId,
      date: new Date().toISOString(),
      items: adjustedCartItems,
      customerName: activeSlot.customerName,
      customerPhone: activeSlot.customerPhone,
      subtotal: subtotal,
      discount: discount,
      discountPercent: activeSlot.discountPercent || 0,
      total: grandTotal,
      depositAmount: activeSlot.depositAmount || 0,
      paymentMethod: 'draft', // Displays as Unpaid/Temporary Bill
      payCurrency: 'LAK',
      cashierName: activeUser ? activeUser.name : 'ພະນັກງານ',
      cashierId: activeUser ? activeUser.id : ''
    });
    setShowReceipt(true);
  };

  const closePrintModals = useCallback(() => {
    clearTimeout(receiptPrintTimerRef.current);
    clearTimeout(framingPrintTimerRef.current);
    clearTimeout(workOrderPrintTimerRef.current);
    receiptPrintTimerRef.current = null;
    framingPrintTimerRef.current = null;
    workOrderPrintTimerRef.current = null;
    setShowReceipt(false);
    setShowWorkOrder(false);
    setShowFramingPrintModal(false);
  }, []);

  const handlePrint = () => {
    clearTimeout(receiptPrintTimerRef.current);
    clearTimeout(framingPrintTimerRef.current);
    clearTimeout(workOrderPrintTimerRef.current);
    receiptPrintTimerRef.current = null;
    framingPrintTimerRef.current = null;
    workOrderPrintTimerRef.current = null;
    window.print();
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      closePrintModals();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [closePrintModals]);

  // ติดหนี้ (Save as Unpaid Debt)
  const handleOpenDebtClick = () => {
    if (activeSlot.items.length === 0) {
      alert('ບໍ່ມີລາຍການສິນຄ້າໃນຄິວນີ້!');
      return;
    }
    setDebtCustomerName('');
    setDebtCustomerPhone('');
    setDebtNotes('');
    setShowDebtModal(true);
  };

  const handleProcessDebtSubmit = (e) => {
    e.preventDefault();
    
    // Save to debt list ledger table
    const savedDebt = db.addDebt({
      customerName: debtCustomerName,
      customerPhone: debtCustomerPhone,
      items: adjustedCartItems,
      total: grandTotal,
      notes: debtNotes
    });

    // Update active framing jobs for this slot: keep deposit pending; mark balance/full payments as picked_up
    const allJobs = db.getFramingJobs();
    allJobs.forEach(job => {
      if (job.slotId === selectedSlotId && job.status !== 'picked_up') {
        const isDepositCartItem = activeSlot.items.some(item => 
          item.productId === job.id && 
          item.name && 
          item.name.startsWith('ມັດຈຳ:')
        );
        if (!isDepositCartItem) {
          db.updateFramingJobStatus(job.id, 'picked_up');
        }
      }
    });

    // Mark slot as debt-owned and clear its items in one go
    const updatedSlots = { ...slots };
    if (updatedSlots[selectedSlotId]) {
      updatedSlots[selectedSlotId].items = [];
      updatedSlots[selectedSlotId].notes = '';
      updatedSlots[selectedSlotId].isDebt = true;
      updatedSlots[selectedSlotId].customerName = debtCustomerName;
      updatedSlots[selectedSlotId].customerPhone = debtCustomerPhone;
      updatedSlots[selectedSlotId].debtId = savedDebt.id;
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);
    }
    
    setFramingJobs(db.getFramingJobs());
    setShowDebtModal(false);
    alert('✓ ບັນທຶກລາຍການຕິດໜີ້ລູກຄ້າສຳເລັດ!');
    setViewMode('slots'); // Redirect back to slots board
    if (onUpdate) onUpdate();
  };

  // Pay slot outstanding debt (collect money, clear debt status)
  const handleCollectDebtPayment = () => {
    const debts = db.getDebts();
    const debtObj = debts.find(d => d.id === debtActionTargetSlot.debtId);

    if (debtObj) {
      setSelectedSlotId(debtActionTargetSlot.id);
      
      // Seed details as a checkout item
      const updatedSlots = { ...slots };
      updatedSlots[debtActionTargetSlot.id].items = [{
        productId: debtObj.id,
        name: `ຊຳລະຍອດຄ້າງຕິດໜີ້ [${debtObj.id}] (${debtObj.customerName})`,
        price: debtObj.total,
        qty: 1,
        total: debtObj.total,
        category: (db.getCategories().find(c => c.type === 'service') || { id: 'services' }).id
      }];
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);

      // Close debt actions modal
      setShowDebtActionModal(false);
      setDebtActionTargetSlot(null);

      // Launch payment checkout
      setCashReceived('');
      setPaymentMethod('cash');
      setShowCheckout(true);
    }
  };

  const handleViewDebtItems = () => {
    const debts = db.getDebts();
    const debtObj = debts.find(d => d.id === debtActionTargetSlot.debtId);

    if (debtObj) {
      setSelectedSlotId(debtActionTargetSlot.id);
      
      // Load debt items into active slot cart
      const updatedSlots = { ...slots };
      updatedSlots[debtActionTargetSlot.id].items = debtObj.items.map(item => ({
        ...item,
        total: item.price * item.qty
      }));
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);

      setShowDebtActionModal(false);
      setDebtActionTargetSlot(null);
      
      // Switch view mode
      setViewMode('menu');
    }
  };

  const framingBarcodeCanvasRef = useRef(null);
  const receiptPrintTimerRef = useRef(null);
  const framingPrintTimerRef = useRef(null);
  const workOrderPrintTimerRef = useRef(null);

  useEffect(() => {
    if (showFramingPrintModal && currentFramingJob && framingBarcodeCanvasRef.current) {
      generateCode39(framingBarcodeCanvasRef.current, currentFramingJob.id);
    }
  }, [showFramingPrintModal, currentFramingJob]);

  // Auto-print receipt when receipt modal opens
  useEffect(() => {
    if (showReceipt && currentReceipt) {
      receiptPrintTimerRef.current = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(receiptPrintTimerRef.current);
    } else {
      clearTimeout(receiptPrintTimerRef.current);
      receiptPrintTimerRef.current = null;
    }
  }, [showReceipt, currentReceipt]);

  // Auto-print framing job ticket when framing print modal opens
  useEffect(() => {
    if (showFramingPrintModal && currentFramingJob) {
      framingPrintTimerRef.current = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(framingPrintTimerRef.current);
    } else {
      clearTimeout(framingPrintTimerRef.current);
      framingPrintTimerRef.current = null;
    }
  }, [showFramingPrintModal, currentFramingJob]);

  // Auto-print work order when work order modal opens
  useEffect(() => {
    if (showWorkOrder && currentWorkOrder) {
      workOrderPrintTimerRef.current = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(workOrderPrintTimerRef.current);
    } else {
      clearTimeout(workOrderPrintTimerRef.current);
      workOrderPrintTimerRef.current = null;
    }
  }, [showWorkOrder, currentWorkOrder]);

  // BCEL One QR Simulation Handlers
  const handleCheckoutPaymentSuccess = () => {
    playAudioFeedback('cash');
    setBcelPaymentStatus('success');
    
    // Auto-generate Tx Ref
    const txRef = 'BCEL-QR-' + Date.now();
    setBankTxRef(txRef);
    
    // Set transferAmount
    const rate = payCurrency === 'THB' ? (settings.exchangeRateThb || 750) : payCurrency === 'USD' ? (settings.exchangeRateUsd || 26000) : 1;
    const finalLAKAmountToPay = Number(checkoutAmountPaid !== '' ? checkoutAmountPaid : grandTotal);
    const currentPayRoundInCurrency = payCurrency === 'LAK' ? finalLAKAmountToPay 
                                    : payCurrency === 'THB' ? Math.ceil(finalLAKAmountToPay / rate) 
                                    : Math.ceil((finalLAKAmountToPay / rate) * 100) / 100;
    setTransferAmount(String(currentPayRoundInCurrency));

    // Wait 1.5 seconds, then submit payment to make it feel premium
    setTimeout(() => {
      handleProcessPayment('transfer', String(currentPayRoundInCurrency), txRef);
      setBcelPaymentStatus('waiting');
    }, 1500);
  };

  const handleDepositPaymentSuccess = (val) => {
    playAudioFeedback('cash');
    
    // Save to database deposits
    const targetSlotId = selectedSlotId || 'Walk-In';
    const depData = {
      billId: activeSlot.billId || '',
      queueId: targetSlotId,
      amount: val,
      paymentMethod: 'LAO QR',
      cashierName: settings.cashierName || 'system'
    };
    const newDep = db.createDeposit(depData);
    if (newDep && newDep.id) {
      db.confirmDepositPayment(newDep.id, depData.depositBankTxRef || ('BCEL-QR-' + Date.now()), '', activeUser.name || 'system');
    }

    const updatedSlots = { ...slots };
    if (updatedSlots[targetSlotId]) {
      updatedSlots[targetSlotId].depositAmount = val;
      updatedSlots[targetSlotId].depositPayMethod = 'transfer';
      updatedSlots[targetSlotId].depositPayCurrency = 'LAK';
      updatedSlots[targetSlotId].depositBankTxRef = 'BCEL-QR-' + Date.now();
      updatedSlots[targetSlotId].depositCashReceived = '';
      updatedSlots[targetSlotId].depositTransferAmount = String(val);
      
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);

      const allJobs = db.getFramingJobs();
      let currentJobObj = null;
      allJobs.forEach(job => {
        if (job.slotId === targetSlotId && job.status !== 'picked_up') {
          const updatedJob = {
            ...job,
            deposit: val,
            paidAmount: val,
            balance: Math.max(0, job.totalPrice - val),
            remainingAmount: Math.max(0, job.totalPrice - val),
            financialStatus: 'PartialPaid'
          };
          db.updateFramingJob(updatedJob);
          currentJobObj = updatedJob;
        }
      });
      
      if (currentJobObj) {
        setCurrentFramingJob(currentJobObj);
        setShowFramingPrintModal(true);
      }
    }
    
    // Wait 1.5 seconds, then close the deposit modal
    setTimeout(() => {
      setShowDepositInputModal(false);
    }, 1500);
  };



  const getLocalDatetimeString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const generateCode39 = (canvas, text) => {
    try {
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 1.5,
        height: 45,
        displayValue: true,
        fontSize: 10,
        font: 'Courier New',
        background: '#FFFFFF',
        lineColor: '#000000',
        margin: 5
      });
    } catch (err) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FF0000';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❌ error generating barcode', canvas.width / 2, canvas.height / 2);
    }
  };

  const handleOpenServiceConfig = (product) => {
    const targetSlotId = selectedSlotId || 'Walk-In';
    const targetSlot = slots[targetSlotId];
    setServiceConfigProduct(product);
    setServiceConfigQty(1);
    setServiceConfigDeposit('0');
    setServiceConfigAmulets([
      {
        id: Date.now() + Math.random(),
        description: '',
        image: targetSlot ? targetSlot.amuletImage : '',
        frameStyle: 'ກອບໃສ',
        acrylicThickness: '2.0 mm',
        specialNotes: ''
      }
    ]);
    setShowServiceConfigModal(true);
  };

  const handleServiceQtyChange = (newQty) => {
    const qtyVal = parseInt(newQty) || 0;
    setServiceConfigQty(newQty);
    if (qtyVal < 1) return;
    setServiceConfigAmulets(prev => {
      const copy = [...prev];
      if (copy.length < qtyVal) {
        while (copy.length < qtyVal) {
          copy.push({
            id: Date.now() + Math.random() + copy.length,
            description: '',
            image: '',
            frameStyle: 'ກອບໃສ',
            acrylicThickness: '2.0 mm',
            specialNotes: ''
          });
        }
      } else if (copy.length > qtyVal) {
        copy.splice(qtyVal);
      }
      return copy;
    });
  };

  const handleConfirmServiceConfig = (e) => {
    if (e) e.preventDefault();
    if (!serviceConfigProduct) return;

    const targetSlotId = selectedSlotId || 'Walk-In';
    const targetSlot = slots[targetSlotId];
    if (!targetSlot) return;

    const customerName = targetSlot.customerName || 'ລູກຄ້າທົ່ວໄປ';
    const customerPhone = targetSlot.customerPhone || '';

    // Create a framing job with the configured list of amulets
    const totalPrice = Number(serviceConfigProduct.price) * serviceConfigQty;
    const depositAmount = Number(serviceConfigDeposit || 0);
    const balanceAmount = totalPrice - depositAmount;

    const amuletDescription = serviceConfigAmulets.map((a, idx) => `ອົງທີ ${idx+1}: ${a.description || 'ບໍ່ມີລາຍລະອຽດ'}`).join(', ');
    const primaryImage = serviceConfigAmulets[0]?.image || '';

    const newJob = db.addFramingJob({
      customerName,
      customerPhone,
      deposit: depositAmount,
      notes: '',
      pickupDate: getLocalDatetimeString(new Date(Date.now() + 86400000)), // Tomorrow
      status: 'pending',
      slotId: targetSlotId,
      amulets: serviceConfigAmulets.map(a => ({
        id: a.id,
        description: a.description,
        frameTypeId: serviceConfigProduct.id,
        frameTypeName: serviceConfigProduct.name,
        price: Number(serviceConfigProduct.price),
        image: a.image,
        frameStyle: a.frameStyle || 'ກອບໃສ',
        acrylicThickness: a.acrylicThickness || '2.0 mm',
        specialNotes: a.specialNotes || ''
      })),
      totalPrice,
      amuletDescription,
      amuletImage: primaryImage,
      frameTypeId: serviceConfigProduct.id,
      frameTypeName: serviceConfigProduct.name,
      technicianId: activeUser ? activeUser.id : 'technician'
    });

    // Add to cart of the active slot
    const updatedSlots = { ...slots };
    if (updatedSlots[targetSlotId]) {
      const serviceCat = db.getCategories().find(c => c.type === 'service') || { id: 'services' };
      const serviceName = serviceConfigProduct.name || 'ບໍລິການອັດກອບພຣະ';

      const isDeposit = depositAmount > 0;
      const initialCharge = isDeposit ? depositAmount : totalPrice;

      updatedSlots[targetSlotId].items.push({
        productId: newJob.id,
        name: serviceName,
        price: totalPrice / newJob.amulets.length,
        qty: newJob.amulets.length,
        total: totalPrice,
        category: serviceCat.id
      });
      if (isDeposit) {
        updatedSlots[targetSlotId].depositAmount = depositAmount;
      }

      if (primaryImage) {
        updatedSlots[targetSlotId].amuletImage = primaryImage;
      }

      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);
    }

    setShowServiceConfigModal(false);
    setServiceConfigProduct(null);
    setServiceConfigDeposit('0');
    setFramingJobs(db.getFramingJobs());

    if (onUpdate) onUpdate();
  };

  const handleAddFramingClick = (slotId, presetProdId) => {
    const targetSlotId = slotId || selectedSlotId || 'Walk-In';
    const targetSlot = slots[targetSlotId];
    
    let defaultFrame = products.find(p => p.category === 'frames') || products.find(p => !db.isServiceCategory(p.category)) || products.find(p => db.isServiceCategory(p.category));
    if (presetProdId) {
      const presetProd = products.find(p => p.id === presetProdId);
      if (presetProd) {
        defaultFrame = presetProd;
      }
    }
    
    setFramingFormData({
      customerName: targetSlot ? targetSlot.customerName : '',
      customerPhone: targetSlot ? targetSlot.customerPhone : '',
      deposit: 0,
      notes: '',
      pickupDate: getLocalDatetimeString(new Date(Date.now() + 86400000)), // Tomorrow
      status: 'pending',
      slotId: targetSlotId,
      amulets: [
        {
          id: Date.now() + Math.random(),
          description: '',
          frameTypeId: defaultFrame ? defaultFrame.id : 'S001',
          frameTypeName: defaultFrame ? defaultFrame.name : 'ອັດກັນນ້ຳພິເສດ',
          price: defaultFrame ? Number(defaultFrame.price) : 60000,
          image: targetSlot ? targetSlot.amuletImage : ''
        }
      ],
      totalPrice: defaultFrame ? Number(defaultFrame.price) : 60000
    });
    setFramingError('');
    setShowFramingAddModal(true);
  };

  const handleAddFramingSubmit = (e) => {
    e.preventDefault();
    const amulets = framingFormData.amulets || [];
    if (amulets.length === 0) {
      setFramingError('ກະລຸນາເພີ່ມພຣະເຄື່ອງຢ່າງໜ້ອຍ 1 ອົງ');
      return;
    }
    
    const totalPrice = amulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
    const amuletDescription = amulets.map((a, idx) => `ອົງທີ ${idx+1}: ${a.description || 'ບໍ່ມີລາຍລະອຽດ'}`).join(', ');
    const primaryAmulet = amulets[0];
    const primaryImage = primaryAmulet ? primaryAmulet.image : '';

    const newJob = db.addFramingJob({
      ...framingFormData,
      amulets,
      totalPrice,
      amuletDescription,
      amuletImage: primaryImage,
      frameTypeId: primaryAmulet ? primaryAmulet.frameTypeId : '',
      frameTypeName: primaryAmulet ? primaryAmulet.frameTypeName : '',
      technicianId: activeUser.id
    });

    // Link job balance to the slot items
    const updatedSlots = { ...slots };
    const targetSlotId = framingFormData.slotId || 'Walk-In';
    if (updatedSlots[targetSlotId]) {
      const depositAmount = Number(framingFormData.deposit || 0);
      const isDeposit = depositAmount > 0;
      const initialCharge = isDeposit ? depositAmount : totalPrice;
      
      // Clear any previous JOB items from the slot cart first to avoid duplicate jobs linked to same slot
      updatedSlots[targetSlotId].items = updatedSlots[targetSlotId].items.filter(item => !item.productId.startsWith('JOB'));

      const serviceCat = db.getCategories().find(c => c.type === 'service') || { id: 'services' };
      const serviceName = newJob.frameTypeName || 'ບໍລິການອັດກອບພຣະ';

      updatedSlots[targetSlotId].items.push({
        productId: newJob.id,
        name: isDeposit 
          ? `ມັດຈຳ: ${serviceName}`
          : serviceName,
        price: totalPrice / newJob.amulets.length,
        qty: newJob.amulets.length,
        total: totalPrice,
        category: serviceCat.id
      });

      if (primaryImage) {
        updatedSlots[targetSlotId].amuletImage = primaryImage;
      }
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);
    }

    setShowFramingAddModal(false);
    
    // Auto-open print receipt ticket
    setCurrentFramingJob(newJob);
    setShowFramingPrintModal(true);
    
    if (onUpdate) onUpdate();
  };

  const handleEditFramingClick = (job) => {
    setCurrentFramingJob(job);
    
    let amuletsList = [];
    if (job.amulets && job.amulets.length > 0) {
      amuletsList = job.amulets.map(a => ({ ...a }));
    } else {
      amuletsList = [
        {
          id: Date.now() + Math.random(),
          description: job.amuletDescription || '',
          frameTypeId: job.frameTypeId || 'S001',
          frameTypeName: job.frameTypeName || 'ອັດກັນນ້ຳພິເສດ',
          price: Number(job.totalPrice) || 60000,
          image: job.amuletImage || ''
        }
      ];
    }

    setFramingFormData({
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      deposit: job.deposit || 0,
      notes: job.notes || '',
      pickupDate: getLocalDatetimeString(new Date(job.pickupDate)),
      status: job.status,
      slotId: job.slotId || 'Walk-In',
      amulets: amuletsList,
      totalPrice: job.totalPrice
    });
    setFramingError('');
    setShowFramingEditModal(true);
  };

  const handleEditFramingSubmit = (e) => {
    e.preventDefault();
    const amulets = framingFormData.amulets || [];
    if (amulets.length === 0) {
      setFramingError('ກະລຸນາເພີ່ມພຣະເຄື່ອງຢ່າງໜ້ອຍ 1 ອົງ');
      return;
    }
    
    const totalPrice = amulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
    const amuletDescription = amulets.map((a, idx) => `ອົງທີ ${idx+1}: ${a.description || 'ບໍ່ມີລາຍລະອຽດ'}`).join(', ');
    const primaryAmulet = amulets[0];
    const primaryImage = primaryAmulet ? primaryAmulet.image : '';

    const updatedJob = {
      ...currentFramingJob,
      ...framingFormData,
      amulets,
      totalPrice,
      amuletDescription,
      amuletImage: primaryImage,
      frameTypeId: primaryAmulet ? primaryAmulet.frameTypeId : '',
      frameTypeName: primaryAmulet ? primaryAmulet.frameTypeName : ''
    };

    db.updateFramingJob(updatedJob);

    // Sync edited price/deposit to the linked slot cart item if the job is not picked up
    if (framingFormData.status !== 'picked_up') {
      const updatedSlots = { ...slots };
      const targetSlotId = currentFramingJob.slotId || 'Walk-In';
      if (updatedSlots[targetSlotId]) {
        const balanceToPay = Number(totalPrice) - Number(framingFormData.deposit || 0);
        const itemIdx = updatedSlots[targetSlotId].items.findIndex(item => item.productId === currentFramingJob.id);
        if (itemIdx !== -1) {
          const serviceName = updatedJob.frameTypeName || 'ບໍລິການອັດກອບພຣະ';
          const isDeposit = Number(framingFormData.deposit || 0) > 0;
          updatedSlots[targetSlotId].items[itemIdx].name = isDeposit
            ? `ມັດຈຳ: ${serviceName}`
            : serviceName;
          updatedSlots[targetSlotId].items[itemIdx].price = totalPrice / updatedJob.amulets.length;
          updatedSlots[targetSlotId].items[itemIdx].qty = updatedJob.amulets.length;
          updatedSlots[targetSlotId].items[itemIdx].total = totalPrice;
          if (primaryImage) {
            updatedSlots[targetSlotId].amuletImage = primaryImage;
          }
          db.saveSlots(updatedSlots);
          setSlots(updatedSlots);
        }
      }
    }

    setShowFramingEditModal(false);
    setCurrentFramingJob(null);
    if (onUpdate) onUpdate();
  };

  const handlePrintFramingClick = (job) => {
    setCurrentFramingJob(job);
    setShowFramingPrintModal(true);
  };

  const handleFramingStatusChange = (jobId, newStatus) => {
    db.updateFramingJobStatus(jobId, newStatus);
    setFramingJobs(db.getFramingJobs());
    if (onUpdate) onUpdate();
  };

  const handleCollectPayment = (job) => {
    setSelectedSlotId(job.slotId || 'Walk-In');
    
    const updatedSlots = { ...slots };
    const targetSlot = updatedSlots[job.slotId || 'Walk-In'];
    if (targetSlot) {
      const amuletCount = (job.amulets && job.amulets.length) || 1;
      const unitPrice = job.balance / amuletCount;
      const serviceName = job.frameTypeName || 'ບໍລິການອັດກອບພຣະ';
      const serviceCat = db.getCategories().find(c => c.type === 'service') || { id: 'services' };
      
      // Completely replace slot items with ONLY the JOB balance payment item
      targetSlot.items = [{
        productId: job.id,
        name: serviceName,
        price: unitPrice,
        qty: amuletCount,
        total: job.balance,
        category: serviceCat.id
      }];
      
      db.saveSlots(updatedSlots);
      setSlots(updatedSlots);
    }
    
    setViewMode('menu');
    if (onTabChange) {
      onTabChange('pos');
    }
  };

  const slotList = Object.values(slots);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ height: 'calc(100vh - 130px)' }}>
      {/* Dynamic Receipt Print Sizing Styles */}
      <style>
        {`
          @media print {
            .modal-overlay.print-modal .modal-content {
              width: ${settings.receiptPaperWidth || '80mm'} !important;
              max-width: ${settings.receiptPaperWidth || '80mm'} !important;
            }
            .print-receipt-container {
              width: ${settings.receiptPaperWidth || '80mm'} !important;
              max-width: ${settings.receiptPaperWidth || '80mm'} !important;
              font-size: ${settings.receiptFontSize || '10pt'} !important;
              padding: ${settings.receiptPadding || '5mm'} !important;
              line-height: ${settings.receiptLineHeight || '1.3'} !important;
              margin-left: ${settings.receiptMarginLeft || '0mm'} !important;
              margin-right: ${settings.receiptMarginRight || '0mm'} !important;
              margin-top: ${settings.receiptMarginTop || '0mm'} !important;
              margin-bottom: ${settings.receiptMarginBottom || '0mm'} !important;
            }
            .print-receipt-item {
              font-size: calc(${settings.receiptFontSize || '10pt'} - 1pt) !important;
            }
            .print-receipt-totals {
              font-size: ${settings.receiptFontSize || '10pt'} !important;
            }
            .print-receipt-footer {
              font-size: calc(${settings.receiptFontSize || '10pt'} - 2pt) !important;
            }
            .print-receipt-divider {
              border-top: ${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black !important;
            }
          }
          /* Screen preview styling */
          .print-receipt-container {
            width: ${settings.receiptPaperWidth || '80mm'} !important;
            font-size: ${settings.receiptFontSize || '10pt'} !important;
            padding: ${settings.receiptPadding || '5mm'} !important;
            line-height: ${settings.receiptLineHeight || '1.3'} !important;
            margin-left: ${settings.receiptMarginLeft || '0mm'} !important;
            margin-right: ${settings.receiptMarginRight || '0mm'} !important;
            margin-top: ${settings.receiptMarginTop || '0mm'} !important;
            margin-bottom: ${settings.receiptMarginBottom || '0mm'} !important;
          }
          .print-receipt-divider {
            border-top: ${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black !important;
          }
        `}
      </style>
      
      {/* Sub-navigation for Slots Grid vs Kanban Framing Board */}
      {viewMode !== 'menu' && activeUser.role !== 'technician' && !initialViewMode && (
        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            className={`btn ${viewMode === 'slots' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('slots')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '8px' }}
          >
            📿 ບັດຄິວອັດກອບພຣະ (Slots Board)
          </button>
          <button
            className={`btn ${viewMode === 'framing' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('framing')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '8px' }}
          >
            🛠️ ບອດຈັດການງານອັດກອບ (Framing Board)
          </button>
        </div>
      )}

      {viewMode === 'slots' ? (
        <div className="glass-card animate-fade-in" style={{ height: activeUser.role === 'technician' ? '100%' : 'calc(100% - 58px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Queue Board Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ 
                  color: 'var(--gold-primary)', 
                  margin: 0, 
                  fontSize: '1.4rem',
                  background: 'linear-gradient(135deg, #d4af37, #f5d76e, #d4af37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>{db.getLabel('pos_board_title', '📿 ບັດຄິວອັດກອບພຣະເຄື່ອງ')}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '4px 0 0' }}>{db.getLabel('pos_board_subtitle', 'ແຕະບັດຄິວเพื่อເລີ່ມລາຍການ • ຄລິກ ✏️ ເພື່ອແກ້ໄຂລູກຄ້າ')}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddSlotModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '9px 18px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(212,175,55,0.3)', margin: 0 }}
              >
                ➕ {db.getLabel('pos_add_queue', 'ເພີ່ມບັດຄິວ')}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
              <input
                type="text"
                className="form-control"
                placeholder={db.getLabel('pos_search_customer_placeholder', '🔍 ຄົ້ນຫາເບີໂທ ຫຼື ຊື່ລູກຄ້າ...')}
                value={queueSearchQuery}
                onChange={(e) => setQueueSearchQuery(e.target.value)}
                style={{ maxWidth: '240px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border-color)', height: '36px', borderRadius: '10px', fontSize: '0.85rem', padding: '0 12px', margin: 0 }}
              />
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 8px', borderRadius: '20px', background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)', color: '#2ecc71' }}>🟢 ມີສິນຄ້າ</span>
                <span style={{ padding: '3px 8px', borderRadius: '20px', background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db' }}>🔵 ມັດຈຳແລ້ວ</span>
                <span style={{ padding: '3px 8px', borderRadius: '20px', background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c' }}>🔴 ຕິດໜີ້</span>
                <span style={{ padding: '3px 8px', borderRadius: '20px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: 'var(--gold-primary)' }}>⚪ ວ່າງ</span>
              </div>
            </div>
          </div>

          <div className="slots-grid" style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px',
            paddingBottom: '4px'
          }}>
            {slotList.filter(slot => {
              if (!queueSearchQuery.trim()) return true;
              const q = queueSearchQuery.toLowerCase();
              const nameMatch = slot.customerName && slot.customerName.toLowerCase().includes(q);
              const phoneMatch = slot.customerPhone && slot.customerPhone.includes(q);
              const labelMatch = slot.label && slot.label.toLowerCase().includes(q);
              return nameMatch || phoneMatch || labelMatch;
            }).map(slot => {
              const hasItems = slot.items.length > 0;
              const isDebt = slot.isDebt;
              const activeJob = framingJobs.find(j => j.slotId === slot.id && j.status !== 'picked_up');
              const totalQty = slot.items.reduce((s, i) => s + i.qty, 0);
              const totalValue = slot.items.reduce((s, i) => s + i.total, 0);

              // Determine card style
              let cardBg, cardBorder, cardGlow, statusColor;
              const hasDeposit = slot.depositAmount > 0;
              if (isDebt) {
                cardBg = 'linear-gradient(145deg, rgba(231,76,60,0.18) 0%, rgba(192,57,43,0.08) 100%)';
                cardBorder = 'rgba(231,76,60,0.6)';
                cardGlow = '0 0 20px rgba(231,76,60,0.2), 0 4px 20px rgba(0,0,0,0.4)';
                statusColor = 'var(--alert-red)';
              } else if (hasItems && hasDeposit) {
                cardBg = 'linear-gradient(145deg, rgba(52,152,219,0.18) 0%, rgba(41,128,185,0.08) 100%)';
                cardBorder = 'rgba(52,152,219,0.6)';
                cardGlow = '0 0 20px rgba(52,152,219,0.2), 0 4px 20px rgba(0,0,0,0.4)';
                statusColor = '#3498db';
              } else if (hasItems) {
                cardBg = 'linear-gradient(145deg, rgba(39,174,96,0.18) 0%, rgba(27,120,66,0.08) 100%)';
                cardBorder = 'rgba(46,204,113,0.6)';
                cardGlow = '0 0 20px rgba(46,204,113,0.2), 0 4px 20px rgba(0,0,0,0.4)';
                statusColor = 'var(--success-green)';
              } else {
                cardBg = 'linear-gradient(145deg, rgba(212,175,55,0.06) 0%, rgba(18,16,13,0.95) 100%)';
                cardBorder = 'rgba(212,175,55,0.2)';
                cardGlow = '0 4px 15px rgba(0,0,0,0.3)';
                statusColor = 'rgba(212,175,55,0.5)';
              }

              return (
                <div
                  key={slot.id}
                  style={{
                    minHeight: '150px',
                    borderRadius: '14px',
                    border: `1.5px solid ${cardBorder}`,
                    background: cardBg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: cardGlow,
                    overflow: 'hidden',
                    padding: '12px 8px 10px'
                  }}
                  onClick={() => handleSlotCardClick(slot)}
                  className="product-card"
                >
                  {/* Decorative top accent line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${cardBorder}, transparent)` }} />

                  {/* Delete slot button */}
                  {slot.id !== 'Walk-In' && (
                    <button
                      className="no-print"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)',
                        border: '1.5px solid rgba(231,76,60,0.5)',
                        color: 'rgba(231,76,60,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s'
                      }}
                      onClick={(e) => handleDeleteSlotClick(e, slot)}
                      title="ລຶບບັດຄິວ"
                    >
                      ✕
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    className="no-print"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)',
                      border: '1.5px solid rgba(212,175,55,0.5)',
                      color: 'rgba(212,175,55,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      transition: 'all 0.2s'
                    }}
                    onClick={(e) => handleRenameClick(e, slot)}
                    title="ແກ້ໄຂຊື່ຄິว"
                  >
                    ✏️
                  </button>

                  {/* 1. TOP SECTION: Icon / Image */}
                  <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', marginTop: '6px' }}>
                    {slot.amuletImage ? (
                      <img 
                        src={slot.amuletImage} 
                        alt="Amulet"
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          objectFit: 'cover', 
                          borderRadius: '50%', 
                          border: `2px solid ${cardBorder}`,
                          boxShadow: `0 0 10px ${cardBorder}`
                        }} 
                      />
                    ) : (
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(212,175,55,0.12), rgba(12,10,8,0.8))`,
                        border: `2px solid ${cardBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem'
                      }}>
                        {isDebt ? '🔴' : (hasItems && hasDeposit) ? '💰' : hasItems ? '🛍' : '📿'}
                      </div>
                    )}
                  </div>
                  
                  {/* 2. MIDDLE SECTION: Label & Customer Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', margin: '2px 0' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 'bold', 
                      color: isDebt ? 'var(--alert-red)' : (hasItems && hasDeposit) ? '#3498db' : hasItems ? '#2ecc71' : 'white', 
                      textAlign: 'center', 
                      width: '90%', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      lineHeight: '1.1'
                    }}>
                      {slot.label === 'Walk-In' ? db.getLabel('pos_walk_in', 'Walk-In') : slot.label}
                    </span>

                    {slot.customerName && (
                      <span style={{ 
                        fontSize: '0.64rem', 
                        color: 'var(--text-secondary)', 
                        marginTop: '1px', 
                        textAlign: 'center', 
                        width: '90%', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        lineHeight: '1.1'
                      }}>
                        👤 {slot.customerName}
                      </span>
                    )}
                  </div>

                  {/* 3. BOTTOM SECTION: Badges & Capsules */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', marginTop: 'auto', width: '100%' }}>
                    {hasItems && (
                      <span style={{ 
                        fontSize: '0.68rem', 
                        color: '#2ecc71', 
                        fontWeight: 'bold',
                        background: 'rgba(39,174,96,0.12)',
                        padding: '1px 6px',
                        borderRadius: '20px',
                        border: '1px solid rgba(46,204,113,0.25)',
                        lineHeight: '1.2',
                        textAlign: 'center',
                        maxWidth: '95%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        ₭{totalValue.toLocaleString()} ({totalQty} ລ.)
                      </span>
                    )}

                    {activeJob && (
                      <span style={{ 
                        background: activeJob.status === 'done' ? 'rgba(46,204,113,0.15)' : activeJob.status === 'framing' ? 'rgba(243,156,18,0.15)' : 'rgba(231,76,60,0.15)',
                        color: activeJob.status === 'done' ? '#2ecc71' : activeJob.status === 'framing' ? '#f39c12' : '#e74c3c',
                        borderRadius: '20px', 
                        padding: '1px 6px', 
                        fontSize: '0.6rem', 
                        fontWeight: 'bold',
                        border: '1px solid ' + (activeJob.status === 'done' ? 'rgba(46,204,113,0.3)' : activeJob.status === 'framing' ? 'rgba(243,156,18,0.3)' : 'rgba(231,76,60,0.3)'),
                        lineHeight: '1.2'
                      }}>
                        {activeJob.status === 'done' ? '✅ ' : activeJob.status === 'framing' ? '⚙️ ' : '⏳ '}
                        {activeJob.status === 'done' ? db.getLabel('job_status_done', 'ອັດສຳເລັດ') : activeJob.status === 'framing' ? db.getLabel('job_status_framing', 'ກຳລັງອັດ') : db.getLabel('job_status_waiting', 'ລໍຖ້າ')}
                      </span>
                    )}

                    {hasDeposit && (
                      <span style={{ 
                        background: 'rgba(52,152,219,0.15)', 
                        color: '#3498db', 
                        borderRadius: '20px', 
                        padding: '1px 6px', 
                        fontSize: '0.6rem', 
                        fontWeight: 'bold',
                        border: '1px solid rgba(52,152,219,0.3)',
                        lineHeight: '1.2'
                      }}>
                        💰 ມັດຈຳແລ້ວ: ₭{slot.depositAmount.toLocaleString()}
                      </span>
                    )}

                    {isDebt && (
                      <span style={{ 
                        background: 'rgba(231,76,60,0.15)', 
                        color: '#e74c3c', 
                        borderRadius: '20px', 
                        padding: '1px 6px', 
                        fontSize: '0.6rem', 
                        fontWeight: 'bold',
                        border: '1px solid rgba(231,76,60,0.3)',
                        lineHeight: '1.2'
                      }}>
                        ⚠️ ຕິດໜີ້
                      </span>
                    )}
                  </div>
                </div>
              );;
            })}
          </div>
        </div>
      ) : viewMode === 'framing' ? (
        <div style={{ height: activeUser.role === 'technician' ? '100%' : 'calc(100% - 58px)', overflowY: 'auto' }}>
          <FramingBoard
            activeUser={activeUser}
            jobs={framingJobs}
            onStatusChange={handleFramingStatusChange}
            onAddJobClick={() => handleAddFramingClick()}
            onEditJobClick={handleEditFramingClick}
            onPrintJobClick={handlePrintFramingClick}
            onCollectPayment={handleCollectPayment}
            onTrackJob={onTrackJob}
          />
        </div>
      ) : (
        /* View mode 2: Product selection grid on left + Cart on right (Image 1 & 2) */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          {/* Mobile Tab Switcher */}
          <div className="pos-mobile-tabs-container no-print">
            <button
              type="button"
              className={`pos-mobile-tab-btn ${mobileTab === 'products' ? 'active' : ''}`}
              onClick={() => setMobileTab('products')}
            >
              📦 ສິນຄ້າ (Products)
            </button>
            <button
              type="button"
              className={`pos-mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
              onClick={() => setMobileTab('cart')}
            >
              🛒 ຕະກ່າ ({activeSlot.items.reduce((s, i) => s + i.qty, 0)} ລາຍການ)
            </button>
          </div>
          
          <div className={`pos-grid animate-fade-in ${mobileTab === 'products' ? 'show-products' : 'show-cart'}`} style={{ height: '100%' }}>
          
          {/* Left Panel: Category selection list + Product cards grid (Image 1 style) */}
          <div className="products-panel" style={{ height: '100%' }}>
            
            <div className="pos-search-bar" style={{ padding: '8px 12px' }}>
              
              {/* Back to Queue Grid button */}
              <button
                className="btn btn-secondary"
                style={{ background: '#e67e22', color: 'white', borderColor: '#d35400', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold' }}
                onClick={() => setViewMode('slots')}
              >
                ⬅️ ໜ້າບັດຄິວ (Queue Grid)
              </button>

              <input
                type="text"
                className="form-control"
                placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            {/* Categories selector */}
            <div className="category-tabs" style={{ marginBottom: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', name: db.getLabel('cat_all', 'ທັງໝົດ') },
                ...categories.map(cat => ({
                  id: cat.id,
                  name: db.getLabel('cat_' + cat.id, cat.name),
                  icon: cat.icon || '📦',
                  type: db.isServiceCategory(cat.id) ? 'service' : 'physical'
                }))
              ].map(cat => (
                <button
                  key={cat.id}
                  className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px',
                    minWidth: '120px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    border: selectedCategory === cat.id
                      ? '1px solid var(--gold-primary)'
                      : '1px solid var(--border-color)',
                    background: selectedCategory === cat.id
                      ? 'rgba(212,175,55,0.12)'
                      : 'rgba(255,255,255,0.02)'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: selectedCategory === cat.id ? 'var(--gold-primary)' : 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {cat.id === 'all' ? (
                      <span>📦</span>
                    ) : (
                      cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                        <img src={cat.icon} style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '2px' }} alt="" />
                      ) : (
                        <span>{cat.icon || '📦'}</span>
                      )
                    )}
                    <span>{cat.name}</span>
                  </span>
                  {cat.type && (
                    <span style={{ fontSize: '0.68rem', color: cat.type === 'service' ? 'var(--accent-amber)' : 'var(--success-green)' }}>
                      {cat.type === 'service' ? '🛠️ ບໍລິການ' : '📦 ສິນຄ້າ'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Products cards grid */}
            <div className="products-scroll">
              {filteredProducts.map(p => {
                const isService = db.isServiceCategory(p.category);
                const isLowStock = !isService && p.stock <= p.minStock;
                const cardStyle = {
                  padding: '10px',
                  border: isService ? '1px solid rgba(229,169,59,0.22)' : '1px solid rgba(39,174,96,0.18)',
                  background: isService ? 'linear-gradient(180deg, rgba(229,169,59,0.10), rgba(255,255,255,0.03))' : 'linear-gradient(180deg, rgba(39,174,96,0.08), rgba(255,255,255,0.03))',
                  boxShadow: isService ? '0 10px 28px rgba(229,169,59,0.08)' : '0 10px 28px rgba(39,174,96,0.06)'
                };
                return (
                  <div
                    key={p.id}
                    className="product-card"
                    style={cardStyle}
                    onClick={() => handleProductSelect(p)}
                  >
                    {isLowStock && (
                      <span className="stock-alert-pill">
                        {p.stock === 0 ? 'ໝົດ' : `ໃກ້ໝົດ (${p.stock})`}
                      </span>
                    )}
                    <img src={p.image} alt={p.name} className="product-card-img" style={{ height: '90px' }} />
                    <div className="product-card-name" style={{ fontSize: '0.8rem', height: '32px' }}>{p.name}</div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', color: isService ? 'var(--accent-amber)' : 'var(--success-green)', border: `1px solid ${isService ? 'rgba(229,169,59,0.25)' : 'rgba(39,174,96,0.25)'}`, background: isService ? 'rgba(229,169,59,0.08)' : 'rgba(39,174,96,0.08)' }}>
                        {(() => {
                          const cat = categories.find(c => c.id === p.category || c.name === p.category);
                          const catName = cat ? db.getLabel('cat_' + cat.id, cat.name) : p.category;
                          return isService ? `🛠️ ${catName || 'ບໍລິການ'}` : `📦 ${catName || 'ສິນຄ້າ'}`;
                        })()}
                      </span>
                    </div>
                    <div className="product-card-price" style={{ fontSize: '0.9rem' }}>{p.price.toLocaleString()} ກີບ</div>
                    <div className="product-card-stock" style={{ marginTop: '4px' }}>
                      {isService ? (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ບໍ່ຕ້ອງໃຊ້ສະຕັອກ</span>
                      ) : (
                        <span style={{
                          fontSize: '0.7rem',
                          border: '1.5px solid var(--alert-red)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          color: 'var(--alert-red)',
                          fontWeight: 'bold',
                          background: 'rgba(231, 76, 60, 0.08)',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          ຄົງເຫຼືອ: {p.stock} {p.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Cart list (Image 2 style) - NO "+ ເພີ່ມສິນຄ້າ" button circled */}
          <div className="cart-panel">
            <div className="cart-header" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border-color)' }}>
              {/* Top Row: Cart Title & Item Count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="cart-title" style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                  {db.getLabel('cart_title', '🛒 ກະຕ່າສິນຄ້າ (Shopping Cart)')}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  ({activeSlot.items.reduce((s, i) => s + i.qty, 0)} ລາຍການ)
                </span>
              </div>

              {/* Bottom Row: Active Slot Label & Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {db.getLabel('pos_queue', 'ຄິວ')}: {activeSlot.label === 'Walk-In' ? db.getLabel('pos_walk_in', 'Walk-In') : activeSlot.label}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary no-print"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      borderColor: 'var(--gold-primary)',
                      color: 'var(--gold-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '26px',
                      background: 'transparent',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => handleRenameClick(e, activeSlot)}
                    title="ແກ້ໄຂຊື່ຄິວ"
                  >
                    ✏️ ແກ້ໄຂຊື່
                  </button>

                </div>
              </div>
            </div>

            <div className="cart-items" style={{ padding: '12px' }}>
              {adjustedCartItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                  <p style={{ fontSize: '2rem' }}>🛒</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>{db.getLabel('cart_empty', 'ບໍ່ມີລາຍການສິນຄ້າໃນກະຕ່າ')}</p>
                  <p style={{ fontSize: '0.7rem' }}>ກົດເລືອກສິນຄ້າດ້ານຊ້າຍເພື່ອເພີ່ມລາຍການ</p>
                </div>
              ) : (
                adjustedCartItems.map((item, idx) => (
                  <div key={item.productId} className="cart-item" style={{ paddingBottom: '8px' }}>
                    <div className="cart-item-details">
                      <div className="cart-item-name" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.name}</div>
                      {(() => {
                        if (item.productId && item.productId.startsWith('JOB')) {
                          const job = db.getFramingJobs().find(j => j.id === item.productId);
                          if (job && job.amulets) {
                            return (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '8px', marginTop: '2px', lineHeight: '1.3' }}>
                                {job.amulets.map((a, i) => (
                                  <div key={i} style={{ marginBottom: '1px' }}>
                                    {i + 1}. {a.description || 'ພຣະເຄື່ອງ'} ({a.frameStyle || 'ກອບໃສ'})
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', marginTop: '2px' }}>
                        {item.price.toLocaleString()} x {item.qty} {db.isServiceCategory(item.category) ? 'ຄັ້ງ' : 'ອັນ'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {item.total.toLocaleString()}
                      </span>
                      
                      {/* Delete icon - requests owner authorization PIN */}
                      <button
                        className="logout-btn"
                        style={{ color: 'var(--alert-red)', padding: '2px' }}
                        onClick={() => handleDeleteCartItemClick(idx)}
                        title="ລຶບສິນຄ້າ"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-summary" style={{ padding: '12px' }}>
              {/* Subtotal always visible */}
              <div className="summary-row">
                <span>{db.getLabel('rcpt_subtotal', 'ຍອດລວມ:')}</span>
                <span>{subtotal.toLocaleString()} ກີບ</span>
              </div>

              {/* Discount Row */}
              {(activePromo || (activeSlot.discountPercent > 0) || (activeSlot.discountAmount > 0)) && (
                <div className="summary-row" style={{ color: 'var(--success-green)' }}>
                  <span>
                    {db.getLabel('cart_discount', 'ສ່ວນຫຼຸດ:')}
                    {activePromo ? ` (${activePromo.name})` : ''}
                    {activeSlot.discountType === 'fixed' ? ` [ກຳນົດເອງ -${(activeSlot.discountAmount || 0).toLocaleString()} ₭]` : (activeSlot.discountPercent > 0 ? ` [ກຳນົດເອງ -${activeSlot.discountPercent}%]` : '')}
                  </span>
                  <span>-{discount.toLocaleString()} ກີບ</span>
                </div>
              )}

                            {/* Deposit Offset & Remaining Balance */}
              {(() => {
                const totalJobDeposit = activeSlot.depositAmount || 0;
                if (totalJobDeposit === 0) return null;

                const totalJobBalance = Math.max(0, subtotal - totalJobDeposit - discount);

                return (
                  <>
                    <div className="summary-row" style={{ color: '#3498db', fontSize: '0.9rem' }}>
                      <span>ມັດຈຳແລ້ວ (Deposited):</span>
                      <span>{totalJobDeposit.toLocaleString()} ກີບ</span>
                    </div>
                    <div className="summary-row" style={{ color: totalJobBalance > 0 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      <span>ຍອດຄົງเหลือທີ່ຕ້ອງຊຳລະ (Remaining Balance):</span>
                      <span>{totalJobBalance.toLocaleString()} ກີບ</span>
                    </div>
                  </>
                );
              })()}

              <div className="summary-row total" style={{ fontSize: '1rem', paddingTop: '6px' }}>
                <span>{db.getLabel('rcpt_total_label', 'ຍອດຊຳລະສຸດທິ:')}</span>
                <span>{grandTotal.toLocaleString()} ກີບ</span>
              </div>

              {/* Bottom Actions under cart (Image 2 style) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginTop: '10px' }}>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 1px', fontSize: '0.7rem', background: '#34495e', borderColor: '#2c3e50', color: 'white' }}
                  onClick={() => {
                    handleOpenDrawer();
                    db.addAuditLog('open_drawer', `ເປີດລິ້ນຊັກເກັບເງິນດ້ວຍມື (Manual Release) ໂດຍພະນັກງານ ${activeUser.name}`, 'danger');
                  }}
                >
                  💸 ເປີດລິ້ນຊັກ
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 1px', fontSize: '0.7rem', background: '#d35400', borderColor: '#e67e22', color: 'white' }}
                  onClick={() => {
                    const dType = activeSlot.discountType || 'percent';
                    setDiscountTypeInput(dType);
                    const percent = activeSlot.discountPercent || 0;
                    const amount = activeSlot.discountAmount || (percent ? Math.round((subtotal * percent) / 100) : 0);
                    setDiscountInput(percent ? String(percent) : '');
                    setDiscountAmountInput(amount ? String(amount) : '');
                    setDiscountError('');
                    setShowDiscountModal(true);
                  }}
                  disabled={activeSlot.items.length === 0}
                >
                  🏷️ ສ່ວນຫຼຸດ: {activeSlot.discountType === 'fixed' ? `${(activeSlot.discountAmount || 0).toLocaleString()} ₭` : `${activeSlot.discountPercent || 0}%`}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 1px', fontSize: '0.68rem', background: '#27ae60', borderColor: '#2196f3', color: 'white' }}
                  onClick={() => {
                    if (activeSlot.items.length === 0) {
                      alert('ກະລຸນາເລືອກສິນຄ້າໃສ່ກະຕ່າກ່ອນ!');
                      return;
                    }
                    setCheckoutIsDepositMode(true);
                    setCouponCode('');
                    setPayCurrency('LAK');
                    setCashReceived('');
                    setTransferAmount('');
                    setPaymentMethod('cash');
                    setShowCheckout(true);
                  }}
                  disabled={activeSlot.items.length === 0}
                >
                  💰 ມັດຈຳ
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 1px', fontSize: '0.7rem', background: '#34495e', borderColor: '#5d6d7e', color: 'white' }}
                  onClick={handlePrintWorkOrder}
                  disabled={activeSlot.items.length === 0}
                >
                  {db.getLabel('cart_work_order_btn', '🖨️ ພิມບິນ')}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 1px', fontSize: '0.7rem', background: '#7b241c', borderColor: 'var(--alert-red)', color: 'white' }}
                  onClick={handleOpenDebtClick}
                  disabled={activeSlot.items.length === 0}
                >
                  {db.getLabel('cart_debt_btn', '📒 ຕິດໜີ້')}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '8px 1px', fontSize: '0.7rem', fontWeight: 'bold' }}
                  onClick={handlePayClick}
                  disabled={activeSlot.items.length === 0}
                >
                  {db.getLabel('cart_pay_btn', '💵 ຊຳລະເງິນ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Select Quantity Modal (Image 3 dialog popup) */}
      {showQtyModal && qtyTargetProd && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm animate-fade-in" style={{ border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '12px 16px' }}>
              <span className="modal-title" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{db.getLabel('qty_modal_title', 'ເລືອກຈຳນວນສິນຄ້າ / Select Quantity')}</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={handleCancelQty}>✕</button>
            </div>
            
            <form onSubmit={handleConfirmQty}>
              <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
                
                {qtyTargetProd.image && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <img 
                      src={qtyTargetProd.image} 
                      alt={qtyTargetProd.name} 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '12px', 
                        border: '2px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.03)'
                      }} 
                    />
                  </div>
                )}
                
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: '600', marginBottom: '8px' }}>{qtyTargetProd.name}</h3>
                <p style={{ color: 'var(--gold-primary)', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '24px' }}>
                  ₭{qtyTargetProd.price.toLocaleString()}
                </p>
 
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleModalQtyChange(Math.max(1, inputQty - 1))}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="qty-input"
                    value={inputQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, ''));
                      if (!isNaN(val) && val >= 1) {
                        handleModalQtyChange(val);
                      } else if (e.target.value === '') {
                        handleModalQtyChange('');
                      }
                    }}
                    onBlur={() => {
                      if (!inputQty || inputQty < 1) {
                        handleModalQtyChange(1);
                      }
                    }}
                    style={{ textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleModalQtyChange(inputQty + 1)}
                  >
                    +
                  </button>
                </div>
 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <span>{db.getLabel('qty_modal_total', 'ຍອດລວມ / Total:')}</span>
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '1.15rem' }}>₭{(qtyTargetProd.price * inputQty).toLocaleString()}</span>
                </div>
 
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }} onClick={handleCancelQty}>
                    {db.getLabel('qty_modal_cancel', 'ຍົກເລີກ / Cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '0.85rem', fontWeight: '600' }}>
                    {db.getLabel('qty_modal_confirm', 'ຢືນຢັນ / Confirm')}
                  </button>
                </div>
 
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (() => {
        const discountBase = Math.max(0, subtotal);

        return (
          <Portal>
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content modal-sm animate-fade-in">
              <div className="modal-header">
                <span className="modal-title">🏷️ ສ່ວນຫຼຸດ / Discount</span>
                <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowDiscountModal(false)}>✕</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ຍອດລວມກ່ອນຫຼຸດ:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginLeft: '8px' }}>{discountBase.toLocaleString()} ₭</span>
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ສ່ວນຫຼຸດ (ກີບ / LAK Amount):</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={discountAmountInput}
                      onChange={(e) => {
                        const text = e.target.value;
                        setDiscountAmountInput(text);
                        setDiscountTypeInput('fixed');
                        setDiscountError('');
                        const val = parseFloat(text);
                        if (!isNaN(val) && val >= 0) {
                          if (discountBase > 0) {
                            const pct = (val / discountBase) * 100;
                            setDiscountInput(pct.toFixed(2));
                          } else {
                            setDiscountInput('0');
                          }
                        } else {
                          setDiscountInput('');
                        }
                      }}
                      autoFocus
                      style={{ fontSize: '1.1rem', paddingRight: '35px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>₭</span>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ສ່ວນຫຼຸດ (%):</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountInput}
                      onChange={(e) => {
                        const text = e.target.value;
                        setDiscountInput(text);
                        setDiscountTypeInput('percent');
                        setDiscountError('');
                        const val = parseFloat(text);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          const amt = Math.round((discountBase * val) / 100);
                          setDiscountAmountInput(String(amt));
                        } else {
                          setDiscountAmountInput('');
                        }
                      }}
                      style={{ fontSize: '1.1rem', paddingRight: '35px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>%</span>
                  </div>
                </div>

                {discountError && <p style={{ color: 'var(--alert-red)', marginTop: '6px', fontSize: '0.85rem' }}>{discountError}</p>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowDiscountModal(false); setDiscountInput(''); setDiscountAmountInput(''); setDiscountError(''); }}>ຍົກເລີກ</button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#d35400', borderColor: '#e67e22' }}
                  onClick={() => {
                    if (discountTypeInput === 'fixed') {
                      const amt = parseFloat(discountAmountInput);
                      if (!isNaN(amt) && amt >= 0 && amt <= discountBase) {
                        const updatedSlots = { ...slots };
                        if (updatedSlots[selectedSlotId]) {
                          updatedSlots[selectedSlotId].discountType = 'fixed';
                          updatedSlots[selectedSlotId].discountAmount = amt;
                          updatedSlots[selectedSlotId].discountPercent = parseFloat(discountInput) || 0;
                          db.saveSlots(updatedSlots);
                          setSlots(updatedSlots);
                        }
                        setShowDiscountModal(false);
                      } else {
                        setDiscountError('ກະລຸນາປ້ອນສ່ວນຫຼຸດທີ່ຖືກຕ້ອງ!');
                      }
                    } else {
                      const pct = parseFloat(discountInput);
                      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                        const updatedSlots = { ...slots };
                        if (updatedSlots[selectedSlotId]) {
                          updatedSlots[selectedSlotId].discountType = 'percent';
                          updatedSlots[selectedSlotId].discountPercent = pct;
                          updatedSlots[selectedSlotId].discountAmount = Math.round((discountBase * pct) / 100);
                          db.saveSlots(updatedSlots);
                          setSlots(updatedSlots);
                        }
                        setShowDiscountModal(false);
                      } else {
                        setDiscountError('ກະລຸນາປ້ອນສ່ວນຫຼຸດທີ່ຖືກຕ້ອງ!');
                      }
                    }
                  }}
                >
                  ຢືນຢັນ
                </button>
              </div>
            </div>
          </div>
          </Portal>
        );
      })()}

      {/* Slot Customer Entry Modal (เด้งทุกครั้งที่กดบัตรคิว) */}
      {showSlotEntryModal && slotEntryTarget && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1300, backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '440px',
            width: '95%',
            padding: 0,
            borderRadius: '0',
            border: '1px solid rgba(212,175,55,0.3)',
            background: 'linear-gradient(145deg, #1a1614 0%, #0f0d0b 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(212,175,55,0.1)',
            overflow: 'hidden',
            height: '100dvh',
            maxHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
              borderBottom: '1px solid rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{ fontSize: '1.5rem' }}>📿</div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', background: 'linear-gradient(135deg,#d4af37,#f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {db.getLabel('pos_board_title_short', 'ບັດຄິວ')}: {slotEntryTarget.label === 'Walk-In' ? db.getLabel('pos_walk_in', 'Walk-In') : slotEntryTarget.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {db.getLabel('slot_entry_subtitle', 'ເລືອກປະເພດການໃຫ້ບໍລິການ')}
                </div>
              </div>
              <button
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', cursor: 'pointer', padding: '4px 8px' }}
                onClick={() => setShowSlotEntryModal(false)}
              >✕</button>
            </div>

            {/* Two main action buttons */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Option A: Customer with stored item (ลูกค้าฝาก) */}
              <div style={{
                background: 'rgba(212,175,55,0.07)',
                border: '1.5px solid rgba(212,175,55,0.25)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📋</span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{db.getLabel('slot_entry_with_info', 'ລູກຄ້າຝາກ / ລົງທະບຽນ')}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{db.getLabel('slot_entry_with_info_desc', 'ໃສ່ຊື່ + ເບີໂທ ເພື່ອບັນທຶກຂໍ້ມູນໄວ້ດຶງຄືນໃນພາຍຫຼັງ')}</div>
                  </div>
                </div>
                <form onSubmit={handleSlotEntrySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Autocomplete Search Member */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="🔍 ຄົ້ນຫາສະມາຊິກ (ເບີໂທ ຫຼື ຊື່)..."
                      value={entryMemberSearchVal}
                      onChange={(e) => {
                        setEntryMemberSearchVal(e.target.value);
                        setShowEntryMemberDropdown(true);
                      }}
                      style={{
                        fontSize: '0.85rem', padding: '9px 12px',
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.15)',
                        borderRadius: '8px', color: 'white', width: '100%'
                      }}
                    />
                    {showEntryMemberDropdown && entryMemberSearchVal.trim() && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1c1815', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 100, maxHeight: '140px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        {customerMembers.filter(m => m.name.toLowerCase().includes(entryMemberSearchVal.toLowerCase()) || m.phone.includes(entryMemberSearchVal)).map(m => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSlotEntryName(m.name);
                              setSlotEntryPhone(m.phone);
                              setEntryCustomerId(m.id);
                              setEntryDiscountType(m.discountType);
                              if (m.discountType === 'percent') {
                                setEntryDiscountPercent(m.discountValue);
                                setEntryDiscountAmount(0);
                              } else {
                                setEntryDiscountPercent(0);
                                setEntryDiscountAmount(m.discountValue);
                              }
                              setEntryMemberSearchVal('');
                              setShowEntryMemberDropdown(false);
                            }}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'white', textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            👤 {m.name} ({m.phone}) - {m.discountType === 'percent' ? `${m.discountValue}%` : `${m.discountValue.toLocaleString()} ₭`}
                          </div>
                        ))}
                        {customerMembers.filter(m => m.name.toLowerCase().includes(entryMemberSearchVal.toLowerCase()) || m.phone.includes(entryMemberSearchVal)).length === 0 && (
                          <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            ❌ ບໍ່ພົບຂໍ້ມູນສະມາຊິກ
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    className="form-control"
                    placeholder={db.getLabel('slot_entry_name_ph', 'ຊື່ລູກຄ້າ (ຕ້ອງໃສ່) *')}
                    value={slotEntryName}
                    onChange={(e) => setSlotEntryName(e.target.value)}
                    required
                    style={{
                      fontSize: '0.9rem', padding: '9px 12px',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.25)',
                      borderRadius: '8px', color: 'white', width: '100%'
                    }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder={db.getLabel('slot_entry_phone_ph', 'ເບີໂທ (ສາມາດວ່າງໄດ້)')}
                    value={slotEntryPhone}
                    onChange={(e) => setSlotEntryPhone(e.target.value)}
                    style={{
                      fontSize: '0.9rem', padding: '9px 12px',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px', color: 'white', width: '100%'
                    }}
                  />

                  {entryCustomerId ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#2ecc71', marginTop: '2px', textAlign: 'left' }}>
                      <span>✓ ຜູກສະມາຊິກ: {entryCustomerId} ({entryDiscountType === 'percent' ? `${entryDiscountPercent}%` : `${entryDiscountAmount.toLocaleString()} ₭`})</span>
                      <button type="button" onClick={() => {
                        setEntryCustomerId('');
                        setEntryDiscountType('percent');
                        setEntryDiscountPercent(0);
                        setEntryDiscountAmount(0);
                      }} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 10px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: 'white', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={entryIsRegistering}
                          onChange={(e) => setEntryIsRegistering(e.target.checked)}
                        />
                        {db.getLabel('pos_register_member_btn', '＋ ສະໝັກສະມາຊິກໃໝ່')}
                      </label>
                      
                      {entryIsRegistering && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <select
                                value={entryNewDiscountType}
                                onChange={(e) => setEntryNewDiscountType(e.target.value)}
                                className="form-control"
                                style={{ background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', padding: '3px 6px', fontSize: '0.7rem', borderRadius: '4px', height: '26px' }}
                              >
                                <option value="percent">% (Percent)</option>
                                <option value="fixed">₭ (Fixed)</option>
                              </select>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <input
                                type="number"
                                value={entryNewDiscountValue}
                                onChange={(e) => setEntryNewDiscountValue(e.target.value)}
                                placeholder="ສ່ວນຫຼຸດ..."
                                className="form-control"
                                style={{ background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', padding: '3px 6px', fontSize: '0.7rem', borderRadius: '4px', width: '100%', height: '26px' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      padding: '10px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #d4af37, #b8960c)',
                      border: 'none', color: '#000', cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                      marginTop: '4px'
                    }}
                  >
                    ✓ {db.getLabel('slot_entry_confirm', 'ບັນທຶກ ແລະ ເຂົ້າໜ້າຂาย')}
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{db.getLabel('pos_or', 'ຫຼື / OR')}</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
              </div>

              {/* Option B: Walk-in direct sale */}
              <button
                type="button"
                onClick={handleSlotEntryDirectSale}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(39,174,96,0.3)',
                  background: 'rgba(39,174,96,0.08)',
                  color: '#2ecc71',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  textAlign: 'left', fontSize: '0.88rem', fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>🛒</span>
                <div>
                  <div>{db.getLabel('slot_entry_direct', 'ຂາຍໜ້າຮ້ານ (Walk-In)')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(46,204,113,0.7)', fontWeight: 'normal', marginTop: '2px' }}>
                    {db.getLabel('slot_entry_direct_desc', 'ລູກຄ້າຊື້ໜ້າຮ້ານ — ບໍ່ຈຳເປັນຕ້ອງໃສ່ຂໍ້ມູນ')}
                  </div>
                </div>
              </button>

            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Add Queue Slot Modal (ເພີ່ມບັດຄິວ) */}
      {showAddSlotModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{db.getLabel('pos_add_queue_title', '➕ ເພີ່ມບັດຄິວ (Add Queue)')}</h3>
              <button className="close-btn" onClick={() => { setShowAddSlotModal(false); setAddSlotError(''); }}>✕</button>
            </div>
            
            <form onSubmit={handleAddSlotSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
                <div className="form-group">
                  <label className="form-label">ລະຫັດບັດຄິວ (Slot ID / Code) *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="ເຊັ່ນ: VIP-1, Q05..."
                    value={newSlotId}
                    onChange={(e) => setNewSlotId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ຊື່ບັດຄິວ (Slot Label / Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ເຊັ່ນ: ວີໄອພີ 1 (ຖ້າວ່າງຈະໃຊ້ລະຫັດແທນ)"
                    value={newSlotLabel}
                    onChange={(e) => setNewSlotLabel(e.target.value)}
                  />
                </div>
                {addSlotError && (
                  <p style={{ color: 'var(--alert-red)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    ⚠️ {addSlotError}
                  </p>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddSlotModal(false);
                  setAddSlotError('');
                  setNewSlotId('');
                  setNewSlotLabel('');
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">ຢືນຢັນ ✓</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Service Configuration Modal */}
      {showServiceConfigModal && serviceConfigProduct && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', padding: 0, height: '100dvh', maxHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🛠️ ຕັ້ງຄ່າການບໍລິການອັດກອບ</h3>
              <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => { setShowServiceConfigModal(false); setServiceConfigProduct(null); }}>✕</button>
            </div>

            <form onSubmit={handleConfirmServiceConfig} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', overflowY: 'auto' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{serviceConfigProduct.name}</div>
                  <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold', marginTop: '4px' }}>₭{serviceConfigProduct.price.toLocaleString()} / ອົງ</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>ຈຳນວນພຣະເຄື່ອງ (Quantity) *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleServiceQtyChange(Math.max(1, serviceConfigQty - 1))}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="qty-input"
                      value={serviceConfigQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''));
                        if (!isNaN(val) && val >= 1) {
                          handleServiceQtyChange(val);
                        } else if (e.target.value === '') {
                          handleServiceQtyChange('');
                        }
                      }}
                      onBlur={() => {
                        if (!serviceConfigQty || serviceConfigQty < 1) {
                          handleServiceQtyChange(1);
                        }
                      }}
                      style={{ textAlign: 'center', width: '50px' }}
                    />
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => handleServiceQtyChange(serviceConfigQty + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {serviceConfigAmulets.map((amulet, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '8px', 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          <div 
                            onClick={() => document.getElementById(`service-amulet-file-${index}`).click()}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '6px',
                              background: '#221e1a',
                              border: '1.5px dashed var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              overflow: 'hidden'
                            }}
                            title="ອັບໂຫຼດຮູບພຣະ"
                          >
                            {amulet.image ? (
                              <img src={amulet.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>📷</span>
                            )}
                          </div>
                          <input
                            type="file"
                            id={`service-amulet-file-${index}`}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setServiceConfigAmulets(prev => {
                                    const copy = [...prev];
                                    copy[index].image = reader.result;
                                    return copy;
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 'bold', marginBottom: '4px' }}>ອົງທີ {index + 1}</div>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="ປ້ອນຊື່ພຣະເຄື່ອງ/ລາຍລະອຽດ..."
                            value={amulet.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setServiceConfigAmulets(prev => {
                                const copy = [...prev];
                                copy[index].description = val;
                                return copy;
                              });
                            }}
                            style={{ width: '100%', background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <select
                          className="form-control"
                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                          value={amulet.frameStyle || (settings.frameStyles?.[0] || 'ກອບໃສ')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServiceConfigAmulets(prev => {
                              const copy = [...prev];
                              copy[index].frameStyle = val;
                              return copy;
                            });
                          }}
                        >
                          {(settings.frameStyles || ['ກອບໃສ', 'ກອບສີ', 'ເລເຊີລາຍ', 'ກັນນ້ຳ 100%']).map(style => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                        </select>

                      <div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ໝາຍເຫດພິເສດ (ເຊັ່ນ: ກອບໜາ, ຢາງແດງ...)"
                          value={amulet.specialNotes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServiceConfigAmulets(prev => {
                              const copy = [...prev];
                              copy[index].specialNotes = val;
                              return copy;
                            });
                          }}
                          style={{ width: '100%', background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deposit Input */}
                

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
                  <span>ຍອດລວມທັງໝົດ / Total:</span>
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>₭{(serviceConfigProduct.price * serviceConfigQty).toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: '#12100e' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowServiceConfigModal(false); setServiceConfigProduct(null); }}>ຍົກເລີກ / Cancel</button>
                <button type="submit" className="btn btn-primary">ຕົກລົງ / Confirm</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}      
      {/* Rename Queue Slot Modal (ແກ້ໄຂຂໍ້ມູນບັດຄິວ) */}
      {showRenameModal && renameSlotTarget && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm animate-fade-in" style={{ padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>✏️ ແກ້ໄຂຂໍ້ມູນບັດຄິວ / Edit Queue Slot</h3>
              <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowRenameModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleRenameSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>ລະຫັດຄິວ (Slot ID): {renameSlotTarget.id}</label>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>ຊື່ບັດຄິວ (Queue Name/Label) *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="ປ້ອນຊື່ຄິວໃໝ່ (ເຊັ່ນ: VIP-1, ຊ່າງຍົມ, 01)..."
                    style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}
                  />
                </div>

                {/* Autocomplete Search Member */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
                    {db.getLabel('pos_select_customer_label', 'ເລືອກສະມາຊິກຮ້ານ (Search Member)')}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 ປ້ອນເບີໂທ ຫຼື ຊື່ສະມາຊິກ..."
                    value={memberSearchVal}
                    onChange={(e) => {
                      setMemberSearchVal(e.target.value);
                      setShowMemberDropdown(true);
                    }}
                    style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}
                  />
                  {showMemberDropdown && memberSearchVal.trim() && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1c1815', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 100, maxHeight: '140px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      {customerMembers.filter(m => m.name.toLowerCase().includes(memberSearchVal.toLowerCase()) || m.phone.includes(memberSearchVal)).map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setRenameCustomerName(m.name);
                            setRenameCustomerPhone(m.phone);
                            setRenameCustomerId(m.id);
                            setRenameDiscountType(m.discountType);
                            if (m.discountType === 'percent') {
                              setRenameDiscountPercent(m.discountValue);
                              setRenameDiscountAmount(0);
                            } else {
                              setRenameDiscountPercent(0);
                              setRenameDiscountAmount(m.discountValue);
                            }
                            setMemberSearchVal('');
                            setShowMemberDropdown(false);
                          }}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          👤 {m.name} ({m.phone}) - {m.discountType === 'percent' ? `${m.discountValue}%` : `${m.discountValue.toLocaleString()} ₭`} {m.tier}
                        </div>
                      ))}
                      {customerMembers.filter(m => m.name.toLowerCase().includes(memberSearchVal.toLowerCase()) || m.phone.includes(memberSearchVal)).length === 0 && (
                        <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          ❌ ບໍ່ພົບຂໍ້ມູນສະມາຊິກ
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>ຊື່ລູກຄ້າ (Customer Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={renameCustomerName}
                    onChange={(e) => setRenameCustomerName(e.target.value)}
                    placeholder="ປ້ອນຊື່ລູກຄ້າ..."
                    style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>ເບີໂທຕິດຕໍ່ (Phone Number)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={renameCustomerPhone}
                    onChange={(e) => setRenameCustomerPhone(e.target.value)}
                    placeholder="ປ້ອນເບີໂທລູກຄ້າ..."
                    style={{ width: '100%', background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}
                  />
                </div>

                {renameCustomerId ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#2ecc71', marginTop: '4px' }}>
                    <span>✓ ເຊື່ອມຕໍ່ສະມາຊິກແລ້ວ: {renameCustomerId} ({renameDiscountType === 'percent' ? `${renameDiscountPercent}%` : `${renameDiscountAmount.toLocaleString()} ₭`})</span>
                    <button type="button" onClick={() => {
                      setRenameCustomerId('');
                      setRenameDiscountType('percent');
                      setRenameDiscountPercent(0);
                      setRenameDiscountAmount(0);
                    }} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}>✕ ຍົກເລີກ</button>
                  </div>
                ) : (
                  <div style={{ border: '1.5px dashed var(--border-color)', borderRadius: '8px', padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'white', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={isRegisteringMember}
                        onChange={(e) => setIsRegisteringMember(e.target.checked)}
                      />
                      {db.getLabel('pos_register_member_btn', '＋ ສະໝັກສະມາຊິກໃໝ່')}
                    </label>
                    
                    {isRegisteringMember && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>ປະເພດສ່ວນຫຼຸດ</label>
                            <select
                              value={newMemberDiscountType}
                              onChange={(e) => setNewMemberDiscountType(e.target.value)}
                              className="form-control"
                              style={{ background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              <option value="percent">% (Percent)</option>
                              <option value="fixed">₭ (Fixed LAK)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>ມູນຄ່າສ່ວນຫຼຸດ</label>
                            <input
                              type="number"
                              value={newMemberDiscountValue}
                              onChange={(e) => setNewMemberDiscountValue(e.target.value)}
                              placeholder="ປ້ອນຈຳນວນ..."
                              className="form-control"
                              style={{ background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', width: '100%' }}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>ລະດັບສະມາຊິກ (Tier)</label>
                          <select
                            value={newMemberTier}
                            onChange={(e) => setNewMemberTier(e.target.value)}
                            className="form-control"
                            style={{ background: '#221e1a', color: 'white', border: '1px solid var(--border-color)', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', width: '100%' }}
                          >
                            <option value="Regular">Regular</option>
                            <option value="VIP">VIP</option>
                            <option value="VVIP">VVIP</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowRenameModal(false);
                  setRenameValue('');
                  setRenameCustomerName('');
                  setRenameCustomerPhone('');
                  setMemberSearchVal('');
                  setShowMemberDropdown(false);
                }}>ຍົກເລີກ / Cancel</button>
                <button type="submit" className="btn btn-primary">ບັນທຶກ / Save</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Checkout Modal - Premium Enterprise Redesign */}
      {showCheckout && (
        <Portal>
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '1100px',
            width: '98%',
            padding: 0,
            borderRadius: '0',
            border: checkoutIsDepositMode ? '1px solid rgba(39,174,96,0.25)' : '1px solid rgba(212,175,55,0.25)',
            background: 'linear-gradient(145deg, #1a1614 0%, #0f0d0b 100%)',
            boxShadow: checkoutIsDepositMode
              ? '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(39,174,96,0.08)'
              : '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.08)',
            overflow: 'hidden',
            height: '100dvh',
            maxHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              background: checkoutIsDepositMode
                ? 'linear-gradient(135deg, rgba(39,174,96,0.15) 0%, rgba(39,174,96,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
              borderBottom: checkoutIsDepositMode
                ? '1px solid rgba(39,174,96,0.2)'
                : '1px solid rgba(212,175,55,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px',
                  borderRadius: '12px',
                  background: checkoutIsDepositMode ? 'rgba(39,174,96,0.15)' : 'rgba(212,175,55,0.15)',
                  border: checkoutIsDepositMode ? '1.5px solid rgba(39,174,96,0.4)' : '1.5px solid rgba(212,175,55,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>{checkoutIsDepositMode ? '💰' : '💳'}</div>
                <div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    background: checkoutIsDepositMode
                      ? 'linear-gradient(135deg, #27ae60, #2ecc71)'
                      : 'linear-gradient(135deg, #d4af37, #f5d76e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {checkoutIsDepositMode ? 'ຂັ້ນຕອນການມັດຈຳ' : 'ຂັ້ນຕອນການຊຳລະເງິນ'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {db.getLabel('pos_queue', 'ຄິວ')}: {activeSlot.label === 'Walk-In' ? db.getLabel('pos_walk_in', 'Walk-In') : activeSlot.label}
                    {activeSlot.customerName ? ` • 👤 ${activeSlot.customerName}` : ''}
                  </div>
                </div>
              </div>
              <button
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', cursor: 'pointer', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onClick={() => setShowCheckout(false)}
              >✕</button>
            </div>

            {/* Body: Two Columns */}
            <div className="checkout-grid" style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto'
            }}>
              {/* LEFT COLUMN: Summary + Settings */}
              <div className="checkout-left-col">

                {/* Grand Total Hero Box */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(212,175,55,0.3)',
                  padding: '16px 20px',
                  boxShadow: '0 4px 20px rgba(212,175,55,0.08)'
                }}>
                  {subtotal !== grandTotal && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>{db.getLabel('cart_subtotal', 'ຍອດລວມ:')}</span>
                      <span>{subtotal.toLocaleString()} ₭</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#e74c3c' }}>{db.getLabel('cart_discount', 'ສ່ວນຫຼຸດ:')}</span>
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>- {discount.toLocaleString()} ₭</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: discount > 0 ? '10px' : 0, paddingTop: discount > 0 ? '10px' : 0, borderTop: discount > 0 ? '1px dashed rgba(212,175,55,0.3)' : 'none' }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(212,175,55,0.7)', fontWeight: 'bold' }}>{db.getLabel('cart_total', 'ຍອດທີ່ຕ້ອງຊຳລະ')}</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(135deg, #d4af37, #f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                      {payCurrency === 'LAK'
                        ? targetRoundTotalLAK.toLocaleString() + ' ₭'
                        : payCurrency === 'THB'
                          ? targetRoundTotalInCurrency.toLocaleString() + ' ฿'
                          : '$ ' + targetRoundTotalInCurrency.toFixed(2)
                      }
                    </span>
                  </div>
                  {payCurrency !== 'LAK' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '4px' }}>
                      ({grandTotal.toLocaleString()} ₭)
                    </div>
                  )}

                  {(() => {
                    const totalJobDeposit = checkoutIsDepositMode
                      ? Number(checkoutAmountPaid || 0)
                      : (activeSlot.depositAmount || 0);
                    if (totalJobDeposit > 0 || checkoutIsDepositMode) {
                      return (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '12px', 
                          background: 'rgba(212,175,55,0.06)', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(212,175,55,0.15)',
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '6px', 
                          fontSize: '0.8rem' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                            <span>ມູນຄ່າເຕັມ (Total Value):</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{grandTotal.toLocaleString()} ₭</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f39c12' }}>
                            <span>ຍອດມັດຈຳທີ່ຕ້ອງຈ່າຍ (Deposit to Pay Now):</span>
                            <span style={{ fontWeight: 'bold' }}>{totalJobDeposit.toLocaleString()} ₭</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px' }}>
                            <span>ຍອດຄ້າງຊຳລະຫຼັງຈ່າຍ (Remaining Balance):</span>
                            <span style={{ fontWeight: 'bold' }}>{(grandTotal - totalJobDeposit).toLocaleString()} ₭</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Coupon / Promo Code */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '14px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🎟️ {db.getLabel('chk_coupon', 'ລະຫັດຄູປອງ / Promo Code')}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="DISCOUNT10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase', fontSize: '0.9rem', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', flex: 1 }}
                    />
                    {couponCode.trim() && (
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '6px 12px', fontSize: '0.72rem', fontWeight: 'bold', borderRadius: '8px',
                        background: activePromo ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
                        color: activePromo ? '#2ecc71' : '#e74c3c',
                        border: '1px solid ' + (activePromo ? 'rgba(46,204,113,0.4)' : 'rgba(231,76,60,0.4)'),
                        whiteSpace: 'nowrap'
                      }}>{activePromo ? '✓ ໃຊ້ໄດ້' : '✗ ໃຊ້ບໍ່ໄດ້'}</span>
                    )}
                  </div>
                  {activePromo && (
                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#2ecc71', fontWeight: 'bold' }}>
                      🎉 {activePromo.name} — ຫຼຸດ {activePromo.type === 'percentage' ? activePromo.value + '%' : activePromo.value.toLocaleString() + ' ₭'}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{db.getLabel('chk_pay_method', 'ຊ່ອງທາງຊຳລະ')}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'cash', icon: '💵', label: db.getLabel('chk_cash', 'ເງິນສົດ (Cash)'), color: '#27ae60' },
                      { key: 'transfer', icon: '📱', label: db.getLabel('chk_transfer', 'ໂອນ BCEL One'), color: '#3498db' },
                      { key: 'split', icon: '🔀', label: 'ເງິນສົດ + ໂອນ (Split)', color: '#9b59b6' }
                    ].map(m => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.key);
                          const targetLAK = (activeSlot && activeSlot.depositAmount > 0) ? activeSlot.depositAmount : grandTotal;
                          const targetInCurrency = payCurrency === 'LAK' ? targetLAK
                                                 : payCurrency === 'THB' ? Math.ceil(targetLAK / payRate)
                                                 : Math.ceil((targetLAK / payRate) * 100) / 100;
                          if (m.key === 'cash') {
                            setCashReceived(String(targetInCurrency));
                            setTransferAmount('');
                          } else if (m.key === 'transfer') {
                            setTransferAmount(String(targetInCurrency));
                            setCashReceived('');
                          } else {
                            setCashReceived('');
                            setTransferAmount('');
                          }
                        }}
                        style={{
                          padding: '11px 16px',
                          borderRadius: '10px',
                          border: paymentMethod === m.key ? `1.5px solid ${m.color}` : '1.5px solid rgba(255,255,255,0.08)',
                          background: paymentMethod === m.key ? `rgba(${m.color === '#27ae60' ? '39,174,96' : m.color === '#3498db' ? '52,152,219' : '155,89,182'},0.15)` : 'rgba(255,255,255,0.03)',
                          color: paymentMethod === m.key ? 'white' : 'rgba(255,255,255,0.6)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.88rem',
                          fontWeight: paymentMethod === m.key ? 'bold' : 'normal',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: paymentMethod === m.key ? `0 4px 15px ${m.color}30` : 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                        {m.label}
                        {paymentMethod === m.key && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: m.color }}>✓ ເລືອກ</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ສະກຸນເງິນ</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{code:'LAK',name:'₭ ກີບ'},{code:'THB',name:'฿ ບາດ'},{code:'USD',name:'$ USD'}].map(curr => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => {
                          setPayCurrency(curr.code);
                          const targetLAK = (activeSlot && activeSlot.depositAmount > 0) ? activeSlot.depositAmount : grandTotal;
                          const rate = curr.code === 'THB' ? (settings.exchangeRateThb || 750) : curr.code === 'USD' ? (settings.exchangeRateUsd || 26000) : 1;
                          const targetInCurrency = curr.code === 'LAK' ? targetLAK
                                                 : curr.code === 'THB' ? Math.ceil(targetLAK / rate)
                                                 : Math.ceil((targetLAK / rate) * 100) / 100;
                          if (paymentMethod === 'cash') {
                            setCashReceived(String(targetInCurrency));
                            setTransferAmount('');
                          } else if (paymentMethod === 'transfer') {
                            setTransferAmount(String(targetInCurrency));
                            setCashReceived('');
                          } else {
                            setCashReceived('');
                            setTransferAmount('');
                          }
                        }}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold',
                          border: payCurrency === curr.code ? '1.5px solid var(--gold-primary)' : '1.5px solid rgba(255,255,255,0.08)',
                          background: payCurrency === curr.code ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                          color: payCurrency === curr.code ? 'var(--gold-primary)' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >{curr.name}</button>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Dynamic Payment Input */}
              <div className="checkout-right-col">

                {/* Custom Amount to Pay in this round */}
                {/* Cash payment */}
                {paymentMethod === 'cash' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-primary)', display: 'block', marginBottom: '10px' }}>
                        💵 {db.getLabel('chk_received', 'ຮັບເງິນສົດ')} ({payCurrency === 'LAK' ? 'ກີບ (₭)' : payCurrency === 'THB' ? 'ບາດ (฿)' : 'USD ($)'})
                      </label>
                      <input
                        type="number"
                        step={payCurrency === 'USD' ? '0.01' : '1'}
                        autoFocus
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0"
                        style={{
                          fontSize: '2.8rem', fontWeight: '900', color: '#ffffff',
                          background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(212,175,55,0.4)',
                          padding: '12px 16px', textAlign: 'center', width: '100%',
                          borderRadius: '14px', outline: 'none', transition: 'border-color 0.2s',
                          boxShadow: '0 4px 20px rgba(212,175,55,0.1)'
                        }}
                      />
                    </div>

                    {/* Quick-pick buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        payCurrency === 'LAK' ? 50000 : payCurrency === 'THB' ? 100 : 10,
                        payCurrency === 'LAK' ? 100000 : payCurrency === 'THB' ? 500 : 50,
                        payCurrency === 'LAK' ? 200000 : payCurrency === 'THB' ? 1000 : 100,
                        payCurrency === 'LAK' ? 500000 : payCurrency === 'THB' ? 2000 : 500,
                        payCurrency === 'LAK' ? 1000000 : payCurrency === 'THB' ? 5000 : 1000,
                        payCurrency === 'LAK' ? 2000000 : payCurrency === 'THB' ? 10000 : 2000
                      ].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashReceived(String(val))}
                          style={{
                            padding: '9px 4px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >{val >= 1000 ? (val/1000).toLocaleString()+'K' : val}</button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCashReceived(String(currentPayRoundInCurrency))}
                      style={{
                        padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold',
                        background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                        color: 'var(--gold-primary)', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      ✅ ຈ່າຍພໍດີ — {currentPayRoundInCurrency.toLocaleString()} {payCurrency === 'LAK' ? '₭' : payCurrency === 'THB' ? '฿' : '$'}
                    </button>

                    {/* Change display */}
                    <div style={{ marginTop: 'auto', borderRadius: '14px', overflow: 'hidden' }}>
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        background: (!cashReceived || Number(cashReceived) >= currentPayRoundInCurrency)
                          ? 'linear-gradient(145deg, rgba(39,174,96,0.2), rgba(27,120,66,0.08))'
                          : 'linear-gradient(145deg, rgba(231,76,60,0.15), rgba(231,76,60,0.05))',
                        border: '1.5px solid ' + ((!cashReceived || Number(cashReceived) >= currentPayRoundInCurrency) ? 'rgba(46,204,113,0.5)' : 'rgba(231,76,60,0.5)'),
                        borderRadius: '14px',
                        transition: 'all 0.3s'
                      }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                          {(!cashReceived || Number(cashReceived) >= currentPayRoundInCurrency)
                            ? db.getLabel('chk_change', 'ເງິນທອນ (Change)')
                            : '⚠️ ຍັງຂາດ (Shortage)'}
                        </div>
                        <div style={{
                          fontSize: '3rem', fontWeight: '900', lineHeight: 1.1,
                          color: (!cashReceived || Number(cashReceived) >= currentPayRoundInCurrency) ? '#2ecc71' : '#e74c3c',
                          transition: 'color 0.3s'
                        }}>
                          {checkoutIsDepositMode ? (
                            payCurrency === 'USD' ? '$ 0.00' : '0' + (payCurrency === 'LAK' ? ' ₭' : ' ฿')
                          ) : (
                            (!cashReceived || Number(cashReceived) >= currentPayRoundInCurrency)
                              ? (payCurrency === 'USD'
                                  ? '$ ' + (Math.max(0, Number(cashReceived || 0) - currentPayRoundInCurrency)).toFixed(2)
                                  : Math.round(Math.max(0, Number(cashReceived || 0) - currentPayRoundInCurrency)).toLocaleString() + (payCurrency === 'LAK' ? ' ₭' : ' ฿')
                                )
                              : (payCurrency === 'USD'
                                  ? '-$ ' + (currentPayRoundInCurrency - Number(cashReceived)).toFixed(2)
                                  : '-' + Math.round(currentPayRoundInCurrency - Number(cashReceived)).toLocaleString() + (payCurrency === 'LAK' ? ' ₭' : ' ฿')
                                )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer payment */}
                {paymentMethod === 'transfer' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-primary)', display: 'block', marginBottom: '10px' }}>
                        📱 ຍອດໂອນ (Transfer Amount) ({payCurrency === 'LAK' ? 'ກີບ (₭)' : payCurrency === 'THB' ? 'ບາດ (฿)' : 'USD ($)'})
                      </label>
                      <input
                        type="number"
                        step={payCurrency === 'USD' ? '0.01' : '1'}
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0"
                        style={{
                          fontSize: '2.8rem', fontWeight: '900', color: '#ffffff',
                          background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(212,175,55,0.4)',
                          padding: '12px 16px', textAlign: 'center', width: '100%',
                          borderRadius: '14px', outline: 'none', transition: 'border-color 0.2s',
                          boxShadow: '0 4px 20px rgba(212,175,55,0.1)'
                        }}
                      />
                    </div>
                    {/* Quick-pick buttons for transfer */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      {[
                        payCurrency === 'LAK' ? 50000 : payCurrency === 'THB' ? 100 : 10,
                        payCurrency === 'LAK' ? 100000 : payCurrency === 'THB' ? 500 : 50,
                        payCurrency === 'LAK' ? 200000 : payCurrency === 'THB' ? 1000 : 100,
                        payCurrency === 'LAK' ? 500000 : payCurrency === 'THB' ? 2000 : 500,
                        payCurrency === 'LAK' ? 1000000 : payCurrency === 'THB' ? 5000 : 1000,
                        payCurrency === 'LAK' ? 2000000 : payCurrency === 'THB' ? 10000 : 2000
                      ].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTransferAmount(String(val))}
                          style={{
                            padding: '9px 4px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >{val >= 1000 ? (val/1000).toLocaleString()+'K' : val}</button>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>ສະແກນ QR ຜ່ານ BCEL One ຫຼື ທ່ານສາງ
                        {transferAmount && Number(transferAmount) > 0 && (
                          <span style={{ marginLeft: '8px', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '8px', padding: '2px 8px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                            {Number(transferAmount).toLocaleString()} {payCurrency === 'LAK' ? '₭' : payCurrency === 'THB' ? '฿' : '$'}
                          </span>
                        )}
                      </div>
                      
                      {payCurrency === 'LAK' && (
                        <div style={{
                          margin: '0 auto 12px auto',
                          maxWidth: '280px',
                          background: 'rgba(52,152,219,0.08)',
                          border: '1px dashed rgba(52,152,219,0.3)',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '0.82rem',
                          textAlign: 'center'
                        }}>
                          {bcelPaymentStatus === 'success' ? (
                            <div style={{ color: '#2ecc71', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <span>✅ ໄດ້ຮັບເງິນແລ້ວ! ກຳລັງພິມບິນ...</span>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-secondary)' }}>
                              <span>📱 ກະລຸນາສະແກນຄິວອານີ້ເພື່ອຊຳລະເງິນ</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{
                        display: 'inline-block',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                        position: 'relative'
                      }}>
                        {checkoutQrUrl ? (
                          <>
                            <img
                              src={checkoutQrUrl}
                              alt="QR Code"
                              style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }}
                            />
                            {/* Watermark/logo for BCEL One QR styling */}
                            {payCurrency === 'LAK' && (
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: '#1a5f7a',
                                color: 'white',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.62rem',
                                fontWeight: 'bold',
                                border: '2px solid white',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                              }}>
                                BCEL
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#555' }}>
                            <span style={{ fontSize: '2rem' }}>⚠️</span>
                            <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>ຍັງບໍ່ມີ QR Code</span>
                          </div>
                        )}
                      </div>


                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>ທະນາຄານ:</span>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{settings.bankName || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>ຊື່ບັນຊີ:</span>
                        <span style={{ fontWeight: '500' }}>{settings.bankAccountName || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>ເລກບັນຊີ:</span>
                        <span style={{ color: 'white', fontWeight: 'bold', letterSpacing: '0.05em' }}>{settings.bankAccountNumber || '—'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                        🔢 ເລກອ້າງອີງການໂອນ (Tx Ref) *
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          autoFocus
                          value={bankTxRef}
                          onChange={(e) => setBankTxRef(e.target.value)}
                          placeholder="ລະບົບ generate ໃຫ້ ຫຼື ພິມເອງ..."
                          style={{
                            flex: 1, fontSize: '0.95rem', padding: '11px 14px',
                            background: bankTxRef ? 'rgba(46,204,113,0.08)' : 'rgba(0,0,0,0.4)',
                            border: bankTxRef ? '1.5px solid rgba(46,204,113,0.4)' : '1.5px solid rgba(212,175,55,0.3)',
                            borderRadius: '10px', color: 'white', outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setBankTxRef(generateTxRef())}
                          title="Generate ເລກອ້າງອີງ"
                          style={{
                            padding: '11px 14px', borderRadius: '10px', border: '1.5px solid rgba(52,152,219,0.4)',
                            background: 'rgba(52,152,219,0.12)', color: '#3498db', cursor: 'pointer',
                            fontSize: '1rem', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0
                          }}
                        >🔄 Auto</button>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>
                        💡 ກົດ Auto ເພື່ອ generate ເລກ ຫຼື ພິມເລກຈາກ slip ໂດຍກົງ
                      </div>
                    </div>
                  </div>
                )}

                {/* Split payment */}
                {paymentMethod === 'split' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '6px 0' }}>
                      ປ້ອນເງິນສົດ + ຍອດໂອນ ລວມໃຫ້ ≥ ຍອດທີ່ຕ້ອງຊຳລະ
                    </div>

                    {/* Summary of target */}
                    <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(212,175,55,0.2)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ຍອດລວມເງິນສົດและເງິນໂອນ: </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                        {(Number(cashReceived || 0) + Number(transferAmount || 0)).toLocaleString()} {payCurrency === 'LAK' ? '₭' : payCurrency === 'THB' ? '฿' : '$'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#27ae60', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>💵 ເງິນສົດ</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCashReceived(val);
                            const num = parseFloat(val);
                            if (isNaN(num)) {
                              setTransferAmount('');
                            } else {
                              const remaining = Math.max(0, currentTotalInCurrency - num);
                              setTransferAmount(remaining > 0 ? String(remaining) : '0');
                            }
                          }}
                          placeholder="0"
                          style={{
                            width: '100%', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center',
                            padding: '10px', background: 'rgba(39,174,96,0.08)',
                            border: '1.5px solid rgba(39,174,96,0.3)', borderRadius: '10px', color: 'white', outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#3498db', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📱 ຍອດໂອນ</label>
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTransferAmount(val);
                            const num = parseFloat(val);
                            if (isNaN(num)) {
                              setCashReceived('');
                            } else {
                              const remaining = Math.max(0, currentTotalInCurrency - num);
                              setCashReceived(remaining > 0 ? String(remaining) : '0');
                            }
                          }}
                          placeholder="0"
                          style={{
                            width: '100%', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center',
                            padding: '10px', background: 'rgba(52,152,219,0.08)',
                            border: '1.5px solid rgba(52,152,219,0.3)', borderRadius: '10px', color: 'white', outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* QR small - shows transfer amount */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: '70px', height: '70px', padding: '4px', background: 'white', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {checkoutQrUrl ? (
                          <img src={checkoutQrUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : <span style={{ fontSize: '0.55rem', color: '#999', textAlign: 'center' }}>No QR</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{settings.bankName}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{settings.bankAccountName}</span>
                        <span style={{ fontWeight: 'bold' }}>{settings.bankAccountNumber}</span>
                        {transferAmount && Number(transferAmount) > 0 && (
                          <span style={{ color: '#3498db', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            ຍອດໂອນ: {Number(transferAmount).toLocaleString()} {payCurrency === 'LAK' ? '₭' : payCurrency === 'THB' ? '฿' : '$'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>🔢 ເລກອ້າງອີງ (Tx Ref) *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={bankTxRef}
                          onChange={(e) => setBankTxRef(e.target.value)}
                          placeholder="ລະບົບ generate ໃຫ້ ຫຼື ພິມເອງ..."
                          style={{
                            flex: 1, fontSize: '0.9rem', padding: '9px 12px',
                            background: bankTxRef ? 'rgba(46,204,113,0.08)' : 'rgba(0,0,0,0.3)',
                            border: bankTxRef ? '1px solid rgba(46,204,113,0.4)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', color: 'white', outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setBankTxRef(generateTxRef())}
                          style={{
                            padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(52,152,219,0.4)',
                            background: 'rgba(52,152,219,0.12)', color: '#3498db', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0
                          }}
                        >🔄 Auto</button>
                      </div>
                    </div>

                    {/* Status summary */}
                    {(() => {
                      const totalPaid = (Number(cashReceived)||0) + (Number(transferAmount)||0);
                      const isShort = totalPaid < currentTotalInCurrency;
                      return (
                        <div style={{
                          marginTop: 'auto', padding: '12px 16px', borderRadius: '12px',
                          background: isShort ? 'rgba(231,76,60,0.1)' : 'rgba(39,174,96,0.12)',
                          border: '1.5px solid ' + (isShort ? 'rgba(231,76,60,0.4)' : 'rgba(46,204,113,0.4)'),
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isShort ? '#e74c3c' : '#2ecc71' }}>
                            {isShort ? '⚠️ ຍັງຂາດ:' : '✅ ເງິນທອນ:'}
                          </span>
                          <span style={{ fontSize: '1.3rem', fontWeight: '900', color: isShort ? '#e74c3c' : '#2ecc71' }}>
                            {Math.abs(totalPaid - currentTotalInCurrency).toLocaleString()} {payCurrency === 'LAK' ? '₭' : payCurrency === 'THB' ? '฿' : '$'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                style={{
                  padding: '11px 22px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >✕ {db.getLabel('cancel', 'ຍົກເລີກ')}</button>

              <button 
                type="button"
                onClick={handleProcessPayment}
                disabled={isCheckoutDisabled}
                style={{
                  padding: '13px 32px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #d4af37 0%, #b8960c 100%)',
                  border: 'none', color: '#000',
                  cursor: isCheckoutDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isCheckoutDisabled ? 'none' : '0 6px 25px rgba(212,175,55,0.4)',
                  transition: 'all 0.2s', letterSpacing: '0.02em',
                  opacity: isCheckoutDisabled ? 0.4 : 1
                }}
              >
                {checkoutIsDepositMode ? '💰 ຢືນຢັນການມັດຈຳ' : ('💾 ' + db.getLabel('chk_confirm_btn', 'ຢືນຢັນການຊຳລະ'))}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Admin PIN authentication modal (Anti-fraud) */}
      {showAdminPinModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">🔑 ຕ້ອງໃຊ້ລະຫັດແອດມິນ (Admin PIN)</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => { setShowAdminPinModal(false); setPendingDeleteIndex(-1); }}>✕</button>
            </div>
            
            <form onSubmit={handleConfirmAdminPin}>
              <div className="modal-body" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  ການລຶບລາຍການສິນຄ້າອອກຈາກບິນ ຕ້ອງໄດ້ຮັບການອະນຸມັດໂດຍແອດມິນ/ເຈົ້າຂອງຮ້ານເທົ່ານັ້ນ.
                </p>

                <div className="form-group">
                  <label className="form-label">ປ້ອນລະຫັດ PIN 4 ຫຼັກຂອງແອດມິນ</label>
                  <input
                    type="password"
                    maxLength="4"
                    className="form-control"
                    required
                    autoFocus
                    placeholder="••••"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                  />
                </div>

                {pinError && <p style={{ color: 'var(--alert-red)', fontSize: '0.75rem', marginTop: '6px' }}>{pinError}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAdminPinModal(false);
                  setPendingDeleteIndex(-1);
                  setAdminPinInput('');
                  setPinError('');
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">ຢືນຢັນ PIN</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Customer Debt Registration modal (ຕິດໜີ້) */}
      {showDebtModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">📒 ລົງທະບຽນລູກຄ້າຕິດໜີ້ (Customer Credit)</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowDebtModal(false)}>✕</button>
            </div>
            <form onSubmit={handleProcessDebtSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ຊື່ລູກຄ້າທີ່ຕິດໜີ້ (Customer Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={debtCustomerName}
                    onChange={(e) => setDebtCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ເບີໂທຕິດຕໍ່ (Phone)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={debtCustomerPhone}
                    onChange={(e) => setDebtCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ໝາຍເຫດເພີ່ມເຕີມ / ຂໍ້ຕົກລົງ</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={debtNotes}
                    onChange={(e) => setDebtNotes(e.target.value)}
                    placeholder="ໃສ່ກຳນົດເວລາຈ່າຍຄືນ ຫຼື ລາຍລະອຽດ..."
                  />
                </div>
                <div style={{ background: 'rgba(231,76,60,0.1)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--alert-red)' }}>
                  *ຍອດຕິດໜີ້ທັງໝົດ: <b>{grandTotal.toLocaleString()} ກີບ</b> ຈະຖືກບັນທຶກເຂົ້າບັນຊີຕິດໜີ້ຫຼັງບ້ານ.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowDebtModal(false); setDebtCustomerName(''); setDebtCustomerPhone(''); setDebtNotes(''); }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--alert-red)' }}>ຢືນຢັນຕິດໜີ້</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Printable Work Order Ticket for Technician (ສັ່ງສິນຄ້າ) */}
      {showWorkOrder && currentWorkOrder && (
        <Portal>
        <div className="modal-overlay print-modal">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header no-print">
              <span className="modal-title">📥 ໃບສັ່ງງານອັດກອບພຣະ (Production Slip)</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowWorkOrder(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ background: 'white', padding: '16px' }}>
              <div className="print-receipt-container" style={{ color: 'black' }}>
                <div style={{ textAlign: 'center', borderBottom: '1.5px solid black', paddingBottom: '6px', marginBottom: '10px' }}>
                  <h3>ໃບສັ່ງງານກອບພຣະເຄື່ອງ</h3>
                  <p>ຄິວ/ບັດຄິວ: <b>{currentWorkOrder.slotId}</b></p>
                  <p style={{ fontSize: '8pt' }}>ວັນທີ: {new Date(currentWorkOrder.date).toLocaleString('lo-LA')}</p>
                </div>

                <div style={{ fontSize: '8.5pt', marginBottom: '8px' }}>
                  {currentWorkOrder.customerName && <div><b>ລູກຄ້າ:</b> {currentWorkOrder.customerName} ({currentWorkOrder.customerPhone})</div>}
                </div>

                <table style={{ width: '100%', fontSize: '9pt', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid black', textAlign: 'left' }}>
                      <th>ລາຍການສິນຄ້າ / ບໍລິການ</th>
                      <th style={{ textAlign: 'center', width: '40px' }}>ຈຳນວນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentWorkOrder.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '0.5px dotted #ccc' }}>
                        <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '20px', borderTop: '1px solid black', paddingTop: '8px', fontSize: '8pt', textAlign: 'center', fontStyle: 'italic' }}>
                  * ກະລຸນາອັດກອບພຣະຕາມລາຍການ ແລະ ກວດສອບຄວາມກັນນ້ຳ 100%
                </div>
              </div>
            </div>
            
            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowWorkOrder(false)}>ປິດ</button>
              <button className="btn btn-primary" onClick={handlePrint}>🖨️ ປຣິນໃບສັ່ງງານ</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Printable Invoice Modal (ພິມບິນ) */}
      {showReceipt && currentReceipt && (
        <Portal>
        <div className="modal-overlay print-modal">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header no-print">
              <span className="modal-title">{db.getLabel('rcpt_title', 'ໃບບິນຮັບເງິນ / RECEIPT')}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowReceipt(false)}>✕</button>
            </div>
            
                        <div className="modal-body" style={{ background: 'white', padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <div 
                className="print-receipt-container" 
                id="receipt-print-area"
                style={{
                  width: settings.receiptPaperWidth || '80mm',
                  fontSize: settings.receiptFontSize || '10pt',
                  padding: settings.receiptPadding || '5mm',
                  background: 'white',
                  color: 'black',
                  lineHeight: settings.receiptLineHeight || '1.3',
                  marginLeft: settings.receiptMarginLeft || '0mm',
                  marginRight: settings.receiptMarginRight || '0mm',
                  marginTop: settings.receiptMarginTop || '0mm',
                  marginBottom: settings.receiptMarginBottom || '0mm'
                }}
              >
                <div className="print-receipt-header">
                  {/* Cashier Avatar (at top of printed receipt) */}
                  {(() => {
                    const cashierUser = db.getUsers().find(u => u.id === currentReceipt.cashierId || u.name === currentReceipt.cashierName);
                    const cashierAvatar = cashierUser ? cashierUser.avatar : null;
                    return settings.receiptShowCashier !== false && cashierAvatar ? (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <img src={cashierAvatar} alt="Cashier Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }} />
                      </div>
                    ) : null;
                  })()}

                  {settings.receiptShowLogo !== false && (
                    settings.receiptLogoUrl ? (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                        <img src={settings.receiptLogoUrl} alt="Receipt Logo Custom" style={{ width: settings.receiptLogoWidth || '60px', height: settings.receiptLogoWidth || '60px', borderRadius: settings.receiptLogoShape || '50%', objectFit: 'cover' }} />
                      </div>
                    ) : settings.shopLogo ? (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                        <img src={settings.shopLogo} alt="Shop Logo" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                      </div>
                    ) : null
                  )}
                  {settings.receiptShowHeader !== false && (
                    <div className="print-receipt-title" style={{ fontWeight: 'bold', fontSize: settings.receiptHeaderFontSize || 'calc(100% + 3pt)', textAlign: 'center' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                  )}
                  {settings.receiptShowContactInfo !== false && (
                    <>
                      <div className="print-receipt-subtitle" style={{ fontSize: settings.receiptContactFontSize || 'calc(100% - 2pt)', textAlign: 'center' }}>{settings.receiptHeaderNote || settings.shopSubtitle}</div>
                      <div className="print-receipt-subtitle" style={{ fontSize: settings.receiptContactFontSize || 'calc(100% - 2pt)', textAlign: 'center' }}>{settings.shopAddress} | ໂທ: {settings.shopPhone}</div>
                    </>
                  )}
                </div>

                <div style={{ fontSize: settings.receiptItemsFontSize || 'calc(100% - 2pt)', marginBottom: '8px' }}>
                  {settings.receiptShowBillId !== false && <div><b>{db.getLabel('rcpt_bill_no', 'ເລກບິນ:')}</b> {currentReceipt.id}</div>}
                  {settings.receiptShowDate !== false && <div><b>{db.getLabel('rcpt_date', 'ວັນທີ:')}</b> {new Date(currentReceipt.date).toLocaleString('lo-LA')}</div>}
                  {settings.receiptShowCashier !== false && <div><b>{db.getLabel('rcpt_cashier', 'ພະນັກງານຂາຍ:')}</b> {currentReceipt.cashierName}</div>}
                  {settings.receiptShowPaymentMethod !== false && (
                    <div>
                      <b>ການຊຳລະ:</b> {
                        currentReceipt.paymentMethod === 'cash' ? 'ເງິນສົດ (Cash)' :
                        currentReceipt.paymentMethod === 'draft' ? 'ຍັງບໍ່ທັນຊຳລະ (Temporary Bill)' :
                        currentReceipt.paymentMethod === 'split' ? 'ເງິນສົດ + ໂອນ (Split)' :
                        'ໂອນທະນາຄານ (BCEL)'
                      }
                    </div>
                  )}
                  {settings.receiptShowCustomer !== false && currentReceipt.customerName && (
                    <div><b>{db.getLabel('rcpt_customer_label', 'ລູກຄ້າ:')}</b> {currentReceipt.customerName} {currentReceipt.customerPhone ? `(${currentReceipt.customerPhone})` : ''}</div>
                  )}
                </div>

                <div className="print-receipt-divider"></div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: settings.receiptItemsFontSize || 'calc(100% - 2pt)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid black', textAlign: 'left' }}>
                      <th style={{ paddingBottom: '4px' }}>ລາຍການ</th>
                      <th style={{ width: '25px', textAlign: 'center', paddingBottom: '4px' }}>{db.getLabel('rcpt_header_qty', 'ຈຳນວນ')}</th>
                      <th style={{ width: '70px', textAlign: 'right', paddingBottom: '4px' }}>{db.getLabel('rcpt_header_price', 'ລາຄາ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReceipt.items.map((item, idx) => {
                      const linkedJob = item.productId && item.productId.startsWith('JOB') 
                        ? db.getFramingJobs().find(j => j.id === item.productId) 
                        : null;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px dotted rgba(0,0,0,0.05)' }}>
                          <td style={{ paddingTop: '4px', paddingBottom: '6px', lineHeight: '1.2' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            {linkedJob && linkedJob.amulets && (
                              <div style={{ fontSize: '0.75rem', color: '#555', paddingLeft: '8px', marginTop: '2px', lineHeight: '1.3' }}>
                                {linkedJob.amulets.map((a, i) => (
                                  <div key={i} style={{ marginBottom: '1px' }}>
                                    {i + 1}. {a.description || 'ພຣະເຄື່ອງ'} ({a.frameStyle || 'ກອບໃສ'})
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', paddingTop: '4px', verticalAlign: 'top' }}>{item.qty}</td>
                          <td style={{ textAlign: 'right', paddingTop: '4px', verticalAlign: 'top' }}>{item.total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Default totals layout */}
                {(() => {
                  let totalJobPrice = 0;
                  let totalJobDeposit = 0;
                  let hasJob = false;

                  currentReceipt.items.forEach(item => {
                    if (item.productId && item.productId.startsWith('JOB')) {
                      const job = db.getFramingJobs().find(j => j.id === item.productId);
                      if (job) {
                        hasJob = true;
                        totalJobPrice += job.totalPrice;
                        totalJobDeposit += job.deposit;
                      }
                    }
                  });

                  const isDraft = currentReceipt.paymentMethod === 'draft';
                  
                  // Fallback to standard layout if no job item exists in the receipt
                  if (!hasJob) {
                    return (
                      <div style={{ marginTop: '6px' }}>
                        {settings.receiptShowSubtotal !== false && (
                          <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: settings.receiptTotalsFontSize || '100%', marginTop: '4px' }}>
                            <span>{db.getLabel('cart_subtotal', 'ຍອດລວມກ່ອນຫຼຸດ:')}</span>
                            <span>{currentReceipt.subtotal.toLocaleString()} ກີບ</span>
                          </div>
                        )}
                        {settings.receiptShowDiscount !== false && currentReceipt.discount > 0 && (
                          <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '4px', color: '#e74c3c' }}>
                            <span>{db.getLabel('rcpt_discount_label', 'ສ່ວນຫຼຸດ:')}</span>
                            <span>-{currentReceipt.discount.toLocaleString()} ກີບ</span>
                          </div>
                        )}
                        {settings.receiptShowTotal !== false && (
                          <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} + 1pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '4px', marginTop: '4px' }}>
                            <span>{db.getLabel('cart_total', 'ຍອດລວມສຸດທິ:')}</span>
                            <span>{currentReceipt.total.toLocaleString()} ກີບ</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const discVal = currentReceipt.discount || 0;
                  const depVal = isDraft ? (currentReceipt.depositAmount || totalJobDeposit || 0) : totalJobDeposit;
                  const printedSubtotal = totalJobPrice;
                  
                  const printedTotal = isDraft 
                    ? (depVal > 0 ? depVal : (printedSubtotal - discVal)) 
                    : (currentReceipt.paidAmount || currentReceipt.total);

                  const remainingBalanceFinal = isDraft 
                    ? Math.max(0, printedSubtotal - discVal - depVal)
                    : Math.max(0, currentReceipt.remainingAmount !== undefined ? currentReceipt.remainingAmount : (printedSubtotal - discVal - printedTotal));

                  return (
                    <div style={{ marginTop: '6px' }}>
                      {/* Subtotal */}
                      <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: settings.receiptTotalsFontSize || '100%', marginTop: '4px' }}>
                        <span>{db.getLabel('cart_subtotal', 'ຍອດລວມກ່ອນຫຼຸດ:')}</span>
                        <span>{printedSubtotal.toLocaleString()} ກີບ</span>
                      </div>

                      {/* Discount */}
                      {discVal > 0 && (
                        <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '4px', color: '#e74c3c' }}>
                          <span>{db.getLabel('rcpt_discount_label', 'ສ່ວນຫຼຸດ:')}</span>
                          <span>-{discVal.toLocaleString()} ກີບ</span>
                        </div>
                      )}

                      {/* Deposit Paid Row */}
                      {depVal > 0 && (
                        <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1pt)`, marginTop: '4px', color: 'green' }}>
                          <span>{isDraft ? 'ເງິນມັດຈຳ / Deposit:' : 'ຫັກມັດຈຳແລ້ວ / Deposit Offset:'}</span>
                          <span>-{depVal.toLocaleString()} ກີບ</span>
                        </div>
                      )}

                      {/* Net Total */}
                      <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} + 1pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '4px', marginTop: '4px' }}>
                        <span>{isDraft ? 'ຍອດລວມທັງໝົດ:' : (depVal > 0 && remainingBalanceFinal > 0 ? 'ຍອດຊຳລະມັດຈຳ:' : 'ຍອດລວມສຸດທິ:')}</span>
                        <span>{printedTotal.toLocaleString()} ກີບ</span>
                      </div>

                      {/* Remaining Balance */}
                      {remainingBalanceFinal > 0 && (
                        <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1pt)`, marginTop: '4px', color: '#e74c3c', fontStyle: 'italic', fontWeight: 'bold' }}>
                          <span>ຍອດຄ້າງຊຳລະ / Remaining Balance:</span>
                          <span>{remainingBalanceFinal.toLocaleString()} ກີບ</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Multi-currency payment display */}
                {settings.receiptShowEquivalent !== false && currentReceipt.payCurrency && currentReceipt.payCurrency !== 'LAK' && (
                  <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontSize: settings.receiptTotalsFontSize || '100%', fontWeight: 'bold', marginTop: '4px', borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} #ccc`, paddingTop: '4px' }}>
                    <span>{db.getLabel('rcpt_payment_amount_label', 'ຍອດຊຳລະ')} ({currentReceipt.payCurrency}):</span>
                    <span>
                      {currentReceipt.payCurrency === 'USD' 
                        ? Number(currentReceipt.currencyTotal).toFixed(2) + ' USD'
                        : currentReceipt.currencyTotal.toLocaleString() + ' ບາດ'}
                    </span>
                  </div>
                )}

                {/* Cash Received and Change / Split Payment details */}
                {currentReceipt.paymentMethod === 'split' ? (
                  <>
                    <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '4px' }}>
                      <span>💵 ຮັບເງິນສົດ ({currentReceipt.payCurrency}):</span>
                      <span>
                        {currentReceipt.payCurrency === 'USD' 
                          ? Number(currentReceipt.currencyCashReceived).toFixed(2) + ' USD'
                          : currentReceipt.currencyCashReceived.toLocaleString() + ' ' + (currentReceipt.payCurrency === 'LAK' ? 'ກີບ' : 'ບາດ')}
                      </span>
                    </div>
                    <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '2px' }}>
                      <span>📱 ຍອດໂອນ ({currentReceipt.payCurrency}):</span>
                      <span>
                        {currentReceipt.payCurrency === 'USD' 
                          ? Number(currentReceipt.currencyTransferAmount).toFixed(2) + ' USD'
                          : (currentReceipt.currencyTransferAmount || 0).toLocaleString() + ' ' + (currentReceipt.payCurrency === 'LAK' ? 'ກີບ' : 'ບາດ')}
                      </span>
                    </div>
                    {currentReceipt.bankTxRef && (
                      <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '2px' }}>
                        <span>ເລກອ້າງອີງ (Ref):</span>
                        <span>{currentReceipt.bankTxRef}</span>
                      </div>
                    )}
                    <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '2px' }}>
                      <span>{db.getLabel('rcpt_change_label', 'ເງິນທອນ')}:</span>
                      <span>
                        {currentReceipt.payCurrency === 'USD' 
                          ? Number(currentReceipt.currencyChange).toFixed(2) + ' USD'
                          : currentReceipt.currencyChange.toLocaleString() + ' ' + (currentReceipt.payCurrency === 'LAK' ? 'ກີບ' : 'ບາດ')}
                      </span>
                    </div>
                  </>
                ) : settings.receiptShowChange !== false && currentReceipt.paymentMethod === 'cash' ? (
                  <>
                    <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '4px' }}>
                      <span>{db.getLabel('rcpt_received_label', 'ຮັບເງິນ')} ({currentReceipt.payCurrency}):</span>
                      <span>
                        {currentReceipt.payCurrency === 'USD' 
                          ? Number(currentReceipt.currencyCashReceived).toFixed(2) + ' USD'
                          : currentReceipt.currencyCashReceived.toLocaleString() + ' ' + (currentReceipt.payCurrency === 'LAK' ? 'ກີບ' : 'ບາດ')}
                      </span>
                    </div>
                    <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '2px' }}>
                      <span>{db.getLabel('rcpt_change_label', 'ເງິນທອນ')}:</span>
                      <span>
                        {currentReceipt.payCurrency === 'USD' 
                          ? Number(currentReceipt.currencyChange).toFixed(2) + ' USD'
                          : currentReceipt.currencyChange.toLocaleString() + ' ' + (currentReceipt.payCurrency === 'LAK' ? 'ກີບ' : 'ບາດ')}
                      </span>
                    </div>
                  </>
                ) : (
                  currentReceipt.bankTxRef && (
                    <div className="print-receipt-totals" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1.5pt)`, marginTop: '4px' }}>
                      <span>{db.getLabel('rcpt_ref_label', 'ເລກອ້າງອີງ (Ref):')}</span>
                      <span>{currentReceipt.bankTxRef}</span>
                    </div>
                  )
                )}

                {/* Exchange Rates and Equivalent conversions at bottom */}
                {settings.receiptShowEquivalent !== false && (
                  <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, fontSize: `calc(${settings.receiptFontSize || '10pt'} - 2.5pt)`, lineHeight: '1.4', color: 'black' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px', textAlign: 'center' }}>
                      {db.getLabel('rcpt_equivalent_totals_label', 'ມູນຄ່າທຽບເທົ່າ (Equivalent)')}
                    </div>
                    <table style={{ width: '100%', fontSize: `calc(${settings.receiptFontSize || '10pt'} - 2.5pt)` }}>
                      <tbody>
                        {currentReceipt.payCurrency !== 'LAK' && (
                          <tr>
                            <td>{db.getLabel('rcpt_currency_lak', 'LAK (ກີບ):')}</td>
                            <td style={{ textAlign: 'right' }}>{currentReceipt.total.toLocaleString()} ₭</td>
                          </tr>
                        )}
                        {currentReceipt.payCurrency !== 'THB' && (
                          <tr>
                            <td>{db.getLabel('rcpt_currency_thb', 'THB (ບาด):')}</td>
                            <td style={{ textAlign: 'right' }}>{Math.ceil(currentReceipt.total / (currentReceipt.exchangeRateThb || 750)).toLocaleString()} ฿</td>
                          </tr>
                        )}
                        {currentReceipt.payCurrency !== 'USD' && (
                          <tr>
                            <td>{db.getLabel('rcpt_currency_usd', 'USD (ໂດລາ):')}</td>
                            <td style={{ textAlign: 'right' }}>${(Math.ceil((currentReceipt.total / (currentReceipt.exchangeRateUsd || 26000)) * 100) / 100).toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div style={{ fontSize: `calc(${settings.receiptFontSize || '10pt'} - 3pt)`, color: '#666', marginTop: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                      {db.getLabel('rcpt_exchange_rate_label', 'ອັດຕາແລກປ່ຽນ:')} 1 THB = {currentReceipt.exchangeRateThb || 750} ₭ | 1 USD = {currentReceipt.exchangeRateUsd || 26000} ₭
                    </div>
                  </div>
                )}

                {settings.showQrOnReceipt && (
                  <div style={{ marginTop: settings.receiptQrMarginTop || '12px', textAlign: 'center', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '8px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{db.getLabel('rcpt_qr_payment_title', 'QR Code ຮັບເງິນ (BCEL One)')}</p>
                    <p>{db.getLabel('rcpt_bank_account_name_label', 'ຊື່ບັນຊີ:')} {settings.bankAccountName}</p>
                    <p>{db.getLabel('rcpt_bank_account_no_label', 'ເລກບັນຊີ:')} {settings.bankAccountNumber}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                      {(receiptQrUrl || settings.bankQrTemplate) ? (
                        <img
                          src={receiptQrUrl || (settings.bankQrTemplate.startsWith('data:image/') ? settings.bankQrTemplate : settings.bankQrTemplate + (currentReceipt.paidAmount || currentReceipt.total))}
                          alt="BCEL One QR Receipt"
                          style={{
                            width: getQrSizePx(settings.receiptQrSize),
                            height: getQrSizePx(settings.receiptQrSize),
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '8px', color: '#999', margin: '10px 0' }}>
                          (ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ QR Code)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Track Status QR Code (Amulet custom tracking) */}
                {(() => {
                  const jobItem = currentReceipt.items.find(item => item.productId && item.productId.startsWith('JOB'));
                  return settings.receiptShowTrackingQr !== false && jobItem && trackingQrUrl ? (
                    <div style={{ marginTop: '10px', textAlign: 'center', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '8px', color: 'black' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>🔍 ສະແກນຕິດຕາມສະຖານະລາຍການ (Scan to Track)</p>
                      <p style={{ fontSize: '0.72rem', color: '#555' }}>ຕິດຕາມຂັ້ນຕອນການອັດກອບພຣະເຄື່ອງຂອງທ່ານແບບ Real-time</p>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                        <img
                          src={trackingQrUrl}
                          alt="Tracking QR Code"
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>ເລກທີງານ: {jobItem.productId}</p>
                    </div>
                  ) : null;
                })()}

                {/* Signatures */}
                {settings.receiptShowSignatures !== false && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', marginBottom: '10px', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, textAlign: 'center', color: 'black' }}>
                    <div style={{ width: '45%' }}>
                      <div>..................................</div>
                      <div style={{ marginTop: '2px' }}>{db.getLabel('rcpt_paid_by', 'ຜູ້ຈ່າຍເງິນ (Paid By)')}</div>
                    </div>
                    <div style={{ width: '45%' }}>
                      <div>..................................</div>
                      <div style={{ marginTop: '2px' }}>{db.getLabel('rcpt_received_by', 'ຜູ້ຮັບເງິນ (Received By)')}</div>
                    </div>
                  </div>
                )}

                {settings.receiptShowFooter !== false && (
                  <div className="print-receipt-footer" style={{ textStyle: 'center', fontSize: settings.receiptFooterFontSize || 'calc(100% - 2pt)', marginTop: '10px', borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '5px', textAlign: 'center' }}>
                    <p>{settings.receiptFooterNote || 'ພຣະເຄື່ອງຄຸ້ມຄອງ, ໂຊກດີ ມີໄຊ!'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowReceipt(false)}>ປິດ</button>
              <button className="btn btn-primary" onClick={handlePrint}>🖨️ ປຣິນໃບບິນ</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Add Custom Job Modal */}
      {showFramingAddModal && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content modal-md animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">➕ ລົງທະບຽນຮັບງານອັດກອບພຣະເຄື່ອງ</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowFramingAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddFramingSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ຄิວ/ບັດຄິວ (Slot ID)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={slots[framingFormData.slotId]?.label || framingFormData.slotId}
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ຊື່ລູກຄ້າ (Customer Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={framingFormData.customerName}
                    onChange={(e) => setFramingFormData({ ...framingFormData, customerName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ເບີໂທຕິດຕໍ່ (Phone)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={framingFormData.customerPhone}
                    onChange={(e) => setFramingFormData({ ...framingFormData, customerPhone: e.target.value })}
                  />
                </div>

                {/* Dynamic Amulets list */}
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📿 ລາຍການພຣະເຄື່ອງ ({framingFormData.amulets?.length || 0} ອົງ)</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={() => {
                        let defaultFrame = products.find(p => p.category === 'frames') || products.find(p => !db.isServiceCategory(p.category)) || products.find(p => db.isServiceCategory(p.category));
                        const newAmulets = [...(framingFormData.amulets || [])];
                        newAmulets.push({
                          id: Date.now() + Math.random(),
                          description: '',
                          frameTypeId: defaultFrame ? defaultFrame.id : 'S001',
                          frameTypeName: defaultFrame ? defaultFrame.name : 'ອັດກັນນ້ຳພິເສດ',
                          price: defaultFrame ? Number(defaultFrame.price) : 60000,
                          image: ''
                        });
                        const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                        setFramingFormData({
                          ...framingFormData,
                          amulets: newAmulets,
                          totalPrice
                        });
                      }}
                    >
                      ➕ ເພີ່ມພຣະເຄື່ອງອີກອົງ
                    </button>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto', padding: '6px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {(framingFormData.amulets || []).map((amulet, index) => (
                      <div key={amulet.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>ອົງທີ {index + 1}</span>
                          {framingFormData.amulets.length > 1 && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '0.75rem' }}
                              onClick={() => {
                                  const newAmulets = framingFormData.amulets.filter(a => a.id !== amulet.id);
                                  const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                                  setFramingFormData({
                                    ...framingFormData,
                                    amulets: newAmulets,
                                    totalPrice
                                  });
                              }}
                            >
                              ✕ ລຶບອອກ
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            placeholder="ລາຍລະອຽດພຣະ (ຊື່ພຣະເຄື່ອງ...)"
                            required
                            value={amulet.description}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              newAmulets[index].description = e.target.value;
                              setFramingFormData({ ...framingFormData, amulets: newAmulets });
                            }}
                          />

                          <select
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            value={amulet.frameTypeId}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              const selProd = products.find(p => p.id === e.target.value);
                              newAmulets[index].frameTypeId = e.target.value;
                              newAmulets[index].frameTypeName = selProd ? selProd.name : 'ອັດກອບ';
                              newAmulets[index].price = selProd ? Number(selProd.price) : 60000;
                              
                              const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                              setFramingFormData({
                                ...framingFormData,
                                amulets: newAmulets,
                                totalPrice
                              });
                            }}
                          >
                            {(products.filter(p => p.category === 'frames' || db.isServiceCategory(p.category) || p.name.toLowerCase().includes('ກອບ') || p.name.toLowerCase().includes('ອັດ')).length > 0
                              ? products.filter(p => p.category === 'frames' || db.isServiceCategory(p.category) || p.name.toLowerCase().includes('ກອບ') || p.name.toLowerCase().includes('ອັດ'))
                              : products
                            ).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString()} ₭)</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ລາຄາ:</span>
                            <input
                              type="number"
                              className="form-control"
                              style={{ padding: '4px 6px', fontSize: '0.8rem', height: '30px' }}
                              required
                              value={amulet.price}
                              onChange={(e) => {
                                const newAmulets = [...framingFormData.amulets];
                                newAmulets[index].price = Number(e.target.value);
                                const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                                setFramingFormData({
                                  ...framingFormData,
                                  amulets: newAmulets,
                                  totalPrice
                                });
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <input
                              type="file"
                              accept="image/*"
                              id={`amulet-add-img-${amulet.id}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const newAmulets = [...framingFormData.amulets];
                                    newAmulets[index].image = ev.target.result;
                                    setFramingFormData({ ...framingFormData, amulets: newAmulets });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label htmlFor={`amulet-add-img-${amulet.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              📷 {amulet.image ? 'ປ່ຽນຮູບ' : 'ເພີ່ມຮູບ'}
                            </label>
                            {amulet.image && (
                              <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                                <img src={amulet.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                <button
                                  type="button"
                                  style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'red', fontSize: '0.6rem', padding: '0 2px', cursor: 'pointer' }}
                                  onClick={() => {
                                    const newAmulets = [...framingFormData.amulets];
                                    newAmulets[index].image = '';
                                    setFramingFormData({ ...framingFormData, amulets: newAmulets });
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Specs fields input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            value={amulet.frameStyle || (settings.frameStyles?.[0] || 'ກອບໃສ')}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              newAmulets[index].frameStyle = e.target.value;
                              setFramingFormData({ ...framingFormData, amulets: newAmulets });
                            }}
                          >
                            {(settings.frameStyles || ['ກອບໃສ', 'ກອບສີ', 'ເລເຊີລາຍ', 'ກັນນ້ຳ 100%']).map(style => (
                              <option key={style} value={style}>{style}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            placeholder="ໝາຍເຫດພິເສດ (ເຊັ່ນ: ກອບໜາ, ຢາງແດງ...)"
                            value={amulet.specialNotes || ''}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              newAmulets[index].specialNotes = e.target.value;
                              setFramingFormData({ ...framingFormData, amulets: newAmulets });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">ລາຄາລວມທັງໝົດ (ກີບ)</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      readOnly
                      value={framingFormData.totalPrice}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--gold-primary)', fontWeight: 'bold' }}
                    />
                  </div>
                  
                </div>

                <div className="form-group">
                  <label className="form-label">ກຳນົດເວລາມາຮັບພຣະ (Pickup Date/Time)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={framingFormData.pickupDate}
                    onChange={(e) => setFramingFormData({ ...framingFormData, pickupDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ໝາຍເຫດເພີ່ມເຕີມ/ຄວາມຕ້ອງການພິເສດ</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={framingFormData.notes}
                    onChange={(e) => setFramingFormData({ ...framingFormData, notes: e.target.value })}
                    placeholder="ເຊັ່ນ: ຂໍຫ່ວງຂອບໜາ, ໃສ່ຢາງແດງ, ອັດກັນນ້ຳ 2 ຊັ້ນ..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowFramingAddModal(false);
                  setFramingError('');
                  setFramingFormData({
                    customerName: '',
                    customerPhone: '',
                    amuletDescription: '',
                    frameTypeId: 'S001',
                    totalPrice: '',
                    deposit: '',
                    notes: '',
                    pickupDate: '',
                    status: 'pending',
                    amuletImage: '',
                    slotId: 'Walk-In',
                    amulets: []
                  });
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">ຢືນຢັນ & ພິມໃບບິນຝາກ</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Edit Framing Job Modal */}
      {showFramingEditModal && currentFramingJob && (
        <Portal>
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span className="modal-title">📝 ແກ້ໄຂຂໍ້ມູນງານອັດກອບພຣະເຄື່ອງ ({currentFramingJob.id})</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => { setShowFramingEditModal(false); setCurrentFramingJob(null); }}>✕</button>
            </div>
            
            <form onSubmit={handleEditFramingSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ຄິວ/ບັດຄິວ (Slot ID)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={slots[framingFormData.slotId]?.label || framingFormData.slotId}
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ຊື່ລູກຄ້າ (Customer Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={framingFormData.customerName}
                    onChange={(e) => setFramingFormData({ ...framingFormData, customerName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ເບີໂທຕິດຕໍ່ (Phone)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={framingFormData.customerPhone}
                    onChange={(e) => setFramingFormData({ ...framingFormData, customerPhone: e.target.value })}
                  />
                </div>

                {/* Dynamic Amulets list */}
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📿 ລາຍການພຣະເຄື່ອງ ({framingFormData.amulets?.length || 0} ອົງ)</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={() => {
                        let defaultFrame = products.find(p => p.category === 'frames') || products.find(p => !db.isServiceCategory(p.category)) || products.find(p => db.isServiceCategory(p.category));
                        const newAmulets = [...(framingFormData.amulets || [])];
                        newAmulets.push({
                          id: Date.now() + Math.random(),
                          description: '',
                          frameTypeId: defaultFrame ? defaultFrame.id : 'S001',
                          frameTypeName: defaultFrame ? defaultFrame.name : 'ອັດກັນນ້ຳພິເສດ',
                          price: defaultFrame ? Number(defaultFrame.price) : 60000,
                          image: ''
                        });
                        const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                        setFramingFormData({
                          ...framingFormData,
                          amulets: newAmulets,
                          totalPrice
                        });
                      }}
                    >
                      ➕ ເພີ່ມພຣະເຄື່ອງອີກອົງ
                    </button>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto', padding: '6px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {(framingFormData.amulets || []).map((amulet, index) => (
                      <div key={amulet.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 'bold' }}>ອົງທີ {index + 1}</span>
                          {framingFormData.amulets.length > 1 && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontSize: '0.75rem' }}
                              onClick={() => {
                                  const newAmulets = framingFormData.amulets.filter(a => a.id !== amulet.id);
                                  const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                                  setFramingFormData({
                                    ...framingFormData,
                                    amulets: newAmulets,
                                    totalPrice
                                  });
                              }}
                            >
                              ✕ ລຶບອອກ
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            placeholder="ລາຍລະອຽດພຣະ (ຊື່ພຣະເຄື່ອງ...)"
                            required
                            value={amulet.description}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              newAmulets[index].description = e.target.value;
                              setFramingFormData({ ...framingFormData, amulets: newAmulets });
                            }}
                          />

                          <select
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            value={amulet.frameTypeId}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              const selProd = products.find(p => p.id === e.target.value);
                              newAmulets[index].frameTypeId = e.target.value;
                              newAmulets[index].frameTypeName = selProd ? selProd.name : 'ອັດກອບ';
                              newAmulets[index].price = selProd ? Number(selProd.price) : 60000;
                              
                              const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                              setFramingFormData({
                                ...framingFormData,
                                amulets: newAmulets,
                                totalPrice
                              });
                            }}
                          >
                            {(products.filter(p => p.category === 'frames' || db.isServiceCategory(p.category) || p.name.toLowerCase().includes('ກອບ') || p.name.toLowerCase().includes('ອັດ')).length > 0
                              ? products.filter(p => p.category === 'frames' || db.isServiceCategory(p.category) || p.name.toLowerCase().includes('ກອບ') || p.name.toLowerCase().includes('ອັດ'))
                              : products
                            ).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString()} ₭)</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ລາຄາ:</span>
                            <input
                              type="number"
                              className="form-control"
                              style={{ padding: '4px 6px', fontSize: '0.8rem', height: '30px' }}
                              required
                              value={amulet.price}
                              onChange={(e) => {
                                const newAmulets = [...framingFormData.amulets];
                                newAmulets[index].price = Number(e.target.value);
                                const totalPrice = newAmulets.reduce((sum, a) => sum + Number(a.price || 0), 0);
                                setFramingFormData({
                                  ...framingFormData,
                                  amulets: newAmulets,
                                  totalPrice
                                });
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <input
                              type="file"
                              accept="image/*"
                              id={`amulet-edit-img-${amulet.id}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const newAmulets = [...framingFormData.amulets];
                                    newAmulets[index].image = ev.target.result;
                                    setFramingFormData({ ...framingFormData, amulets: newAmulets });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label htmlFor={`amulet-edit-img-${amulet.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              📷 {amulet.image ? 'ປ່ຽນຮູບ' : 'ເພີ່ມຮູບ'}
                            </label>
                            {amulet.image && (
                              <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                                <img src={amulet.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                <button
                                  type="button"
                                  style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'red', fontSize: '0.6rem', padding: '0 2px', cursor: 'pointer' }}
                                  onClick={() => {
                                    const newAmulets = [...framingFormData.amulets];
                                    newAmulets[index].image = '';
                                    setFramingFormData({ ...framingFormData, amulets: newAmulets });
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Specs fields input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            value={amulet.frameStyle || (settings.frameStyles?.[0] || 'ກອບໃສ')}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              newAmulets[index].frameStyle = e.target.value;
                              setFramingFormData({ ...framingFormData, amulets: newAmulets });
                            }}
                          >
                            {(settings.frameStyles || ['ກອບໃສ', 'ກອບສີ', 'ເລເຊີລາຍ', 'ກັນນ້ຳ 100%']).map(style => (
                              <option key={style} value={style}>{style}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            className="form-control"
                            style={{ padding: '6px', fontSize: '0.8rem' }}
                            placeholder="ໝາຍເຫດພິເສດ (ເຊັ່ນ: ກອບໜາ, ຢາງແດງ...)"
                            value={amulet.specialNotes || ''}
                            onChange={(e) => {
                              const newAmulets = [...framingFormData.amulets];
                              newAmulets[index].specialNotes = e.target.value;
                              setFramingFormData({ ...framingFormData, amulets: newAmulets });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">ລາຄາລວມທັງໝົດ (ກີບ)</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      readOnly
                      value={framingFormData.totalPrice}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--gold-primary)', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ເງິນມັດຈຳ (ກີບ)</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={framingFormData.deposit}
                      onChange={(e) => setFramingFormData({ ...framingFormData, deposit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ສະຖານະ</label>
                  <select
                    className="form-control"
                    value={framingFormData.status}
                    onChange={(e) => setFramingFormData({ ...framingFormData, status: e.target.value })}
                  >
                    <option value="pending">ລໍຖ້າຄິວ (Pending)</option>
                    <option value="framing">ກຳລັງອັດ (Framing)</option>
                    <option value="done">ອັດສຳເລັດ (Ready)</option>
                    <option value="picked_up">ຮັບໄປແລ້ວ (Picked Up)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ກຳນົດເວລາມາຮັບພຣະ (Pickup Date/Time)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={framingFormData.pickupDate}
                    onChange={(e) => setFramingFormData({ ...framingFormData, pickupDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ໝາຍເຫດເພີ່ມເຕີມ/ຄວາມຕ້ອງການພິເສດ</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={framingFormData.notes}
                    onChange={(e) => setFramingFormData({ ...framingFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowFramingEditModal(false);
                  setCurrentFramingJob(null);
                  setFramingError('');
                  setFramingFormData({
                    customerName: '',
                    customerPhone: '',
                    amuletDescription: '',
                    frameTypeId: 'S001',
                    totalPrice: '',
                    deposit: '',
                    notes: '',
                    pickupDate: '',
                    status: 'pending',
                    amuletImage: '',
                    slotId: 'Walk-In',
                    amulets: []
                  });
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">💾 ບັນທຶກການແກ້ໄຂ</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* Print Framing Job Ticket Modal */}
      {showFramingPrintModal && currentFramingJob && (
        <Portal>
        <div className="modal-overlay print-modal">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header no-print">
              <span className="modal-title">🎫 ໃບບິນຮັບຝາກພຣະ (Job Receipt)</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowFramingPrintModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ background: 'white', padding: '16px', display: 'flex', justifyContent: 'center' }}>
              
              {/* Printable Ticket Receipt */}
              <div 
                className="print-receipt-container"
                style={{
                  width: settings.receiptPaperWidth || '80mm',
                  fontSize: settings.receiptFontSize || '10pt',
                  padding: settings.receiptPadding || '5mm',
                  background: 'white',
                  color: 'black',
                  lineHeight: settings.receiptLineHeight || '1.3',
                  marginLeft: settings.receiptMarginLeft || '0mm',
                  marginRight: settings.receiptMarginRight || '0mm',
                  marginTop: settings.receiptMarginTop || '0mm',
                  marginBottom: settings.receiptMarginBottom || '0mm'
                }}
              >
                <div className="print-receipt-header">
                  {settings.receiptShowLogo !== false && (
                    settings.receiptLogoUrl ? (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                        <img src={settings.receiptLogoUrl} alt="Receipt Logo Custom" style={{ width: settings.receiptLogoWidth || '60px', height: settings.receiptLogoWidth || '60px', borderRadius: settings.receiptLogoShape || '50%', objectFit: 'cover' }} />
                      </div>
                    ) : settings.shopLogo ? (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                        <img src={settings.shopLogo} alt="Shop Logo" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                      </div>
                    ) : null
                  )}
                  {settings.receiptShowHeader !== false && (
                    <div className="print-receipt-title" style={{ fontWeight: 'bold', fontSize: settings.receiptHeaderFontSize || 'calc(100% + 3pt)', textAlign: 'center' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                  )}
                  {settings.receiptShowContactInfo !== false && (
                    <>
                      <div className="print-receipt-subtitle" style={{ fontSize: settings.receiptContactFontSize || 'calc(100% - 2pt)', textAlign: 'center' }}>{settings.receiptHeaderNote || settings.shopSubtitle || 'ໃບບິນຮັບຝາກອັດກອບພຣະເຄື່ອງ'}</div>
                      <div className="print-receipt-subtitle" style={{ fontSize: settings.receiptContactFontSize || 'calc(100% - 2pt)', textAlign: 'center' }}>{settings.shopAddress} | ໂທ: {settings.shopPhone}</div>
                      <div className="print-receipt-subtitle" style={{ fontSize: `calc(${settings.receiptContactFontSize || 'calc(100% - 2pt)'} - 0.5pt)`, textAlign: 'center', fontStyle: 'italic', fontWeight: 'bold' }}>(ໃບບິນຮັບຝາກອັດກອບ - ສຳເນົາລູກຄ້າ)</div>
                    </>
                  )}
                </div>

                <div style={{ fontSize: settings.receiptItemsFontSize || 'calc(100% - 2pt)', marginBottom: '6px' }}>
                  {settings.receiptShowBillId !== false && <div><b>Job ID:</b> {currentFramingJob.id}</div>}
                  <div><b>ຄິວ/ບັດຄິວ:</b> {slots[currentFramingJob.slotId]?.label || currentFramingJob.slotId}</div>
                  {settings.receiptShowDate !== false && (
                    <>
                      <div><b>ວັນທີຝາກ:</b> {new Date(currentFramingJob.createdDate).toLocaleString('lo-LA')}</div>
                      <div><b>ກຳນົດຮັບພຣະ:</b> {new Date(currentFramingJob.pickupDate).toLocaleString('lo-LA')}</div>
                    </>
                  )}
                  {settings.receiptShowCustomer !== false && (
                    <div><b>ລູກຄ້າ:</b> {currentFramingJob.customerName} ({currentFramingJob.customerPhone})</div>
                  )}
                </div>

                <div className="print-receipt-divider"></div>

                <div style={{ fontSize: settings.receiptItemsFontSize || 'calc(100% - 1.5pt)', margin: '6px 0' }}>
                  {currentFramingJob.amulets && currentFramingJob.amulets.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '3px', marginBottom: '3px' }}>ລາຍການພຣະເຄື່ອງ:</div>
                      {currentFramingJob.amulets.map((a, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', paddingBottom: '4px', borderBottom: idx < currentFramingJob.amulets.length - 1 ? '1px dashed #eee' : 'none' }}>
                          {a.image && (
                            <img src={a.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} alt="" />
                          )}
                          <div style={{ flex: 1, fontSize: '0.85rem' }}>
                            <div><b>{idx + 1}. {a.description || 'ພຣະເຄື່ອງ'}</b></div>
                            <div style={{ color: '#555', fontSize: '0.8rem' }}>ກອບ: {a.frameTypeName || 'ອັດກອບ'}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '2px' }}>
                              <span>ລາຄา:</span>
                              <span style={{ fontWeight: 'bold' }}>{Number(a.price || 0).toLocaleString()} ກີບ</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p><b>ລາຍລະອຽດພຣະ:</b> {currentFramingJob.amuletDescription}</p>
                      <p><b>ຮູບແບບກອບ:</b> {currentFramingJob.frameTypeName}</p>
                    </>
                  )}
                  {currentFramingJob.notes && <p style={{ marginTop: '6px' }}><b>ໝາຍເຫດ:</b> <span style={{ textDecoration: 'underline' }}>{currentFramingJob.notes}</span></p>}
                </div>

                <div className="print-receipt-divider"></div>

                {settings.receiptShowTotal !== false && (
                  <>
                    <div className="print-receipt-totals" style={{ fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1pt)`, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຄ່າອັດກອບທັງໝົດ:</span>
                      <span>{currentFramingJob.totalPrice.toLocaleString()} ກີບ</span>
                    </div>
                    <div className="print-receipt-totals" style={{ fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 1pt)`, fontWeight: 'normal', display: 'flex', justifyContent: 'space-between' }}>
                      <span>ມັດຈຳແລ້ວ:</span>
                      <span>-{currentFramingJob.deposit.toLocaleString()} ກີບ</span>
                    </div>
                    <div className="print-receipt-totals" style={{ fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} + 0.5pt)`, fontWeight: 'bold', borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຍອດຄ້າງຊຳລະ:</span>
                      <span style={{ textDecoration: 'underline' }}>{currentFramingJob.balance.toLocaleString()} ກີບ</span>
                    </div>
                  </>
                )}

                {/* BCEL Transfer QR Details for Deposit */}
                {settings.showQrOnReceipt && (
                  <div style={{ marginTop: settings.receiptQrMarginTop || '12px', textAlign: 'center', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, paddingTop: '8px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{settings.bankName}: {settings.bankAccountNumber}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                      {(depositQrUrl || settings.bankQrTemplate) ? (
                        <img
                          src={depositQrUrl || (settings.bankQrTemplate.startsWith('data:image/') ? settings.bankQrTemplate : `${settings.bankQrTemplate}${currentFramingJob.balance}`)}
                          alt="BCEL Deposit QR"
                          style={{
                            width: getQrSizePx(settings.receiptQrSize),
                            height: getQrSizePx(settings.receiptQrSize),
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '8px', color: '#999', margin: '10px 0' }}>
                          (ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ QR Code)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Job ticket barcode for scan-to-retrieve */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}>
                  <canvas ref={framingBarcodeCanvasRef} width="220" height="75" />
                  <p style={{ fontSize: `calc(${settings.receiptFontSize || '10pt'} - 3.5pt)`, color: '#666', marginTop: '2px' }}>*ນຳໃບບິນນີ້ມາສະແກນຮັບພຣະເຄື່ອງຄືນ</p>
                </div>

                {/* Signatures */}
                {settings.receiptShowSignatures !== false && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', marginBottom: '10px', fontSize: `calc(${settings.receiptTotalsFontSize || '100%'} - 2.5pt)`, textAlign: 'center', color: 'black' }}>
                    <div style={{ width: '45%' }}>
                      <div>..................................</div>
                      <div style={{ marginTop: '2px' }}>{db.getLabel('rcpt_paid_by', 'ຜູ້ຈ່າຍເງິນ (Paid By)')}</div>
                    </div>
                    <div style={{ width: '45%' }}>
                      <div>..................................</div>
                      <div style={{ marginTop: '2px' }}>{db.getLabel('rcpt_received_by', 'ຜູ້ຮັບເງິນ (Received By)')}</div>
                    </div>
                  </div>
                )}

                {settings.receiptShowFooter !== false && (
                  <div className="print-receipt-footer" style={{ borderTop: `${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black`, marginTop: '10px', paddingTop: '5px', textAlign: 'center', fontSize: settings.receiptFooterFontSize || 'calc(100% - 2pt)' }}>
                    <p>{settings.receiptFooterNote || 'ກະລຸນາກວດສອບພຣະເຄື່ອງ ແລະ ຂອບ ກ່ອນອອກຈາກຮ້าน'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowFramingPrintModal(false)}>ປິດ</button>
              <button className="btn btn-primary" onClick={handlePrint}>🖨️ ປຣິນໃບບິນຮັບຝາກ</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Mobile FAB to Add Queue Slot */}
      <button 
        type="button" 
        className="fab-btn" 
        onClick={() => setShowAddSlotModal(true)} 
        title="ເພີ່ມບັດຄິວ (Add Queue)"
      >
        ➕
      </button>

      {/* Deposit Input Dialog Modal - Simplified Amount Entry */}
      {showDepositInputModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '450px',
            width: '95%',
            borderRadius: '0',
            border: '1px solid rgba(212,175,55,0.25)',
            background: 'linear-gradient(145deg, #1a1614 0%, #0f0d0b 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(212,175,55,0.05)',
            padding: 0,
            overflow: 'hidden',
            height: '100dvh',
            maxHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
              borderBottom: '1px solid rgba(212,175,55,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                💰 ກຳນົດເງິນມັດຈຳ (Set Deposit)
              </span>
              <button
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowDepositInputModal(false)}
              >✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
              {/* Amount input */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>
                  💰 ຈຳນວນເງິນມັດຈຳ (Deposit Amount)
                </label>
                <input
                  type="number"
                  className="form-control"
                  autoFocus
                  required
                  value={depositInputVal}
                  onChange={(e) => setDepositInputVal(e.target.value)}
                  style={{
                    width: '100%', fontSize: '2.2rem', fontWeight: 'bold', textAlign: 'center',
                    padding: '12px', background: 'rgba(0,0,0,0.3)',
                    border: depositInputVal && Number(depositInputVal) > 0
                      ? '2px solid rgba(46,204,113,0.5)' : '1.5px solid rgba(212,175,55,0.4)',
                    borderRadius: '12px', color: 'white', outline: 'none'
                  }}
                  placeholder="0"
                />
                {/* Quick-pick % buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginTop: '10px' }}>
                  {[10, 20, 30, 50].map(pct => (
                    <button key={pct} type="button"
                      onClick={() => setDepositInputVal(String(Math.round(grandTotal * pct / 100)))}
                      style={{
                        padding: '7px 4px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)',
                        background: 'rgba(212,175,55,0.08)', color: 'var(--gold-primary)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold'
                      }}
                    >{pct}%</button>
                  ))}
                </div>
                {/* Summary bar */}
                <div style={{
                  marginTop: '10px', display: 'flex', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>ຍອດລວມ:</span>
                  <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{grandTotal.toLocaleString()} ₭</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>ຄ້າງຈ່າຍ:</span>
                  <span style={{ color: depositInputVal && Number(depositInputVal) > 0 ? '#e67e22' : '#888', fontWeight: 'bold' }}>
                    {depositInputVal && Number(depositInputVal) > 0
                      ? Math.max(0, grandTotal - Number(depositInputVal)).toLocaleString()
                      : grandTotal.toLocaleString()} ₭
                  </span>
                </div>
              </div>

              {/* Live QR preview for deposit amount */}
              {(depositModalQrUrl || settings.bankQrTemplate) && depositInputVal && Number(depositInputVal) > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                    📱 QR ສຳລັບຍອດມັດຈຳ — ລູກຄ້າໂອນ {Number(depositInputVal).toLocaleString()} ₭
                  </div>
                  <div style={{ display: 'inline-block', padding: '10px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <img
                      src={depositModalQrUrl || settings.bankQrTemplate}
                      alt="Deposit QR"
                      style={{ width: '140px', height: '140px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '6px' }}>
                    {settings.bankName} · {settings.bankAccountNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDepositInputModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px' }}
              >✕ ຍົກເລີກ</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const val = Number(depositInputVal || 0);
                  if (val < 0) {
                    alert("ຍອດເງິນມັດຈຳບໍ່ສາມາດຕິດລົບໄດ້!");
                    return;
                  }
                  if (val > grandTotal) {
                    if (!window.confirm("ຄຳເຕືອນ: ຍອດເງິນມັດຈຳກາຍຍອດລວມທັງໝົດ! ຕ້ອງການບັນທຶກແທ້ບໍ່?")) {
                      return;
                    }
                  }

                  const updatedSlots = { ...slots };
                  const targetSlotId = selectedSlotId || 'Walk-In';
                  if (updatedSlots[targetSlotId]) {
                    updatedSlots[targetSlotId].depositAmount = val;
                    // Reset deposit payment options (they will select it in checkout modal)
                    updatedSlots[targetSlotId].depositPayMethod = 'cash';
                    updatedSlots[targetSlotId].depositPayCurrency = 'LAK';
                    updatedSlots[targetSlotId].depositBankTxRef = '';
                    updatedSlots[targetSlotId].depositCashReceived = '';
                    updatedSlots[targetSlotId].depositTransferAmount = '';
                    
                    db.saveSlots(updatedSlots);
                    setSlots(updatedSlots);

                    const allJobs = db.getFramingJobs();
                    allJobs.forEach(job => {
                      if (job.slotId === targetSlotId && job.status !== 'picked_up') {
                        db.updateFramingJob({
                          ...job,
                          deposit: val,
                          balance: Math.max(0, job.totalPrice - val)
                        });
                      }
                    });
                  }
                  setShowDepositInputModal(false);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #d4af37, #f5d76e)',
                  border: 'none',
                  color: '#1a1614',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                  cursor: 'pointer'
                }}
              >✓ ຢືນຢັນ</button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}