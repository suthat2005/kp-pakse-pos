import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import Portal from './Portal';

export default function FramingBoard({ 
  activeUser, 
  jobs = [], 
  onStatusChange, 
  onAddJobClick, 
  onEditJobClick, 
  onPrintJobClick, 
  onCollectPayment,
  onTrackJob
}) {
  // Notification Modal States
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyJob, setNotifyJob] = useState(null);
  const [notifyLang, setNotifyLang] = useState('lao');
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

  // Status Filter Lists (Mapping internal status to updated business flow)
  const pendingJobs = jobs.filter(j => j.status === 'pending');       // Received
  const framingJobs = jobs.filter(j => j.status === 'framing');       // Processing
  const doneJobs = jobs.filter(j => j.status === 'done');             // Ready
  const pickedUpJobs = jobs.filter(j => j.status === 'picked_up');     // Delivered

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
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {job.amulets.map((a, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: idx < job.amulets.length - 1 ? '1px dashed rgba(255,255,255,0.03)' : 'none', paddingBottom: idx < job.amulets.length - 1 ? '4px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {a.image ? (
                  <img src={a.image} style={{ width: '22px', height: '22px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} alt="" />
                ) : (
                  <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>📿</span>
                )}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontWeight: '500', color: 'white' }}>
                  {idx + 1}. {a.description || 'ພຣະເຄື່ອງ'}
                </span>
              </div>
              
              {/* Custom specs note output */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '28px', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--gold-primary)' }}>({a.frameTypeName || 'ອັດກອບ'})</span>
                {a.frameStyle && <span style={{ background: 'rgba(52, 152, 219, 0.15)', color: '#3498db', padding: '1px 4px', borderRadius: '4px' }}>{a.frameStyle}</span>}
                {a.specialNotes && <div style={{ width: '100%', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>📝: {a.specialNotes}</div>}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return <div className="job-desc">ພຣະ: {job.amuletDescription}</div>;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--gold-primary)' }}>{db.getLabel('framing_board_title', '🛠️ ບອດຈັດການງານອັດກອບ (Framing Dashboard)')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ຕິດຕາມສະຖານະງານເລກບິນ, ເງິນມັດຈຳ, ສື່ສານກັບລູກຄ້າ ແລະ ອັບເດດສະຖານະການເລີຍ</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        
        {/* Column 1: Received */}
        <div className="kanban-col">
          <div className="kanban-col-title">
            <span>{db.getLabel('framing_board_pending', '🔴 ຮັບງານເຂົ້າ (Received)')}</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
              {pendingJobs.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {pendingJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(job.id)}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    title="ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)"
                  >
                    {job.id}
                  </span>
                  <span className="job-date">{new Date(job.pickupDate).toLocaleDateString('lo-LA')}</span>
                </div>
                <div className="job-customer" style={{ fontWeight: 'bold' }}>{job.customerName}</div>
                {renderAmuletsList(job)}
                {!job.amulets && <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{job.frameTypeName}</div>}
                
                {job.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={job.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div className="job-deposit-pill">ມັດຈຳ: {job.deposit.toLocaleString()} ກີບ</div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.7rem' }} onClick={() => onPrintJobClick(job)}>
                    🖨️ ບິນ
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.7rem' }} onClick={() => onEditJobClick(job)}>
                    ✏️ ແກ้ໄຂ
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '4px', fontSize: '0.7rem' }} onClick={() => onStatusChange(job.id, 'framing')}>
                    ເລີ່ມເຮັດ ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Processing */}
        <div className="kanban-col">
          <div className="kanban-col-title">
            <span>{db.getLabel('framing_board_doing', '🟡 ກຳລັງເລເຊີ/ເລ່ຽມ (Processing)')}</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
              {framingJobs.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {framingJobs.map(job => (
              <div key={job.id} className="job-card" style={{ borderColor: 'var(--accent-amber)' }}>
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(job.id)}
                    style={{ color: 'var(--accent-amber)', cursor: 'pointer', textDecoration: 'underline' }}
                    title="ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)"
                  >
                    {job.id}
                  </span>
                  <span className="job-date">{new Date(job.pickupDate).toLocaleDateString('lo-LA')}</span>
                </div>
                <div className="job-customer" style={{ fontWeight: 'bold' }}>{job.customerName}</div>
                {renderAmuletsList(job)}
                {!job.amulets && <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>{job.frameTypeName}</div>}
                
                {job.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={job.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Note: {job.notes || 'ບໍ່ມີ'}</div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => onStatusChange(job.id, 'pending')}>
                    ↞ ຖອຍ
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => onEditJobClick(job)}>
                    ✏️ ແກ້
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: 'var(--success-green)' }} onClick={() => onStatusChange(job.id, 'done')}>
                    ສຳເລັດ ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="kanban-col">
          <div className="kanban-col-title">
            <span>{db.getLabel('framing_board_done', '🟢 ງານເສັດຮອມານັບ (Ready)')}</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
              {doneJobs.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {doneJobs.map(job => (
              <div key={job.id} className="job-card" style={{ borderColor: 'var(--success-green)' }}>
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(job.id)}
                    style={{ color: 'var(--success-green)', cursor: 'pointer', textDecoration: 'underline' }}
                    title="ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)"
                  >
                    {job.id}
                  </span>
                  <span className="job-date" style={{ color: 'var(--success-green)' }}>ພ້ອມຮັບພຣະ</span>
                </div>
                <div className="job-customer" style={{ fontWeight: 'bold' }}>{job.customerName}</div>
                {renderAmuletsList(job)}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ລາຄາລວມ: {job.totalPrice.toLocaleString()} ກີບ</div>
                
                {job.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={job.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>ຄ້າງຊຳລະ: <span style={{ color: 'var(--gold-primary)' }}>{job.balance.toLocaleString()} ກີບ</span></div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => onStatusChange(job.id, 'framing')}>
                    ↞ ແກ້
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '0.7rem', borderColor: 'var(--success-green)', color: 'var(--success-green)' }} onClick={() => handleNotifyClick(job)}>
                    🔔 ແຈ້ງ
                  </button>
                  {activeUser.role !== 'technician' ? (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: 'var(--gold-primary)', color: 'var(--bg-main)', fontWeight: 'bold' }} onClick={() => onCollectPayment(job)}>
                      ມອບພຣະ ➔
                    </button>
                  ) : (
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>ລໍຖ້າແຄຊເຊຍ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Delivered */}
        <div className="kanban-col">
          <div className="kanban-col-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{db.getLabel('framing_board_delivered', '⚪ ສົ່ງມອບແລ້ວ (Delivered)')}</span>
              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                {pickedUpJobs.length}
              </span>
            </div>

          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
            {pickedUpJobs.map(job => (
              <div key={job.id} className="job-card" style={{ opacity: 0.6, borderColor: 'var(--border-color)' }}>
                <div className="job-card-header">
                  <span 
                    className="job-id" 
                    onClick={() => onTrackJob && onTrackJob(job.id)}
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                    title="ຄລິກເພື່ອຕິດຕາມສະຖານະລາຍການ (Click to track order)"
                  >
                    {job.id}
                  </span>
                  <span className="job-date" style={{ color: 'var(--text-secondary)' }}>ສຳເລັດ</span>
                </div>
                <div className="job-customer">{job.customerName}</div>
                {renderAmuletsList(job)}
                
                {job.amuletImage && (
                  <div style={{ margin: '6px 0', borderRadius: '4px', overflow: 'hidden', height: '90px', display: 'flex', justifyContent: 'center', background: '#0e0d0b', border: '1px solid var(--border-color)' }}>
                    <img src={job.amuletImage} alt="Amulet Preview" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.75rem', textDecoration: 'line-through' }}>ຍອດຊຳລະແລ້ວ: {job.totalPrice.toLocaleString()} ກີບ</div>
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
              <span className="modal-title">🔔 ແຈ້ງເຕືອນລູກຄ້າ (Notify Customer)</span>
              <button className="btn-secondary" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowNotifyModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>&nbsp;ຊື່ລູກຄ້າ:</label>
                <div style={{ fontWeight: 'bold', color: 'white' }}>{notifyJob.customerName} ({notifyJob.customerPhone})</div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ເລືອກພາສາຂໍ້ຄວາມ (Select Language):</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" className={`btn ${notifyLang === 'lao' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px' }} onClick={() => setNotifyLang('lao')}>ລາວ (Lao)</button>
                  <button type="button" className={`btn ${notifyLang === 'thai' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px' }} onClick={() => setNotifyLang('thai')}>ไทย (Thai)</button>
                  <button type="button" className={`btn ${notifyLang === 'eng' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px' }} onClick={() => setNotifyLang('eng')}>Eng</button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ຕົວຢ່າງຂໍ້ຄວາມ:</label>
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
