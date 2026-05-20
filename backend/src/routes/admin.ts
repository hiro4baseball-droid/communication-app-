import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/teachers', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const rs = await db.execute("SELECT id, name, created_at, last_login FROM users WHERE role = 'teacher' ORDER BY name ASC");
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.post('/teachers', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, password } = req.body;
  if (!name || !password) { res.status(400).json({ error: '名前とパスワードは必須です' }); return; }
  try {
    const db = await getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE name = ?', args: [name] });
    if (existing.rows.length > 0) { res.status(400).json({ error: 'この名前は既に使用されています' }); return; }
    const hash = bcrypt.hashSync(password, 10);
    const r = await db.execute({ sql: 'INSERT INTO users (name, password_hash, role) VALUES (?, ?, ?)', args: [name, hash, 'teacher'] });
    res.json({ id: Number(r.lastInsertRowid), name, role: 'teacher' });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.delete('/teachers/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    await db.execute({ sql: "DELETE FROM users WHERE id = ? AND role = 'teacher'", args: [Number(req.params.id)] });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/activity-summary', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const rs = await db.execute(`
      SELECT u.id, u.name, u.last_login,
             COUNT(DISTINCT cl.id) as total_comms,
             COUNT(DISTINCT cl.shift_date) as total_shifts,
             MAX(cl.shift_date) as last_shift,
             (SELECT COUNT(*) FROM login_history lh WHERE lh.user_id = u.id) as login_count
      FROM users u
      LEFT JOIN communication_logs cl ON cl.teacher_id = u.id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY u.name ASC
    `);
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/teachers/:id/activity', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const [loginRs, shiftRs] = await Promise.all([
      db.execute({ sql: 'SELECT login_at FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT 30', args: [id] }),
      db.execute({
        sql: `SELECT cl.shift_date, COUNT(*) as student_count, GROUP_CONCAT(s.name, ', ') as students
              FROM communication_logs cl
              JOIN students s ON cl.student_id = s.id
              WHERE cl.teacher_id = ?
              GROUP BY cl.shift_date
              ORDER BY cl.shift_date DESC LIMIT 20`,
        args: [id],
      }),
    ]);
    res.json({ loginHistory: loginRs.rows, recentShifts: shiftRs.rows });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/students-overview', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const rs = await db.execute(`
      SELECT s.id, s.name, s.grade,
             COUNT(DISTINCT cl.id) as total_comms,
             COUNT(DISTINCT cl.teacher_id) as teacher_count,
             MAX(cl.shift_date) as last_comm_date,
             GROUP_CONCAT(DISTINCT u.name) as teachers_talked_to
      FROM students s
      LEFT JOIN communication_logs cl ON cl.student_id = s.id
      LEFT JOIN users u ON cl.teacher_id = u.id
      GROUP BY s.id
      ORDER BY total_comms ASC, s.name ASC
    `);
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

export default router;
