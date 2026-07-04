// Mock database utility using localStorage for "ຂອບພຣະຣັທເກຊ" (Amulet POS & Framing)
// Tailored for Lao language, LAK (ກີບ) currency.

const DEFAULT_CATEGORIES = [
  { id: 'frames', name: 'ຂอบພຣະ', icon: '🖼️', type: 'physical' },
  { id: 'amulets', name: 'ພຣະເຄື່ອງ', icon: '📿', type: 'physical' },
  { id: 'necklaces', name: 'ສ້ອຍຄໍ & ອຸປະກອນ', icon: '⛓️', type: 'physical' },
  { id: 'services', name: 'ບໍລິການອັດກັນນ້ຳ', icon: '🛠️', type: 'service' }
];

const DEFAULT_USERS = [
{ id: 'owner', name: 'ທ້າວ ສົມຈິດ (ສົມ)', role: 'owner', passcode: '1111', email: 'owner@gmail.com', password: 'owner123', roleName: 'ເຈົ້າຂອງຮ້ານ (Owner)', payType: 'daily', baseWage: 150000, otRate: 25000, permissions: { admin: true, pos: true, inventory: true, hrm: true, reports: true, debts: true, ai: true, settings: true } },
{ id: 'cashier', name: 'ນາງ จັນທະມາ (ຈັນ)', role: 'cashier', passcode: '2222', email: 'cashier@gmail.com', password: 'cashier123', roleName: 'ພະນັກງານຂາຍ (Cashier)', payType: 'monthly', baseWage: 2400000, otRate: 15000, permissions: { admin: false, pos: true, inventory: false, hrm: false, reports: false, debts: true, ai: false, settings: false } },
{ id: 'technician', name: 'ທ້າວ ບຸນມີ (ມີ)', role: 'technician', passcode: '3333', email: 'tech@gmail.com', password: 'tech123', roleName: 'ຊ່າງອັດກອບ (Technician)', payType: 'daily', baseWage: 100000, otRate: 20000, permissions: { admin: false, pos: true, inventory: false, hrm: false, reports: false, debts: false, ai: true, settings: false } }
];

