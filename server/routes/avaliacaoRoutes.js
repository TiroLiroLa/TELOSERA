
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
        idConfirmacao,
        idUsuarioAvaliado, tipoAvaliacao, comentario, nota1, nota2
    } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const avaliacaoResult = await client.query(
            `INSERT INTO Avaliacao (tipo_avaliacao, comentario, fk_id_confirmacao, fk_id_avaliador, fk_id_avaliado)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_avaliacao`,
            [tipoAvaliacao, comentario, idConfirmacao, idAvaliador, idUsuarioAvaliado]
        );
        const idAvaliacao = avaliacaoResult.rows[0].id_avaliacao;

        if (tipoAvaliacao === 'P') {
            await client.query(
                'INSERT INTO Avaliacao_prestador (fk_id_avaliacao, satisfacao, pontualidade) VALUES ($1, $2, $3)',
                [idAvaliacao, nota1, nota2]
            );
        } else {
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