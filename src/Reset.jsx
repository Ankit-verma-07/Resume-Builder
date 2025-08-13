import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessModal from './SuccessModal';

function Reset() {
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const inputStyle = {
    width: '100%',
    height: '44px',
    padding: '0 10px',
    fontSize: '15px',
    fontFamily: 'Arial, sans-serif',
    color: 'black',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const iconStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    opacity: 0.7,
  };

  const checkPasswordStrength = (value) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    setPasswordStrength(score);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setMessage('');
    setSending(true);
    try {
      const res = await fetch('http://localhost:5001/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername })
      });
      const data = await res.json();
      setSending(false);
      if (res.ok) {
        setUserEmail(data.email);
        setStep(2);
        setMessage('OTP sent to your email');
      } else {
        setMessage(data.error || 'Failed to send code');
      }
    } catch (err) {
      setSending(false);
      setMessage('Server error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setResetting(true);
    try {
      const res = await fetch('http://localhost:5001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code, newPassword }),
      });
      const data = await res.json();
      setResetting(false);
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/login');
        }, 1500);
      } else {
        setMessage(data.error || 'Reset failed');
      }
    } catch (err) {
      setResetting(false);
      setMessage('Server error');
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'transparent';
      case 1: return 'red';
      case 2: return 'orange';
      case 3: return '#f1c40f';
      case 4: return 'green';
      default: return 'transparent';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
      zIndex: 9999,
    }}>
      <form
        onSubmit={step === 1 ? handleSendCode : handleResetPassword}
        style={{
          width: '100%',
          maxWidth: '300px',
          backgroundColor: '#fff',
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'black' }}>
          Reset Your Password
        </h2>

        {step === 1 && (
          <>
            <label style={{ color: 'black' }}>Email or Username</label>
            <input
              type="text"
              placeholder="Enter your email or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              style={inputStyle}
            />
          </>
        )}

        {step === 2 && (
          <>
            <label style={{ color: 'black' }}>OTP Code</label>
            <input
              type="text"
              placeholder="Enter the code sent to your email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              style={inputStyle}
            />

            <label style={{ color: 'black', marginTop: '12px' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
              />
              <img
                src={showPassword ? '/Logos/view.png' : '/Logos/hidden.png'}
                alt="toggle password"
                onClick={() => setShowPassword(prev => !prev)}
                style={iconStyle}
              />
            </div>
            <div style={{
              height: '6px',
              width: '100%',
              marginTop: '6px',
              borderRadius: '4px',
              backgroundColor: '#eee',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(passwordStrength / 4) * 100}%`,
                height: '100%',
                backgroundColor: getStrengthColor(),
                transition: 'width 0.3s ease-in-out'
              }} />
            </div>
          </>
        )}

        {(step === 1 && sending) || (step === 2 && resetting) ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <div className="loader"></div>
          </div>
        ) : (
          <button
            type="submit"
            style={{
              marginTop: '20px',
              width: '100%',
              height: '44px',
              backgroundColor: '#646cff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {step === 1 ? 'Send Code' : 'Reset Password'}
          </button>
        )}

        {message && (
          <div style={{ marginTop: '12px', color: message.includes('successful') ? 'green' : 'red' }}>
            {message}
          </div>
        )}

        {showSuccess && (
          <SuccessModal
            message="Password reset successful!"
            onClose={() => {
              setShowSuccess(false);
              navigate('/login');
            }}
          />
        )}
      </form>
    </div>
  );
}

export default Reset;
