// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importe o jsonwebtoken
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA
const auth = require('../middleware/auth'); // Importe o middleware de autentica��o

// Rota GET /me (protegida)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.query('SELECT id_usuario, nome, email, tipo_usuario FROM Usuario WHERE id_usuario = $1', [
      req.user.id,
    ]);
    if(user.rows.length === 0) {
        return res.status(404).json({ msg: 'Usuário não encontrado.'})
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no Servidor');
  }
});

// Rota POST para registrar um novo usu�rio
router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo_usuario, cpf } = req.body;

  if (!nome || !email || !senha || !tipo_usuario || !cpf) {
    return res.status(400).json({ msg: 'Por favor, insira todos os campos obrigatórios.' });
  }

  try {
    const userExists = await db.query('SELECT * FROM Usuario WHERE email = $1 OR cpf = $2', [email, cpf]); // <<< USA db.query

    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'Usuário com este e-mail ou CPF já existe.' });
    }

    // Removido o c�digo de hash do bcrypt. 
    // N�s vamos enviar a senha como texto puro para o banco,
    // e o TRIGGER 'trigger_hash_senha' que voc� criou far� a criptografia.
    // Esta � a maneira correta de fazer, dado o seu script SQL.

    const newUser = await db.query( // <<< USA db.query
      'INSERT INTO Usuario (nome, email, senha, tipo_usuario, cpf, ativo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id_usuario, nome, email',
      [nome, email, senha, tipo_usuario, cpf]
    );
    res.status(201).json({ msg: 'Usuário cadastrado com sucesso!', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// Rota POST para login de usu�rio
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // Valida��o b�sica
  if (!email || !senha) {
    return res.status(400).json({ msg: 'Por favor, forneça e-mail e senha.' });
  }

  try {
    const userResult = await db.query('SELECT * FROM Usuario WHERE email = $1', [email]); // <<< USA db.query

    if (userResult.rows.length === 0) {
      // Usu�rio n�o encontrado
      return res.status(400).json({ msg: 'Credenciais inválidas' });
    }

    const user = userResult.rows[0];

    // 2. Comparar a senha fornecida com a senha hasheada no banco
    // A senha que vem do banco est� em user.senha
    // ATEN��O: A fun��o bcrypt.compare j� sabe como lidar com o hash e o salt.
    const isMatch = await bcrypt.compare(senha, user.senha);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciais inválidas' });
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