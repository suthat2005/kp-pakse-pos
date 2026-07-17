import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import AmuletImageEditor from './AmuletImageEditor';

function CameraFeed({ cam, idx, currentTime }) {
  const videoRef = useRef(null);
  const [hasStream, setHasStream] = useState(false);
  const [streamError, setStreamError] = useState('');

  useEffect(() => {
    let activeStream = null;
    if (cam.active && cam.url === 'webcam') {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then(stream => {
          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasStream(true);
          }
        })
        .catch(err => {
          console.error("Webcam stream access failed:", err);
          setStreamError('ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບກ້ອງ Webcam ໄດ້!');
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cam.active, cam.url]);

  if (!cam.active) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '1.8rem', display: 'block' }}>⚠</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ກ້ອງວົງຈອນປິດ Offline</span>
        <p style={{ fontSize: '0.65rem', marginTop: '2px' }}>ເປີດໃຊ້ງານກ້ອງໃນເມນູຄວບຄຸມ</p>
      </div>
    );
  }

  const overlays = (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(18, 16, 13, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 6px 100%', pointerEvents: 'none', zIndex: 2 }}></div>
      <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.65rem', color: '#fff', fontFamily: 'monospace', textShadow: '1px 1px 2px #000', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span>CAM {idx + 1}</span>
        <span>{currentTime.toLocaleTimeString('lo-LA')}</span>
      </div>
      <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.65rem', color: 'var(--alert-red)', fontFamily: 'monospace', textShadow: '1px 1px 2px #000', zIndex: 3, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--alert-red)', display: 'inline-block' }}></span>
        <span>REC</span>
      </div>

      {/* Mock AI Detection Bounding Boxes */}
      {cam.checks.intruder && (
        <div style={{ position: 'absolute', border: '1.5px solid var(--success-green)', width: '40%', height: '50%', top: '25%', left: '30%', zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px' }}>
          <span style={{ fontSize: '0.55rem', background: 'var(--success-green)', color: 'black', alignSelf: 'flex-start', padding: '1px 3px', fontWeight: 'bold', fontFamily: 'monospace' }}>SECURED ZONE</span>
        </div>
      )}

      {cam.checks.cashierAudit && (
        <div style={{ position: 'absolute', border: '1.5px dashed var(--accent-amber)', width: '30%', height: '40%', top: '35%', left: '15%', zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px' }}>
          <span style={{ fontSize: '0.55rem', background: 'var(--accent-amber)', color: 'black', alignSelf: 'flex-start', padding: '1px 3px', fontWeight: 'bold', fontFamily: 'monospace' }}>CASHIER: PRESENT</span>
        </div>
      )}

      {cam.checks.slacking && (
        <div style={{ position: 'absolute', border: '1.5px solid #3498db', width: '25%', height: '35%', top: '15%', right: '15%', zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px' }}>
          <span style={{ fontSize: '0.55rem', background: '#3498db', color: 'white', alignSelf: 'flex-start', padding: '1px 3px', fontWeight: 'bold', fontFamily: 'monospace' }}>STAFF: WORKFLOW</span>
        </div>
      )}
    </>
  );

  if (cam.url === 'webcam') {
    return (
      <>
        {overlays}
        {streamError ? (
          <div style={{ color: 'var(--alert-red)', fontSize: '0.75rem', zIndex: 1, padding: '10px', textAlign: 'center' }}>{streamError}</div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </>
    );
  }

  // NVR / DVR: show web UI iframe or RTSP stream
  if (cam.type === 'nvr' || cam.type === 'dvr') {
    const isLiveMode = cam.streamMode === 'live';
    const isHttpHost = cam.host && (cam.host.startsWith('http://') || cam.host.startsWith('https://'));
    const webUrl = isHttpHost ? cam.host : `http://${cam.host}:${cam.port || '80'}`;

    if (!isLiveMode) {
      return (
        <>
          {overlays}
          <iframe
            src={webUrl}
            title={cam.name}
            style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
            sandbox="allow-scripts allow-same-origin allow-forms"
            onError={() => {}}
          />
          <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', zIndex: 3, background: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: '3px' }}>
            {(cam.type || 'DVR').toUpperCase()} WEB UI
          </span>
        </>
      );
    } else {
      const isHttpStream = cam.url && (cam.url.startsWith('http://') || cam.url.startsWith('https://'));
      if (isHttpStream) {
        return (
          <>
            {overlays}
            <img
              src={cam.url}
              alt={cam.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', zIndex: 3, background: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: '3px' }}>
              {(cam.type || 'DVR').toUpperCase()} LIVE STREAM
            </span>
          </>
        );
      } else {
        return (
          <>
            {overlays}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px', textAlign: 'center', width: '100%', justifyContent: 'center', height: '100%' }}>
              <span style={{ fontSize: '1.2rem', margin: 0 }}>{cam.type === 'nvr' ? '💾' : '📼'}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: cam.type === 'nvr' ? '#3498db' : '#9b59b6' }}>
                {(cam.type || '').toUpperCase()} — {cam.brand ? cam.brand.toUpperCase() : 'Hikvision'} (CH {cam.channel || 1})
              </span>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '4px 6px', borderRadius: '4px', width: '90%' }}>
                <div><b>Host:</b> {cam.host || 'N/A'}</div>
                <div><b>RTSP:</b> {cam.url ? cam.url.substring(0, 40) + '...' : 'Not Set'}</div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.6rem', marginTop: '2px', cursor: 'pointer' }}
                onClick={() => {
                  navigator.clipboard.writeText(cam.url);
                  alert('✓ ຄັດລອກ RTSP URL ສຳເລັດ!');
                }}
              >
                📋 Copy RTSP URL
              </button>
            </div>
          </>
        );
      }
    }
  }

  if (cam.url && (cam.url.startsWith('http://') || cam.url.startsWith('https://') || cam.url.startsWith('rtsp://'))) {
    const isVideo = cam.url.endsWith('.m3u8') || cam.url.endsWith('.mp4') || cam.url.includes('stream') || cam.url.includes('/video');
    return (
      <>
        {overlays}
        {isVideo ? (
          <video
            src={cam.url}
            autoPlay
            playsInline
            muted
            loop
            controls={false}
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <img
            src={cam.url}
            alt={cam.name}
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <span style={{ position: 'absolute', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', bottom: '10px', textShadow: '1px 1px 1px #000', zIndex: 1 }}>
          FEED: {cam.url.substring(0, 25)}...
        </span>
      </>
    );
  }

  return (
    <>
      {overlays}
      <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>🎥</span>
      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', textShadow: '1px 1px 1px #000', zIndex: 1 }}>
        SIMULATED STREAM
      </span>
    </>
  );
}

export default function AIDetector({ activeUser }) {
  const hasAiPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedMockImg, setSelectedMockImg] = useState('');
  
  const videoScanRef = useRef(null);
  const canvasScanRef = useRef(null);
  
  // AI Alerts & Forecasts
  const [aiAlerts, setAiAlerts] = useState([]);
  const [forecastCount, setForecastCount] = useState(38);

  // Audit tab states
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner', 'forecasts', 'audit', 'cctv'
  useEffect(() => {
    if (activeTab === 'scanner' && !hasAiPermission('aiChat')) {
      if (hasAiPermission('aiAnalyze')) setActiveTab('forecasts');
      else if (hasAiPermission('aiCctv')) setActiveTab('cctv');
    }
    if ((activeTab === 'forecasts' || activeTab === 'audit') && !hasAiPermission('aiAnalyze')) {
      if (hasAiPermission('aiChat')) setActiveTab('scanner');
    }
  }, [activeUser, activeTab]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [reAnalyzing, setReAnalyzing] = useState(false);

  // CCTV States
  const [cameras, setCameras] = useState([]);
  const [cctvAlerts, setCctvAlerts] = useState([]);
  const [newCamName, setNewCamName] = useState('');
  const [newCamUrl, setNewCamUrl] = useState('');
  const [newCamChecks, setNewCamChecks] = useState({ intruder: true, cashierAudit: false, slacking: false });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cctvFilter, setCctvFilter] = useState('unresolved'); // 'all', 'unresolved', 'resolved'
  const [editingCameraId, setEditingCameraId] = useState(null);
  const [editCamName, setEditCamName] = useState('');
  const [editCamUrl, setEditCamUrl] = useState('');
  const [newCamType, setNewCamType] = useState('ip');
  const [editCamType, setEditCamType] = useState('ip');
  const [newCamHost, setNewCamHost] = useState('');
  const [newCamPort, setNewCamPort] = useState('554');
  const [newCamUser, setNewCamUser] = useState('admin');
  const [newCamPass, setNewCamPass] = useState('');
  const [newCamChannel, setNewCamChannel] = useState('1');
  const [newCamBrand, setNewCamBrand] = useState('hikvision');
  const [newCamStreamMode, setNewCamStreamMode] = useState('live');

  const [editCamHost, setEditCamHost] = useState('');
  const [editCamPort, setEditCamPort] = useState('554');
  const [editCamUser, setEditCamUser] = useState('admin');
  const [editCamPass, setEditCamPass] = useState('');
  const [editCamChannel, setEditCamChannel] = useState('1');
  const [editCamBrand, setEditCamBrand] = useState('hikvision');
  const [editCamStreamMode, setEditCamStreamMode] = useState('live');

  // Amulet Scanner States
  const [scannerMode, setScannerMode] = useState('upload'); // 'upload', 'webcam'
  const [webcamStream, setWebcamStream] = useState(null);
  const [scannedAmuletImage, setScannedAmuletImage] = useState('');
  const [selectedTargetSlotId, setSelectedTargetSlotId] = useState('VIP1');
  const [slotsList, setSlotsList] = useState({});

  useEffect(() => {
    setCameras(db.getCameras());
    setCctvAlerts(db.getCctvAlerts());
    setSlotsList(db.getSlots());
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const mockAmulets = [
    {
      id: 'm1',
      name: 'ຫຼຽນຫຼວງພໍ່ພັດ ວັດຫ້ວຍດ້ວນ (ຫຼຽນຮູບໄຂ່)',
      shape: 'ຮູບໄຂ່ (Oval)',
      dims: 'ກວ້າງ 2.5cm x ສູງ 3.8cm x ໜາ 0.5cm',
      suggestedFrame: 'ຂອບເງິນແທ້ ເບີ 8 (ຊຸ້ມກໍ)',
      priceEst: 510000,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'm2',
      name: 'ພຣະສົມເດັດ ວັດລະຄັງ (ຮູບຊົງສີ່ຫຼ່ຽມ)',
      shape: 'ສີ່ຫຼ່ຽມ (Square)',
      dims: 'ກວ້າງ 2.2cm x ສູງ 3.5cm x ໜາ 0.6cm',
      suggestedFrame: 'ຂອບຄຳແທ້ 90% ເບີ 14 (ລາຍໄທ)',
      priceEst: 2860000,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'm3',
      name: 'ພຣະນາງພະຍາ (ຮູບຊົງສາມຫຼ່ຽມ)',
      shape: 'ສາມຫຼ່ຽມ (Triangle)',
      dims: 'ກວ້າງ 2.0cm x ສູງ 3.0cm x ໜາ 0.4cm',
      suggestedFrame: 'ຂອບອາຄຣີລິກໃສອັດກັນນ້ຳ ເບີ 3',
      priceEst: 80000,
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=60'
    }
  ];

  useEffect(() => {
    // Generate AI intelligence alerts based on current inventory
    const products = db.getProducts();
    const lowStock = products.filter(p => !db.isServiceCategory(p.category) && p.stock <= p.minStock);
    const alerts = [];

    if (lowStock.length > 0) {
      alerts.push({
        id: 'a1',
        type: 'danger',
        title: '⚠️ ວິກິດສະຕັອກສິນຄ້າຂາດແຄນ',
        desc: `ພົບສິນຄ້າ ${lowStock.length} ລາຍການທີ່ຕໍ່າກວ່າເກນຄວາມປອດໄພ. AI ຄາດການວ່າ ຂອບຄຳແທ້ 90% ຈະໝົດສະຕັອກພາຍໃນ 3 ວັນ ຖ້າຍອດອັດກອບຍັງຄົງທີ.`
      });
    }

    // Static intelligent predictions
    alerts.push({
      id: 'a2',
      type: 'warning',
      title: '📈 ຄາດການຄວາມຕ້ອງການ (Demand Forecast)',
      desc: 'ອາທິດໜ້າຄາດວ່າຈະມີລູກຄ້ານຳພຣະເຄື່ອງຮູບຊົງ "ສີ່ຫຼ່ຽມສົມເດັດ" ມາອັດກອບເພີ່ມຂຶ້ນ 35% ເນື່ອງຈາກມີງານບຸນໃຫຍ່ໃນທ້ອງຖິ່ນ. ແນະນຳໃຫ້ຊ່າງກຽມແຜ່ນອາຄຣີລິກເລນໜາໄວ້ລ່ວງໜ້າ.'
    });

    alerts.push({
      id: 'a3',
      type: 'info',
      title: '💡 ຄໍາແນະນໍາການເພີ່ມຍອດຂາຍ',
      desc: 'ສ້ອຍສະແຕນເລດລາຍກະດູກງູ ບໍ່ມີການເຄື່ອນໄຫວມາແລ້ວ 45 ວັນ. ແນະນຳໃຫ້ຈັດໂປຣໂມຊັ່ນ "ຊື້ຂອບພຣະແຖມສ່ວນຫຼຸດສ້ອຍຄໍ 15%" ເພື່ອລະບາຍສະຕັອກ.'
    });

    setAiAlerts(alerts);
    setAuditLogs(db.getAuditLogs());
  }, []);

  const startScan = (mockId) => {
    const selected = mockAmulets.find(m => m.id === mockId);
    if (!selected) return;

    setSelectedMockImg(selected.image);
    setScanning(true);
    setScanResult(null);

    // Simulated network scanner delay
    setTimeout(() => {
      setScanning(false);
      setScanResult(selected);
    }, 3000);
  };

  const runAuditAnalysis = () => {
    setReAnalyzing(true);
    setTimeout(() => {
      setReAnalyzing(false);
      setAuditLogs(db.getAuditLogs());
    }, 2000);
  };

  const handleClearLogs = () => {
    if (confirm('ທ່ານຕ້ອງການລຶບບັນທຶກເຫດການກວດສອບທັງໝົດແທ້ບໍ່?')) {
      db.clearAuditLogs();
      setAuditLogs([]);
    }
  };

  const handleAddCamera = (e) => {
    e.preventDefault();
    if (!newCamName.trim()) return;
    let url = newCamUrl.trim();
    if (newCamType === 'nvr' || newCamType === 'dvr') {
      if (newCamBrand === 'hikvision') {
        url = `rtsp://${newCamUser}:${newCamPass}@${newCamHost}:${newCamPort}/Streaming/Channels/${newCamChannel}01`;
      } else if (newCamBrand === 'dahua') {
        url = `rtsp://${newCamUser}:${newCamPass}@${newCamHost}:${newCamPort}/cam/realmonitor?channel=${newCamChannel}&subtype=0`;
      } else {
        url = `rtsp://${newCamUser}:${newCamPass}@${newCamHost}:${newCamPort}/h264/ch${newCamChannel}/main`;
      }
    }
    db.addCamera({
      name: newCamName.trim(),
      url: url,
      type: newCamType,
      checks: newCamChecks,
      host: newCamHost.trim(),
      port: newCamPort.trim(),
      username: newCamUser.trim(),
      password: newCamPass.trim(),
      channel: newCamChannel,
      brand: newCamBrand,
      streamMode: newCamStreamMode
    });
    setNewCamName('');
    setNewCamUrl('');
    setNewCamType('ip');
    setNewCamHost('');
    setNewCamPort('554');
    setNewCamUser('admin');
    setNewCamPass('');
    setNewCamChannel('1');
    setNewCamBrand('hikvision');
    setNewCamStreamMode('live');
    setNewCamChecks({ intruder: true, cashierAudit: false, slacking: false });
    setCameras(db.getCameras());
    db.addAuditLog('add_camera', `ເພີ່ມກ້ອງວົງຈອນປິດໃໝ່: "${newCamName.trim()}"`);
  };

  const handleDeleteCamera = (id, name) => {
    if (confirm('ທ່ານຕ້ອງການລຶບກ້ອງວົງຈອນປິດນີ້ແທ້ບໍ່?')) {
      db.deleteCamera(id);
      setCameras(db.getCameras());
      db.addAuditLog('delete_camera', `ລຶບກ້ອງວົງจອນປິດ: "${name}"`, 'warning');
    }
  };

  const handleStartEdit = (cam) => {
    setEditingCameraId(cam.id);
    setEditCamName(cam.name);
    setEditCamUrl(cam.url || '');
    setEditCamType(cam.type || 'ip');
    setEditCamHost(cam.host || '');
    setEditCamPort(cam.port || '554');
    setEditCamUser(cam.username || 'admin');
    setEditCamPass(cam.password || '');
    setEditCamChannel(cam.channel || '1');
    setEditCamBrand(cam.brand || 'hikvision');
    setEditCamStreamMode(cam.streamMode || 'live');
  };

  const handleSaveEdit = (cam) => {
    if (!editCamName.trim()) return;
    let url = editCamUrl.trim();
    if (editCamType === 'nvr' || editCamType === 'dvr') {
      if (editCamBrand === 'hikvision') {
        url = `rtsp://${editCamUser}:${editCamPass}@${editCamHost}:${editCamPort}/Streaming/Channels/${editCamChannel}01`;
      } else if (editCamBrand === 'dahua') {
        url = `rtsp://${editCamUser}:${editCamPass}@${editCamHost}:${editCamPort}/cam/realmonitor?channel=${editCamChannel}&subtype=0`;
      } else {
        url = `rtsp://${editCamUser}:${editCamPass}@${editCamHost}:${editCamPort}/h264/ch${editCamChannel}/main`;
      }
    }
    const updated = {
      ...cam,
      name: editCamName.trim(),
      url: url,
      type: editCamType,
      host: editCamHost.trim(),
      port: editCamPort.trim(),
      username: editCamUser.trim(),
      password: editCamPass.trim(),
      channel: editCamChannel,
      brand: editCamBrand,
      streamMode: editCamStreamMode
    };
    db.updateCamera(updated);
    setCameras(db.getCameras());
    setEditingCameraId(null);
    db.addAuditLog('edit_camera', `ແກ້ໄຂການຕັ້ງຄ່າກ້ອງວົງຈອນປິດ: "${editCamName.trim()}"`);
  };
  // Scanner Webcams & Snaps
  const startScannerWebcam = async () => {
    setScannerMode('webcam');
    setScanResult(null);
    setScannedAmuletImage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setWebcamStream(stream);
      setTimeout(() => {
        if (videoScanRef.current) {
          videoScanRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing webcam for scanning:", err);
      alert("ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງເວັບແຄມໄດ້!");
      setScannerMode('upload');
    }
  };

  const stopScannerWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
    }
  };

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [webcamStream]);

  const handleSnapAndScan = () => {
    if (videoScanRef.current && canvasScanRef.current) {
      const video = videoScanRef.current;
      const canvas = canvasScanRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setScannedAmuletImage(dataUrl);
      stopScannerWebcam();
      runAmuletAiAnalysis(dataUrl);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScannedAmuletImage(event.target.result);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartFileScan = () => {
    if (!scannedAmuletImage) return;
    runAmuletAiAnalysis(scannedAmuletImage);
  };

  const drawEdgeContour = (imgSrc) => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = canvasScanRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth || 320;
      canvas.height = img.naturalHeight || 240;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        const edges = new Uint8Array(width * height);
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const pixel = (data[idx] + data[idx+1] + data[idx+2]) / 3;
            const rIdx = (y * width + (x + 1)) * 4;
            const rPixel = (data[rIdx] + data[rIdx+1] + data[rIdx+2]) / 3;
            const bIdx = ((y + 1) * width + x) * 4;
            const bPixel = (data[bIdx] + data[bIdx+1] + data[bIdx+2]) / 3;
            const diffX = Math.abs(pixel - rPixel);
            const diffY = Math.abs(pixel - bPixel);
            edges[y * width + x] = (diffX + diffY) > 25 ? 255 : 0;
          }
        }
        
        let sweepY = 0;
        const interval = setInterval(() => {
          const cv = canvasScanRef.current;
          if (!cv) {
            clearInterval(interval);
            return;
          }
          const c = cv.getContext('2d');
          c.clearRect(0, 0, cv.width, cv.height);
          c.globalAlpha = 0.5;
          c.drawImage(img, 0, 0, cv.width, cv.height);
          c.globalAlpha = 1.0;
          
          c.strokeStyle = '#d4af37';
          c.lineWidth = 3;
          c.shadowColor = '#d4af37';
          c.shadowBlur = 10;
          c.beginPath();
          c.moveTo(0, sweepY);
          c.lineTo(cv.width, sweepY);
          c.stroke();
          c.shadowBlur = 0;
          
          c.fillStyle = '#2ecc71';
          for (let y = 1; y < sweepY; y++) {
            for (let x = 1; x < width; x++) {
              if (edges[y * width + x] === 255) {
                c.fillRect(x, y, 1.5, 1.5);
              }
            }
          }
          
          sweepY += Math.ceil(height / 30);
          if (sweepY >= height) {
            clearInterval(interval);
            c.clearRect(0, 0, cv.width, cv.height);
            c.drawImage(img, 0, 0, cv.width, cv.height);
            c.fillStyle = 'rgba(212, 175, 55, 0.8)';
            for (let y = 1; y < height; y++) {
              for (let x = 1; x < width; x++) {
                if (edges[y * width + x] === 255) {
                  c.fillRect(x, y, 1.5, 1.5);
                }
              }
            }
          }
        }, 50);
      } catch (err) {
        console.error("Canvas read error:", err);
      }
    };
  };

  const runAmuletAiAnalysis = (imgSrc) => {
    setScanning(true);
    setScanResult(null);
    
    setTimeout(() => {
      drawEdgeContour(imgSrc);
    }, 100);

    setTimeout(() => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        const aspect = img.width / img.height;
        let shapeName = 'ຮູບຊົງສີ່ຫຼ່ຽມ (Square)';
        let shapeCode = 'Square';
        let suggestedFrame = 'ຂອບຄຳແທ້ 90% ເບີ 14 (ລາຍໄທ)';
        let dims = 'ກວ້າງ 2.5cm x ສູງ 3.5cm x ໜາ 0.6cm';
        let priceEst = 2800000;
        
        if (aspect > 1.3) {
          shapeName = 'ຮູບຊົງແນວນອນ (Wide)';
          shapeCode = 'Wide';
          suggestedFrame = 'ຂອບອາຄຣີລິກໃສອັດກັນນ້ຳ ເບີ 3';
          dims = 'ກວ້າງ 4.0cm x ສູງ 2.2cm x ໜາ 0.5cm';
          priceEst = 120000;
        } else if (aspect < 0.75) {
          shapeName = 'ຮູບຊົງຢອດນ້ຳ / ໄຂ່ສູງ (Teardrop)';
          shapeCode = 'Teardrop';
          suggestedFrame = 'ຂອບເງິນແທ້ ເບີ 8 (ຊຸ້ມກໍ)';
          dims = 'ກວ້າງ 2.0cm x ສູງ 3.8cm x ໜາ 0.5cm';
          priceEst = 510000;
        } else if (aspect >= 0.75 && aspect < 0.95) {
          shapeName = 'ຮູບຊົງໄຂ່ (Oval)';
          shapeCode = 'Oval';
          suggestedFrame = 'ຂອບເງິນແທ້ ເບີ 10 (ລາຍດອກໄມ້)';
          dims = 'ກວ້າງ 2.4cm x ສູງ 3.0cm x ໜາ 0.5cm';
          priceEst = 480000;
        } else if (aspect >= 0.95 && aspect <= 1.15) {
          shapeName = 'ຮູບຊົງກົມ (Round)';
          shapeCode = 'Round';
          suggestedFrame = 'ຂອບຜ່າຫວາຍສະແຕນເລດ ເບີ 5';
          dims = 'ກວ້າງ 3.0cm x ສູງ 3.0cm x ໜາ 0.4cm';
          priceEst = 85000;
        }

        const amuletName = 'ພຣະເຄື່ອງກວດພົບ [' + shapeCode + '] (' + new Date().toLocaleTimeString('lo-LA') + ')';
        
        setScanResult({
          name: amuletName,
          shape: shapeName,
          dims: dims,
          suggestedFrame: suggestedFrame,
          priceEst: priceEst,
          image: imgSrc
        });
        setScanning(false);
      };
      
      img.onerror = () => {
        setScanResult({
          name: 'ພຣະເຄື່ອງຈຳລອງ (Mock Amulet)',
          shape: 'ຮູບຊົງສາມຫຼ່ຽມ (Triangle)',
          dims: 'ກວ້າງ 2.0cm x ສູງ 3.0cm x ໜາ 0.4cm',
          suggestedFrame: 'ຂອບອາຄຣີລິກໃສອັດກັນນ້ຳ ເບີ 3',
          priceEst: 80000,
          image: imgSrc
        });
        setScanning(false);
      };
    }, 2500);
  };

  const handleAddToPOSCart = () => {
    if (!scanResult) return;
    const currentSlots = db.getSlots();
    const targetSlot = currentSlots[selectedTargetSlotId];
    const serviceCat = db.getCategories().find(c => c.type === 'service') || { id: 'services' };
    if (targetSlot) {
      targetSlot.items.push({
        productId: 'custom_ai_' + Date.now(),
        name: scanResult.name + ' (' + scanResult.shape.split(' ')[0] + ')',
        price: scanResult.priceEst,
        qty: 1,
        total: scanResult.priceEst,
        category: serviceCat.id
      });
      targetSlot.amuletImage = scanResult.image;
      
      db.saveSlots(currentSlots);
      db.addAuditLog('add_to_cart', `ເພີ່ມສິນຄ້າອັດກອບ AI "${scanResult.name}" ເຂົ້າໃນບັດຄິວ "${targetSlot.label}"`);
      alert(`ເພີ່ມເຂົ້າໃນບັດຄິວ "${targetSlot.label}" ສຳເລັດແລ້ວ! ທ່ານສາມາດໄປທີ່ໜ້າຂາຍ (POS) ເພື່ອເບິ່ງ ແລະ ອອກບິນ.`);
    }
  };

  const handleCreateFramingJob = () => {
    if (!scanResult) return;
    
    db.addFramingJob({
      customerName: 'ລູກຄ້າສະແກນ AI',
      customerPhone: '020-XXXX-XXXX',
      amuletDescription: scanResult.name,
      frameTypeId: 'custom_ai',
      frameTypeName: scanResult.suggestedFrame,
      totalPrice: scanResult.priceEst,
      deposit: 0,
      balance: scanResult.priceEst,
      technicianId: 'technician',
      notes: `ຮູບຊົງ: ${scanResult.shape}, ຂະໜາດ: ${scanResult.dims}. ກວດສອບອັດຕະໂນມັດໂດຍ AI.`,
      amuletImage: scanResult.image
    });

    db.addAuditLog('create_job_ai', `ສ້າງງານອັດກອບໃໝ່ຈາກການສະແກນ AI: "${scanResult.name}"`);
    alert(`ສ້າງໃບສັ່ງງານອັດກອບ ສຳເລັດແລ້ວ! ງານນີ້ຈະສະແດງໃນໜ້າ "ງານອັດກອບ (Framing)" ຂອງຊ່າງ.`);
  };

  const handleToggleCheck = (cam, checkKey) => {
    const updated = {
      ...cam,
      checks: {
        ...cam.checks,
        [checkKey]: !cam.checks[checkKey]
      }
    };
    db.updateCamera(updated);
    setCameras(db.getCameras());
  };

  const handleToggleCamera = (cam) => {
    const updated = { ...cam, active: !cam.active };
    db.updateCamera(updated);
    setCameras(db.getCameras());
  };

  const handleResolveAlert = (id) => {
    db.resolveCctvAlert(id);
    setCctvAlerts(db.getCctvAlerts());
  };

  // Calculate stats
  const getAuditStats = () => {
    let score = 8; // base risk
    let flaggedCount = 0;
    let pinFails = 0;
    let manualDrawers = 0;
    let discounts = 0;

    auditLogs.forEach(log => {
      if (log.type === 'failed_pin') {
        score += 15;
        flaggedCount++;
        pinFails++;
      } else if (log.type === 'open_drawer') {
        if (log.description.includes('ດ້ວຍມື')) {
          score += 25;
          flaggedCount++;
          manualDrawers++;
        }
      } else if (log.type === 'discount_applied') {
        score += 5;
        discounts++;
      }
    });

    score = Math.min(100, score);
    let level = 'ຕ່ຳ (Low)';
    let color = 'var(--success-green)';
    if (score > 60) {
      level = 'ສູງ (High Risk)';
      color = 'var(--alert-red)';
    } else if (score > 25) {
      level = 'ປານກາງ (Medium)';
      color = 'var(--accent-amber)';
    }

    return {
      riskScore: score,
      riskLevel: level,
      flaggedEvents: flaggedCount,
      color,
      pinFails,
      manualDrawers,
      discounts
    };
  };

  const stats = getAuditStats();

  const filteredLogs = auditLogs.filter(log => 
    log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.type.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ color: 'var(--gold-primary)' }}>🤖 ລະບົບ AI ອັດສະລິຍະ (AI Assistant & Scanner)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>AI ວິເຄາະຮູບຊົງພຣະເຄື່ອງ, ຄາດການສະຖິຕິຮ້ານ, ແລະ ກວດສອບຄວາມສ່ຽງຖືກໂກງຂອງພະນັກງານຂາຍ</p>
      </div>

      {/* Main Tabs */}
      <div className="nav-tabs" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {hasAiPermission('aiChat') && (
        <button
          className={`nav-tab ${activeTab === 'scanner' ? 'active' : ''}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px', borderRadius: '20px' }}
          onClick={() => setActiveTab('scanner')}
        >
          📷 ສະແກນພຣະເຄື່ອງ
        </button>
        )}
        {hasAiPermission('aiAnalyze') && (
        <button
          className={`nav-tab ${activeTab === 'forecasts' ? 'active' : ''}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px', borderRadius: '20px' }}
          onClick={() => setActiveTab('forecasts')}
        >
          📊 ແຈ້ງເຕືອນ & ຄາດການຍອດຂາຍ
        </button>
        )}
        {hasAiPermission('aiAnalyze') && (
        <button
          className={`nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px', borderRadius: '20px' }}
          onClick={() => { setActiveTab('audit'); setAuditLogs(db.getAuditLogs()); }}
        >
          🛡️ ກວດສອບພະນັກງານ & ຄວາມສ່ຽງໂກງ
        </button>
        )}
        {hasAiPermission('aiChat') && (
        <button
          className={`nav-tab ${activeTab === 'cctv' ? 'active' : ''}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px', borderRadius: '20px' }}
          onClick={() => { setActiveTab('cctv'); setCameras(db.getCameras()); setCctvAlerts(db.getCctvAlerts()); }}
        >
          📹 ກ້ອງວົງຈອນປິດ & ເຕືອນໄພ (CCTV)
        </button>
        )}
        <button
          className={`nav-tab ${activeTab === 'image_editor' ? 'active' : ''}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px', borderRadius: '20px' }}
          onClick={() => setActiveTab('image_editor')}
        >
          🎨 ແຕ່ງຮູບພຣະເຄື່ອງ (AI Editor)
        </button>
      </div>

      {/* TAB 1: AMULET CAMERA SCANNER */}
      {activeTab === 'scanner' && (
        <div className="animate-fade-in ai-grid-scanner">
          {/* Left Column: AI Camera Scanner */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              🔍 ກວດຫາຮູບຊົງ & ແນະນຳຂອບ (Amulet Shape Detector)
            </h3>

            {/* Mode selector */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn"
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '0.85rem',
                  background: scannerMode === 'upload' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                  color: scannerMode === 'upload' ? 'black' : 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  stopScannerWebcam();
                  setScannerMode('upload');
                  setScanResult(null);
                }}
              >
                📁 ອັບໂຫຼດຮູບພາບ (Upload File)
              </button>
              <button
                className="btn"
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '0.85rem',
                  background: scannerMode === 'webcam' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                  color: scannerMode === 'webcam' ? 'black' : 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={startScannerWebcam}
              >
                📷 ສະແກນດ້ວຍກ້ອງ (Webcam Scan)
              </button>
            </div>

            {/* Scan Area Frame */}
            <div className="ai-scan-area" style={{ height: '320px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080706', border: '2px dashed var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              {scanning && <div className="scan-laser" style={{ position: 'absolute', width: '100%', height: '3px', background: 'var(--gold-primary)', top: 0, left: 0, animation: 'scan 1.5s infinite linear', boxShadow: '0 0 10px var(--gold-glow)', zIndex: 4 }}></div>}
              
              {scannerMode === 'webcam' && webcamStream && !scannedAmuletImage && (
                <video
                  ref={videoScanRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              {scannedAmuletImage ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={scannedAmuletImage}
                    alt="Scan Target Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: scanning ? 0.4 : 1 }}
                  />
                  <canvas
                    ref={canvasScanRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', zIndex: 3 }}
                  />
                </div>
              ) : (
                scannerMode === 'upload' && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                    <span style={{ fontSize: '3rem' }}>📁</span>
                    <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>ກະລຸນາເລືອກໄຟລ໌ຮູບພຣະເຄື່ອງ ຫຼື ລາກວາງທີ່ນີ້</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--gold-primary)', cursor: 'pointer' }}
                    />
                  </div>
                )
              )}

              {!webcamStream && !scannedAmuletImage && scannerMode === 'webcam' && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '3rem' }}>📷</span>
                  <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>ກຳລັງເປີດໃຊ້ງານກ້ອງ...</p>
                </div>
              )}

              {scanning && (
                <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.85)', padding: '10px 20px', borderRadius: '20px', color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid var(--gold-primary)', zIndex: 5 }}>
                  🤖 AI ກຳລັງວິເຄາະຮູບຊົງ & ປະມວນຜົນຂອບ...
                </div>
              )}
            </div>

            {/* Capture controls */}
            {scannerMode === 'webcam' && webcamStream && !scannedAmuletImage && (
              <button
                className="btn btn-primary"
                onClick={handleSnapAndScan}
                style={{ padding: '10px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                📸 ຖ່າຍຮູບ ແລະ ວິເຄາະ (Snap & Analyze)
              </button>
            )}

            {scannerMode === 'upload' && scannedAmuletImage && !scanning && !scanResult && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleStartFileScan}
                  style={{ flex: 2, padding: '10px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  ⚡ ເລີ່ມວິເຄາະດ້ວຍ AI (Run AI Scan)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setScannedAmuletImage('')}
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  ລ້າງຮູບ
                </button>
              </div>
            )}

            {/* AI Scan Output Result */}
            {scanResult && !scanning && (
              <div className="animate-fade-in" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1.5px solid var(--gold-primary)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', fontWeight: 'bold', margin: 0 }}>✓ ຜົນການວິເຄາະໂດຍ AI (AI Analysis Complete)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', fontSize: '0.85rem', rowGap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ຊື່ພຣະເຄື່ອງ:</span>
                  <span style={{ fontWeight: 'bold' }}>{scanResult.name}</span>

                  <span style={{ color: 'var(--text-secondary)' }}>ຮູບຊົງພຣະເຄື່ອງ:</span>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>{scanResult.shape}</span>

                  <span style={{ color: 'var(--text-secondary)' }}>ຂະໜາດທີ່ວັດໄດ້:</span>
                  <span>{scanResult.dims}</span>

                  <span style={{ color: 'var(--text-secondary)' }}>ຂອບແນະນຳ:</span>
                  <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>{scanResult.suggestedFrame}</span>

                  <span style={{ color: 'var(--text-secondary)' }}>ປະເມີນຄ່າບໍລິການ:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{scanResult.priceEst.toLocaleString()} ກີບ</span>
                </div>
                
                {/* Integration Actions */}
                <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ເລືອກບັດຄິວ POS:</label>
                    <select
                      className="form-control"
                      value={selectedTargetSlotId}
                      onChange={(e) => setSelectedTargetSlotId(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.8rem', width: '150px', background: '#111', color: 'white', border: '1px solid var(--border-color)', margin: 0 }}
                    >
                      {Object.keys(slotsList).map(slotId => (
                        <option key={slotId} value={slotId}>{slotsList[slotId].label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddToPOSCart}
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ➕ ເພີ່ມໃສ່ກະຕ່າ POS (Add to Cart)
                    </button>
                    <button
                      className="btn"
                      onClick={handleCreateFramingJob}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        background: 'rgba(39, 174, 96, 0.1)',
                        color: 'var(--success-green)',
                        border: '1px solid rgba(39, 174, 96, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      🛠️ ສ້າງໃບສັ່ງງານອັດກອບ (Framing Job)
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '8px' }}>
                  * AI ແນະນຳຂະໜາດຂອບທີ່ພໍດີຫຼັງຈາກຫັກລົບຄວາມໜາຂອງເລນອັດກັນນ້ຳ 2.5 ມິນລີແມັດແລ້ວ.
                </div>
              </div>
            )}
          </div>

          {/* Right Column details */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px' }}>
            <span style={{ fontSize: '4rem' }}>📿</span>
            <h3 style={{ color: 'var(--gold-primary)' }}>AI Shape-to-Frame Autofill</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '360px' }}>
              ເມື່ອເຊື່ອມຕໍ່ກ້ອງກວດຈັບ, AI ຈະຖ່າຍຮູບແລະວັດແທກຂະໜາດອັດຕະໂນມັດ, ຈາກນັ້ນຈະຕື່ມຂໍ້ມູນຂອບທີ່ເໝາະສົມໃສ່ບັດຄິວທັນທີເພື່ອປະຢັດເວລາຊ່າງ ແລະ ພະນັກງານຂາຍ.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: FORECASTS AND ALERTS */}
      {activeTab === 'forecasts' && (
        <div className="animate-fade-in ai-grid-forecasts">
          {/* AI Forecasting Module */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              🔮 ຄາດການຍອດອັດກອບອາທິດໜ້າ (Weekly Workload Forecast)
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(212, 175, 55, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--gold-primary)', border: '1.5px solid var(--gold-primary)', flexShrink: 0 }}>
                {forecastCount}
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'white' }}>ຄາດການຍອດຮັບອັດກອບ: {forecastCount} ອົງ</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  ຄຳນວນຈາກສະຖິຕິຍ້ອນຫຼັງ 30 ວັນ, ທ່າອ່ຽງຄວາມນິຍົມ, ແລະ ປັດໄຈວັນພຣະ.
                </p>
              </div>
            </div>

            {/* Smart mini bar chart */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                {[
                  { day: 'ຈັນ', count: 5, active: false },
                  { day: 'ອັງຄານ', count: 4, active: false },
                  { day: 'ພຸດ', count: 8, active: true },
                  { day: 'ພະຫັດ', count: 6, active: false },
                  { day: 'ສຸກ', count: 7, active: false },
                  { day: 'ເສົາ', count: 10, active: true },
                  { day: 'ອາທິດ', count: 8, active: false }
                ].map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '0.65rem', color: d.active ? 'var(--gold-primary)' : 'var(--text-secondary)', marginBottom: '2px' }}>{d.count}</span>
                    <div
                      style={{
                        width: '14px',
                        height: `${d.count * 8}px`,
                        background: d.active ? 'var(--gold-primary)' : 'rgba(255,255,255,0.08)',
                        borderRadius: '3px 3px 0 0',
                        boxShadow: d.active ? '0 0 6px var(--gold-glow)' : 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{d.day}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>
                * AI ຄາດການວັນພຸດ ແລະ ວັນເສົາ ຈະມີລູກຄ້າມາຮັບບໍລິການຫຼາຍທີ່ສຸດ (Peak Days)
              </p>
            </div>
          </div>

          {/* AI Supply Chain alerts */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              📊 AI ແຈ້ງເຕືອນ & ວິເຄາະສະຕັອກ (AI Supply Chain Monitor)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '280px' }}>
              {aiAlerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: 
                      alert.type === 'danger' ? 'rgba(231, 76, 60, 0.08)' :
                      alert.type === 'warning' ? 'rgba(243, 156, 18, 0.08)' :
                      'rgba(52, 152, 219, 0.08)',
                    borderLeft: `4px solid ${
                      alert.type === 'danger' ? 'var(--alert-red)' :
                      alert.type === 'warning' ? 'var(--accent-amber)' :
                      '#3498db'
                    }`,
                    border: `1px solid ${
                      alert.type === 'danger' ? 'rgba(231, 76, 60, 0.15)' :
                      alert.type === 'warning' ? 'rgba(243, 156, 18, 0.15)' :
                      'rgba(52, 152, 219, 0.15)'
                    }`
                  }}
                >
                  <h4 style={{
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: 
                      alert.type === 'danger' ? 'var(--alert-red)' :
                      alert.type === 'warning' ? 'var(--accent-amber)' :
                      '#3498db'
                  }}>
                    {alert.title}
                  </h4>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.35' }}>{alert.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE AUDIT & RISK ANALYSIS */}
      {activeTab === 'audit' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="ai-grid-audit">
            
            {/* Risk Index Ring Meter */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', width: '100%', textAlign: 'left' }}>
                🛡️ ດັດສະນີຄວາມສ່ຽງການທຸຈະລິດ (Employee Fraud Risk Index)
              </h3>

              {reAnalyzing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 1s infinite linear' }}></div>
                  <p style={{ marginTop: '16px', color: 'var(--gold-primary)', fontWeight: 'bold' }}>AI ກຳລັງກວດສອບບັນທຶກຄວາມຜິດປົກກະຕິ...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '16px 0', width: '100%', justifyContent: 'space-around' }}>
                  {/* Circular Dial */}
                  <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(closest-side, #12100d 80%, transparent 84% 100%), conic-gradient(${stats.color} ${stats.riskScore}%, rgba(255,255,255,0.05) 0)`, borderRadius: '50%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{stats.riskScore}%</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ລະດັບຄວາມສ່ຽງ</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ລະດັບຄວາມສ່ຽງ:</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stats.color }}>{stats.riskLevel}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ພຶດຕິກຳຜິດປົກກະຕິ:</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{stats.flaggedEvents} ຄັ້ງ</div>
                    </div>
                    
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', marginTop: '8px' }} onClick={runAuditAnalysis}>
                      🔄 ເລີ່ມວິເຄາະບັນທຶກຄວາມສ່ຽງ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Fraud Flags Detection details */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                🔎 ປັດໄຈທີ່ AI ກວດພົບ (AI Fraud Risk Flags)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '200px' }}>
                {stats.pinFails > 0 && (
                  <div style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.2)', borderLeft: '4px solid var(--alert-red)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--alert-red)', fontWeight: 'bold', marginBottom: '2px' }}>⚠️ ພະຍາຍາມລົບສິນຄ້າໂດຍໃສ່ PIN ຜິດ ({stats.pinFails} ຄັ້ງ)</div>
                    <p style={{ color: 'var(--text-primary)' }}>ພະນັກງານພະຍາຍາມລົບລາຍການສິນຄ້າອອກຈາກບິນ ແຕ່ໃສ່ລະຫັດແອດມິນບໍ່ຖືກຕ້ອງ. ຄວນກວດສອບວ່າມີການພະຍາຍາມແກ້ໄຂບິນເພື່ອໂກງເງິນລູກຄ້າຫຼືບໍ່.</p>
                  </div>
                )}

                {stats.manualDrawers > 0 && (
                  <div style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.2)', borderLeft: '4px solid var(--alert-red)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--alert-red)', fontWeight: 'bold', marginBottom: '2px' }}>🚨 ເປີດລິ້ນຊັກເປີດດ້ວຍມື ({stats.manualDrawers} ຄັ້ງ)</div>
                    <p style={{ color: 'var(--text-primary)' }}>ມີການເປີດລິ້ນຊັກເກັບເງິນດ້ວຍມືໂດຍບໍ່ໄດ້ເກີດຈາກການຂາຍ/ອອກບິນສົດ (Manual release). ລະບົບ AI ແນະນຳໃຫ້ກວດສອບກ້ອງວົງຈອນປິດຕາມເວລາໃນບັນທຶກ.</p>
                  </div>
                )}

                {stats.discounts > 0 && (
                  <div style={{ background: 'rgba(243, 156, 18, 0.08)', border: '1px solid rgba(243, 156, 18, 0.2)', borderLeft: '4px solid var(--accent-amber)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--accent-amber)', fontWeight: 'bold', marginBottom: '2px' }}>💡 ມີການໃຊ້ສ່ວນຫຼຸດພິເສດ ({stats.discounts} ຄັ້ງ)</div>
                    <p style={{ color: 'var(--text-primary)' }}>ມີການກົດໃຫ້ສ່ວນຫຼຸດ (%) ກັບລູກຄ້າ. ໃຫ້ແນ່ໃຈວ່າເປັນໂປຣໂມຊັ່ນຂອງທາງຮ້ານ ແລະ ບໍ່ແມ່ນການຕັ້ງສ່ວນຫຼຸດເອງຂອງພະນັກງານຂາຍ.</p>
                  </div>
                )}

                {stats.flaggedEvents === 0 && (
                  <div style={{ background: 'rgba(39, 174, 96, 0.08)', border: '1px solid rgba(39, 174, 96, 0.2)', borderLeft: '4px solid var(--success-green)', padding: '20px', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center', color: 'var(--success-green)', fontWeight: 'bold' }}>
                    ✓ ບໍ່ພົບສັນຍານການທຸຈະລິດ ຫຼື ພຶດຕິກຳຜິດປົກກະຕິຈາກພະນັກງານຂາຍ
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Audit Logs Table */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem' }}>
                📋 ບັນທຶກເຫດການກວດສອບຄວາມປອດໄພ (Security Audit Logs)
              </h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="🔍 ຄົ້ນຫາບັນທຶກ..."
                  className="form-control"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', width: '200px', margin: 0 }}
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--alert-red)', borderColor: 'var(--alert-red)' }} onClick={handleClearLogs}>
                  🗑️ ລ້າງບັນທຶກ
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table-premium" style={{ width: '100%', marginTop: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px' }}>ວັນເວລາ (Timestamp)</th>
                    <th style={{ padding: '10px' }}>ພະນັກງານ (User)</th>
                    <th style={{ padding: '10px' }}>ປະເພດເຫດການ (Event)</th>
                    <th style={{ padding: '10px' }}>ລາຍລະອຽດ (Description)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ລະດັບຄວາມປອດໄພ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>ບໍ່ພົບບັນທຶກເຫດການ</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const badgeColor = 
                        log.severity === 'danger' ? 'var(--alert-red)' :
                        log.severity === 'warning' ? 'var(--accent-amber)' :
                        '#3498db';
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>
                            {log.userName}
                          </td>
                          <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                            {log.type}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-primary)' }}>
                            {log.description}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', background: `rgba(${log.severity === 'danger' ? '231,76,60' : log.severity === 'warning' ? '243,156,18' : '52,152,219'}, 0.1)`, border: `1px solid ${badgeColor}`, color: badgeColor }}>
                              {log.severity.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: CCTV SURVEILLANCE & ALERTS */}
      {activeTab === 'cctv' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Camera Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {cameras.map((cam, idx) => {
              const isEditing = editingCameraId === cam.id;
              return (
                <div key={cam.id} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                  
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>ຊື່ກ້ອງ:</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editCamName}
                          onChange={(e) => setEditCamName(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>ປະເພດກ້ອງ (Camera Type):</label>
                        <select
                          className="form-control"
                          value={editCamType}
                          onChange={(e) => setEditCamType(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0, background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        >
                          <option value="ip">🌐 IP Camera</option>
                          <option value="nvr">💾 NVR</option>
                          <option value="dvr">📼 DVR</option>
                        </select>
                      </div>

                      {editCamType === 'ip' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>URL / IP Stream (ພິມ 'webcam' ເພື່ອໃຊ້ກ້ອງຈິງ):</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editCamUrl}
                            onChange={(e) => setEditCamUrl(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Host / IP Address:</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="192.168.1.100"
                                value={editCamHost}
                                onChange={(e) => setEditCamHost(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Port:</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="554"
                                value={editCamPort}
                                onChange={(e) => setEditCamPort(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Username:</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editCamUser}
                                onChange={(e) => setEditCamUser(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Password:</label>
                              <input
                                type="password"
                                className="form-control"
                                value={editCamPass}
                                onChange={(e) => setEditCamPass(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Channel:</label>
                              <input
                                type="number"
                                min="1"
                                max="32"
                                className="form-control"
                                value={editCamChannel}
                                onChange={(e) => setEditCamChannel(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Brand:</label>
                              <select
                                className="form-control"
                                value={editCamBrand}
                                onChange={(e) => setEditCamBrand(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0, background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                              >
                                <option value="hikvision">Hikvision</option>
                                <option value="dahua">Dahua</option>
                                <option value="general">General</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>View Mode:</label>
                              <select
                                className="form-control"
                                value={editCamStreamMode}
                                onChange={(e) => setEditCamStreamMode(e.target.value)}
                                style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0, background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                              >
                                <option value="live">Live (MJPEG)</option>
                                <option value="webui">Web UI (Iframe)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Live Stream URL Override (Option):</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="http://192.168.1.100/mjpeg_stream"
                              value={editCamUrl}
                              onChange={(e) => setEditCamUrl(e.target.value)}
                              style={{ fontSize: '0.8rem', padding: '4px 8px', width: '100%', margin: 0 }}
                            />
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', flex: 1 }}
                          onClick={() => handleSaveEdit(cam)}
                        >
                          ບັນທຶກ (Save)
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', flex: 1 }}
                          onClick={() => setEditingCameraId(null)}
                        >
                          ຍົກເລີກ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Camera Feed header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          📷 {cam.name}
                          <span 
                            style={{ 
                              fontSize: '0.62rem', 
                              padding: '1px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 'bold',
                              background: cam.type === 'nvr' ? 'rgba(52, 152, 219, 0.15)' : cam.type === 'dvr' ? 'rgba(155, 89, 182, 0.15)' : 'rgba(39, 174, 96, 0.15)',
                              color: cam.type === 'nvr' ? '#3498db' : cam.type === 'dvr' ? '#9b59b6' : '#2ecc71',
                              border: `1px solid ${cam.type === 'nvr' ? 'rgba(52, 152, 219, 0.3)' : cam.type === 'dvr' ? 'rgba(155, 89, 182, 0.3)' : 'rgba(39, 174, 96, 0.3)'}`
                            }}
                          >
                            {(cam.type || 'IP').toUpperCase()}
                          </span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cam.active ? 'var(--success-green)' : 'var(--alert-red)', display: 'inline-block', boxShadow: cam.active ? '0 0 6px var(--success-green)' : 'none' }}></span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {cam.active ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>

                      {/* Feed View */}
                      <div style={{ height: '180px', background: cam.active ? '#080808' : '#000', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <CameraFeed cam={cam} idx={idx} currentTime={currentTime} />
                      </div>

                      {/* Control Panel for Camera */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            className="btn"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              background: cam.active ? 'rgba(231, 76, 60, 0.1)' : 'rgba(39, 174, 96, 0.1)',
                              color: cam.active ? 'var(--alert-red)' : 'var(--success-green)',
                              border: `1px solid ${cam.active ? 'rgba(231,76,60,0.2)' : 'rgba(39,174,96,0.2)'}`,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleToggleCamera(cam)}
                          >
                            {cam.active ? 'ປິດກ້ອງ (Turn Off)' : 'ເປີດກ້ອງ (Turn On)'}
                          </button>
                          
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                              onClick={() => handleStartEdit(cam)}
                            >
                              ⚙️ ແກ້ໄຂ
                            </button>
                            <button
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--alert-red)', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => handleDeleteCamera(cam.id, cam.name)}
                            >
                              ລຶບກ້ອງ
                            </button>
                          </div>
                        </div>

                        {/* AI Checkbox controls */}
                        {cam.active && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', cursor: 'pointer', color: cam.checks.intruder ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                              <input type="checkbox" checked={cam.checks.intruder} onChange={() => handleToggleCheck(cam, 'intruder')} />
                              ບຸກລຸກ (Intruder)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', cursor: 'pointer', color: cam.checks.cashierAudit ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                              <input type="checkbox" checked={cam.checks.cashierAudit} onChange={() => handleToggleCheck(cam, 'cashierAudit')} />
                              ແຄຊເຊຍ (Cashier)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', cursor: 'pointer', color: cam.checks.slacking ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                              <input type="checkbox" checked={cam.checks.slacking} onChange={() => handleToggleCheck(cam, 'slacking')} />
                              ອູ້ງານ (Slacking)
                            </label>
                          </div>
                        )}

                      </div>
                    </>
                  )}

                </div>
              );
            })}
          </div>

          {/* Alarm Center & Configuration Panel */}
          <div className="ai-grid-cctv-panel">
            
            {/* Alarm List */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.02rem', margin: 0 }}>
                  ສູນເຕືອນໄພກ້ອງວົງຈອນປິດ (CCTV Alert & Warning Center)
                </h3>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '15px', border: '1px solid var(--border-color)' }}>
                  {[
                    { id: 'all', name: 'ທັງຫມົດ' },
                    { id: 'unresolved', name: 'ຍັງບໍ່ແກ້ໄຂ' },
                    { id: 'resolved', name: 'ແກ້ໄຂແລ້ວ' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      className="category-tab"
                      style={{ padding: '2px 8px', fontSize: '0.7rem', border: 'none', borderRadius: '12px', background: cctvFilter === opt.id ? 'var(--gold-primary)' : 'transparent', color: cctvFilter === opt.id ? 'black' : 'white' }}
                      onClick={() => setCctvFilter(opt.id)}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px' }}>
                {cctvAlerts.filter(a => {
                  if (cctvFilter === 'unresolved') return !a.resolved;
                  if (cctvFilter === 'resolved') return a.resolved;
                  return true;
                }).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    ✓ ບໍ່ມີການເຕື໅ນໄພທ\u0ec8ຂ\u0eb2\u0e8dໄດ\u0ec9ມື\u0ec9ນ\u0ec5ີ
                  </p>
                ) : (
                  cctvAlerts.filter(a => {
                    if (cctvFilter === 'unresolved') return !a.resolved;
                    if (cctvFilter === 'resolved') return a.resolved;
                    return true;
                  }).map(alert => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        background: alert.resolved ? 'rgba(39, 174, 96, 0.05)' : 'rgba(231, 76, 60, 0.05)',
                        border: `1px solid ${alert.resolved ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)'}`,
                        borderLeft: `4px solid ${alert.resolved ? 'var(--success-green)' : 'var(--alert-red)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          ⏰ {new Date(alert.timestamp).toLocaleString()} | {alert.cameraName}
                        </span>
                        <span style={{ fontWeight: 'bold', color: alert.resolved ? 'var(--success-green)' : 'var(--alert-red)' }}>
                          {alert.typeName}
                        </span>
                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                          {alert.description}
                        </p>
                      </div>
                      
                      {!alert.resolved && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', flexShrink: 0, cursor: 'pointer' }}
                          onClick={() => handleResolveAlert(alert.id, alert.typeName)}
                        >
                          ✓ ແກ້ໄຂແລ້ວ
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Custom Camera Config Panel */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ color: 'var(--gold-primary)', fontSize: '1.02rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                ⚙️ ຕູ້ງຄ່າກ້ງວົງຈຽນປິດ (CCTV Settings)
              </h3>
              
              <form onSubmit={handleAddCamera} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>ຊື່ກ້ອງວົງຈອນປິດ (Camera Label Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ຕົວຢ່າງ: ກ້ອງ 05: ໂຊນຫຼັງຮ້ານ..."
                    value={newCamName}
                    onChange={(e) => setNewCamName(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>ປະເພດກ້ອງ (Camera Type)</label>
                  <select
                    className="form-control"
                    value={newCamType}
                    onChange={(e) => setNewCamType(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '8px', margin: 0, background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="ip">🌐 IP Camera</option>
                    <option value="nvr">💾 NVR</option>
                    <option value="dvr">📼 DVR</option>
                  </select>
                </div>

                {newCamType === 'ip' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>URL / IP Stream (ຫຼື ພິມ 'webcam' ເພື່ອໃຊ້ກ້ອງເວັບແຄມຈິງ)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ຕົວຢ່າງ: webcam ຫຼື http://192.168.1.100:8080/video"
                      value={newCamUrl}
                      onChange={(e) => setNewCamUrl(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Host / IP Address</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ຕົວຢ່າງ: 192.168.1.200"
                          value={newCamHost}
                          onChange={(e) => setNewCamHost(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Port</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ຕົວຢ່າງ: 554"
                          value={newCamPort}
                          onChange={(e) => setNewCamPort(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Username</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="admin"
                          value={newCamUser}
                          onChange={(e) => setNewCamUser(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={newCamPass}
                          onChange={(e) => setNewCamPass(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Channel</label>
                        <input
                          type="number"
                          min="1"
                          max="32"
                          className="form-control"
                          value={newCamChannel}
                          onChange={(e) => setNewCamChannel(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Brand</label>
                        <select
                          className="form-control"
                          value={newCamBrand}
                          onChange={(e) => setNewCamBrand(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0, background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        >
                          <option value="hikvision">Hikvision</option>
                          <option value="dahua">Dahua</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>View Mode</label>
                        <select
                          className="form-control"
                          value={newCamStreamMode}
                          onChange={(e) => setNewCamStreamMode(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '8px', margin: 0, background: '#191613', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        >
                          <option value="live">Live (MJPEG)</option>
                          <option value="webui">Web UI (Iframe)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Live Stream URL Override (Option)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="http://192.168.1.100/video_stream"
                        value={newCamUrl}
                        onChange={(e) => setNewCamUrl(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '8px', margin: 0 }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>ເລື໅ກລະບູບ AI ກວດຈັບອັດສຽລິຍະ (AI Detection System)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCamChecks.intruder}
                        onChange={(e) => setNewCamChecks({ ...newCamChecks, intruder: e.target.checked })}
                      />
                      🛡️ ລະບູປປ້ຽງກັນຂະໂມຍບຸກລຸກຮ້ານ (Intruder Alert)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCamChecks.cashierAudit}
                        onChange={(e) => setNewCamChecks({ ...newCamChecks, cashierAudit: e.target.checked })}
                      />
                      👤 ກວດຈັບພະນັກງານຂາຍຢູ\u0ec8ເຄ\u0eb5\u0eb2ເຕ\u0eb5ເຍ (Cashier Audit detector)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCamChecks.slacking}
                        onChange={(e) => setNewCamChecks({ ...newCamChecks, slacking: e.target.checked })}
                      />
                      📱 ກວດຈັບພະນັກງານອູ\u0ec9ງານ/ຫຼ\u0ec9ນໂທລະສ\u0eb1ບ (Slacking detector)
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '0.8rem', marginTop: '4px', cursor: 'pointer' }}>
                  ➕ ເພ\u0eb4\u0ec8ມກ້ງວົງຈຽນປິດ (Add CCTV Camera)
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: AI IMAGE EDITOR FOR AMULETS */}
      {activeTab === 'image_editor' && (
        <AmuletImageEditor
          inline={true}
          imageUrl={scannedAmuletImage || ''}
          onSave={(newImg) => {
            setScannedAmuletImage(newImg);
            alert('✓ ບັນທຶກຮູບພາບແຕ່ງແລ້ວຮຽບຮ້ອຍ! (Edited image saved successfully!)');
          }}
        />
      )}

    </div>
  );
}
