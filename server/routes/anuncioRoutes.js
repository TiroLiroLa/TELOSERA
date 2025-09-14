const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Nosso middleware de autentica��o
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA

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
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   GET api/anuncios/:id
// @desc    Buscar os detalhes de um �nico an�ncio
// @access  P�blico
router.get('/:id', async (req, res) => {
    try {
        const idAnuncio = req.params.id;
        const query = `
            SELECT 
                a.id_anuncio, a.titulo, a.descricao, a.tipo, a.data_publicacao,
                u.id_usuario, u.nome as nome_usuario, u.email as email_usuario, u.telefone as telefone_usuario,
                area.nome as nome_area,
                serv.nome as nome_servico
            FROM Anuncio a
            JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
            JOIN Area_atuacao area ON a.fk_Area_id_area = area.id_area
            JOIN Servico serv ON a.fk_id_servico = serv.id_servico
            WHERE a.id_anuncio = $1 AND a.status = true;
        `;
        const result = await db.query(query, [idAnuncio]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Anúncio não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   GET api/anuncios
// @desc    Buscar todos os an�ncios p�blicos e ativos
// @access  P�blico
router.get('/', async (req, res) => {
    try {
        // Este SQL busca todos os an�ncios e junta (JOIN) com as tabelas de Usu�rio,
        // �rea e Servi�o para trazer os nomes em vez de apenas os IDs.
        const query = `
            SELECT 
                a.id_anuncio, a.titulo, a.descricao, a.tipo, a.data_publicacao,
                u.nome as nome_usuario,
                area.nome as nome_area,
                serv.nome as nome_servico
            FROM Anuncio a
            JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
            JOIN Area_atuacao area ON a.fk_Area_id_area = area.id_area
            JOIN Servico serv ON a.fk_id_servico = serv.id_servico
            WHERE a.status = true
            ORDER BY a.data_publicacao DESC;
        `;
        const anuncios = await db.query(query);
        res.json(anuncios.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   POST api/anuncios
// @desc    Criar um novo anúncio (Versão Aprimorada com Localização)
// @access  Privado
router.post('/', auth, async (req, res) => {
  const idUsuario = req.user.id;
  // <<< 1. Recebendo a localização do frontend
  const { 
    titulo, descricao, tipo, 
    fk_Area_id_area, fk_id_servico, localizacao 
  } = req.body;

  if (!titulo || !descricao || !tipo || !fk_Area_id_area || !fk_id_servico) {
    return res.status(400).json({ msg: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  try {
    // <<< 2. Prepara o ponto para o PostGIS
    let point = null;
    if (localizacao) {
      point = `POINT(${localizacao.lng} ${localizacao.lat})`;
    }

    const novoAnuncio = await db.query(
      `INSERT INTO Anuncio (titulo, descricao, tipo, fk_id_usuario, fk_Area_id_area, fk_id_servico, local, status) 
       VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), true) 
       RETURNING *`,
      [titulo, descricao, tipo, idUsuario, fk_Area_id_area, fk_id_servico, point]
    );

    res.status(201).json(novoAnuncio.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
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
      return res.status(404).json({ msg: 'Anúncio não encontrado.' });
    }

    const anuncio = anuncioResult.rows[0];
    if (anuncio.fk_id_usuario !== idUsuario) {
      // Se o ID do dono do an�ncio for diferente do ID do usu�rio fazendo a requisi��o
      return res.status(401).json({ msg: 'Usuário não autorizado.' });
    }

    // 2. Se a verifica��o passar, deletar o an�ncio
    await db.query('DELETE FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]); // <<< USA db.query
        res.json({ msg: 'Anúncio removido com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});


module.exports = router;