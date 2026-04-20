import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing auth token' });
  }
  try {
    const token = header.substring(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}
