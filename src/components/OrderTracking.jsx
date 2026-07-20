import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

export default function OrderTracking({ jobId, onClose, isInline = false, mockJobData = null }) {
  const job = mockJobData || db.getFramingJobs().find(j => j.id === jobId || j.orderId === jobId || j.billId === jobId);
  const settings = db.getSettings();

  const formatJobDate = (dateStr) => {
    try {
      if (!dateStr) return new Date().toLocaleString('lo-LA', { dateStyle: 'medium', timeStyle: 'short' });
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleString('lo-LA', { dateStyle: 'medium', timeStyle: 'short' });
      }
      return d.toLocaleString('lo-LA', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
      return new Date().toLocaleString('lo-LA', { dateStyle: 'medium', timeStyle: 'short' });
    }
  };

  const formatJobDateShort = (dateStr) => {
    try {
      if (!dateStr) return new Date().toLocaleDateString('lo-LA');
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleDateString('lo-LA');
      }
      return d.toLocaleDateString('lo-LA');
    } catch (e) {
      return new Date().toLocaleDateString('lo-LA');
    }
  };

  // Responsive UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (isInline) return; // Keep inline mobile preview always forced to mobile UI
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInline]);

  const showMobileUI = isInline || isMobile;

  // Calculate position in queue
  const getQueuePosition = () => {
    if (!job || (job.status !== 'pending' && job.status !== 'framing')) return 0;
    if (job.status === 'framing') return 0;
    const allJobs = db.getFramingJobs();
    const activeFramingCount = allJobs.filter(j => j.status === 'framing').length;
    const pendingJobs = allJobs.filter(j => j.status === 'pending');
    const sortedPending = pendingJobs.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
    const idx = sortedPending.findIndex(j => j.id === job.id);
    return idx >= 0 ? idx + activeFramingCount : activeFramingCount;
  };

  const queuePosition = getQueuePosition();

  // Status mapping colors & texts using Translate Labels system
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': 
        return db.getLabel('track_status_pending', 'ຮັບຝາກພຣະແລ້ວ (Order Received)');
      case 'framing': 
        return db.getLabel('track_status_framing', 'ພວມດຳເນີນການອັດກອບ (Processing)');
      case 'done': 
      case 'ready': 
        return db.getLabel('track_status_ready', 'ສຳເລັດແລ້ວ ພ້ອມຮັບພຣະ (Ready to Pick Up)');
      case 'picked_up': 
        return db.getLabel('track_status_picked_up', 'ຮັບພຣະກັບບ້ານແລ້ວ (Picked Up / Delivered)');
      default: 
        return 'ບໍ່ຮູ້ສະຖານະ (Unknown)';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#e74c3c';
      case 'framing': return '#f1c40f';
      case 'done': 
      case 'ready': 
        return '#2ecc71';
      case 'picked_up': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  // Timeline steps config
  const getTimelineSteps = () => {
    if (!job) return [];
    return [
      { 
        step: 1, 
        label: db.getLabel('track_step_received', 'ຮັບຝາກພຣະ (Order Received)'), 
        active: true, 
        done: true, 
        time: formatJobDate(job.createdDate)
      },
      { 
        step: 2, 
        label: db.getLabel('track_step_progress', 'ກຳລັງດຳເນີນການອັດກອບ (In Progress)'), 
        active: true, 
        done: job.status !== 'pending', 
        time: job.status !== 'pending' 
          ? db.getLabel('track_step_progress_done', 'ສຳເລັດການອັດກອບ') 
          : db.getLabel('track_step_progress_doing', 'ກຳລັງເລັ່ງມືອັດກອບພຣະ...') 
      },
      { 
        step: 3, 
        label: db.getLabel('track_step_ready', 'ອັດກອບສຳເລັດ ພ້ອມຮັບພຣະ (Ready to Pick Up)'), 
        active: job.status === 'ready' || job.status === 'picked_up', 
        done: job.status === 'picked_up', 
        time: job.status === 'ready' || job.status === 'picked_up' 
          ? db.getLabel('track_step_ready_done', 'ພ້ອມຮັບກັບບ້ານ') 
          : db.getLabel('track_step_ready_waiting', 'ລໍຖ້າການອັດກອບ') 
      },
      { 
        step: 4, 
        label: db.getLabel('track_step_picked_up', 'ຮັບພຣະກັບບ້ານແລ້ວ (Picked Up / Delivered)'), 
        active: job.status === 'picked_up', 
        done: job.status === 'picked_up', 
        time: job.status === 'picked_up' 
          ? db.getLabel('track_step_picked_up_done', 'ສົ່ງມອບຮຽບຮ້ອຍ') 
          : db.getLabel('track_step_picked_up_waiting', 'ລໍຖ້າລູກຄ້າມາຮັບ') 
      }
    ];
  };

  const timelineSteps = getTimelineSteps();

  // MOBILE UI RENDERING (Highly Optimized & Small Fonts)
  const renderMobileUI = () => {
    return (
      <div className="mobile-tracking-card animate-fade-in">
        
        {/* Compact Status Banner */}
        <div 
          className="m-status-pill" 
          style={{
            background: `rgba(${job.status === 'done' || job.status === 'ready' || job.status === 'picked_up' ? '46, 204, 113' : '241, 196, 15'}, 0.08)`,
            border: `1px solid ${getStatusColor(job.status)}`
          }}
        >
          <div 
            className={`m-status-dot ${(job.status === 'pending' || job.status === 'framing') ? 'm-pulse' : ''}`}
            style={{ color: getStatusColor(job.status), background: getStatusColor(job.status) }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="m-label-dim">{db.getLabel('track_current_step', 'ຂັ້ນຕອນປັດຈຸບັນ (Current Step)')}</span>
            <span className="m-status-text" style={{ color: getStatusColor(job.status) }}>
              {getStatusText(job.status)}
            </span>
          </div>
        </div>

        {/* Queue Position Card */}
        {(job.status === 'pending' || job.status === 'framing') && settings.trackingShowQueue !== false && (
          <div className={`m-queue-card ${queuePosition === 0 ? 'm-queue-next' : 'm-queue-waiting'}`}>
            {queuePosition === 0 ? (
              <span>{db.getLabel('track_queue_ahead', 'ຄິວຖັດໄປ / ພວມດຳເນີນການ')}</span>
            ) : (
              <span>{db.getLabel('track_queues_remaining', 'ຍັງເຫຼືອອີກ {count} ຄິວ ກ່ອນໜ້າຄິວຂອງທ່ານ').replace('{count}', String(queuePosition))}</span>
            )}
          </div>
        )}

        {/* Customer & Bill details */}
        <div className="m-info-box">
          <div className="m-info-title">{db.getLabel('track_customer_info_title', 'ຂໍ້ມູນລູກຄ້າ (Customer Info)')}</div>
          <div className="m-info-grid">
            <div>
              <span className="m-label-dim">{db.getLabel('track_bill_no', 'ເລກໃບບິນຕິດຕາມ:')}</span>
              <span className="m-val" style={{ color: '#d4af37' }}>{jobId}</span>
            </div>
            <div>
              <span className="m-label-dim">{db.getLabel('track_date', 'ວັນທີຝາກພຣະ:')}</span>
              <span className="m-val">{formatJobDateShort(job.createdDate)}</span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span className="m-label-dim">{db.getLabel('track_customer', 'ຊື່ລູກຄ້າ:')}</span>
              <span className="m-val">{job.customerName || 'ລູກຄ້າທົ່ວໄປ (General)'}</span>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="m-info-box">
          <div className="m-info-title">{db.getLabel('track_status_title', 'ສະຖານະ (Status)')}</div>
          <div className="m-timeline">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="m-timeline-item">
                {idx < 3 && (
                  <div 
                    className="m-timeline-line"
                    style={{ background: step.done ? '#d4af37' : 'rgba(255,255,255,0.06)' }}
                  />
                )}
                <div 
                  className="m-timeline-node"
                  style={{
                    background: step.done ? '#d4af37' : step.active ? '#1c1815' : 'rgba(255,255,255,0.02)',
                    border: step.active ? '1.5px solid #d4af37' : '1.5px solid rgba(255,255,255,0.08)',
                    color: step.done ? '#000' : '#fff',
                    boxShadow: step.active && !step.done ? '0 0 8px rgba(212,175,55,0.3)' : 'none'
                  }}
                >
                  {step.done ? '✓' : step.step}
                </div>
                <div className="m-timeline-content">
                  <span className="m-timeline-label" style={{ fontWeight: step.active ? 'bold' : 'normal', color: step.active ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                    {step.label}
                  </span>
                  <span className="m-timeline-time">
                    {step.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amulet List details */}
        <div className="m-info-box">
          <div className="m-info-title">
            {db.getLabel('track_amulet_details', 'ລາຍລະອຽດລາຍການຝາກ:')} ({job.amulets ? job.amulets.length : 0})
          </div>
          <div className="m-amulet-list">
            {job.amulets && job.amulets.map((amulet, i) => (
              <div key={i} className="m-amulet-card">
                <div className="m-amulet-header">
                  <span>{db.getLabel('track_amulet_prefix', 'ອົງທີ')} {i + 1}: {amulet.description || 'ພຣະເຄື່ອງ'}</span>
                  <span style={{ color: '#d4af37' }}>x1</span>
                </div>
                <div className="m-amulet-desc">
                  {amulet.frameTypeName} {amulet.frameStyle && `• ${amulet.frameStyle}`}
                </div>
                {amulet.specialNotes && (
                  <div className="m-amulet-note">
                    {db.getLabel('track_notes_prefix', 'ໝາຍເຫດ:')} {amulet.specialNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        {settings.trackingShowPricing !== false && (
          <div className="m-info-box">
            <div className="m-pricing">
              <div className="m-price-row">
                <span className="m-price-label">{db.getLabel('track_total_fee', 'ຄ່າບໍລິການທັງໝົດ:')}</span>
                <span className="m-price-val">{(job.totalPrice || 0).toLocaleString()} ₭</span>
              </div>
              <div className="m-price-row" style={{ color: '#2ecc71' }}>
                <span className="m-price-label" style={{ color: '#2ecc71' }}>{db.getLabel('track_deposit', 'ມັດຈຳແລ້ວ:')}</span>
                <span className="m-price-val">-{(job.deposit || 0).toLocaleString()} ₭</span>
              </div>
              <div className="m-price-row m-price-total">
                <span>{db.getLabel('track_balance', 'ຍອດຄົງເຫຼືອທີ່ຕ້ອງຊຳລະຕອນຮັບພຣະ:')}</span>
                <span style={{ fontSize: '0.92rem' }}>{(job.balance || 0).toLocaleString()} ₭</span>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // DESKTOP UI RENDERING (Spacious Layout, Big Fonts, Two Columns)
  const renderDesktopUI = () => {
    return (
      <div className="tracking-grid animate-fade-in">
        
        {/* Column 1: Progress & Timeline */}
        <div className="card-glass">
          <div className="section-header">
            <h3 className="section-title">{db.getLabel('track_status_title', 'ສະຖານະ (Status)')}</h3>
          </div>

          {/* Status Banner */}
          <div 
            className="status-pill-banner" 
            style={{
              background: `rgba(${job.status === 'done' || job.status === 'ready' || job.status === 'picked_up' ? '46, 204, 113' : '241, 196, 15'}, 0.08)`,
              border: `1.5px solid ${getStatusColor(job.status)}`
            }}
          >
            <div 
              className={`status-dot-glowing ${(job.status === 'pending' || job.status === 'framing') ? 'pulse-effect' : ''}`}
              style={{ color: getStatusColor(job.status), background: getStatusColor(job.status) }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.48)' }}>
                {db.getLabel('track_current_step', 'ຂັ້ນຕອນປັດຈຸບັນ (Current Step)')}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: getStatusColor(job.status), marginTop: '2px' }}>
                {getStatusText(job.status)}
              </span>
            </div>
          </div>

          {/* Queue Position Card */}
          {(job.status === 'pending' || job.status === 'framing') && settings.trackingShowQueue !== false && (
            <div className={`queue-position-card ${queuePosition === 0 ? 'queue-next' : 'queue-waiting'}`}>
              {queuePosition === 0 ? (
                <span>{db.getLabel('track_queue_ahead', 'ຄິວຖັດໄປ / ພວມດຳເນີນການ')}</span>
              ) : (
                <span>{db.getLabel('track_queues_remaining', 'ຍັງເຫຼືອອີກ {count} ຄິວ ກ່ອນໜ້າຄິວຂອງທ່ານ').replace('{count}', String(queuePosition))}</span>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="timeline-steps">
            {timelineSteps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '18px', position: 'relative' }}>
                {idx < 3 && (
                  <div 
                    className="timeline-line"
                    style={{ background: step.done ? '#d4af37' : 'rgba(255,255,255,0.08)' }}
                  />
                )}
                <div 
                  className="timeline-node"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: step.done ? '#d4af37' : step.active ? '#1c1815' : 'rgba(255,255,255,0.03)',
                    border: step.active ? '2.5px solid #d4af37' : '2px solid rgba(255,255,255,0.08)',
                    color: step.done ? '#000' : '#fff',
                    boxShadow: step.active && !step.done ? '0 0 10px rgba(212,175,55,0.45)' : 'none'
                  }}
                >
                  {step.done ? '✓' : step.step}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: step.active ? 'bold' : 'normal', 
                    color: step.active ? '#fff' : 'rgba(255,255,255,0.38)' 
                  }}>
                    {step.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {step.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Customer Details & Amulets */}
        <div className="card-glass">
          <div className="section-header">
            <h3 className="section-title">{db.getLabel('track_customer_info_title', 'ຂໍ້ມູນລູກຄ້າ (Customer Info)')}</h3>
          </div>

          {/* Bill Details Box */}
          <div className="info-row-grid">
            <div>
              <span className="info-label">{db.getLabel('track_bill_no', 'ເລກໃບບິນຕິດຕາມ:')}</span>
              <span className="info-value" style={{ color: '#d4af37' }}>{jobId}</span>
            </div>
            <div>
              <span className="info-label">{db.getLabel('track_date', 'ວັນທີຝາກພຣະ:')}</span>
              <span className="info-value">{formatJobDateShort(job.createdDate)}</span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span className="info-label">{db.getLabel('track_customer', 'ຊື່ລູກຄ້າ:')}</span>
              <span className="info-value">{job.customerName || 'ລູກຄ້າທົ່ວໄປ (General)'}</span>
            </div>
          </div>

          {/* Amulet items list */}
          <div className="amulet-list-container">
            <span className="info-label" style={{ fontWeight: 'bold', color: '#d4af37' }}>
              {db.getLabel('track_amulet_details', 'ລາຍລະອຽດລາຍການຝາກ:')} ({job.amulets ? job.amulets.length : 0})
            </span>
            {job.amulets && job.amulets.map((amulet, i) => (
              <div key={i} className="amulet-item-card">
                <div style={{ fontWeight: 'bold', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{db.getLabel('track_amulet_prefix', 'ອົງທີ')} {i + 1}: {amulet.description || 'ພຣະເຄື່ອງ'}</span>
                  <span style={{ color: '#d4af37' }}>x1</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '4px', lineHeight: '1.4' }}>
                  {amulet.frameTypeName} {amulet.frameStyle && `• ${amulet.frameStyle}`}
                </div>
                {amulet.specialNotes && (
                  <div style={{ color: '#f1c40f', fontSize: '0.75rem', marginTop: '4px', background: 'rgba(241,196,15,0.06)', padding: '4px 8px', borderRadius: '6px' }}>
                    {db.getLabel('track_notes_prefix', 'ໝາຍເຫດ:')} {amulet.specialNotes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Financial Box */}
          {settings.trackingShowPricing !== false && (
            <div className="pricing-summary">
              <div className="price-row">
                <span className="price-label">{db.getLabel('track_total_fee', 'ຄ່າບໍລິການທັງໝົດ:')}</span>
                <span className="price-value">{(job.totalPrice || 0).toLocaleString()} ₭</span>
              </div>
              <div className="price-row" style={{ color: '#2ecc71' }}>
                <span className="price-label" style={{ color: '#2ecc71' }}>{db.getLabel('track_deposit', 'ມັດຈຳແລ້ວ:')}</span>
                <span className="price-value">-{(job.deposit || 0).toLocaleString()} ₭</span>
              </div>
              <div className="price-row price-total">
                <span>{db.getLabel('track_balance', 'ຍອດຄົງເຫຼືອທີ່ຕ້ອງຊຳລະຕອນຮັບພຣະ:')}</span>
                <span>{(job.balance || 0).toLocaleString()} ₭</span>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="tracking-page-container">
      {/* Styles Injected Dynamically */}
      <style dangerouslySetInnerHTML={{__html: `
        .tracking-page-container {
          min-height: ${isInline ? 'auto' : '100vh'};
          width: 100%;
          background: ${isInline ? 'transparent' : 'radial-gradient(circle at top, #1e1a15 0%, #0d0c0a 100%)'};
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: ${isInline ? '0px' : '24px'};
          font-family: 'Phetsarath OT', 'Noto Sans Lao', 'Inter', sans-serif;
          box-sizing: border-box;
        }
        .tracking-wrapper {
          width: 100%;
          max-width: ${showMobileUI ? '100%' : '920px'};
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .shop-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 5px;
        }
        .shop-logo-img {
          width: ${showMobileUI ? '48px' : '72px'};
          height: ${showMobileUI ? '48px' : '72px'};
          object-fit: cover;
          border-radius: 50%;
          border: 2px solid #d4af37;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
          margin-bottom: 8px;
          background: rgba(255,255,255,0.02);
        }
        .shop-name-title {
          font-size: ${showMobileUI ? '1.1rem' : '1.45rem'};
          font-weight: 800;
          color: #d4af37;
          text-shadow: 0 2px 4px rgba(0,0,0,0.6);
          margin: 0;
          letter-spacing: 0.5px;
        }
        .shop-subtitle-text {
          font-size: ${showMobileUI ? '0.7rem' : '0.82rem'};
          color: #bfa38a;
          margin: 4px 0 0 0;
          max-width: 90%;
        }
        .close-button-bar {
          align-self: flex-end;
          margin-bottom: -15px;
          z-index: 10;
        }
        .close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.75);
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .close-btn:hover {
          background: rgba(212, 175, 55, 0.12);
          color: #d4af37;
          border-color: rgba(212, 175, 55, 0.3);
        }
        .tracking-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 24px;
          width: 100%;
        }
        .card-glass {
          background: rgba(26, 23, 20, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(212, 175, 55, 0.18);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.55);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .section-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          margin-bottom: 5px;
        }
        .section-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #d4af37;
          margin: 0;
        }
        .status-pill-banner {
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .status-dot-glowing {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 12px currentColor;
        }
        .pulse-effect {
          animation: pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .queue-position-card {
          border-radius: 12px;
          padding: 12px 16px;
          text-align: center;
          font-weight: bold;
          font-size: 0.95rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .queue-next {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(46, 204, 113, 0.05) 100%);
          border: 1px solid rgba(46, 204, 113, 0.4);
          color: #2ecc71;
        }
        .queue-waiting {
          background: linear-gradient(135deg, rgba(241, 196, 15, 0.15) 0%, rgba(241, 196, 15, 0.05) 100%);
          border: 1px solid rgba(241, 196, 15, 0.4);
          color: #f1c40f;
        }
        .timeline-steps {
          display: flex;
          flex-direction: column;
          gap: 22px;
          margin: 10px 0;
        }
        .timeline-line {
          position: absolute;
          left: 13px;
          top: 26px;
          bottom: -22px;
          width: 2.5px;
          z-index: 1;
        }
        .timeline-node {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: bold;
          z-index: 2;
        }
        .info-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 14px;
        }
        .info-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.78rem;
          display: block;
          margin-bottom: 2px;
        }
        .info-value {
          font-weight: 700;
          font-size: 0.88rem;
        }
        .amulet-list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .amulet-item-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .pricing-summary {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
          padding-top: 16px;
          font-size: 0.85rem;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .price-label {
          color: rgba(255, 255, 255, 0.6);
        }
        .price-value {
          font-weight: 700;
        }
        .price-total {
          font-size: 1.05rem;
          font-weight: 800;
          color: #e74c3c;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 8px;
          margin-top: 4px;
        }
        
        /* MOBILE-SPECIFIC STYLES (Enforced when showMobileUI=true) */
        .mobile-tracking-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
        }
        .m-status-pill {
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
        }
        .m-status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
          flex-shrink: 0;
        }
        .m-label-dim {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.45);
          display: block;
        }
        .m-status-text {
          font-size: 0.85rem;
          font-weight: bold;
          margin-top: 1px;
        }
        .m-pulse {
          animation: pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .m-queue-card {
          border-radius: 8px;
          padding: 8px 12px;
          text-align: center;
          font-weight: 700;
          font-size: 0.78rem;
        }
        .m-queue-next {
          background: rgba(46, 204, 113, 0.1);
          border: 1px solid rgba(46, 204, 113, 0.35);
          color: #2ecc71;
        }
        .m-queue-waiting {
          background: rgba(241, 196, 15, 0.1);
          border: 1px solid rgba(241, 196, 15, 0.35);
          color: #f1c40f;
        }
        .m-info-box {
          background: rgba(26, 23, 20, 0.8);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .m-info-title {
          font-size: 0.82rem;
          font-weight: bold;
          color: #d4af37;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 6px;
        }
        .m-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .m-val {
          font-size: 0.78rem;
          font-weight: 700;
          margin-top: 1px;
          display: block;
        }
        .m-timeline {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .m-timeline-item {
          display: flex;
          gap: 12px;
          position: relative;
        }
        .m-timeline-line {
          position: absolute;
          left: 9px;
          top: 18px;
          bottom: -16px;
          width: 1.5px;
          z-index: 1;
        }
        .m-timeline-node {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.62rem;
          font-weight: bold;
          z-index: 2;
          flex-shrink: 0;
        }
        .m-timeline-content {
          display: flex;
          flex-direction: column;
          padding-top: 1px;
        }
        .m-timeline-label {
          font-size: 0.75rem;
        }
        .m-timeline-time {
          font-size: 0.64rem;
          color: rgba(255,255,255,0.28);
          margin-top: 2px;
        }
        .m-amulet-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .m-amulet-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .m-amulet-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.76rem;
        }
        .m-amulet-desc {
          color: rgba(255,255,255,0.45);
          font-size: 0.68rem;
          margin-top: 3px;
        }
        .m-amulet-note {
          color: #f1c40f;
          font-size: 0.65rem;
          margin-top: 4px;
          background: rgba(241,196,15,0.04);
          padding: 3px 6px;
          border-radius: 4px;
        }
        .m-pricing {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.75rem;
        }
        .m-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .m-price-label {
          color: rgba(255,255,255,0.55);
        }
        .m-price-val {
          font-weight: 700;
        }
        .m-price-total {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 6px;
          margin-top: 2px;
          color: #e74c3c;
          font-weight: 800;
        }
        
        .footer-text {
          font-size: ${showMobileUI ? '0.62rem' : '0.75rem'};
          color: rgba(255, 255, 255, 0.35);
          text-align: center;
          margin-top: 20px;
          line-height: 1.5;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(241, 196, 15, 0.5); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(241, 196, 15, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(241, 196, 15, 0); }
        }
      `}} />

      <div className="tracking-wrapper">
        {/* Close Button on Top */}
        {onClose && (
          <div className="close-button-bar">
            <button className="close-btn" onClick={onClose}>
              ✕ ປິດໜ້າຈໍຕິດຕາມ (Close)
            </button>
          </div>
        )}

        {/* Shop Logo & Header */}
        <div className="shop-header">
          {settings.receiptLogoUrl ? (
            <img src={settings.receiptLogoUrl} alt="Logo" className="shop-logo-img" />
          ) : (
            <div style={{ fontSize: showMobileUI ? '2rem' : '3rem', marginBottom: '4px' }}>📿</div>
          )}
          <h1 className="shop-name-title">{settings.shopName || 'ຂອບພຣະຣັທເກຊ'}</h1>
          <p className="shop-subtitle-text">
            {settings.trackingHeaderNote || settings.shopSubtitle || db.getLabel('track_subtitle', 'ຕິດຕາມຂັ້ນຕອນການອັດກອບພຣະເຄື່ອງຂອງທ່ານແບບ Real-time')}
          </p>
        </div>

        {/* Render View Conditional on Width / Inline Preview */}
        {!job ? (
          <div className="card-glass" style={{ textAlign: 'center', padding: showMobileUI ? '30px 16px' : '50px 24px' }}>
            <div style={{ fontSize: showMobileUI ? '2.5rem' : '3.5rem', marginBottom: '12px' }}>🔍</div>
            <h2 style={{ color: '#e74c3c', fontSize: showMobileUI ? '1.05rem' : '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0' }}>
              {db.getLabel('track_not_found', 'ບໍ່ພົບຂໍ້ມູນງານອັດກອບພຣະນີ້')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: showMobileUI ? '0.75rem' : '0.88rem', margin: 0 }}>
              {db.getLabel('track_not_found_desc', 'ກະລຸນາກວດສອບເລກໃບບິນ ຫຼື ລອງສະແກນໃໝ່ອີກຄັ້ງ')}
            </p>
          </div>
        ) : (
          showMobileUI ? renderMobileUI() : renderDesktopUI()
        )}

        {/* Footer copyright */}
        <div className="footer-text">
          <div>© {new Date().getFullYear()} {settings.shopName || 'ຂອບພຣະຣັທເກຊ'}. All rights reserved.</div>
          <div style={{ fontSize: '0.6rem', marginTop: '3px', color: 'rgba(255,255,255,0.22)' }}>
            {settings.trackingFooterNote || 'ລະບົບຕິດຕາມສະຖານະງາມເລ່ຽມພຣະແບບອັດຕະໂນມັດ (Real-Time Amulet Framing Tracker)'}
          </div>
        </div>
      </div>
    </div>
  );
}
