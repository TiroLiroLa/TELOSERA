const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Nosso middleware de autentica��o
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA

// @route   GET /api/anuncios/meus-publicados
// @desc    Buscar anúncios publicados pelo usuário com contagem de candidatos
// @access  Privado
router.get('/meus-publicados', auth, async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id_anuncio, a.titulo, a.data_publicacao, a.status,
                -- Subquery para contar o número de candidaturas para cada anúncio
                (SELECT COUNT(*) FROM Candidatura c WHERE c.fk_id_anuncio = a.id_anuncio) as num_candidatos
            FROM Anuncio a
            WHERE a.fk_id_usuario = $1
            ORDER BY a.data_publicacao DESC;
        `;
        const anuncios = await db.query(query, [req.user.id]);
        res.json(anuncios.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   GET /api/anuncios/minhas-candidaturas
// @desc    Buscar anúncios aos quais o usuário se candidatou
// @access  Privado
router.get('/minhas-candidaturas', auth, async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id_anuncio, a.titulo, a.status,
                cand.data_candidatura,
                u.nome as nome_empresa
            FROM Candidatura cand
            JOIN Anuncio a ON cand.fk_id_anuncio = a.id_anuncio
            JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
            WHERE cand.fk_id_usuario = $1 AND a.status = true -- Apenas anúncios ativos
            ORDER BY cand.data_candidatura DESC;
        `;
        const candidaturas = await db.query(query, [req.user.id]);
        res.json(candidaturas.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   GET /api/anuncios/:id/verificar-candidatura
// @desc    Verifica se o usuário logado já se candidatou ao anúncio
// @access  Privado
router.get('/:id/verificar-candidatura', auth, async (req, res) => {
    try {
        const idAnuncio = req.params.id;
        const idUsuario = req.user.id;
        
        const candidatura = await db.query(
            'SELECT * FROM Candidatura WHERE fk_id_usuario = $1 AND fk_id_anuncio = $2',
            [idUsuario, idAnuncio]
        );
        
        if (candidatura.rows.length > 0) {
            return res.json({ candidatado: true });
        }
        
        res.json({ candidatado: false });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   POST /api/anuncios/:id/candidatar
// @desc    Candidatar-se a um anúncio
// @access  Privado
router.post('/:id/candidatar', auth, async (req, res) => {
    const idAnuncio = req.params.id;
    const idCandidato = req.user.id; // ID do usuário logado

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // --- Validações ---
        // 1. Verificar se o anúncio existe
        const anuncioResult = await client.query('SELECT fk_id_usuario FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]);
        if (anuncioResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Anúncio não encontrado.' });
        }
        const idDonoDoAnuncio = anuncioResult.rows[0].fk_id_usuario;

        // 2. Verificar se o usuário não está se candidatando ao próprio anúncio
        if (idDonoDoAnuncio === idCandidato) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'Você não pode se candidatar ao seu próprio anúncio.' });
        }

        // 3. Verificar se o usuário já não se candidatou
        const candidaturaExistente = await client.query(
            'SELECT * FROM Candidatura WHERE fk_id_usuario = $1 AND fk_id_anuncio = $2',
            [idCandidato, idAnuncio]
        );
        if (candidaturaExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'Você já se candidatou para este anúncio.' });
        }

        // --- Inserção ---
        // Se todas as validações passaram, insere a candidatura
        await client.query(
            'INSERT INTO Candidatura (fk_id_usuario, fk_id_anuncio) VALUES ($1, $2)',
            [idCandidato, idAnuncio]
        );
        
        await client.query('COMMIT');
        res.status(201).json({ msg: 'Candidatura enviada com sucesso!' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    } finally {
        client.release();
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
                a.id_anuncio, a.titulo, a.descricao, a.tipo, a.data_publicacao, a.data_servico,
                -- A CORREÇÃO ESTÁ AQUI: Renomeando o campo para 'localizacao'
                ST_AsText(a.local) as localizacao,
                u.id_usuario, u.nome as nome_usuario, u.email as email_usuario, u.telefone as telefone_usuario,
                area.nome as nome_area,
                serv.nome as nome_servico,
                c.nome as nome_cidade,
                e.uf as uf_estado
            FROM Anuncio a
            JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
            JOIN Area_atuacao area ON a.fk_Area_id_area = area.id_area
            JOIN Servico serv ON a.fk_id_servico = serv.id_servico
            LEFT JOIN Cidade c ON a.fk_id_cidade = c.id_cidade
            LEFT JOIN Estado e ON c.fk_id_estado = e.id_estado
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
  const { 
    titulo, descricao, tipo, 
    fk_Area_id_area, fk_id_servico, localizacao, 
    fk_id_cidade, 
    data_servico // <<< NOVO CAMPO
  } = req.body;

  // Adiciona data_servico à validação
  if (!titulo || !descricao || !tipo || !fk_Area_id_area || !fk_id_servico || !data_servico) {
    return res.status(400).json({ msg: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  try {
    let point = null;
    if (localizacao) { point = `POINT(${localizacao.lng} ${localizacao.lat})`; }

    const novoAnuncio = await db.query(
      `INSERT INTO Anuncio (titulo, descricao, tipo, fk_id_usuario, fk_Area_id_area, fk_id_servico, local, fk_id_cidade, data_servico, status) 
       VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8, $9, true) 
       RETURNING *`,
      [titulo, descricao, tipo, idUsuario, fk_Area_id_area, fk_id_servico, point, fk_id_cidade, data_servico]
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