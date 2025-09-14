// server/routes/dadosRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // <<< IMPORTA A CONEXÃO CENTRALIZADA

// @route   GET api/dados/areas
// @desc    Buscar todas as áreas de atuação
// @access  Público
router.get('/areas', async (req, res) => {
    try {
        const areas = await db.query("SELECT * FROM Area_atuacao ORDER BY nome"); // <<< USA db.query
        res.json(areas.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   GET api/dados/servicos
// @desc    Buscar todos os serviços
// @access  Público
router.get('/servicos', async (req, res) => {
    try {
        const servicos = await db.query("SELECT * FROM Servico ORDER BY nome"); // <<< USA db.query
        res.json(servicos.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;