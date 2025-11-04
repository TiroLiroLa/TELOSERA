
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const whitelist = [
  'http://localhost:3000',
  'https://telosera-client.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
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