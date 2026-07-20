import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

/* ──────────────────────────────────────────────────────
   KP Pakse POS — Premium Login Screen v3.0
   All business logic preserved. Visual fully redesigned.
────────────────────────────────────────────────────── */

export default function Login({ onLoginSuccess }) {
  const [users, setUsers] = useState(() => db.getUsers());
  const [settings, setSettings] = useState(() => db.getSettings());

  useEffect(() => {
    const handleDbUpdate = () => {
      setUsers(db.getUsers());
      setSettings(db.getSettings());
    };
    window.addEventListener('db-updated', handleDbUpdate);
    return () => window.removeEventListener('db-updated', handleDbUpdate);
  }, []);

  // ── Login States ──────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── View: login | forgot | force_change ───────────────
  const [view, setView] = useState('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [_simulatedOtpCode, setSimulatedOtpCode] = useState('');

  // ── Force Password Change ─────────────────────────────
  const [forceChangeUser, setForceChangeUser] = useState(null);
  const [forceNewPass, setForceNewPass] = useState('');
  const [forceConfirmPass, setForceConfirmPass] = useState('');

  // ── Shake animation on error ──────────────────────────
  const [shakeKey, setShakeKey] = useState(0);

  const triggerShake = () => setShakeKey(k => k + 1);

  // ── SHA-256 hashing (unchanged) ───────────────────────
  const hashPassword = async (pass) => {
    try {
      const msgBuffer = new TextEncoder().encode(pass);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  // ── Login submit (unchanged logic) ───────────────────
  const handleGmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const enteredHash = await hashPassword(password);
    let foundUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() &&
             (u.password === password || u.passwordHash === enteredHash)
    );

    if (!foundUser) {
      try {
        const baseUrl = window.location.protocol + '//' + window.location.host;
        const res = await fetch(`${baseUrl}/api/db/sync?users=0`);
        const serverData = await res.json();
        if (serverData && serverData.users) {
          const serverTable = serverData.users;
          localStorage.setItem('amulet_pos_users', JSON.stringify(serverTable.data));
          localStorage.setItem('amulet_pos_ts_users', String(serverTable.updatedAt));
          const updatedUsers = db.getUsers();
          setUsers(updatedUsers);
          foundUser = updatedUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase().trim() &&
                   (u.password === password || u.passwordHash === enteredHash)
          );
        }
      } catch (err) {
        console.error('Login dynamic sync failed:', err);
      }
    }

    setLoading(false);

    if (foundUser) {
      if (foundUser.forcePasswordChange) {
        setForceChangeUser(foundUser);
        setView('force_change');
      } else {
        db.setActiveUser(foundUser);
        onLoginSuccess(foundUser);
      }
    } else {
      setError(db.getLabel('login_error_invalid', 'ອີເມລ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!'));
      triggerShake();
    }
  };

  const handleForceChangeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (forceNewPass.length < 6) { setError('ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ!'); triggerShake(); return; }
    if (forceNewPass !== forceConfirmPass) { setError('ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ!'); triggerShake(); return; }
    try {
      const updatedUsers = [...users];
      const userIdx = updatedUsers.findIndex(u => u.id === forceChangeUser.id);
      if (userIdx !== -1) {
        const newHash = await hashPassword(forceNewPass);
        updatedUsers[userIdx].password = forceNewPass;
        updatedUsers[userIdx].passwordHash = newHash;
        updatedUsers[userIdx].forcePasswordChange = false;
        db.saveUsers(updatedUsers);
        db.addAuditLog('user_update', `ປ່ຽນລະຫັດຜ່ານຄັ້ງທຳອິດ: ${forceChangeUser.email}`, 'info');
        setSuccessMessage('✓ ປ່ຽນລະຫັດຜ່ານສຳເລັດ!');
        setForceChangeUser(null); setForceNewPass(''); setForceConfirmPass('');
        setView('login');
      }
    } catch (err) { setError(err.message); }
  };

  const handleSendOtp = (e) => {
    e.preventDefault(); setError(''); setSuccessMessage('');
    try {
      const code = db.sendOtp(email.trim());
      setOtpSent(true); setSimulatedOtpCode(code);
      setSuccessMessage(`✓ ສົ່ງ OTP ແລ້ວ! (ລະຫັດທົດລອງ: ${code})`);
    } catch (err) { setError(err.message); }
  };

  const handleVerifyAndReset = (e) => {
    e.preventDefault(); setError(''); setSuccessMessage('');
    try {
      db.verifyOtpAndReset(email.trim(), otp.trim(), newPassword);
      setSuccessMessage('✓ ປ່ຽນລະຫັດຜ່ານສຳເລັດ!');
      setOtpSent(false); setOtp(''); setNewPassword('');
      setView('login');
    } catch (err) { setError(err.message); triggerShake(); }
  };

  // ── Current year ─────────────────────────────────────
  const year = new Date().getFullYear();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 60%, rgba(10,16,30,1) 0%, #030508 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Phetsarath OT', 'Phetsarath', 'Noto Sans Lao', sans-serif",
    }}>

      {/* ── Ambient background orbs ────────────────────── */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%',
        width: '45vw', height: '45vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'floatOrb 8s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '40vw', height: '40vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'floatOrb 10s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position: 'absolute', top: '40%', right: '15%',
        width: '20vw', height: '20vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
      }}/>

      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes loginShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.25), 0 0 40px rgba(212,175,55,0.1); }
          50%       { box-shadow: 0 0 30px rgba(212,175,55,0.45), 0 0 60px rgba(212,175,55,0.2); }
        }
        @keyframes statusDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .login-input {
          width: 100%;
          background: rgba(6,10,18,0.9) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: white !important;
          padding: 0 42px 0 14px !important;
          font-family: inherit !important;
          font-size: 0.9rem !important;
          height: 46px !important;
          outline: none !important;
          transition: all 0.18s !important;
          box-sizing: border-box !important;
        }
        .login-input:focus {
          border-color: rgba(212,175,55,0.6) !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.12) !important;
          background: rgba(8,14,24,1) !important;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.22) !important; }
        .login-btn-primary {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #d4af37 0%, #b59228 100%);
          border: none;
          border-radius: 12px;
          color: #060a12;
          font-weight: 800;
          font-size: 0.93rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(212,175,55,0.35);
          letter-spacing: 0.1px;
        }
        .login-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #e8c96a 0%, #d4af37 100%);
          box-shadow: 0 6px 28px rgba(212,175,55,0.5);
          transform: translateY(-1px);
        }
        .login-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-btn-secondary {
          width: 100%;
          height: 44px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: rgba(255,255,255,0.7);
          font-size: 0.88rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn-secondary:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
          color: white;
        }
        .login-field-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 7px;
        }
        .login-field-wrap { margin-bottom: 16px; }
        .login-field-row { position: relative; }
        .login-toggle-pw {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          font-size: 0.8rem;
          padding: 4px;
          transition: color 0.15s;
        }
        .login-toggle-pw:hover { color: rgba(255,255,255,0.65); }
      `}</style>

      {/* ── Main Card ──────────────────────────────────── */}
      <div
        key={shakeKey}
        style={{
          background: 'linear-gradient(160deg, rgba(10,16,30,0.97) 0%, rgba(6,10,20,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 22,
          maxWidth: 420,
          width: '100%',
          padding: '40px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07)',
          animation: shakeKey > 0
            ? 'loginShake 0.5s ease-in-out, loginSlideUp 0.4s ease-out'
            : 'loginSlideUp 0.4s ease-out',
          position: 'relative',
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
          borderRadius: '0 0 2px 2px',
        }}/>

        {/* ── Logo + Shop name ─────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {settings.shopLogo ? (
              <img
                src={settings.shopLogo}
                alt="Shop Logo"
                style={{
                  width: 76, height: 76, objectFit: 'cover',
                  borderRadius: 18,
                  border: '2px solid rgba(212,175,55,0.45)',
                  animation: 'logoGlow 3s ease-in-out infinite',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              />
            ) : (
              <div style={{
                width: 76, height: 76, borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))',
                border: '2px solid rgba(212,175,55,0.35)',
                animation: 'logoGlow 3s ease-in-out infinite',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
              }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
            )}
          </div>

          <h1 style={{
            color: '#d4af37', fontSize: '1.25rem', fontWeight: 900,
            margin: 0, letterSpacing: '-0.2px',
          }}>
            {settings.shopName || 'KP Pakse POS'}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem',
            margin: '5px 0 0', letterSpacing: '0.2px',
          }}>
            {settings.shopSubtitle || 'ລະບົບ POS ຈັດການຮ້ານຄ້າ'}
          </p>

          {/* Online status */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 10, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.18)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e',
              animation: 'statusDot 2s ease-in-out infinite',
              boxShadow: '0 0 6px #22c55e',
            }}/>
            <span style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700 }}>
              ລະບົບພ້ອມໃຊ້ງານ
            </span>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }}/>

        {/* ── Alerts ───────────────────────────────────── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            marginBottom: 16, fontSize: '0.82rem',
            color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {error}
          </div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 10, padding: '10px 14px',
            marginBottom: 16, fontSize: '0.82rem',
            color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {successMessage}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            VIEW: LOGIN
        ════════════════════════════════════════════════ */}
        {view === 'login' && (
          <form onSubmit={handleGmailSubmit}>
            <div className="login-field-wrap">
              <label className="login-field-label">
                {db.getLabel('login_email_label', 'Gmail / Email')}
              </label>
              <div className="login-field-row">
                <input
                  type="email"
                  className="login-input"
                  placeholder="example@gmail.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingRight: '14px' }}
                />
              </div>
            </div>

            <div className="login-field-wrap" style={{ marginBottom: 10 }}>
              <label className="login-field-label">
                {db.getLabel('login_password_label', 'ລະຫັດຜ່ານ (Password)')}
              </label>
              <div className="login-field-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 22 }}>
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(212,175,55,0.7)', fontSize: '0.76rem',
                  cursor: 'pointer', textDecoration: 'underline',
                  textDecorationColor: 'rgba(212,175,55,0.3)',
                  fontFamily: 'inherit',
                }}
              >
                ລືມລະຫັດຜ່ານ?
              </button>
            </div>

            <button
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#060a12',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }}/>
                  ກຳລັງເຂົ້າສູ່ລະບົບ...
                </>
              ) : (
                <>{db.getLabel('login_btn_text', 'ເຂົ້າສູ່ລະບົບ')}</>
              )}
            </button>
          </form>
        )}

        {/* ════════════════════════════════════════════════
            VIEW: FORCE PASSWORD CHANGE
        ════════════════════════════════════════════════ */}
        {view === 'force_change' && (
          <form onSubmit={handleForceChangeSubmit}>
            <div style={{
              textAlign: 'center', marginBottom: 20,
              padding: '12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              
              <h3 style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                ບັງຄັບປ່ຽນລະຫັດຜ່ານ
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.74rem', margin: '6px 0 0', lineHeight: 1.5 }}>
                ກະລຸນາຕັ້ງລະຫັດຜ່ານໃໝ່ ສຳລັບການເຂົ້າໃຊ້ງານຄັ້ງທຳອິດ
              </p>
            </div>

            <div className="login-field-wrap">
              <label className="login-field-label">ລະຫັດຜ່ານໃໝ່</label>
              <input type="password" className="login-input" placeholder="••••••••"
                required value={forceNewPass} onChange={e => setForceNewPass(e.target.value)}
                style={{ paddingRight: 14 }}
              />
            </div>
            <div className="login-field-wrap" style={{ marginBottom: 22 }}>
              <label className="login-field-label">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
              <input type="password" className="login-input" placeholder="••••••••"
                required value={forceConfirmPass} onChange={e => setForceConfirmPass(e.target.value)}
                style={{ paddingRight: 14 }}
              />
            </div>

            <button type="submit" className="login-btn-primary" style={{ marginBottom: 10 }}>
              ຢືນຢັນການປ່ຽນລະຫັດຜ່ານ
            </button>
            <button type="button" className="login-btn-secondary"
              onClick={() => { setView('login'); setError(''); setSuccessMessage(''); setForceChangeUser(null); }}>
              ຍົກເລີກ
            </button>
          </form>
        )}

        {/* ════════════════════════════════════════════════
            VIEW: FORGOT PASSWORD / OTP
        ════════════════════════════════════════════════ */}
        {view === 'forgot' && (
          <form onSubmit={otpSent ? handleVerifyAndReset : handleSendOtp}>
            <div style={{
              textAlign: 'center', marginBottom: 20,
              padding: '10px', borderRadius: 10,
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.18)',
            }}>
              
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.74rem', margin: 0, lineHeight: 1.5 }}>
                {otpSent
                  ? 'ກວດເບິ່ງ OTP ໃນ Email ຂອງທ່ານ ແລ້ວຕັ້ງລະຫັດໃໝ່'
                  : 'ໃສ່ Email ທີ່ລົງທະບຽນ ເພື່ອຮັບ OTP ຣີເຊັດລະຫັດ'}
              </p>
            </div>

            <div className="login-field-wrap">
              <label className="login-field-label">{db.getLabel('login_email_label', 'Gmail / Email')}</label>
              <input type="email" className="login-input" placeholder="example@gmail.com"
                required disabled={otpSent} value={email} onChange={e => setEmail(e.target.value)}
                style={{ paddingRight: 14, opacity: otpSent ? 0.55 : 1 }}
              />
            </div>

            {otpSent && (
              <>
                <div className="login-field-wrap">
                  <label className="login-field-label">ລະຫັດ OTP 6 ຫຼັກ</label>
                  <input type="text" className="login-input" placeholder="000000"
                    required maxLength="6" value={otp}
                    onChange={e => setOtp(e.target.value)}
                    style={{ letterSpacing: '0.3em', textAlign: 'center', paddingRight: 14 }}
                  />
                </div>
                <div className="login-field-wrap" style={{ marginBottom: 22 }}>
                  <label className="login-field-label">ລະຫັດຜ່ານໃໝ່</label>
                  <input type="password" className="login-input" placeholder="••••••••"
                    required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={{ paddingRight: 14 }}
                  />
                </div>
              </>
            )}

            <button type="submit" className="login-btn-primary" style={{ marginBottom: 10 }}>
              {otpSent ? 'ຢືນຢັນ ແລະ ປ່ຽນລະหັດຜ່ານ' : 'ສົ່ງລະຫັດ OTP'}
            </button>
            <button type="button" className="login-btn-secondary"
              onClick={() => { setView('login'); setError(''); setSuccessMessage(''); setOtpSent(false); }}>
              ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ
            </button>
          </form>
        )}

        {/* ── Footer ────────────────────────────────────── */}
        <div style={{
          marginTop: 28, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
            © {year} KP Pakse POS · ລະບົບ POS ຄຸນນະພາບສູງ
          </p>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
