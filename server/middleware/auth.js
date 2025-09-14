const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Obter o token do header da requisição
  const token = req.header('x-auth-token');

  // 2. Verificar se não há token
  if (!token) {
    return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
  }

  // 3. Verificar se o token é válido
  try {
    // jwt.verify() decodifica o token. Se for inválido (assinatura errada ou expirado), ele vai gerar um erro.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adiciona o payload do usuário (que contém o ID) ao objeto da requisição
    req.user = decoded.user;
    
    // Passa para a próxima etapa (a rota que o usuário quer acessar)
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token não é válido' });
  }
};