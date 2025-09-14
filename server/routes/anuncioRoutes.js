const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Nosso middleware de autenticação
const db = require('../config/db'); // <<< IMPORTA A CONEXÃO CENTRALIZADA


// @route   POST api/anuncios
// @desc    Criar um novo anúncio
// @access  Privado
router.post('/', auth, async (req, res) => {
  // O middleware 'auth' nos dá acesso a req.user.id
  const idUsuario = req.user.id;
  const { titulo, descricao, tipo, fk_Area_id_area, fk_id_servico } = req.body;

  // Validação
  if (!titulo || !descricao || !tipo) {
    return res.status(400).json({ msg: 'Por favor, preencha os campos obrigatórios.' });
  }

  try {
        const novoAnuncio = await db.query( // <<< USA db.query
            `INSERT INTO Anuncio (titulo, descricao, tipo, fk_id_usuario, fk_Area_id_area, fk_id_servico, status) 
             VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
            [titulo, descricao, tipo, idUsuario, fk_Area_id_area, fk_id_servico]
        );
        res.status(201).json(novoAnuncio.rows[0]);
    } catch (err) { /* ... */ }
});

// @route   GET api/anuncios/meus
// @desc    Buscar todos os anúncios do usuário logado
// @access  Privado
router.get('/meus', auth, async (req, res) => {
    try {
        const anuncios = await db.query( // <<< USA db.query
            "SELECT * FROM Anuncio WHERE fk_id_usuario = $1 ORDER BY data_publicacao DESC",
            [req.user.id]
        );
        res.json(anuncios.rows);
    } catch (err) { /* ... */ }
});

// @route   DELETE api/anuncios/:id
// @desc    Deletar um anúncio
// @access  Privado
router.delete('/:id', auth, async (req, res) => {
  try {
    const idAnuncio = req.params.id;
    const idUsuario = req.user.id;

    // 1. Verificar se o anúncio existe e pertence ao usuário
    const anuncioResult = await db.query('SELECT * FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]); // <<< USA db.query

    if (anuncioResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Anúncio não encontrado.' });
    }

    const anuncio = anuncioResult.rows[0];
    if (anuncio.fk_id_usuario !== idUsuario) {
      // Se o ID do dono do anúncio for diferente do ID do usuário fazendo a requisição
      return res.status(401).json({ msg: 'Usuário não autorizado.' });
    }

    // 2. Se a verificação passar, deletar o anúncio
    await db.query('DELETE FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]); // <<< USA db.query
        res.json({ msg: 'Anúncio removido com sucesso.' });
    } catch (err) { /* ... */ }
});


module.exports = router;