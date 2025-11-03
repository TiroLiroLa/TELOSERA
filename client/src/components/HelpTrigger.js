import React from 'react';
import { useHelp } from '../context/HelpContext';
import helpIcon from '../assets/help-circle.svg'; // Ícone de ajuda
import './HelpTrigger.css';

const HelpTrigger = () => {
    const { openHelp } = useHelp();

    return (
        <button onClick={openHelp} className="help-trigger-button" title="Ajuda (F1)">
            <img src={helpIcon} alt="Ajuda" />
        </button>
    );
};

export default HelpTrigger;