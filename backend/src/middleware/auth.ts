import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'comm-app-secret-2024-change-in-prod';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: '認証が必要です' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; name: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'トークンが無効です' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: '管理者権限が必要です' });
    return;
  }
  next();
}
