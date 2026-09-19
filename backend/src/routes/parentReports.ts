import { Router, Response } from 'express';
import { InStatement } from '@libsql/client';
import { getDb } from '../database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { date, category = 'regular' } = req.query;
  if (!date) { res.json([]); return; }
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: 'SELECT student_id FROM parent_reports WHERE teacher_id = ? AND report_date = ? AND category = ?',
      args: [req.user!.id, date as string, category as string],
    });
    res.json(rs.rows.map((r: any) => Number(r.student_id)));
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/last-dates', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { category = 'regular' } = req.query;
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: 'SELECT student_id, MAX(report_date) as last_date FROM parent_reports WHERE category = ? GROUP BY student_id',
      args: [category as string],
    });
    res.json(rs.rows.map((r: any) => ({ student_id: Number(r.student_id), last_date: r.last_date })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

// Report counts per student for a category (e.g. summer term)
router.get('/counts', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { category = 'regular' } = req.query;
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: 'SELECT student_id, COUNT(DISTINCT report_date) as count FROM parent_reports WHERE category = ? GROUP BY student_id',
      args: [category as string],
    });
    res.json(rs.rows.map((r: any) => ({ student_id: Number(r.student_id), count: Number(r.count) })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

// Users who can be recorded as a reporter (admins included), for the admin panel
router.get('/reporters', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const rs = await db.execute('SELECT id, name, role FROM users ORDER BY role ASC, name ASC');
    res.json(rs.rows.map((r: any) => ({ id: Number(r.id), name: r.name, role: r.role })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { date, category = 'regular' } = req.query;
  if (!date) { res.json([]); return; }
  try {
    const db = await getDb();
    const rs = await db.execute({
      sql: `SELECT pr.id, pr.report_date, pr.teacher_id,
                   u.name as teacher_name, s.id as student_id, s.name as student_name
            FROM parent_reports pr
            JOIN users u ON pr.teacher_id = u.id
            JOIN students s ON pr.student_id = s.id
            WHERE pr.report_date = ? AND pr.category = ?
            ORDER BY u.name, s.name`,
      args: [date as string, category as string],
    });
    res.json(rs.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { report_date, student_ids, category = 'regular' } = req.body;
  if (!report_date || !Array.isArray(student_ids)) {
    res.status(400).json({ error: 'report_dateとstudent_idsが必要です' });
    return;
  }
  try {
    const db = await getDb();
    const teacher_id = req.user!.id;
    const stmts: InStatement[] = [
      { sql: 'DELETE FROM parent_reports WHERE teacher_id = ? AND report_date = ? AND category = ?', args: [teacher_id, report_date, category] },
      ...(student_ids as number[]).map(sid => ({
        sql: "INSERT INTO parent_reports (student_id, teacher_id, report_date, content, category) VALUES (?, ?, ?, '', ?)",
        args: [sid, teacher_id, report_date, category],
      })),
    ];
    await db.batch(stmts, 'write');
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

// Admin: check / uncheck a single student's report for a date, on behalf of any reporter
router.post('/admin/toggle', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { student_id, report_date, category = 'regular', checked } = req.body;
  const reporter_id = req.body.teacher_id ?? req.user!.id;
  if (!student_id || !report_date || typeof checked !== 'boolean') {
    res.status(400).json({ error: 'student_id, report_date, checked が必要です' });
    return;
  }
  try {
    const db = await getDb();
    const args = [Number(student_id), Number(reporter_id), String(report_date), String(category)];

    const reporter = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [Number(reporter_id)] });
    if (reporter.rows.length === 0) {
      res.status(400).json({ error: '報告者が見つかりません' });
      return;
    }

    if (checked) {
      const existing = await db.execute({
        sql: 'SELECT id FROM parent_reports WHERE student_id = ? AND teacher_id = ? AND report_date = ? AND category = ?',
        args,
      });
      if (existing.rows.length === 0) {
        await db.execute({
          sql: "INSERT INTO parent_reports (student_id, teacher_id, report_date, content, category) VALUES (?, ?, ?, '', ?)",
          args,
        });
      }
    } else {
      await db.execute({
        sql: 'DELETE FROM parent_reports WHERE student_id = ? AND teacher_id = ? AND report_date = ? AND category = ?',
        args,
      });
    }
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

export default router;
