import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
};
