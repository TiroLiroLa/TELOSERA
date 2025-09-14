// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
// NÃO precisamos mais do bcrypt, pois o trigger do banco de dados fará o hash.
// const bcrypt = require('bcryptjs'); 
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Rota POST para registrar um novo usuário
router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo_usuario, cpf } = req.body;

  if (!nome || !email || !senha || !tipo_usuario || !cpf) {
    return res.status(400).json({ msg: 'Por favor, insira todos os campos obrigatórios.' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM Usuario WHERE email = $1 OR cpf = $2', [email, cpf]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'Usuário com este e-mail ou CPF já existe.' });
    }

    // Removido o código de hash do bcrypt. 
    // Nós vamos enviar a senha como texto puro para o banco,
    // e o TRIGGER 'trigger_hash_senha' que você criou fará a criptografia.
    // Esta é a maneira correta de fazer, dado o seu script SQL.

    const newUser = await pool.query(
      'INSERT INTO Usuario (nome, email, senha, tipo_usuario, cpf, ativo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id_usuario, nome, email',
      [nome, email, senha, tipo_usuario, cpf]
    );

    res.status(201).json({
      msg: 'Usuário cadastrado com sucesso!',
      user: newUser.rows[0],
    });

  } catch (err) {
    // --- MUDANÇA IMPORTANTE AQUI ---
    // Logamos o erro COMPLETO no console do backend para podermos ver os detalhes.
    console.error('ERRO AO REGISTRAR USUÁRIO:', err); 

    // E enviamos uma resposta de erro mais genérica, mas ainda útil, para o frontend.
    res.status(500).json({ msg: 'Erro interno do servidor. Verifique o console do backend.' });
  }
});

module.exports = router;