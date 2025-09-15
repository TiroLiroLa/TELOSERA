// Importa as depend�ncias
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Inicializa o aplicativo Express
const app = express();

// Middlewares
app.use(cors()); // Permite requisi��es de outras origens
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisi��es

// Rota de teste
app.get('/', (req, res) => {
  res.send('API do TELOSERA está funcionando!');
});

// Usar rotas de usu�rio
app.use('/api/users', require('./routes/userRoutes')); // Nova linha

// Usar rotas de an�ncios
app.use('/api/anuncios', require('./routes/anuncioRoutes')); // <<< NOVA LINHA

app.use('/api/dados', require('./routes/dadosRoutes')); // <<< NOVA LINHA

// Define a porta do servidor
const PORT = process.env.PORT || 3001;

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});