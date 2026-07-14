import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { createPermissionChecker } from '../utils/permissions';
import Portal from './Portal';

const SUB_PERMS = {
  pos: [
    { key: 'posCheckout', label: '💵 ຢືນຢັນການຊຳລະ (Checkout)' },
    { key: 'posDiscount', label: '🏷️ ໃຫ້ສ່ວນຫຼຸດ (Discount)' },
    { key: 'posChangePrice', label: '✏️ ປ່ຽນລາຄາ (Change Price)' },
    { key: 'posDeleteOrder', label: '🗑️ ລຶບລາຍການ/ຄິວ (Delete Order)' },
    { key: 'posOpenDrawer', label: '🔌 ໄຂປ໋ອງເງິນ (Open Drawer)' },
    { key: 'posDeposit', label: '💸 ຮັບເງິນມັດຈຳ (Deposit)' }
  ],
  framing: [
    { key: 'framingView', label: '👁️ ເບິ່ງງານອັດກອບ (View Framing Jobs)' },
    { key: 'framingUpdateStatus', label: '⚙️ ປ່ຽນສະຖານະ (Update Job Status)' },
    { key: 'framingEditJob', label: '✏️ ແກ້ໄຂລາຍລະອຽດ (Edit Job Specs)' },
    { key: 'framingNotifyCustomer', label: '🔔 ແຈ້ງເຕືອນລູກຄ້າ (Notify Customer)' },
    { key: 'framingPrintJob', label: '🖨️ ພິມສະຕິກເກີ (Print Stickers)' },
    { key: 'framingCollectPayment', label: '💵 ຮັບເງິນໜ້າຮ້ານ (Collect Payments)' }
  ],
  inventory: [
    { key: 'inventoryViewCost', label: '👁️ ເບິ່ງຕົ້ນທຶນ (View Cost)' },
    { key: 'inventoryAddProduct', label: '➕ ເພີ່ມສິນຄ້າ (Add Product)' },
    { key: 'inventoryEditProduct', label: '✏️ ແກ້ໄຂສິນຄ້າ (Edit Product)' },
    { key: 'inventoryDeleteProduct', label: '🗑️ ລຶບສິນຄ້າ (Delete Product)' },
    { key: 'inventoryAddStock', label: '📈 ເພີ່ມສະຕັອກ (Add Stock)' },
    { key: 'inventoryDeleteStock', label: '📉 ຫຼຸດສະຕັອກ (Decrease Stock)' }
  ],
  hrm: [
    { key: 'hrmView', label: '👁️ ເບິ່ງພະນັກງານ (View Employees)' },
    { key: 'hrmAddUser', label: '➕ ເພີ່ມພະນັກງານ (Add Employee)' },
    { key: 'hrmEditUser', label: '✏️ ແກ້ໄຂພະນັກງານ (Edit Employee)' },
    { key: 'hrmDeleteUser', label: '🗑️ ລຶບພະນັກງານ (Delete Employee)' },
    { key: 'hrmPayroll', label: '💵 ຄິດໄລ່ເງິນເດືອນ (Payroll)' }
  ],
  customers: [
    { key: 'membersAdd', label: '➕ ເພີ່ມສະມາຊິກ (Add Member)' },
    { key: 'membersEdit', label: '✏️ ແກ້ໄຂສະມາຊິກ (Edit Member)' },
    { key: 'membersDelete', label: '🗑️ ລຶບສະມາຊິກ (Delete Member)' }
  ],
  debts: [
    { key: 'debtsCollect', label: '💵 ຮັບຊຳລະໜີ້ (Collect Debts)' },
    { key: 'debtsAddDebt', label: '➕ ສ້າງໜີ້ໃໝ່ (Add Debt)' },
    { key: 'debtsDelete', label: '🗑️ ລຶບປະຫວັດໜີ້ (Delete Debts)' }
  ],
  reports: [
    { key: 'reportsRevenue', label: '📊 ເບິ່ງຍອດຂາຍ (Revenue View)' },
    { key: 'reportsProfit', label: '📈 ເບິ່ງກຳໄລ (Profit View)' },
    { key: 'reportsExport', label: '📥 ດາວໂຫຼດລາຍງານ (Export)' }
  ],
  ai: [
    { key: 'aiChat', label: '💬 ແຊັດກັບ AI (AI Chat)' },
    { key: 'aiAnalyze', label: '🔍 AI ກວດສອບບິນ (AI Audit)' },
    { key: 'aiCctv', label: '📹 ກ້ອງວົງຈອນປິດ (CCTV)' }
  ],
  settings: [
    { key: 'settingsShopInfo', label: '🏪 ຂໍ້ມູນຮ້ານ & ບັນຊີ (Shop Info/Bank)' },
    { key: 'settingsReceipt', label: '🖨️ ຮູບແບບໃບບິນ (Receipt Design)' },
    { key: 'settingsBarcode', label: '🔌 ບາໂຄດ & ສະແກນ (Barcode/Scanner)' },
    { key: 'settingsTheme', label: '🎨 ສີ & ຄວາມໂຄ້ງ (Theme/Borders)' },
    { key: 'settingsLabels', label: '📝 ປັບແຕ່ງພາສາ (Translate Labels)' },
    { key: 'settingsNotifications', label: '🔔 ແຈ້ງເຕືອນໂທລະສັບ (Phone Alerts)' },
    { key: 'settingsRules', label: '⚙️ ກົດລະບຽບ (Rules)' },
    { key: 'settingsPromotions', label: '🏷️ ໂປຣໂມຊັ່ນ (Coupons)' },
    { key: 'settingsFraming', label: '🛠️ ຕົວເລືອກງານເລ່ຽມ (Framing Options)' },
    { key: 'settingsExpenses', label: '💸 ປະເພດລາຍຈ່າຍ (Expense Categories)' },
    { key: 'settingsTracking', label: '🔍 ຕິດຕາມພຣະ (Amulet Tracking)' },
    { key: 'settingsBackup', label: '🧹 ການຈັດການຂໍ້ມູນ & ແບັກອັບ (Data Retention/Backup)' },
    { key: 'settingsOnlineShop', label: '🌐 ຕັ້ງຄ່າຮ້ານອອນລາຍ (Online Shop)' },
    { key: 'settingsSystem', label: '⚠️ ຄວບຄຸມລະບົບ (System Control)' },
    { key: 'settingsProductionTools', label: '⚙️ ເຄື່ອງມືລະບົບ (Production Tools)' }
  ]
};


