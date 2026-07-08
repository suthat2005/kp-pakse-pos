import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

export default function Reports({ activeUser, isMobile }) {
  const hasReportsPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  // Interactive Chart Style States
  const [trendChartStyle, setTrendChartStyle] = useState(localStorage.getItem('rep_trend_style') || '3d-ribbon');
  const [categoryChartStyle, setCategoryChartStyle] = useState(localStorage.getItem('rep_category_style') || '3d-donut');
  const [debtChartStyle, setDebtChartStyle] = useState(localStorage.getItem('rep_debt_style') || '3d-bar');
  
  // Date states
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('today'); // 'today', '7days', '30days', 'year', 'custom'
  
  // Database states
  const [allOrders, setAllOrders] = useState([]);
  const [allDebts, setAllDebts] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allOnlineOrders, setAllOnlineOrders] = useState([]);
  const [settings, setSettings] = useState({
    shopName: '',
    shopSubtitle: '',
    shopPhone: '',
    shopAddress: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankQrTemplate: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTab, setReportTab] = useState('pos'); // 'pos' | 'online' | 'overview'
  
  // Archive View Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);

  // Delete Bill PIN Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'pos' | 'debt' | 'online', id: string, label: string }
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Load database items on start and when database events fire
  const loadData = () => {
    setAllOrders(db.getOrders());
    setAllDebts(db.getDebts());
    setAllJobs(db.getFramingJobs());
    setAllExpenses(db.getExpenses());
    setAllProducts(db.getProducts());
    setCategories(db.getCategories());
    setSettings(db.getSettings());
    if (typeof db.getOnlineOrders === 'function') {
      setAllOnlineOrders(db.getOnlineOrders());
    }
  };

  useEffect(() => {
    loadData();
    
    // Setup background and multi-tab listeners
    window.addEventListener('db-updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('db-updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const handleReprint = (order) => {
    setSelectedReceipt(order);
    setShowReprintModal(true);
  };

  const executePrint = () => {
    window.print();
  };

  const handleRequestDelete = (type, id, label) => {
    setDeleteTarget({ type, id, label });
    setDeletePin('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    const users = db.getUsers();
    const currentSettings = db.getSettings();
    const matchedOwner = users.find(u => u.role === 'owner' && u.passcode === deletePin);
    const isMasterPin = deletePin === currentSettings.masterAdminPin;

    if (!matchedOwner && !isMasterPin) {
      setDeleteError('🔒 ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ! ບໍ່ມີສິດລຶບ.');
      return;
    }

    if (deleteTarget.type === 'pos') {
      const orders = db.getOrders();
      const filtered = orders.filter(o => o.id !== deleteTarget.id);
      db.saveOrders(filtered);
      db.addAuditLog(
        'success_pin',
        `ລຶບບິນຂາຍໜ້າຮ້ານ ID: ${deleteTarget.id} (ອະນຸມັດໂດຍ Admin PIN)`,
        'warning'
      );
    } else if (deleteTarget.type === 'debt') {
      const debts = db.getDebts();
      const filtered = debts.filter(d => d.id !== deleteTarget.id);
      db.saveDebts(filtered);
      db.addAuditLog(
        'success_pin',
        `ລຶບບິນຕິດໜີ້ ID: ${deleteTarget.id} (ອະນຸມັດໂດຍ Admin PIN)`,
        'warning'
      );
    } else if (deleteTarget.type === 'online') {
      const online = db.getOnlineOrders();
      const filtered = online.filter(o => o.id !== deleteTarget.id);
      db.saveOnlineOrders(filtered);
      db.addAuditLog(
        'success_pin',
        `ລຶບບິນຂາຍອອນລາຍ ID: ${deleteTarget.id} (ອະນຸມັດໂດຍ Admin PIN)`,
        'warning'
      );
    }

    alert('✓ ລຶບໃບບິນສຳເລັດ!');
    setShowDeleteModal(false);
    setDeleteTarget(null);
    loadData();
  };

  // Preset setter
  const setDatePreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const d = new Date();
      d.setDate(d.getDate() - 364);
      setStartDate(d.toLocaleDateString('en-CA'));
      setEndDate(todayStr);
    }
  };

  // Convert dates to range-safe timezone boundaries
  const start = startDate ? new Date(startDate + 'T00:00:00') : null;
  const end = endDate ? new Date(endDate + 'T23:59:59') : null;

  // Filter lists for selected range
  const allPayments = db.getOrderPayments();
  const rangePayments = allPayments.filter(p => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    const d = new Date(p.date);
    return d >= start && d <= end;
  });

  const rangeOrders = allOrders.filter(o => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    const d = new Date(o.date);
    return d >= start && d <= end;
  });

  const rangeDebts = allDebts.filter(d => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    const debtDate = new Date(d.date);
    return debtDate >= start && debtDate <= end;
  });

  const rangeExpenses = allExpenses.filter(ex => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    const d = new Date(ex.date);
    return d >= start && d <= end;
  });

  const rangeJobs = allJobs.filter(j => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    const d = new Date(j.createdDate);
    return d >= start && d <= end;
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset('custom');
    setSearchQuery('');
  };

  // Calculate statistics
  const totalSales = rangePayments.reduce((sum, p) => sum + p.amount_paid, 0);
  
  // Calculate cash vs. transfer totals for the selected range grouped by currency
  let rangeCashLAK = 0;
  let rangeCashTHB = 0;
  let rangeCashUSD = 0;
  
  let rangeTransferLAK = 0;
  let rangeTransferTHB = 0;
  let rangeTransferUSD = 0;
  
  rangePayments.forEach(p => {
    const amt = p.amount_paid;
    const currency = p.payCurrency || 'LAK';
    
    if (p.payment_method === 'Cash') {
      if (currency === 'LAK') rangeCashLAK += amt;
      else if (currency === 'THB') rangeCashTHB += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
      else if (currency === 'USD') rangeCashUSD += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
    } else if (p.payment_method === 'BCEL One') {
      if (currency === 'LAK') rangeTransferLAK += amt;
      else if (currency === 'THB') rangeTransferTHB += (p.currencyTransferAmount || p.currencyCashReceived || 0);
      else if (currency === 'USD') rangeTransferUSD += (p.currencyTransferAmount || p.currencyCashReceived || 0);
    } else if (p.payment_method === 'Split') {
      // Split payment has both cash and transfer portions
      const transferAmt = p.transferAmount || 0;
      const transferCurrAmt = p.currencyTransferAmount || 0;
      
      // Calculate Transfer Portion
      if (currency === 'LAK') {
        rangeTransferLAK += transferAmt;
      } else if (currency === 'THB') {
        rangeTransferTHB += transferCurrAmt;
      } else if (currency === 'USD') {
        rangeTransferUSD += transferCurrAmt;
      }
      
      // Calculate Cash Portion
      if (currency === 'LAK') {
        rangeCashLAK += (p.cashReceived || 0) - (p.change || 0);
      } else if (currency === 'THB') {
        rangeCashTHB += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
      } else if (currency === 'USD') {
        rangeCashUSD += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
      }
    }
  });
  
  const productCostMap = {};
  allProducts.forEach(p => { productCostMap[p.id] = p.cost; });
  
  let totalCost = 0;
  rangeOrders.forEach(o => {
    o.items.forEach(item => {
      const cost = productCostMap[item.productId] !== undefined ? productCostMap[item.productId] : 0;
      totalCost += cost * item.qty;
    });
  });

  const grossProfit = totalSales - totalCost;
  const completedJobsValue = rangeJobs.reduce((sum, j) => sum + j.totalPrice, 0);
  const totalExpenses = rangeExpenses.reduce((sum, ex) => sum + (ex.convertedAmount || ex.amount), 0);
  const netProfit = grossProfit + (completedJobsValue * 0.7) - totalExpenses;

  // Active receivables (Outstanding Debt) - Total active unpaid debts in system
  const totalOutstandingDebt = allDebts
    .filter(d => d.status === 'unpaid')
    .reduce((sum, d) => sum + d.total, 0);
  const totalDebtors = allDebts.filter(d => d.status === 'unpaid').length;

  const filteredOrders = rangeOrders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a,b) => new Date(b.date) - new Date(a.date));

  const filteredDebts = rangeDebts.filter(d =>
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customerPhone.includes(searchQuery) ||
    d.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a,b) => new Date(b.date) - new Date(a.date));

  // Print Summary receipt template (80mm thermal layout)
  const handlePrintSummary = () => {
    const widths = db.getPaperPrintWidths(settings.receiptPaperWidth || '80mm');
    const paperWidth = widths.paper;
    const printableWidth = widths.printable;
    const fontSize = settings.receiptFontSize || '10pt';
    const shopLogo = settings.receiptLogoUrl || '';
    const shopName = settings.shopName || 'ຂອບພຣະຣັທເກຊ';
    const shopSubtitle = settings.receiptHeaderNote || settings.shopSubtitle || 'ຮ້ານອັດກອບພຣະເຄື່ອງ & ວັດຖຸມຸງຄຸນ';
    const shopAddress = settings.shopAddress || 'ປາກເຊ, ແຂວງຈຳປາສັກ';
    const shopPhone = settings.shopPhone || '02023304555';

    // Compile items sold list
    const productQtyMap = {};
    const getItemPaidTotal = (item, order) => {
      if (order.paidAmount === undefined || order.total === 0) return item.total;
      return item.total * (order.paidAmount / order.total);
    };

    rangeOrders.forEach(o => {
      if (o.isBalancePayment) return; // Skip balance payments to prevent double-counting physical quantities!
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (!productQtyMap[item.productId]) {
            productQtyMap[item.productId] = { name: item.name, qty: 0, total: 0 };
          }
          productQtyMap[item.productId].qty += item.qty;
          productQtyMap[item.productId].total += getItemPaidTotal(item, o);
        });
      }
    });
    const soldProducts = Object.values(productQtyMap);

    let itemsHtml = '';
    soldProducts.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 4px 0; line-height: 1.2;">${item.name}</td>
          <td style="width: ${settings.receiptQtyColWidth || '35px'}; text-align: center; padding: 4px 0;">${item.qty}</td>
          <td style="width: ${settings.receiptPriceColWidth || '95px'}; text-align: right; padding: 4px 0;">${item.total.toLocaleString()} ກີບ</td>
        </tr>
      `;
    });

    let cashLAK = 0, cashTHB = 0, cashUSD = 0, transferLAK = 0;
    rangePayments.forEach(p => {
      const amt = p.amount_paid;
      const currency = p.payCurrency || 'LAK';
      
      if (p.payment_method === 'Cash') {
        if (currency === 'LAK') cashLAK += amt;
        else if (currency === 'THB') cashTHB += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
        else if (currency === 'USD') cashUSD += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
      } else if (p.payment_method === 'BCEL One') {
        transferLAK += amt;
      } else if (p.payment_method === 'Split') {
        transferLAK += (p.transferAmount || 0);
        if (currency === 'LAK') {
          cashLAK += (p.cashReceived || 0) - (p.change || 0);
        } else if (currency === 'THB') {
          cashTHB += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
        } else if (currency === 'USD') {
          cashUSD += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
        }
      }
    });

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document || printFrame.contentDocument;
    doc.write(`
      <html>
        <head>
          <title>ລາຍງານສະຫຼຸບຍອດຂາຍ - Amulet POS</title>
          <style>
            @page { size: ${widths.paper.includes('landscape') ? 'A5 landscape' : widths.paper === 'A5' ? 'A5' : widths.paper === 'A4' ? 'A4' : 'portrait'}; margin: 0; }
            body {
              margin: 0; padding: 10px;
              font-family: 'Phetsarath OT', Arial, sans-serif;
              font-size: ${fontSize}; line-height: 1.4; color: black; background: white;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .logo { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-bottom: 6px; }
            .title { font-size: calc(${fontSize} + 2pt); font-weight: bold; }
            .subtitle { font-size: calc(${fontSize} - 1.5pt); color: #555; }
            .divider { border-bottom: ${settings.receiptDividerThickness || '1px'} ${settings.receiptDividerStyle || 'dashed'} black; margin: 8px 0; }
            .totals { display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px; }
            .section-title { font-weight: bold; margin-top: 10px; border-bottom: 0.5px solid black; padding-bottom: 2px; }
          </style>
        </head>
        <body onload="window.print();"><div style="width: ${printableWidth}; margin: 0 auto; box-sizing: border-box; padding-left: calc(${settings.receiptPadding || '3mm'} + ${settings.receiptMarginLeft || '0mm'}); padding-right: calc(${settings.receiptPadding || '3mm'} + ${settings.receiptMarginRight || '0mm'}); padding-top: calc(${settings.receiptPadding || '3mm'} + ${settings.receiptMarginTop || '0mm'}); padding-bottom: calc(${settings.receiptPadding || '3mm'} + ${settings.receiptMarginBottom || '0mm'} + ${settings.receiptFeedPadding || '8mm'});">
          <div class="header">
            ${(settings.receiptShowLogo !== false && shopLogo) ? `<img src="${shopLogo}" class="logo" />` : ''}
            <div class="title">${shopName}</div>
            <div class="subtitle">${shopSubtitle}</div>
            <div class="subtitle">${shopAddress} | ໂທ: ${shopPhone}</div>
            <div style="font-weight: bold; margin-top: 6px; font-size: calc(${fontSize} + 1pt);">ລາຍງານສະຫຼຸບຍອດຂາຍ</div>
            <div style="font-size: 8pt; margin-top: 2px;">
              <b>ໄລຍະເວລາ:</b> ${new Date(startDate).toLocaleDateString('lo-LA')} ຫາ ${new Date(endDate).toLocaleDateString('lo-LA')}
            </div>
            <div style="font-size: 7.5pt; color: #666; margin-top: 2px;">ພິມເມື່ອ: ${new Date().toLocaleString('lo-LA')}</div>
          </div>

          <div class="divider"></div>

          <div class="section-title">📊 ສິນຄ້າທີ່ຂายໄດ້</div>
          <div style="padding-right: 6mm;">
          <table style="width: 100%; border-collapse: collapse; font-size: calc(${fontSize} - 1.5pt); margin-top: 4px;">
            <thead>
              <tr style="border-bottom: 0.5px solid black; text-align: left; font-weight: bold;">
                <th style="padding-bottom: 4px;">ລາຍການ</th>
                <th style="width: ${settings.receiptQtyColWidth || '35px'}; text-align: center; padding-bottom: 4px;">ຈຳນວນ</th>
                 <th style="width: ${settings.receiptPriceColWidth || '95px'}; text-align: right; padding-bottom: 4px;">ຍອດລວມ</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="3" style="text-align:center; padding: 10px;">ບໍ່ມີລາຍການຂາຍໃນຊ່ວງນີ້</td></tr>'}
            </tbody>
          </table>
          </div>

          <div class="divider"></div>

          <div class="section-title">💰 ສະຫຼຸບລາຍຮັບ-ລາຍຈ່າຍ</div>
          <div style="font-size: calc(${fontSize} - 1pt); margin-top: 4px; padding-right: 6mm;">
            <div style="display:flex; justify-content:space-between;">
              <span>ຍອດຂາຍທັງໝົດ:</span>
              <span><b>${hasReportsPermission('reportsRevenue') ? totalSales.toLocaleString() + " ກີບ" : "*** ກີບ"}</b></span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-left: 10px; font-size: calc(${fontSize} - 2pt); color: #444;">
              <span>• ຮັບເງິນສົດ LAK:</span>
              <span>${cashLAK.toLocaleString()} ₭</span>
            </div>
            ${cashTHB > 0 ? `
            <div style="display:flex; justify-content:space-between; padding-left: 10px; font-size: calc(${fontSize} - 2pt); color: #444;">
              <span>• ຮັບເງິນສົດ THB:</span>
              <span>${cashTHB.toLocaleString()} ฿</span>
            </div>` : ''}
            ${cashUSD > 0 ? `
            <div style="display:flex; justify-content:space-between; padding-left: 10px; font-size: calc(${fontSize} - 2pt); color: #444;">
              <span>• ຮັບເງິນສົດ USD:</span>
              <span>$${cashUSD.toFixed(2)}</span>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; padding-left: 10px; font-size: calc(${fontSize} - 2pt); color: #444;">
              <span>• ໂອນທະນາຄານ LAK:</span>
              <span>${transferLAK.toLocaleString()} ₭</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top: 4px;">
              <span>ມູນຄ່າງານອັດກອບ:</span>
              <span>${completedJobsValue.toLocaleString()} ກີບ</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>ຍອດລາຍຈ່າຍ:</span>
              <span>-${totalExpenses.toLocaleString()} ກີບ</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size: calc(${fontSize} + 1pt); border-top: 0.5px solid black; margin-top: 6px; padding-top: 4px; font-weight: bold;">
              <span>ກຳໄລສຸດທິ:</span>
              <span>${netProfit.toLocaleString()} ກີບ</span>
            </div>
          </div>

          <div class="divider"></div>

          <div style="text-align: center; font-size: calc(${fontSize} - 2.5pt); color: #666; margin-top: 15px;">
            <p>ລາຍງານນີ້ພິມອອກຈາກລະບົບ POS</p>
            <p>ຮ້ານ ຂອບພຣະຣັທເກຊ - ປາກເຊ</p>
          </div>
        </div></body>
      </html>
    `);
    doc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  };

  // Custom Chart Renders
    const draw3DBar = (x, y, w, h, topColor, leftColor, rightColor) => {
    const hw = w / 2;
    const hh = w / 4;
    return (
      <g style={{ transition: 'all 0.3s' }}>
        <path
          d={`M ${x} ${y} L ${x + hw} ${y + hh} L ${x + hw} ${y + hh + h} L ${x} ${y + h} Z`}
          fill={leftColor}
          stroke={leftColor}
          strokeWidth="0.5"
        />
        <path
          d={`M ${x + hw} ${y + hh} L ${x + w} ${y} L ${x + w} ${y + h} L ${x + hw} ${y + hh + h} Z`}
          fill={rightColor}
          stroke={rightColor}
          strokeWidth="0.5"
        />
        <path
          d={`M ${x} ${y} L ${x + hw} ${y - hh} L ${x + w} ${y} L ${x + hw} ${y + hh} Z`}
          fill={topColor}
          stroke={topColor}
          strokeWidth="0.5"
        />
      </g>
    );
  };

  const renderTrendChart = () => {
    const datesList = [];
    let curr = new Date(start);
    while (curr <= end) {
      datesList.push(curr.toLocaleDateString('en-CA'));
      curr.setDate(curr.getDate() + 1);
    }
    
    let chartData = [];
    if (datesList.length === 1) {
      const hours = Array.from({ length: 11 }, (_, i) => i + 8);
      const salesByHour = {};
      hours.forEach(h => { salesByHour[h] = 0; });
      rangePayments.forEach(p => {
        const oHour = new Date(p.date).getHours();
        if (salesByHour[oHour] !== undefined) {
          salesByHour[oHour] += p.amount_paid;
        }
      });
      chartData = hours.map(h => ({
        label: `${String(h).padStart(2, '0')}:00`,
        value: salesByHour[h]
      }));
    } else if (datesList.length <= 31) {
      const salesByDate = {};
      datesList.forEach(d => { salesByDate[d] = 0; });
      rangePayments.forEach(p => {
        const dStr = new Date(p.date).toLocaleDateString('en-CA');
        if (salesByDate[dStr] !== undefined) {
          salesByDate[dStr] += p.amount_paid;
        }
      });
      chartData = datesList.map(date => ({
        label: date.slice(8) + '/' + date.slice(5, 7),
        value: salesByDate[date]
      }));
    } else {
      const salesByMonth = {};
      rangePayments.forEach(p => {
        const mStr = new Date(p.date).toISOString().slice(0, 7);
        salesByMonth[mStr] = (salesByMonth[mStr] || 0) + p.amount_paid;
      });
      const months = Object.keys(salesByMonth).sort();
      chartData = months.map(m => {
        const [y, mm] = m.split('-');
        return {
          label: `${mm}/${y.slice(2)}`,
          value: salesByMonth[m]
        };
      });
    }

    const maxVal = Math.max(...chartData.map(d => d.value), 100000);
    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 45;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const points = chartData.map((d, index) => {
      const x = paddingLeft + (index / (chartData.length - 1 || 1)) * chartWidth;
      const y = height - paddingBottom - (d.value / maxVal) * chartHeight;
      return { x, y, label: d.label, value: d.value };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length-1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : '';

    return (
      <div style={{ width: '100%' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="rgba(255,255,255,0.03)" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight/2} x2={width - paddingRight} y2={paddingTop + chartHeight/2} stroke="rgba(255,255,255,0.03)" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="rgba(255,255,255,0.1)" />

          {trendChartStyle === '2d-area' && points.length > 0 && <path d={areaPath} fill="url(#chartGrad)" />}

          {trendChartStyle === '3d-ribbon' && Array.from({ length: 5 }).map((_, step) => (
            <path
              key={step}
              d={linePath}
              fill="none"
              stroke="#aa882c"
              strokeWidth="2.5"
              transform={`translate(0, ${step + 1})`}
              opacity="0.7"
            />
          ))}

          {trendChartStyle !== '3d-bar' && points.length > 0 && (
            <path d={linePath} fill="none" stroke="var(--gold-primary)" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {trendChartStyle === '3d-bar' && points.map((p, idx) => {
            const w = Math.max(6, Math.min(24, chartWidth / chartData.length - 4));
            return (
              <g key={idx}>
                {draw3DBar(
                  p.x - w/2,
                  p.y,
                  w,
                  height - paddingBottom - p.y,
                  'var(--gold-primary)',
                  '#aa882c',
                  'var(--gold-primary)'
                )}
              </g>
            );
          })}

          {points.map((p, idx) => {
            const showLabel = chartData.length <= 10 || idx % Math.ceil(chartData.length / 10) === 0;
            return (
              <g key={idx}>
                {trendChartStyle !== '3d-bar' && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill="var(--gold-primary)"
                    stroke="var(--bg-card, #161411)"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer' }}
                  />
                )}
                {showLabel && (
                  <text
                    x={p.x}
                    y={height - paddingBottom + 16}
                    transform={`rotate(-35, ${p.x}, ${height - paddingBottom + 16})`}
                    fill="var(--text-secondary)"
                    fontSize="8"
                    textAnchor="end"
                  >
                    {p.label}
                  </text>
                )}
                <title>{`${p.label}: ${p.value.toLocaleString()} ₭`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderDonutChart = () => {
    const catSales = {};
    const getItemPaidTotal = (item, order) => {
      if (order.paidAmount === undefined || order.total === 0) return item.total;
      return item.total * (order.paidAmount / order.total);
    };

    rangeOrders.forEach(o => {
      if (o.isBalancePayment) return; // Skip balance payments to prevent double-counting category sales!
      o.items.forEach(item => {
        const cat = item.category || 'other';
        catSales[cat] = (catSales[cat] || 0) + getItemPaidTotal(item, o);
      });
    });

    const categoriesList = categories.length > 0 ? categories : [
      { id: 'frames', name: 'ຂອບພຣະ' },
      { id: 'amulets', name: 'ພຣະເຄື່ອງ' },
      { id: 'necklaces', name: 'ສ້ອຍຄໍ & ອຸປະກອນ' },
      { id: 'services', name: 'ບໍລິການອັດກັນນ້ຳ' }
    ];

    const total = Object.values(catSales).reduce((sum, v) => sum + v, 0);
    const catColors = {
      frames: 'var(--gold-primary)',
      amulets: '#3498db',
      necklaces: '#2ecc71',
      services: '#e67e22',
      other: '#95a5a6'
    };

    const catDarkColors = {
      frames: '#aa882c',
      amulets: '#217dbb',
      necklaces: '#27ae60',
      services: '#d35400',
      other: '#7f8c8d'
    };

    let cumulativePercent = 0;
    const segments = Object.entries(catSales).map(([cat, value]) => {
      const catObj = categoriesList.find(c => c.id === cat);
      const name = catObj ? db.getLabel('cat_' + catObj.id, catObj.name) : (cat === 'other' ? db.getLabel('cat_other', 'ອື່ນໆ') : cat);
      const percent = total > 0 ? value / total : 0;
      const angle = percent * 360;
      const startAngle = cumulativePercent * 360;
      cumulativePercent += percent;
      
      const r = 55;
      const cx = 100;
      const cy = 100;
      
      const rad = Math.PI / 180;
      const x1 = cx + r * Math.sin(startAngle * rad);
      const y1 = cy - r * Math.cos(startAngle * rad);
      const x2 = cx + r * Math.sin((startAngle + angle) * rad);
      const y2 = cy - r * Math.cos((startAngle + angle) * rad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathData = percent === 1 
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        
      return {
        cat,
        name,
        value,
        percent,
        color: catColors[cat] || '#e74c3c',
        darkColor: catDarkColors[cat] || '#c0392b',
        pathData
      };
    });

    if (total === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          ❌ ບໍ່ມີຂໍ້ມູນການຂາຍໃນຊ່ວງນີ້
        </div>
      );
    }

    if (categoryChartStyle === '3d-bar') {
      const barHeightMax = 70;
      const maxVal = Math.max(...segments.map(s => s.value), 1);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <svg width="100%" height="150" viewBox="0 0 300 150" style={{ overflow: 'visible' }}>
            <line x1="20" y1="110" x2="280" y2="110" stroke="rgba(255,255,255,0.08)" />
            {segments.map((seg, idx) => {
              const h = (seg.value / maxVal) * barHeightMax;
              const colWidth = 24;
              const stepX = 240 / (segments.length || 1);
              const x = 35 + idx * stepX;
              return (
                <g key={idx}>
                  {draw3DBar(x, 110 - h, colWidth, h, seg.color, seg.darkColor, seg.color)}
                  <text
                    x={x + colWidth/2}
                    y={110 - h - 8}
                    fill="white"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {seg.value.toLocaleString()} ₭
                  </text>
                  <text
                    x={x + colWidth/2}
                    y="126"
                    fill="var(--text-secondary)"
                    fontSize="7.5"
                    textAnchor="middle"
                  >
                    {seg.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ position: 'relative', width: '220px', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg width="220" height="140" viewBox="0 0 200 160" style={{ overflow: 'visible' }}>
            {categoryChartStyle === '3d-donut' && Array.from({ length: 12 }).map((_, step) => (
              <g key={step} transform={`translate(0, ${step + 1}) rotate(-15) skewX(20) scale(1, 0.5)`} opacity="0.9">
                {segments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.pathData}
                    fill={seg.darkColor}
                    stroke={seg.darkColor}
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            ))}

            <g transform={categoryChartStyle === '3d-donut' ? "rotate(-15) skewX(20) scale(1, 0.5)" : "translate(0, 0)"}>
              {segments.map((seg, idx) => (
                <path
                  key={idx}
                  d={seg.pathData}
                  fill={seg.color}
                  stroke="var(--bg-card, #161411)"
                  strokeWidth="1.5"
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </g>

            {categoryChartStyle === '3d-donut' && Array.from({ length: 12 }).map((_, step) => (
              <ellipse 
                key={step}
                cx="100" 
                cy="100" 
                rx="24" 
                ry="24" 
                fill="none"
                stroke="rgba(0, 0, 0, 0.15)"
                strokeWidth="1"
                transform={`translate(0, ${step}) rotate(-15) skewX(20) scale(1, 0.5)`}
              />
            ))}
            <ellipse 
              cx="100" 
              cy="100" 
              rx="24" 
              ry="24" 
              fill="var(--bg-card, #161411)" 
              transform={categoryChartStyle === '3d-donut' ? "rotate(-15) skewX(20) scale(1, 0.5)" : "translate(0, 0)"} 
            />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', padding: '0 10px' }}>
          {segments.map((seg, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, display: 'inline-block' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{seg.name}</span>
              </div>
              <span style={{ fontWeight: '500', color: 'white' }}>
                {seg.value.toLocaleString()} ₭ ({Math.round(seg.percent * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDebtChart = () => {
    const paidSum = rangeDebts.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.total, 0);
    const unpaidSum = rangeDebts.filter(d => d.status === 'unpaid').reduce((sum, d) => sum + d.total, 0);
    const total = paidSum + unpaidSum;

    const barHeightMax = 90;
    const maxVal = Math.max(paidSum, unpaidSum, 1000000);
    const paidHeight = (paidSum / maxVal) * barHeightMax;
    const unpaidHeight = (unpaidSum / maxVal) * barHeightMax;

    if (total === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          ❌ ບໍ່ມີຂໍ້ມູນການຕິດໜີ້ໃນຊ່ວງນີ້
        </div>
      );
    }

    if (debtChartStyle === '3d-donut') {
      const segments = [
        { name: 'ຊຳລະແລ້ວ', value: paidSum, percent: paidSum / total, color: 'var(--success-green)', darkColor: '#219a52' },
        { name: 'ຍັງບໍ່ຊຳລະ', value: unpaidSum, percent: unpaidSum / total, color: 'var(--alert-red)', darkColor: '#c0392b' }
      ];
      
      const r = 55;
      const cx = 100;
      const cy = 100;
      const rad = Math.PI / 180;
      
      let cumulativePercent = 0;
      const formatted = segments.map((seg) => {
        const percent = seg.percent;
        const angle = percent * 360;
        const startAngle = cumulativePercent * 360;
        cumulativePercent += percent;
        
        const x1 = cx + r * Math.sin(startAngle * rad);
        const y1 = cy - r * Math.cos(startAngle * rad);
        const x2 = cx + r * Math.sin((startAngle + angle) * rad);
        const y2 = cy - r * Math.cos((startAngle + angle) * rad);
        const largeArc = angle > 180 ? 1 : 0;
        
        const pathData = percent === 1
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          
        return { ...seg, pathData };
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ position: 'relative', width: '220px', height: '110px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="220" height="110" viewBox="0 0 200 160" style={{ overflow: 'visible' }}>
              {Array.from({ length: 12 }).map((_, step) => (
                <g key={step} transform={`translate(0, ${step + 1}) rotate(-15) skewX(20) scale(1, 0.5)`} opacity="0.9">
                  {formatted.map((seg, idx) => (
                    <path key={idx} d={seg.pathData} fill={seg.darkColor} stroke={seg.darkColor} strokeWidth="1.5" />
                  ))}
                </g>
              ))}
              <g transform="rotate(-15) skewX(20) scale(1, 0.5)">
                {formatted.map((seg, idx) => (
                  <path key={idx} d={seg.pathData} fill={seg.color} stroke="var(--bg-card, #161411)" strokeWidth="1.5" />
                ))}
              </g>
              {Array.from({ length: 12 }).map((_, step) => (
                <ellipse 
                  key={step}
                  cx="100" 
                  cy="100" 
                  rx="24" 
                  ry="24" 
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.15)"
                  strokeWidth="1"
                  transform={`translate(0, ${step}) rotate(-15) skewX(20) scale(1, 0.5)`}
                />
              ))}
              <ellipse cx="100" cy="100" rx="24" ry="24" fill="var(--bg-card, #161411)" transform="rotate(-15) skewX(20) scale(1, 0.5)" />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            {segments.map((seg, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, display: 'inline-block' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{seg.name}: <strong style={{ color: 'white' }}>{seg.value.toLocaleString()} ₭</strong> ({Math.round(seg.percent * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: '100%', height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="100%" height="170" viewBox="0 0 300 170" style={{ overflow: 'visible' }}>
          <line x1="20" y1="130" x2="280" y2="130" stroke="rgba(255,255,255,0.08)" />
          <line x1="20" y1="85" x2="280" y2="85" stroke="rgba(255,255,255,0.02)" />
          <line x1="20" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.02)" />

          {debtChartStyle === '3d-bar' ? (
            draw3DBar(50, 130 - paidHeight, 36, paidHeight, '#2ecc71', '#219a52', '#2ecc71')
          ) : (
            <rect x="50" y={130 - paidHeight} width="36" height={paidHeight} fill="var(--success-green)" rx="2" />
          )}
          <text
            x="68"
            y={130 - paidHeight - 12}
            fill="var(--success-green)"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            {paidSum.toLocaleString()} ₭
          </text>
          <text
            x="68"
            y="152"
            fill="white"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            ຊຳລະແລ້ວ
          </text>

          {debtChartStyle === '3d-bar' ? (
            draw3DBar(170, 130 - unpaidHeight, 36, unpaidHeight, '#e74c3c', '#c0392b', '#e74c3c')
          ) : (
            <rect x="170" y={130 - unpaidHeight} width="36" height={unpaidHeight} fill="var(--alert-red)" rx="2" />
          )}
          <text
            x="188"
            y={130 - unpaidHeight - 12}
            fill="var(--alert-red)"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            {unpaidSum.toLocaleString()} ₭
          </text>
          <text
            x="188"
            y="152"
            fill="white"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            ຍັງບໍ່ຊຳລະ
          </text>
        </svg>
      </div>
    );
  };;

  // ─── Online Orders Range (shared across tabs) ───────────────────────────
  const rangeOnlineOrders = allOnlineOrders.filter(o => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    const d = new Date(o.date);
    return d >= start && d <= end;
  });
  const onlinePaidOrders   = rangeOnlineOrders.filter(o => o.paymentStatus === 'paid');
  const onlinePaidRevenue  = onlinePaidOrders.reduce((s, o) => s + o.total, 0);
  
  // Calculate online transfer breakdown by currency
  let onlineTransferLAK = 0;
  let onlineTransferTHB = 0;
  let onlineTransferUSD = 0;
  
  onlinePaidOrders.forEach(o => {
    const currency = o.payCurrency || 'LAK';
    const total = o.total || 0;
    const currencyTotal = o.currencyTotal || o.total || 0;
    
    if (currency === 'LAK') {
      onlineTransferLAK += total;
    } else if (currency === 'THB') {
      onlineTransferTHB += currencyTotal;
    } else if (currency === 'USD') {
      onlineTransferUSD += currencyTotal;
    }
  });
  const onlinePending      = rangeOnlineOrders.filter(o => o.paymentStatus === 'pending_verification').length;
  const onlineRejected     = rangeOnlineOrders.filter(o => o.paymentStatus === 'rejected').length;
  const onlineShipped      = rangeOnlineOrders.filter(o => o.shippingStatus === 'shipped' || o.shippingStatus === 'delivered').length;

  // ─── Online tab: per-product sales ────────────────────────────────────────
  const onlineProductMap = {};
  onlinePaidOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!onlineProductMap[item.productId]) {
        onlineProductMap[item.productId] = { name: item.name, qty: 0, total: 0 };
      }
      onlineProductMap[item.productId].qty   += item.qty;
      onlineProductMap[item.productId].total += item.total;
    });
  });
  const onlineTopProducts = Object.values(onlineProductMap).sort((a, b) => b.total - a.total);

  // ─── Overview: merged payment method breakdown ─────────────────────────────
  // POS cash/transfer breakdown (re-computed for overview)
  let ovCashLAK = 0, ovCashTHB = 0, ovCashUSD = 0;
  let ovTransferLAK = 0, ovTransferTHB = 0, ovTransferUSD = 0;
  
  rangePayments.forEach(p => {
    const amt      = p.amount_paid;
    const currency = p.payCurrency || 'LAK';
    
    if (p.payment_method === 'Cash') {
      if (currency === 'LAK')      ovCashLAK  += amt;
      else if (currency === 'THB') ovCashTHB  += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
      else if (currency === 'USD') ovCashUSD  += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
    } else if (p.payment_method === 'BCEL One') {
      if (currency === 'LAK')      ovTransferLAK += amt;
      else if (currency === 'THB') ovTransferTHB += (p.currencyTransferAmount || p.currencyCashReceived || 0);
      else if (currency === 'USD') ovTransferUSD += (p.currencyTransferAmount || p.currencyCashReceived || 0);
    } else if (p.payment_method === 'Split') {
      // Split payment has both cash and transfer portions
      const transferAmt = p.transferAmount || 0;
      const transferCurrAmt = p.currencyTransferAmount || 0;
      
      // Calculate Transfer Portion
      if (currency === 'LAK') {
        ovTransferLAK += transferAmt;
      } else if (currency === 'THB') {
        ovTransferTHB += transferCurrAmt;
      } else if (currency === 'USD') {
        ovTransferUSD += transferCurrAmt;
      }
      
      // Calculate Cash Portion
      if (currency === 'LAK') {
        ovCashLAK += (p.cashReceived || 0) - (p.change || 0);
      } else if (currency === 'THB') {
        ovCashTHB += (p.currencyCashReceived || 0) - (p.currencyChange || 0);
      } else if (currency === 'USD') {
        ovCashUSD += (p.currencyCashReceived || 0) - (p.change || 0);
      }
    }
  });
  
  // Online paid orders COUNT AS LAK bank-transfers
  ovTransferLAK += onlinePaidRevenue;
  const ovTotalRevenue = totalSales + onlinePaidRevenue;
  const ovNetProfit    = netProfit + onlinePaidRevenue; // rough: add online revenue on top

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Filter */}
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ color: 'var(--gold-primary)', fontSize: isMobile ? '1.2rem' : '1.5rem', margin: 0 }}>
            {db.getLabel('title_reports', '📊 ບົດລາຍງານຍອດຂາຍ & ການເງິນ (Sales & Finance Reports)')}
          </h2>
          {!isMobile && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              ເບິ່ງຍອດຂາຍ, ຄຳນວນກຳໄລ, ຕິດຕາມວິເຄາະ ແລະ ຄົ້ນຫາໃບບິນຍ້ອນຫຼັງ
            </p>
          )}
        </div>
        
        {/* Advanced Date Range Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card, #161411)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'today', name: 'ມື້ນີ້' },
              { id: '7days', name: '7 ວັນຫຼ້າສຸດ' },
              { id: '30days', name: '30 ວັນຫຼ້າສຸດ' },
              { id: 'year', name: '1 ປີຫຼ້າສຸດ' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`category-tab ${activePreset === opt.id ? 'active' : ''}`}
                style={{ border: 'none', borderRadius: '20px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', margin: 0 }}
                onClick={() => setDatePreset(opt.id)}
              >
                {opt.name}
              </button>
            ))}
            <button
              type="button"
              className="category-tab"
              style={{ border: 'none', borderRadius: '20px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', background: 'rgba(231,76,60,0.15)', color: 'var(--alert-red)', margin: 0 }}
              onClick={handleClearFilters}
            >
              🔄 ຣີເຊັດ
            </button>
          </div>
          
          <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' } : { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ແຕ່:</span>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', background: '#0c0b09', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', margin: 0 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ຫາ:</span>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', background: '#0c0b09', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', margin: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab Switcher ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
        {[
          { id: 'pos',      icon: '🏪', label: 'ໜ້າຮ້ານ POS' },
          { id: 'online',   icon: '🌐', label: 'ອອນລາຍ Shop' },
          { id: 'overview', icon: '📊', label: 'ພາບລວມທຸລະກິດ' },
          { id: 'treats',   icon: '🎁', label: 'ລາຍການລ້ຽງແຂກ (Treats)' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            style={{
              padding: '7px 18px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontWeight: reportTab === tab.id ? 'bold' : 'normal',
              fontSize: '0.82rem',
              background: reportTab === tab.id
                ? (tab.id === 'online' ? 'rgba(52,152,219,0.18)' : tab.id === 'overview' ? 'rgba(212,175,55,0.18)' : tab.id === 'treats' ? 'rgba(230,126,34,0.18)' : 'rgba(39,174,96,0.18)')
                : 'rgba(255,255,255,0.04)',
              color: reportTab === tab.id
                ? (tab.id === 'online' ? '#3498db' : tab.id === 'overview' ? 'var(--gold-primary)' : tab.id === 'treats' ? '#e67e22' : 'var(--success-green)')
                : 'var(--text-secondary)',
              borderBottom: reportTab === tab.id ? `2px solid ${tab.id === 'online' ? '#3498db' : tab.id === 'overview' ? 'var(--gold-primary)' : tab.id === 'treats' ? '#e67e22' : 'var(--success-green)'}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: POS STORE ──────────────────────────────────────────────────── */}
      {reportTab === 'pos' && <>

      {/* Analytics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Revenue */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💵 ຍອດຂາຍທັງໝົດ (Revenue)</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
            {hasReportsPermission('reportsRevenue') ? totalSales.toLocaleString() + " ກີບ" : "*** ກີບ"}
          </span>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            
            {/* Cash portion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '2px', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>💵 ລວມຮັບເງິນສົດ:</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                <span>• ເງິນສົດ LAK:</span>
                <span style={{ color: 'white' }}>{rangeCashLAK.toLocaleString()} ₭</span>
              </div>
              {(rangeCashTHB > 0 || settings.exchangeRateThb) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                  <span>• ເງິນສົດ THB:</span>
                  <span style={{ color: 'white' }}>{rangeCashTHB.toLocaleString()} ฿</span>
                </div>
              )}
              {(rangeCashUSD > 0 || settings.exchangeRateUsd) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                  <span>• ເງິນສົດ USD:</span>
                  <span style={{ color: 'white' }}>${rangeCashUSD.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Transfer portion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 'bold', color: '#3498db' }}>📱 ລວມຮັບເງິນໂອນ (Transfer):</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                <span>• ເງິນໂອນ LAK:</span>
                <span style={{ color: 'white' }}>{rangeTransferLAK.toLocaleString()} ₭</span>
              </div>
              {(rangeTransferTHB > 0 || settings.exchangeRateThb) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                  <span>• ເງິນໂອນ THB:</span>
                  <span style={{ color: 'white' }}>{rangeTransferTHB.toLocaleString()} ฿</span>
                </div>
              )}
              {(rangeTransferUSD > 0 || settings.exchangeRateUsd) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                  <span>• ເງິນໂອນ USD:</span>
                  <span style={{ color: 'white' }}>${rangeTransferUSD.toFixed(2)}</span>
                </div>
              )}
            </div>

          </div>
        </div>
        

        {/* Card 2: Estimated Profit */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📈 ກຳໄລສຸດທິ (Est. Profit)</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--success-green)' }}>
            {hasReportsPermission('reportsProfit') ? Math.round(netProfit).toLocaleString() + " ກີບ" : "*** ກີບ"}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>*ຫັກຕົ້ນທຶນ ແລະ ຄ່າໃຊ້ຈ່າຍແລ້ວ</span>
        </div>

        {/* Card 3: Orders count */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🛒 ຈຳນວນໃບບິນຂາຍ</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'white' }}>
            {rangeOrders.length} ບິນ
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            สะເລ່ຍ: {rangeOrders.length > 0 ? Math.round(totalSales / rangeOrders.length).toLocaleString() : 0} ₭/ບິນ
          </span>
        </div>

        {/* Card 4: Outstanding Debt Ledger */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📒 ມູນຄ່າໜີ້ຄ້າງຊຳລະທັງໝົດ</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--alert-red)' }}>
            {totalOutstandingDebt.toLocaleString()} ກີບ
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--alert-red)', fontWeight: '500' }}>
            ມີລູກຄ້າຄ້າງຊຳລະ: {totalDebtors} ລາຍ
          </span>
        </div>

        {/* Card 5: Framing value */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🛠️ ມູນຄ່າງານອັດກອບ</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--accent-amber)' }}>
            {completedJobsValue.toLocaleString()} ກີບ
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ງານຄ້າງຄິວທັງໝົດ: {allJobs.filter(j => j.status !== 'picked_up').length} ງານ</span>
        </div>

        {/* Card 6: Expenses */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💸 ລາຍຈ່າຍທັງໝົດ</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#e74c3c' }}>
            {totalExpenses.toLocaleString()} ກີບ
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ລາຍຈ່າຍໃນໄລຍະເວລາທີ່ເລືອກ</span>
        </div>
      </div>

      {/* (Online channel quick-stats removed – see Online tab) */}

      {/* Print summary button trigger */}
      {hasReportsPermission('reportsExport') && (
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrintSummary}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          🖨️ ພິມລາຍງານສະຫຼຸບຍອດຂາຍ (Print Sales Summary)
        </button>
      </div>
      )}

      {/* Custom interactive charts panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Trend line chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.95rem' }}>{db.getLabel('rep_trend_chart_title', '📈 ແນວໂນ້ມຍອດຂາຍ (Sales Trend Line Chart)')}</h4>
            <select
              value={trendChartStyle}
              onChange={(e) => {
                setTrendChartStyle(e.target.value);
                localStorage.setItem('rep_trend_style', e.target.value);
              }}
              className="form-control"
              style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: '26px', borderRadius: '6px', background: 'var(--bg-input, #222)', color: 'white', border: '1px solid var(--border-color)' }}
            >
              <option value="3d-ribbon">📈 3D Ribbon</option>
              <option value="2d-area">📉 2D Area</option>
              <option value="3d-bar">📊 3D Column</option>
            </select>
          </div>
          {renderTrendChart()}
        </div>

        {/* Category donut chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.95rem' }}>{db.getLabel('rep_category_donut_title', '🍕 ສັດສ່ວນຍອດຂາຍຕາມໝວດໝູ່ (Category Split)')}</h4>
            <select
              value={categoryChartStyle}
              onChange={(e) => {
                setCategoryChartStyle(e.target.value);
                localStorage.setItem('rep_category_style', e.target.value);
              }}
              className="form-control"
              style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: '26px', borderRadius: '6px', background: 'var(--bg-input, #222)', color: 'white', border: '1px solid var(--border-color)' }}
            >
              <option value="3d-donut">🍩 3D Donut</option>
              <option value="2d-donut">⚪ 2D Donut</option>
              <option value="3d-bar">📊 3D Column</option>
            </select>
          </div>
          {renderDonutChart()}
        </div>

        {/* Debt Risk status chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '0.95rem' }}>{db.getLabel('rep_debt_chart_title', '📒 ສະຖານະຍອດຕິດໜີ້ຊ່ວງນີ້ (Debt Risk Comparison)')}</h4>
            <select
              value={debtChartStyle}
              onChange={(e) => {
                setDebtChartStyle(e.target.value);
                localStorage.setItem('rep_debt_style', e.target.value);
              }}
              className="form-control"
              style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: '26px', borderRadius: '6px', background: 'var(--bg-input, #222)', color: 'white', border: '1px solid var(--border-color)' }}
            >
              <option value="3d-bar">📊 3D Column</option>
              <option value="2d-bar">▌ 2D Column</option>
              <option value="3d-donut">🍩 3D Donut</option>
            </select>
          </div>
          {renderDebtChart()}
        </div>
      </div>

      {/* Tables block: Sales Table & Debts Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Invoice Archive and Lookup */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem' }}>🔍 ໃບບິນຂາຍຊ່ວງນີ້ (Bills Lookup)</h3>
            <input
              type="text"
              className="form-control"
              placeholder="ຄົ້ນຫາໃບບິນຂາຍ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '350px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px' }}>ເລກບິນ (ID)</th>
                  <th style={{ padding: '12px' }}>ວันທີ / ເວລາ</th>
                  <th style={{ padding: '12px' }}>ພະນັກງານຂາຍ</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ສ່ວນຫຼຸດ</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ຍອດລວມສຸດທິ</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>ຊ່ອງທາງຊຳລະ</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>ປຣິນບິນຄືນ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      ບໍ່ມີໃບບິນຂາຍໃນຊ່ວງເວລານີ້
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}
                    >
                      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                        {order.id}
                        {order.treatRemark && (
                          <div style={{ fontSize: '0.72rem', color: '#e67e22', fontStyle: 'italic', marginTop: '2px' }}>
                            💬 {order.treatRemark}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {new Date(order.date).toLocaleString('lo-LA')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {order.cashierName}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success-green)' }}>
                        {order.discount > 0 ? `-${order.discount.toLocaleString()} ₭` : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                        {order.total.toLocaleString()} ₭
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: order.paymentMethod === 'cash' ? 'rgba(243, 156, 18, 0.15)' : order.paymentMethod === 'split' ? 'rgba(155, 89, 182, 0.15)' : order.paymentMethod === 'treat' ? 'rgba(230, 126, 34, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                            color: order.paymentMethod === 'cash' ? '#f39c12' : order.paymentMethod === 'split' ? '#9b59b6' : order.paymentMethod === 'treat' ? '#e67e22' : '#3498db',
                            border: `1px solid ${order.paymentMethod === 'cash' ? 'rgba(243, 156, 18, 0.3)' : order.paymentMethod === 'split' ? 'rgba(155, 89, 182, 0.3)' : order.paymentMethod === 'treat' ? 'rgba(230, 126, 34, 0.3)' : 'rgba(52, 152, 219, 0.3)'}`
                          }}
                        >
                          {order.paymentMethod === 'cash' ? '💵 ເງິນສົດ' : order.paymentMethod === 'split' ? '🔀 ເງິນສົດ + ໂອນ' : order.paymentMethod === 'treat' ? '🎁 ລ້ຽງແຂກ (Treat)' : '📱 ໂອນທະນາຄານ'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleReprint(order)}
                        >
                          🖨️ ເປີດເບິ່ງ
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '3px 8px', fontSize: '0.75rem', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c' }}
                          onClick={() => handleRequestDelete('pos', order.id, order.paymentMethod === 'treat' ? 'ລ້ຽງແຂກ' : 'ຂາຍໜ້າຮ້ານ')}
                        >
                          🗑️ ລຶບ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Period Outstanding Debt Ledger */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem' }}>📒 ບັນຊີລູກຄ້າຕິດໜີ້ຊ່ວງນີ້ (Period Debts Table)</h3>
          
          
          <div style={{ overflowX: 'auto' }}>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredDebts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    ບໍ່ມີລາຍການຕິດໜີ້ໃນຊ່ວງເວລານີ້
                  </div>
                ) : (
                  filteredDebts.map(debt => (
                    <div key={debt.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{debt.id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(debt.date).toLocaleDateString('lo-LA')}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                        <div><b>ລູກຄ້າ:</b> {debt.customerName} ({debt.customerPhone || 'ບໍ່ມີເບີໂທ'})</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <b>ລາຍການ:</b> {debt.items.map(item => `${item.name} (x${item.qty})`).join(', ')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(39, 174, 96, 0.15)',
                            color: debt.status === 'unpaid' ? 'var(--alert-red)' : 'var(--success-green)',
                            border: `1px solid ${debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(39, 174, 96, 0.3)'}`
                          }}
                        >
                          {debt.status === 'unpaid' ? '🔴 ຕິດໜີ້ຄ້າງຊຳລະ' : '🟢 ຊຳລະໜີ້ແລ້ວ'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--alert-red)' }}>{debt.total.toLocaleString()} ₭</span>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '2px 6px', fontSize: '0.7rem', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c' }}
                            onClick={() => handleRequestDelete('debt', debt.id, 'ຕິດໜີ້')}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px' }}>ເລກໃບບິນໜີ້</th>
                    <th style={{ padding: '12px' }}>ວັນທີຄ້າງຊຳລະ</th>
                    <th style={{ padding: '12px' }}>ຊື່ລູกຄ້າ</th>
                    <th style={{ padding: '12px' }}>ເບີໂທຕິດຕໍ່</th>
                    <th style={{ padding: '12px' }}>ລາຍການສິນຄ້າ</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ຍົດຕິດໜີ້</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>ສະຖານະ</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>ຈັດການ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebts.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                        ບໍ່ມີລາຍການຕິດໜີ້ໃນຊ່ວງເວລານີ້
                      </td>
                    </tr>
                  ) : (
                    filteredDebts.map(debt => (
                      <tr
                        key={debt.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}
                      >
                        <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>
                          {debt.id}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {new Date(debt.date).toLocaleDateString('lo-LA')}
                        </td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>
                          {debt.customerName}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                          {debt.customerPhone}
                        </td>
                        <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {debt.items.map(item => `${item.name} (x${item.qty})ixed`).join(', ')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--alert-red)' }}>
                          {debt.total.toLocaleString()} ₭
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(39, 174, 96, 0.15)',
                              color: debt.status === 'unpaid' ? 'var(--alert-red)' : 'var(--success-green)',
                              border: `1px solid ${debt.status === 'unpaid' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(39, 174, 96, 0.3)'}`
                            }}
                          >
                            {debt.status === 'unpaid' ? '🔴 ຕິດໜີ້ຄ້າງຊຳລະ' : '🟢 ຊຳລະໜີ້ແລ້ວ'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c' }}
                            onClick={() => handleRequestDelete('debt', debt.id, 'ຕິດໜີ້')}
                          >
                            🗑️ ລຶບ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Expenses summary list for POS tab */}
        {rangeExpenses.length > 0 && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', margin: 0 }}>💸 ບັນທຶກລາຍຈ່າຍຊ່ວງນີ້ (Period Expenses Table)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>ວັນທີ</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>ລາຍການ</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>ຈຳນວນ</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rangeExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map((ex, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '10px' }}>{new Date(ex.date).toLocaleDateString('lo-LA')}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{ex.categoryName || ex.category || '-'}</div>
                        {ex.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>📝 {ex.notes}</div>}
                        {ex.supplier && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏢 ຜູ້ສະໜອງ: {ex.supplier}</div>}
                        {ex.createdByName && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>👤 ຜູ້ບັນທຶກ: {ex.createdByName}</div>}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#e74c3c', fontWeight: 'bold' }}>
                        -{ex.amount.toLocaleString()} {ex.currency || 'LAK'}
                        {ex.currency && ex.currency !== 'LAK' && <small style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>(≈ {ex.convertedAmount?.toLocaleString()} ₭)</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      </> /* end POS tab */}

      {/* ─── TAB: ONLINE SHOP ────────────────────────────────────────────────── */}
      {reportTab === 'online' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #3498db' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🌐 ຍອດຂາຍ Online (ຊຳລະແລ້ວ)</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#3498db' }}>{onlinePaidRevenue.toLocaleString()} ₭</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{onlinePaidOrders.length} ອໍເດີ້ຊຳລະສຳເລັດ</span>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 'bold', color: '#3498db' }}>📱 ລວມຮັບເງິນໂອນ (Transfer):</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                  <span>• ເງິນໂອນ LAK:</span>
                  <span style={{ color: 'white' }}>{onlineTransferLAK.toLocaleString()} ₭</span>
                </div>
                {(onlineTransferTHB > 0 || settings.exchangeRateThb) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                    <span>• ເງິນໂອນ THB:</span>
                    <span style={{ color: 'white' }}>{onlineTransferTHB.toLocaleString()} ฿</span>
                  </div>
                )}
                {(onlineTransferUSD > 0 || settings.exchangeRateUsd) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                    <span>• ເງິນໂອນ USD:</span>
                    <span style={{ color: 'white' }}>${onlineTransferUSD.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #f1c40f' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>⏳ ລໍຖ້ານວດສະລິບ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#f1c40f' }}>{onlinePending} ອໍເດີ້</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ຕ້ອງຢືນຢັນໂດຍ Staff</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #2ecc71' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🚚 ສົ່ງ / ສຳເລັດແລ້ວ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#2ecc71' }}>{onlineShipped} ອໍເດີ້</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Shipped + Delivered</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #e74c3c' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>❌ ຍົກເລີກ / Rejected</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#e74c3c' }}>{onlineRejected} ອໍເດີ້</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ສະລິບຖືກປະຕິເສດ</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid var(--gold-primary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📦 ຈຳນວນ Online ທັງໝົດ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{rangeOnlineOrders.length} ອໍເດີ້</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ທຸກສະຖານະ</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #9b59b6' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💎 ສະເລ່ຍຕໍ່ອໍເດີ້</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#9b59b6' }}>
                {onlinePaidOrders.length > 0 ? Math.round(onlinePaidRevenue / onlinePaidOrders.length).toLocaleString() : 0} ₭
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Avg. Order Value</span>
            </div>
          </div>

          {/* Top products table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>🏆 ສິນຄ້າຂາຍດີທາງ Online (Top Selling Products)</h4>
            {onlineTopProducts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ Online</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ສິນຄ້າ</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>ຈຳນວນ</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>ຍອດລວມ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlineTopProducts.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', color: idx < 3 ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </td>
                        <td style={{ padding: '10px', fontWeight: '500' }}>{p.name}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{p.qty}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#3498db', fontWeight: 'bold' }}>{p.total.toLocaleString()} ₭</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All online orders table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📋 ລາຍການ Online Orders ທັງໝົດ</h4>
            {rangeOnlineOrders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>ບໍ່ມີ Online Orders ໃນຊ່ວງເວລານີ້</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>ເລກ Order</th>
                      <th style={{ padding: '10px' }}>ວັນທີ</th>
                      <th style={{ padding: '10px' }}>ລູກຄ້າ</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>ຍອດ</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>ຊຳລະ</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>ຂົນສົ່ງ</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>ປຣິນບິນຄືນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rangeOnlineOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#3498db' }}>{o.id}</td>
                        <td style={{ padding: '10px' }}>{new Date(o.date).toLocaleDateString('lo-LA')}</td>
                        <td style={{ padding: '10px' }}>{o.customerName}<br/><span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{o.customerPhone}</span></td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{o.total.toLocaleString()} ₭</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px',
                            background: o.paymentStatus === 'paid' ? 'rgba(46,204,113,0.15)' : o.paymentStatus === 'pending_verification' ? 'rgba(241,196,15,0.15)' : 'rgba(231,76,60,0.15)',
                            color: o.paymentStatus === 'paid' ? '#2ecc71' : o.paymentStatus === 'pending_verification' ? '#f1c40f' : '#e74c3c',
                            border: `1px solid ${o.paymentStatus === 'paid' ? 'rgba(46,204,113,0.3)' : o.paymentStatus === 'pending_verification' ? 'rgba(241,196,15,0.3)' : 'rgba(231,76,60,0.3)'}`
                          }}>
                            {o.paymentStatus === 'paid' ? '✅ ຊຳລະແລ້ວ' : o.paymentStatus === 'pending_verification' ? '⏳ ລໍຖ້ານວດ' : '❌ ຍົກເລີກ'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px',
                            background: o.shippingStatus === 'delivered' ? 'rgba(46,204,113,0.1)' : o.shippingStatus === 'shipped' ? 'rgba(52,152,219,0.1)' : 'rgba(255,255,255,0.06)',
                            color: o.shippingStatus === 'delivered' ? '#2ecc71' : o.shippingStatus === 'shipped' ? '#3498db' : 'var(--text-secondary)'
                          }}>
                            {o.shippingStatus === 'delivered' ? '🏠 ສົ່ງຮອດແລ້ວ' : o.shippingStatus === 'shipped' ? '🚚 ກຳລັງສົ່ງ' : o.shippingStatus === 'packing' ? '📦 ກຳລັງແພັກ' : '🕐 ລໍຖ້າ'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            onClick={() => handleReprint(o)}
                          >
                            🖨️ ເປີດເບິ່ງ
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c' }}
                            onClick={() => handleRequestDelete('online', o.id, 'ຂາຍອອນລາຍ')}
                          >
                            🗑️ ລຶບ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── TAB: BUSINESS OVERVIEW ───────────────────────────────────────────── */}
      {reportTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Combined KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid var(--gold-primary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💰 ຍອດຂາຍລວມທຸກຊ່ອງທາງ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{ovTotalRevenue.toLocaleString()} ₭</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>POS {totalSales.toLocaleString()} + Online {onlinePaidRevenue.toLocaleString()}</span>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                
                {/* Cash portion */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '2px', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>💵 ລວມຮັບເງິນສົດ:</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                    <span>• ເງິນສົດ LAK:</span>
                    <span style={{ color: 'white' }}>{ovCashLAK.toLocaleString()} ₭</span>
                  </div>
                  {(ovCashTHB > 0 || settings.exchangeRateThb) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                      <span>• ເງິນສົດ THB:</span>
                      <span style={{ color: 'white' }}>{ovCashTHB.toLocaleString()} ฿</span>
                    </div>
                  )}
                  {(ovCashUSD > 0 || settings.exchangeRateUsd) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                      <span>• ເງິນສົດ USD:</span>
                      <span style={{ color: 'white' }}>${ovCashUSD.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Transfer portion */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 'bold', color: '#3498db' }}>📱 ລວມຮັບເງິນໂອນ (Transfer):</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                    <span>• ເງິນໂອນ LAK:</span>
                    <span style={{ color: 'white' }}>{ovTransferLAK.toLocaleString()} ₭</span>
                  </div>
                  {(ovTransferTHB > 0 || settings.exchangeRateThb) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                      <span>• ເງິນໂອນ THB:</span>
                      <span style={{ color: 'white' }}>{ovTransferTHB.toLocaleString()} ฿</span>
                    </div>
                  )}
                  {(ovTransferUSD > 0 || settings.exchangeRateUsd) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                      <span>• ເງິນໂອນ USD:</span>
                      <span style={{ color: 'white' }}>${ovTransferUSD.toFixed(2)}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #2ecc71' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📈 ກຳໄລສຸດທິ (ປະເມີນ)</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#2ecc71' }}>{hasReportsPermission('reportsProfit') ? Math.round(ovNetProfit).toLocaleString() + " ₭" : "*** ₭"}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>*ຫັກຕົ້ນທຶນ + ລາຍຈ່າຍ</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #9b59b6' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🏪 ຍອດ POS ໜ້າຮ້ານ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#9b59b6' }}>{hasReportsPermission('reportsRevenue') ? totalSales.toLocaleString() + " ₭" : "*** ₭"}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{rangeOrders.length} ໃບບິນ</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #3498db' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🌐 ຍອດ Online Shop</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#3498db' }}>{hasReportsPermission('reportsRevenue') ? onlinePaidRevenue.toLocaleString() + " ₭" : "*** ₭"}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{onlinePaidOrders.length} ອໍເດີ້ຊຳລະ</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #e74c3c' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💸 ລາຍຈ່າຍທັງໝົດ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#e74c3c' }}>{totalExpenses.toLocaleString()} ₭</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ຄ່າໃຊ້ຈ່າຍດຳເນີນການ</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #e67e22' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📒 ໜີ້ຄ້າງຊຳລະ</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#e67e22' }}>{totalOutstandingDebt.toLocaleString()} ₭</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{totalDebtors} ລາຍ ທີ່ຍັງຄ້າງ</span>
            </div>
          </div>

          {/* Channel contribution bar */}
          {ovTotalRevenue > 0 && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>📊 ສັດສ່ວນຍອດຂາຍ POS vs Online</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: '🏪 POS ໜ້າຮ້ານ', value: totalSales,         color: '#9b59b6' },
                  { label: '🌐 Online Shop',  value: onlinePaidRevenue,  color: '#3498db' },
                ].map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: row.color, fontWeight: '600' }}>{row.label}</span>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>
                        {row.value.toLocaleString()} ₭
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '6px' }}>
                          ({Math.round((row.value / ovTotalRevenue) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((row.value / ovTotalRevenue) * 100)}%`, background: row.color, borderRadius: '5px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment method breakdown (merged POS+Online) */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>💳 ສະຫຼຸບການຊຳລະ (ລວມທຸກຊ່ອງທາງ)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              * ຍອດ Online ທີ່ຊຳລະຜ່ານ BCEL QR ນຳໄປລວມໃສ່ <strong style={{ color: '#3498db' }}>ໂອນທະນາຄານ</strong> ອັດຕະໂນມັດ
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', borderRadius: '12px', background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.25)' }}>
                <span style={{ fontSize: '0.75rem', color: '#f39c12' }}>💵 ເງິນສົດ LAK</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f39c12' }}>{Math.round(ovCashLAK).toLocaleString()} ₭</span>
              </div>
              {ovCashTHB > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', borderRadius: '12px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#3498db' }}>💵 ເງິນສົດ THB</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>{Math.round(ovCashTHB).toLocaleString()} ฿</span>
                </div>
              )}
              {ovCashUSD > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', borderRadius: '12px', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#2ecc71' }}>💵 ເງິນສົດ USD</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ecc71' }}>${ovCashUSD.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', borderRadius: '12px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.25)' }}>
                <span style={{ fontSize: '0.75rem', color: '#3498db' }}>📱 ໂອນທະນາຄານ (POS + Online)</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>{Math.round(ovTransferLAK).toLocaleString()} ₭</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  POS ໂອນ: {Math.round(ovTransferLAK - onlinePaidRevenue).toLocaleString()} ₭ + Online: {onlinePaidRevenue.toLocaleString()} ₭
                </span>
              </div>
            </div>
          </div>

          {/* Expenses summary */}
          {rangeExpenses.length > 0 && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ color: 'var(--gold-primary)', margin: 0 }}>💸 ລາຍຈ່າຍ (Expenses)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ວັນທີ</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ລາຍການ</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>ຈຳນວນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rangeExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map((ex, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px' }}>{new Date(ex.date).toLocaleDateString('lo-LA')}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{ex.categoryName || ex.category || '-'}</div>
                          {ex.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>📝 {ex.notes}</div>}
                          {ex.supplier && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏢 ຜູ້ສະໜອງ: {ex.supplier}</div>}
                          {ex.createdByName && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>👤 ຜູ້ບັນທຶກ: {ex.createdByName}</div>}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#e74c3c', fontWeight: 'bold' }}>
                          -{ex.amount.toLocaleString()} {ex.currency || 'LAK'}
                          {ex.currency && ex.currency !== 'LAK' && <small style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>(≈ {ex.convertedAmount?.toLocaleString()} ₭)</small>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── Invoice Reprint Modal (shared, always rendered) ─────────────────── */}
      {/* Invoice Reprint / Lookup Detail Modal */}

      {/* ─── Delete Confirmation PIN Modal ─────────────────── */}
      {showDeleteModal && deleteTarget && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content animate-fade-in" style={{ maxWidth: '360px', padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '2.5rem' }}>🔒</span>
                <h3 style={{ color: 'var(--gold-primary)', margin: '10px 0 6px 0', fontSize: '1.1rem' }}>ຢືນຢັນການລຶບໃບບິນ</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  ກະລຸນາໃສ່ລະຫັດ Admin PIN ເພື່ອລຶບໃບບິນ <b>{deleteTarget.id}</b> ({deleteTarget.label})
                </p>
              </div>

              <form onSubmit={handleConfirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <input
                    type="password"
                    className="form-control text-center"
                    placeholder="ໃສ່ລະຫັດ PIN"
                    value={deletePin}
                    onChange={(e) => setDeletePin(e.target.value)}
                    autoFocus
                    required
                    style={{ fontSize: '1.25rem', letterSpacing: '6px', background: 'rgba(255,255,255,0.05)', borderColor: 'var(--gold-primary)', color: 'white' }}
                  />
                </div>

                {deleteError && (
                  <div style={{ color: 'var(--alert-red)', fontSize: '0.78rem', textAlign: 'center' }}>
                    {deleteError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteTarget(null);
                    }}
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none' }}
                  >
                    🗑️ ຢືນຢັນລຶບ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
        {showReprintModal && selectedReceipt && (
        <Portal>
        <div className="modal-overlay print-modal">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header no-print">
              <span className="modal-title">ເບິ່ງໃບບິນຍ້ອນຫຼັງ (ID: {selectedReceipt.id})</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowReprintModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ background: 'white', padding: '16px', display: 'flex', justifyContent: 'center' }}>
              
              {/* Receipt Template (80mm width) */}
              <div className="print-receipt-container">
                <div className="print-receipt-header">
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                    <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" rx="50" fill="black" />
                      <path d="M50 20C45 35 30 40 30 55C30 65 40 75 50 75C60 75 70 65 70 55C70 40 55 35 50 20Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="print-receipt-title">{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                  <div className="print-receipt-subtitle">{settings.shopSubtitle || 'ຮ້ານອັດກອບພຣະເຄື່ອງ & ວັດຖຸມຸງຄຸນ'}</div>
                  <div className="print-receipt-subtitle">{settings.shopAddress} | ໂທ: {settings.shopPhone}</div>
                  <div className="print-receipt-subtitle" style={{ fontWeight: 'bold', color: 'red', marginTop: '2px' }}>(ໃບບິນພิມຍ້ອນຫຼັງ / REPRINT)</div>
                </div>

                <div style={{ fontSize: '8pt', marginBottom: '8px' }}>
                  <div><b>ເລກບິນ:</b> {selectedReceipt.id}</div>
                  <div><b>ວັນທີ:</b> {new Date(selectedReceipt.date).toLocaleString('lo-LA')}</div>
                  <div><b>ພະນັກງານຂາຍ:</b> {selectedReceipt.cashierName || 'Online Shop'}</div>
                  <div><b>ການຊຳລະ:</b> {selectedReceipt.id.startsWith('ONL-') ? 'ໂອນທະນາຄານ (Online)' : (selectedReceipt.paymentMethod === 'treat' ? '🎁 ລ້ຽງແຂກ' : (selectedReceipt.paymentMethod === 'cash' ? 'ເງິນສົດ' : selectedReceipt.paymentMethod === 'split' ? 'ເງິນສົດ + ໂອນ' : 'ໂອນທະນາຄານ'))}</div>
                  {selectedReceipt.bankTxRef && <div><b>ເລກອ້າງອີງ:</b> {selectedReceipt.bankTxRef}</div>}
                  {selectedReceipt.id.startsWith('ONL-') && selectedReceipt.shippingAddress && (
                    <div style={{ marginTop: '4px', borderTop: '0.5px solid #ccc', paddingTop: '4px', fontSize: '7.5pt' }}>
                      <b>ທີ່ຢູ່ຈັດສົ່ງ:</b> {selectedReceipt.shippingAddress.recipientName} ({selectedReceipt.shippingAddress.phone})<br/>
                      {selectedReceipt.shippingAddress.village}, {selectedReceipt.shippingAddress.city}, {selectedReceipt.shippingAddress.province}
                      {selectedReceipt.shippingAddress.notes && <div>* ໝາຍເຫດ: {selectedReceipt.shippingAddress.notes}</div>}
                    </div>
                  )}
                </div>

                <div className="print-receipt-divider"></div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid black', textAlign: 'left' }}>
                      <th style={{ paddingBottom: '4px' }}>ລາຍການ</th>
                      <th style={{ width: '25px', textAlign: 'center', paddingBottom: '4px' }}>ຈຳນວນ</th>
                      <th style={{ width: '70px', textAlign: 'right', paddingBottom: '4px' }}>ລາຄາ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ paddingTop: '4px', paddingBottom: '4px', lineHeight: '1.2' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', paddingTop: '4px' }}>{item.qty}</td>
                        <td style={{ textAlign: 'right', paddingTop: '4px' }}>{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="print-receipt-divider"></div>

                <div className="print-receipt-totals">
                  <span>ລວມຍອດ:</span>
                  <span>{(selectedReceipt.subtotal !== undefined ? selectedReceipt.subtotal : selectedReceipt.total).toLocaleString()} ກີບ</span>
                </div>
                {selectedReceipt.discount > 0 && (
                  <div className="print-receipt-totals" style={{ fontWeight: 'normal', fontSize: '9pt' }}>
                    <span>ສ່ວນຫຼຸດ:</span>
                    <span>-{selectedReceipt.discount.toLocaleString()} ກີບ</span>
                  </div>
                )}
                <div className="print-receipt-totals" style={{ fontSize: '11pt', borderTop: '1px solid black', paddingTop: '4px' }}>
                  <span>ຍອດລວມສຸດທິ:</span>
                  <span>{selectedReceipt.total.toLocaleString()} ກີບ</span>
                </div>

                {selectedReceipt.payCurrency && selectedReceipt.payCurrency !== 'LAK' && (
                  <div className="print-receipt-totals" style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '4px' }}>
                    <span>ຍອດຊຳລະ ({selectedReceipt.payCurrency}):</span>
                    <span>
                      {selectedReceipt.payCurrency === 'USD' 
                        ? Number(selectedReceipt.currencyTotal || (selectedReceipt.total / (selectedReceipt.exchangeRateUsd || 26000))).toFixed(2) + ' USD'
                        : (selectedReceipt.currencyTotal || Math.ceil(selectedReceipt.total / (selectedReceipt.exchangeRateThb || 750))).toLocaleString() + ' ບາດ'}
                    </span>
                  </div>
                )}

                {selectedReceipt.paymentMethod === 'cash' ? (
                  <div style={{ fontSize: '8pt', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justify_content: 'space-between', justifyContent: 'space-between' }}>
                      <span>ຮັບເງິນ ({selectedReceipt.payCurrency || 'LAK'}):</span>
                      <span>
                        {selectedReceipt.payCurrency === 'USD'
                          ? Number(selectedReceipt.currencyCashReceived || selectedReceipt.cashReceived).toFixed(2) + ' USD'
                          : (selectedReceipt.currencyCashReceived || selectedReceipt.cashReceived).toLocaleString() + ' ' + (selectedReceipt.payCurrency === 'THB' ? 'ບາດ' : selectedReceipt.payCurrency === 'USD' ? 'USD' : 'ກີບ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justify_content: 'space-between', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>ເງິນທອນ ({selectedReceipt.payCurrency || 'LAK'}):</span>
                      <span>
                        {selectedReceipt.payCurrency === 'USD'
                          ? Number(selectedReceipt.currencyChange !== undefined ? selectedReceipt.currencyChange : selectedReceipt.change).toFixed(2) + ' USD'
                          : (selectedReceipt.currencyChange !== undefined ? selectedReceipt.currencyChange : selectedReceipt.change).toLocaleString() + ' ' + (selectedReceipt.payCurrency === 'THB' ? 'ບາດ' : selectedReceipt.payCurrency === 'USD' ? 'USD' : 'ກີບ')}
                      </span>
                    </div>
                  </div>
                ) : selectedReceipt.paymentMethod === 'split' ? (
                  <div style={{ fontSize: '8pt', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justify_content: 'space-between', justifyContent: 'space-between' }}>
                      <span>💵 ຮັບເງິນສົດ ({selectedReceipt.payCurrency || 'LAK'}):</span>
                      <span>
                        {selectedReceipt.payCurrency === 'USD'
                          ? Number(selectedReceipt.currencyCashReceived || selectedReceipt.cashReceived).toFixed(2) + ' USD'
                          : (selectedReceipt.currencyCashReceived || selectedReceipt.cashReceived).toLocaleString() + ' ' + (selectedReceipt.payCurrency === 'THB' ? 'ບາດ' : selectedReceipt.payCurrency === 'USD' ? 'USD' : 'ກີບ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justify_content: 'space-between', justifyContent: 'space-between' }}>
                      <span>📱 ຍອດໂອນ (LAK):</span>
                      <span>{(selectedReceipt.transferAmount || 0).toLocaleString()} ₭</span>
                    </div>
                    {selectedReceipt.bankTxRef && (
                      <div style={{ display: 'flex', justify_content: 'space-between', justifyContent: 'space-between', fontSize: '7.5pt', color: '#555' }}>
                        <span>ເລກອ້າງອີງ:</span>
                        <span>{selectedReceipt.bankTxRef}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justify_content: 'space-between', justify_content: 'space-between', fontWeight: 'bold', borderTop: '0.5px dotted #ccc', paddingTop: '4px', marginTop: '4px' }}>
                      <span>ເງິນທອນ ({selectedReceipt.payCurrency || 'LAK'}):</span>
                      <span>
                        {selectedReceipt.payCurrency === 'USD'
                          ? Number(selectedReceipt.currencyChange !== undefined ? selectedReceipt.currencyChange : selectedReceipt.change).toFixed(2) + ' USD'
                          : (selectedReceipt.currencyChange !== undefined ? selectedReceipt.currencyChange : selectedReceipt.change).toLocaleString() + ' ' + (selectedReceipt.payCurrency === 'THB' ? 'ບາດ' : selectedReceipt.payCurrency === 'USD' ? 'USD' : 'ກີບ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '8pt', marginTop: '6px', border: '0.5px solid black', padding: '4px', textAlign: 'center' }}>
                    <span>ຊຳລະຜ່ານການໂອນທະນາຄານ BCEL One ສຳເລັດແລ້ວ</span>
                    {selectedReceipt.bankTxRef && <div>Ref: {selectedReceipt.bankTxRef}</div>}
                  </div>
                )}
                {selectedReceipt.treatRemark && (
                  <div style={{ marginTop: '8px', padding: '6px', borderTop: '1px dashed #ccc', fontSize: '11px', color: '#555', fontStyle: 'italic', textAlign: 'center' }}>
                    ໝາຍເຫດ: {selectedReceipt.treatRemark}
                  </div>
                )}

                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '7.5pt', borderTop: '1px dotted black', paddingTop: '8px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>ຊ່ອງທາງການຊຳລະເງິນຮ້ານ (BCEL One QR)</p>
                  <p>ຊື່ບັນຊີ: {settings.bankAccountName}</p>
                  <p>ເລກບັນຊີ: {settings.bankAccountNumber}</p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                    <img
                      src={`${settings.bankQrTemplate}${selectedReceipt.total}`}
                      alt="BCEL One QR"
                      style={{ width: '90px', height: '90px' }}
                    />
                  </div>
                </div>

                <div className="print-receipt-footer" style={{ borderTop: '1px dashed black', marginTop: '10px', paddingTop: '5px' }}>
                  <p>ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
                  <p>ພຣະເຄື່ອງຄຸ້ມຄອງ, ໂຊກດີ ມີໄຊ!</p>
                </div>
              </div>

            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowReprintModal(false)}>ປິດ</button>
              <button className="btn btn-primary" onClick={executePrint}>🖨️ ປຣິນໃບບິນຄືນ (Reprint)</button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {reportTab === 'treats' && (() => {
        const treatOrders = rangeOrders.filter(o => o.paymentMethod === 'treat');
        const totalTreatValue = treatOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        return (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎁 ຈຳນວນຄັ້ງທີ່ລ້ຽງແຂກ (Total Treats)</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e67e22' }}>
                  {treatOrders.length} ຄັ້ງ
                </span>
              </div>
              <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💰 ມູນຄ່າລວມທີ່ລ້ຽງ (Estimated Value)</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--alert-red)' }}>
                  {totalTreatValue.toLocaleString()} ₭
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.02rem', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                📋 ລາຍລະອຽດການລ້ຽງແຂກ (Treat History & Logs)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '12px' }}>ເລກບິນ (ID)</th>
                      <th style={{ padding: '12px' }}>ວັນທີ / ເວລາ</th>
                      <th style={{ padding: '12px' }}>ຜູ້ອະນຸມັດ/ຫົວໜ້າ (Treated By)</th>
                      <th style={{ padding: '12px' }}>ລາຍການສິນຄ້າ</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>ມູນຄ່າ (Value)</th>
                      <th style={{ padding: '12px' }}>ໝາຍເຫດ/ເຫດຜົນ (Remark)</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>ບິນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          ບໍ່ມີລາຍການລ້ຽງແຂກໃນຊ່ວງເວລានີ້
                        </td>
                      </tr>
                    ) : (
                      treatOrders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--gold-primary)' }}>{order.id}</td>
                          <td style={{ padding: '12px' }}>{new Date(order.date).toLocaleString('lo-LA')}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22' }}>{order.cashierName || 'ເຈົ້າຂອງຮ້ານ'}</td>
                          <td style={{ padding: '12px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(order.items || []).map(i => `${i.name} (x${i.qty})`).join(', ')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{order.total.toLocaleString()} ₭</td>
                          <td style={{ padding: '12px', color: '#e67e22', fontStyle: 'italic' }}>{order.treatRemark || 'ບໍ່ມີໝາຍເຫດ'}</td>
                          <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleReprint(order)}
                            >
                              🖨️ ເປີດເບິ່ງ
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '3px 8px', fontSize: '0.75rem', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c' }}
                              onClick={() => handleRequestDelete('pos', order.id, 'ລ້ຽງແຂກ')}
                            >
                              🗑️ ລຶບ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
