// ModalWrapper.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function ModalWrapper({ children }) {
  const navigate = useNavigate();

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      navigate('/home');
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div style={{ zIndex: 10000 }}>
        {children}
      </div>
    </div>
  );
}

export default ModalWrapper;
