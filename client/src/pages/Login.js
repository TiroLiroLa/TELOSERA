import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import PasswordInput from '../components/PasswordInput';
import { useHelp } from '../context/HelpContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { setHelpContent } = useHelp();

  useEffect(() => {
    setHelpContent({
      title: 'Ajuda: Login',
      content: [
        { item: 'Acesso', description: 'Use o e-mail e a senha que você cadastrou. Se ainda não tem uma conta, clique em "Cadastre-se agora!".' },
        { item: 'Conta não verificada', description: 'Se você acabou de se cadastrar, verifique seu e-mail e clique no link de ativação antes de tentar fazer login.' },
      ]
    });
  }, [setHelpContent]);

  const { email, senha } = formData;
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) {
      setError('');
    }
  };

  const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            await login(email, senha);
            navigate('/dashboard'); 
        } catch (err) {
            setError(err.msg || 'Ocorreu um erro desconhecido.');
        }
    };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <h2>Realizar Login</h2>
        <form onSubmit={onSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <PasswordInput
                id="senha"
                name="senha"
                value={senha}
                onChange={onChange}
                placeholder="Sua senha"
                required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Confirmar
          </button>
        </form>
        <div className="login-footer">
          <p>
            Não possui conta?{' '}
            <Link to="/cadastro">Cadastre-se agora!</Link>
          </p>
          <small>
            Ao continuar, você concorda com os Termos de Uso e a Política de
            Privacidade do Telosera.
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;