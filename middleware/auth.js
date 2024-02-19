import { config } from '../config.js';

const authMiddleware = (req, res, next) => {
  const token = config.preferences?.token?.toString();
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return;
  }
  next();
}

export default authMiddleware;