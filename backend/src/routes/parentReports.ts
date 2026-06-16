import { Router, Response } from 'express';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { student_id } = req.query;
  if (!student_id) { res.status(400).json({ error: 'student_idが必要です' }); return; }
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: `SELECT pr.id, pr.report_date, pr.content, pr.created_at,
                   u.name as teacher_name, s.name as student_name
            FROM parent_reports pr
            JOIN users u ON pr.teacher_id = u.id
            JOIN students s ON pr.student_id = s.id
            WHERE pr.student_id = ?
            ORDER BY pr.report_date DESC, pr.created_at DESC`,
      args: [student_id as string],
    });
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { student_id, report_date, content } = req.body;
  if (!student_id || !report_date || !content?.trim()) {
    res.status(400).json({ error: '全ての項目を入力してください' });
    return;
  }
  try {
    const db = await getDb();
    const r = await db.execute({
      sql: 'INSERT INTO parent_reports (student_id, teacher_id, report_date, content) VALUES (?, ?, ?, ?)',
      args: [student_id, req.user!.id, report_date, content.trim()],
    });
    res.json({ id: Number(r.lastInsertRowid) });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    await db.execute({
      sql: 'DELETE FROM parent_reports WHERE id = ? AND teacher_id = ?',
      args: [req.params.id, req.user!.id],
    });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

export default router;
