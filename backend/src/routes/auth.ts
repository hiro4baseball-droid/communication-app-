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

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, password, invite_code } = req.body;
  if (!name || !password || !invite_code) {
    res.status(400).json({ error: '全ての項目を入力してください' });
    return;
  }

  const validCode = process.env.INVITE_CODE || 'sensei2024';
  if (invite_code !== validCode) {
    res.status(403).json({ error: '招待コードが正しくありません' });
    return;
  }

  try {
    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE name = ?', args: [name] });
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'この名前は既に使用されています' });
      return;
    }

    const hash = bcrypt.hashSync(password, 10);
    const r = await db.execute({
      sql: 'INSERT INTO users (name, password_hash, role) VALUES (?, ?, ?)',
      args: [name, hash, 'teacher'],
    });

    const token = jwt.sign(
      { id: Number(r.lastInsertRowid), name, role: 'teacher' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: Number(r.lastInsertRowid), name, role: 'teacher' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json(req.user);
});

export default router;
