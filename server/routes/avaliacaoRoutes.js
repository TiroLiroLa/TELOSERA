const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// @route   POST /api/avaliacoes
// @desc    Criar uma nova avaliação
// @access  Privado
router.post('/', auth, async (req, res) => {
    const {
        idAnuncio, // Para saber a qual contexto a avaliação pertence
        idAvaliado, // O ID do usuário que está sendo avaliado
        nota_satisfacao,
        nota_pontualidade,
        comentario,
        tipo_avaliacao // 'P' (avaliando prestador) ou 'C' (avaliando contratante)
    } = req.body;
    
    const idAvaliador = req.user.id; // Usuário logado

    // Validações
    if (!idAnuncio || !idAvaliado || !tipo_avaliacao) {
        return res.status(400).json({ msg: "Dados insuficientes para a avaliação." });
    }
    if (idAvaliador === idAvaliado) {
        return res.status(400).json({ msg: "Você não pode avaliar a si mesmo." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Encontrar a 'Confirmacao' ligada a este anúncio e ao usuário avaliado
        // Isso garante que a avaliação só pode ocorrer após uma confirmação
        const confirmacaoQuery = `
            SELECT conf.id_confirmacao FROM Confirmacao conf
            JOIN Candidatura c ON conf.fk_id_usuario = c.fk_id_usuario
            WHERE c.fk_id_anuncio = $1 AND conf.fk_id_usuario = $2;
        `;
        const confirmacaoResult = await client.query(confirmacaoQuery, [idAnuncio, idAvaliado]);

        if (confirmacaoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ msg: "Não há um serviço confirmado entre estes usuários para este anúncio." });
        }
        const idConfirmacao = confirmacaoResult.rows[0].id_confirmacao;

        // 2. Verificar se este avaliador já não avaliou esta pessoa nesta confirmação
        const avaliacaoExistente = await client.query(
            'SELECT * FROM Avaliacao WHERE fk_id_confirmacao = $1 AND fk_id_avaliador = $2',
            [idConfirmacao, idAvaliador]
        );
        if (avaliacaoExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: "Você já enviou uma avaliação para este serviço." });
        }

        // 3. Insere na tabela base 'Avaliacao'
        const novaAvaliacaoResult = await client.query(
            `INSERT INTO Avaliacao (fk_id_confirmacao, fk_id_avaliador, fk_id_avaliado, comentario, tipo_avaliacao)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_avaliacao`,
            [idConfirmacao, idAvaliador, idAvaliado, comentario, tipo_avaliacao]
        );
        const idAvaliacao = novaAvaliacaoResult.rows[0].id_avaliacao;
        
        // 4. Insere na tabela específica (Avaliacao_prestador ou Avaliacao_contratante)
        if (tipo_avaliacao === 'P') { // Avaliando um Prestador
            // (Assumindo que clareza_demanda e pagamento são notas para o contratante)
            await client.query(
                'INSERT INTO Avaliacao_prestador (fk_id_avaliacao, satisfacao, pontualidade) VALUES ($1, $2, $3)',
                [idAvaliacao, nota_satisfacao, nota_pontualidade]
            );
        } else { // 'C', Avaliando um Contratante (vamos assumir notas genéricas por enquanto)
            // Aqui você adicionaria as colunas da tabela Avaliacao_contratante
            // Ex: clareza_demanda, pagamento
            // Por simplicidade, vamos pular a inserção na tabela específica do contratante.
        }

        await client.query('COMMIT');
        res.status(201).json({ msg: "Avaliação enviada com sucesso!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    } finally {
        client.release();
    }
});

module.exports = router;