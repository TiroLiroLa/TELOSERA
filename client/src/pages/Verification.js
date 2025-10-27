import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Verification = () => {
    const { token } = useParams(); // Pega o token da URL
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await axios.get(`/api/users/verify/${token}`);
                navigate('/verification-success');
            } catch (error) {
                navigate('/verification-failure');
            }
        };

        if (token) {
            verifyEmail();
        } else {
            navigate('/verification-failure');
        }

    }, [token, navigate]);
    return (
        <div className="container" style={{ textAlign: 'center' }}>
            <h2>Verificando seu e-mail...</h2>
            <p>Por favor, aguarde.</p>
        </div>
    );
};

export default Verification;