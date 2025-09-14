// client/src/pages/Cadastro.js

import React, { useState } from 'react';
import axios from 'axios';

// Componente funcional para a página de cadastro
const Cadastro = () => {
  // O hook useState gerencia o estado do formulário.
  // 'formData' é um objeto que guarda todos os valores dos campos.
  // 'setFormData' � a fun��o que usamos para atualizar esses valores.
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    tipo_usuario: 'P', // 'P' para Prestador, 'E' para Empresa
  });

  // Desestruturando as vari�veis do estado para facilitar o uso no JSX
  const { nome, email, senha, confirmarSenha, cpf, tipo_usuario } = formData;

  // Fun��o 'onChange' que � chamada toda vez que o usu�rio digita em um campo.
  // Ela atualiza o estado 'formData' com o novo valor.
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Fun��o 'onSubmit' que � chamada quando o formul�rio � enviado.
  const onSubmit = async e => {
    e.preventDefault(); // Impede o recarregamento da p�gina

    // Valida��o simples para verificar se as senhas coincidem
    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    try {
      // Cria o objeto com os dados a serem enviados para a API
      const novoUsuario = {
        nome,
        email,
        senha,
        cpf,
        tipo_usuario,
      };

      // Configura��o para a requisi��o POST
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Converte o objeto JavaScript para uma string JSON
      const body = JSON.stringify(novoUsuario);

      // Faz a requisi��o POST para a nossa API backend
      // A URL completa � http://localhost:3001/api/users/register
      const res = await axios.post('/api/users/register', body, config);

      console.log(res.data); // Exibe a resposta da API no console
      alert('Cadastro realizado com sucesso!');
      // Aqui voc� poderia redirecionar o usu�rio para a p�gina de login

    } catch (err) {
      console.error(err.response.data);
      alert(`Erro no cadastro: ${err.response.data.msg}`);
    }
  };

  // JSX: A estrutura HTML do nosso componente
  return (
    <div className="container">
      <h1>Cadastre-se</h1>
      <p>Crie sua conta no TELOSERA</p>
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="text"
            placeholder="Nome Completo"
            name="nome"
            value={nome}
            onChange={onChange}
            required
          />
        </div>
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
            minLength="6"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirme a Senha"
            name="confirmarSenha"
            value={confirmarSenha}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="CPF"
            name="cpf"
            value={cpf}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <p>Tipo de Conta:</p>
          <input
            type="radio"
            name="tipo_usuario"
            value="P"
            checked={tipo_usuario === 'P'}
            onChange={onChange}
          /> Prestador de Serviço
          <input
            type="radio"
            name="tipo_usuario"
            value="E"
            checked={tipo_usuario === 'E'}
            onChange={onChange}
          /> Empresa
        </div>
        <input type="submit" value="Registrar" />
      </form>
    </div>
  );
};

export default Cadastro;