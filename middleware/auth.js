const authMiddleware = (req, res, next) => {
  const token = require('../config.js').config.preferences?.token?.toString();
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return;
  }
  next();
}

module.exports = authMiddleware;