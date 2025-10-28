import React, { useState } from 'react';
import './PasswordInput.css';
import { ReactComponent as EyeIcon } from '../assets/eye.svg';
import { ReactComponent as EyeOffIcon } from '../assets/eye-off.svg';

const PasswordInput = ({ value, onChange, name, id, placeholder, required = false, className = '' }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="password-wrapper">
            <input
                type={showPassword ? "text" : "password"}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={className}
            />
            <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1" // Evita que o Tab pare neste botão ao navegar no formulário
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
        </div>
    );
};

export default PasswordInput;