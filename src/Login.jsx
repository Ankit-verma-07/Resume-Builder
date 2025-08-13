import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // ✅ New state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailOrUsername,
          password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('loggedIn', 'true');
  storage.setItem('userInfo', emailOrUsername); // ✅ Save email or username
  setMessage('Login successful!');
  setEmailOrUsername('');
  setPassword('');
  if (onLogin) onLogin();
  navigate(-1);
}
 else {
        setMessage(data.error || 'Login failed');
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

  return (
    <div style={{ position: 'relative' }}>
      <img
        src="/Logos/multiply.png"
        alt="Cancel"
        onClick={() => {
        const fromPage = location.state?.from === 'resume-builder' ? '/resume-builder' : '/home';
        navigate(fromPage);
        }}
        onMouseEnter={() => setIsCancelHovered(true)}
        onMouseLeave={() => setIsCancelHovered(false)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          opacity: isCancelHovered ? 1 : 0.7,
          transition: 'opacity 0.2s ease-in-out',
          zIndex: 10,
        }}
        title="Cancel"
      />

      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="auth-title">Login</h2>

        <div className="input-group">
          <label>Email or Username</label>
          <input
            type="text"
            placeholder="Enter your email or username"
            value={emailOrUsername}
            onChange={e => setEmailOrUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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
          </div>

          <div style={{ marginTop: '6px', textAlign: 'right' }}>
            <span
              onClick={() => navigate('/Reset')}
              style={{
                color: '#646cff',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
              }}
            >
              Forgot Password?
            </span>
          </div>
        </div>

        {/* ✅ Remember Me Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            style={{ marginRight: '8px' }}
          />
          <label htmlFor="rememberMe" style={{ color: 'black', fontSize: '14px' }}>
            Remember Me
          </label>
        </div>

        <button
          className="auth-btn"
          type="submit"
          style={{
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
          }}
        >
          Login
        </button>

        <div style={{ textAlign: 'center', marginTop: '4px', lineHeight: '1.4' }}>
          <p style={{ margin: '0 0 10px', fontSize: '18px', color: 'black' }}>
            Don&apos;t have an account?
          </p>
          <span
            onClick={() => navigate('/register', { state: { from: 'resume-builder' } })}
            style={{
              color: '#646cff',
              fontWeight: 'bold',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            Create Account
          </span>
        </div>

        {message && (
          <div className="auth-message" style={{ marginTop: '12px' }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
