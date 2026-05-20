import { Router, Response } from 'express';
import { getDb } from '../database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const rs = await db.execute('SELECT * FROM students ORDER BY name ASC');
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.post('/bulk', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { students } = req.body as { students: Array<{ name: string; grade?: string }> };
  if (!Array.isArray(students) || students.length === 0) {
    res.status(400).json({ error: '生徒リストが必要です' });
    return;
  }
  try {
    const db = await getDb();
    const results: Array<{ name: string; success: boolean; error?: string }> = [];
    for (const s of students) {
      const name = s.name.trim();
      if (!name) continue;
      try {
        const r = await db.execute({ sql: 'INSERT INTO students (name, grade) VALUES (?, ?)', args: [name, s.grade?.trim() || ''] });
        await db.execute({ sql: 'INSERT OR IGNORE INTO student_records (student_id) VALUES (?)', args: [Number(r.lastInsertRowid)] });
        results.push({ name, success: true });
      } catch {
        results.push({ name, success: false, error: '登録失敗（重複の可能性）' });
      }
    }
    const succeeded = results.filter(r => r.success).length;
    res.json({ succeeded, failed: results.length - succeeded, results });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, grade } = req.body;
  if (!name) { res.status(400).json({ error: '名前は必須です' }); return; }
  try {
    const db = await getDb();
    const r = await db.execute({ sql: 'INSERT INTO students (name, grade) VALUES (?, ?)', args: [name, grade || ''] });
    const id = Number(r.lastInsertRowid);
    await db.execute({ sql: 'INSERT OR IGNORE INTO student_records (student_id) VALUES (?)', args: [id] });
    res.json({ id, name, grade: grade || '' });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, grade } = req.body;
  if (!name) { res.status(400).json({ error: '名前は必須です' }); return; }
  try {
    const db = await getDb();
    await db.execute({ sql: 'UPDATE students SET name = ?, grade = ? WHERE id = ?', args: [name, grade || '', Number(req.params.id)] });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM students WHERE id = ?', args: [Number(req.params.id)] });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/:id/record', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const studentId = Number(req.params.id);
    await db.execute({ sql: 'INSERT OR IGNORE INTO student_records (student_id) VALUES (?)', args: [studentId] });
    const rs = await db.execute({
      sql: `SELECT sr.*, u.name as updated_by_name
            FROM student_records sr
            LEFT JOIN users u ON sr.updated_by = u.id
            WHERE sr.student_id = ?`,
      args: [studentId],
    });
    res.json(rs.rows[0] || null);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.put('/:id/record', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { likes, efforts, talk_history } = req.body;
  try {
    const db = await getDb();
    await db.execute({
      sql: `INSERT INTO student_records (student_id, likes, efforts, talk_history, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(student_id) DO UPDATE SET
              likes = excluded.likes, efforts = excluded.efforts,
              talk_history = excluded.talk_history, updated_by = excluded.updated_by,
              updated_at = excluded.updated_at`,
      args: [Number(req.params.id), likes || '', efforts || '', talk_history || '', req.user!.id],
    });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

export default router;
