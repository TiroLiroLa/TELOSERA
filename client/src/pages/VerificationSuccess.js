import React from 'react';
import { Link } from 'react-router-dom';

const VerificationSuccess = () => (
    <div className="container" style={{ textAlign: 'center' }}>
        <h2>E-mail Verificado com Sucesso!</h2>
        <p>Sua conta foi ativada. Agora você já pode fazer login.</p>
        <Link to="/login" className="btn btn-primary">Ir para o Login</Link>
    </div>
);
export default VerificationSuccess;