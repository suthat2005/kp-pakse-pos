const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Dashboard.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Replace fmtS currency formatter
  const oldFmtS = `const fmtS = n => {
  n=n||0;
  if(n>=1e9) return (n/1e9).toFixed(1)+'B ₭';
  if(n>=1e6) return (n/1e6).toFixed(1)+'M ₭';
  if(n>=1e3) return Math.round(n/1e3)+'K ₭';
  return n.toLocaleString()+' ₭';
};`;

  const newFmtS = `const fmtS = n => {
  n = n || 0;
  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + 'k ₭';
};`;

  if (content.includes(oldFmtS)) {
    content = content.replace(oldFmtS, newFmtS);
    console.log("✓ Updated fmtS currency formatter!");
  } else {
    console.log("oldFmtS not found");
  }

  // 2. Add startDate, endDate states and update periods array
  const oldSignature = `export default function Dashboard({ onTabChange, isMobile }) {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(() => safe(() => db.getSettings(), {}));
  const [now] = useState(() => new Date());

  const periods = [
    { key:'today',   label:'ວັນນີ້' },
    { key:'week',    label:'7 ວັນ' },
    { key:'month',   label:'ເດືອນ' },
    { key:'quarter', label:'3 ເດືອນ' },
    { key:'year',    label:'ປີ' },
  ];`;

  const newSignature = `export default function Dashboard({ activeUser, onTabChange, isMobile }) {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(() => safe(() => db.getSettings(), {}));
  const [now] = useState(() => new Date());

  const periods = [
    { key:'today',   label:'ວັນນີ້' },
    { key:'week',    label:'7 ວັນ' },
    { key:'month',   label:'ເດືອນ' },
    { key:'quarter', label:'3 ເດືອນ' },
    { key:'year',    label:'ປີ' },
    { key:'custom',  label:'ກຳນົດເອງ' },
  ];`;

  if (content.includes(oldSignature)) {
    content = content.replace(oldSignature, newSignature);
    console.log("✓ Updated Dashboard signature, states, and periods list!");
  }

  // 3. Update getRange callback with custom case
  const oldGetRange = `  const getRange = useCallback((p) => {
    const n = new Date();
    switch(p) {
      case 'today':   return { s:sod(n), e:eod(n), cs:new Date(sod(n).getTime()-86400000), ce:new Date(eod(n).getTime()-86400000) };
      case 'week': {
        const s7 = new Date(n); s7.setDate(n.getDate()-6);
        const p7s = new Date(s7); p7s.setDate(s7.getDate()-7);
        const p7e = new Date(s7); p7e.setDate(s7.getDate()-1);
        return { s:sod(s7), e:eod(n), cs:sod(p7s), ce:eod(p7e) };
      }
      case 'month': {
        const ms = new Date(n.getFullYear(), n.getMonth(), 1);
        const pms = new Date(n.getFullYear(), n.getMonth()-1, 1);
        const pme = new Date(n.getFullYear(), n.getMonth(), 0);
        return { s:sod(ms), e:eod(n), cs:sod(pms), ce:eod(pme) };
      }
      case 'quarter': {
        const q3 = new Date(n); q3.setDate(n.getDate()-90);
        return { s:sod(q3), e:eod(n), cs:null, ce:null };
      }
      case 'year': {
        const ys = new Date(n.getFullYear(),0,1);
        return { s:sod(ys), e:eod(n), cs:null, ce:null };
      }
      default: return { s:sod(n), e:eod(n), cs:null, ce:null };
    }
  }, []);`;

  const newGetRange = `  const getRange = useCallback((p) => {
    const n = new Date();
    switch(p) {
      case 'today':   return { s:sod(n), e:eod(n), cs:new Date(sod(n).getTime()-86400000), ce:new Date(eod(n).getTime()-86400000) };
      case 'week': {
        const s7 = new Date(n); s7.setDate(n.getDate()-6);
        const p7s = new Date(s7); p7s.setDate(s7.getDate()-7);
        const p7e = new Date(s7); p7e.setDate(s7.getDate()-1);
        return { s:sod(s7), e:eod(n), cs:sod(p7s), ce:eod(p7e) };
      }
      case 'month': {
        const ms = new Date(n.getFullYear(), n.getMonth(), 1);
        const pms = new Date(n.getFullYear(), n.getMonth()-1, 1);
        const pme = new Date(n.getFullYear(), n.getMonth(), 0);
        return { s:sod(ms), e:eod(n), cs:sod(pms), ce:eod(pme) };
      }
      case 'quarter': {
        const q3 = new Date(n); q3.setDate(n.getDate()-90);
        return { s:sod(q3), e:eod(n), cs:null, ce:null };
      }
      case 'year': {
        const ys = new Date(n.getFullYear(),0,1);
        return { s:sod(ys), e:eod(n), cs:null, ce:null };
      }
      case 'custom': {
        const s = startDate ? new Date(startDate + 'T00:00:00') : new Date();
        const e = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        return { s:sod(s), e:eod(e), cs:null, ce:null };
      }
      default: return { s:sod(n), e:eod(n), cs:null, ce:null };
    }
  }, [startDate, endDate]);`;

  if (content.includes(oldGetRange)) {
    content = content.replace(oldGetRange, newGetRange);
    console.log("✓ Updated getRange with custom option!");
  }

  // 4. Update refresh callback dependencies
  const oldRefresh = `  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const { s, e, cs, ce } = getRange(period);
      const d = calcData(s, e, cs, ce);
      setData(d);
      setSettings(safe(() => db.getSettings(), {}));
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [period, getRange]);`;

  const newRefresh = `  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const { s, e, cs, ce } = getRange(period);
      const d = calcData(s, e, cs, ce);
      setData(d);
      setSettings(safe(() => db.getSettings(), {}));
    } catch(err) { console.error(err); }
    setLoading(false);
  }, [period, getRange, startDate, endDate]);`;

  if (content.includes(oldRefresh)) {
    content = content.replace(oldRefresh, newRefresh);
    console.log("✓ Updated refresh callback dependencies!");
  }

  fs.writeFileSync(file, content, 'utf8');
}
