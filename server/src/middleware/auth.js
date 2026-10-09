import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cloth_store_pos_jwt_secret_key_prod_2026_xyz');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or deleted' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Admin.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user ? req.user.role : 'Guest'}' cannot perform this action`
      });
    }
    next();
  };
};
