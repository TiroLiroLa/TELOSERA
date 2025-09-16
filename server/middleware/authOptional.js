const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');

    // Se não há token, simplesmente continua sem adicionar 'req.user'
    if (!token) {
        return next();
    }

    try {
        // Se há token, tenta verificar. Se for válido, adiciona 'req.user'.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        // Se o token for inválido/expirado, trata como se não houvesse token.
        return next();
    }
};