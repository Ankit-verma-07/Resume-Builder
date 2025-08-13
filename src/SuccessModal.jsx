// SuccessModal.jsx
import React from 'react';

function SuccessModal({ message = "Your operation was successful!", onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
    }}>
      <div style={{
        background: '#fff',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px',
        width: '90%',
      }}>
        <div style={{ fontSize: '48px', color: 'green' }}>✔</div>
        <h2 style={{ marginTop: '10px', color: 'black' }}>Success</h2>
        <p style={{ color: '#444', fontSize: '16px' }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            backgroundColor: '#646cff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;
