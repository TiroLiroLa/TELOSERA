const { Pool } = require('pg');
require('dotenv').config();

// Cria uma única instância do Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exporta um objeto com o método 'query' e o 'pool'
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool // <<< NOVA LINHA: exporta a instância do pool
};