const jwt = require('jsonwebtoken');
const secretKey = 'JWTpaiSESSIONsecret!0246';

// Middleware para verificar el token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).send('Token requerido');
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send('Token inválido');
    }
    req.user = decoded; // Agrega la información del usuario a la solicitud
    next();
  });
}


module.exports = verifyToken;