const DEFAULT_PRODUCTS = [
// Amulet Frames
{ id: 'P_K05', barcode: 'K05', name: 'ກອບທອງອີຕາລີ K05 (กรอบทองอิตาลี)', category: 'frames', price: 150000, cost: 100000, stock: 20, minStock: 2, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60' },
{ id: 'P_C009_E195', barcode: 'C009-E195', name: 'ກອບທອງອີຕາລີ C009-E195 (กรอบทองอิตาลี)', category: 'frames', price: 150000, cost: 100000, stock: 20, minStock: 2, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60' },
{ id: 'P001', barcode: '885001', name: 'ຂອບຄຳແທ້ 90% (ຊຸ້ມກໍ)', category: 'frames', price: 2800000, cost: 2200000, stock: 5, minStock: 2, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60' },
{ id: 'P002', barcode: '885002', name: 'ຂອບເງິນແທ້ 92.5%', category: 'frames', price: 450000, cost: 300000, stock: 12, minStock: 4, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&auto=format&fit=crop&q=60' },
{ id: 'P003', barcode: '885003', name: 'ຂອບຜ່າຫວາຍສະແຕນເລດ', category: 'frames', price: 85000, cost: 35000, stock: 45, minStock: 10, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=60' },
{ id: 'P004', barcode: '885004', name: 'ຂອບໄມ້ສັກແທ້ (ຕັ້ງໂຕະ)', category: 'frames', price: 180000, cost: 90000, stock: 8, minStock: 3, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&auto=format&fit=crop&q=60' },
{ id: 'P005', barcode: '885005', name: 'ຂອບຄຳຮອງຍາ (ລົງຢາແດງ)', category: 'frames', price: 3100000, cost: 2500000, stock: 3, minStock: 1, unit: 'ອັນ', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60' },

// Amulets & Holy Objects
{ id: 'P006', barcode: '885006', name: 'ທ້າວເວດສຸວັນ ຫຼວງພໍ່ພັດ ປີ 63', category: 'amulets', price: 350000, cost: 180000, stock: 10, minStock: 3, unit: 'ອົງ', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&auto=format&fit=crop&q=60' },
{ id: 'P007', barcode: '885007', name: 'ພຣະສົມເດັດວັດລະຄັງ (ລຸ້ນພິເສດ)', category: 'amulets', price: 1200000, cost: 600000, stock: 2, minStock: 1, unit: 'ອົງ', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&auto=format&fit=crop&q=60' },

// Necklaces & Accessories
{ id: 'P008', barcode: '885008', name: 'ສ້ອຍຄໍຄຳແທ້ 1 ບາດ', category: 'necklaces', price: 32000000, cost: 29500000, stock: 3, minStock: 1, unit: 'ເສັ້ນ', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60' },
{ id: 'P009', barcode: '885009', name: 'ສ້ອຍເຊືອກຖັກມື (ຫ້ອຍພຣະ 3 ອົງ)', category: 'necklaces', price: 120000, cost: 50000, stock: 15, minStock: 4, unit: 'ເສັ້ນ', image: 'https://images.unsplash.com/photo-1611085583191-a3b1a30a5a40?w=200&auto=format&fit=crop&q=60' },
{ id: 'P010', barcode: '885010', name: 'ສ້ອຍສະແຕນເລດລາຍກະດູກງູ', category: 'necklaces', price: 75000, cost: 30000, stock: 30, minStock: 5, unit: 'ເສັ້ນ', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=60' },

// Custom Waterproof framing service (Standard billing item)
{ id: 'S001', barcode: '990001', name: 'ບໍລິການອັດກັນນ້ຳ (ເລນໃສ/ປົກກະຕິ)', category: 'services', price: 60000, cost: 10000, stock: 999, minStock: 0, unit: 'ອົງ', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&auto=format&fit=crop&q=60' },
{ id: 'S002', barcode: '990002', name: 'ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)', category: 'services', price: 90000, cost: 15000, stock: 999, minStock: 0, unit: 'ອົງ', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&auto=format&fit=crop&q=60' }
];

const DEFAULT_PROMOTIONS = [
{ id: 'FREEWATER', code: 'FREEWATER', name: 'ແຖມຟຣີບໍລິການອັດກັນນ້ຳ 60,000 ກີບ', type: 'fixed', value: 60000, minPurchase: 0, active: true },
{ id: 'PROMO10', code: 'DISCOUNT10', name: 'ສ່ວນຫຼຸດ 10%', type: 'percentage', value: 10, minPurchase: 500000, active: true },
{ id: 'PROMO50K', code: 'SAVE50K', name: 'ສ່ວນຫຼຸດ 50,000 ກີບ', type: 'fixed', value: 50000, minPurchase: 1000000, active: true }
];

const DEFAULT_CCTV_CAMERAS = [
{ id: 'CAM-1', name: 'ກ້ອງ 01: ທາງເຂົ້າໜ້າຮ້ານ', type: 'ip', url: '', active: true, checks: { intruder: true, cashierAudit: false, slacking: false } },
{ id: 'CAM-2', name: 'ກ້ອງ 02: ເຄົາເຕີແຄຊເຊຍ', type: 'ip', url: '', active: true, checks: { intruder: false, cashierAudit: true, slacking: true } },
{ id: 'CAM-3', name: 'ກ້ອງ 03: ຕູ້ໂຊພຣະເຄື່ອງ', type: 'ip', url: '', active: true, checks: { intruder: true, cashierAudit: false, slacking: false } },
{ id: 'CAM-4', name: 'ກ້ອງ 04: ໂຊນຊ່າງອັດກອບ', type: 'ip', url: '', active: true, checks: { intruder: false, cashierAudit: false, slacking: true } }
];

const DEFAULT_CCTV_ALERTS = [
{
id: 'ALT-1',
timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
cameraId: 'CAM-2',
cameraName: 'ກ້ອງ 02: ເຄົາເຕີແຄຊເຊຍ',
type: 'cashier_away',
typeName: 'ພະນັກງານບໍ່ຢູ່ບ່ອນປະຈຳການ',
description: 'ພະນັກງານບໍ່ຢູ່ປະຈຳການເຄົາເຕີເກີນ 15 ນາທີ ໃນເວລາລູກຄ້າໜາແໜ້ນ',
resolved: false
},
{
id: 'ALT-2',
timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
cameraId: 'CAM-4',
cameraName: 'ກ້ອງ 04: ໂຊນຊ່າງອັດກອບ',
type: 'slacking',
typeName: 'ກວດພົບການອູ້ງານ/ຫຼິ້ນໂທລະສັບ',
description: 'ກວດພົບພະນັກງານນັ່ງຫຼິ້ນເກມ ຫຼື ໂທລະສັບຕິດຕໍ່ກັນເກີນ 20 ນາທີ',
resolved: false
},
{
id: 'ALT-3',
timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
cameraId: 'CAM-1',
cameraName: 'ກ້ອງ 01: ທາງເຂົ້າໜ້າຮ້ານ',
type: 'intrusion',
typeName: 'ກວດພົບການບຸກລຸກ',
description: 'ກວດພົບການເຄື່ອນໄຫວຜິດປົກກະຕິໃນເວລາປິດຮ້ານ 03:22 ໂມງ',
resolved: true
}
];

const DEFAULT_ATTENDANCE_LOGS = [
{
id: 'ATT-1',
userId: 'cashier',
userName: 'ນາງ ຈັນທະມາ (ຈັນ)',
date: new Date(Date.now() - 86400000).toLocaleDateString('en-CA'),
clockIn: new Date(Date.now() - 86400000 - 3600000 * 9).toISOString(),
clockOut: new Date(Date.now() - 86400000 - 3600000 * 0.5).toISOString(),
workHours: 8.5,
workedPercent: 100,
otHours: 0.5,
payout: 87500,
status: 'present'
},
{
id: 'ATT-2',
userId: 'technician',
userName: 'ທ້າວ ບຸນມີ (ມີ)',
date: new Date(Date.now() - 86400000).toLocaleDateString('en-CA'),
clockIn: new Date(Date.now() - 86400000 - 3600000 * 8).toISOString(),
clockOut: new Date(Date.now() - 86400000).toISOString(),
workHours: 8.0,
workedPercent: 100,
otHours: 0.0,
payout: 100000,
status: 'present'
}
];

const DEFAULT_SETTINGS = {
  shopName: 'ຂອບພຣະຣັທເກຊ',
  shopSubtitle: 'ຮ້ານອັດກອບພຣະເຄື່ອງ & ວັດຖຸມຸງຄຸນ',
  shopPhone: '02023304555',
  shopAddress: 'ປາກເຊ, ແຂວງຈຳປາສັກ',
  shopLogo: '',
  bankName: 'BCEL One (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ)',
  bankAccountName: 'KOP PHRA KHRUANG POS CO., LTD',
  bankAccountNumber: '010-12-00-019284920',
  bankQrTemplate: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bcelone://qr/transfer?acc=0101200019284920&amount=',
  bankQrPreview: '',
  lowStockThreshold: 5,
  taxRate: 0,
  logoSvg: '',
  receiptLogoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60',
  receiptHeaderNote: 'ຂອບພຣະຣັທເກຊ - ປາກເຊ',
  receiptFooterNote: 'ພຣະເຄື່ອງຄຸ້ມຄອງ, ໂກດີ ມີໄຊ!',
  appTheme: 'gold', // gold, amber, emerald, blue, crimson
  showQrOnReceipt: true,
  masterAdminPin: '1111',
  exchangeRateThb: 750,
  exchangeRateUsd: 26000,
  trackingBaseUrl: '',
  workStartTime: '08:00',
  workEndTime: '17:00',
  dailyWages: { owner: 150000, cashier: 80000, technician: 100000 },
  otHourlyRates: { owner: 25000, cashier: 15000, technician: 20000 },
  labels: {},
  frameStyles: ['ກອບໃສ', 'ກອບສີ', 'ເລເຊີລາຍ', 'ກັນນ້ຳ 100%'],
  acrylicThicknesses: ['1.5 mm', '2.0 mm', '3.0 mm', '4.0 mm', '5.0 mm'],
  // Receipt customizer fields
  receiptPaperWidth: '80mm',
  receiptFontSize: '10pt',
  receiptQrSize: 'medium',
  receiptShowLogo: true,
  receiptShowHeader: true,
  receiptShowContactInfo: true,
  receiptShowBillId: true,
  receiptShowDate: true,
  receiptShowCashier: true,
  receiptShowPaymentMethod: true,
  receiptShowCustomer: true,
  receiptShowSubtotal: true,
  receiptShowDiscount: true,
  receiptShowTotal: true,
  receiptShowChange: true,
  receiptShowEquivalent: true,
  receiptShowSignatures: true,
  receiptShowFooter: true,
  // Notification settings
  notifyProvider: 'none',
  telegramBotToken: '',
  telegramChatId: '',
  discordWebhookUrl: '',
  lineNotifyToken: '',
  // Barcode / Scanner settings
  barcodeBeep: true,
  barcodeDelay: 50,
  barcodeStickerWidth: '40mm',
  barcodeStickerHeight: '25mm',
  barcodeFontSize: '10pt',
  barcodeFormat: 'CODE128',
  barcodeDirectPrint: false,
  windowsBarcodePrinterName: 'Barcode Printer',
  barcodePaperWidth: '40mm',
  barcodePaperHeight: '25mm',
  barcodeMarginLeft: '0mm',
  barcodeMarginTop: '0mm',
  barcodeColumns: 1,
  barcodeGapX: '2mm',
  barcodeGapY: '2mm',
  barcodeProfile: '1_col_40_30',
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
  themeConfig: {
    colors: {
      primary: '#D4AF37',      // Gold
      secondary: '#4A3B32',    // Dark brown
      success: '#2ecc71',      // Emerald green
      warning: '#f1c40f',      // Amber
      danger: '#e74c3c',       // Crimson red
      background: '#13110F',   // Jet dark bg
      surface: '#1E1B18',      // Sidebar/Card surface
      sidebar: '#1E1B18',
      topbar: '#191613',
      card: '#24201C',
      table: '#1E1B18',
      border: '#3D352E'
    },
    typography: {
      fontFamily: 'Outfit, Phetsarath OT, sans-serif',
      fontSizeBase: '14px',
      lineHeight: '1.5',
      fontWeightNormal: '400',
      fontWeightBold: '700'
    },
    layout: {
      sidebarWidth: '260px',
      sidebarCollapsedWidth: '70px',
      borderRadius: '8px',
      spacing: '16px',
      containerWidth: '1200px'
    },
    mode: 'dark'
  },
  uiControls: {
    animationEnabled: true,
    shadowsEnabled: true,
    roundedCorners: true,
    hoverEffects: true,
    skeletonLoading: true,
    toastNotifications: true,
    autoRefreshDashboard: true,
    soundEffects: false
  },
  dashboardBuilder: {
    widgets: ['sales_today', 'revenue_chart', 'stock_valuation', 'capacity_widget', 'attendance_checklist'],
    layout: [],
    refreshInterval: 60
  },
  // Data Retention Settings
  dataRetentionEnabled: false,
  dataRetentionDaysBills: 365,
  dataRetentionDaysOrders: 365,
  dataRetentionDaysDebts: 365,
  dataRetentionMaxPerRun: 10,
  // Online Shop Settings
  onlineShopThemeColor: '#3498db',
  onlineShopAccentColor: '#f1c40f',
  onlineShopBanner: 'ຍິນດີຕ້ອນຮັບສູ່ ຮ້ានອອນລາຍ KP Pakse!',
  onlineShopLang: 'lo'
};

export const DEFAULT_LABEL_KEYS = [
  { key: 'tab_pos', defaultValue: "💵 ຂາຍໜ້າຮ້ານ (POS)", desc: 'ແທັບ ຂາຍໜ້າຮ້ານ (POS)', section: 'navigation' },
  { key: 'tab_inventory', defaultValue: "📦 ສະຕັອກ (Inventory)", desc: 'ແທັບ ສະຕັອກສິນຄ້າ (Inventory)', section: 'navigation' },
  { key: 'tab_reports', defaultValue: "📊 ລາຍງານ (Reports)", desc: 'ແທັບ ລາຍງານ (Reports)', section: 'navigation' },
  { key: 'tab_debts', defaultValue: "📒 ບັນຊີຕິດໜີ້ (Debts)", desc: 'ແທັບ ບັນຊີຕິດໜີ້ (Debts)', section: 'navigation' },
  { key: 'tab_ai', defaultValue: "🤖 ລະບົບ AI", desc: 'ແທັບ ລະບົບ AI', section: 'navigation' },
  { key: 'tab_settings', defaultValue: "⚙️ ຕັ້ງຄ່າ (Settings)", desc: 'ແທັບ ຕັ້ງຄ່າ (Settings)', section: 'navigation' },
  { key: 'tab_hrm', defaultValue: "👥 ຈັດການບຸກຄະລາກອນ (HRM)", desc: 'ແທັບ ຈັດການບຸກຄະລາກອນ (HRM)', section: 'navigation' },
  { key: 'tab_framing', defaultValue: "🛠️ ງານອັດກອບ (Framing)", desc: 'ແທັບ ງານອັດກອບ (Framing)', section: 'navigation' },
  { key: 'title_hrm', defaultValue: "👥 ລະບົບຈັດການບຸກຄະລາກອນ & ເງິນເດືອນ (HRM)", desc: 'ຫົວຂໍ້ ລະບົບຈັດການບຸກຄະລາກອນ', section: 'system' },
  { key: 'hrm_sub_desc', defaultValue: "ຈັດການບັນຊີພະນັກງານ, ຕາຕະລາງກະເຮັດວຽກ, ລະບົບເຂົ້າງານ, ການຂໍລາພັກ ແລະ ບັນຊີເງິນເດືອນ.", desc: 'ຄຳອະທິບາຍໃຕ້ຫົວຂໍ້ HRM', section: 'hrm' },
  { key: 'hrm_tab_employees', defaultValue: "👥 ພະນັກງານ", desc: 'ແທັບຍ່ອຍ ພະນັກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_tab_shifts', defaultValue: "📅 ຕາຕະລາງກະ", desc: 'ແທັບຍ່ອຍ ຕາຕະລາງກະ (HRM)', section: 'hrm' },
  { key: 'hrm_tab_attendance', defaultValue: "🕒 ລະບົບເຂົ້າງານ", desc: 'ແທັບຍ່ອຍ ລະບົບເຂົ້າງານ (HRM)', section: 'hrm' },
  { key: 'hrm_tab_leaves', defaultValue: "📝 ການລາພັກ", desc: 'ແທັບຍ່ອຍ ການລາພັກ (HRM)', section: 'hrm' },
  { key: 'hrm_tab_payroll', defaultValue: "💵 ບັນຊີເງິນເດືອນ", desc: 'ແທັບຍ່ອຍ ບັນຊີເງິນເດືອນ (HRM)', section: 'hrm' },
  { key: 'settings_tab_shop', defaultValue: "🏪 ຂໍ້ມູນຮ້ານ (Shop Info)", desc: 'ແທັບຍ່ອຍ ຂໍ້ມູນຮ້ານ (Settings)', section: 'settings' },
  { key: 'settings_tab_receipt', defaultValue: "🖨️ ຮູບແບບໃບບິນ (Receipt Design)", desc: 'ແທັບຍ່ອຍ ຮູບແບບໃບບິນ (Settings)', section: 'settings' },
  { key: 'settings_tab_barcode', defaultValue: "🔌 ບາໂຄດ & ສະແກນ (Barcode/Scanner)", desc: 'ແທັບຍ່ອຍ ບາໂຄດ & ສະແກນ (Settings)', section: 'settings' },
  { key: 'settings_tab_theme', defaultValue: "🎨 ສີ & ຄວາມໂຄ້ງ (Theme/Borders)", desc: 'ແທັບຍ່ອຍ ສີ & ຄວາມໂຄ້ງ (Settings)', section: 'settings' },
  { key: 'settings_tab_labels', defaultValue: "📝 ປັບແຕ່ງພາສາ (Translate Labels)", desc: 'ແທັບຍ່ອຍ ປັບແຕ່ງພາສາ (Settings)', section: 'settings' },
  { key: 'settings_tab_notifications', defaultValue: "🔔 ແຈ້ງເຕືອນໂທລະສັບ (Phone Alerts)", desc: 'ແທັບຍ່ອຍ ແຈ້ງເຕືອນໂທລະສັບ (Settings)', section: 'settings' },
  { key: 'settings_tab_rules', defaultValue: "⚙️ ກົດລະບຽບ (Rules)", desc: 'ແທັບຍ່ອຍ ກົດລະບຽບ (Settings)', section: 'settings' },
  { key: 'settings_tab_coupons', defaultValue: "🏷️ ໂປຣໂມຊັ່ນ (Coupons)", desc: 'ແທັບຍ່ອຍ ໂປຣໂມຊັ່ນ (Settings)', section: 'settings' },
  { key: 'settings_tab_system', defaultValue: "⚠️ ຄວບຄຸມລະບົບ (System)", desc: 'ແທັບຍ່ອຍ ຄວບຄຸມລະບົບ (Settings)', section: 'settings' },
  { key: 'title_debts', defaultValue: "📒 ບັນຊີລູກຄ້າຕິດໜີ້ (Customer Credit Ledger)", desc: 'ຫົວຂໍ້ ບັນຊີລູກຄ້າຕິດໜີ້', section: 'system' },
  { key: 'title_inventory', defaultValue: "📦 ຈັດການຄັງສິນຄ້າ & ສະຕັອກ (Inventory)", desc: 'ຫົວຂໍ້ ຈັດການຄັງສິນຄ້າ & ສະຕັອກ', section: 'system' },
  { key: 'pos_board_title', defaultValue: "📿 ບັດຄິວອັດກອບພຣະເຄື່ອງ (Queue Selection Board)", desc: 'ຫົວຂໍ້ ບັດຄິວອັດກອບພຣະເຄື່ອງ', section: 'pos' },
  { key: 'pos_board_subtitle', defaultValue: "ເລືອກບັດຄິວລູກຄ້າເພື່ອເພີ່ມລາຍການຂາຍ, ອັດກັນນ້ຳ, ພິມບິນຮັບຝາກ ຫຼື ຊຳລະຍອດຄ້າງ", desc: 'ຄຳອະທິບາຍໃຕ້ຫົວຂໍ້ ບັດຄິວອັດກອບ', section: 'pos' },
  { key: 'pos_walk_in', defaultValue: "Walk-In", desc: 'ຄິວທົ່ວໄປ (Walk-In)', section: 'pos' },
  { key: 'cart_title', defaultValue: "🛒 ກະຕ່າສິນຄ້າ (Shopping Cart)", desc: 'ຫົວຂໍ້ ກະຕ່າສິນຄ້າ', section: 'pos' },
  { key: 'pos_queue', defaultValue: "ຄິວ", desc: 'ຄຳວ່າ ຄິວ', section: 'pos' },
  { key: 'cart_empty', defaultValue: "ບໍ່ມີລາຍການສິນຄ້າໃນກະຕ່າ", desc: 'ຂໍ້ຄວາມ ກະຕ່າສິນຄ້າວ່າງ', section: 'pos' },
  { key: 'cart_subtotal', defaultValue: "ຍອດລວມກ່ອນຫຼຸດ:", desc: 'ຍອດລວມກ່ອນຫຼຸດ', section: 'pos' },
  { key: 'cart_discount', defaultValue: "ສ່ວນຫຼຸດ:", desc: 'ສ່ວນຫຼຸດ', section: 'pos' },
  { key: 'cart_total', defaultValue: "ຍອດລວມສຸດທິ:", desc: 'ຍອດລວມສຸດທິ', section: 'pos' },
  { key: 'cart_work_order_btn', defaultValue: "🖨️ ພິມບິນ", desc: 'ປຸ່ມ ພິມບິນຮັບຝາກ', section: 'pos' },
  { key: 'cart_debt_btn', defaultValue: "📒 ຕິດໜີ້", desc: 'ປຸ່ມ ຕິດໜີ້', section: 'pos' },
  { key: 'cart_pay_btn', defaultValue: "💵 ຊຳລະເງິນ", desc: 'ປຸ່ມ ຊຳລະເງິນ', section: 'pos' },
  { key: 'chk_title', defaultValue: "ຂັ້ນຕອນການຊຳລະເງິນ (Checkout)", desc: 'ຫົວຂໍ້ ຂັ້ນຕອນການຊຳລະເງິນ', section: 'pos' },
  { key: 'chk_pay_method', defaultValue: "ຊ່ອງທາງການຊຳລະເງິນ", desc: 'ຊ່ອງທາງການຊຳລະເງິນ', section: 'pos' },
  { key: 'chk_cash', defaultValue: "💵 ເງິນສົດ (Cash)", desc: 'ຕົວເລືອກ ເງິນສົດ', section: 'pos' },
  { key: 'chk_transfer', defaultValue: "📱 ໂອນຜ່ານທະນາຄານ (BCEL One)", desc: 'ຕົວເລືອກ ໂອນຜ່ານທະนาຄານ', section: 'pos' },
  { key: 'chk_received', defaultValue: "ຮັບເງິນສົດມາ", desc: 'ຄຳວ່າ ຮັບເງິນສົດມາ', section: 'pos' },
  { key: 'chk_change', defaultValue: "ເງິນທອນ (Change)", desc: 'ຄຳວ່າ ເງິນທອນ', section: 'pos' },
  { key: 'chk_confirm_btn', defaultValue: "💾 ຢືນຢັນການຊຳລະ", desc: 'ປຸ່ມ ຢືນຢັນການຊຳລະ', section: 'pos' },
  { key: 'rcpt_title', defaultValue: "ໃບບິນຮັບເງິນ / RECEIPT", desc: 'ຫົວຂໍ້ ໃບບິນຮັບເງິນ', section: 'receipt' },
  { key: 'rcpt_bill_no', defaultValue: "ເລກບິນ:", desc: 'ຄຳວ່າ ເລກບິນ:', section: 'receipt' },
  { key: 'rcpt_date', defaultValue: "ວັນທີ:", desc: 'ຄຳວ່າ ວັນທີ:', section: 'receipt' },
  { key: 'rcpt_cashier', defaultValue: "ພະນັກງານຂາຍ:", desc: 'ຄຳວ່າ ພະນັກງານຂາຍ:', section: 'receipt' },
  { key: 'rcpt_paid_by', defaultValue: "ຜູ້ຈ່າຍເງິນ (Paid By)", desc: 'ຄຳວ່າ ຜູ້ຈ່າຍເງິນ', section: 'receipt' },
  { key: 'rcpt_received_by', defaultValue: "ຜູ້ຮັບເງິນ (Received By)", desc: 'ຄຳວ່າ ຜູ້ຮັບເງິນ', section: 'receipt' },
  { key: 'rcpt_payment_method_label', defaultValue: "ການຊຳລະ:", desc: 'ປ້າຍກຳກັບວິທີຊຳລະເງິນໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_payment_cash', defaultValue: "ເງິນສົດ (Cash)", desc: 'ວິທີຊຳລະດ້ວຍເງິນສົດ', section: 'receipt' },
  { key: 'rcpt_payment_transfer', defaultValue: "ໂອນທະນາຄານ (BCEL)", desc: 'ວິທີຊຳລະດ້ວຍການໂອນເງິນ', section: 'receipt' },
  { key: 'rcpt_customer_label', defaultValue: "ລູກຄ້າ:", desc: 'ປ້າຍກຳກັບລູກຄ້າໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_customer_general', defaultValue: "ລູກຄ້າທົ່ວໄປ", desc: 'ຊື່ລູກຄ້າທົ່ວໄປເລີ່ມຕົ້ນ', section: 'receipt' },
  { key: 'rcpt_header_item', defaultValue: "ລາຍການ", desc: 'ຫົວຂໍ້ຖັນລາຍການໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_header_qty', defaultValue: "ຈຳນວນ", desc: 'ຫົວຂໍ້ຖັນຈຳນວນໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_header_price', defaultValue: "ລາຄາ", desc: 'ຫົວຂໍ້ຖັນລາຄາໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_subtotal', defaultValue: "ຍອດລວມ:", desc: 'ປ້າຍກຳກັບຍອດລວມກ່ອນຫຼຸດໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_discount_label', defaultValue: "ສ່ວນຫຼຸດ:", desc: 'ປ້າຍກຳກັບສ່ວນຫຼຸດໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_total_label', defaultValue: "ຍອດຊຳລະສຸດທິ:", desc: 'ປ້າຍກຳກັບຍອດຊຳລະສຸດທິໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_payment_amount_label', defaultValue: "ຍອດຊຳລະ", desc: 'ປ້າຍກຳກັບຍອດຊຳລະສະกຸນເງິນອື່น', section: 'receipt' },
  { key: 'rcpt_received_label', defaultValue: "ຮັບເງິນ", desc: 'ປ້າຍກຳກັບເງິນທີ່ຮັບມາ', section: 'receipt' },
  { key: 'rcpt_change_label', defaultValue: "ເງິນທອນ", desc: 'ປ້າຍກຳກັບເງິນທອນ', section: 'receipt' },
  { key: 'rcpt_ref_label', defaultValue: "ເລກອ້າງອີງ (Ref):", desc: 'ປ້າຍກຳກັບເລກອ້າງອີງການໂອນ', section: 'receipt' },
  { key: 'rcpt_equivalent_totals_label', defaultValue: "ມູນຄ່າທຽບເທົ່າ (Equivalent)", desc: 'ປ້າຍກຳກັບຫົວຂໍ້ຍອດທຽບເທົ່າ', section: 'receipt' },
  { key: 'rcpt_currency_lak', defaultValue: "LAK (ກີບ):", desc: 'ປ້າຍກຳກັບສະກຸນເງິນ ກີບ', section: 'receipt' },
  { key: 'rcpt_currency_thb', defaultValue: "THB (ບາດ):", desc: 'ປ້າຍກຳກັບສະກຸນເງິນ ບາດ', section: 'receipt' },
  { key: 'rcpt_currency_usd', defaultValue: "USD (ໂດລາ):", desc: 'ປ້າຍກຳກັບສະກຸນເງິນ ໂດລາ', section: 'receipt' },
  { key: 'rcpt_exchange_rate_label', defaultValue: "ອັດຕາແລກປ່ຽນ:", desc: 'ປ້າຍກຳກັບອັດຕາແລกປ່ຽນໃນໃບບິນ', section: 'receipt' },
  { key: 'rcpt_qr_payment_title', defaultValue: "QR Code ຮັບເງິນ (BCEL One)", desc: 'ປ້າຍກຳກັບຫົວຂໍ້ QR Code ຮັບເງິນ', section: 'receipt' },
  { key: 'rcpt_bank_account_name_label', defaultValue: "ຊື່ບັນຊີ:", desc: 'ປ້າຍກຳກັບຊື່ບັນຊີທະນາຄານ', section: 'receipt' },
  { key: 'rcpt_bank_account_no_label', defaultValue: "ເລກບັນຊີ:", desc: 'ປ້າຍກຳກັບເລກບັນຊີທະນາຄານ', section: 'receipt' },
  { key: 'rcpt_transfer_success_msg', defaultValue: "ຊຳລະຜ່ານການໂອນທະນາຄານ BCEL One ສຳເລັດແລ້ວ", desc: 'ຂໍ້ຄວາມຢືນຢັນການໂອນເງິນໃນໃບບິນ', section: 'receipt' },
  { key: 'title_reports', defaultValue: "📊 ບົດລາຍງານຍອດຂາຍ & ການເງິນ (Sales & Finance Reports)", desc: 'ຫົວຂໍ້ ບົດລາຍງານຍອດຂາຍ & ການເງິນ', section: 'system' },
  { key: 'login_email_label', defaultValue: "Gmail / Email", desc: 'ປ້າຍກຳກັບຊ່ອງອີເມລ (Gmail/Email label) ໃນໜ້າ Login', section: 'settings' },
  { key: 'login_password_label', defaultValue: "ລະຫັດຜ່ານ (Password)", desc: 'ປ້າຍກຳກັບຊ່ອງລະຫັດຜ່ານ (Password label) ໃນໜ້າ Login', section: 'settings' },
  { key: 'login_btn_text', defaultValue: "🚀 ເຂົ້າສູ່ລະບົບ", desc: 'ປຸ່ມເຂົ້າສູ່ລະບົບ (Log In button) ໃນໜ້າ Login', section: 'settings' },
  { key: 'login_error_invalid', defaultValue: "ອີເມລ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!", desc: 'ຂໍ້ຄວາມແຈ້ງເຕືອນເມື່ອປ້ອນລະຫັດຜິດ (Invalid login message)', section: 'settings' },
  { key: 'pos_add_queue', defaultValue: "ເພີ່ມບັດຄິວ", desc: 'ປຸ່ມ ເພີ່ມບັດຄິວ', section: 'pos' },
  { key: 'pos_add_queue_title', defaultValue: "➕ ເພີ່ມບັດຄິວ (Add Queue)", desc: 'ຫົວຂໍ້ ປ໋ອບອັບເພີ່ມບັດຄິວ', section: 'pos' },
  { key: 'pos_board_title_short', defaultValue: "ບັດຄິວ", desc: 'ຄຳວ່າ ບັດຄິວ (ແບບສັ້ນ)', section: 'pos' },
  { key: 'slot_entry_subtitle', defaultValue: "ເລືອກປະເພດການໃຫ້ບໍລິການ", desc: 'ຄຳອະທິບາຍ ເລືອກປະເພດການໃຫ້ບໍລິການ', section: 'system' },
  { key: 'slot_entry_with_info', defaultValue: "ລູກຄ້າຝາກ / ລົງທະບຽນ", desc: 'ຕົວເລືອກ ລູກຄ້າຝາກ/ລົງທະບຽນ', section: 'system' },
  { key: 'slot_entry_with_info_desc', defaultValue: "ໃສ່ຊື່ + ເບີໂທ ເພື່ອບັນທຶກຂໍ້ມູນໄວ້ດຶງຄືນໃນພາຍຫຼັງ", desc: 'ຄຳອະທິບາຍ ຕົວເລືອກລູກຄ້າຝາກ', section: 'system' },
  { key: 'slot_entry_name_ph', defaultValue: "ຊື່ລູກຄ້າ (ຕ້ອງໃສ່) *", desc: 'placeholder ຊື່ລູກຄ້າ', section: 'system' },
  { key: 'slot_entry_phone_ph', defaultValue: "ເບີໂທ (ສາມາດວ່າງໄດ້)", desc: 'placeholder ເບີໂທລູກຄ້າ', section: 'system' },
  { key: 'slot_entry_confirm', defaultValue: "ບັນທຶກ ແລະ ເຂົ້າໜ້າຂາຍ", desc: 'ປຸ່ມ ບັນທຶກ ແລະ ເຂົ້າໜ້າຂາຍ', section: 'system' },
  { key: 'slot_entry_direct', defaultValue: "ຂາຍໜ້າຮ້ານ (Walk-In)", desc: 'ຕົວເລືອກ ຂາຍໜ້າຮ້ານ', section: 'system' },
  { key: 'slot_entry_direct_desc', defaultValue: "ລູກຄ້າຊື້ໜ້າຮ້ານ — ບໍ່ຈຳເປັນຕ້ອງໃສ່ຂໍ້ມູນ", desc: 'ຄຳອະທິບາຍ ຕົວເລືອກຂາຍໜ້າຮ້ານ', section: 'system' },
  { key: 'chk_coupon', defaultValue: "ລະຫັດຄູປອງ / Promo Code", desc: 'ປ້າຍກຳກັບ ລະຫັດຄູປອງ', section: 'pos' },
  { key: 'cancel', defaultValue: "ຍົກເລີກ", desc: 'ປຸ່ມ ຍົກເລີກ (ໃຊ້ທົ່ວໄປ)', section: 'pos' },
  { key: 'settings_tab_framing_specs', defaultValue: "🛠️ ຕົວເລືອກງານເລ່ຽມ (Framing Options)", desc: 'ແທັບຍ່ອຍ ຕົວເລືອກງານເລ່ຽມ (Settings)', section: 'settings' },
  { key: 'pos_search_placeholder', defaultValue: "🔍 ຄົ້ນຫາສິນຄ້າ ຫຼື ບໍລິການ...", desc: 'ຊ່ອງຄົ້ນຫາສິນຄ້າໃນໜ້າ POS', section: 'pos' },
  { key: 'pos_no_products', defaultValue: "ບໍ່ມີສິນຄ້າໃນໝວດໝູ່ນີ້", desc: 'ຂໍ້ຄວາມເມື່ອບໍ່ມີສິນຄ້າໃນໝວດໝູ່', section: 'pos' },
  { key: 'pos_add_custom_service', defaultValue: "➕ ບໍລິການອັດກອບພິເສດ (Custom Framing)", desc: 'ປຸ່ມເພີ່ມບໍລິການອັດກອບພິເສດ', section: 'pos' },
  { key: 'cart_customer_name', defaultValue: "ຊື່ລູກຄ້າ:", desc: 'ປ້າຍຊື່ລູກຄ້າໃນກະຕ່າ', section: 'pos' },
  { key: 'cart_customer_phone', defaultValue: "ເບີໂທ:", desc: 'ປ້າຍເບີໂທລູກຄ້າໃນກະຕ່າ', section: 'pos' },
  { key: 'cart_add_deposit', defaultValue: "💸 ເງິນມັດຈຳ (Deposit):", desc: 'ປ້າຍຍອດເງິນມັດຈຳໃນກະຕ່າ', section: 'pos' },
  { key: 'cart_technician', defaultValue: "ຊ່າງຜູ້ຮັບຜິດຊອບ:", desc: 'ປ້າຍເລືອກຊ່າງໃນກະຕ່າ', section: 'pos' },
  { key: 'framing_board_title', defaultValue: "🛠️ ບອດຕິດຕາມງານອັດກອບພຣະ (Framing Process Board)", desc: 'ຫົວຂໍ້ ບອດຕິດຕາມງານອັດກອບ', section: 'system' },
  { key: 'framing_board_pending', defaultValue: "⏳ ລໍຖ້າເຮັດ (Pending)", desc: 'ຖັນ ລໍຖ້າເຮັດ (Framing)', section: 'system' },
  { key: 'framing_board_doing', defaultValue: "⚡ ກຳລັງເຮັດ (In Progress)", desc: 'ຖັນ ກຳລັງເຮັດ (Framing)', section: 'system' },
  { key: 'framing_board_done', defaultValue: "✅ ສຳເລັດແລ້ວ (Done)", desc: 'ຖັນ ສຳເລັດແລ້ວ (Framing)', section: 'system' },
  { key: 'framing_board_delivered', defaultValue: "📦 ສົ່ງມອບແລ້ວ (Delivered)", desc: 'ຖັນ ສົ່ງມອບແລ້ວ (Framing)', section: 'system' },
  { key: 'debts_ledger_title', defaultValue: "📒 ບັນຊີລູກຄ້າຕິດໜີ້ (Customer Debts Ledger)", desc: 'ຫົວຂໍ້ ບັນຊີລູກຄ້າຕິດໜີ້', section: 'debts' },
  { key: 'debts_total_outstanding', defaultValue: "ຍອດຄ້າງຊຳລະທັງໝົດ:", desc: 'ป້າຍຍອດຄ້າງຊຳລະທັງໝົດ', section: 'debts' },
  { key: 'debts_search_placeholder', defaultValue: "🔍 ຄົ້ນຫາຕາມຊື່ລູກຄ້າ ຫຼື ເບີໂທ...", desc: 'ຊ່ອງຄົ້ນຫາໃນໜ້າຕິດໜີ້', section: 'debts' },
  { key: 'hrm_employee_list', defaultValue: "👥 ລາຍຊື່ພະນັກງານ (Employee Directory)", desc: 'ຫົວຂໍ້ ລາຍຊື່ພະນັກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_payroll_ledger', defaultValue: "💵 ບັນຊີເງິນເດືອນພະນັກງານ (Staff Payroll)", desc: 'ຫົວຂໍ້ ບັນຊີເງິນເດືອນພະນັກງານ', section: 'hrm' },
  { key: 'qty_modal_title', defaultValue: "ເລືອກຈຳນວນສິນຄ້າ / Select Quantity", desc: 'ຫົວຂໍ້ ປ໋ອບອັບເລືອກຈຳນວນສິນຄ້າ', section: 'system' },
  { key: 'qty_modal_total', defaultValue: "ຍອດລວມ / Total:", desc: 'ປ້າຍຍອດລວມໃນປ໋ອບອັບຈຳນວນ', section: 'system' },
  { key: 'qty_modal_cancel', defaultValue: "ຍົກເລີກ / Cancel", desc: 'ປຸ່ມຍົກເລີກໃນປ໋ອບອັບຈຳນວນ', section: 'system' },
  { key: 'qty_modal_confirm', defaultValue: "ຢືນຢັນ / Confirm", desc: 'ປຸ່ມຢືນຢັນໃນປ໋ອບອັບຈຳນວນ', section: 'system' },
  { key: 'pos_or', defaultValue: "ຫຼື / OR", desc: 'ຂໍ້ความ ຫຼື / OR ລະຫວ່າງທາງເລືອກຄິວ', section: 'pos' },
  { key: 'track_title', defaultValue: "ລະບົບຕິດຕາມສະຖານະອັດກອບພຣະ", desc: 'ຫົວຂໍ້ ລະບົບຕິດຕາມສະຖານະອັດກອບພຣະ', section: 'tracking' },
  { key: 'track_subtitle', defaultValue: "ຕິດຕາມຂັ້ນຕອນການອັດກອບພຣະເຄື່ອງຂອງທ່ານແບບ Real-time", desc: 'ຄຳອະທິບາຍໃຕ້ຫົວຂໍ້ ລະບົບຕິດຕາມສະຖານະ', section: 'tracking' },
  { key: 'track_bill_no', defaultValue: "ເລກໃບບິນຕິດຕາມ:", desc: 'ປ້າຍກຳກັບ ເລກໃບບິນຕິດຕາມ:', section: 'tracking' },
  { key: 'track_customer', defaultValue: "ຊື່ລູກຄ້າ:", desc: 'ປ້າຍກຳກັບ ຊື່ລູກຄ້າ:', section: 'tracking' },
  { key: 'track_date', defaultValue: "ວັນທີຝາກພຣະ:", desc: 'ປ້າຍກຳກັບ ວັນທີຝາກພຣະ:', section: 'tracking' },
  { key: 'track_status_label', defaultValue: "ສະຖານະປັດຈຸບັນ:", desc: 'ປ້າຍກຳກັບ ສະຖານະປັດຈຸບັນ:', section: 'tracking' },
  { key: 'track_status_pending', defaultValue: "ພວມດຳເນີນການອັດກອບ (In Progress)", desc: 'ສະຖານະ ພວມດຳເນີນການອັດກອບ', section: 'tracking' },
  { key: 'track_status_ready', defaultValue: "ສຳເລັດແລ້ວ ພ້ອມຮັບພຣະ (Ready to Pick Up)", desc: 'ສະຖານະ ອັດກອບສຳເລັດ ພ້ອມຮັບພຣະ', section: 'tracking' },
  { key: 'track_status_picked_up', defaultValue: "ຮັບພຣະກັບບ້ານແລ້ວ (Picked Up / Delivered)", desc: 'ສະຖານະ ຮັບພຣະກັບບ້ານແລ້ວ', section: 'tracking' },
  { key: 'track_queue_ahead', defaultValue: "ຄິວຖັດໄປ / ພວມດຳເນີນການ", desc: 'ຂໍ້ຄວາມ ຄິວຖັດໄປ / ພວມດຳເນີນການ', section: 'tracking' },
  { key: 'track_queues_remaining', defaultValue: "ຍັງເຫຼືອອີກ {count} ຄິວ ກ່ອນໜ້າຄິວຂອງທ່ານ", desc: 'ຂໍ້ຄວາມ ຍັງເຫຼືອອີກ {count} ຄິວກ່ອນໜ້າ', section: 'tracking' },
  { key: 'track_amulet_details', defaultValue: "ລາຍລະອຽດລາຍການຝາກ:", desc: 'ຫົວຂໍ້ ລາຍລະອຽດລາຍການຝາກ:', section: 'tracking' },
  { key: 'track_total_fee', defaultValue: "ຄ່າບໍລິການທັງໝົດ:", desc: 'ປ້າຍກຳກັບ ຄ່າບໍລິການທັງໝົດ:', section: 'tracking' },
  { key: 'track_deposit', defaultValue: "ມັດຈຳແລ້ວ:", desc: 'ປ້າຍກຳກັບ ມັດຈຳແລ້ວ:', section: 'tracking' },
  { key: 'track_balance', defaultValue: "ຍອດຄົງເຫຼືອທີ່ຕ້ອງຊຳລະຕອນຮັບພຣະ:", desc: 'ປ້າຍກຳກັບ ຍອດຄົງເຫຼືອທີ່ຕ້ອງຊຳລະຕອນຮັບພຣະ:', section: 'tracking' },
  { key: 'track_not_found', defaultValue: "ບໍ່ພົບຂໍ້ມູນງານອັດກອບພຣະນີ້", desc: 'ຂໍ້ຄວາມ ບໍ່ພົບຂໍ້ມູນງານອັດກອບພຣະ', section: 'tracking' },
  { key: 'track_not_found_desc', defaultValue: "ກະລຸນາກວດສອບເລກໃບບິນ ຫຼື ລອງສະແກນໃໝ່ອີກຄັ້ງ", desc: 'ຄຳອະທິບາຍ ບໍ່ພົບຂໍ້ມູນງານອັດກອບພຣະ', section: 'tracking' },
  { key: 'track_customer_info_title', defaultValue: "ຂໍ້ມູນລູກຄ້າ (Customer Info)", desc: 'ຫົວຂໍ້ ຂໍ້ມູນລູກຄ້າ', section: 'tracking' },
  { key: 'track_status_title', defaultValue: "ສະຖານະ (Status)", desc: 'ຫົວຂໍ້ ສະຖານະການເຮັດວຽກ', section: 'tracking' },
  { key: 'track_current_step', defaultValue: "ຂັ້ນຕອນປັດຈຸບັນ (Current Step)", desc: 'ປ້າຍກຳກັບ ຂັ້ນຕອນປັດຈຸບັນ', section: 'tracking' },
  { key: 'track_step_received', defaultValue: "ຮັບຝາກພຣະ (Order Received)", desc: 'ຂັ້ນຕອນທີ 1: ຮັບຝາກພຣະ', section: 'tracking' },
  { key: 'track_step_progress', defaultValue: "ກຳລັງດຳເນີນການອັດກອບ (In Progress)", desc: 'ຂັ້ນຕອນທີ 2: ກຳລັງອັດກອບ', section: 'tracking' },
  { key: 'track_step_ready', defaultValue: "ອັດກອບສຳເລັດ ພ້ອມຮັບພຣະ (Ready to Pick Up)", desc: 'ຂັ້ນຕອນທີ 3: ອັດກອບສຳເລັດ', section: 'tracking' },
  { key: 'track_step_picked_up', defaultValue: "ຮັບພຣະກັບບ້ានແລ້ວ (Picked Up / Delivered)", desc: 'ຂັ້ນຕອນທີ 4: ຮັບພຣະກັບບ້ານແລ້ວ', section: 'tracking' },
  { key: 'track_step_progress_done', defaultValue: "ສຳເລັດການອັດກອບ", desc: 'ຂໍ້ຄວາມ ດຳເນີນການອັດກອບສຳເລັດ', section: 'tracking' },
  { key: 'track_step_progress_doing', defaultValue: "ກຳລັງເລັ່ງມືອັດກອບພຣະ...", desc: 'ຂໍ້ຄວາມ ກຳລັງອັດກອບພຣະ', section: 'tracking' },
  { key: 'track_step_ready_done', defaultValue: "ພ້ອມຮັບກັບບ້ານ", desc: 'ຂໍ້ຄວາມ ພ້ອມຮັບກັບບ້ານ', section: 'tracking' },
  { key: 'track_step_ready_waiting', defaultValue: "ລໍຖ້າການອັດກອບ", desc: 'ຂໍ້ຄວາມ ລໍຖ້າອັດກອບ', section: 'tracking' },
  { key: 'track_step_picked_up_done', defaultValue: "ສົ່ງມອບຮຽບຮ້ອຍ", desc: 'ຂໍ້ຄວາມ ສົ່ງມອບຮຽບຮ້ອຍ', section: 'tracking' },
  { key: 'track_step_picked_up_waiting', defaultValue: "ລໍຖ້າລູກຄ້າມาຮັບ", desc: 'ຂໍ້ຄວາມ ລໍຖ້າລູກຄ້າມາຮັບ', section: 'tracking' },
  { key: 'track_amulet_prefix', defaultValue: "ອົງທີ", desc: 'ຄຳນຳໜ້າ ລຳດັບພຣະເຄື່ອງ', section: 'tracking' },
  { key: 'track_thickness_prefix', defaultValue: "ຄວາມໜາ", desc: 'ຄຳວ່າ ຄວາມໜາອະຄຣິລິກ', section: 'tracking' },
  { key: 'track_notes_prefix', defaultValue: "ໝາຍເຫດ:", desc: 'ຄຳວ່າ ໝາຍເຫດ', section: 'tracking' },
  { key: 'settings_tab_tracking', defaultValue: "🔍 ຕິດຕາມພຣະ (Amulet Tracking)", desc: 'ແທັບຍ່ອຍ ຕິດຕາມພຣະ (Settings)', section: 'settings' },
  { key: 'settings_tab_expenses', defaultValue: "💸 ປະເພດລາຍຈ່າຍ (Expense Categories)", desc: 'ແທັບຍ່ອຍ ປະເພດລາຍຈ່າຍ (Settings)', section: 'settings' },
  { key: 'settings_tab_system_dev', defaultValue: "⚠️ ຄວບຄຸມລະບົບ (System Control)", desc: 'ຫົວຂໍ້ ຄວບຄຸມລະບົບຂັ້ນສູງ (Settings)', section: 'settings' },
  { key: 'settings_tab_general', defaultValue: "⚙️ ຕັ້ງຄ່າທົ່ວໄປ (General Settings)", desc: 'ແທັບຍ່ອຍ ຕັ້ງຄ່າທົ່ວໄປ (Settings)', section: 'settings' },
  { key: 'settings_tab_theme_borders', defaultValue: "🎨 ສີ & ຄວາມໂຄ້ງ (Theme/Borders)", desc: 'ຫົວຂໍ້ ປັບແຕ່ງສີ ແລະ ຄວາມໂຄ້ງ (Settings)', section: 'settings' },
  { key: 'hrm_add_employee_btn', defaultValue: "＋ ເພີ່ມພະນັກງານ", desc: 'ປຸ່ມ ເພີ່ມພະນັກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_employee_name', defaultValue: "ຊື່ພະນັກງານ", desc: 'ປ້າຍກຳກັບ ຊື່ພະນັກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_employee_role', defaultValue: "ຕຳແໜ່ງ", desc: 'ປ້າຍກຳກັບ ຕຳແໜ່ງ (HRM)', section: 'hrm' },
  { key: 'hrm_employee_salary', defaultValue: "ເງິນເດືອນພື້ນຖານ", desc: 'ປ້າຍກຳກັບ ເງິນເດືອນພື້ນຖານ (HRM)', section: 'hrm' },
  { key: 'hrm_employee_phone', defaultValue: "ເບີໂທພະນັກງານ", desc: 'ປ້າຍກຳກັບ ເບີໂທພະນັກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_leave_days_label', defaultValue: "ຈຳນວນມື້ລາພັກທີ່ອະນຸຍາດ", desc: 'ປ້າຍກຳກັບ ມື້ລາພັກ (HRM)', section: 'hrm' },
  { key: 'rep_sales_report', defaultValue: "📊 ບົດລາຍງານຍອດຂາຍ & ການເງິນ (Sales & Finance Reports)", desc: 'ຫົວຂໍ້ ບົດລາຍງານຍອດຂາຍ (Reports)', section: 'reports' },
  { key: 'rep_gross_profit', defaultValue: "ກຳໄລຂັ້ນຕົ້ນ:", desc: 'ປ້າຍກຳກັບ ກຳໄລຂັ້ນຕົ້ນ (Reports)', section: 'reports' },
  { key: 'rep_cash_received', defaultValue: "ຍອດຮັບເງິນສົດທັງໝົດ:", desc: 'ປ້າຍກຳກັບ ຍອດຮັບເງິນສົດ (Reports)', section: 'reports' },
  { key: 'rep_expenses', defaultValue: "ລາຍຈ່າຍທັງໝົດ:", desc: 'ປ້າຍກຳກັບ ລາຍຈ່າຍທັງໝົດ (Reports)', section: 'reports' },
  { key: 'rep_net_profit', defaultValue: "ກຳໄລສຸດທິ (Net Profit):", desc: 'ປ້າຍກຳກັບ ກຳໄລສຸດທິ (Reports)', section: 'reports' },
  { key: 'inv_add_product', defaultValue: "＋ ເພີ່ມສິນຄ້າໃໝ່ (Add Product)", desc: 'ປຸ່ມ ເພີ່ມສິນຄ້າໃໝ່ (Inventory)', section: 'inventory' },
  { key: 'inv_product_name', defaultValue: "ຊື່ສິນຄ້າ (Product Name) *", desc: 'ປ້າຍກຳກັບ ຊື່ສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'inv_stock_qty', defaultValue: "ຈຳນວນໃນສະຕັອກ (Stock Qty) *", desc: 'ປ້າຍກຳກັບ ຈຳນວນໃນສະຕັອກ (Inventory)', section: 'inventory' },
  { key: 'inv_import_excel', defaultValue: "📥 ນຳເຂົ້າໄຟລ໌ Excel", desc: 'ປຸ່ມ ນຳເຂົ້າໄຟລ໌ Excel (Inventory)', section: 'inventory' },
  { key: 'pos_frame_type', defaultValue: "ເລືອກຊະນິດກອບ", desc: 'ປ້າຍກຳກັບ ເລືອກຊະນິດກອບ (POS)', section: 'pos' },
  { key: 'pos_acrylic_thickness', defaultValue: "ເລືອກຄວາມໜາອະຄຣິລິກ", desc: 'ປ້າຍກຳກັບ ເລືອກຄວາມໜາອະຄຣິລິກ (POS)', section: 'pos' },
  { key: 'pos_amulets_list', defaultValue: "ລາຍການພຣະເຄື່ອງອົງອື່ນໆ", desc: 'ຫົວຂໍ້ ພຣະເຄື່ອງອົງອື່ນໆ (POS)', section: 'pos' },
  { key: 'pos_confirm_framing', defaultValue: "💾 ຢືນຢັນລາຍການເລ່ຽມພຣະ", desc: 'ປຸ່ມ ຢືນຢັນລາຍການເລ່ຽມພຣະ (POS)', section: 'pos' },
  { key: 'pos_add_amulet', defaultValue: "＋ ເພີ່ມພຣະເຄື່ອງອີກອົງ", desc: 'ປຸ່ມ ເພີ່ມພຣະເຄື່ອງອີກອົງ (POS)', section: 'pos' },
  { key: 'rep_revenue_label', defaultValue: "💵 ຍອດຂາຍທັງໝົດ (Revenue)", desc: 'ປ້າຍກຳກັບ ຍອດຂາຍທັງໝົດ (Reports)', section: 'reports' },
  { key: 'rep_revenue_subtext', defaultValue: "ຍອດຂາຍໃນໄລຍະເວລາທີ່ເລືອກ", desc: 'ຄຳອະທິບາຍ ຍອດຂາຍໃນໄລຍະເວລາ (Reports)', section: 'reports' },
  { key: 'rep_net_profit_label', defaultValue: "📈 ກຳໄລສຸດທິ (Est. Profit)", desc: 'ປ້າຍກຳກັບ ກຳໄລສຸດທິ (Reports)', section: 'reports' },
  { key: 'rep_profit_subtext', defaultValue: "*ຫັກຕົ້ນທຶນ ແລະ ຄ່າໃຊ້ຈ่ายແລ້ວ", desc: 'ຄຳອະທິບາຍ ຫັກຕົ້ນທຶนແລ້ວ (Reports)', section: 'reports' },
  { key: 'rep_orders_count', defaultValue: "🛒 ຈຳນວນໃບບິນຂາຍ", desc: 'ປ້າຍກຳກັບ ຈຳນວນໃບບິນຂາຍ (Reports)', section: 'reports' },
  { key: 'rep_average', defaultValue: "ສະເລ່ຍ:", desc: 'ຄຳວ່າ ສະເລ່ຍ (Reports)', section: 'reports' },
  { key: 'rep_total_debt', defaultValue: "📒 ມູນຄ່າໜີ້ຄ້າງຊຳລະທັງໝົດ", desc: 'ປ້າຍກຳກັບ ມູນຄ່າໜີ້ຄ້າງຊຳລະ (Reports)', section: 'reports' },
  { key: 'rep_debtors_count', defaultValue: "ມີລູກຄ້າຄ້າງຊຳລະ:", desc: 'ຄຳວ່າ ມີລູກຄ້າຄ້າງຊຳລະ (Reports)', section: 'reports' },
  { key: 'rep_framing_value', defaultValue: "🛠️ ມູນຄ່າງານອັດກອບ", desc: 'ປ້າຍກຳກັບ ມູນຄ່າງານອັດກອບ (Reports)', section: 'reports' },
  { key: 'rep_pending_jobs', defaultValue: "ງານຄ້າງຄິວທັງໝົດ:", desc: 'ຄຳວ່າ ງານຄ້າງຄິວທັງໝົດ (Reports)', section: 'reports' },
  { key: 'rep_expenses_total', defaultValue: "💸 ລາຍຈ່າຍທັງໝົດ", desc: 'ປ້າຍກຳກັບ ລາຍຈ່າຍທັງໝົດ (Reports)', section: 'reports' },
  { key: 'rep_expenses_subtext', defaultValue: "ລາຍຈ່າຍໃນໄລຍະເວລາທີ່ເລືອກ", desc: 'ຄຳອະທິບາຍ ລາຍຈ່າຍໃນໄລຍະເວລາ (Reports)', section: 'reports' },
  { key: 'rep_print_summary_btn', defaultValue: "🖨️ ພິມລາຍງານສະຫຼຸບຍອດຂາຍ (Print Sales Summary)", desc: 'ປຸ່ມ ພິມລາຍງານສະຫຼຸບຍອດຂາຍ (Reports)', section: 'reports' },
  { key: 'rep_trend_chart_title', defaultValue: "📈 ແນວໂນ້ມຍອດຂາຍ (Sales Trend Line Chart)", desc: 'ຫົວຂໍ້ ແນວໂນ້ມຍອດຂາຍ (Reports)', section: 'reports' },
  { key: 'rep_category_donut_title', defaultValue: "🍕 ສັດສ່ວນຍອດຂາຍຕາມໝວດໝູ່ (Category Split)", desc: 'ຫົວຂໍ້ ສັດສ່ວນຍອດຂາຍຕາມໝວດໝູ່ (Reports)', section: 'reports' },
  { key: 'rep_debt_chart_title', defaultValue: "📒 ສະຖານະຍອດຕິດໜີ້ຊ່ວງນີ້ (Debt Risk Comparison)", desc: 'ຫົວຂໍ້ ສະຖານະຍອດຕິດໜີ້ຊ່ວງນີ້ (Reports)', section: 'reports' },
  { key: 'inv_tab_products', defaultValue: "📦 ສະຕັອກສິນຄ້າ (Products)", desc: 'ແທັບຍ່ອຍ ສະຕັອກສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'inv_tab_raw_materials', defaultValue: "💎 ວັດຖຸດິບ (Raw Materials)", desc: 'ແທັບຍ່ອຍ ວັດຖຸດິບ (Inventory)', section: 'inventory' },
  { key: 'inv_tab_manufacturing', defaultValue: "🏭 ສູດການຜະລິດ & BOM", desc: 'ແທັບຍ່ອຍ ສູດການຜະລິດ (Inventory)', section: 'inventory' },
  { key: 'inv_barcode_label', defaultValue: "ລະຫັດສິນຄ້າ (Barcode)", desc: 'ປ້າຍກຳກັບ ລະຫັດສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'inv_cost_price', defaultValue: "ລາຄາຊື້ (Cost Price)", desc: 'ປ້າຍກຳກັບ ລາຄາຊື້ (Inventory)', section: 'inventory' },
  { key: 'inv_sell_price', defaultValue: "ລາຄາຂາຍ (Selling Price)", desc: 'ປ້າຍກຳກັບ ລາຄາຂາຍ (Inventory)', section: 'inventory' },
  { key: 'inv_min_stock', defaultValue: "ສະຕັອກຂັ້ນຕ່ຳ (Min Stock)", desc: 'ປ້າຍກຳກັບ ສະຕັອກຂັ້ນຕ່ຳ (Inventory)', section: 'inventory' },
  { key: 'inv_category', defaultValue: "ໝວດໝູ່ (Category)", desc: 'ປ້າຍກຳກັບ ໝວດໝູ່ (Inventory)', section: 'inventory' },
  { key: 'inv_supplier', defaultValue: "ຜູ້ສະໜອງ (Supplier)", desc: 'ປ້າຍກຳກັບ ຜູ້ສະໜອງ (Inventory)', section: 'inventory' },
  { key: 'inv_unit', defaultValue: "ຫົວໜ່ວຍ (Unit)", desc: 'ປ້າຍກຳກັບ ຫົວໜ່ວຍ (Inventory)', section: 'inventory' },
  { key: 'inv_description', defaultValue: "ຄຳອະທິບາຍ (Description)", desc: 'ປ້າຍກຳກັບ ຄຳອະທิບາຍ (Inventory)', section: 'inventory' },
  { key: 'inv_search_placeholder', defaultValue: "🔍 ຄົ້ນຫາຕາມຊື່, ບາໂຄດ ຫຼື ໝວດໝູ່...", desc: 'ຊ່ອງຄົ້ນຫາສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'inv_total_products', defaultValue: "ສິນຄ້າທັງໝົດ:", desc: 'ປ້າຍກຳກັບ ຈຳນວນສິນຄ້າທັງໝົດ (Inventory)', section: 'inventory' },
  { key: 'inv_total_stock_value', defaultValue: "ມູນຄ່າສະຕັອກ (ທຶນ):", desc: 'ປ້າຍກຳກັບ ມູນຄ່າສະຕັອກ (Inventory)', section: 'inventory' },
  { key: 'inv_potential_profit', defaultValue: "ກຳໄລຄາດຄະເນ:", desc: 'ປ້າຍກຳກັບ ກຳໄລຄາດຄະເນ (Inventory)', section: 'inventory' },
  { key: 'inv_save_btn', defaultValue: "💾 ບັນທຶກສິນຄ້າ", desc: 'ປຸ່ມ ບັນທຶກສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'inv_edit_btn', defaultValue: "✏️ ແກ้ໄຂ", desc: 'ປຸ່ມ ແກ้ໄຂສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'inv_delete_btn', defaultValue: "🗑️ ລຶບ", desc: 'ປຸ່ມ ລຶບສິນຄ້າ (Inventory)', section: 'inventory' },
  { key: 'hrm_role_owner', defaultValue: "ເຈົ້າຂອງຮ້ານ (Owner)", desc: 'ຕຳແໜ່ງ ເຈົ້າຂອງຮ້ານ (HRM)', section: 'hrm' },
  { key: 'hrm_role_cashier', defaultValue: "ພະນັກງານຂາຍ (Cashier)", desc: 'ຕຳແໜ່ງ ພະນັກງານຂາຍ (HRM)', section: 'hrm' },
  { key: 'hrm_role_technician', defaultValue: "ຊ່າງອັດກອບ (Technician)", desc: 'ຕຳແໜ່ງ ຊ່າງອັດກອບ (HRM)', section: 'hrm' },
  { key: 'hrm_pay_monthly', defaultValue: "ເງິນເດືອນລາຍເດືອນ (Monthly)", desc: 'ປະເພດເງິນເດືອນລາຍເດືອນ (HRM)', section: 'hrm' },
  { key: 'hrm_pay_daily', defaultValue: "ຄ່າຈ້າງລາຍວັນ (Daily)", desc: 'ປະເພດຄ່າຈ້າງລາຍວັນ (HRM)', section: 'hrm' },
  { key: 'hrm_employee_select', defaultValue: "-- ເລືອກພະນັກງານ --", desc: 'ຂໍ້ຄວາມ ເລືອກພະນັກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_check_in_time', defaultValue: "ເວລາເຂົ້າງານ", desc: 'ປ້າຍກຳກັບ ເວລາເຂົ້າງານ (HRM)', section: 'hrm' },
  { key: 'hrm_check_out_time', defaultValue: "ເວລາອອກງານ", desc: 'ປ້າຍກຳກັບ ເວລາອອກງານ (HRM)', section: 'hrm' },
  { key: 'hrm_status', defaultValue: "ສະຖານະ", desc: 'ປ້າຍກຳກັບ ສະຖານະ (HRM)', section: 'hrm' },
  { key: 'hrm_leave_type', defaultValue: "ປະເພດການລາພັກ", desc: 'ປ້າຍກຳກັບ ປະເພດການລາພັກ (HRM)', section: 'hrm' },
  { key: 'hrm_leave_reason', defaultValue: "ເຫດຜົນການລາພັກ", desc: 'ປ້າຍກຳກັບ ເຫດຜົນການລາພັກ (HRM)', section: 'hrm' },
  { key: 'hrm_btn_approve', defaultValue: "✅ ອະນຸມັດ", desc: 'ປຸ່ມ ອະນຸມັດການລາ (HRM)', section: 'hrm' },
  { key: 'hrm_btn_reject', defaultValue: "❌ ປະຕິເສດ", desc: 'ປຸ່ມ ປະຕິເສດການລາ (HRM)', section: 'hrm' },
  { key: 'hrm_salary_base', defaultValue: "ເງິນເດືອນພື້ນຖານ", desc: 'ປ້າຍກຳກັບ ເງິນເດືອນພື້ນຖານສະລິບ (HRM)', section: 'hrm' },
  { key: 'hrm_salary_bonus', defaultValue: "ໂບນັດ / ຄ່າຄອມມິດຊັ່ນ", desc: 'ປ້າຍກຳກັບ ໂບນັດ/ຄອມມິດຊັ່ນ (HRM)', section: 'hrm' },
  { key: 'hrm_salary_deduct', defaultValue: "ຫັກການລາພັກ / ຂາດງານ", desc: 'ປ້າຍກຳກັບ ຫັກເງິນລາພັກ (HRM)', section: 'hrm' },
  { key: 'hrm_btn_pay', defaultValue: "💵 ຈ່າຍເງິນເດືອນ", desc: 'ປຸ່ມ ຈ່າຍเງິນເດືອນ (HRM)', section: 'hrm' }
,
  // --- Product & Service Category Labels ---
  { key: 'cat_all', defaultValue: "ທັງໝົດ", desc: 'ໝວດໝູ່ ທັງໝົດ (All Categories)', section: 'inventory' },
  { key: 'cat_frames', defaultValue: "ຂອບພຣະ", desc: 'ໝວດໝູ່ ຂອບພຣະ (Frames)', section: 'inventory' },
  { key: 'cat_amulets', defaultValue: "ພຣະເຄື່ອງ", desc: 'ໝວດໝູ່ ພຣະເຄື່ອງ (Amulets)', section: 'inventory' },
  { key: 'cat_necklaces', defaultValue: "ສ້ອຍຄໍ & ອຸປະກອນ", desc: 'ໝວດໝູ່ ສ້ອຍຄໍ & ອຸປະກອນ (Necklaces)', section: 'inventory' },
  { key: 'cat_services', defaultValue: "ບໍລິການອັດກັນນ້ຳ", desc: 'ໝວດໝູ່ ບໍລິການອັດກັນນ້ຳ (Waterproof Services)', section: 'inventory' },
  { key: 'cat_other', defaultValue: "ອື່ນໆ", desc: 'ໝວດໝູ່ ອື່ນໆ (Other Categories)', section: 'inventory' },
  // --- Queue Board status Labels ---
  { key: 'job_status_done', defaultValue: "ອັດສຳເລັດ", desc: 'ສະຖານະ ອັດສຳເລັດ (Queue Card)', section: 'pos' },
  { key: 'job_status_framing', defaultValue: "ກຳລັງອັດ", desc: 'ສະຖານະ ກຳລັງອັດ (Queue Card)', section: 'pos' },
  { key: 'job_status_waiting', defaultValue: "ລໍຖ້າ", desc: 'ສະຖານະ ລໍຖ້າ (Queue Card)', section: 'pos' }
,
  // --- Customer Members Settings & POS Labels ---
  { key: 'settings_tab_customers', defaultValue: "👥 ຈັດການສະມາຊິກ (Members)", desc: 'ແທັບຍ່ອຍ ຈັດການສະມາຊິກ (Settings)', section: 'settings' },
  { key: 'pos_search_customer_placeholder', defaultValue: "🔍 ຄົ້ນຫາເບີໂທ ຫຼື ຊື່ລູກຄ້າ...", desc: 'ຊ່ອງຄົ້ນຫາເບີໂທ ຫຼື ຊື່ລູກຄ້າ (POS Grid)', section: 'pos' },
  { key: 'pos_select_customer_label', defaultValue: "ເລືອກສະມາຊິກຮ້าน (Search Member)", desc: 'ປ້າຍກຳກັບ ເລືອກສະມາຊິກ (POS Rename Modal)', section: 'pos' },
  { key: 'pos_register_member_btn', defaultValue: "＋ ສະໝັກສະມາຊິກໃໝ່", desc: 'ປຸ່ມ ສະໝັກສະມາຊິກໃໝ່ (POS Rename Modal)', section: 'pos' },
  { key: 'cust_id_col', defaultValue: "ລະຫັດສະມາຊິກ", desc: 'ຫົວຕາຕະລาง ລະຫັດສະມາຊິກ (Settings Members)', section: 'settings' },
  { key: 'cust_name_col', defaultValue: "ຊື່ສະມາຊິກ", desc: 'ຫົວຕາຕະລາງ ຊື່ສະມາຊິກ (Settings Members)', section: 'settings' },
  { key: 'cust_phone_col', defaultValue: "ເບີໂທຕິດຕໍ່", desc: 'ຫົວຕາຕະລາງ ເບີໂທຕິດຕໍ່ (Settings Members)', section: 'settings' },
  { key: 'cust_tier_col', defaultValue: "ລະດັບສະມາຊິກ", desc: 'ຫົວຕาຕະລາງ ລະດັບສະມາຊิก (Settings Members)', section: 'settings' },
  { key: 'cust_discount_col', defaultValue: "ສ່ວນຫຼຸດເລີ່ມຕົ້ນ", desc: 'ຫົວຕາຕະລາງ ສ່ວນຫຼຸດເລີ່ມຕົ້ນ (Settings Members)', section: 'settings' },
  { key: 'cust_actions_col', defaultValue: "ຈັດການ", desc: 'ຫົວຕາຕະລາງ ຈັດການ (Settings Members)', section: 'settings' }
,
  // --- Navigation tab key for Customers ---
  { key: 'tab_customers', defaultValue: "💳 ສະມາຊິກ (Members)", desc: 'ປຸ່ມເມນູ ສະມາຊິກ (Sidebar Navigation)', section: 'navigation' }
];

const DEFAULT_ORDERS = [
{
id: 'TX10001',
date: '2026-06-12T10:15:30+07:00',
cashierId: 'cashier',
cashierName: 'ນາງ ຈັນທະມາ (ຈັນ)',
items: [
{ productId: 'P002', name: 'ຂອບເງິນແທ້ 92.5%', price: 450000, qty: 1, total: 450000 },
{ productId: 'S001', name: 'ບໍລິການອັດກັນນ້ຳ (ເລນໃສ/ປົກກະຕິ)', price: 60000, qty: 1, total: 60000 }
],
subtotal: 510000,
discount: 0,
total: 510000,
paymentMethod: 'cash',
cashReceived: 600000,
change: 90000
}
];

const DEFAULT_DEBTS = [
{
id: 'DBT10001',
date: '2026-06-13T16:40:00+07:00',
customerName: 'ທ້າວ ຄຳສະຫວັນ ອຸດົມ',
customerPhone: '02055663322',
items: [
{ productId: 'P001', name: 'ຂອບຄຳແທ້ 90% (ຊຸ້ມກໍ)', price: 2800000, qty: 1, total: 2800000 }
],
total: 2800000,
notes: 'ຄ້າງຈ່າຍຄ່າຂອບພຣະ ລໍຖ້າມື້ເງິນເດືອນອອກ 25 ມິຖຸນາ',
status: 'unpaid'
}
];

const DEFAULT_FRAMING_JOBS = [
  {
    "id": "JOB10001",
    "customerName": "ທ້າວ ບຸນຈັນ ໄຊຍະວົງ",
    "customerPhone": "02055551111",
    "amuletDescription": "ຫຼຽນຫຼວງພໍ່ຣວຍ ປີ 59",
    "frameTypeId": "P002",
    "frameTypeName": "ຂອບເງິນແທ້ 92.5% + ອັດກັນນ້ຳ",
    "totalPrice": 510000,
    "deposit": 200000,
    "balance": 310000,
    "status": "done",
    "createdDate": "2026-06-29T09:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "ອັດເລນໃສໜາພິເສດ ຫໍ່ຖົງກັນກະແທກ",
    "amuletImage": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=60",
    "amulets": [
      {
        "id": 1,
        "description": "ຫຼຽນຫຼວງພໍ່ຣວຍ ປີ 59",
        "frameTypeId": "P002",
        "frameTypeName": "ຂອບເງິນແທ້ 92.5% + ອັດກັນນ້ຳ",
        "price": 510000,
        "frameStyle": "ລາຍໄທ",
        "acrylicThickness": "2.0 mm",
        "specialNotes": "ອັດເລນໃສໜາພິເສດ"
      }
    ]
  },
  {
    "id": "JOB10025",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພิເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "done",
    "createdDate": "2026-06-29T10:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພກເພ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10026",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10027",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10028",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10029",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10030",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 20000,
    "balance": 40000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10031",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10032",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10033",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10034",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10035",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 20000,
    "balance": 40000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10036",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10037",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10038",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10039",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10040",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 20000,
    "balance": 40000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10041",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10042",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10043",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10044",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10045",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 20000,
    "balance": 40000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10046",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10047",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10048",
    "customerName": "ສົມສັກ ແກ້ວມະນີ",
    "customerPhone": "02055554444",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10049",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 60000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະສົມເດັດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10050",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 20000,
    "balance": 40000,
    "status": "pending",
    "createdDate": "2026-06-29T11:00:00+07:00",
    "pickupDate": "2026-06-30T15:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ເສມາຫຼວງປູ່ທວດ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10002",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10003",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10004",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10005",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10006",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10007",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10008",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10009",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10010",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10011",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10012",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10013",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10014",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10015",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10016",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10017",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10018",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10019",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10020",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10021",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10022",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10023",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  },
  {
    "id": "JOB10024",
    "customerName": "ລູກຄ້າທົ່ວໄປ",
    "customerPhone": "",
    "amuletDescription": "ພຣະເຄື່ອງ",
    "frameTypeId": "P001",
    "frameTypeName": "ບໍລິການອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
    "totalPrice": 60000,
    "deposit": 0,
    "balance": 0,
    "status": "picked_up",
    "createdDate": "2026-06-28T09:00:00+07:00",
    "pickupDate": "2026-06-28T17:00:00+07:00",
    "technicianId": "technician",
    "notes": "",
    "amulets": [
      {
        "id": 1,
        "description": "ພຣະເຄື່ອງ",
        "frameTypeId": "P001",
        "frameTypeName": "ບໍລິการອັດກັນນ້ຳ (ເລນລາຍ/ພິເສດ)",
        "price": 60000,
        "frameStyle": "ເລນລາຍ",
        "acrylicThickness": "2.0 mm"
      }
    ]
  }
];

const DEFAULT_AUDIT_LOGS = [
{
id: 'LOG-1',
timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
userId: 'cashier',
userName: 'ນາງ ຈັນທະມາ (ຈັນ)',
type: 'failed_pin',
description: 'ພະຍາຍາມລົບສິນຄ້າ "ຂອບຄຳແທ້ 90% (ຊຸ້ມກໍ)" ແຕ່ໃສ່ລະຫັດ Admin PIN ຜິດ',
severity: 'warning'
},
{
id: 'LOG-2',
timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
userId: 'cashier',
userName: 'ນາງ ຈັນທະມາ (ຈັນ)',
type: 'success_pin',
description: 'ລົບສິນຄ້າ "ຂອບຄຳແທ້ 90% (ຊຸ້ມກໍ)" ອອກຈາກບັດຄິວ 03 (ອະນຸມັດໂດຍ Admin)',
severity: 'info'
},
{
id: 'LOG-3',
timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
userId: 'cashier',
userName: 'ນາງ ຈັນທະມາ (ຈັນ)',
type: 'open_drawer',
description: 'ເປີດລິ້ນຊັກເກັບເງິນດ້ວຍມື (Manual Cash Drawer Release) ໂດຍບໍ່ມີການຂາຍ',
severity: 'danger'
},
{
id: 'LOG-4',
timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
userId: 'cashier',
userName: 'ນາງ ຈັນທະມາ (ຈັນ)',
type: 'discount_applied',
description: 'ໃສ່ສ່ວນຫຼຸດພິເສດ 20% ໃຫ້ກັບລູກຄ້າບັດຄິວ P5',
severity: 'warning'
},
{
id: 'LOG-5',
timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
userId: 'cashier',
userName: 'ນາງ ຈັນທະມາ (ຈັນ)',
type: 'delete_item',
description: 'ລົບລາຍການ "ສ້ອຍຄໍຄຳແທ້ 1 ບາດ" ອອກຈາກ cart',
severity: 'info'
}
];

const getInitialSlots = () => {
const ids = [
'Walk-In',
'01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16',
'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16',
'OUT-1', 'OUT-2'
];
const slots = {};
ids.forEach(id => {
slots[id] = {
id: id,
label: id,
items: [],
notes: '',
customerName: '',
customerPhone: '',
isDebt: false,
debtId: '',
amuletImage: '',
discountPercent: 0,
discountType: 'percent',
discountAmount: 0
};
});
return slots;
};

let syncIntervalId = null;
let lastSyncCheck = 0;

function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    let charCode = str.charCodeAt(c);
    for (let i = 0; i < 8; i++) {
      let bit = ((charCode >> (7 - i)) & 1) === 1;
      let c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (bit ^ c15) {
        crc ^= 0x1021;
      }
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value>>>amount) | (value<<(32-amount));
  }
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';
  var words = [];
  var asciiLength = ascii[lengthProperty];
  var hash = [], k = [];
  var primeCounter = 0;
  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
      k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
    }
  }
  ascii += '\x80';
  while (ascii[lengthProperty]%64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j>>8) return;
    words[i>>2] |= j << ((3 - i)%4)*8;
  }
  words[words[lengthProperty]] = ((asciiLength*8)/maxWord)|0;
  words[words[lengthProperty]] = (asciiLength*8)|0;
  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash.slice(0);
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w16 = w[i - 16], w15 = w[i - 15], w7 = w[i - 7], w2 = w[i - 2];
      var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3);
      var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10);
      var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      var temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16 ? w[i] : (w16 + s0 + w7 + s1)|0));
      var temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
      hash = [(temp1 + temp2)|0].concat(hash);
      hash[4] = (hash[4] + temp1)|0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i])|0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (hash[i]>>(j*8))&255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function getStorage(key, defaultValue) {
try {
const val = localStorage.getItem('amulet_pos_' + key);
return val ? JSON.parse(val) : defaultValue;
} catch (e) {
console.error(e);
return defaultValue;
}
}

function seedStorage(key, value) {
  try {
    localStorage.setItem('amulet_pos_' + key, JSON.stringify(value));
    localStorage.setItem('amulet_pos_ts_' + key, '0');
  } catch (e) {
    console.error(e);
  }
}

function setStorage(key, value, skipSync = false) {
try {
localStorage.setItem('amulet_pos_' + key, JSON.stringify(value));
const now = Date.now();
localStorage.setItem('amulet_pos_ts_' + key, String(now));

window.dispatchEvent(new Event('db-updated'));

const syncKeys = [
  'slots', 'products', 'categories', 'orders', 'debts', 'framing_jobs', 'settings',
  'attendance', 'expenses', 'audit_logs', 'raw_materials', 'production_history',
  'shifts', 'leaves', 'payrolls', 'users', 'promotions', 'cameras', 'cctv_alerts',
  'online_orders',
  'deposits', 'deposit_transactions', 'payment_logs', 'payment_qr', 'payment_history', 'payment_audit', 'payment_events'
];
if (!skipSync && syncKeys.includes(key)) {
const baseUrl = window.location.protocol + '//' + window.location.host;
fetch(`${baseUrl}/api/db/save`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ key, data: value, updatedAt: now })
}).catch(err => console.warn('Sync save failed (offline):', err));
}
} catch (e) {
console.error(e);
}
}

export const db = {
  _initialized: false,
  init() {
    if (this._initialized) return;
    this._initialized = true;
    if (!localStorage.getItem('amulet_pos_categories')) {
      seedStorage('categories', DEFAULT_CATEGORIES);
    }
if (!localStorage.getItem('amulet_pos_products')) {
seedStorage('products', DEFAULT_PRODUCTS);
} else {
  // Ensure K05 and C009-E195 products exist so the user does not have to create them manually
  const currentProducts = getStorage('products', []);
  let updatedProducts = false;
  
  if (currentProducts.length > 0) {
    if (!currentProducts.some(p => p.barcode === 'K05')) {
      currentProducts.push({
        id: 'P_K05',
        barcode: 'K05',
        name: 'ກອບທອງອີຕາលີ K05 (กรอบทองอิตาลี)',
        category: 'frames',
        price: 150000,
        cost: 100000,
        stock: 20,
        minStock: 2,
        unit: 'ອັນ',
        image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60'
      });
      updatedProducts = true;
    }
    if (!currentProducts.some(p => p.barcode === 'C009-E195')) {
      currentProducts.push({
        id: 'P_C009_E195',
        barcode: 'C009-E195',
        name: 'ກອບທອງອີຕາលີ C009-E195 (กรอบทองอิตาลี)',
        category: 'frames',
        price: 150000,
        cost: 100000,
        stock: 20,
        minStock: 2,
        unit: 'ອັນ',
        image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&auto=format&fit=crop&q=60'
      });
      updatedProducts = true;
    }
    
    if (updatedProducts) {
      setStorage('products', currentProducts);
    }
  }
}
const storedUsers = getStorage('users', []);
if (!localStorage.getItem('amulet_pos_users') || storedUsers.length === 0 || !storedUsers.some(u => u.email)) {
seedStorage('users', DEFAULT_USERS);
} else {
let migrationNeeded = false;
const migratedUsers = storedUsers.map(u => {
let updated = false;
if (!u.payType) {
u.payType = u.role === 'cashier' ? 'monthly' : 'daily';
updated = true;
}
if (u.baseWage === undefined) {
u.baseWage = u.role === 'owner' ? 150000 : u.role === 'cashier' ? 2400000 : 100000;
updated = true;
}
    if (u.otRate === undefined) {
      u.otRate = u.role === 'owner' ? 25000 : u.role === 'cashier' ? 15000 : 20000;
      updated = true;
    }
    if (!u.permissions) {
      u.permissions = {
        admin: u.role === 'owner',
        pos: true, // Everyone gets POS tab since it displays POS or Framing based on role
        inventory: u.role === 'owner',
        hrm: u.role === 'owner',
        reports: u.role === 'owner',
        debts: u.role === 'owner' || u.role === 'cashier',
        ai: u.role !== 'cashier',
        settings: u.role === 'owner'
      };
      updated = true;
    }
    if (updated) migrationNeeded = true;
    return u;
});
if (migrationNeeded) {
setStorage('users', migratedUsers);
}
}
if (!localStorage.getItem('amulet_pos_orders')) {
seedStorage('orders', DEFAULT_ORDERS);
}
if (!localStorage.getItem('amulet_pos_framing_jobs')) {
  // We use raw localStorage to avoid dispatching event in init() loop
  localStorage.setItem('amulet_pos_framing_jobs', JSON.stringify(DEFAULT_FRAMING_JOBS));
}
// Force override one-time seed data to restore all test jobs
if (!localStorage.getItem('amulet_pos_restored_v1')) {
  localStorage.setItem('amulet_pos_framing_jobs', JSON.stringify(DEFAULT_FRAMING_JOBS));
  localStorage.setItem('amulet_pos_restored_v1', 'true');
}

if (!localStorage.getItem('amulet_pos_promotions')) {
seedStorage('promotions', DEFAULT_PROMOTIONS);
}
if (!localStorage.getItem('amulet_pos_active_user')) {
seedStorage('active_user', DEFAULT_USERS[0]);
}
if (!localStorage.getItem('amulet_pos_settings')) {
seedStorage('settings', DEFAULT_SETTINGS);
}
if (!localStorage.getItem('amulet_pos_slots')) {
seedStorage('slots', getInitialSlots());
}
if (!localStorage.getItem('amulet_pos_debts')) {
seedStorage('debts', DEFAULT_DEBTS);
}
if (!localStorage.getItem('amulet_pos_audit_logs')) {
seedStorage('audit_logs', DEFAULT_AUDIT_LOGS);
}
if (!localStorage.getItem('amulet_pos_attendance')) {
seedStorage('attendance', DEFAULT_ATTENDANCE_LOGS);
}
if (!localStorage.getItem('amulet_pos_cameras')) {
seedStorage('cameras', DEFAULT_CCTV_CAMERAS);
}
if (!localStorage.getItem('amulet_pos_cctv_alerts')) {
seedStorage('cctv_alerts', DEFAULT_CCTV_ALERTS);
}
this.runDataRetention();
},

  runDataRetention() {
    const settings = this.getSettings();
    if (!settings.dataRetentionEnabled) return;

    const maxPerRun = Number(settings.dataRetentionMaxPerRun || 10);
    const now = new Date();

    // 1. Clean POS Bills & payments
    if (settings.dataRetentionDaysBills > 0) {
      const days = Number(settings.dataRetentionDaysBills);
      const orders = this.getOrders();
      const payments = this.getOrderPayments();
      
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      const toDeleteOrders = orders.filter(o => new Date(o.date) < cutoff);
      
      if (toDeleteOrders.length > 0) {
        const sorted = [...toDeleteOrders].sort((a, b) => new Date(a.date) - new Date(b.date));
        const limitIds = sorted.slice(0, maxPerRun).map(o => o.id);
        
        const remainingOrders = orders.filter(o => !limitIds.includes(o.id));
        const remainingPayments = payments.filter(p => !limitIds.includes(p.order_id));
        
        this.saveOrders(remainingOrders);
        this.saveOrderPayments(remainingPayments);
        console.log(`[Retention] Deleted POS orders: ${limitIds.join(', ')}`);
      }
    }

    // 2. Clean Online Orders
    if (settings.dataRetentionDaysOrders > 0) {
      const days = Number(settings.dataRetentionDaysOrders);
      const onlineOrders = this.getOnlineOrders();
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const toDeleteOnline = onlineOrders.filter(o => o.shippingStatus === 'delivered' && new Date(o.date) < cutoff);
      if (toDeleteOnline.length > 0) {
        const sorted = [...toDeleteOnline].sort((a, b) => new Date(a.date) - new Date(b.date));
        const limitIds = sorted.slice(0, maxPerRun).map(o => o.id);
        
        const remainingOnline = onlineOrders.filter(o => !limitIds.includes(o.id));
        this.saveOnlineOrders(remainingOnline);
        console.log(`[Retention] Deleted Online orders: ${limitIds.join(', ')}`);
      }
    }

    // 3. Clean Debts
    if (settings.dataRetentionDaysDebts > 0) {
      const days = Number(settings.dataRetentionDaysDebts);
      const debts = this.getDebts();
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const toDeleteDebts = debts.filter(d => d.status === 'paid' && new Date(d.date) < cutoff);
      if (toDeleteDebts.length > 0) {
        const sorted = [...toDeleteDebts].sort((a, b) => new Date(a.date) - new Date(b.date));
        const limitIds = sorted.slice(0, maxPerRun).map(d => d.id);
        
        const remainingDebts = debts.filter(d => !limitIds.includes(d.id));
        this.saveDebts(remainingDebts);
        console.log(`[Retention] Deleted Debts: ${limitIds.join(', ')}`);
      }
    }
  },

  getSettings() {
    this.init();
    const settings = getStorage('settings', DEFAULT_SETTINGS);
    const labels = { ...DEFAULT_SETTINGS.labels, ...(settings.labels || {}) };
    Object.keys(labels).forEach(key => {
      if (typeof labels[key] === 'string') {
        labels[key] = labels[key].replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
      }
    });
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      dailyWages: { ...DEFAULT_SETTINGS.dailyWages, ...(settings.dailyWages || {}) },
      otHourlyRates: { ...DEFAULT_SETTINGS.otHourlyRates, ...(settings.otHourlyRates || {}) },
      frameStyles: settings.frameStyles || DEFAULT_SETTINGS.frameStyles,
      acrylicThicknesses: settings.acrylicThicknesses || DEFAULT_SETTINGS.acrylicThicknesses,
      labels: labels,
      themeColors: { ...(settings.themeColors || {}) }
    };
  },
saveSettings(settings) {
setStorage('settings', settings);
},
getLabel(key, defaultValue) {
const settings = this.getSettings();
if (!settings.labels) settings.labels = {};
const val = settings.labels[key] && settings.labels[key].trim() !== '' ? settings.labels[key] : defaultValue;
if (typeof val === 'string') {
  return val.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}
return val;
},
saveLabels(labelsObj) {
const settings = this.getSettings();
settings.labels = {
...(settings.labels || {}),
...labelsObj
};
this.saveSettings(settings);
},

getSlots() {
this.init();
return getStorage('slots', getInitialSlots());
},
saveSlots(slots) {
setStorage('slots', slots);
},
  renameSlot(slotId, newLabel, customerName = '', customerPhone = '', customerId = '', discountType = 'percent', discountPercent = 0, discountAmount = 0) {
    const slots = this.getSlots();
    if (slots[slotId]) {
      slots[slotId].label = newLabel;
      slots[slotId].customerName = customerName;
      slots[slotId].customerPhone = customerPhone;
      slots[slotId].customerId = customerId;
      slots[slotId].discountType = discountType;
      slots[slotId].discountPercent = discountPercent;
      slots[slotId].discountAmount = discountAmount;
      this.saveSlots(slots);
    }
  },
  clearSlot(slotId) {
    const slots = this.getSlots();
    if (slots[slotId]) {
      slots[slotId].items = [];
      slots[slotId].notes = '';
      slots[slotId].customerName = '';
      slots[slotId].customerPhone = '';
      slots[slotId].customerId = '';
      slots[slotId].isDebt = false;
      slots[slotId].debtId = '';
      slots[slotId].amuletImage = '';
      slots[slotId].discountPercent = 0;
      slots[slotId].discountType = 'percent';
      slots[slotId].discountAmount = 0;
      slots[slotId].depositAmount = 0;
      this.saveSlots(slots);
    }
  },
  addSlot(id, label) {
    const slots = this.getSlots();
    if (slots[id]) {
      throw new Error('ຂໍອະໄພ: ລະຫັດຄິວ/ໂຕະນີ້ມີໃນລະບົບແລ້ວ!');
    }
    slots[id] = {
      id: id,
      label: label || id,
      items: [],
      notes: '',
      customerName: '',
      customerPhone: '',
      customerId: '',
      isDebt: false,
      debtId: '',
      amuletImage: '',
      discountPercent: 0,
      discountType: 'percent',
      discountAmount: 0,
      depositAmount: 0
    };
    this.saveSlots(slots);
    return slots[id];
  },
  deleteSlot(id) {
const slots = this.getSlots();
if (slots[id]) {
if (id === 'Walk-In') {
throw new Error('ບໍ່ສາມາດລຶບບັດຄິວຫຼັກ Walk-In ໄດ້');
}
if (slots[id].items && slots[id].items.length > 0) {
throw new Error('ບໍ່ສາມາດລຶບໄດ້ ເພາະຄິວນີ້ກຳລັງມີລາຍການສິນຄ້າຢູ່ໃນກະຕ່າ');
}
if (slots[id].isDebt) {
throw new Error('ບໍ່ສາມາດລຶບໄດ້ ເພາະຄິວນີ້ມີຍອດຄ້າງຊຳລະ (ຕິດໜີ້)');
}
delete slots[id];
this.saveSlots(slots);
}
},

getDebts() {
this.init();
return getStorage('debts', DEFAULT_DEBTS);
},
saveDebts(debts) {
setStorage('debts', debts);
},
addDebt(debtData) {
const debts = this.getDebts();
const newDebt = {
...debtData,
id: 'DBT' + String(debts.length + 10001).padStart(5, '0'),
date: new Date().toISOString(),
status: 'unpaid'
};
debts.push(newDebt);
this.saveDebts(debts);

// Deduct stock when debt is created
const products = this.getProducts();
const lowStockItemsList = [];
newDebt.items.forEach(item => {
  const prod = products.find(p => p.id === item.productId);
  if (prod && !this.isServiceCategory(prod.category)) {
    prod.stock = Math.max(0, prod.stock - item.qty);
    if (prod.stock <= prod.minStock) {
      lowStockItemsList.push(prod);
    }
  }
});
this.saveProducts(products);

// Send stock notification alert if any items are low
if (lowStockItemsList.length > 0) {
  let message = `⚠️ *ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດສະຕັອກ (ຈາກການຕິດໜີ້)!*\n`;
  lowStockItemsList.forEach(item => {
    message += `• ${item.name} (ເຫຼືອ ${item.stock} ${item.unit || 'ອັນ'}, ເກນຕໍ່າສຸດ ${item.minStock} ${item.unit || 'ອັນ'})\n`;
  });
  this.sendNotification(message);
}

return newDebt;
},
payDebt(debtId) {
const debts = this.getDebts();
const idx = debts.findIndex(d => d.id === debtId);
if (idx !== -1) {
debts[idx].status = 'paid';
this.saveDebts(debts);

// Auto-update associated framing jobs to 'picked_up' status so they move to Delivered column
if (debts[idx].items) {
  debts[idx].items.forEach(item => {
    if (item.productId && item.productId.startsWith('JOB')) {
      this.updateFramingJobStatus(item.productId, 'picked_up');
    }
  });
}
}

const slots = this.getSlots();
let slotChanged = false;
Object.keys(slots).forEach(slotId => {
if (slots[slotId].debtId === debtId) {
slots[slotId].isDebt = false;
slots[slotId].debtId = '';
slots[slotId].customerName = '';
slots[slotId].customerPhone = '';
slots[slotId].amuletImage = '';
slots[slotId].discountPercent = 0;
slots[slotId].discountType = 'percent';
slots[slotId].discountAmount = 0;
slots[slotId].items = [];
slotChanged = true;
}
});
if (slotChanged) {
this.saveSlots(slots);
}
this.cleanupDeliveredJobs();
},

getProducts() {
this.init();
const products = getStorage('products', DEFAULT_PRODUCTS);
return products.map(p => {
  const isService = this.isServiceCategory(p.category);
  return {
    ...p,
    showOnline: p.showOnline !== undefined ? p.showOnline : !isService,
    priceOnline: p.priceOnline !== undefined ? Number(p.priceOnline) : Number(p.price),
    priceVip: p.priceVip !== undefined ? Number(p.priceVip) : Number(p.price)
  };
});
},
saveProducts(products) {
setStorage('products', products);
},
addProduct(product) {
const products = this.getProducts();
const newProduct = this.normalizeProductForCategory({
...product,
id: 'P' + String(products.length + 1).padStart(3, '0'),
stock: Number(product.stock),
minStock: Number(product.minStock),
price: Number(product.price),
cost: Number(product.cost)
});
products.push(newProduct);
this.saveProducts(products);
return newProduct;
},
  updateProduct(updatedProduct) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === updatedProduct.id);
    if (idx !== -1) {
      const oldStock = products[idx].stock;
      const oldMin = products[idx].minStock;
      products[idx] = this.normalizeProductForCategory({
        ...updatedProduct,
        stock: Number(updatedProduct.stock),
        minStock: Number(updatedProduct.minStock),
        price: Number(updatedProduct.price),
        cost: Number(updatedProduct.cost)
      });
      this.saveProducts(products);

      // If stock was reduced below or equal to minStock
      if (products[idx].stock <= products[idx].minStock && oldStock > oldMin && !this.isServiceCategory(products[idx].category)) {
        const msg = `⚠️ *ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດສະຕັອກ (ປັບປຸງຂໍ້ມູນ)!*\n` +
                    `📦 *ສິນຄ້າ:* ${products[idx].name}\n` +
                    `📉 *ຄົງເຫຼືອ:* ${products[idx].stock} ${products[idx].unit || 'ອັນ'} (ເກນຕໍ່າສຸດ: ${products[idx].minStock} ${products[idx].unit || 'ອັນ'})`;
        this.sendNotification(msg);
      }
    }
  },
  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
  },

getCategories() {
this.init();
return getStorage('categories', DEFAULT_CATEGORIES);
},
saveCategories(categories) {
setStorage('categories', categories);
},
  isServiceCategory(categoryId) {
    const categories = this.getCategories();
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.type === 'service' : categoryId === 'services';
  },
  normalizeProductForCategory(product) {
    const isService = this.isServiceCategory(product.category);
    return {
      ...product,
      stock: isService ? 0 : Number(product.stock),
      minStock: isService ? 0 : Number(product.minStock),
      showOnline: product.showOnline !== undefined ? product.showOnline : !isService,
      priceOnline: product.priceOnline !== undefined ? Number(product.priceOnline) : Number(product.price),
      priceVip: product.priceVip !== undefined ? Number(product.priceVip) : Number(product.price)
    };
  },
  addCategory(category) {
    const categories = this.getCategories();
    const newId = 'cat_' + Date.now();
    const newCategory = {
      id: newId,
      name: category.name,
      icon: category.icon || '📦',
      type: category.type || 'physical'
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    this.saveLabels({
      ['cat_' + newId]: category.name
    });
    return newCategory;
  },
  updateCategory(updatedCategory) {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === updatedCategory.id);
    if (idx !== -1) {
      const previousType = categories[idx].type || (categories[idx].id === 'services' ? 'service' : 'physical');
      categories[idx] = {
        ...categories[idx],
        name: updatedCategory.name,
        icon: updatedCategory.icon || categories[idx].icon,
        type: updatedCategory.type || categories[idx].type || 'physical'
      };
      this.saveCategories(categories);
      this.saveLabels({
        ['cat_' + updatedCategory.id]: updatedCategory.name
      });

      const nextType = categories[idx].type || 'physical';
      if (previousType !== 'service' && nextType === 'service') {
        const products = this.getProducts();
        let changed = false;
        products.forEach(product => {
          if (product.category === updatedCategory.id) {
            product.stock = 0;
            product.minStock = 0;
            changed = true;
          }
        });
        if (changed) this.saveProducts(products);
      }
    }
  },
  deleteCategory(id) {
    const products = this.getProducts();
    if (products.some(p => p.category === id)) {
      throw new Error('ບໍ່ສາມາດລຶບໄດ້ ເພາະມີສິນຄ້າຢູ່ໃນໝວດໝູ່ນີ້');
    }
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    this.saveCategories(filtered);
  },

getOrders() {
this.init();
return getStorage('orders', DEFAULT_ORDERS);
},
saveOrders(orders) {
setStorage('orders', orders);
},
  addOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      ...orderData,
      id: 'TX' + String(orders.length + 10001).padStart(5, '0'),
      date: new Date().toISOString()
    };
    orders.push(newOrder);
    this.saveOrders(orders);

    // Record to Order_Payments
    const paymentStage = newOrder.isBalancePayment ? 'FINAL' : (newOrder.remainingAmount > 0 ? 'DEPOSIT' : 'FINAL');
    
    // Find original order ID if this is a balance payment
    let targetOrderId = newOrder.id;
    if (newOrder.isBalancePayment) {
      const jobItem = newOrder.items.find(i => i.productId && i.productId.startsWith('JOB'));
      if (jobItem) {
        const originalOrder = orders.find(o => o.items.some(oi => oi.productId === jobItem.productId) && !o.isBalancePayment);
        if (originalOrder) {
          targetOrderId = originalOrder.id;
        }
      }
    }

    this.addOrderPayment({
      order_id: targetOrderId,
      amount_paid: newOrder.paidAmount !== undefined ? newOrder.paidAmount : newOrder.total,
      payment_stage: paymentStage,
      payment_method: newOrder.paymentMethod === 'cash' ? 'Cash' : (newOrder.paymentMethod === 'transfer' ? 'BCEL One' : 'Split'),
      payCurrency: newOrder.payCurrency,
      cashReceived: newOrder.cashReceived,
      transferAmount: newOrder.transferAmount,
      change: newOrder.change,
      currencyCashReceived: newOrder.currencyCashReceived,
      currencyChange: newOrder.currencyChange
    });

    const products = this.getProducts();
    const lowStockItemsList = [];
    
    if (!newOrder.skipStockReduction) {
      newOrder.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod && !this.isServiceCategory(prod.category)) {
          prod.stock = Math.max(0, prod.stock - item.qty);
          if (prod.stock <= prod.minStock) {
            lowStockItemsList.push(prod);
          }
        }
      });
      this.saveProducts(products);
    }

    // Send combined phone notifications
    this.sendSalesAndStockNotification(newOrder, lowStockItemsList);

    return newOrder;
  },

