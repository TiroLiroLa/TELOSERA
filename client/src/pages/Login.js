import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const { login } = useContext(AuthContext); // Pega a funçao login do contexto

  const { email, senha } = formData;
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    const success = await login(email, senha); // Chama a funçao de login do contexto
    if (success) {
      alert('Login realizado com sucesso!');
      // O redirecionamento agora e feito no App.js
    } else {
      alert('Erro no login: Credenciais inválidas.');
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <p>Acesse sua conta TELOSERA</p>
      <form onSubmit={onSubmit}>
        <div>
          <input type="email" placeholder="E-mail" name="email" value={email} onChange={onChange} required />
        </div>
        <div>
          <input type="password" placeholder="Senha" name="senha" value={senha} onChange={onChange} required />
        </div>
        <input type="submit" value="Login" />
      </form>
    </div>
  );
};

export default Login;