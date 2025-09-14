import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });

  const { email, senha } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const body = JSON.stringify(formData);
      const config = {
        headers: { 'Content-Type': 'application/json' },
      };

      // Faz a requisição para a rota de login
      const res = await axios.post('/api/users/login', body, config);

      console.log('Login bem-sucedido!', res.data);
      alert('Login realizado com sucesso!');

      // Armazena o token no localStorage
      localStorage.setItem('token', res.data.token);
      
      // Aqui, futuramente, vamos redirecionar o usuário para a página principal
      // window.location.href = '/dashboard';

    } catch (err) {
      console.error(err.response.data);
      alert(`Erro no login: ${err.response.data.msg}`);
      localStorage.removeItem('token');
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <p>Acesse sua conta TELOSERA</p>
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="email"
            placeholder="Endereço de E-mail"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Senha"
            name="senha"
            value={senha}
            onChange={onChange}
            required
          />
        </div>
        <input type="submit" value="Login" />
      </form>
    </div>
  );
};

export default Login;