export default function HRM({ activeUser, onUpdate }) {
  const hasHrmPermission = createPermissionChecker(activeUser);
  const [activeSubTab, setActiveSubTab] = useState('employees'); // employees | shifts | attendance | leaves | payroll
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Consolidated states from Settings
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    passcode: '',
    role: 'cashier',
    payType: 'daily',
    baseWage: 80000,
    otRate: 15000,
    avatar: '',
    permissions: {
      admin: false,
      dashboard: false,
      pos: false,
      posZoneA: false,
      posZoneB: false,
      framing: false,
      inventory: false,
      inventoryViewCost: false,
      inventoryAddProduct: false,
      inventoryEditProduct: false,
      inventoryDeleteProduct: false,
      inventoryAddStock: false,
      inventoryDeleteStock: false,
      hrm: false,
      reports: false,
      debts: false,
      ai: false,
      settings: false
    }
  });

  // Shifts state
  const [shifts, setShifts] = useState([]);
  const [shiftForm, setShiftForm] = useState({ userId: '', dayOfWeek: '1', startTime: '08:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' });

  // Attendance states from Settings
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [showManualLogModal, setShowManualLogModal] = useState(false);
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [selectedLogEntry, setSelectedLogEntry] = useState(null);
  const [manualLogFormData, setManualLogFormData] = useState({
    userId: '',
    date: new Date().toLocaleDateString('en-CA'),
    clockIn: '08:00',
    clockOut: '17:00',
    status: 'present',
    payout: ''
  });

  // Leaves state
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ userId: '', leaveType: 'sick', startDate: '', endDate: '', reason: '' });

  // Payroll states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrolls, setPayrolls] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // 80mm Payroll printing states
  const [selectedPayrollUser, setSelectedPayrollUser] = useState(null);
  const [showPayrollPrintModal, setShowPayrollPrintModal] = useState(false);

  // Settings state (to read receipt margins, shop details etc.)
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadHRMData();
  }, [selectedMonth, activeSubTab]);

  function loadHRMData() {
    const uList = db.getUsers();
    setUsers(uList);
    setShifts(db.getShifts());
    setLeaves(db.getLeaves());
    setAttendanceLogs(db.getAttendance());
    setSettings(db.getSettings());

    // Calculate payroll for all non-owner employees for the selected month
    const list = [];
    uList.forEach(u => {
      if (u.role !== 'owner') {
        const calculated = db.calculatePayrollForUser(u.id, selectedMonth);
        if (calculated) {
          // Check if already paid
          const paidRecords = db.getPayrolls();
          const paid = paidRecords.find(p => p.userId === u.id && p.month === selectedMonth);
          if (paid) {
            list.push(paid);
          } else {
            list.push(calculated);
          }
        }
      }
    });
    setPayrolls(list);
  };

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const getWorkdaysInMonthToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const dayOfMonth = today.getDate();
    
    const workdays = [];
    for (let d = 1; d <= dayOfMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() !== 0) { // Exclude Sunday
        workdays.push(date.toLocaleDateString('en-CA'));
      }
    }
    return workdays;
  };

  // Employee Profile Handlers
  const handleEditUserClick = (user) => {
    if (!hasHrmPermission('hrmEditUser')) {
      alert('🔒 ທ່ານບໍ່ມີສິດໃນການແກ້ໄຂພະນັກງານ!');
      return;
    }
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      passcode: user.passcode,
      role: user.role,
      payType: user.payType || (user.role === 'cashier' ? 'monthly' : 'daily'),
      baseWage: user.baseWage !== undefined ? user.baseWage : (user.role === 'owner' ? 150000 : user.role === 'cashier' ? 2400000 : 100000),
      otRate: user.otRate !== undefined ? user.otRate : (user.role === 'owner' ? 25000 : user.role === 'cashier' ? 15000 : 20000),
      avatar: user.avatar || '',
      permissions: user.permissions || {
        admin: user.role === 'owner',
        dashboard: user.role === 'owner',
        pos: user.role === 'owner' || user.role === 'cashier',
        posZoneA: user.role === 'owner' || user.role === 'cashier',
        posZoneB: user.role === 'owner' || user.role === 'cashier',
        framing: user.role === 'owner' || user.role === 'technician',
        inventory: user.role === 'owner',
        hrm: user.role === 'owner',
        reports: user.role === 'owner',
        debts: user.role === 'owner' || user.role === 'cashier',
        ai: user.role !== 'cashier',
        settings: user.role === 'owner'
      }
    });
  };

  const handleUserSave = (e) => {
    e.preventDefault();
    let updatedActiveUser = null;
    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        const updated = {
          ...u,
          name: userFormData.name,
          email: userFormData.email,
          password: userFormData.password,
          passcode: userFormData.passcode,
          role: userFormData.role,
          roleName: userFormData.role === 'owner' ? 'ເຈົ້າຂອງຮ້ານ (Owner)' : userFormData.role === 'cashier' ? 'ພະນັກງານຂາຍ (Cashier)' : 'ຊ່າງອັດກອບ (Technician)',
          payType: userFormData.payType,
          baseWage: Number(userFormData.baseWage),
          otRate: Number(userFormData.otRate),
          avatar: userFormData.avatar || '',
          permissions: userFormData.permissions || {
            admin: userFormData.role === 'owner',
            dashboard: userFormData.role === 'owner',
            pos: userFormData.role === 'owner' || userFormData.role === 'cashier',
            posZoneA: userFormData.role === 'owner' || userFormData.role === 'cashier',
            posZoneB: userFormData.role === 'owner' || userFormData.role === 'cashier',
            framing: userFormData.role === 'owner' || userFormData.role === 'technician',
            inventory: userFormData.role === 'owner',
            hrm: userFormData.role === 'owner',
            reports: userFormData.role === 'owner',
            debts: userFormData.role === 'owner' || userFormData.role === 'cashier',
            ai: userFormData.role !== 'cashier',
            settings: userFormData.role === 'owner'
          }
        };
        if (u.id === activeUser.id) {
          updatedActiveUser = updated;
        }
        return updated;
      }
      return u;
    });

    db.saveUsers(updatedUsers);
    if (updatedActiveUser) {
      db.setActiveUser(updatedActiveUser);
    }
    setUsers(updatedUsers);
    setEditingUser(null);
    showNotification('✓ ອັບເດດຂໍ້ມູນພະนັກງານສຳເລັດ!');
    if (onUpdate) onUpdate();
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    db.addUser({
      ...userFormData,
      baseWage: Number(userFormData.baseWage),
      otRate: Number(userFormData.otRate)
    });
    setShowAddUserModal(false);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      passcode: '',
      role: 'cashier',
      payType: 'daily',
      baseWage: 80000,
      otRate: 15000,
      avatar: '',
      permissions: {
        admin: false,
        dashboard: false,
        pos: false,
        posZoneA: false,
        posZoneB: false,
        framing: false,
        inventory: false,
        hrm: false,
        reports: false,
        debts: false,
        ai: false,
        settings: false
      }
    });
    showNotification('✓ ເພີ່ມພະນັກງານໃໝ່ສຳເລັດ!');
    loadHRMData();
    if (onUpdate) onUpdate();
  };

  const handleDeleteUser = (id, name) => {
    if (!hasHrmPermission('hrmDeleteUser')) {
      alert('🔒 ທ່ານບໍ່ມີສິດໃນການລຶບພະນັກງານ!');
      return;
    }
    if (id === 'owner') {
      showNotification('ຂໍອະໄພ: ບໍ່ສາມາດລຶບບັນຊີເຈົ້າຂອງຮ້ານຫຼັກໄດ້!', true);
      return;
    }
    if (window.confirm(`ຕ້ອງການລຶບບັນຊີພະນັກງານ: ${name} ຫຼື ບໍ່?`)) {
      db.deleteUser(id);
      showNotification('✓ ລຶບພະນັກງານສຳເລັດ!');
      loadHRMData();
      if (onUpdate) onUpdate();
    }
  };

  // Shift Management Handlers
  const handleSaveShift = (e) => {
    e.preventDefault();
    if (!shiftForm.userId) {
      showNotification('ກະລຸນາເລືອກພະນັກງານ', true);
      return;
    }
    const currentShifts = db.getShifts();
    const newShift = {
      id: 'SHF_' + Date.now(),
      userId: shiftForm.userId,
      userName: users.find(u => u.id === shiftForm.userId)?.name || '',
      dayOfWeek: parseInt(shiftForm.dayOfWeek),
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      breakStartTime: shiftForm.breakStartTime,
      breakEndTime: shiftForm.breakEndTime
    };
    
    // Check if shift already exists for this day, update or append
    const existingIdx = currentShifts.findIndex(s => s.userId === newShift.userId && s.dayOfWeek === newShift.dayOfWeek);
    if (existingIdx !== -1) {
      currentShifts[existingIdx] = newShift;
    } else {
      currentShifts.push(newShift);
    }
    
    db.saveShifts(currentShifts);
    showNotification('✓ ບັນທຶກຕາຕະລາງກະການເຮັດວຽກສຳເລັດ!');
    setShiftForm({ userId: '', dayOfWeek: '1', startTime: '08:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' });
    loadHRMData();
  };

  const handleDeleteShift = (id) => {
    if (window.confirm('ຕ້ອງການລຶບຕາຕະລາງກະການເຮັດວຽກນີ້ແມ່ນບໍ່?')) {
      const currentShifts = db.getShifts().filter(s => s.id !== id);
      db.saveShifts(currentShifts);
      showNotification('✓ ລຶບຕາຕະລາງກະການເຮັດວຽກສຳເລັດ!');
      loadHRMData();
    }
  };

  // Leave Management Handlers
  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!leaveForm.userId) {
      showNotification('ກະລຸນາເລືອກພະນັກງານ', true);
      return;
    }
    if (!leaveForm.startDate || !leaveForm.endDate) {
      showNotification('ກະລຸນາເລືອກວັນທີເລີ່ມຕົ້ນ ແລະ ສິ້ນສຸດ', true);
      return;
    }
    db.addLeave({
      userId: leaveForm.userId,
      userName: users.find(u => u.id === leaveForm.userId)?.name || '',
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason
    });
    showNotification('✓ ສົ່ງຄຳຂໍລາພັກສຳເລັດແລ້ວ! ລໍຖ້າການອະນຸມັດ');
    setLeaveForm({ userId: '', leaveType: 'sick', startDate: '', endDate: '', reason: '' });
    loadHRMData();
  };

  const handleApproveLeave = (id, status) => {
    db.approveLeave(id, status, activeUser);
    showNotification(`✓ ${status === 'approved' ? 'ອະນຸມັດ' : 'ປະຕິເສດ'} ຄຳຂໍລາພັກສຳເລັດ!`);
    loadHRMData();
  };

  // Payroll Management Handlers
  const handlePayout = (payData) => {
    if (window.confirm(`ຢືນຢັນການຈ່າຍເງິນເດືອນໃຫ້ ${payData.userName} ປະຈຳເດືອນ ${payData.month} ຈຳນວນ ${(payData.netPay).toLocaleString()} ₭?`)) {
      db.payoutPayroll(payData);
      showNotification(`✓ จ່າຍເງິນເດືອນໃຫ້ ${payData.userName} ສຳເລັດແລ້ວ!`);
      loadHRMData();
      if (onUpdate) onUpdate();
    }
  };

  const handlePrintPayslip = (p) => {
    setSelectedPayslip(p);
    setShowPayslipModal(true);
  };

  const handlePrintPayrollClick = (payrollRecord) => {
    const user = users.find(u => u.id === payrollRecord.userId);
    if (!user) return;
    
    // Get month logs
    const userLogs = attendanceLogs.filter(l => l.userId === user.id && l.date.startsWith(payrollRecord.month));
    const totalDays = userLogs.filter(l => l.status === 'present' || l.status === 'late').length;
    const totalHours = userLogs.reduce((sum, l) => sum + (l.workHours || 0), 0);
    const totalOtHours = userLogs.reduce((sum, l) => sum + (l.otHours || 0), 0);
    const totalPayout = payrollRecord.netPay;

    setSelectedPayrollUser({
      user,
      month: payrollRecord.month,
      totalDays,
      totalHours,
      totalOtHours,
      totalPayout
    });
    setShowPayrollPrintModal(true);
  };

  // Manual Attendance Logging Handlers
  const handleOpenManualLogAdd = () => {
    const defaultUser = users[0];
    setManualLogFormData({
      userId: defaultUser ? defaultUser.id : '',
      date: new Date().toLocaleDateString('en-CA'),
      clockIn: '08:00',
      clockOut: '17:00',
      status: 'present',
      payout: ''
    });
    setShowManualLogModal(true);
  };

  const handleManualLogSubmit = (e) => {
    e.preventDefault();
    const logs = db.getAttendance();
    const user = users.find(u => u.id === manualLogFormData.userId);
    if (!user) return;
    
    if (logs.some(l => l.userId === user.id && l.date === manualLogFormData.date)) {
      alert('ຂໍອະໄພ: ພະນັກງານຄົນນີ້ມີບັນທຶກການເຂົ້າງານໃນວັນທີນີ້ແລ້ວ!');
      return;
    }

    const isAbsent = manualLogFormData.status === 'absent';
    const clockInDate = isAbsent ? null : new Date(`${manualLogFormData.date}T${manualLogFormData.clockIn || '08:00'}:00`);
    const clockOutDate = isAbsent ? null : new Date(`${manualLogFormData.date}T${manualLogFormData.clockOut || '17:00'}:00`);
    
    const diffMs = (clockOutDate && clockInDate) ? clockOutDate - clockInDate : 0;
    const hours = Math.max(0, diffMs / (1000 * 60 * 60));
    
    const payType = user.payType || (user.role === 'cashier' ? 'monthly' : 'daily');
    const baseWage = user.baseWage !== undefined ? user.baseWage : (user.role === 'owner' ? 150000 : user.role === 'cashier' ? 2400000 : 100000);
    const otRate = user.otRate !== undefined ? user.otRate : (user.role === 'owner' ? 25000 : user.role === 'cashier' ? 15000 : 20000);
    const dailyWage = payType === 'monthly' ? Math.round(baseWage / 26) : baseWage;

    const standardWorkHours = 8;
    const workedPercent = isAbsent ? 0 : Math.min(100, Math.round((hours / standardWorkHours) * 100));
    const otHours = isAbsent ? 0 : Math.max(0, hours - standardWorkHours);

    let payout = manualLogFormData.payout !== '' ? Number(manualLogFormData.payout) : 0;
    if (manualLogFormData.payout === '') {
      if (isAbsent) {
        payout = 0;
      } else {
        const basePayout = (workedPercent / 100) * dailyWage;
        const otPayout = otHours * otRate;
        payout = Math.round(basePayout + otPayout);
      }
    }

    const newLog = {
      id: 'ATT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      date: manualLogFormData.date,
      clockIn: clockInDate ? clockInDate.toISOString() : null,
      clockOut: clockOutDate ? clockOutDate.toISOString() : null,
      workHours: parseFloat(hours.toFixed(2)),
      workedPercent,
      otHours: parseFloat(otHours.toFixed(2)),
      payout,
      status: manualLogFormData.status
    };

    const updated = [newLog, ...logs];
    db.saveAttendance(updated);
    setShowManualLogModal(false);
    setManualLogFormData({
      userId: '',
      date: new Date().toLocaleDateString('en-CA'),
      clockIn: '08:00',
      clockOut: '17:00',
      status: 'present',
      payout: ''
    });
    showNotification('✓ ເພີ່ມບັນທຶກເຂົ້າງານດ້ວຍມືສຳເລັດ!');
    loadHRMData();
    if (onUpdate) onUpdate();
  };

  const handleEditLogClick = (log) => {
    setSelectedLogEntry(log);
    const inTime = log.clockIn ? new Date(log.clockIn).toTimeString().slice(0, 5) : '08:00';
    const outTime = log.clockOut ? new Date(log.clockOut).toTimeString().slice(0, 5) : '17:00';
    
    setManualLogFormData({
      userId: log.userId,
      date: log.date,
      clockIn: inTime,
      clockOut: outTime,
      status: log.status,
      payout: log.payout
    });
    setShowEditLogModal(true);
  };

  const handleEditLogSubmit = (e) => {
    e.preventDefault();
    const logs = db.getAttendance();
    const user = users.find(u => u.id === manualLogFormData.userId);
    if (!user || !selectedLogEntry) return;

    const isAbsent = manualLogFormData.status === 'absent';
    const clockInDate = isAbsent ? null : new Date(`${manualLogFormData.date}T${manualLogFormData.clockIn || '08:00'}:00`);
    const clockOutDate = isAbsent ? null : new Date(`${manualLogFormData.date}T${manualLogFormData.clockOut || '17:00'}:00`);
    
    const diffMs = (clockOutDate && clockInDate) ? clockOutDate - clockInDate : 0;
    const hours = Math.max(0, diffMs / (1000 * 60 * 60));

    const payType = user.payType || (user.role === 'cashier' ? 'monthly' : 'daily');
    const baseWage = user.baseWage !== undefined ? user.baseWage : (user.role === 'owner' ? 150000 : user.role === 'cashier' ? 2400000 : 100000);
    const otRate = user.otRate !== undefined ? user.otRate : (user.role === 'owner' ? 25000 : user.role === 'cashier' ? 15000 : 20000);
    const dailyWage = payType === 'monthly' ? Math.round(baseWage / 26) : baseWage;

    const standardWorkHours = 8;
    const workedPercent = isAbsent ? 0 : Math.min(100, Math.round((hours / standardWorkHours) * 100));
    const otHours = isAbsent ? 0 : Math.max(0, hours - standardWorkHours);

    let payout = manualLogFormData.payout !== '' ? Number(manualLogFormData.payout) : 0;
    if (manualLogFormData.payout === '') {
      if (isAbsent) {
        payout = 0;
      } else {
        const basePayout = (workedPercent / 100) * dailyWage;
        const otPayout = otHours * otRate;
        payout = Math.round(basePayout + otPayout);
      }
    }

    const updated = logs.map(l => {
      if (l.id === selectedLogEntry.id) {
        return {
          ...l,
          date: manualLogFormData.date,
          clockIn: clockInDate ? clockInDate.toISOString() : null,
          clockOut: clockOutDate ? clockOutDate.toISOString() : null,
          workHours: parseFloat(hours.toFixed(2)),
          workedPercent,
          otHours: parseFloat(otHours.toFixed(2)),
          payout,
          status: manualLogFormData.status
        };
      }
      return l;
    });

    db.saveAttendance(updated);
    setShowEditLogModal(false);
    setSelectedLogEntry(null);
    showNotification('✓ ແກ້ໄຂບັນທຶກເຂົ້າງານສຳເລັດ!');
    loadHRMData();
    if (onUpdate) onUpdate();
  };

  const handleDeleteLog = (id) => {
    if (window.confirm('ต้องการลຶບບັນທຶກເວລາເຂົ້າງານນີ້ ຫຼື ບໍ່?')) {
      const logs = db.getAttendance();
      const updated = logs.filter(l => l.id !== id);
      db.saveAttendance(updated);
      showNotification('✓ ລຶບບັນທຶກເຂົ້າງານສຳເລັດ!');
      loadHRMData();
      if (onUpdate) onUpdate();
    }
  };

  const getDayName = (dayNum) => {
    const days = {
      0: 'ວັນອາທິດ (Sunday)',
      1: 'ວັນຈັນ (Monday)',
      2: 'ວັນອັງຄານ (Tuesday)',
      3: 'ວັນພຸດ (Wednesday)',
      4: 'ວັນພະຫັດ (Thursday)',
      5: 'ວັນສຸກ (Friday)',
      6: 'ວັນເສົາ (Saturday)'
    };
    return days[dayNum] || '';
  };

  const getLeaveTypeName = (type) => {
    const types = {
      sick: 'ລາປ່ວຍ (Sick Leave)',
      personal: 'ລາກິດ (Personal Leave)',
      vacation: 'ລາພັກຮ້ອນ (Vacation Leave)'
    };
    return types[type] || type;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      {/* HRM Top Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--gold-primary)', margin: 0, fontSize: '1.4rem' }}>{db.getLabel('title_hrm', '👥 ລະບົບຈັດການບຸກຄະລາກອນ & ເງິນເດືອນ (HRM)')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0' }}>
            {db.getLabel('hrm_sub_desc', 'ຈັດການບັນຊີພະນັກງານ, ຕາຕະລາງກະເຮັດວຽກ, ລະບົບເຂົ້າງານ, ການຂໍລາພັກ ແລະ ບັນຊີເງິນເດືອນ.')}
          </p>
        </div>

        {/* Sub-tab Selectors */}
        <div className="nav-tabs" style={{ margin: 0, border: 'none' }}>
          {hasHrmPermission('hrmView') && (
          <button
            type="button"
            className={`nav-tab ${activeSubTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('employees')}
          >
            {db.getLabel('hrm_tab_employees', '👥 ພະນັກງານ')}
          </button>
          )}
          <button
            type="button"
            className={`nav-tab ${activeSubTab === 'shifts' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('shifts')}
          >
            {db.getLabel('hrm_tab_shifts', '📅 ຕາຕະລາງກະ')}
          </button>
          <button
            type="button"
            className={`nav-tab ${activeSubTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('attendance')}
          >
            {db.getLabel('hrm_tab_attendance', '🕒 ລະບົບເຂົ້າງານ')}
          </button>
          <button
            type="button"
            className={`nav-tab ${activeSubTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('leaves')}
          >
            {db.getLabel('hrm_tab_leaves', '📝 ການລາພັກ')}
          </button>
          {hasHrmPermission('hrmPayroll') && (
          <button
            type="button"
            className={`nav-tab ${activeSubTab === 'payroll' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('payroll')}
          >
            {db.getLabel('hrm_tab_payroll', '💵 ບັນຊີເງິນເດືອນ')}
          </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success-green)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(46, 204, 113, 0.2)', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--alert-red)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(231, 76, 60, 0.2)', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {/* SUB TAB: EMPLOYEES */}
      {activeSubTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
              👥 ຈັດການບັນຊີ ແລະ ລະຫັດຜ່ານຂອງພະນັກງານ
            </h3>
            {hasHrmPermission('hrmAddUser') && (
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddUserModal(true)}>
              ➕ ເພີ່ມພະນັກງານໃໝ່
            </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map(u => (
              <div
                key={u.id}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--gold-primary)', flexShrink: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>{u.role === 'owner' ? '👑' : u.role === 'cashier' ? '💵' : '🛠️'}</span>
                    )}
                  </div>
                  <div>
                    <h4 style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>
                      {u.name} <span style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', marginLeft: '8px' }}>({u.roleName?.split(' ')[0] || u.role})</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', rowGap: '4px' }}>
                      <span>Gmail / Email:</span>
                      <span style={{ color: 'white' }}>{u.email}</span>
                      <span>ລະຫັດ PIN 4 ຫຼັກ:</span>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>{u.passcode}</span>
                      <span>ລະຫັດຜ່ານ (Pass):</span>
                      <span style={{ fontFamily: 'monospace' }}>{u.password}</span>
                      <span>ຮູບແບບການຈ່າຍ:</span>
                      <span style={{ color: 'white' }}>{u.payType === 'monthly' ? 'ເງິນເດືອນລາຍເດືອນ (Monthly)' : 'ຄ່າຈ້າງລາຍວັນ (Daily)'}</span>
                      <span>ຄ່າຈ້າງ / ເງິນເດືອນ:</span>
                      <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>{(u.baseWage || 0).toLocaleString()} ກີບ {u.payType === 'monthly' ? '/ເດືອນ' : '/ວັນ'}</span>
                      <span>ຄ່າ OT (ຕໍ່ຊົ່ວໂມງ):</span>
                      <span style={{ color: 'var(--gold-primary)' }}>{(u.otRate || 0).toLocaleString()} ກີບ /ຊມ</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {hasHrmPermission('hrmEditUser') && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => handleEditUserClick(u)}
                  >
                    ✏️ ແກ້ໄຂ
                  </button>
                  )}
                  {hasHrmPermission('hrmDeleteUser') && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(231,76,60,0.1)', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    disabled={u.id === 'owner'}
                  >
                    🗑️ ລຶບ
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB: SHIFT SCHEDULER */}
      {activeSubTab === 'shifts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Shift Form */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', margin: '0 0 16px' }}>⚙️ ກໍານົດກະການເຮັດວຽກ</h3>
            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">ພະນັກງານ (Employee)</label>
                <select
                  className="form-control"
                  required
                  value={shiftForm.userId}
                  onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })}
                >
                  <option value="">-- ເລືອກພະນັກງານ --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleName?.split(' ')[0] || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ວັນເຮັດວຽກ (Day of Week)</label>
                <select
                  className="form-control"
                  required
                  value={shiftForm.dayOfWeek}
                  onChange={(e) => setShiftForm({ ...shiftForm, dayOfWeek: e.target.value })}
                >
                  <option value="1">ວັນຈັນ (Monday)</option>
                  <option value="2">ວັນອັງຄານ (Tuesday)</option>
                  <option value="3">ວັນພຸດ (Wednesday)</option>
                  <option value="4">ວັນພະຫັດ (Thursday)</option>
                  <option value="5">ວັນສຸກ (Friday)</option>
                  <option value="6">ວັນເສົາ (Saturday)</option>
                  <option value="0">ວັນອາທິດ (Sunday)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">ເວລາເຂົ້າງານ (Start)</label>
                  <input
                    type="time"
                    className="form-control"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ເວລາອອກງານ (End)</label>
                  <input
                    type="time"
                    className="form-control"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">ເລີ່ມພັກທ່ຽງ (Break Start)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={shiftForm.breakStartTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakStartTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ສິ້ນສຸດພັກທ່ຽງ (Break End)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={shiftForm.breakEndTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakEndTime: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '10px' }}>
                💾 ບັນທຶກຕາຕະລາງກະ
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShiftForm({ userId: '', dayOfWeek: '1', startTime: '08:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' })}
                style={{ width: '100%', marginTop: '6px', padding: '8px' }}
              >
                🔄 ລ້າງຄ່າ (Reset)
              </button>
            </form>
          </div>

          {/* Shifts Calendar Grid */}
          <div className="glass-card" style={{ padding: '20px', minHeight: '400px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', margin: '0 0 16px' }}>📅 ຕາຕະລາງກະການເຮັດວຽກຂອງພະນັກງານທັງໝົດ</h3>
            {shifts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                ບໍ່ມີຂໍ້ມູນຕາຕະລາງກະການເຮັດວຽກ. ກະລຸນາສ້າງຕາຕະລາງດ້ານຊ້າຍມື.
              </div>
            ) : (
              <>
              <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ພະນັກງານ</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ວັນເຮັດວຽກ</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>ເວລາເຂົ້າ-ອອກງານ</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>ເວລາພັກທ່ຽງ</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.userName}</td>
                        <td style={{ padding: '12px', color: 'var(--gold-primary)' }}>{getDayName(s.dayOfWeek)}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>⏰ {s.startTime} - {s.endTime}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          ☕ {s.breakStartTime} - {s.breakEndTime}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                            onClick={() => handleDeleteShift(s.id)}
                          >
                            🗑️ ລຶບ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards-view">
                {shifts.map(s => (
                  <div key={s.id} className="mobile-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white' }}>{s.userName}</span>
                      <span style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>{getDayName(s.dayOfWeek)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>⏰ <span style={{ color: 'white' }}>ເວລາເຂົ້າ-ອອກ:</span> {s.startTime} - {s.endTime}</div>
                      <div>☕ <span style={{ color: 'white' }}>ພັກທ່ຽງ:</span> {s.breakStartTime} - {s.breakEndTime}</div>
                    </div>
                    <div style={{ marginTop: '10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                        onClick={() => handleDeleteShift(s.id)}
                      >
                        🗑️ ລຶບ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB: ATTENDANCE (TIMESHEETS) */}
      {activeSubTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', margin: 0 }}>
                🕒 ລະບົບເຂົ້າງານ & ບັນທຶກເວລາພະນັກງານ (Daily Attendance Timesheets)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                ຈັດການແລະເພີ່ມເວລາເຂົ້າງານ-ອອກງານ, ຄິດໄລ່ຊົ່ວໂມງ OT ຂອງແຕ່ລະວັນ.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={handleOpenManualLogAdd}
            >
              ➕ ເພີ່ມບັນທຶກເຂົ້າງານດ້ວຍມື
            </button>
          </div>

          {/* Today's Attendance & Absences Summary */}
          {(() => {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const checkedInToday = attendanceLogs.filter(l => l.date === todayStr);
            const checkedInIds = new Set(checkedInToday.map(l => l.userId));
            const absentToday = users.filter(u => !checkedInIds.has(u.id));
            const workdays = getWorkdaysInMonthToToday();

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Today's Summary */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'var(--gold-primary)', marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📅 ສະຖານະການເຂົ້າງານມື້ນີ້ ({new Date().toLocaleDateString('lo-LA')})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--success-green)', fontWeight: 'bold' }}>🟢 ເຂົ້າງານແລ້ວ ({checkedInToday.length} ຄົນ):</span>
                      {checkedInToday.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '12px', marginTop: '2px' }}>ຍັງບໍ່ມີພະນັກງານເຂົ້າງານ</p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', marginLeft: '12px' }}>
                          {checkedInToday.map(l => (
                            <span key={l.id} style={{ background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success-green)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid rgba(46,204,113,0.2)' }}>
                              {l.userName} ({l.clockIn ? new Date(l.clockIn).toLocaleTimeString('lo-LA', {hour: '2-digit', minute:'2-digit'}) : ''})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--alert-red)', fontWeight: 'bold' }}>🔴 ຂາດງານ / ຍັງບໍ່ທັນເຂົ້າງານ ({absentToday.length} ຄົນ):</span>
                      {absentToday.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '12px', marginTop: '2px' }}>ເຂົ້າງານຄົບທຸກຄົນແລ້ວ</p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', marginLeft: '12px' }}>
                          {absentToday.map(u => (
                            <span key={u.id} style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--alert-red)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid rgba(231,76,60,0.2)' }}>
                              {u.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Absences Summary */}
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: 'var(--gold-primary)', marginBottom: '12px', fontSize: '0.9rem' }}>
                    📊 ສະຫຼຸບການຂາດງານປະຈຳເດືອນ (Month Absences Ledger)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', overflowY: 'auto', maxHeight: '100px' }}>
                    {users.map(user => {
                      const userLogs = attendanceLogs.filter(l => l.userId === user.id);
                      const presentDates = new Set(userLogs.filter(l => l.status === 'present' || l.status === 'late').map(l => l.date));
                      const absentDays = workdays.filter(d => !presentDates.has(d)).length;
                      return (
                        <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: 'white' }}>{user.name}:</span>
                          <span>
                            ເຮັດວຽກ <b style={{ color: 'var(--success-green)' }}>{presentDates.size}</b> ວັນ | 
                            ຂາດງານ <b style={{ color: 'var(--alert-red)' }}>{absentDays}</b> ວັນ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Attendance logs history */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '0.95rem' }}>📅 ປະຫວັດການລົງເວລາເຂົ້າ-ອອກງານ (Attendance Timesheet Logs)</h4>
            
            <div className="desktop-table-view" style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
              <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left', position: 'sticky', top: 0, background: '#1a1815', zIndex: 1 }}>
                    <th style={{ padding: '10px' }}>ວັນທີ</th>
                    <th style={{ padding: '10px' }}>ພະນັກງານ</th>
                    <th style={{ padding: '10px' }}>ເວລາເຂົ້າງານ</th>
                    <th style={{ padding: '10px' }}>ເວລາອອກງານ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ຊົ່ວໂມງລວມ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ຊົ່ວໂມງ OT</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>ຄ່າຈ້າງວັນນີ້</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ຈັດການ</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                        ບໍ່ມີບັນທຶກການເຂົ້າງານ
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px' }}>{new Date(log.date).toLocaleDateString('lo-LA')}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.userName}</td>
                        <td style={{ padding: '10px', color: 'var(--success-green)' }}>
                          {log.clockIn ? new Date(log.clockIn).toLocaleTimeString('lo-LA') : '-'}
                        </td>
                        <td style={{ padding: '10px', color: log.clockOut ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                          {log.clockOut ? new Date(log.clockOut).toLocaleTimeString('lo-LA') : 'ກຳລັງເຮັດວຽກ...'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{log.workHours} ຊມ ({log.workedPercent}%)</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{log.otHours > 0 ? `${log.otHours} ຊມ` : '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{log.payout?.toLocaleString() || 0} ກີບ</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              onClick={() => handleEditLogClick(log)}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(231,76,60,0.1)', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                              onClick={() => handleDeleteLog(log.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards-view">
              {attendanceLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  ບໍ່ມີບັນທຶກການເຂົ້າງານ
                </div>
              ) : (
                attendanceLogs.map(log => (
                  <div key={log.id} className="mobile-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white' }}>{log.userName}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.date).toLocaleDateString('lo-LA')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '8px' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ເວລາເຂົ້າງານ</div>
                        <div style={{ color: 'var(--success-green)' }}>{log.clockIn ? new Date(log.clockIn).toLocaleTimeString('lo-LA') : '-'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ເວລາອອກງານ</div>
                        <div style={{ color: log.clockOut ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>{log.clockOut ? new Date(log.clockOut).toLocaleTimeString('lo-LA') : 'ກຳລັງເຮັດວຽກ...'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ຊົ່ວໂມງລວມ</div>
                        <div style={{ color: 'white' }}>{log.workHours} ຊມ ({log.workedPercent}%)</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ຊົ່ວໂມງ OT</div>
                        <div style={{ color: 'white' }}>{log.otHours > 0 ? `${log.otHours} ຊມ` : '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{log.payout?.toLocaleString() || 0} ກີບ</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleEditLogClick(log)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(231,76,60,0.1)', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                          onClick={() => handleDeleteLog(log.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB: LEAVES APPROVAL */}
      {activeSubTab === 'leaves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Apply Leave Request Form */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', margin: '0 0 16px' }}>📝 ສົ່ງຄຳຂໍລາພັກ (Manual Request)</h3>
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">ພະນັກງານ (Employee)</label>
                <select
                  className="form-control"
                  required
                  value={leaveForm.userId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, userId: e.target.value })}
                >
                  <option value="">-- ເລືອກພະນັກງານ --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleName?.split(' ')[0] || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ປະເພດການລາພັກ (Leave Type)</label>
                <select
                  className="form-control"
                  required
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                >
                  <option value="sick">ລາປ່ວຍ (Sick Leave)</option>
                  <option value="personal">ລາກິດ (Personal Leave)</option>
                  <option value="vacation">ລາພັກຮ້ອນ (Vacation Leave)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ວັນທີເລີ່ມຕົ້ນ (Start Date)</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ວັນທີສິ້ນສຸດ (End Date)</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ເຫດຜົນການລາ (Reason)</label>
                <textarea
                  className="form-control"
                  placeholder="ລະບຸເຫດຜົນການລາ..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '10px' }}>
                ✉️ ສົ່ງໃບລາພັກ
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setLeaveForm({ userId: '', leaveType: 'sick', startDate: '', endDate: '', reason: '' })}
                style={{ width: '100%', marginTop: '6px', padding: '8px' }}
              >
                🔄 ລ້າງຄ່າ (Reset)
              </button>
            </form>
          </div>

          {/* Leaves Ledger Table */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', margin: '0 0 16px' }}>📄 ລາຍການໃບລາພັກຂອງພະນັກງານ</h3>
            {leaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                ບໍ່ມີຄຳຂໍລາພັກໃນລະບົບ.
              </div>
            ) : (
              <>
              <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
                <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ພະນັກງານ</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ປະເພດການລາ</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ໄລຍະເວລາ</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ເຫດຜົນ</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>ສະຖານະ</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>ຜູ້ອະນຸມັດ</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.userName}</td>
                        <td style={{ padding: '12px' }}>{getLeaveTypeName(l.leaveType)}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                          📅 {new Date(l.startDate).toLocaleDateString('lo-LA')} - {new Date(l.endDate).toLocaleDateString('lo-LA')}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={l.reason}>
                          {l.reason || '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: l.status === 'approved' ? 'rgba(46, 204, 113, 0.15)' : l.status === 'rejected' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                            color: l.status === 'approved' ? 'var(--success-green)' : l.status === 'rejected' ? 'var(--alert-red)' : '#f1c40f',
                            border: `1px solid ${l.status === 'approved' ? 'var(--success-green)' : l.status === 'rejected' ? 'var(--alert-red)' : '#f1c40f'}`
                          }}>
                            {l.status === 'approved' ? 'อนຸມັດແລ້ວ' : l.status === 'rejected' ? 'ປະຕິເສດ' : 'ລໍຖ້າອະນຸມັດ'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {l.approvedByName || '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {l.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--success-green)', color: 'black', borderColor: 'var(--success-green)' }}
                                onClick={() => handleApproveLeave(l.id, 'approved')}
                              >
                                ✓ ອະນຸມັດ
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                                onClick={() => handleApproveLeave(l.id, 'rejected')}
                              >
                                ✕ ປະຕິເສດ
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards-view">
                {leaves.map(l => (
                  <div key={l.id} className="mobile-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white' }}>{l.userName}</span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        background: l.status === 'approved' ? 'rgba(46, 204, 113, 0.15)' : l.status === 'rejected' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                        color: l.status === 'approved' ? 'var(--success-green)' : l.status === 'rejected' ? 'var(--alert-red)' : '#f1c40f',
                        border: `1px solid ${l.status === 'approved' ? 'var(--success-green)' : l.status === 'rejected' ? 'var(--alert-red)' : '#f1c40f'}`
                      }}>
                        {l.status === 'approved' ? 'อนຸມັດແລ້ວ' : l.status === 'rejected' ? 'ປະຕິເສດ' : 'ລໍຖ້າອະນຸມັດ'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <div>📋 <span style={{ color: 'white' }}>ປະເພດ:</span> {getLeaveTypeName(l.leaveType)}</div>
                      <div>📅 <span style={{ color: 'white' }}>ໄລຍະເວລາ:</span> {new Date(l.startDate).toLocaleDateString('lo-LA')} - {new Date(l.endDate).toLocaleDateString('lo-LA')}</div>
                      <div>📝 <span style={{ color: 'white' }}>ເຫດຜົນ:</span> {l.reason || '-'}</div>
                      <div>👤 <span style={{ color: 'white' }}>ຜູ້ອະນຸມັດ:</span> {l.approvedByName || '-'}</div>
                    </div>
                    {l.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'var(--success-green)', color: 'black', borderColor: 'var(--success-green)' }}
                          onClick={() => handleApproveLeave(l.id, 'approved')}
                        >
                          ✓ ອະນຸມັດ
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '8px', fontSize: '0.8rem', color: 'var(--alert-red)', borderColor: 'rgba(231,76,60,0.2)' }}
                          onClick={() => handleApproveLeave(l.id, 'rejected')}
                        >
                          ✕ ປະຕິເສດ
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB: PAYROLL ENGINE */}
      {activeSubTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Payroll Filter */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ປະຈຳເດືອນ (Select Month):</label>
              <input
                type="month"
                className="form-control"
                style={{ width: '180px', background: '#1c1915' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              * ລະບົບຄຳນວນຈາກ: ເວລາເຂົ້າ-ອອກງານ (Late Penalty), ການລາພັກທີ່ອະນຸມັດ ແລະ ຄ່າຈ້າງພື້ນຖານ.
            </div>
          </div>

          {/* Payroll Grid */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1rem', margin: '0 0 16px' }}>💵 ບັນຊີເງິນເດືອນພະນັກງານ ປະຈຳເດືອນ {selectedMonth}</h3>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>ພະນັກງານ</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>ຄ່າຈ້างພື້ນຖານ (Base)</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>ຄ່າລ່ວງເວລາ (OT)</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>ຫັກເຂົ້າສາຍ (Late)</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>ຫັກຂາດວຽກ (Absence)</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>ຫັກລາພັກ (Leave)</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: 'var(--gold-primary)' }}>ລາຍຮັບສຸດທິ (Net Pay)</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>ສະຖານະ</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>ຈັດການ</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map(p => (
                    <tr key={p.userId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.userName}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{(p.baseWages).toLocaleString()} ₭</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success-green)' }}>+{(p.otPay).toLocaleString()} ₭</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--alert-red)' }}>-{(p.lateDeduction).toLocaleString()} ₭</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--alert-red)' }}>-{(p.absenceDeduction).toLocaleString()} ₭</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--alert-red)' }}>-{(p.leaveDeduction).toLocaleString()} ₭</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '0.95rem' }}>
                        {(p.netPay).toLocaleString()} ₭
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          background: p.status === 'paid' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                          color: p.status === 'paid' ? 'var(--success-green)' : '#f1c40f',
                          border: `1px solid ${p.status === 'paid' ? 'var(--success-green)' : '#f1c40f'}`
                        }}>
                          {p.status === 'paid' ? 'ຈ່າຍແລ້ວ' : 'ຄ້າງຈ່າຍ'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {p.status !== 'paid' ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)', fontWeight: 'bold' }}
                              onClick={() => handlePayout(p)}
                            >
                              💵 ຈ່າຍເງິນ
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success-green)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ ຈ່າຍແລ້ວ</span>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)' }}
                            onClick={() => handlePrintPayslip(p)}
                          >
                            🖨️ A4 Payslip
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--gold-primary)' }}
                            onClick={() => handlePrintPayrollClick(p)}
                          >
                            📠 80mm Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards-view">
              {payrolls.map(p => (
                <div key={p.userId} className="mobile-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white' }}>{p.userName}</span>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      background: p.status === 'paid' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                      color: p.status === 'paid' ? 'var(--success-green)' : '#f1c40f',
                      border: `1px solid ${p.status === 'paid' ? 'var(--success-green)' : '#f1c40f'}`
                    }}>
                      {p.status === 'paid' ? 'ຈ່າຍແລ້ວ' : 'ຄ້າງຈ່າຍ'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '10px' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ຄ່າຈ້າງພື້ນຖານ</div>
                      <div style={{ color: 'white' }}>{(p.baseWages).toLocaleString()} ₭</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>ຄ່າລ່ວງເວລາ (OT)</div>
                      <div style={{ color: 'var(--success-green)' }}>+{(p.otPay).toLocaleString()} ₭</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(231,76,60,0.05)', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '4px' }}>ລາຍການຫັກ</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert-red)' }}>
                      <span>ເຂົ້າສາຍ: -{(p.lateDeduction).toLocaleString()} ₭</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert-red)' }}>
                      <span>ຂາດວຽກ: -{(p.absenceDeduction).toLocaleString()} ₭</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert-red)' }}>
                      <span>ລາພັກ: -{(p.leaveDeduction).toLocaleString()} ₭</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>ລາຍຮັບສຸດທິ</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)', fontSize: '1.1rem' }}>{(p.netPay).toLocaleString()} ₭</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {p.status !== 'paid' ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'var(--gold-primary)', color: 'black', borderColor: 'var(--gold-primary)', fontWeight: 'bold' }}
                        onClick={() => handlePayout(p)}
                      >
                        💵 ຈ່າຍເງິນ
                      </button>
                    ) : (
                      <span style={{ flex: 1, textAlign: 'center', color: 'var(--success-green)', fontSize: '0.8rem', fontWeight: 'bold', padding: '8px' }}>✓ ຈ່າຍແລ້ວ</span>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 10px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)' }}
                      onClick={() => handlePrintPayslip(p)}
                    >
                      🖨️ A4
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 10px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--gold-primary)' }}
                      onClick={() => handlePrintPayrollClick(p)}
                    >
                      📠 80mm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddUserModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">➕ ເພີ່ມບັນຊີພະນັກງານໃໝ່</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ຊື່ພະນັກງານ (Full Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ຕຳແໜ່ງ / ບົດບາດ</label>
                  <select
                    className="form-control"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    <option value="cashier">ພະນັກງານຂາຍ (Cashier)</option>
                    <option value="technician">ຊ່າງອັດກອບ (Technician)</option>
                    <option value="owner">ເຈົ້າຂອງຮ້ານ (Owner)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Gmail / Email</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ລະຫັດຜ່ານ Gmail (Password)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ລະຫັດ PIN 4 ຫຼັກ (Passcode)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    maxLength="4"
                    pattern="\d{4}"
                    value={userFormData.passcode}
                    onChange={(e) => setUserFormData({ ...userFormData, passcode: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ຮູບແບບການຈ່າຍເງິນ (Pay Type)</label>
                  <select
                    className="form-control"
                    value={userFormData.payType}
                    onChange={(e) => setUserFormData({ ...userFormData, payType: e.target.value })}
                  >
                    <option value="daily">ຄ່າຈ້າງລາຍວັນ (Daily Wage)</option>
                    <option value="monthly">ເງິນເດືອນລາຍເດືອນ (Monthly Salary)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ອັດຕາຄ່າຈ້າງ / ເງິນເດືອນພື້ນຖານ (LAK)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={userFormData.baseWage}
                    onChange={(e) => setUserFormData({ ...userFormData, baseWage: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ອັດຕາຄ່າ OT ຕໍ່ຊົ່ວໂມງ (LAK)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={userFormData.otRate}
                    onChange={(e) => setUserFormData({ ...userFormData, otRate: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>ສິດທິການເຂົ້າເຖิง (Permissions)</label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="perm-admin"
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        checked={userFormData.permissions?.admin || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setUserFormData(prev => ({
                            ...prev,
                            permissions: {
                              ...prev.permissions,
                              admin: val,
                              ...(val ? {
                                pos: true,
                                inventory: true,
                                hrm: true,
                                reports: true,
                                debts: true,
                                ai: true,
                                settings: true
                              } : {})
                            }
                          }));
                        }}
                      />
                      <label htmlFor="perm-admin" style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', color: 'white' }}>
                        ເຂົ້າໄດ້ທຸກໜ້າ (Admin Access)
                      </label>
                    </div>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '2px 0' }} />
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px 8px'
                    }}>
                      {[
                        { key: 'pos', label: '💵 ຂາຍໜ້າຮ້ານ (POS)' },
                        { key: 'framing', label: '🛠️ ບອດຈັດການງານອັດກອບ (Framing Dashboard)' },
                        { key: 'inventory', label: '📦 ສະຕັອກ (Inventory)' },
                        { key: 'hrm', label: '👥 ຈັດການບຸກຄະລາກອນ (HRM)' },
                        { key: 'customers', label: '💳 ສະມາຊິກ (Members)' },
                        { key: 'debts', label: '📒 ບັນຊີຕິດໜີ້ (Debts)' },
                        { key: 'reports', label: '📊 ລາຍງານ (Reports)' },
                        { key: 'ai', label: '🤖 ລະບົບ AI' },
                        { key: 'settings', label: '⚙️ ຕັ້ງຄ່າ (Settings)' }
                      ].map(item => (
                        <div key={item.key} style={{ gridColumn: 'span 2', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: userFormData.permissions?.admin ? 0.5 : 1 }}>
                            <input
                              type="checkbox"
                              id={`perm-${item.key}`}
                              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              disabled={userFormData.permissions?.admin}
                              checked={userFormData.permissions?.admin || userFormData.permissions?.[item.key] || false}
                              onChange={(e) => {
                                const val = e.target.checked;
                                const subKeys = {
                                  pos: ['posCheckout', 'posDiscount', 'posChangePrice', 'posDeleteOrder', 'posOpenDrawer', 'posDeposit'],
                                  framing: ['framingView', 'framingUpdateStatus', 'framingEditJob', 'framingNotifyCustomer', 'framingPrintJob', 'framingCollectPayment'],
                                  inventory: ['inventoryViewCost', 'inventoryAddProduct', 'inventoryEditProduct', 'inventoryDeleteProduct', 'inventoryAddStock', 'inventoryDeleteStock'],
                                  hrm: ['hrmView', 'hrmAddUser', 'hrmEditUser', 'hrmDeleteUser', 'hrmPayroll'],
                                  customers: ['membersAdd', 'membersEdit', 'membersDelete'],
                                  debts: ['debtsCollect', 'debtsAddDebt', 'debtsDelete'],
                                  reports: ['reportsRevenue', 'reportsProfit', 'reportsExport'],
                                  ai: ['aiChat', 'aiAnalyze', 'aiCctv'],
                                  settings: ['settingsShopInfo', 'settingsReceipt', 'settingsBarcode', 'settingsTheme', 'settingsLabels', 'settingsNotifications', 'settingsRules', 'settingsPromotions', 'settingsFraming', 'settingsExpenses', 'settingsTracking', 'settingsBackup', 'settingsOnlineShop', 'settingsSystem', 'settingsProductionTools']
                                }[item.key] || [];

                                const updatedSubPerms = {};
                                subKeys.forEach(k => {
                                  updatedSubPerms[k] = val;
                                });

                                setUserFormData(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    [item.key]: val,
                                    ...updatedSubPerms
                                  }
                                }));
                              }}
                            />
                            <label htmlFor={`perm-${item.key}`} style={{ margin: 0, fontSize: '0.85rem', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
                              {item.label}
                            </label>
                          </div>
                          
                          {SUB_PERMS[item.key] && (userFormData.permissions?.admin || userFormData.permissions?.[item.key]) && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '6px 8px',
                              marginLeft: '20px',
                              marginTop: '6px',
                              padding: '10px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px dashed rgba(255,255,255,0.08)',
                              borderRadius: '6px'
                            }}>
                              {SUB_PERMS[item.key].map(sub => (
                                <div key={sub.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: userFormData.permissions?.admin ? 0.5 : 1 }}>
                                  <input
                                    type="checkbox"
                                    id={`perm-${sub.key}`}
                                    style={{ width: '13px', height: '13px', cursor: 'pointer' }}
                                    disabled={userFormData.permissions?.admin}
                                    checked={userFormData.permissions?.admin || userFormData.permissions?.[sub.key] || false}
                                    onChange={(e) => {
                                      setUserFormData(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          [sub.key]: e.target.checked
                                        }
                                      }));
                                    }}
                                  />
                                  <label htmlFor={`perm-${sub.key}`} style={{ margin: 0, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    {sub.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ຮູບພາບພະນັກງານ (Profile Photo / Avatar)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                    {userFormData.avatar ? (
                      <img 
                        src={userFormData.avatar} 
                        alt="Avatar Preview" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)', background: '#111' }} 
                      />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid var(--border-color)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        👤
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
                              setUserFormData(prev => ({ ...prev, avatar: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                      />
                      {userFormData.avatar && (
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)', alignSelf: 'flex-start' }} 
                          onClick={() => setUserFormData(prev => ({ ...prev, avatar: '' }))}
                        >
                          ລຶບຮູບ (Remove Photo)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddUserModal(false);
                  setUserFormData({
                    name: '',
                    email: '',
                    password: '',
                    passcode: '',
                    role: 'cashier',
                    payType: 'daily',
                    baseWage: 80000,
                    otRate: 15000,
                    avatar: '',
                    permissions: {
                      admin: false,
                      dashboard: false,
                      pos: false,
                      posZoneA: false,
                      posZoneB: false,
                      framing: false,
                      inventory: false,
                      inventoryViewCost: false,
                      inventoryAddProduct: false,
                      inventoryEditProduct: false,
                      inventoryDeleteProduct: false,
                      inventoryAddStock: false,
                      inventoryDeleteStock: false,
                      hrm: false,
                      reports: false,
                      debts: false,
                      ai: false,
                      settings: false
                    }
                  });
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">➕ ເພີ່ມພະນັກງານ</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* EDIT EMPLOYEE PROFILE MODAL */}
      {editingUser && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">✏️ ແກ້ໄຂບັນຊີ: {editingUser.name}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleUserSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ຊື່ພະນັກງານ (Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ບົດບາດ</label>
                  <select
                    className="form-control"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    disabled={editingUser.id === 'owner'}
                  >
                    <option value="owner">ເຈົ້າຂອງຮ້ານ (Owner)</option>
                    <option value="cashier">ພະນັກງານຂາຍ (Cashier)</option>
                    <option value="technician">ຊ່າງອັດກອບ (Technician)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Gmail / Email</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ລະຫັດຜ່ານ Gmail (Password)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ລະຫັດ PIN 4 ຫຼັກ (Passcode)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    maxLength="4"
                    pattern="\d{4}"
                    value={userFormData.passcode}
                    onChange={(e) => setUserFormData({ ...userFormData, passcode: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ຮູບແບບການຈ່າຍເງິນ (Pay Type)</label>
                  <select
                    className="form-control"
                    value={userFormData.payType}
                    onChange={(e) => setUserFormData({ ...userFormData, payType: e.target.value })}
                  >
                    <option value="daily">ຄ່າຈ້າງລາຍວັນ (Daily Wage)</option>
                    <option value="monthly">ເງິນເດືອນລາຍເດືອນ (Monthly Salary)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ອັດຕາຄ່າຈ້າງ / ເງິນເດືອນພື້ນຖານ (LAK)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={userFormData.baseWage}
                    onChange={(e) => setUserFormData({ ...userFormData, baseWage: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ອັດຕາຄ່າ OT ຕໍ່ຊົ່ວໂມງ (LAK)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={userFormData.otRate}
                    onChange={(e) => setUserFormData({ ...userFormData, otRate: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>ສິດທິการເຂົ້າເຖິງ (Permissions)</label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="edit-perm-admin"
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        checked={userFormData.permissions?.admin || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setUserFormData(prev => ({
                            ...prev,
                            permissions: {
                              ...prev.permissions,
                              admin: val,
                              ...(val ? {
                                pos: true,
                                inventory: true,
                                hrm: true,
                                reports: true,
                                debts: true,
                                ai: true,
                                settings: true
                              } : {})
                            }
                          }));
                        }}
                      />
                      <label htmlFor="edit-perm-admin" style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', color: 'white' }}>
                        ເຂົ້າໄດ້ທຸກໜ້າ (Admin Access)
                      </label>
                    </div>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '2px 0' }} />
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px 8px'
                    }}>
                      {[
                        { key: 'pos', label: '💵 ຂາຍໜ້າຮ້ານ (POS)' },
                        { key: 'framing', label: '🛠️ ບອດຈັດການງານອັດກອບ (Framing Dashboard)' },
                        { key: 'inventory', label: '📦 ສະຕັອກ (Inventory)' },
                        { key: 'hrm', label: '👥 ຈັດການບຸກຄະລາກອນ (HRM)' },
                        { key: 'customers', label: '💳 ສະມາຊິກ (Members)' },
                        { key: 'debts', label: '📒 ບັນຊີຕິດໜີ້ (Debts)' },
                        { key: 'reports', label: '📊 ລາຍງານ (Reports)' },
                        { key: 'ai', label: '🤖 ລະບົບ AI' },
                        { key: 'settings', label: '⚙️ ຕັ້ງຄ່າ (Settings)' }
                      ].map(item => (
                        <div key={item.key} style={{ gridColumn: 'span 2', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: userFormData.permissions?.admin ? 0.5 : 1 }}>
                            <input
                              type="checkbox"
                              id={`edit-perm-${item.key}`}
                              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              disabled={userFormData.permissions?.admin}
                              checked={userFormData.permissions?.admin || userFormData.permissions?.[item.key] || false}
                              onChange={(e) => {
                                const val = e.target.checked;
                                const subKeys = {
                                  pos: ['posCheckout', 'posDiscount', 'posChangePrice', 'posDeleteOrder', 'posOpenDrawer', 'posDeposit'],
                                  framing: ['framingView', 'framingUpdateStatus', 'framingEditJob', 'framingNotifyCustomer', 'framingPrintJob', 'framingCollectPayment'],
                                  inventory: ['inventoryViewCost', 'inventoryAddProduct', 'inventoryEditProduct', 'inventoryDeleteProduct', 'inventoryAddStock', 'inventoryDeleteStock'],
                                  hrm: ['hrmView', 'hrmAddUser', 'hrmEditUser', 'hrmDeleteUser', 'hrmPayroll'],
                                  customers: ['membersAdd', 'membersEdit', 'membersDelete'],
                                  debts: ['debtsCollect', 'debtsAddDebt', 'debtsDelete'],
                                  reports: ['reportsRevenue', 'reportsProfit', 'reportsExport'],
                                  ai: ['aiChat', 'aiAnalyze', 'aiCctv'],
                                  settings: ['settingsShopInfo', 'settingsReceipt', 'settingsBarcode', 'settingsTheme', 'settingsLabels', 'settingsNotifications', 'settingsRules', 'settingsPromotions', 'settingsFraming', 'settingsExpenses', 'settingsTracking', 'settingsBackup', 'settingsOnlineShop', 'settingsSystem', 'settingsProductionTools']
                                }[item.key] || [];

                                const updatedSubPerms = {};
                                subKeys.forEach(k => {
                                  updatedSubPerms[k] = val;
                                });

                                setUserFormData(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    [item.key]: val,
                                    ...updatedSubPerms
                                  }
                                }));
                              }}
                            />
                            <label htmlFor={`edit-perm-${item.key}`} style={{ margin: 0, fontSize: '0.85rem', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
                              {item.label}
                            </label>
                          </div>
                          
                          {SUB_PERMS[item.key] && (userFormData.permissions?.admin || userFormData.permissions?.[item.key]) && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '6px 8px',
                              marginLeft: '20px',
                              marginTop: '6px',
                              padding: '10px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px dashed rgba(255,255,255,0.08)',
                              borderRadius: '6px'
                            }}>
                              {SUB_PERMS[item.key].map(sub => (
                                <div key={sub.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: userFormData.permissions?.admin ? 0.5 : 1 }}>
                                  <input
                                    type="checkbox"
                                    id={`edit-perm-${sub.key}`}
                                    style={{ width: '13px', height: '13px', cursor: 'pointer' }}
                                    disabled={userFormData.permissions?.admin}
                                    checked={userFormData.permissions?.admin || userFormData.permissions?.[sub.key] || false}
                                    onChange={(e) => {
                                      setUserFormData(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          [sub.key]: e.target.checked
                                        }
                                      }));
                                    }}
                                  />
                                  <label htmlFor={`edit-perm-${sub.key}`} style={{ margin: 0, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    {sub.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label className="form-label">ຮູບພາບພະນັກງານ (Profile Photo / Avatar)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                    {userFormData.avatar ? (
                      <img 
                        src={userFormData.avatar} 
                        alt="Avatar Preview" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)', background: '#111' }} 
                      />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid var(--border-color)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        👤
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
                              setUserFormData(prev => ({ ...prev, avatar: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                      />
                      {userFormData.avatar && (
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)', alignSelf: 'flex-start' }} 
                          onClick={() => setUserFormData(prev => ({ ...prev, avatar: '' }))}
                        >
                          ລຶບຮູບ (Remove Photo)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditingUser(null);
                  setUserFormData({
                    name: '',
                    email: '',
                    password: '',
                    passcode: '',
                    role: 'cashier',
                    payType: 'daily',
                    baseWage: 80000,
                    otRate: 15000,
                    avatar: '',
                    permissions: {
                      admin: false,
                      dashboard: false,
                      pos: false,
                      posZoneA: false,
                      posZoneB: false,
                      framing: false,
                      inventory: false,
                      inventoryViewCost: false,
                      inventoryAddProduct: false,
                      inventoryEditProduct: false,
                      inventoryDeleteProduct: false,
                      inventoryAddStock: false,
                      inventoryDeleteStock: false,
                      hrm: false,
                      reports: false,
                      debts: false,
                      ai: false,
                      settings: false
                    }
                  });
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">ຢືນຢັນອັບເດດ</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* ADD MANUAL ATTENDANCE LOG MODAL */}
      {showManualLogModal && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">➕ ເພີ່ມບັນທຶກເຂົ້າງານດ້ວຍມື</span>
              <button
                className="btn-secondary"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowManualLogModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualLogSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ພະນັກງານ (Employee)</label>
                  <select
                    className="form-control"
                    required
                    value={manualLogFormData.userId}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, userId: e.target.value })}
                  >
                    <option value="" disabled>-- ເລືອກພະນັກງານ --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.roleName?.split(' ')[0] || u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ວັນທີ (Date)</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={manualLogFormData.date}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ສະຖານະ (Status)</label>
                  <select
                    className="form-control"
                    required
                    value={manualLogFormData.status}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, status: e.target.value })}
                  >
                    <option value="present">🟢 ມາເຮັດວຽກ (Present)</option>
                    <option value="late">🟡 ມາຊ້າ (Late)</option>
                    <option value="absent">🔴 ຂາດງານ (Absent)</option>
                  </select>
                </div>

                {manualLogFormData.status !== 'absent' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">ເວລາເຂົ້າງານ (Clock In Time)</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={manualLogFormData.clockIn}
                        onChange={(e) => setManualLogFormData({ ...manualLogFormData, clockIn: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">ເວລາອອກງານ (Clock Out Time)</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={manualLogFormData.clockOut}
                        onChange={(e) => setManualLogFormData({ ...manualLogFormData, clockOut: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">ຄ່າຈ້າງວັນນີ້ (LAK Override - ປະໄວ້ຫວ່າງເພື່ອຄຳນວນອັດຕະໂນມັດ)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="ລະບຸຈຳນວນເງິນ ຫຼື ປະຫວ່າງໄວ້"
                    value={manualLogFormData.payout}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, payout: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowManualLogModal(false);
                  setManualLogFormData({
                    userId: '',
                    date: new Date().toLocaleDateString('en-CA'),
                    clockIn: '08:00',
                    clockOut: '17:00',
                    status: 'present',
                    payout: ''
                  });
                }}>ຍົກເລີກ</button>
                <button type="submit" className="btn btn-primary">➕ ເພີ່ມບັນທຶก</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* EDIT MANUAL ATTENDANCE LOG MODAL */}
      {showEditLogModal && selectedLogEntry && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">✏️ ແກ້ໄຂບັນທຶກເຂົ້າງານ: {selectedLogEntry.userName}</span>
              <button
                className="btn-secondary"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => {
                  setShowEditLogModal(false);
                  setSelectedLogEntry(null);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditLogSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ພະນັກງານ (Employee)</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={selectedLogEntry.userName}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ວັນທີ (Date)</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={manualLogFormData.date}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ສະຖານະ (Status)</label>
                  <select
                    className="form-control"
                    required
                    value={manualLogFormData.status}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, status: e.target.value })}
                  >
                    <option value="present">🟢 ມາເຮັດວຽກ (Present)</option>
                    <option value="late">🟡 ມາຊ້າ (Late)</option>
                    <option value="absent">🔴 ຂາດງານ (Absent)</option>
                  </select>
                </div>

                {manualLogFormData.status !== 'absent' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">ເວລາເຂົ້າງານ (Clock In Time)</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={manualLogFormData.clockIn}
                        onChange={(e) => setManualLogFormData({ ...manualLogFormData, clockIn: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">ເວລາອອກງານ (Clock Out Time)</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={manualLogFormData.clockOut}
                        onChange={(e) => setManualLogFormData({ ...manualLogFormData, clockOut: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">ຄ່າຈ້າງວັນນີ້ (LAK Override - ປະໄວ້ຫວ່າງເພື່ອຄຳນວນອັດຕະໂນມັດ)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="ລະບຸຈຳນວນເງິນ ຫຼື ປະຫວ່າງໄວ້"
                    value={manualLogFormData.payout}
                    onChange={(e) => setManualLogFormData({ ...manualLogFormData, payout: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditLogModal(false);
                    setSelectedLogEntry(null);
                  }}
                >
                  ຍົກເລີກ
                </button>
                <button type="submit" className="btn btn-primary">💾 ບັນທຶກການແກ້ໄຂ</button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}

      {/* A4 PAYSLIP MODAL */}
      {showPayslipModal && selectedPayslip && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm glass-card" style={{ padding: '24px', maxHeight: '85%', overflowY: 'auto' }}>
            <div className="modal-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>🖨️ ໃບສະລິບຮັບເງິນເດືອນພະນັກງານ (A4 Payslip)</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }} onClick={() => setShowPayslipModal(false)}>✕</button>
            </div>

            <div id="print-payslip-area" style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '6px', fontFamily: 'Phetsarath, Noto Sans Lao, monospace', fontSize: '13px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{settings.shopAddress || 'ປາກເຊ, ແຂວງຈຳປາສັກ'}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>ໂທ: {settings.shopPhone || '02023304555'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>ໃບສະລິບຮັບເງິນເດືອນ</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>ປະຈຳເດືອນ (Month): {selectedPayslip.month}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
                <div>
                  <div><b>ຊື່ພະນັກງານ (Name):</b> {selectedPayslip.userName}</div>
                  <div><b>ລະຫັດພະນັກງານ (ID):</b> {selectedPayslip.userId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><b>ວັນທີຈ່າຍ (Date paid):</b> {selectedPayslip.paidAt ? new Date(selectedPayslip.paidAt).toLocaleDateString('lo-LA') : 'ລໍຖ້າການຊຳລະ'}</div>
                  <div><b>ວິທີການຊຳລະ (Method):</b> ໂອນຜ່ານ BCEL One</div>
                </div>
              </div>

              <table className="table-premium" style={{ width: '100%', marginTop: 0, marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #000' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>ລາຍການລາຍຮັບ (Earnings)</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>ຈຳນວນເງິນ (LAK)</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', borderLeft: '1px solid #ddd' }}>ລາຍການລາຍຫັກ (Deductions)</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>ຈຳນວນເງິນ (LAK)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>ຄ່າຈ້າງພື້ນຖານ (Base Wage)</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{selectedPayslip.baseWages?.toLocaleString() || 0} ₭</td>
                    <td style={{ padding: '8px', borderLeft: '1px solid #ddd' }}>ຫັກເຂົ້າວຽກຊ້າ (Late Penalty)</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#c0392b' }}>{selectedPayslip.lateDeduction?.toLocaleString() || 0} ₭</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>ຄ່າລ່ວງເວລາ (Overtime - OT)</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{selectedPayslip.otPay?.toLocaleString() || 0} ₭</td>
                    <td style={{ padding: '8px', borderLeft: '1px solid #ddd' }}>ຫັກຂາດວຽກ (Absence Deduction)</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#c0392b' }}>{selectedPayslip.absenceDeduction?.toLocaleString() || 0} ₭</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>ໂບນັດ / ລາຍຮັບອື່ນໆ (Bonus)</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>0 ₭</td>
                    <td style={{ padding: '8px', borderLeft: '1px solid #ddd' }}>ຫັກການລາພັກ (Leave Deduction)</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#c0392b' }}>{selectedPayslip.leaveDeduction?.toLocaleString() || 0} ₭</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #000', background: '#f9f9f9', fontWeight: 'bold' }}>
                    <td style={{ padding: '8px' }}>ລວມລາຍຮັບ (Total Earnings)</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{((selectedPayslip.baseWages || 0) + (selectedPayslip.otPay || 0)).toLocaleString()} ₭</td>
                    <td style={{ padding: '8px', borderLeft: '1px solid #ddd' }}>%ລວມລາຍຫັກ (Total Deductions)</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#c0392b' }}>{((selectedPayslip.lateDeduction || 0) + (selectedPayslip.absenceDeduction || 0) + (selectedPayslip.leaveDeduction || 0)).toLocaleString()} ₭</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '12px 16px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '25px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>ລາຍຮັບສຸດທິ (Net Take-home Pay):</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>{selectedPayslip.netPay?.toLocaleString() || 0} LAK (ກີບ)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '12px', marginTop: '40px' }}>
                <div style={{ width: '40%' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '35px' }}></div>
                  <div style={{ marginTop: '6px', fontWeight: 'bold' }}>ພະນັກງານຜູ້ຮັບເງິນ</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>ວັນທີ: ____/____/______</div>
                </div>
                <div style={{ width: '40%' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '35px' }}></div>
                  <div style={{ marginTop: '6px', fontWeight: 'bold' }}>ເຈົ້າຂອງຮ້ານຜູ້ຈ່າຍເງິນ</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>ວັນທີ: ____/____/______</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPayslipModal(false)}>ປິດ (Close)</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const printArea = document.getElementById('print-payslip-area');
                  if (!printArea) return;

                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = '0';
                  document.body.appendChild(iframe);

                  const printHtml = printArea.innerHTML;
                  const doc = iframe.contentWindow.document || iframe.contentDocument;
                  doc.open();
                  doc.write(`
                    <html>
                      <head>
                        <title>Payslip - ${selectedPayslip.userName}</title>
                        <style>
                          @page { size: A4 portrait; margin: 20mm; }
                          body {
                            background: white;
                            color: black;
                            margin: 0;
                            padding: 0;
                            font-family: 'Phetsarath', 'Noto Sans Lao', monospace;
                          }
                          #print-payslip-area {
                            width: 100%;
                          }
                        </style>
                      </head>
                      <body onload="window.print();">
                        <div id="print-payslip-area">${printHtml}</div>
                      </body>
                    </html>
                  `);
                  doc.close();

                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1500);
                }}
              >
                🖨️ ພິມໃບສະລິບ (Print Payslip)
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* 80MM THERMAL RECEIPT SLIP MODAL */}
      {showPayrollPrintModal && selectedPayrollUser && (() => {
        const user = selectedPayrollUser.user;
        const payType = user.payType || (user.role === 'cashier' ? 'monthly' : 'daily');
        const baseWage = user.baseWage !== undefined ? user.baseWage : (user.role === 'owner' ? 150000 : user.role === 'cashier' ? 2400000 : 100000);
        const otRate = user.otRate !== undefined ? user.otRate : (user.role === 'owner' ? 25000 : user.role === 'cashier' ? 15000 : 20000);
        const dailyWage = payType === 'monthly' ? Math.round(baseWage / 26) : baseWage;
        
        const record = selectedPayrollUser.record;
        const totalOtPayout = Math.round(selectedPayrollUser.totalOtHours * otRate);
        const totalBasePayout = selectedPayrollUser.totalPayout - totalOtPayout;

        const baseWages = record ? record.baseWages : totalBasePayout;
        const otPay = record ? record.otPay : totalOtPayout;
        const lateDeduction = record ? record.lateDeduction : 0;
        const absenceDeduction = record ? record.absenceDeduction : 0;
        const leaveDeduction = record ? record.leaveDeduction : 0;
        const netPay = record ? record.netPay : selectedPayrollUser.totalPayout;

        return (
          <Portal>
          <div className="modal-overlay print-modal" style={{ zIndex: 1200 }}>
            <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
              <div className="modal-header no-print">
                <span className="modal-title">ພິມໃບບິນສະຫຼຸບເງິນເດືອນ (80mm)</span>
                <button
                  className="btn-secondary"
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                  onClick={() => {
                    setShowPayrollPrintModal(false);
                    setSelectedPayrollUser(null);
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body" style={{ background: 'white', padding: '16px', display: 'flex', justifyContent: 'center' }}>
                <div id="print-80mm-payroll-area" className="print-receipt-container">
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
                    <div className="print-receipt-divider"></div>
                    <div style={{ fontWeight: 'bold', fontSize: '10pt', margin: '4px 0', color: 'black' }}>ໃບສະຫຼຸບຮັບເງິນເດືອນ / PAYROLL SLIP</div>
                  </div>

                  <div style={{ fontSize: '8pt', marginBottom: '8px', lineHeight: '1.4', color: 'black' }}>
                    <div><b>ພະນັກງານ:</b> {user.name}</div>
                    <div><b>ຕຳແໜ່ງ:</b> {user.role === 'owner' ? 'ເຈົ້າຂອງຮ້ານ' : user.role === 'cashier' ? 'ພະນັກງານຂາຍ' : 'ຊ່າງອັດກອບ'}</div>
                    <div><b>ວັນທີພິມ:</b> {new Date().toLocaleString('lo-LA')}</div>
                    <div><b>ປະຈຳເດືອນ:</b> {selectedPayrollUser.month}</div>
                  </div>

                  <div className="print-receipt-divider"></div>

                  <div style={{ fontSize: '8pt', display: 'flex', flexDirection: 'column', gap: '4px', color: 'black' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຈຳນວນວັນເຮັດວຽກ:</span>
                      <b>{selectedPayrollUser.totalDays} ວັນ</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຊົ່ວໂມງເຮັດວຽກທັງໝົດ:</span>
                      <b>{selectedPayrollUser.totalHours?.toFixed(1) || 0} ຊມ</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຊົ່ວໂມງ OT ທັງໝົດ:</span>
                      <b>{selectedPayrollUser.totalOtHours?.toFixed(1) || 0} ຊມ</b>
                    </div>
                    
                    <div className="print-receipt-divider"></div>
                    
                    {payType === 'monthly' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ເງິນເດືອນພື້ນຖານ:</span>
                          <span>{baseWage.toLocaleString()} ກີບ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ຄ່າຈ้างສະເລ່ຍຕໍ່ວັນ (ຫານ 26):</span>
                          <span>{dailyWage.toLocaleString()} ກີບ</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ອັດຕາຄ່າຈ้างລາຍວັນ:</span>
                        <span>{baseWage.toLocaleString()} ກີບ</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ອັດຕາ OT (ຕໍ່ຊົ່ວໂມງ):</span>
                      <span>{otRate.toLocaleString()} ກີບ</span>
                    </div>
                    
                    <div className="print-receipt-divider"></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຄ່າຈ້າງພື້ນຖານ (Base):</span>
                      <span>{baseWages.toLocaleString()} ກີບ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ຄ່າລ່ວງເວລາ (OT):</span>
                      <span>+{otPay.toLocaleString()} ກີບ</span>
                    </div>
                    {lateDeduction > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b' }}>
                        <span>ຫັກເຂົ້າສາຍ (Late):</span>
                        <span>-{lateDeduction.toLocaleString()} ກີບ</span>
                      </div>
                    )}
                    {absenceDeduction > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b' }}>
                        <span>ຫັກຂາດວຽກ (Absence):</span>
                        <span>-{absenceDeduction.toLocaleString()} ກີບ</span>
                      </div>
                    )}
                    {leaveDeduction > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b' }}>
                        <span>ຫັກລາພັກ (Leave):</span>
                        <span>-{leaveDeduction.toLocaleString()} ກີບ</span>
                      </div>
                    )}
                    
                    <div className="print-receipt-divider" style={{ borderTopStyle: 'double', borderWidth: '3px' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', fontWeight: 'bold' }}>
                      <span>ຍອດຮັບສຸດທິ (Net Payout):</span>
                      <span>{netPay?.toLocaleString() || 0} ກີບ</span>
                    </div>
                  </div>

                  <div className="print-receipt-divider" style={{ marginTop: '20px' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7pt', marginTop: '30px', textAlign: 'center', color: 'black' }}>
                    <div style={{ width: '45%' }}>
                      <div style={{ borderBottom: '1px solid black', height: '20px' }}></div>
                      <div style={{ marginTop: '4px' }}>ຜູ້ຈ່າຍເງິນ (Paid By)</div>
                    </div>
                    <div style={{ width: '45%' }}>
                      <div style={{ borderBottom: '1px solid black', height: '20px' }}></div>
                      <div style={{ marginTop: '4px' }}>ຜູ້ຮັບເງິນ (Received By)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer no-print">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPayrollPrintModal(false);
                    setSelectedPayrollUser(null);
                  }}
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const printArea = document.getElementById('print-80mm-payroll-area');
                    if (!printArea) return;

                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    document.body.appendChild(iframe);

                    const printHtml = printArea.innerHTML;
                    const doc = iframe.contentWindow.document || iframe.contentDocument;
                    doc.open();
                    doc.write(`
                      <html>
                        <head>
                          <title>Payroll Slip 80mm - ${user.name}</title>
                          <style>
                            @page { size: 80mm auto; margin: 0; }
                            body {
                              background: white;
                              color: black;
                              margin: 0;
                              padding: 5mm;
                              font-family: 'Phetsarath', 'Noto Sans Lao', monospace;
                            }
                            .print-receipt-container {
                              width: 70mm;
                              margin: 0 auto;
                              color: black !important;
                            }
                            .print-receipt-header {
                              text-align: center;
                              margin-bottom: 8px;
                            }
                            .print-receipt-title {
                              font-size: 11pt;
                              font-weight: bold;
                            }
                            .print-receipt-subtitle {
                              font-size: 7.5pt;
                              color: #444;
                            }
                            .print-receipt-divider {
                              border-top: 1px dashed black;
                              margin: 8px 0;
                            }
                          </style>
                        </head>
                        <body onload="window.print();">
                          <div id="print-80mm-payroll-area">${printHtml}</div>
                        </body>
                      </html>
                    `);
                    doc.close();

                    setTimeout(() => {
                      document.body.removeChild(iframe);
                    }, 1500);
                  }}
                >
                  🖨️ ພິມເອກະສານ
                </button>
              </div>
            </div>
          </div>
          </Portal>
        );
      })()}
    </div>
  );
}
