// Importa as depend�ncias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Configura a conex�o com o banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Inicializa o aplicativo Express
const app = express();

// Middlewares
app.use(cors()); // Permite requisi��es de outras origens
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisi��es

// Rota de teste
app.get('/', (req, res) => {
  res.send('API do TELOSERA est� funcionando!');
});

// Usar rotas de usu�rio
app.use('/api/users', require('./routes/userRoutes')); // Nova linha

// Define a porta do servidor
const PORT = process.env.PORT || 3001;

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});