
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API do TELOSERA está funcionando!');
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/anuncios', require('./routes/anuncioRoutes'));

app.use('/api/dados', require('./routes/dadosRoutes'));

app.use('/api/avaliacoes', require('./routes/avaliacaoRoutes'));

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});