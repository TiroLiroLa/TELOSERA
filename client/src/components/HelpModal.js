import React from 'react';
import Modal from './Modal';
import { useHelp } from '../context/HelpContext';
import './HelpModal.css';

const HelpModal = () => {
    const { isHelpOpen, closeHelp, currentHelp } = useHelp();

    if (!isHelpOpen) {
        return null;
    }

    return (
        <Modal isOpen={isHelpOpen} onClose={closeHelp}>
            <div className="help-modal-content">
                <h2>{currentHelp.title}</h2>
                {Array.isArray(currentHelp.content) ? (
                    <ul className="help-list">
                        {currentHelp.content.map((item, index) => (
                            <li key={index}>
                                <strong>{item.item}:</strong> {item.description}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: currentHelp.content }} />
                )}
                <button onClick={closeHelp} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Fechar
                </button>
            </div>
        </Modal>
    );
};

export default HelpModal;