// server/routes/dadosRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA

// @route   GET api/dados/areas
// @desc    Buscar todas as �reas de atua��o
// @access  P�blico
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
// @desc    Buscar todos os servi�os
// @access  P�blico
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