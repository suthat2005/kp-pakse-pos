import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

export default function Login({ onLoginSuccess }) {
  const [users, setUsers] = useState(() => db.getUsers());
  const [settings, setSettings] = useState(() => db.getSettings());

  useEffect(() => {
    const handleDbUpdate = () => {
      setUsers(db.getUsers());
      setSettings(db.getSettings());
    };
    window.addEventListener('db-updated', handleDbUpdate);
    return () => {
      window.removeEventListener('db-updated', handleDbUpdate);
    };
  }, []);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Forgot Password / OTP States
  const [view, setView] = useState('login'); // login | forgot | force_change
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');

  // Force Password Change States
  const [forceChangeUser, setForceChangeUser] = useState(null);
  const [forceNewPass, setForceNewPass] = useState('');
  const [forceConfirmPass, setForceConfirmPass] = useState('');

  // Browser-native SHA-256 password hashing helper
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

  const handleGmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
    }
  };

  const handleForceChangeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (forceNewPass.length < 6) {
      setError('ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ!');
      return;
    }
    if (forceNewPass !== forceConfirmPass) {
      setError('ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ!');
      return;
    }

    try {
      const updatedUsers = [...users];
      const userIdx = updatedUsers.findIndex(u => u.id === forceChangeUser.id);
      if (userIdx !== -1) {
        const newHash = await hashPassword(forceNewPass);
        updatedUsers[userIdx].password = forceNewPass; // fallback
        updatedUsers[userIdx].passwordHash = newHash;
        updatedUsers[userIdx].forcePasswordChange = false;
        
        db.saveUsers(updatedUsers);
        
        db.addAuditLog(
          'user_update',
          `ປ່ຽນລະຫັດຜ່ານຄັ້ງທຳອິດສຳເລັດ ສຳລັບບັນຊີ: ${forceChangeUser.email}`,
          'info'
        );

        setSuccessMessage('✓ ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ! ກະລຸນາເຂົ້າສູ່ລະບົບດ້ວຍລະຫັດຜ່ານໃໝ່');
        setForceChangeUser(null);
        setForceNewPass('');
        setForceConfirmPass('');
        setView('login');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const code = db.sendOtp(email.trim());
      setOtpSent(true);
      setSimulatedOtpCode(code);
      setSuccessMessage(`✓ ລະຫັດ OTP ຖືກສົ່ງແລ້ວ! (ລະຫັດທົດລອງ: ${code})`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyAndReset = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      db.verifyOtpAndReset(email.trim(), otp.trim(), newPassword);
      setSuccessMessage('✓ ປ່ຽນລະຫັດຜ່ານໃໝ່ສຳເລັດແລ້ວ! ກະລຸນາເຂົ້າສູ່ລະບົບ');
      setOtpSent(false);
      setOtp('');
      setNewPassword('');
      setView('login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at center, #0e1220 0%, var(--bg-main) 100%)', padding: '20px' }}>
      <div className="login-card glass-card animate-modal-entry" style={{ padding: '40px 32px', maxWidth: '400px', width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}>
        
        {/* Logo Section (Image or SVG Fallback) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          {settings.shopLogo ? (
            <img 
              src={settings.shopLogo} 
              alt="Shop Logo" 
              style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', background: '#111', border: '1px solid var(--border-color)' }} 
            />
          ) : (
            <svg className="login-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '80px', height: '80px' }}>
              <rect width="100" height="100" rx="50" fill="#161411" />
              <path d="M50 20C45 35 30 40 30 55C30 65 40 75 50 75C60 75 70 65 70 55C70 40 55 35 50 20Z" fill="#d4af37" opacity="0.9"/>
              <path d="M50 28C47 38 36 42 36 53C36 60 42 67 50 67C58 67 64 60 64 53C64 42 53 38 50 28Z" fill="#161411" />
              <path d="M50 35C48 41 41 45 41 52C41 57 45 61 50 61C55 61 59 57 59 52C59 45 52 41 50 35Z" fill="#d4af37" />
            </svg>
          )}
        </div>

        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '4px', fontSize: '1.35rem', textAlign: 'center' }}>
          {settings.shopName || 'ຂອບພຣະຣັທເກຊ'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '25px', textAlign: 'center' }}>
          {settings.shopSubtitle || 'ລະບົບ POS & ຈັດການຮ້ານອັດກອບພຣະເຄື່ອງ'}
        </p>

        {error && (
          <p style={{ color: 'var(--alert-red)', fontSize: '0.8rem', marginBottom: '16px', background: 'rgba(231, 76, 60, 0.08)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
            {error}
          </p>
        )}

        {successMessage && (
          <p style={{ color: 'var(--success-green)', fontSize: '0.8rem', marginBottom: '16px', background: 'rgba(46, 204, 113, 0.08)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
            {successMessage}
          </p>
        )}

        {view === 'login' ? (
          /* Email & Password Login Form */
          <form onSubmit={handleGmailSubmit} style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">{db.getLabel('login_email_label', 'Gmail / Email')}</label>
              <input
                type="email"
                className="form-control"
                placeholder="example@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">{db.getLabel('login_password_label', 'ລະຫັດຜ່ານ (Password)')}</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 14px' }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                ລືມລະຫັດຜ່ານ? (Forgot Password?)
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontWeight: 'bold', borderRadius: 'var(--radius-sm)', marginTop: '6px' }}>
              {db.getLabel('login_btn_text', '🚀 ເຂົ້າສູ່ລະບົບ')}
            </button>
          </form>
        ) : view === 'force_change' ? (
          /* Force Password Change Form */
          <form onSubmit={handleForceChangeSubmit} style={{ textAlign: 'left' }}>
            <h3 style={{ color: 'var(--alert-red)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              🔒 ບັງຄັບປ່ຽນລະຫັດຜ່ານ
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              ກະລຸນາຕັ້ງລະຫັດຜ່ານໃໝ່ ສຳລັບການເຂົ້າໃຊ້ງານຄັ້ງທຳອິດ ເພື່ອຄວາມປອດໄພຂອງບັນຊີ.
            </p>

            <div className="form-group">
              <label className="form-label">ລະຫັດຜ່ານໃໝ່ (New Password)</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                value={forceNewPass}
                onChange={(e) => setForceNewPass(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">ຢືນຢັນລະຫັດຜ່ານໃໝ່ (Confirm Password)</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                value={forceConfirmPass}
                onChange={(e) => setForceConfirmPass(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
              💾 ຢືນຢັນການປ່ຽນລະຫັດຜ່ານ
            </button>

            <button 
              type="button" 
              onClick={() => { setView('login'); setError(''); setSuccessMessage(''); setForceChangeUser(null); }}
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
            >
              ຍົກເລີກ (Cancel)
            </button>
          </form>
        ) : (
          /* Forgot Password OTP Request Form */
          <form onSubmit={otpSent ? handleVerifyAndReset : handleSendOtp} style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">{db.getLabel('login_email_label', 'Gmail / Email')}</label>
              <input
                type="email"
                className="form-control"
                placeholder="example@gmail.com"
                required
                disabled={otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {otpSent && (
              <>
                <div className="form-group">
                  <label className="form-label">ລະຫັດ OTP 6 ຫຼັກ (OTP Code)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter 6-digit OTP"
                    required
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">ລະຫັດຜ່ານໃໝ່ (New Password)</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
              {otpSent ? '💾 ຢືນຢັນ ແລະ ປ່ຽນລະຫັດຜ່ານ' : '🔑 ສົ່ງລະຫັດ OTP'}
            </button>

            <button 
              type="button" 
              onClick={() => { setView('login'); setError(''); setSuccessMessage(''); setOtpSent(false); }}
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
            >
              ຍົກເລີກ (Cancel)
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