getFramingJobs() {
this.init();
return getStorage('framing_jobs', DEFAULT_FRAMING_JOBS);
},
saveFramingJobs(jobs) {
setStorage('framing_jobs', jobs);
},
addFramingJob(job) {
const jobs = this.getFramingJobs();
const newJob = {
...job,
id: 'JOB' + String(jobs.length + 10001).padStart(5, '0'),
createdDate: new Date().toISOString(),
deposit: Number(job.deposit || 0),
totalPrice: Number(job.totalPrice),
balance: Number(job.totalPrice) - Number(job.deposit || 0),
status: 'pending'
};
jobs.push(newJob);
this.saveFramingJobs(jobs);
return newJob;
},
updateFramingJob(updatedJob) {
const jobs = this.getFramingJobs();
const idx = jobs.findIndex(j => j.id === updatedJob.id);
if (idx !== -1) {
const deposit = Number(updatedJob.deposit || 0);
const total = Number(updatedJob.totalPrice);
jobs[idx] = {
...updatedJob,
deposit: deposit,
totalPrice: total,
balance: updatedJob.status === 'picked_up' ? 0 : Math.max(0, total - deposit)
};
this.saveFramingJobs(jobs);
}
},
updateFramingJobStatus(id, newStatus) {
const jobs = this.getFramingJobs();
const idx = jobs.findIndex(j => j.id === id);
if (idx !== -1) {
jobs[idx].status = newStatus;
if (newStatus === 'picked_up') {
jobs[idx].balance = 0;
}
this.saveFramingJobs(jobs);
}
},

