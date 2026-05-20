import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import { authenticate, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { name, password } = req.body;
  if (!name || !password) {
    res.status(400).json({ error: '名前とパスワードを入力してください' });
    return;
  }
  try {
    const db = await getDb();
    const rs = await db.execute({ sql: 'SELECT * FROM users WHERE name = ?', args: [name] });
    const user = rs.rows[0] as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash as string)) {
      res.status(401).json({ error: '名前またはパスワードが正しくありません' });
      return;
    }

    await db.execute({ sql: 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', args: [user.id] });
    await db.execute({ sql: 'INSERT INTO login_history (user_id) VALUES (?)', args: [user.id] });

    const token = jwt.sign(
      { id: Number(user.id), name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: Number(user.id), name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json(req.user);
});

export default router;
