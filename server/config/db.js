const { Pool } = require('pg');
require('dotenv').config();

let pool;

// <<< LÓGICA DE PRODUÇÃO VS. DESENVOLVIMENTO
if (process.env.DATABASE_URL) {
    // Se a DATABASE_URL existir (ambiente do Render), usa ela.
    console.log("Conectando ao banco de dados do Render...");
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Render recomenda (e às vezes exige) SSL para conexões
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // Senão, usa as variáveis locais do .env (ambiente de desenvolvimento).
    console.log("Conectando ao banco de dados local...");
    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
}

// Exporta o objeto com o método 'query' e o 'pool'
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};