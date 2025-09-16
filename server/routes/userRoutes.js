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

// @route   GET /api/users/me/regiao
// @desc    Buscar a região de atuação principal do usuário logado
// @access  Privado
router.get('/me/regiao', auth, async (req, res) => {
    try {
        const query = `
            SELECT ST_X(r.local) as lng, ST_Y(r.local) as lat, r.raio 
            FROM Regiao_atuacao r
            JOIN Atua a ON r.id_regiao = a.fk_id_regiao
            WHERE a.fk_id_usuario = $1
            LIMIT 1;
        `;
        const result = await db.query(query, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Região não encontrada." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   GET /api/users/me/areas
// @desc    Buscar as áreas de atuação do usuário logado
// @access  Privado
router.get('/me/areas', auth, async (req, res) => {
    try {
        const query = `
            SELECT area.id_area, area.nome FROM Usuario_area ua
            JOIN Area_atuacao area ON ua.fk_id_area = area.id_area
            WHERE ua.fk_id_usuario = $1;
        `;
        const result = await db.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   GET /api/users/:id
// @desc    Buscar perfil público de um usuário
// @access  Público
// Rota GET /api/users/:id (Perfil Público) - VERSÃO CORRIGIDA COM ST_AsText
router.get('/:id', async (req, res) => {
    const idUsuarioPerfil = req.params.id;

    // Etapa 0: Validação de segurança do ID
    if (isNaN(parseInt(idUsuarioPerfil))) {
        return res.status(400).json({ msg: "ID de usuário inválido." });
    }

    try {
        // --- Query 1: Dados Base do Usuário ---
        // Busca apenas da tabela Usuario. É a query mais importante e robusta.
        const perfilBaseQuery = 'SELECT id_usuario, nome, tipo_usuario, data_cadastro, telefone FROM Usuario WHERE id_usuario = $1';
        const perfilBaseResult = await db.query(perfilBaseQuery, [idUsuarioPerfil]);

        if (perfilBaseResult.rows.length === 0) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }
        
        // Inicia o objeto de resposta com os dados base
        let perfilCompleto = { ...perfilBaseResult.rows[0] };

        // --- Query 2: Dados da Região de Atuação (se existir) ---
        // Busca os dados da região separadamente para não quebrar a busca principal.
        const regiaoQuery = `
            SELECT 
                c.nome as cidade, e.uf as estado,
                ST_AsText(r.local) as localizacao, r.raio
            FROM Atua a
            JOIN Regiao_atuacao r ON a.fk_id_regiao = r.id_regiao
            JOIN Cidade c ON r.fk_id_cidade = c.id_cidade
            JOIN Estado e ON c.fk_id_estado = e.id_estado
            WHERE a.fk_id_usuario = $1 LIMIT 1;
        `;
        const regiaoResult = await db.query(regiaoQuery, [idUsuarioPerfil]);
        
        // Se encontrou uma região, adiciona os dados ao objeto de resposta
        if (regiaoResult.rows.length > 0) {
            perfilCompleto = { ...perfilCompleto, ...regiaoResult.rows[0] };
        }

        // --- Query 3: Dados de Avaliação ---
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
        const avaliacaoResult = await db.query(avaliacaoQuery, [idUsuarioPerfil]);
        
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
        perfilCompleto.avaliacao = avaliacaoData;

        // --- Query 4: Especialidades (Áreas de Atuação) ---
        const areasQuery = `
            SELECT area.id_area, area.nome FROM Usuario_area ua
            JOIN Area_atuacao area ON ua.fk_id_area = area.id_area
            WHERE ua.fk_id_usuario = $1;
        `;
        const areasResult = await db.query(areasQuery, [idUsuarioPerfil]);
        perfilCompleto.especialidades = areasResult.rows;

        // --- Query 5: Últimos Anúncios ---
        const anunciosQuery = `SELECT id_anuncio, titulo, descricao, tipo FROM Anuncio WHERE fk_id_usuario = $1 AND status = true ORDER BY data_publicacao DESC LIMIT 5`;
        const anunciosResult = await db.query(anunciosQuery, [idUsuarioPerfil]);
        perfilCompleto.anuncios = anunciosResult.rows;
        
        // Envia o objeto completo como resposta
        res.json(perfilCompleto);

    } catch (err) {
        // Tratamento de erro genérico
        console.error(`Erro ao buscar perfil para ID ${idUsuarioPerfil}:`, err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   PUT /api/users/me/regiao
// @desc    Atualizar a região de atuação do usuário logado
// @access  Privado
router.put('/me/regiao', auth, async (req, res) => {
    const { localizacao, raio_atuacao, fk_id_cidade } = req.body;
    const idUsuario = req.user.id;

    if (!localizacao || !raio_atuacao) {
        return res.status(400).json({ msg: 'Localização e raio são obrigatórios.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Tenta encontrar o id_regiao do usuário na tabela 'Atua'
        const atuaResult = await client.query('SELECT fk_id_regiao FROM Atua WHERE fk_id_usuario = $1 LIMIT 1', [idUsuario]);
        
        const point = `POINT(${localizacao.lng} ${localizacao.lat})`;

        if (atuaResult.rows.length > 0) {
            // Se o usuário JÁ TEM uma região, atualiza-a (UPDATE)
            const idRegiao = atuaResult.rows[0].fk_id_regiao;
            await client.query(
                'UPDATE Regiao_atuacao SET local = ST_GeomFromText($1, 4326), raio = $2, fk_id_cidade = $3 WHERE id_regiao = $4',
                [point, raio_atuacao, fk_id_cidade, idRegiao] // Adiciona fk_id_cidade
            );
        } else {
            // Se o usuário NÃO TEM uma região, cria uma nova (INSERT) e a associa
            const regiaoResult = await client.query(
                'INSERT INTO Regiao_atuacao (local, raio, fk_id_cidade) VALUES (ST_GeomFromText($1, 4326), $2, $3) RETURNING id_regiao',
                [point, raio_atuacao, fk_id_cidade] // Adiciona fk_id_cidade
            );
            const idRegiao = regiaoResult.rows[0].id_regiao;
            
            await client.query(
                'INSERT INTO Atua (fk_id_usuario, fk_id_regiao) VALUES ($1, $2)',
                [idUsuario, idRegiao]
            );
        }

        await client.query('COMMIT');
        res.json({ msg: 'Região de atuação atualizada com sucesso.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    } finally {
        client.release();
    }
});

// @route   PUT /api/users/me
// @desc    Atualizar perfil do usuário logado (dados básicos)
// @access  Privado
router.put('/me', auth, async (req, res) => {
    const { nome, telefone } = req.body;
    const idUsuario = req.user.id;

    try {
        // Constrói a query dinamicamente para atualizar apenas os campos fornecidos
        // (Isso é mais avançado, mas muito útil para não sobrescrever dados existentes com null)
        const fields = [];
        const values = [];
        let query = 'UPDATE Usuario SET ';

        if (nome) {
            fields.push(`nome = $${fields.length + 1}`);
            values.push(nome);
        }
        if (telefone) {
            fields.push(`telefone = $${fields.length + 1}`);
            values.push(telefone);
        }
        
        if (fields.length === 0) {
            return res.status(400).json({ msg: 'Nenhum campo para atualizar fornecido.' });
        }

        query += fields.join(', ');
        query += ` WHERE id_usuario = $${fields.length + 1} RETURNING id_usuario, nome, telefone`;
        values.push(idUsuario);

        const result = await db.query(query, values);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// @route   PUT /api/users/me/areas
// @desc    Atualizar (sobrescrever) as áreas de atuação do usuário logado
// @access  Privado
router.put('/me/areas', auth, async (req, res) => {
    // Espera receber um array de IDs: { areas: [1, 3, 5] }
    const { areas } = req.body;
    const idUsuario = req.user.id;

    if (!Array.isArray(areas)) {
        return res.status(400).json({ msg: 'O corpo da requisição deve conter um array de IDs de áreas.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Deleta todas as associações antigas do usuário
        await client.query('DELETE FROM Usuario_area WHERE fk_id_usuario = $1', [idUsuario]);
        
        // 2. Insere as novas associações
        if (areas.length > 0) {
            // Constrói uma única query de inserção para múltiplas linhas (mais eficiente)
            const insertValues = areas.map((idArea, index) => `($1, $${index + 2})`).join(', ');
            const query = `INSERT INTO Usuario_area (fk_id_usuario, fk_id_area) VALUES ${insertValues}`;
            await client.query(query, [idUsuario, ...areas]);
        }
        
        await client.query('COMMIT');
        res.json({ msg: 'Áreas de atuação atualizadas com sucesso.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    } finally {
        client.release();
    }
});

// @route   GET /api/users/:id
// @desc    Buscar perfil público de um usuário
// @access  Público
router.get('/:id', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id_usuario, u.nome, u.tipo_usuario, u.data_cadastro,
                e.cidade, e.estado
            FROM Usuario u
            LEFT JOIN Endereco e ON u.fk_id_ender = e.id_ender
            WHERE u.id_usuario = $1;
        `;
        const result = await db.query(query, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }
        
        res.json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

// Rota POST /register (Versão Aprimorada e Corrigida)
router.post('/register', async (req, res) => {
    const { 
        nome, email, senha, tipo_usuario, identificador, telefone,
        rua, numero, complemento, cep,
        fk_id_cidade_endereco, // <<< Novo nome para endereço,
        localizacao, // Deverá ser um objeto { lat, lng }
        fk_id_cidade_regiao, // <<< Novo nome para região
        raio_atuacao// Deverá ser um número
    } = req.body;

    if (!nome || !email || !senha || !tipo_usuario || !identificador) {
        return res.status(400).json({ msg: 'Por favor, preencha todos os campos obrigatórios.' });
    }
    
    // CORREÇÃO: Usar db.pool em vez de pool
    const client = await db.pool.connect(); 

    try {
        await client.query('BEGIN');

        // O resto do código permanece o mesmo, pois ele usa 'client.query'
        const userExists = await client.query('SELECT * FROM Usuario WHERE email = $1 OR identificador = $2', [email, identificador]);
        if (userExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'Usuário com este e-mail ou identificador já existe.' });
        }

        let idEndereco = null;
        if (rua && cep && fk_id_cidade_endereco) {
            const enderecoResult = await client.query(
                'INSERT INTO Endereco (rua, numero, complemento, cep, fk_id_cidade) VALUES ($1, $2, $3, $4, $5) RETURNING id_ender',
                [rua, numero, complemento, cep, fk_id_cidade_endereco]
            );
            idEndereco = enderecoResult.rows[0].id_ender;
        }

        const newUserResult = await client.query(
            `INSERT INTO Usuario (nome, email, senha, tipo_usuario, identificador, telefone, ativo, fk_id_ender) 
             VALUES ($1, $2, $3, $4, $5, $6, true, $7) 
             RETURNING id_usuario, nome, email`,
            [nome, email, senha, tipo_usuario, identificador, telefone, idEndereco]
        );
        const newUser = newUserResult.rows[0];

        // --- LÓGICA PARA REGIÃO DE ATUAÇÃO ---
        // 3. Lógica de Região usa fk_id_cidade_regiao
        if (localizacao && raio_atuacao && fk_id_cidade_regiao) {
            const point = `POINT(${localizacao.lng} ${localizacao.lat})`;
            const regiaoResult = await client.query(
                'INSERT INTO Regiao_atuacao (local, raio, fk_id_cidade) VALUES (ST_GeomFromText($1, 4326), $2, $3) RETURNING id_regiao',
                [point, raio_atuacao, fk_id_cidade_regiao]
            );
            const idRegiao = regiaoResult.rows[0].id_regiao;

            await client.query(
                'INSERT INTO Atua (fk_id_usuario, fk_id_regiao) VALUES ($1, $2)',
                [newUser.id_usuario, idRegiao]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ msg: 'Usuário cadastrado com sucesso!', user: newUser });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
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