cleanupDeliveredJobs() {
const jobs = this.getFramingJobs();
const debts = this.getDebts();
const activeJobs = jobs.filter(j => {
  if (j.status !== 'picked_up') return true;
  const hasUnpaidDebt = debts.some(d => 
    d.status === 'unpaid' && 
    d.items && 
    d.items.some(item => item.productId === j.id)
  );
  return hasUnpaidDebt;
});
this.saveFramingJobs(activeJobs);
},

getUsers() {
this.init();
return getStorage('users', DEFAULT_USERS);
},
saveUsers(users) {
setStorage('users', users);
},
addUser(user) {
const users = this.getUsers();
const newUser = {
...user,
id: 'usr_' + Date.now(),
roleName: user.role === 'owner' ? 'ເຈົ້າຂອງຮ້ານ (Owner)' : user.role === 'cashier' ? 'ພະນັກງານຂາຍ (Cashier)' : 'ຊ່າງອັດກອບ (Technician)'
};
users.push(newUser);
this.saveUsers(users);
return newUser;
},
deleteUser(id) {
const users = this.getUsers();
const filtered = users.filter(u => u.id !== id);
this.saveUsers(filtered);
},
getActiveUser() {
this.init();
return getStorage('active_user', DEFAULT_USERS[0]);
},
setActiveUser(user) {
setStorage('active_user', user);
},

