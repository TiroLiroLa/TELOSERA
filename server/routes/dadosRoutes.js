// server/routes/dadosRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // <<< IMPORTA A CONEX�O CENTRALIZADA

// @route   GET api/dados/localizacao-por-nome
// @desc    Buscar IDs de estado e cidade a partir de seus nomes/uf
// @access  Público
router.get('/localizacao-por-nome', async (req, res) => {
    const { uf, cidade } = req.query;

    if (!uf || !cidade) {
        return res.status(400).json({ msg: "UF e nome da cidade são obrigatórios." });
    }

    try {
        const query = `
            SELECT 
                c.id_cidade, c.nome as nome_cidade,
                e.id_estado, e.uf as uf_estado
            FROM Cidade c
            JOIN Estado e ON c.fk_id_estado = e.id_estado
            WHERE e.uf ILIKE $1 AND c.nome ILIKE $2;
        `;
        const result = await db.query(query, [uf, cidade]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Combinação de cidade/estado não encontrada em nosso banco de dados." });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});

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

// @route   GET api/dados/estados
// @desc    Buscar todos os estados de um país (Brasil = 1)
// @access  Público
router.get('/estados', async (req, res) => {
    try {
        const estados = await db.query("SELECT id_estado, nome, uf FROM Estado WHERE fk_id_pais = 1 ORDER BY nome"); // Hardcoded Brasil (ID 1)
        res.json(estados.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   GET api/dados/cidades
// @desc    Buscar cidades para autocomplete
// @access  Público
router.get('/cidades', async (req, res) => {
    const { q, estadoId } = req.query; // q = query, estadoId = filtro opcional
    if (!q) {
        return res.json([]);
    }
    try {
        let query = "SELECT id_cidade, nome FROM Cidade WHERE nome ILIKE $1";
        const values = [`%${q}%`];
        
        if (estadoId) {
            query += " AND fk_id_estado = $2";
            values.push(estadoId);
        }
        query += " LIMIT 10"; // Limita para 10 sugestões

        const cidades = await db.query(query, values);
        res.json(cidades.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   POST api/dados/cidades
// @desc    Criar uma nova cidade (se não existir)
// @access  Público (ou poderia ser Privado)
router.post('/cidades', async (req, res) => {
    const { nome, fk_id_estado } = req.body;
    if (!nome || !fk_id_estado) {
        return res.status(400).json({ msg: 'Nome da cidade e ID do estado são obrigatórios.' });
    }
    try {
        // 1. Verifica se a cidade já existe naquele estado para evitar duplicatas
        const existe = await db.query(
            "SELECT id_cidade FROM Cidade WHERE nome ILIKE $1 AND fk_id_estado = $2",
            [nome, fk_id_estado]
        );

        if (existe.rows.length > 0) {
            return res.json(existe.rows[0]); // Se já existe, retorna o ID dela
        }

        // 2. Se não existe, cria a nova cidade
        const novaCidade = await db.query(
            "INSERT INTO Cidade (nome, fk_id_estado) VALUES ($1, $2) RETURNING id_cidade, nome",
            [nome.trim(), fk_id_estado]
        );
        res.status(201).json(novaCidade.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;