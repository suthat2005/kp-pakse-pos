import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

export default function FramingBoard({ 
  activeUser, 
  jobs = [], 
  onStatusChange, 
  onEditJobClick, 
  onPrintJobClick, 
  onCollectPayment,
  onTrackJob,
  onJobsUpdated,
  isMobile = false,
}) {
  // Notification Modal States
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('framing_sound_enabled');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const soundEnabledRef = React.useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    try {
      localStorage.setItem('framing_sound_enabled', String(soundEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  const prevJobsRef = React.useRef(jobs.map(j => j.id));
  const [alarmJobIds, setAlarmJobIds] = useState([]);
  const alarmIntervalRef = React.useRef(null);

  // 1. Detect new pending jobs and add to alarm queue
  useEffect(() => {
    const currentIds = jobs.map(j => j.id);
    const prevIds = prevJobsRef.current;

    const newJobs = jobs.filter(j => j.status === 'pending' && !prevIds.includes(j.id));
    if (newJobs.length > 0) {
      setAlarmJobIds(prev => {
        const updated = [...prev];
        newJobs.forEach(nj => {
          if (!updated.includes(nj.id)) updated.push(nj.id);
        });
        return updated;
      });
    }

    prevJobsRef.current = currentIds;
  }, [jobs]);

  // 2. Remove jobs from alarm queue when they are no longer in pending status
  useEffect(() => {
    const stillPending = alarmJobIds.filter(id => 
      jobs.some(j => j.id === id && j.status === 'pending')
    );
    if (stillPending.length !== alarmJobIds.length) {
      queueMicrotask(() => setAlarmJobIds(stillPending));
    }
  }, [jobs, alarmJobIds]);

  // 3. Loop sweet female voice alert while alarm queue has items
  useEffect(() => {
    const speak = () => {
      if ('speechSynthesis' in window && soundEnabledRef.current) {
        try {
          window.speechSynthesis.cancel(); // clear speech queue
          const text = "ช่างอัดกรอบพระ งานเข้าแล้วเด้อค่ะ";
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'th-TH';
          utterance.rate = 0.92;   // sweet slow tempo
          utterance.pitch = 1.08;  // sweet higher pitch female voice
          
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => 
            v.lang.startsWith('th') && 
            (v.name.includes('Kanya') || v.name.includes('Pattara') || v.name.includes('Narisa') || v.name.includes('female') || v.name.includes('Google'))
          );
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error("Speech Synthesis Error:", e);
        }
      }
    };

    if (alarmJobIds.length > 0 && soundEnabled) {
      speak();
      alarmIntervalRef.current = setInterval(speak, 5500); // repeat every 5.5s
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
    };
  }, [alarmJobIds, soundEnabled]);

  const hasFramingPermission = (subKey) => {
    if (!activeUser) return false;
    if (activeUser.role === 'owner') return true;
    if (activeUser.permissions?.admin) return true;
    return !!activeUser.permissions?.[subKey];
  };

  const [notifyJob, setNotifyJob] = useState(null);
  const [notifyLang, setNotifyLang] = useState('lao');
  const [serverIp, setServerIp] = useState('127.0.0.1');
  const [dragOverCol, setDragOverCol] = useState(null);

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

  // Auto-clear delivered jobs once per day on mount
  useEffect(() => {
    const wasCleared = db.autoClearDeliveredIfNewDay();
    if (wasCleared && onJobsUpdated) {
      onJobsUpdated(db.getFramingJobs());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearDelivered = () => {
    const count = groupedPickedUp.length;
    if (count === 0) {
      alert('ບໍ່ມີລາຍການທີ່ສົ່ງມອບແລ້ວ');
      return;
    }
    if (window.confirm(`ທ່ານຕ້ອງການລ້າງ ${count} ລາຍການທີ່ສົ່ງມອບແລ້ວອອກຈາກບອດແທ້ບໍ່?\n(ຂໍ້ມູນຍັງຄົງຢູ່ໃນໃບຮຽກໂກ້ / ບັນທຶກໄດ້ທຸກເທື່ອ)`)) {
      const remaining = db.clearDeliveredJobs();
      if (onJobsUpdated) onJobsUpdated(remaining);
    }
  };

  const groupJobs = (jobsList) => {
    const groups = {};
    jobsList.forEach(job => {
      if (!job) return;
      const groupKey = job.orderId || `${job.slotId || 'VIP1'}_${job.customerName || 'ລູກຄ້າທົ່ວໄປ'}_${job.pickupDate ? String(job.pickupDate).slice(0, 10) : ''}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          ...job,
          id: groupKey,
          displayId: job.orderId || job.id,
          deposit: Number(job.deposit || 0),
          totalPrice: Number(job.totalPrice || 0),
          balance: Number(job.balance || 0),
          amulets: Array.isArray(job.amulets) ? [...job.amulets] : [],
          jobs: [job]
        };
        if (!Array.isArray(job.amulets) || job.amulets.length === 0) {
          groups[groupKey].amulets.push({
            description: job.amuletDescription || 'ພຣະເຄື່ອງ',
            frameTypeName: job.frameTypeName,
            specialNotes: job.notes,
            image: job.amuletImage
          });
        }
      } else {
        groups[groupKey].totalPrice += Number(job.totalPrice || 0);
        groups[groupKey].balance += Number(job.balance || 0);
        groups[groupKey].deposit = Math.max(groups[groupKey].deposit, Number(job.deposit || 0));
        
        if (Array.isArray(job.amulets) && job.amulets.length > 0) {
          groups[groupKey].amulets.push(...job.amulets);
        } else {
          groups[groupKey].amulets.push({
            description: job.amuletDescription || 'ພຣະເຄື່ອງ',
            frameTypeName: job.frameTypeName,
            specialNotes: job.notes,
            image: job.amuletImage
          });
        }
        
        groups[groupKey].jobs.push(job);
        
        if (job.notes && groups[groupKey].notes && !groups[groupKey].notes.includes(job.notes)) {
          groups[groupKey].notes += ' | ' + job.notes;
        } else if (job.notes && !groups[groupKey].notes) {
          groups[groupKey].notes = job.notes;
        }

        if (job.amuletImage && !groups[groupKey].amuletImage) {
          groups[groupKey].amuletImage = job.amuletImage;
        }
      }
    });

    Object.values(groups).forEach(g => {
      if (g && !g.orderId && Array.isArray(g.jobs)) {
        const billId = g.jobs[0] && g.jobs[0].billId;
        if (billId) {
          g.displayId = billId;
        } else {
          const uniqueIds = Array.from(new Set(g.jobs.map(j => j && j.id).filter(Boolean)));
          g.displayId = uniqueIds.join(', ');
        }
      }
    });

    return Object.values(groups);
  };

  const groupedPending = groupJobs(jobs.filter(j => j.status === 'pending'));
  const groupedFraming = groupJobs(jobs.filter(j => j.status === 'framing'));
  const groupedDone = groupJobs(jobs.filter(j => j.status === 'done'));
  const groupedPickedUp = groupJobs(jobs.filter(j => j.status === 'picked_up'));

  // Clean phone number helper
  const cleanPhone = (phone) => {
    let cleaned = String(phone || '').replace(/\D/g, '');
    if (cleaned.startsWith('020')) {
      cleaned = '85620' + cleaned.substring(3);
    } else if (cleaned.startsWith('20')) {
      cleaned = '856' + cleaned;
    } else if (cleaned.startsWith('08') || cleaned.startsWith('09') || cleaned.startsWith('06')) {
      cleaned = '66' + cleaned.substring(1);
    }
    return cleaned;
  };

  // Generate notify message template
  const getNotifyMessage = (job, lang) => {
    if (!job) return '';
    const balanceStr = (job.balance || 0).toLocaleString();
    const settings = db.getSettings();
    const baseOrigin = (settings.trackingBaseUrl && settings.trackingBaseUrl.trim() !== '')
      ? settings.trackingBaseUrl.trim()
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `http://${serverIp}:${window.location.port || '5173'}`
        : window.location.origin;
    const trackUrl = `${baseOrigin}${window.location.pathname}?track=${job.id}`;

    if (lang === 'thai') {
      return `งานเลี่ยมพระของคุณเลขบิล ${job.id} เสร็จเรียบร้อยแล้วค่ะ! ยอดค้างชำระ: ${balanceStr} กีบ. ติดตามสถานะได้ที่: ${trackUrl} กรุณามารับเครื่องได้ที่ ร้านขอบพระ ปากเซ.`;
    } else if (lang === 'eng') {
      return `Your amulet framing work order ${job.id} is ready for pick up! Balance due: ${balanceStr} LAK. Track status: ${trackUrl} Please collect it at Kop Phra Pakse shop.`;
    }
    return `ງານອັດກອບພຣະຂອງທ່ານເລກບິນ ${job.id} ແມ່ນສຳເລັດຮຽບຮ້ອຍແລ້ວ! ຍອດຄ້າງຊຳລະ: ${balanceStr} ກີບ. ຕິດຕາມສະຖານະໄດ້ທີ່: ${trackUrl} ກະລຸນາມາຮັບເຄື່ອງໄດ້ທີ່ ຮ້ານຂອບພຣະ ປາກເຊ.`;
  };

  const handleNotifyClick = (job) => {
    setNotifyJob(job);
    setNotifyLang('lao');
    setShowNotifyModal(true);
  };

  // Helper to render multiple amulets list on card with custom specs
  const renderAmuletsList = (job) => {
    if (job.amulets && job.amulets.length > 0) {
      // Group amulets by frameTypeName
      const groups = {};
      job.amulets.forEach(a => {
        if (!a) return;
        const key = a.frameTypeName || 'ອັດກອບ';
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '6px 0', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {Object.keys(groups).map((groupName, gIdx) => {
            const list = groups[groupName];
            return (
              <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Header for framing type */}
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gold-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', marginBottom: '2px' }}>
                  {groupName} ({list.length} ອົງ)
                </div>
                {/* List of amulets under this header */}
                {list.map((a, idx) => {
                  if (!a) return null;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {a.image ? (
                          <img src={a.image} style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} alt="" />
                        ) : (
                          <span style={{ fontSize: '0.75rem', flexShrink: 0 }}></span>
                        )}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, color: 'white' }}>
                          {idx + 1}. {a.description || 'ພຣະເຄື່ອງ'}
                        </span>
                      </div>
                      {a.specialNotes && (
                        <div style={{ paddingLeft: '24px', fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          📝: {a.specialNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }
    return <div className="job-desc">{db.getLabel('auto_ພຣະ__1wl1cf', `ພຣະ:`)} {job.amuletDescription}</div>;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── Header ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,rgba(251,146,60,0.18),rgba(251,146,60,0.06))', border: '1px solid rgba(251,146,60,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}></div>
          <div>
            <h2 style={{ background: 'linear-gradient(135deg,#fb923c,#fcd34d,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
              {db.getLabel('framing_board_title', 'ບອດຈັດການງານອັດກອບ')}
            </h2>
            {!isMobile && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', margin: '2px 0 0', fontWeight: 500 }}>{db.getLabel('auto_ຕິດຕາມສະຖານະງານເລກບິນ__ເງ_9h5bh4', 'ຕິດຕາມສະຖານະ, ເງິນມັດຈຳ, ສື່ສານກັບລູກຄ້າ ແລະ ອັບເດດສະຖານະ')}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem',
              padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              background: soundEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
              border: soundEnabled ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
              color: soundEnabled ? '#22c55e' : '#ef4444', transition: 'all 0.18s',
            }}
          >
            {soundEnabled ? 'ສຽງເປີດ' : 'ສຽງປິດ'}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        
        {/* Column 1: Received */}
        <div 
          className="kanban-col"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverCol !== 'pending') setDragOverCol('pending');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverCol(null);
            const jobIdsStr = e.dataTransfer.getData("jobId");
            if (jobIdsStr && onStatusChange) {
              jobIdsStr.split(',').forEach(id => {
                onStatusChange(id, 'pending');
              });
            }
          }}
          style={{
            border: dragOverCol === 'pending' ? '2px dashed #3498db' : '1px solid rgba(52, 152, 219, 0.15)',
            background: dragOverCol === 'pending' ? 'rgba(52, 152, 219, 0.05)' : '',
            borderRadius: '12px',
            padding: '12px',
            transition: 'all 0.2s'
          }}
        >
          <div className="kanban-col-title" style={{ color: '#3498db', borderBottom: '1.5px solid rgba(52, 152, 219, 0.3)' }}>
            <span>{db.getLabel('framing_board_pending', 'ຮັບງານເຂົ້າ (Received)')}</span>
            <span style={{ background: 'rgba(52,152,219,0.12)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#3498db' }}>
              {groupedPending.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {groupedPending.map(group => (
              <div 
                key={group.id} 
                className="job-card"
                draggable={hasFramingPermission('framingUpdateStatus')}
                onDragStart={(e) => {
                  e.dataTransfer.setData("jobId", group.jobs.map(j => j.id).join(','));
                  e.dataTransfer.effectAllowed = "move";
                }}
                style={{ 
                  border: '1px solid rgba(52, 152, 219, 0.35)',
                  borderLeft: '4px solid #3498db',
                  background: 'rgba(52, 152, 219, 0.03)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 0 10px rgba(52, 152, 219, 0.02)',
                  cursor: hasFramingPermission('framingUpdateStatus') ? 'grab' : 'default' 
                }}
              >
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(group.jobs[0].id)}
                    style={{ color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}
                    title={db.getLabel('auto_ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍກ_fkufcb', `ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)`)}
                  >
                    {group.displayId}
                  </span>
                  <span className="job-date">{group.pickupDate ? new Date(group.pickupDate).toLocaleDateString('lo-LA') : 'ບໍ່ລະບຸ'}</span>
                </div>
                <div className="job-customer" style={{ fontWeight: 'bold' }}>{group.customerName}</div>
                {renderAmuletsList(group)}
                {!group.amulets && <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{group.frameTypeName}</div>}
                
                {group.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={group.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div className="job-deposit-pill">{db.getLabel('auto_ມັດຈຳ__eauhkl', `ມັດຈຳ:`)} {group.deposit.toLocaleString()} {db.getLabel('auto_ກີບ_2726e', `ກີບ`)}</div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {hasFramingPermission('framingPrintJob') && (
                  <button className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.7rem' }} onClick={() => onPrintJobClick(group)}>
                    ບິນ
                  </button>
                  )}
                  {hasFramingPermission('framingEditJob') && (
                  <button className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.7rem' }} onClick={() => onEditJobClick(group.jobs[0])}>
                    ແກ້ໄຂ
                  </button>
                  )}
                  {hasFramingPermission('framingUpdateStatus') && (
                  <button className="btn btn-primary" style={{ flex: 1, padding: '4px', fontSize: '0.7rem' }} onClick={() => group.jobs.forEach(j => onStatusChange(j.id, 'framing'))}>
                    ເລີ່ມເຮັດ ➔
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Processing */}
        <div 
          className="kanban-col"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverCol !== 'framing') setDragOverCol('framing');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverCol(null);
            const jobIdsStr = e.dataTransfer.getData("jobId");
            if (jobIdsStr && onStatusChange) {
              jobIdsStr.split(',').forEach(id => {
                onStatusChange(id, 'framing');
              });
            }
          }}
          style={{
            border: dragOverCol === 'framing' ? '2px dashed #f39c12' : '1px solid rgba(243, 156, 18, 0.15)',
            background: dragOverCol === 'framing' ? 'rgba(243, 156, 18, 0.05)' : '',
            borderRadius: '12px',
            padding: '12px',
            transition: 'all 0.2s'
          }}
        >
          <div className="kanban-col-title" style={{ color: '#f39c12', borderBottom: '1.5px solid rgba(243, 156, 18, 0.3)' }}>
            <span>{db.getLabel('framing_board_doing', 'ກຳລັງເລເຊີ/ເລ່ຽມ (Processing)')}</span>
            <span style={{ background: 'rgba(243,156,18,0.12)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#f39c12' }}>
              {groupedFraming.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {groupedFraming.map(group => (
              <div 
                key={group.id} 
                className="job-card" 
                style={{ 
                  border: '1px solid rgba(243, 156, 18, 0.35)',
                  borderLeft: '4px solid #f39c12',
                  background: 'rgba(243, 156, 18, 0.03)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 0 10px rgba(243, 156, 18, 0.02)',
                  cursor: hasFramingPermission('framingUpdateStatus') ? 'grab' : 'default'
                }}
                draggable={hasFramingPermission('framingUpdateStatus')}
                onDragStart={(e) => {
                  e.dataTransfer.setData("jobId", group.jobs.map(j => j.id).join(','));
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(group.jobs[0].id)}
                    style={{ color: '#f39c12', cursor: 'pointer', textDecoration: 'underline' }}
                    title={db.getLabel('auto_ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍກ_fkufcb', `ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)`)}
                  >
                    {group.displayId}
                  </span>
                  <span className="job-date">{group.pickupDate ? new Date(group.pickupDate).toLocaleDateString('lo-LA') : 'ບໍ່ລະບຸ'}</span>
                </div>
                <div className="job-customer" style={{ fontWeight: 'bold' }}>{group.customerName}</div>
                {renderAmuletsList(group)}
                {!group.amulets && <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>{group.frameTypeName}</div>}
                
                {group.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={group.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Note: {group.notes || 'ບໍ່ມີ'}</div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {hasFramingPermission('framingUpdateStatus') && (
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => group.jobs.forEach(j => onStatusChange(j.id, 'pending'))}>
                    ↞ ຖອຍ
                  </button>
                  )}
                  {hasFramingPermission('framingEditJob') && (
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => onEditJobClick(group.jobs[0])}>
                    ແກ້
                  </button>
                  )}
                  {hasFramingPermission('framingUpdateStatus') && (
                  <button className="btn btn-primary" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: 'var(--success-green)' }} onClick={() => group.jobs.forEach(j => onStatusChange(j.id, 'done'))}>
                    ສຳເລັດ ➔
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div 
          className="kanban-col"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverCol !== 'done') setDragOverCol('done');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverCol(null);
            const jobIdsStr = e.dataTransfer.getData("jobId");
            if (jobIdsStr && onStatusChange) {
              jobIdsStr.split(',').forEach(id => {
                onStatusChange(id, 'done');
              });
            }
          }}
          style={{
            border: dragOverCol === 'done' ? '2px dashed #2ecc71' : '1px solid rgba(46, 204, 113, 0.15)',
            background: dragOverCol === 'done' ? 'rgba(46, 204, 113, 0.05)' : '',
            borderRadius: '12px',
            padding: '12px',
            transition: 'all 0.2s'
          }}
        >
          <div className="kanban-col-title" style={{ color: '#2ecc71', borderBottom: '1.5px solid rgba(46, 204, 113, 0.3)' }}>
            <span>{db.getLabel('framing_board_done', 'ງານເສັດຮອມານັບ (Ready)')}</span>
            <span style={{ background: 'rgba(46,204,113,0.12)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#2ecc71' }}>
              {groupedDone.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {groupedDone.map(group => (
              <div 
                key={group.id} 
                className="job-card" 
                style={{ 
                  border: '1px solid rgba(46, 204, 113, 0.4)',
                  borderLeft: '4px solid #2ecc71',
                  background: 'rgba(46, 204, 113, 0.03)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 0 10px rgba(46, 204, 113, 0.02)',
                  cursor: hasFramingPermission('framingUpdateStatus') ? 'grab' : 'default'
                }}
                draggable={hasFramingPermission('framingUpdateStatus')}
                onDragStart={(e) => {
                  e.dataTransfer.setData("jobId", group.jobs.map(j => j.id).join(','));
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(group.jobs[0].id)}
                    style={{ color: 'var(--success-green)', cursor: 'pointer', textDecoration: 'underline' }}
                    title={db.getLabel('auto_ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍກ_fkufcb', `ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)`)}
                  >
                    {group.displayId}
                  </span>
                  <span className="job-date" style={{ color: 'var(--success-green)' }}>{db.getLabel('auto_ພ້ອມຮັບພຣະ_ebobcj', `ພ້ອມຮັບພຣະ`)}</span>
                </div>
                <div className="job-customer" style={{ fontWeight: 'bold' }}>{group.customerName}</div>
                {renderAmuletsList(group)}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ລາຄາລວມ__hgyo3a', `ລາຄາລວມ:`)} {group.totalPrice.toLocaleString()} {db.getLabel('auto_ກີບ_2726e', `ກີບ`)}</div>
                
                {group.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={group.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{db.getLabel('auto_ຄ້າງຊຳລະ__4558y4', `ຄ້າງຊຳລະ:`)} <span style={{ color: 'var(--gold-primary)' }}>{group.balance.toLocaleString()} {db.getLabel('auto_ກີບ_2726e', `ກີບ`)}</span></div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {hasFramingPermission('framingUpdateStatus') && (
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => group.jobs.forEach(j => onStatusChange(j.id, 'framing'))}>
                    ↞ ແກ້
                  </button>
                  )}
                  {hasFramingPermission('framingEditJob') && (
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => onEditJobClick(group.jobs[0])}>
                    ✏️ ແກ້
                  </button>
                  )}
                  {hasFramingPermission('framingNotifyCustomer') && (
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem', borderColor: 'var(--success-green)', color: 'var(--success-green)' }} onClick={() => handleNotifyClick(group)}>
                    ແຈ້ງ
                  </button>
                  )}
                  {hasFramingPermission('framingCollectPayment') ? (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: 'var(--gold-primary)', color: 'var(--bg-main)', fontWeight: 'bold' }} onClick={() => onCollectPayment(group)}>
                      ມອບພຣະ ➔
                    </button>
                  ) : (
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>{db.getLabel('auto_ລໍຖ້າແຄຊເຊຍ_1j13yl', `ລໍຖ້າແຄຊເຊຍ`)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Delivered */}
        <div 
          className="kanban-col"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverCol !== 'picked_up') setDragOverCol('picked_up');
          }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverCol(null);
            const jobIdsStr = e.dataTransfer.getData("jobId");
            if (jobIdsStr) {
              const firstId = jobIdsStr.split(',')[0];
              const representativeJob = jobs.find(j => j.id === firstId);
              if (representativeJob) {
                if (onCollectPayment) {
                  const allGroups = groupJobs(jobs);
                  const group = allGroups.find(g => g.jobs.some(j => j.id === firstId));
                  onCollectPayment(group || representativeJob);
                } else if (onStatusChange) {
                  jobIdsStr.split(',').forEach(id => {
                    onStatusChange(id, 'picked_up');
                  });
                }
              }
            }
          }}
          style={{
            border: dragOverCol === 'picked_up' ? '2px dashed #95a5a6' : '1px solid rgba(149, 165, 166, 0.1)',
            background: dragOverCol === 'picked_up' ? 'rgba(149, 165, 166, 0.02)' : '',
            borderRadius: '12px',
            padding: '12px',
            transition: 'all 0.2s'
          }}
        >
          <div className="kanban-col-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', color: '#95a5a6', borderBottom: '1.5px solid rgba(149, 165, 166, 0.2)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{db.getLabel('framing_board_delivered', 'ສົ່ງມອບແລ້ວ (Delivered)')}</span>
              <span style={{ background: 'rgba(149,165,166,0.15)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#95a5a6' }}>
                {groupedPickedUp.length}
              </span>
            </div>
            {groupedPickedUp.length > 0 && (
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'rgba(231,76,60,0.85)', borderColor: 'rgba(231,76,60,0.4)', background: 'rgba(231,76,60,0.08)' }}
                onClick={handleClearDelivered}
                title={db.getLabel('auto_ລ້າງລາຍການທີ່ສົ່ງມອບແລ້ວທ_676273', `ລ້າງລາຍການທີ່ສົ່ງມອບແລ້ວທັງໝົດ (Clear all delivered)`)}
              >
                ລ້າງ
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {groupedPickedUp.map(group => (
              <div 
                key={group.id} 
                className="job-card" 
                style={{ 
                  opacity: 0.7, 
                  border: '1px solid rgba(149, 165, 166, 0.3)',
                  borderLeft: '4px solid #95a5a6',
                  background: 'rgba(149, 165, 166, 0.02)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: hasFramingPermission('framingUpdateStatus') ? 'grab' : 'default'
                }}
                draggable={hasFramingPermission('framingUpdateStatus')}
                onDragStart={(e) => {
                  e.dataTransfer.setData("jobId", group.jobs.map(j => j.id).join(','));
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(group.jobs[0].id)}
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                    title={db.getLabel('auto_ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍກ_fkufcb', `ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)`)}
                  >
                    {group.displayId}
                  </span>
                  <span className="job-date" style={{ color: 'var(--text-secondary)' }}>{db.getLabel('auto_ສຳເລັດ_9zjj4f', `ສຳເລັດ`)}</span>
                </div>
                <div className="job-customer">{group.customerName}</div>
                {renderAmuletsList(group)}
                
                {group.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={group.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.75rem', textDecoration: 'line-through' }}>{db.getLabel('auto_ຍອດຊຳລະແລ້ວ__xhfygg', `ຍອດຊຳລະແລ້ວ:`)} {group.totalPrice.toLocaleString()} {db.getLabel('auto_ກີບ_2726e', `ກີບ`)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Customer Notification Modal */}
      {showNotifyModal && notifyJob && (
        <Portal>
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content modal-sm animate-fade-in">
            <div className="modal-header">
              <span className="modal-title">{db.getLabel('auto____ແຈ້ງເຕືອນລູກຄ້າ__Notif_itb8m4', `ແຈ້ງເຕືອນລູກຄ້າ (Notify Customer)`)}</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowNotifyModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto__nbsp_ຊື່ລູກຄ້າ__5nelp9', `&nbsp;ຊື່ລູກຄ້າ:`)}</label>
                <div style={{ fontWeight: 'bold', color: 'white' }}>{notifyJob.customerName} ({notifyJob.customerPhone})</div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ເລືອກພາສາຂໍ້ຄວາມ__Select__ktpsax', `ເລືອກພາສາຂໍ້ຄວາມ (Select Language):`)}</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" className={`btn ${notifyLang === 'lao' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px' }} onClick={() => setNotifyLang('lao')}>{db.getLabel('auto_ລາວ__Lao__c3aec1', `ລາວ (Lao)`)}</button>
                  <button type="button" className={`btn ${notifyLang === 'thai' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px' }} onClick={() => setNotifyLang('thai')}>ไทย (Thai)</button>
                  <button type="button" className={`btn ${notifyLang === 'eng' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px' }} onClick={() => setNotifyLang('eng')}>Eng</button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{db.getLabel('auto_ຕົວຢ່າງຂໍ້ຄວາມ__wufu7a', `ຕົວຢ່າງຂໍ້ຄວາມ:`)}</label>
                <textarea
                  className="form-control"
                  readOnly
                  rows="4"
                  value={getNotifyMessage(notifyJob, notifyLang)}
                  style={{ background: '#0e0d0b', color: 'white', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', width: '100%', resize: 'none' }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                navigator.clipboard.writeText(getNotifyMessage(notifyJob, notifyLang));
                alert('✓ ຄັດລອກຂໍ້ຄວາມສຳເລັດແລ້ວ!');
              }}>
                📋 ຄັດລອກ (Copy)
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 1.5, background: '#2ecc71', borderColor: '#2ecc71', color: 'black', fontWeight: 'bold' }} onClick={() => {
                const cleanNum = cleanPhone(notifyJob.customerPhone);
                const txt = encodeURIComponent(getNotifyMessage(notifyJob, notifyLang));
                window.open(`https://wa.me/${cleanNum}?text=${txt}`, '_blank');
              }}>
                💬 ສົ່ງ WhatsApp
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

    </div>
  );
}
