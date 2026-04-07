const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');

module.exports = function authenticate(req, res, next) {
  if (req.path === '/auth/login' || req.path === '/auth/logout') return next();

  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
