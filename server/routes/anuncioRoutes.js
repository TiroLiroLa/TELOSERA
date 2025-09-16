const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Nosso middleware de autentica��o
const authOptional = require('../middleware/authOptional'); // Precisaremos de um novo middleware
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA
const upload = require('../middleware/upload'); // <<< Importar o middleware

// @route   GET /api/anuncios/meus-confirmados
// @desc    Buscar anúncios que o usuário PUBLICOU e que foram CONFIRMADOS
// @access  Privado
router.get('/meus-confirmados', auth, async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id_anuncio, a.titulo,
                conf.id_confirmacao, conf.data_confirmacao,
                candidato.id_usuario as id_outro_usuario, 
                candidato.nome as nome_outro_usuario,
                'candidato' as papel_outro_usuario,
                (SELECT COUNT(*) > 0 FROM Avaliacao av WHERE av.fk_id_confirmacao = conf.id_confirmacao AND av.fk_id_avaliador = $1) as avaliacao_realizada
            FROM Confirmacao conf
            JOIN Anuncio a ON conf.fk_id_anuncio = a.id_anuncio
            JOIN Usuario candidato ON conf.fk_id_usuario = candidato.id_usuario
            WHERE a.fk_id_usuario = $1; -- Onde EU sou o dono do anúncio
        `;
        const anuncios = await db.query(query, [req.user.id]);
        res.json(anuncios.rows);
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   GET /api/anuncios/trabalhos-confirmados
// @desc    Buscar anúncios para os quais o usuário FOI CONFIRMADO
// @access  Privado
router.get('/trabalhos-confirmados', auth, async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id_anuncio, a.titulo,
                conf.id_confirmacao, conf.data_confirmacao,
                publicador.id_usuario as id_outro_usuario,
                publicador.nome as nome_outro_usuario,
                'contratante' as papel_outro_usuario,
                (SELECT COUNT(*) > 0 FROM Avaliacao av WHERE av.fk_id_confirmacao = conf.id_confirmacao AND av.fk_id_avaliador = $1) as avaliacao_realizada
            FROM Confirmacao conf
            JOIN Anuncio a ON conf.fk_id_anuncio = a.id_anuncio
            JOIN Usuario publicador ON a.fk_id_usuario = publicador.id_usuario
            WHERE conf.fk_id_usuario = $1; -- Onde EU sou o candidato confirmado
        `;
        const trabalhos = await db.query(query, [req.user.id]);
        res.json(trabalhos.rows);
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

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

// @route   GET /api/anuncios/:id/candidatos
// @desc    Listar candidatos de um anúncio específico
// @access  Privado (só para o dono do anúncio)
router.get('/:id/candidatos', auth, async (req, res) => {
    const idAnuncio = req.params.id;
    const idUsuarioLogado = req.user.id;

    try {
        // 1. Verificar se o usuário logado é o dono do anúncio
        const anuncioResult = await db.query('SELECT fk_id_usuario FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]);
        if (anuncioResult.rows.length === 0) {
            return res.status(404).json({ msg: "Anúncio não encontrado." });
        }
        if (anuncioResult.rows[0].fk_id_usuario !== idUsuarioLogado) {
            return res.status(403).json({ msg: "Acesso não autorizado." }); // 403 Forbidden
        }

        // 2. Se for o dono, buscar os candidatos
        const query = `
            SELECT 
                u.id_usuario, u.nome,
                c.data_candidatura
            FROM Candidatura c
            JOIN Usuario u ON c.fk_id_usuario = u.id_usuario
            WHERE c.fk_id_anuncio = $1
            ORDER BY c.data_candidatura ASC;
        `;
        const candidatos = await db.query(query, [idAnuncio]);
        res.json(candidatos.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   POST /api/anuncios/:id/confirmar
// @desc    Confirmar um candidato para um serviço
// @access  Privado (só para o dono do anúncio)
router.post('/:id/confirmar', auth, async (req, res) => {
    const idAnuncio = req.params.id;
    const idUsuarioLogado = req.user.id;
    const { idCandidatoConfirmado } = req.body; // Recebe o ID do usuário a ser confirmado

    if (!idCandidatoConfirmado) {
        return res.status(400).json({ msg: "ID do candidato é obrigatório." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar se o usuário logado é o dono do anúncio (segurança)
        const anuncioResult = await client.query('SELECT fk_id_usuario FROM Anuncio WHERE id_anuncio = $1', [idAnuncio]);
        if (anuncioResult.rows.length === 0 || anuncioResult.rows[0].fk_id_usuario !== idUsuarioLogado) {
            await client.query('ROLLBACK');
            return res.status(403).json({ msg: "Operação não autorizada." });
        }
        
        // 2. (Opcional, mas recomendado) Verificar se a pessoa que está sendo confirmada realmente se candidatou
        const candidaturaResult = await client.query('SELECT * FROM Candidatura WHERE fk_id_anuncio = $1 AND fk_id_usuario = $2', [idAnuncio, idCandidatoConfirmado]);
        if (candidaturaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: "Este usuário não se candidatou para esta vaga." });
        }

        // 3. Criar o registro na tabela Confirmacao
        // A tabela 'Confirmacao' precisa do fk_id_usuario, que nesse contexto é o candidato confirmado.
        await client.query(
            'INSERT INTO Confirmacao (fk_id_usuario, fk_id_anuncio) VALUES ($1, $2)',
            [idCandidatoConfirmado, idAnuncio] // <<< Adiciona o idAnuncio
        );
        
        // 4. (Opcional) Mudar o status do anúncio para inativo/fechado, já que a vaga foi preenchida
        await client.query('UPDATE Anuncio SET status = false WHERE id_anuncio = $1', [idAnuncio]);

        await client.query('COMMIT');
        res.status(201).json({ msg: "Candidato confirmado com sucesso! O anúncio foi encerrado." });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    } finally {
        client.release();
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
router.get('/:id', authOptional, async (req, res) => {
    try {
        const idAnuncio = req.params.id;
        const idUsuarioLogado = req.user?.id;
        const { lat, lng } = req.query;

        // --- BUSCA DOS DETALHES COMPLETOS DO ANÚNCIO ---
        const detalhesQuery = `
            SELECT 
                a.id_anuncio, a.titulo, a.descricao, a.tipo, a.data_publicacao, a.data_servico,
                a.status, ST_AsText(a.local) as localizacao,
                u.id_usuario as id_publicador, u.nome as nome_usuario, u.email as email_usuario, u.telefone as telefone_usuario,
                area.nome as nome_area, serv.nome as nome_servico,
                c.nome as nome_cidade, e.uf as uf_estado
                ${lat && lng ? `, ST_Distance(a.local::geography, ST_MakePoint(${lng}, ${lat})::geography) as distancia` : ''}
            FROM Anuncio a
            JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
            JOIN Area_atuacao area ON a.fk_Area_id_area = area.id_area
            JOIN Servico serv ON a.fk_id_servico = serv.id_servico
            LEFT JOIN Cidade c ON a.fk_id_cidade = c.id_cidade
            LEFT JOIN Estado e ON c.fk_id_estado = e.id_estado
            WHERE a.id_anuncio = $1;
        `;
        const detalhesResult = await db.query(detalhesQuery, [idAnuncio]);
        if (detalhesResult.rows.length === 0) { return res.status(404).json({ msg: 'Anúncio não encontrado.' }); }
        
        const anuncio = detalhesResult.rows[0];
        const idPublicador = anuncio.id_publicador;

        // --- LÓGICA DE PERMISSÃO ---
        if (anuncio.status === false) {
            const confirmacaoQuery = `SELECT fk_id_usuario FROM Confirmacao WHERE fk_id_anuncio = $1 LIMIT 1`;
            const confirmacaoResult = await db.query(confirmacaoQuery, [idAnuncio]);
            const idCandidatoConfirmado = confirmacaoResult.rows[0]?.fk_id_usuario;
            const isOwner = idUsuarioLogado === idPublicador;
            const isConfirmedCandidate = idUsuarioLogado === idCandidatoConfirmado;
            if (!idUsuarioLogado || (!isOwner && !isConfirmedCandidate)) {
                return res.status(403).json({ msg: "Este anúncio está encerrado e não pode ser visualizado." });
            }
        }
        
        // --- BUSCA DA AVALIAÇÃO DO PUBLICADOR ---
        const avaliacaoQuery = `
            SELECT 
                COALESCE(AVG((ap.satisfacao + ap.pontualidade) / 2.0), 0) as media_prestador,
                COALESCE(AVG((ac.clareza_demanda + ac.pagamento) / 2.0), 0) as media_contratante,
                COUNT(av.id_avaliacao) as total_avaliacoes
            FROM Usuario u
            LEFT JOIN Avaliacao av ON u.id_usuario = av.fk_id_avaliado
            LEFT JOIN Avaliacao_prestador ap ON av.id_avaliacao = ap.fk_id_avaliacao
            LEFT JOIN Avaliacao_contratante ac ON av.id_avaliacao = ac.fk_id_avaliacao
            WHERE u.id_usuario = $1
            GROUP BY u.id_usuario;
        `;
        const avaliacaoResult = await db.query(avaliacaoQuery, [idPublicador]);
        
        let avaliacaoData = { media_geral: 0, total_avaliacoes: 0 };
        if (avaliacaoResult.rows.length > 0) {
            const { media_prestador, media_contratante, total_avaliacoes } = avaliacaoResult.rows[0];
            const somaMedias = parseFloat(media_prestador) + parseFloat(media_contratante);
            const numTiposAvaliacao = (media_prestador > 0 ? 1 : 0) + (media_contratante > 0 ? 1 : 0);
            const media_geral = numTiposAvaliacao > 0 ? somaMedias / numTiposAvaliacao : 0;
            
            avaliacaoData = {
                media_geral: parseFloat(media_geral.toFixed(1)),
                total_avaliacoes: parseInt(total_avaliacoes)
            };
        }

        // Adiciona o objeto de avaliação ao resultado final do anúncio
        anuncio.avaliacao = avaliacaoData;

        const imagensQuery = await db.query('SELECT id_imagem, caminho_imagem FROM Anuncio_Imagem WHERE fk_id_anuncio = $1', [idAnuncio]);
        anuncio.imagens = imagensQuery.rows; // Adiciona o array de imagens ao objeto

        res.json(anuncio);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   GET api/anuncios
// @desc    Buscar todos os an�ncios p�blicos e ativos
// @access  P�blico
router.get('/', async (req, res) => {
    // Extrai todos os possíveis parâmetros da query string
    const { q, tipo, lat, lng, raio, area, servico, sortBy } = req.query;

    let query = `
        SELECT 
            a.id_anuncio, a.titulo, a.descricao, a.tipo, a.data_publicacao,
            u.nome as nome_usuario,
            area.nome as nome_area,
            serv.nome as nome_servico,
            c.nome as nome_cidade,
            e.uf as uf_estado,
            (SELECT img.caminho_imagem FROM Anuncio_Imagem img WHERE img.fk_id_anuncio = a.id_anuncio ORDER BY img.id_imagem ASC LIMIT 1) as imagem_capa,
            -- Traz a média de avaliação calculada
            COALESCE(user_ratings.media_geral, 0) as avaliacao_media
            ${lat && lng ? `, ST_Distance(a.local::geography, ST_MakePoint(${lng}, ${lat})::geography) as distancia` : ''}
        FROM Anuncio a
        JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
        JOIN Area_atuacao area ON a.fk_Area_id_area = area.id_area
        JOIN Servico serv ON a.fk_id_servico = serv.id_servico
        LEFT JOIN Cidade c ON a.fk_id_cidade = c.id_cidade
        LEFT JOIN Estado e ON c.fk_id_estado = e.id_estado
        -- Subquery para calcular a média de avaliação de cada usuário
        LEFT JOIN (
            SELECT 
                fk_id_avaliado, 
                AVG(
                    CASE 
                        WHEN tipo_avaliacao = 'P' THEN (ap.satisfacao + ap.pontualidade) / 2.0
                        WHEN tipo_avaliacao = 'C' THEN (ac.clareza_demanda + ac.pagamento) / 2.0
                    END
                ) as media_geral
            FROM Avaliacao av
            LEFT JOIN Avaliacao_prestador ap ON av.id_avaliacao = ap.fk_id_avaliacao
            LEFT JOIN Avaliacao_contratante ac ON av.id_avaliacao = ac.fk_id_avaliacao
            GROUP BY fk_id_avaliado
        ) as user_ratings ON u.id_usuario = user_ratings.fk_id_avaliado
    `;
    const conditions = ['a.status = true'];
    const values = [];
    let paramIndex = 1;
    if (q) { conditions.push(`(a.titulo ILIKE $${paramIndex} OR a.descricao ILIKE $${paramIndex})`); values.push(`%${q}%`); paramIndex++; }
    if (tipo) { conditions.push(`a.tipo = $${paramIndex}`); values.push(tipo.toUpperCase()); paramIndex++; }
    if (area) { conditions.push(`a.fk_Area_id_area = $${paramIndex}`); values.push(area); paramIndex++; }
    if (servico) { conditions.push(`a.fk_id_servico = $${paramIndex}`); values.push(servico); paramIndex++; }
    if (lat && lng && raio) { conditions.push(`ST_DWithin(a.local::geography, ST_MakePoint($${paramIndex}, $${paramIndex+1})::geography, $${paramIndex+2})`); values.push(lng, lat, raio * 1000); paramIndex += 3; }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    // --- Lógica de Ordenação Atualizada ---
    if (sortBy === 'distance' && lat && lng) {
        query += ' ORDER BY distancia ASC'; 
    } else if (sortBy === 'rating') {
        // Ordena pela média de avaliação (maior primeiro) e depois por data
        query += ' ORDER BY avaliacao_media DESC, a.data_publicacao DESC';
    } else {
        // Ordenação padrão por data
        query += ' ORDER BY a.data_publicacao DESC';
    }

    try {
        const anuncios = await db.query(query, values);
        res.json(anuncios.rows);
    } catch (err) {
        console.error("Erro na busca de anúncios:", err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   POST api/anuncios
// @desc    Criar um novo anúncio (Versão Aprimorada com Localização)
// @access  Privado
router.post('/', auth, upload.array('images', 5), async (req, res) => {
    // <<< 1. FAZ O PARSE DA STRING JSON
    const dadosFormulario = JSON.parse(req.body.jsonData);

    const idUsuario = req.user.id;
    // <<< 2. Extrai os dados do objeto parseado
    const { 
        titulo, descricao, tipo, 
        fk_Area_id_area, fk_id_servico, localizacao, 
        fk_id_cidade, data_servico 
    } = dadosFormulario;
    
    // Os arquivos continuam vindo de req.files
    const files = req.files;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let point = null;
        if (localizacao && localizacao.lng && localizacao.lat) {
            point = `POINT(${localizacao.lng} ${localizacao.lat})`;
        }

        // A query de inserção permanece a mesma, pois já estava correta
        const novoAnuncioResult = await client.query(
          `INSERT INTO Anuncio (titulo, descricao, tipo, fk_id_usuario, fk_Area_id_area, fk_id_servico, local, fk_id_cidade, data_servico, status) 
           VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8, $9, true) 
           RETURNING id_anuncio`,
          [titulo, descricao, tipo, idUsuario, fk_Area_id_area, fk_id_servico, point, fk_id_cidade, data_servico]
        );
        const idAnuncio = novoAnuncioResult.rows[0].id_anuncio;

        // A lógica para salvar as imagens permanece a mesma
        if (files && files.length > 0) {
            const imageInsertPromises = files.map(file => {
                const imagePath = `/uploads/${file.filename}`;
                return client.query(
                    'INSERT INTO Anuncio_Imagem (fk_id_anuncio, caminho_imagem) VALUES ($1, $2)',
                    [idAnuncio, imagePath]
                );
            });
            await Promise.all(imageInsertPromises);
        }

        await client.query('COMMIT');
        res.status(201).json({ msg: 'Anúncio e imagens salvos com sucesso!' });

    } catch (err) {
        // Se ocorrer um erro, deleta os arquivos que foram salvos no disco
        if (files) {
            files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkErr) {
                    console.error("Erro ao deletar arquivo após falha:", unlinkErr);
                }
            });
        }
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    } finally {
        client.release();
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