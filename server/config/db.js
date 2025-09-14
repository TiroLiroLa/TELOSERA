const { Pool } = require('pg');
require('dotenv').config();

// Cria uma �nica inst�ncia do Pool com as credenciais do arquivo .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exporta um m�todo 'query' que usa nosso pool de conex�o
module.exports = {
  query: (text, params) => pool.query(text, params),
};