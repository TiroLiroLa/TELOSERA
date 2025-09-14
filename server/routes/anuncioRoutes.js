const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Nosso middleware de autentica��o
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA


// @route   POST api/anuncios
// @desc    Criar um novo an�ncio
// @access  Privado
router.post('/', auth, async (req, res) => {
  // O middleware 'auth' nos d� acesso a req.user.id
  const idUsuario = req.user.id;
  const { titulo, descricao, tipo, fk_Area_id_area, fk_id_servico } = req.body;

  // Valida��o
  if (!titulo || !descricao || !tipo) {
    return res.status(400).json({ msg: 'Por favor, preencha os campos obrigat�rios.' });
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
// @desc    Buscar todos os an�ncios do usu�rio logado
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
// @desc    Deletar um an�ncio
// @access  Privado
router.delete('/:id', auth, async (req, res) => {
  try {
    const idAnuncio = req.params.id;
    const idUsuario = req.user.id;

    // 1. Verificar se o an�ncio existe e pertence ao usu�rio
    const anuncioResult = await db.query('SELECT * FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]); // <<< USA db.query

    if (anuncioResult.rows.length === 0) {
      return res.status(404).json({ msg: 'An�ncio n�o encontrado.' });
    }

    const anuncio = anuncioResult.rows[0];
    if (anuncio.fk_id_usuario !== idUsuario) {
      // Se o ID do dono do an�ncio for diferente do ID do usu�rio fazendo a requisi��o
      return res.status(401).json({ msg: 'Usu�rio n�o autorizado.' });
    }

    // 2. Se a verifica��o passar, deletar o an�ncio
    await db.query('DELETE FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]); // <<< USA db.query
        res.json({ msg: 'An�ncio removido com sucesso.' });
    } catch (err) { /* ... */ }
});


module.exports = router;