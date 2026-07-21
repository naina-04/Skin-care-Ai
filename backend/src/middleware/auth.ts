import { Request, Response, NextFunction } from 'express';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  if (session && session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: No active session' });
};
