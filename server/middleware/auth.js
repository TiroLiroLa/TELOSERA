const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Obter o token do header da requisi��o
  const token = req.header('x-auth-token');

  // 2. Verificar se n�o h� token
  if (!token) {
    return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
  }

  // 3. Verificar se o token � v�lido
  try {
    // jwt.verify() decodifica o token. Se for inv�lido (assinatura errada ou expirado), ele vai gerar um erro.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adiciona o payload do usu�rio (que cont�m o ID) ao objeto da requisi��o
    req.user = decoded.user;
    
    // Passa para a pr�xima etapa (a rota que o usu�rio quer acessar)
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token não é válido' });
  }
};