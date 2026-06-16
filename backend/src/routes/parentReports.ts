import { Router, Response } from 'express';
import { InStatement } from '@libsql/client';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// My checked students for a date
router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { date } = req.query;
  if (!date) { res.json([]); return; }
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: 'SELECT student_id, content as note FROM parent_reports WHERE teacher_id = ? AND report_date = ?',
      args: [req.user!.id, date as string],
    });
    res.json(rs.rows.map((r: any) => ({ student_id: Number(r.student_id), note: r.note || '' })));
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

// Last report date per student (for warning display)
router.get('/last-dates', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const rs = await db.execute(
      'SELECT student_id, MAX(report_date) as last_date FROM parent_reports GROUP BY student_id'
    );
    res.json(rs.rows.map((r: any) => ({ student_id: Number(r.student_id), last_date: r.last_date })));
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

// All reports for a date (all teachers)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { date } = req.query;
  if (!date) { res.json([]); return; }
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: `SELECT pr.id, pr.report_date, pr.content as note,
                   u.name as teacher_name, s.id as student_id, s.name as student_name
            FROM parent_reports pr
            JOIN users u ON pr.teacher_id = u.id
            JOIN students s ON pr.student_id = s.id
            WHERE pr.report_date = ?
            ORDER BY u.name, s.name`,
      args: [date as string],
    });
    res.json(rs.rows);
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

// Batch save (delete + reinsert for teacher + date)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { report_date, entries } = req.body;
  if (!report_date || !Array.isArray(entries)) {
    res.status(400).json({ error: 'report_dateとentriesが必要です' });
    return;
  }
  try {
    const db = await getDb();
    const teacher_id = req.user!.id;
    const stmts: InStatement[] = [
      { sql: 'DELETE FROM parent_reports WHERE teacher_id = ? AND report_date = ?', args: [teacher_id, report_date] },
      ...(entries as Array<{ student_id: number; note: string }>).map(e => ({
        sql: 'INSERT INTO parent_reports (student_id, teacher_id, report_date, content) VALUES (?, ?, ?, ?)',
        args: [teacher_id, e.student_id, report_date, e.note || ''],
      })),
    ];
    await db.batch(stmts, 'write');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'サーバーエラー' }); }
});

export default router;
