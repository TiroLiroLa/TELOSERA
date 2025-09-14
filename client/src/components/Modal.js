// client/src/components/Modal.js
import React from 'react';
import './Modal.css'; // Vamos criar este CSS

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
        <button className="modal-close-button" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
};

export default Modal;