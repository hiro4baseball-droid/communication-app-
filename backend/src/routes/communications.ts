import { Router, Response } from 'express';
import { InStatement } from '@libsql/client';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const db = await getDb();
    const { student_id } = req.query;
    const base = `
      SELECT cl.id, cl.shift_date, cl.note, cl.created_at,
             u.id as teacher_id, u.name as teacher_name,
             s.id as student_id, s.name as student_name
      FROM communication_logs cl
      JOIN users u ON cl.teacher_id = u.id
      JOIN students s ON cl.student_id = s.id
    `;
    let rs;
    if (date && student_id) {
      rs = await db.execute({ sql: base + ' WHERE cl.shift_date = ? AND cl.student_id = ? ORDER BY u.name', args: [date as string, student_id as string] });
    } else if (date) {
      rs = await db.execute({ sql: base + ' WHERE cl.shift_date = ? ORDER BY u.name, s.name', args: [date as string] });
    } else if (student_id) {
      rs = await db.execute({ sql: base + ' WHERE cl.student_id = ? ORDER BY cl.shift_date DESC, u.name', args: [student_id as string] });
    } else {
      rs = await db.execute(base + ' ORDER BY cl.shift_date DESC, u.name, s.name');
    }
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) { res.json([]); return; }
    const db = await getDb();
    const rs = await db.execute({
      sql: 'SELECT student_id, note FROM communication_logs WHERE teacher_id = ? AND shift_date = ?',
      args: [req.user!.id, date as string],
    });
    res.json(rs.rows.map((r: any) => ({ student_id: Number(r.student_id), note: r.note || '' })));
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shift_date, entries } = req.body;
  if (!shift_date || !Array.isArray(entries)) {
    res.status(400).json({ error: 'shift_dateとentriesが必要です' });
    return;
  }
  try {
    const db = await getDb();
    const teacher_id = req.user!.id;
    const stmts: InStatement[] = [
      { sql: 'DELETE FROM communication_logs WHERE teacher_id = ? AND shift_date = ?', args: [teacher_id, shift_date] },
      ...(entries as Array<{ student_id: number; note: string }>).map(e => ({
        sql: 'INSERT INTO communication_logs (teacher_id, student_id, shift_date, note) VALUES (?, ?, ?, ?)',
        args: [teacher_id, e.student_id, shift_date, e.note || ''],
      })),
    ];
    await db.batch(stmts, 'write');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

export default router;
