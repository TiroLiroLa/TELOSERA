import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Adicionar Link
import './Login.css'; // <<< 1. Importar o novo arquivo CSS

const Login = () => {
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const { login } = useContext(AuthContext); // Pega a funçao login do contexto
  const navigate = useNavigate(); // Hook para redirecionamento

  // <<< 1. Adicionar um estado para a mensagem de erro
  const [error, setError] = useState('');

  const { email, senha } = formData;
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // <<< 4. Limpa o erro quando o usuário começa a digitar
    if (error) {
      setError('');
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError(''); // Limpa erros antigos antes de uma nova tentativa
    const success = await login(email, senha); // Chama a funçao de login do contexto
    if (success) {
      // O redirecionamento já acontece no App.js, mas podemos forçar aqui se necessário
      navigate('/dashboard'); 
    } else {
      setError('E-mail ou senha inválidos. Por favor, tente novamente.');
    }
  };

  return (
    // <<< 2. Aplicando a nova estrutura e classes CSS
    <div className="login-page-container">
      <div className="login-box">
        <h2>Realizar Login</h2>
        <form onSubmit={onSubmit} className="login-form">
          {/* <<< 3. Exibição condicional da mensagem de erro */}
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
            <input
              type="password"
              id="senha"
              placeholder="Sua senha"
              name="senha"
              value={senha}
              onChange={onChange}
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