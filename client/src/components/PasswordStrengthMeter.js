import React, { useEffect, useState } from 'react';
import './PasswordStrengthMeter.css'; // Vamos criar este CSS

const PasswordStrengthMeter = ({ password }) => {
    const [validation, setValidation] = useState({
        minLength: false,
        hasUpper: false,
        hasNumber: false,
    });

    useEffect(() => {
        setValidation({
            minLength: password.length >= 6,
            hasUpper: /(?=.*[A-Z])/.test(password),
            hasNumber: /(?=.*[0-9])/.test(password),
        });
    }, [password]);

    const getStrength = () => {
        const checksPassed = Object.values(validation).filter(v => v).length;
        if (password.length === 0) return { label: '', color: '' };
        if (checksPassed === 1) return { label: 'Fraca', color: 'red' };
        if (checksPassed === 2) return { label: 'Média', color: 'orange' };
        if (checksPassed === 3) return { label: 'Forte', color: 'green' };
        return { label: '', color: '' };
    };

    const strength = getStrength();

    const renderValidationMessage = (isValid, message) => {
        return (
            <li className={isValid ? 'valid' : 'invalid'}>
                {isValid ? '✓' : '✗'} {message}
            </li>
        );
    };

    if (password.length === 0) return null;

    return (
        <div className="strength-meter">
            <p className="strength-label" style={{ color: strength.color }}>
                Força da senha: <strong>{strength.label}</strong>
            </p>
            <ul className="validation-list">
                {renderValidationMessage(validation.minLength, 'Mínimo de 6 caracteres')}
                {renderValidationMessage(validation.hasUpper, 'Pelo menos uma letra maiúscula')}
                {renderValidationMessage(validation.hasNumber, 'Pelo menos um número')}
            </ul>
        </div>
    );
};

export default PasswordStrengthMeter;