getPromotions() {
this.init();
return getStorage('promotions', DEFAULT_PROMOTIONS);
},
savePromotions(promos) {
setStorage('promotions', promos);
},

getAuditLogs() {
this.init();
return getStorage('audit_logs', DEFAULT_AUDIT_LOGS);
},
saveAuditLogs(logs) {
setStorage('audit_logs', logs);
},
addAuditLog(type, description, severity = 'info') {
const logs = this.getAuditLogs();
const activeUser = this.getActiveUser();
const newLog = {
id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
timestamp: new Date().toISOString(),
userId: activeUser ? activeUser.id : 'unknown',
userName: activeUser ? activeUser.name : 'Unknown User',
type: type,
description: description,
severity: severity
};
logs.unshift(newLog);
this.saveAuditLogs(logs);
return newLog;
},
clearAuditLogs() {
this.saveAuditLogs([]);
},

getAttendance() {
this.init();
return getStorage('attendance', DEFAULT_ATTENDANCE_LOGS);
},
  saveAttendance(logs) {
    setStorage('attendance', logs);
  },
  clockInUser(userId) {
    const logs = this.getAttendance();
    const dateStr = new Date().toLocaleDateString('en-CA');
    let record = logs.find(l => l.userId === userId && !l.clockOut);
    if (!record) {
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);
      record = {
        id: 'ATT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        userId: userId,
        userName: user ? user.name : userId,
        date: dateStr,
        clockIn: new Date().toISOString(),
        clockOut: null,
        workHours: 0,
        workedPercent: 0,
        otHours: 0,
        payout: 0,
        status: 'present'
      };
      logs.unshift(record);
      this.saveAttendance(logs);
      
      this.addAuditLog('clock_in', 'ພະນັກງານ ' + record.userName + ' ເຂົ້າງານ (Clock In)');
    }
    return record;
  },
  clockOutUser(userId) {
    const logs = this.getAttendance();
    const dateStr = new Date().toLocaleDateString('en-CA');
    const record = logs.find(l => l.userId === userId && !l.clockOut);
    if (record && !record.clockOut) {
      record.clockOut = new Date().toISOString();
      
      const startTime = new Date(record.clockIn);
      const endTime = new Date(record.clockOut);
      const diffMs = endTime - startTime;
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      record.workHours = parseFloat(hours.toFixed(2));
      
      const settings = this.getSettings();
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);
      const role = user ? user.role : 'cashier';
      
      const dailyWage = settings.dailyWages?.[role] || 80000;
      const otRate = settings.otHourlyRates?.[role] || 15000;
      
      const standardWorkHours = 8;
      record.workedPercent = Math.min(100, Math.round((hours / standardWorkHours) * 100));
      
      const otHours = Math.max(0, hours - standardWorkHours);
      record.otHours = parseFloat(otHours.toFixed(2));
      
      const basePayout = (record.workedPercent / 100) * dailyWage;
      const otPayout = record.otHours * otRate;
      record.payout = Math.round(basePayout + otPayout);
      
      this.saveAttendance(logs);
      
      this.addAuditLog('clock_out', 'ພະນັກງານ ' + record.userName + ' ອອກງານ (Clock Out), ຊົ່ວໂມງເຮັດວຽກ: ' + record.workHours + 'ຊມ, ຄ່າຈ้าง: ' + record.payout.toLocaleString() + ' ກີບ');
    }
    return record;
  },

  getShiftSales(userId) {
    const logs = this.getAttendance();
    const record = logs.find(l => l.userId === userId && !l.clockOut);
    if (!record) return 0;
    
    const startTime = new Date(record.clockIn);
    const orders = this.getOrders();
    const shiftSales = orders.filter(o => 
      o.cashierId === userId &&
      new Date(o.date) >= startTime
    );
    return shiftSales.reduce((sum, o) => sum + (o.total || 0), 0);
  },

  getCameras() {
    this.init();
    return getStorage('cameras', DEFAULT_CCTV_CAMERAS);
  },
  saveCameras(cameras) {
    setStorage('cameras', cameras);
  },
  addCamera(camera) {
    const cameras = this.getCameras();
    const newCamera = {
      ...camera,
      id: 'CAM-' + Date.now(),
      active: true,
      checks: camera.checks || { intruder: true, cashierAudit: false, slacking: false }
    };
    cameras.push(newCamera);
    this.saveCameras(cameras);
    return newCamera;
  },
  deleteCamera(id) {
    const cameras = this.getCameras();
    const filtered = cameras.filter(c => c.id !== id);
    this.saveCameras(filtered);
  },
  updateCamera(updated) {
    const cameras = this.getCameras();
    const idx = cameras.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      cameras[idx] = updated;
      this.saveCameras(cameras);
    }
  },

  getCctvAlerts() {
    this.init();
    return getStorage('cctv_alerts', DEFAULT_CCTV_ALERTS);
  },
  saveCctvAlerts(alerts) {
    setStorage('cctv_alerts', alerts);
  },
  addCctvAlert(alert) {
    const alerts = this.getCctvAlerts();
    const newAlert = {
      ...alert,
      id: 'ALT-' + Date.now(),
      timestamp: new Date().toISOString(),
      resolved: false
    };
    alerts.unshift(newAlert);
    this.saveCctvAlerts(alerts);
    return newAlert;
  },
  resolveCctvAlert(id) {
    const alerts = this.getCctvAlerts();
    const idx = alerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      alerts[idx].resolved = true;
      this.saveCctvAlerts(alerts);
    }
  },

  resetDatabase() {
    localStorage.removeItem('amulet_pos_products');
    localStorage.removeItem('amulet_pos_users');
    localStorage.removeItem('amulet_pos_orders');
    localStorage.removeItem('amulet_pos_framing_jobs');
    localStorage.removeItem('amulet_pos_promotions');
    localStorage.removeItem('amulet_pos_settings');
    localStorage.removeItem('amulet_pos_active_user');
    localStorage.removeItem('amulet_pos_slots');
    localStorage.removeItem('amulet_pos_debts');
    localStorage.removeItem('amulet_pos_audit_logs');
    localStorage.removeItem('amulet_pos_attendance');
    localStorage.removeItem('amulet_pos_cameras');
    localStorage.removeItem('amulet_pos_cctv_alerts');
    localStorage.removeItem('amulet_pos_expenses');
    this.init();
  },

  getExpenses() {
    this.init();
    return getStorage('expenses', []);
  },
  saveExpenses(expenses) {
    setStorage('expenses', expenses);
  },
  addExpense(expenseData) {
    const expenses = this.getExpenses();
    const activeUser = this.getActiveUser();
    const newExpense = {
      ...expenseData,
      id: 'EXP-' + String(expenses.length + 10001).padStart(5, '0'),
      date: new Date().toISOString(),
      createdBy: activeUser ? activeUser.id : 'unknown',
      createdByName: activeUser ? activeUser.name : 'Unknown User'
    };
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);
    this.addAuditLog('expense_logged', `ບັນທຶກລາຍຈ່າຍ: ${newExpense.categoryName} ມູນຄ່າ ${newExpense.amount.toLocaleString()} ກີບ (${newExpense.notes})`);
    return newExpense;
  },

  getSalesSummary(userId, startDate, endDate, exactTime = false) {
    const orders = this.getOrders();
    const debts = this.getDebts();
    const expenses = this.getExpenses();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!exactTime) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const cashierOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      return (!userId || o.cashierId === userId) && (orderDate >= start && orderDate <= end);
    });

    const cashierDebts = debts.filter(d => {
      const debtDate = new Date(d.date);
      const debtCreator = d.cashierId || d.createdBy || '';
      return (!userId || debtCreator === userId) && (debtDate >= start && debtDate <= end);
    });

    const filteredExpenses = expenses.filter(ex => {
      const exDate = new Date(ex.date);
      return (!userId || ex.createdBy === userId) && (exDate >= start && exDate <= end);
    });

    let totalCashLak = 0;
    let totalCashThb = 0;
    let totalCashUsd = 0;
    let totalTransferLak = 0;
    let totalSalesLak = 0;
    
    cashierOrders.forEach(o => {
      totalSalesLak += o.total;
      if (o.paymentMethod === 'cash') {
        const currency = o.payCurrency || 'LAK';
        if (currency === 'LAK') {
          totalCashLak += o.total;
        } else if (currency === 'THB') {
          totalCashThb += o.currencyCashReceived - o.currencyChange;
        } else if (currency === 'USD') {
          totalCashUsd += o.currencyCashReceived - o.currencyChange;
        }
      } else if (o.paymentMethod === 'transfer') {
        totalTransferLak += o.total;
      } else if (o.paymentMethod === 'split') {
        const currency = o.payCurrency || 'LAK';
        const rate = currency === 'THB' ? (o.exchangeRateThb || 750) : currency === 'USD' ? (o.exchangeRateUsd || 26000) : 1;
        const cashKeptCurrency = (o.currencyCashReceived || 0) - (o.currencyChange || 0);
        const transKeptCurrency = o.currencyTransferAmount || 0;
        
        if (currency === 'LAK') {
          totalCashLak += cashKeptCurrency;
          totalTransferLak += transKeptCurrency;
        } else if (currency === 'THB') {
          totalCashThb += cashKeptCurrency;
          totalTransferLak += transKeptCurrency * rate;
        } else if (currency === 'USD') {
          totalCashUsd += cashKeptCurrency;
          totalTransferLak += transKeptCurrency * rate;
        }
      }
    });

    const totalDebtLak = cashierDebts.reduce((sum, d) => sum + d.total, 0);
    const totalExpenseLak = filteredExpenses.reduce((sum, ex) => sum + ex.amount, 0);

    // Calculate sold products list during this shift/range
    const productQtyMap = {};
    cashierOrders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (!productQtyMap[item.productId]) {
            productQtyMap[item.productId] = {
              name: item.name,
              qty: 0
            };
          }
          productQtyMap[item.productId].qty += item.qty;
        });
      }
    });
    const soldProducts = Object.values(productQtyMap);

    return {
      ordersCount: cashierOrders.length,
      soldProducts,
      totalSalesLak,
      totalCashLak,
      totalCashThb,
      totalCashUsd,
      totalTransferLak,
      totalDebtLak,
      totalExpenseLak,
      orders: cashierOrders,
      debts: cashierDebts,
      expenses: filteredExpenses
    };
  },

  getStatsForRange(startDate, endDate) {
    const orders = this.getOrders();
    const jobs = this.getFramingJobs();
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= start && d <= end;
    });
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    
    const products = this.getProducts();
    const productCostMap = {};
    products.forEach(p => { productCostMap[p.id] = p.cost; });

    let totalCost = 0;
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const itemCost = productCostMap[item.productId] || 0;
        totalCost += itemCost * item.qty;
      });
    });
    
    const salesProfit = totalSales - totalCost;

    const activeJobs = jobs.filter(j => j.status !== 'picked_up');
    const completedJobsValue = jobs
      .filter(j => {
        const d = new Date(j.createdDate);
        return d >= start && d <= end;
      })
      .reduce((sum, j) => sum + j.totalPrice, 0);

    return {
      salesVolume: totalSales,
      netProfit: salesProfit + (completedJobsValue * 0.7),
      orderCount: filteredOrders.length,
      pendingJobs: activeJobs.length,
      jobVolume: completedJobsValue
    };
  },

  sendNotification(message) {
    try {
      const settings = this.getSettings();
      const provider = settings.notifyProvider || 'none';
      if (provider === 'none') return;

      if (provider === 'telegram' && settings.telegramBotToken && settings.telegramChatId) {
        const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: message,
            parse_mode: 'Markdown'
          })
        }).catch(err => console.error('Telegram notification error:', err));
      } else if (provider === 'discord' && settings.discordWebhookUrl) {
        fetch(settings.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message.replace(/\*/g, '**')
          })
        }).catch(err => console.error('Discord notification error:', err));
      } else if (provider === 'line_notify' && settings.lineNotifyToken) {
        const targetUrl = 'https://notify-api.line.me/api/notify';
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl);
        const formData = new URLSearchParams();
        formData.append('message', message.replace(/\*/g, ''));
        
        fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.lineNotifyToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        }).catch(err => console.error('Line Notify notification error:', err));
      }
    } catch (e) {
      console.error('Notification failed:', e);
    }
  },

  sendSalesAndStockNotification(order, lowStockItems) {
    try {
      const itemsStr = order.items.map(item => `• ${item.name} x ${item.qty}`).join('\n');
      let message = `🔔 *ແຈ້ງເຕືອນການຂາຍໃໝ່!*\n` +
                    `🧾 *ເລກບິນ:* ${order.id}\n` +
                    `👤 *ພະນັກງານຂາຍ:* ${order.cashierName}\n` +
                    `📦 *ລາຍການ:* \n${itemsStr}\n` +
                    `💵 *ຍອດລວມສຸດທິ:* ${order.total.toLocaleString()} LAK\n` +
                    `💳 *ຊຳລະຜ່ານ:* ${order.paymentMethod === 'cash' ? '💵 ເງິນສົດ' : '📱 ໂອນທະນາຄານ'}`;

      if (lowStockItems && lowStockItems.length > 0) {
        message += `\n\n⚠️ *ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດສະຕັອກ!*\n`;
        lowStockItems.forEach(item => {
          message += `• ${item.name} (ເຫຼືອ ${item.stock} ${item.unit || 'ອັນ'}, ເກນຕໍ່າສຸດ ${item.minStock} ${item.unit || 'ອັນ'})\n`;
        });
      }

      this.sendNotification(message);
    } catch (e) {
      console.error('Unified notification error:', e);
    }
  },

  sendSalesNotification(order) {
    this.sendSalesAndStockNotification(order, []);
  },

  getStats(days) {
    const limitDays = days || 30;
    const orders = this.getOrders();
    const jobs = this.getFramingJobs();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - limitDays);

    const filteredOrders = orders.filter(o => new Date(o.date) >= cutoffDate);
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    
    const products = this.getProducts();
    const productCostMap = {};
    products.forEach(p => { productCostMap[p.id] = p.cost; });

    let totalCost = 0;
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const itemCost = productCostMap[item.productId] || 0;
        totalCost += itemCost * item.qty;
      });
    });
    
    const salesProfit = totalSales - totalCost;

    const activeJobs = jobs.filter(j => j.status !== 'picked_up');
    const completedJobsValue = jobs
      .filter(j => new Date(j.createdDate) >= cutoffDate)
      .reduce((sum, j) => sum + j.totalPrice, 0);

    return {
      salesVolume: totalSales,
      netProfit: salesProfit + (completedJobsValue * 0.7),
      orderCount: filteredOrders.length,
      pendingJobs: activeJobs.length,
      jobVolume: completedJobsValue
    };
  },

  // === RAW MATERIALS API ===
  getRawMaterials() {
    this.init();
    return getStorage('raw_materials', []);
  },
  saveRawMaterials(materials) {
    setStorage('raw_materials', materials);
  },
  addRawMaterial(material) {
    const list = this.getRawMaterials();
    const newMaterial = {
      ...material,
      id: 'MAT_' + Date.now(),
      stock_qty: Number(material.stock_qty || 0),
      min_stock: Number(material.min_stock || 0),
      cost_price: Number(material.cost_price || 0),
      created_at: new Date().toISOString()
    };
    list.push(newMaterial);
    this.saveRawMaterials(list);
    return newMaterial;
  },
  updateRawMaterial(updated) {
    const list = this.getRawMaterials();
    const idx = list.findIndex(m => m.id === updated.id);
    if (idx !== -1) {
      list[idx] = {
        ...updated,
        stock_qty: Number(updated.stock_qty || 0),
        min_stock: Number(updated.min_stock || 0),
        cost_price: Number(updated.cost_price || 0)
      };
      this.saveRawMaterials(list);
      
      // Stock warning notification for raw materials
      if (list[idx].stock_qty <= list[idx].min_stock) {
        const msg = `⚠️ *ແຈ້ງເຕືອນວັດຖຸດິບໃກ້ໝົດສະຕັອກ!*\n` +
                    `📦 *ວັດຖຸດິບ:* ${list[idx].name}\n` +
                    `📉 *ຄົງເຫຼືອ:* ${list[idx].stock_qty} ${list[idx].unit || 'ອັນ'} (ເກນຕໍ່າສຸດ: ${list[idx].min_stock} ${list[idx].unit || 'ອັນ'})`;
        this.sendNotification(msg);
      }
    }
  },

  verifyOtpAndReset(email, otp, newPassword) {
    this.init();
    const logs = getStorage('otp_logs', []);
    const logIdx = logs.findIndex(l => l.email === email && l.otp === otp && !l.verified && l.expiresAt > Date.now());
    if (logIdx === -1) throw new Error('ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ!');
    
    logs[logIdx].verified = true;
    setStorage('otp_logs', logs);
    
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.email === email);
    if (userIdx !== -1) {
      users[userIdx].password = newPassword;
      this.saveUsers(users);
      this.addAuditLog('reset_password', `ປ່ຽນລະຫັດຜ່ານບັນຊີ ${email} ຜ່ານ OTP ສຳເລັດ`, 'info');
    }
  },

  startSync(onUpdateCallback) {
    if (syncIntervalId) return;

    const keys = [
      'slots', 'products', 'categories', 'orders', 'debts', 'framing_jobs', 'settings',
      'attendance', 'expenses', 'audit_logs', 'raw_materials', 'production_history',
      'shifts', 'leaves', 'payrolls', 'users', 'promotions', 'cameras', 'cctv_alerts',
      'online_orders',
      'deposits', 'deposit_transactions', 'payment_logs', 'payment_qr', 'payment_history', 'payment_audit', 'payment_events'
    ];

    const doSync = () => {
      if (Date.now() - lastSyncCheck < 1000) return;
      lastSyncCheck = Date.now();

      const params = new URLSearchParams();
      keys.forEach(k => {
        const ts = localStorage.getItem('amulet_pos_ts_' + k) || '0';
        params.append(k, ts);
      });

      const baseUrl = window.location.protocol + '//' + window.location.host;
      fetch(`${baseUrl}/api/db/sync?` + params.toString())
        .then(res => res.json())
        .then(updatedTables => {
          let hasChanges = false;
          Object.keys(updatedTables).forEach(k => {
            const table = updatedTables[k];
            const localTs = Number(localStorage.getItem('amulet_pos_ts_' + k) || '0');
            if (table.updatedAt > localTs) {
              localStorage.setItem('amulet_pos_' + k, JSON.stringify(table.data));
              localStorage.setItem('amulet_pos_ts_' + k, String(table.updatedAt));
              hasChanges = true;
            }
          });

          if (hasChanges) {
            window.dispatchEvent(new Event('db-updated'));
            if (onUpdateCallback) {
              onUpdateCallback();
            }
          }
        })
        .catch(err => {});
    };

    const baseUrl = window.location.protocol + '//' + window.location.host;
    const checkParams = new URLSearchParams();
    keys.forEach(k => checkParams.append(k, '0'));
    
    // Bidirectional startup sync
    fetch(`${baseUrl}/api/db/sync?` + checkParams.toString())
      .then(res => res.json())
      .then(serverAll => {
        keys.forEach(k => {
          const serverTable = serverAll[k];
          const localDataStr = localStorage.getItem('amulet_pos_' + k);
          const localTs = Number(localStorage.getItem('amulet_pos_ts_' + k) || '0');

          if (!serverTable) {
            // Server doesn't have this key yet. Push client version if exists.
            if (localDataStr) {
              try {
                const data = JSON.parse(localDataStr);
                fetch(`${baseUrl}/api/db/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: k, data, updatedAt: localTs })
                }).catch(e => {});
              } catch (e) {}
            }
          } else {
            const serverTs = Number(serverTable.updatedAt || '0');
            if (localTs > serverTs) {
              // Client is newer. Push to server.
              if (localDataStr) {
                try {
                  const data = JSON.parse(localDataStr);
                  fetch(`${baseUrl}/api/db/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: k, data, updatedAt: localTs })
                  }).catch(e => {});
                } catch (e) {}
              }
            } else if (serverTs > localTs) {
              // Server is newer. Pull to client.
              localStorage.setItem('amulet_pos_' + k, JSON.stringify(serverTable.data));
              localStorage.setItem('amulet_pos_ts_' + k, String(serverTs));
            }
          }
        });
        
        // Start recurring sync checks
        syncIntervalId = setInterval(doSync, 2000);
      })
      .catch(err => {
        // Fallback to regular sync on error
        syncIntervalId = setInterval(doSync, 2000);
      });
  },

  stopSync() {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
  },

  async syncOnStartup() {
    const keys = [
      'slots', 'products', 'categories', 'orders', 'debts', 'framing_jobs', 'settings',
      'attendance', 'expenses', 'audit_logs', 'raw_materials', 'production_history',
      'shifts', 'leaves', 'payrolls', 'users', 'promotions', 'cameras', 'cctv_alerts',
      'online_orders',
      'deposits', 'deposit_transactions', 'payment_logs', 'payment_qr', 'payment_history', 'payment_audit', 'payment_events'
    ];
    const baseUrl = window.location.protocol + '//' + window.location.host;
    const checkParams = new URLSearchParams();
    keys.forEach(k => checkParams.append(k, '0'));
    
    try {
      const res = await fetch(`${baseUrl}/api/db/sync?` + checkParams.toString());
      const serverAll = await res.json();
      
      const promises = keys.map(async (k) => {
        const serverTable = serverAll[k];
        const localDataStr = localStorage.getItem('amulet_pos_' + k);
        const localTs = Number(localStorage.getItem('amulet_pos_ts_' + k) || '0');

        if (!serverTable) {
          if (localDataStr) {
            try {
              const data = JSON.parse(localDataStr);
              await fetch(`${baseUrl}/api/db/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: k, data, updatedAt: localTs })
              });
            } catch (e) {}
          }
        } else {
          const serverTs = Number(serverTable.updatedAt || '0');
          if (localTs > serverTs) {
            if (localDataStr) {
              try {
                const data = JSON.parse(localDataStr);
                await fetch(`${baseUrl}/api/db/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: k, data, updatedAt: localTs })
                });
              } catch (e) {}
            }
          } else if (serverTs > localTs) {
            localStorage.setItem('amulet_pos_' + k, JSON.stringify(serverTable.data));
            localStorage.setItem('amulet_pos_ts_' + k, String(serverTs));
          }
        }
      });
      
      await Promise.all(promises);
      window.dispatchEvent(new Event('db-updated'));
      console.log("✓ Startup sync complete.");
    } catch (err) {
      console.warn("Startup sync failed:", err.message);
    }
  },

  deleteRawMaterial(id) {
    const list = this.getRawMaterials();
    const filtered = list.filter(m => m.id !== id);
    this.saveRawMaterials(filtered);
  },

  // === BCEL ONE / LAO QR DEPOSIT DB IMPLEMENTATION ===
  getDeposits() {
    this.init();
    return getStorage('deposits', []);
  },
  saveDeposits(data) {
    setStorage('deposits', data);
  },

  getDepositTransactions() {
    this.init();
    return getStorage('deposit_transactions', []);
  },
  saveDepositTransactions(data) {
    setStorage('deposit_transactions', data);
  },

  getPaymentLogs() {
    this.init();
    return getStorage('payment_logs', []);
  },
  savePaymentLogs(data) {
    setStorage('payment_logs', data);
  },
  addPaymentLog(event, details, cashierId = '') {
    const logs = this.getPaymentLogs();
    const tzDate = new Date();
    const dateStr = tzDate.toLocaleDateString('en-CA');
    const timeStr = tzDate.toLocaleTimeString('en-US', { hour12: false });
    const newLog = {
      id: 'LOG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      event,
      details,
      date: dateStr,
      time: timeStr,
      timezone: 'Asia/Vientiane',
      user: cashierId || 'system',
      device: navigator.userAgent,
      ip: window.location.hostname
    };
    logs.push(newLog);
    this.savePaymentLogs(logs);
    return newLog;
  },

  getPaymentQr() {
    this.init();
    return getStorage('payment_qr', []);
  },
  savePaymentQr(data) {
    setStorage('payment_qr', data);
  },

  getPaymentHistory() {
    this.init();
    return getStorage('payment_history', []);
  },
  savePaymentHistory(data) {
    setStorage('payment_history', data);
  },

  getPaymentAudit() {
    this.init();
    return getStorage('payment_audit', []);
  },
  savePaymentAudit(data) {
    setStorage('payment_audit', data);
  },

  getPaymentEvents() {
    this.init();
    return getStorage('payment_events', []);
  },
  savePaymentEvents(data) {
    setStorage('payment_events', data);
  },

  createDeposit(depositData) {
    const deposits = this.getDeposits();
    const audits = this.getPaymentAudit();
    
    const depositId = 'DEP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const tzDate = new Date();
    const dateStr = tzDate.toLocaleDateString('en-CA');
    const timeStr = tzDate.toLocaleTimeString('en-US', { hour12: false });
    
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const merchantId = 'mch64f01defcb310';
    const amount = Number(depositData.amount);
    
    const tag38Value = `0006LAPNET0116${merchantId}`;
    const tag38Str = `38${String(tag38Value.length).padStart(2, '0')}${tag38Value}`;
    
    const amountStr = String(amount);
    const tag54Str = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
    
    const refValue = `01${String(depositId.length).padStart(2, '0')}${depositId}`;
    const tag62Str = `62${String(refValue.length).padStart(2, '0')}${refValue}`;
    
    let emvString = `000201010212${tag38Str}5303418${tag54Str}5802LA5906LEYUNG6005PAKSE${tag62Str}6304`;
    
    const crc16 = calculateCRC16(emvString);
    emvString += crc16;

    const newDeposit = {
      id: depositId,
      billId: depositData.billId || '',
      queueId: depositData.queueId || '',
      tableNumber: depositData.tableNumber || '',
      customerName: depositData.customerName || '',
      customerPhone: depositData.customerPhone || '',
      amount: amount,
      currency: 'LAK',
      paymentMethod: depositData.paymentMethod || 'LAO QR',
      qrReference: emvString,
      transactionReference: '',
      date: dateStr,
      time: timeStr,
      timezone: 'Asia/Vientiane',
      user: depositData.cashierName || 'system',
      cashier: depositData.cashierName || 'system',
      device: navigator.userAgent,
      branch: 'ปากเซ',
      status: 'Waiting Payment',
      uuid: uuid,
      checksum: crc16,
      hash: ''
    };

    const recordPayload = `${newDeposit.id}|${newDeposit.uuid}|${newDeposit.amount}|${newDeposit.currency}|${newDeposit.cashier}`;
    const secureHash = sha256(recordPayload);
    newDeposit.hash = secureHash;

    deposits.push(newDeposit);
    this.saveDeposits(deposits);

    const qrRecords = this.getPaymentQr();
    qrRecords.push({
      depositId: depositId,
      qrString: emvString,
      createdAt: tzDate.toISOString()
    });
    this.savePaymentQr(qrRecords);

    audits.push({
      id: 'AUDIT_' + Date.now(),
      targetId: depositId,
      type: 'deposit_created',
      hash: secureHash,
      date: dateStr,
      time: timeStr,
      timezone: 'Asia/Vientiane'
    });
    this.savePaymentAudit(audits);

    this.addPaymentLog('QR Created', `Created Deposit QR of ${amount.toLocaleString()} LAK for queue ${newDeposit.queueId}`, depositData.cashierName);

    return newDeposit;
  },

  confirmDepositPayment(depositId, refNo, transId, cashierName) {
    const deposits = this.getDeposits();
    const transactions = this.getDepositTransactions();
    const idx = deposits.findIndex(d => d.id === depositId);
    
    if (idx !== -1) {
      const tzDate = new Date();
      const dateStr = tzDate.toLocaleDateString('en-CA');
      const timeStr = tzDate.toLocaleTimeString('en-US', { hour12: false });
      
      deposits[idx].status = 'Paid Deposit';
      deposits[idx].transactionReference = refNo || transId || '';
      this.saveDeposits(deposits);

      const transIdGen = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const newTransaction = {
        id: transIdGen,
        depositId: depositId,
        amount: deposits[idx].amount,
        referenceNumber: refNo || '',
        transactionId: transId || transIdGen,
        paymentTime: `${dateStr} ${timeStr}`,
        status: 'Paid',
        date: dateStr,
        time: timeStr,
        timezone: 'Asia/Vientiane'
      };
      transactions.push(newTransaction);
      this.saveDepositTransactions(transactions);

      this.addPaymentLog('Payment Success', `Deposit ID ${depositId} payment confirmed manually. Ref: ${refNo}`, cashierName);

      return deposits[idx];
    }
    return null;
  },

  cancelDepositPayment(depositId, cashierName) {
    const deposits = this.getDeposits();
    const idx = deposits.findIndex(d => d.id === depositId);
    if (idx !== -1) {
      deposits[idx].status = 'Cancelled';
      this.saveDeposits(deposits);
      this.addPaymentLog('Cancel', `Deposit ID ${depositId} cancelled.`, cashierName);
      return deposits[idx];
    }
    return null;
  },

  // === PRODUCTION HISTORY & BOM PRODUCTION TRIGGER API ===
  getProductionHistory() {
    this.init();
    return getStorage('production_history', []);
  },
  saveProductionHistory(history) {
    setStorage('production_history', history);
  },
  addProductionJob(productId, qty) {
    const products = this.getProducts();
    const prodIdx = products.findIndex(p => p.id === productId);
    if (prodIdx === -1) throw new Error('ບໍ່ພົບສິນຄ້າ!');
    const product = products[prodIdx];
    const bom = product.bom || [];
    
    // Check and deduct raw materials
    const rawMaterials = this.getRawMaterials();
    const details = [];
    
    bom.forEach(recipe => {
      const mat = rawMaterials.find(m => m.id === recipe.materialId);
      if (!mat) throw new Error(`ບໍ່ພົບວັດຖຸດິບ: ${recipe.materialId}`);
      const qtyRequired = recipe.qty * qty;
      if (mat.stock_qty < qtyRequired) {
        throw new Error(`ວັດຖຸດິບບໍ່ພໍ: ${mat.name} (ຕ້ອງການ ${qtyRequired}, ມີພຽງ ${mat.stock_qty})`);
      }
      mat.stock_qty -= qtyRequired;
      details.push({
        materialId: mat.id,
        materialName: mat.name,
        qtyUsed: qtyRequired
      });
    });
    
    // Save raw materials stock deduction
    this.saveRawMaterials(rawMaterials);
    
    // Increment product stock
    product.stock = (Number(product.stock) || 0) + qty;
    this.saveProducts(products);
    
    // Calculate cost per unit based on BOM cost
    let costPerUnit = 0;
    bom.forEach(recipe => {
      const mat = rawMaterials.find(m => m.id === recipe.materialId);
      if (mat) {
        costPerUnit += (mat.cost_price || 0) * recipe.qty;
      }
    });
    
    // Save production history
    const history = this.getProductionHistory();
    const activeUser = this.getActiveUser();
    const newJob = {
      id: 'PRD_' + Date.now(),
      productId: product.id,
      productName: product.name,
      qty: qty,
      costPerUnit: costPerUnit || product.cost || 0,
      totalCost: (costPerUnit || product.cost || 0) * qty,
      createdBy: activeUser ? activeUser.id : 'system',
      createdByName: activeUser ? activeUser.name : 'System',
      createdAt: new Date().toISOString(),
      details: details
    };
    
    history.unshift(newJob);
    this.saveProductionHistory(history);
    
    // Log audit log
    this.addAuditLog('production_job', `ຜະລິດສินຄ້າ: ${product.name} ຈຳນວນ ${qty} ${product.unit || 'ອັນ'}, ຫັກວັດຖຸດິບສຳເລັດ`, 'info');
    
    return newJob;
  },

  // === SHIFT SCHEDULES API ===
  getShifts() {
    this.init();
    return getStorage('shifts', []);
  },
  saveShifts(shifts) {
    setStorage('shifts', shifts);
  },

  // === LEAVES REQUESTS API ===
  getLeaves() {
    this.init();
    return getStorage('leaves', []);
  },
  saveLeaves(leaves) {
    setStorage('leaves', leaves);
  },
  addLeave(leaveData) {
    const list = this.getLeaves();
    const newLeave = {
      ...leaveData,
      id: 'LV_' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    list.unshift(newLeave);
    this.saveLeaves(list);
    return newLeave;
  },
  approveLeave(leaveId, status, approverUser) {
    const list = this.getLeaves();
    const idx = list.findIndex(l => l.id === leaveId);
    if (idx !== -1) {
      list[idx].status = status; // approved / rejected
      list[idx].approvedBy = approverUser.id;
      list[idx].approvedByName = approverUser.name;
      this.saveLeaves(list);
      this.addAuditLog('leave_approval', `ອະນຸມັດການລາພັກ: ${list[idx].userName} (${status === 'approved' ? 'ອະນຸມັດ' : 'ປະຕິເສດ'})`, 'info');
    }
  },

  // === PAYROLL ENGINE API ===
  getPayrolls() {
    this.init();
    return getStorage('payrolls', []);
  },
  savePayrolls(payrolls) {
    setStorage('payrolls', payrolls);
  },
  calculatePayrollForUser(userId, month) {
    const attendance = this.getAttendance().filter(l => l.userId === userId && l.date.startsWith(month));
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const settings = this.getSettings();
    const baseWage = user.baseWage || 0;
    const otRate = user.otRate || 0;
    
    let totalOtPay = 0;
    let totalWorkDays = 0;
    let totalAbsentDays = 0;
    let lateDeductions = 0;
    
    const shifts = this.getShifts();
    const userShifts = shifts.filter(s => s.userId === userId);
    
    attendance.forEach(rec => {
      if (rec.status === 'present') {
        totalWorkDays++;
        totalOtPay += (rec.otHours || 0) * otRate;
        
        // Late minute calculation
        if (rec.clockIn) {
          const clockInTime = new Date(rec.clockIn);
          const dayOfWeek = clockInTime.getDay();
          const shift = userShifts.find(s => s.dayOfWeek === dayOfWeek);
          const shiftStartStr = shift ? shift.startTime : '08:00';
          
          const [sHour, sMin] = shiftStartStr.split(':').map(Number);
          const expectedTime = new Date(clockInTime);
          expectedTime.setHours(sHour, sMin, 0, 0);
          
          if (clockInTime > expectedTime) {
            const diffMin = Math.floor((clockInTime - expectedTime) / (1000 * 60));
            if (diffMin > 5) { // 5 min grace
              lateDeductions += diffMin * 1000; // 1,000 Kip per minute
            }
          }
        }
      } else if (rec.status === 'absent') {
        totalAbsentDays++;
      }
    });

    const leaves = this.getLeaves().filter(l => l.userId === userId && l.status === 'approved' && l.startDate.startsWith(month));
    const leaveDeduction = leaves.length * (user.payType === 'daily' ? baseWage : baseWage / 30);
    
    const baseWages = user.payType === 'daily' ? baseWage * totalWorkDays : baseWage;
    const absenceDeduction = totalAbsentDays * (user.payType === 'daily' ? baseWage : baseWage / 30);
    
    const netPay = baseWages + totalOtPay - leaveDeduction - lateDeductions - absenceDeduction;
    
    return {
      userId: user.id,
      userName: user.name,
      month: month,
      baseWages: baseWages,
      otPay: totalOtPay,
      leaveDeduction: Math.round(leaveDeduction),
      lateDeduction: Math.round(lateDeductions),
      absenceDeduction: Math.round(absenceDeduction),
      netPay: Math.max(0, Math.round(netPay)),
      status: 'unpaid'
    };
  },
  payoutPayroll(payrollData) {
    const list = this.getPayrolls();
    const existingIdx = list.findIndex(p => p.userId === payrollData.userId && p.month === payrollData.month);
    const newRecord = {
      ...payrollData,
      id: 'PAY_' + Date.now(),
      status: 'paid',
      paidAt: new Date().toISOString()
    };
    if (existingIdx !== -1) {
      list[existingIdx] = newRecord;
    } else {
      list.unshift(newRecord);
    }
    this.savePayrolls(list);
    this.addAuditLog('payroll_payout', `ຈ່າຍເງິນເດືອນພະນັກງານ: ${payrollData.userName} ປະຈຳເດືອນ ${payrollData.month} ຍອດຈ່າຍ ${payrollData.netPay.toLocaleString()} ກີບ`, 'info');
    return newRecord;
  },

  // === OTP reset API ===
  sendOtp(email) {
    this.init();
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('ບໍ່ພົບບັນຊີ Gmail/Email ນີ້ໃນລະບົບ!');
    
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
    
    const logs = getStorage('otp_logs', []);
    const newLog = {
      id: 'OTP_' + Date.now(),
      email: email,
      otp: otp,
      expiresAt: expiresAt,
      verified: false,
      createdAt: new Date().toISOString()
    };
    logs.push(newLog);
    setStorage('otp_logs', logs);
    this.addAuditLog('send_otp', `ສົ່ງລະຫັດ OTP ໄປຫາ ${email} (ລະຫັດ: ${otp} - ສໍາລັບການຈຳລອງ)`, 'info');
    return otp;
  },

  
  // === Customer Members management ===
  getCustomers() {
    this.init();
    const defaultCusts = [
      { id: 'CUST10001', name: 'ທ້າວ ບຸນທັນ (VIP 10%)', phone: '02055551111', discountType: 'percent', discountValue: 10, tier: 'VIP', createdDate: '2026-06-30T01:26:37' },
      { id: 'CUST10002', name: 'ນາງ ນາລີ (ສ່ວນຫຼຸດ 20k)', phone: '02055552222', discountType: 'fixed', discountValue: 20000, tier: 'Regular', createdDate: '2026-06-30T01:26:37' },
      { id: 'CUST10003', name: 'ທ້າວ ແກ້ວ (Regular 5%)', phone: '02055553333', discountType: 'percent', discountValue: 5, tier: 'Regular', createdDate: '2026-06-30T01:26:37' }
    ];
    return getStorage('customers', defaultCusts);
  },
  saveCustomers(customers) {
    setStorage('customers', customers);
    // triggerDbUpdate(); // Comment out undefined function to avoid ReferenceError
  },
  addCustomer(c) {
    const list = this.getCustomers();
    const nextSeq = list.length > 0 
      ? Math.max(...list.map(x => parseInt(x.id.slice(4)) || 10000)) + 1 
      : 10001;
    const newCust = {
      id: 'CUST' + nextSeq,
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      discountType: c.discountType || 'percent',
      discountValue: Number(c.discountValue || 0),
      tier: c.tier || 'Regular',
      createdDate: new Date().toISOString()
    };
    list.push(newCust);
    this.saveCustomers(list);
    return newCust;
  },
  updateCustomer(id, data) {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...data,
        discountValue: Number(data.discountValue ?? list[idx].discountValue)
      };
      this.saveCustomers(list);
    }
  },
  deleteCustomer(id) {
    const list = this.getCustomers();
    const filtered = list.filter(c => c.id !== id);
    this.saveCustomers(filtered);
  },

  // === Expense Categories management ===
  getExpenseCategories() {
    let cats = localStorage.getItem('expense_categories');
    if (!cats) {
      const defaultCats = [
        { id: 'food', name: '🍱 ຄ່າກັບເຂົ້າ (Food)', rawName: 'ຄ່າກັບເຂົ້າ' },
        { id: 'water', name: '💧 ຄ່ານ້ຳປະປາ (Water)', rawName: 'ຄ່ານ້ຳປະປາ' },
        { id: 'electricity', name: '⚡ ຄ່າໄຟຟ້າ (Electricity)', rawName: 'ຄ່າໄຟຟ້າ' },
        { id: 'tax', name: '📄 ຄ່າພາສີ/ອາກອນ (Taxes)', rawName: 'ຄ່າພາສີ/ອາກອນ' },
        { id: 'other', name: '⚙️ ອື່ນໆ (Other)', rawName: 'ອື່ນໆ' }
      ];
      localStorage.setItem('expense_categories', JSON.stringify(defaultCats));
      return defaultCats;
    }
    return JSON.parse(cats);
  },
  saveExpenseCategories(categories) {
    localStorage.setItem('expense_categories', JSON.stringify(categories));
  },
  getOrderPayments() {
    this.init();
    let payments = localStorage.getItem('order_payments');
    if (!payments) {
      return [];
    }
    return JSON.parse(payments);
  },
  saveOrderPayments(payments) {
    localStorage.setItem('order_payments', JSON.stringify(payments));
  },
  addOrderPayment(paymentData) {
    const payments = this.getOrderPayments();
    const newPayment = {
      payment_id: payments.length + 1,
      order_id: paymentData.order_id,
      amount_paid: Number(paymentData.amount_paid),
      payment_stage: paymentData.payment_stage, // 'DEPOSIT' or 'FINAL'
      payment_method: paymentData.payment_method, // 'Cash' | 'BCEL One' | 'Split'
      date: new Date().toISOString(),
      payCurrency: paymentData.payCurrency || 'LAK',
      cashReceived: Number(paymentData.cashReceived || 0),
      transferAmount: Number(paymentData.transferAmount || 0),
      change: Number(paymentData.change || 0),
      currencyCashReceived: Number(paymentData.currencyCashReceived || 0),
      currencyChange: Number(paymentData.currencyChange || 0)
    };
    payments.push(newPayment);
    this.saveOrderPayments(payments);
    return newPayment;
  },

  // === ONLINE SHOP & ORDERS API ===
  getOnlineOrders() {
    this.init();
    return getStorage('online_orders', []);
  },
  saveOnlineOrders(orders) {
    setStorage('online_orders', orders);
  },
  addOnlineOrder(orderData) {
    const orders = this.getOnlineOrders();
    const newSeq = orders.length + 10001;
    const newOrder = {
      ...orderData,
      id: 'ONL-' + String(newSeq).padStart(6, '0'),
      date: new Date().toISOString(),
      paymentStatus: orderData.paymentStatus || 'unpaid',
      shippingStatus: orderData.shippingStatus || 'pending',
      timeline: [
        { status: 'ສ້າງອໍເດີ້', date: new Date().toISOString(), note: 'ລູກຄ້າສັ່ງຊື້ສິນຄ້າຜ່ານເວັບໄຊອອນລາຍ' }
      ]
    };
    orders.push(newOrder);
    this.saveOnlineOrders(orders);
    
    this.sendNotification(`🛒 *ມີອໍເດີ້ອອນລາຍໃໝ່!*\n` +
                          `🧾 *ເລກທີ:* ${newOrder.id}\n` +
                          `👤 *ລູກຄ້າ:* ${newOrder.customerName} (${newOrder.customerPhone})\n` +
                          `💰 *ຍອດລວມ:* ${newOrder.total.toLocaleString()} LAK`);
                          
    return newOrder;
  },
  updateOnlineOrderStatus(id, paymentStatus, shippingStatus, shippingInfo = {}) {
    const orders = this.getOnlineOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const order = orders[idx];
      const prevPaymentStatus = order.paymentStatus;
      const prevShippingStatus = order.shippingStatus;
      
      order.paymentStatus = paymentStatus || order.paymentStatus;
      order.shippingStatus = shippingStatus || order.shippingStatus;
      
      if (shippingInfo.shippingCompany) order.shippingCompany = shippingInfo.shippingCompany;
      if (shippingInfo.trackingNumber) order.trackingNumber = shippingInfo.trackingNumber;
      if (shippingInfo.shippingImage) order.shippingImage = shippingInfo.shippingImage;
      if (shippingInfo.notes) order.notes = shippingInfo.notes;

      const note = shippingInfo.statusNote || 'ອັບເດດສະຖານະໂດຍລະບົບ';
      order.timeline.push({
        status: `ຊຳລະ: ${order.paymentStatus} / ສົ່ງ: ${order.shippingStatus}`,
        date: new Date().toISOString(),
        note: note
      });

      if (paymentStatus === 'paid' && prevPaymentStatus !== 'paid') {
        const products = this.getProducts();
        order.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod && !this.isServiceCategory(prod.category)) {
            prod.stock = Math.max(0, prod.stock - item.qty);
          }
        });
        this.saveProducts(products);
        
        // Also update customer spend & tier if they are linked
        if (order.customerId) {
          this.updateCustomerSpend(order.customerId, order.total);
        }
      }
      
      if (shippingStatus === 'cancelled' && prevShippingStatus !== 'cancelled' && order.paymentStatus === 'paid') {
        const products = this.getProducts();
        order.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod && !this.isServiceCategory(prod.category)) {
            prod.stock = prod.stock + item.qty;
          }
        });
        this.saveProducts(products);
      }

      this.saveOnlineOrders(orders);
      
      this.sendNotification(`📦 *ອັບເດດອໍເດີ້ ${order.id}!*\n` +
                            `💳 *ສະຖານະຊຳລະ:* ${order.paymentStatus}\n` +
                            `🚚 *ສະຖານະຂົນສົ່ງ:* ${order.shippingStatus}`);
      
      return order;
    }
    return null;
  },
  registerOnlineCustomer(name, phone, password, addressData = null, email = '') {
    const list = this.getCustomers();
    const existingIdx = list.findIndex(c => c.phone === phone);
    const addresses = addressData ? [{ ...addressData, isDefault: true }] : [];
    if (existingIdx !== -1) {
      list[existingIdx].password = password;
      list[existingIdx].name = name || list[existingIdx].name;
      if (email) list[existingIdx].email = email;
      if (addressData) {
        list[existingIdx].addresses = addresses;
      }
      this.saveCustomers(list);
      return list[existingIdx];
    } else {
      const newCust = this.addCustomer({
        name,
        phone,
        email,
        discountType: 'percent',
        discountValue: 2,
        tier: 'Bronze',
        addresses: addresses
      });
      
      const updatedList = this.getCustomers();
      const newIdx = updatedList.findIndex(c => c.id === newCust.id);
      if (newIdx !== -1) {
        updatedList[newIdx].password = password;
        updatedList[newIdx].totalSpend = 0;
        updatedList[newIdx].addresses = addresses;
        this.saveCustomers(updatedList);
        return updatedList[newIdx];
      }
      return newCust;
    }
  },

  // Merge customers with data from online_orders (auto-populate missing customers)
  getCustomersWithOnlineData() {
    const customers = this.getCustomers();
    const onlineOrders = getStorage('online_orders', []);

    // Build map of existing customers by ID and phone
    const custById = {};
    const custByPhone = {};
    customers.forEach(c => {
      custById[c.id] = c;
      if (c.phone) custByPhone[c.phone] = c;
    });

    // Enrich existing customers with shippingAddress from online orders if missing
    onlineOrders.forEach(order => {
      const id = order.customerId;
      const phone = order.customerPhone;
      let cust = id ? custById[id] : (phone ? custByPhone[phone] : null);
      if (cust) {
        // Enrich address if customer has none
        if ((!cust.addresses || cust.addresses.length === 0) && order.shippingAddress) {
          cust.addresses = [{ ...order.shippingAddress, isDefault: true }];
        }
        // Enrich email from order if missing
        if (!cust.email && order.customerEmail) {
          cust.email = order.customerEmail;
        }
      } else if (id && phone) {
        // Customer in orders but not in customers list — create a ghost record
        const ghost = {
          id: id,
          name: order.customerName || phone,
          phone: phone,
          email: order.customerEmail || '',
          discountType: 'percent',
          discountValue: 0,
          tier: 'Bronze',
          createdDate: order.date || new Date().toISOString(),
          addresses: order.shippingAddress ? [{ ...order.shippingAddress, isDefault: true }] : [],
          isOnlineOnly: true
        };
        custById[id] = ghost;
        if (phone) custByPhone[phone] = ghost;
      }
    });

    return Object.values(custById);
  },
  saveCustomerAddresses(customerId, addresses) {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === customerId);
    if (idx !== -1) {
      list[idx].addresses = addresses;
      this.saveCustomers(list);
      
      // Update session if needed
      const saved = localStorage.getItem('online_customer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === customerId) {
          localStorage.setItem('online_customer', JSON.stringify(list[idx]));
        }
      }
      return list[idx];
    }
    return null;
  },
  authenticateOnlineCustomer(phone, password) {
    const list = this.getCustomers();
    const customer = list.find(c => c.phone === phone && c.password === password);
    if (!customer) {
      throw new Error('ເບີໂທ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!');
    }
    return customer;
  },
  updateCustomerSpend(customerId, amount) {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === customerId);
    if (idx !== -1) {
      const currentSpend = Number(list[idx].totalSpend || 0) + Number(amount);
      list[idx].totalSpend = currentSpend;
      
      let newTier = 'Bronze';
      let discountVal = 2;
      if (currentSpend >= 10000000) {
        newTier = 'VIP';
        discountVal = 10;
      } else if (currentSpend >= 5000000) {
        newTier = 'Gold';
        discountVal = 8;
      } else if (currentSpend >= 1000000) {
        newTier = 'Silver';
        discountVal = 5;
      }
      
      list[idx].tier = newTier;
      list[idx].discountType = 'percent';
      list[idx].discountValue = discountVal;
      
      this.saveCustomers(list);
    }
  }
};
