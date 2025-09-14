// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importe o jsonwebtoken
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Rota POST para registrar um novo usu�rio
router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo_usuario, cpf } = req.body;

  if (!nome || !email || !senha || !tipo_usuario || !cpf) {
    return res.status(400).json({ msg: 'Por favor, insira todos os campos obrigat�rios.' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM Usuario WHERE email = $1 OR cpf = $2', [email, cpf]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'Usu�rio com este e-mail ou CPF j� existe.' });
    }

    // Removido o c�digo de hash do bcrypt. 
    // N�s vamos enviar a senha como texto puro para o banco,
    // e o TRIGGER 'trigger_hash_senha' que voc� criou far� a criptografia.
    // Esta � a maneira correta de fazer, dado o seu script SQL.

    const newUser = await pool.query(
      'INSERT INTO Usuario (nome, email, senha, tipo_usuario, cpf, ativo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id_usuario, nome, email',
      [nome, email, senha, tipo_usuario, cpf]
    );

    res.status(201).json({
      msg: 'Usu�rio cadastrado com sucesso!',
      user: newUser.rows[0],
    });

  } catch (err) {
    // --- MUDAN�A IMPORTANTE AQUI ---
    // Logamos o erro COMPLETO no console do backend para podermos ver os detalhes.
    console.error('ERRO AO REGISTRAR USU�RIO:', err); 

    // E enviamos uma resposta de erro mais gen�rica, mas ainda �til, para o frontend.
    res.status(500).json({ msg: 'Erro interno do servidor. Verifique o console do backend.' });
  }
});

// Rota POST para login de usu�rio
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // Valida��o b�sica
  if (!email || !senha) {
    return res.status(400).json({ msg: 'Por favor, forne�a e-mail e senha.' });
  }

  try {
    // 1. Encontrar o usu�rio pelo e-mail
    const userResult = await pool.query('SELECT * FROM Usuario WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // Usu�rio n�o encontrado
      return res.status(400).json({ msg: 'Credenciais inv�lidas' });
    }

    const user = userResult.rows[0];

    // 2. Comparar a senha fornecida com a senha hasheada no banco
    // A senha que vem do banco est� em user.senha
    // ATEN��O: A fun��o bcrypt.compare j� sabe como lidar com o hash e o salt.
    const isMatch = await bcrypt.compare(senha, user.senha);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciais inv�lidas' });
    }

    // 3. Se as credenciais estiverem corretas, criar e retornar o token JWT
    const payload = {
      user: {
        id: user.id_usuario,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // O token expira em 5 horas
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Envia o token para o cliente
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;