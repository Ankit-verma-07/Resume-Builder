import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessModal from './SuccessModal';

function Register() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [hoverCancel, setHoverCancel] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    let countdown;
    if (step === 2 && timer > 0) {
      countdown = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(countdown);
  }, [timer, step]);

  const handleCancel = async () => {
    if (email) {
      try {
        await fetch('http://localhost:5001/api/cancel-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (err) {
        console.error('Cancel registration error', err);
      }
    }
    navigate('/home');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (!isPasswordStrong(password)) {
      setMessage('Password must be at least 8 characters with uppercase, number, and symbol');
      return;
    }
    setLoading(true);
    try {
      const name = `${firstName} ${lastName}`;
      const res = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setStep(2);
        setMessage('A verification code has been sent to your email.');
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      setMessage('Server error');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    const code = otp.join('');
    if (code.length !== 6) return setMessage('Enter full 6-digit code');
    setVerifying(true);
    try {
      const res = await fetch('http://localhost:5001/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      setVerifying(false);
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/login');
        }, 1500);
      } else {
        setMessage(data.error || 'Verification failed');
      }
    } catch (err) {
      setVerifying(false);
      setMessage('Server error');
    }
  };

  const isPasswordStrong = (pwd) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /\d/.test(pwd) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    );
  };

  const getStrengthColor = () => {
    if (password.length === 0) return 'transparent';
    if (isPasswordStrong(password)) return 'green';
    if (password.length >= 6) return 'orange';
    return 'red';
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleResendOtp = async () => {
    setMessage('');
    try {
      const res = await fetch('http://localhost:5001/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(60);
        setMessage('OTP resent to your email.');
      } else {
        setMessage(data.error || 'Resend failed');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  const inputStyle = {
    width: '100%',
    height: '44px',
    padding: '0 10px',
    fontSize: '15px',
    fontFamily: 'Arial, sans-serif',
    lineHeight: '1.2',
    color: 'black',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    borderColor: '#242424',
    backgroundColor: 'white',
  };

  const iconStyle = {
    position: 'absolute',
    right: '12px',
    top: '60%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    opacity: 0.7,
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      zIndex: 9999,
    }}>
      <form
        onSubmit={step === 1 ? handleSubmit : handleVerify}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '350px',
          backgroundColor: '#fff',
          color: 'black',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {/* Close Icon */}
        <img
          src="/Logos/multiply.png"
          alt="Cancel"
          onClick={handleCancel}
          title="Cancel"
          onMouseEnter={() => setHoverCancel(true)}
          onMouseLeave={() => setHoverCancel(false)}
          style={{
            position: 'absolute',
            left: '90%',
            top: '20px',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            opacity: hoverCancel ? 1 : 0.7,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 10,
          }}
        />

        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h2>

        {step === 1 ? (
          <>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'black' }}>First Name</label>
                <input
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'black' }}>Last Name</label>
                <input
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'black' }}>Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'black' }}>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ color: 'black' }}>Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <img
                  src={showPassword ? '/Logos/view.png' : '/Logos/hidden.png'}
                  alt="toggle password"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={iconStyle}
                />
                <div
                  className="password-strength"
                  style={{
                    backgroundColor: getStrengthColor(),
                    width: '100%',
                    marginTop: '4px',
                  }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ color: 'black' }}>Confirm Password</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <img
                  src={showConfirmPassword ? '/Logos/view.png' : '/Logos/hidden.png'}
                  alt="toggle confirm password"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  style={iconStyle}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '6px' }}>
                <div className="loader"></div>
              </div>
            ) : (
              <button type="submit" style={{
                marginTop: '16px',
                marginBottom: '6px',
                width: '100%',
                height: '44px',
                backgroundColor: '#646cff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}>
                Register
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <p style={{ marginBottom: '10px', fontSize: '18px', color: 'black' }}>
                Already have an account?
              </p>
              <span
                onClick={() => navigate('/login')}
                style={{
                  color: '#646cff',
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                Login Here
              </span>
            </div>
          </>
        ) : (
          <>
            <label style={{ color: 'black', fontWeight: 'bold', fontSize: '16px' }}>Enter 6-digit OTP</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', marginBottom: '12px' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={{
                    width: '40px',
                    height: '44px',
                    fontSize: '18px',
                    textAlign: 'center',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: 'black',
                  }}
                />
              ))}
            </div>

            {timer > 0 ? (
              <p style={{ fontSize: '14px', color: 'gray' }}>Resend OTP in {timer}s</p>
            ) : (
              <button type="button" onClick={handleResendOtp} style={{ marginBottom: '10px', color: '#646cff', background: 'none', border: 'none', cursor: 'pointer' }}>
                Resend OTP
              </button>
            )}

            {verifying ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                <div className="loader"></div>
              </div>
            ) : (
              <button type="submit" style={{
                marginTop: '12px',
                width: '100%',
                height: '44px',
                backgroundColor: '#646cff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}>
                Verify
              </button>
            )}
          </>
        )}

        {message && (
          <div style={{ marginTop: '12px', color: 'red' }}>
            {message}
          </div>
        )}

        {showSuccess && (
          <SuccessModal
            message="Your account has been created!"
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

export default Register;
