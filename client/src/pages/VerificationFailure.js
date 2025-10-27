import React from 'react';
import { Link } from 'react-router-dom';

const VerificationFailure = () => (
    <div className="container" style={{ textAlign: 'center' }}>
        <h2>Ocorreu um Erro</h2>
        <p>O link de verificação é inválido ou já expirou. Por favor, tente se cadastrar novamente.</p>
        <Link to="/cadastro" className="btn btn-primary">Voltar para o Cadastro</Link>
    </div>
);
export default VerificationFailure;