// server/routes/avaliacoesRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// @route   POST /api/avaliacoes
// @desc    Criar uma nova avaliação
// @access  Privado
router.post('/', auth, async (req, res) => {
    const idAvaliador = req.user.id;
    const { 
        idAnuncio, idUsuarioAvaliado, tipoAvaliacao, comentario, nota1, nota2 
    } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Encontrar o id_confirmacao correto (ligado ao usuário que foi confirmado)
        const confirmacaoResult = await client.query(
            `SELECT c.id_confirmacao FROM Confirmacao c 
             JOIN Candidatura cand ON c.fk_id_usuario = cand.fk_id_usuario
             WHERE cand.fk_id_anuncio = $1 AND cand.fk_id_usuario = $2`, 
             [idAnuncio, (tipoAvaliacao === 'P' ? idUsuarioAvaliado : idAvaliador)]
        );
        if (confirmacaoResult.rows.length === 0) {
            throw new Error("Confirmação de serviço não encontrada para esta combinação.");
        }
        const idConfirmacao = confirmacaoResult.rows[0].id_confirmacao;
        
        // 2. Inserir na tabela base 'Avaliacao'
        const avaliacaoResult = await client.query(
            `INSERT INTO Avaliacao (tipo_avaliacao, comentario, fk_id_confirmacao, fk_id_avaliador, fk_id_avaliado)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_avaliacao`,
            [tipoAvaliacao, comentario, idConfirmacao, idAvaliador, idUsuarioAvaliado]
        );
        const idAvaliacao = avaliacaoResult.rows[0].id_avaliacao;
        
        // 3. Inserir na tabela específica
        if (tipoAvaliacao === 'P') { // Empresa avaliando Prestador
            await client.query(
                'INSERT INTO Avaliacao_prestador (fk_id_avaliacao, satisfacao, pontualidade) VALUES ($1, $2, $3)',
                [idAvaliacao, nota1, nota2]
            );
        } else { // 'C' -> Prestador avaliando Contratante (Empresa)
            await client.query(
                'INSERT INTO Avaliacao_contratante (fk_id_avaliacao, clareza_demanda, pagamento) VALUES ($1, $2, $3)',
                [idAvaliacao, nota1, nota2]
            );
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