import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Student, CommunicationLog as CommLog } from '../../types';
import api from '../../api/client';

interface Props {
  students: Student[];
}

interface MineEntry {
  student_id: number;
  note: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export default function CommunicationLog({ students }: Props) {
  const [date, setDate] = useState(today());
  // Map<student_id, note> — presence in map means checked
  const [notes, setNotes] = useState<Map<number, string>>(new Map());
  const [allLogs, setAllLogs] = useState<CommLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const fetchData = useCallback(async () => {
    const [mineRes, allRes] = await Promise.all([
      api.get<MineEntry[]>(`/communications/mine?date=${date}`),
      api.get<CommLog[]>(`/communications?date=${date}`),
    ]);
    const map = new Map<number, string>();
    for (const e of mineRes.data) map.set(e.student_id, e.note);
    setNotes(map);
    setAllLogs(allRes.data);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggle(id: number) {
    setNotes(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id); else next.set(id, '');
      return next;
    });
  }

  function setNote(id: number, text: string) {
    setNotes(prev => new Map(prev).set(id, text));
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');
    try {
      const entries = Array.from(notes.entries()).map(([student_id, note]) => ({ student_id, note }));
      await api.post('/communications', { shift_date: date, entries });
      setSavedMsg('保存しました');
      await fetchData();
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setSavedMsg('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  // Group students by grade for display
  const studentsByGrade = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade, 'ja');
      return a.name.localeCompare(b.name, 'ja');
    });
    const map: Record<string, Student[]> = {};
    for (const s of sorted) {
      const key = s.grade || '学年未設定';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [students]);

  // Group logs by teacher for display
  const byTeacher = allLogs.reduce<Record<string, CommLog[]>>((acc, log) => {
    if (!acc[log.teacher_name]) acc[log.teacher_name] = [];
    acc[log.teacher_name].push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">コミュニケーション記録</h2>

      {/* Date picker */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">シフト日</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="input-field w-auto"
        />
      </div>

      {/* My checklist */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">この日に話した生徒</h3>
          <span className="text-sm text-blue-600 font-medium">{notes.size}名選択中</span>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-400 text-sm">生徒が登録されていません</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(studentsByGrade).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([grade, studs]) => (
              <div key={grade}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{grade}</p>
                <div className="space-y-2">
                  {studs.map(student => {
                    const isChecked = notes.has(student.id);
                    return (
                      <div key={student.id} className={`rounded-lg border transition-colors ${isChecked ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                        <label className="flex items-center gap-2 p-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(student.id)}
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                          />
                          <span className="text-sm font-medium text-gray-700">{student.name}</span>
                          {isChecked && notes.get(student.id) && (
                            <span className="ml-auto text-xs text-blue-500 truncate max-w-[150px]">{notes.get(student.id)}</span>
                          )}
                        </label>
                        {isChecked && (
                          <div className="px-3 pb-3">
                            <textarea
                              value={notes.get(student.id) || ''}
                              onChange={e => setNote(student.id, e.target.value)}
                              placeholder="一言メモ（任意）"
                              rows={2}
                              className="w-full text-sm border border-blue-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-white resize-none placeholder-gray-300"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? '保存中...' : '記録を保存'}
          </button>
          {savedMsg && (
            <span className={`text-sm font-medium ${savedMsg.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
              {savedMsg}
            </span>
          )}
        </div>
      </div>

      {/* All teachers on this date */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">
          {date} の全講師記録
        </h3>
        {Object.keys(byTeacher).length === 0 ? (
          <p className="text-gray-400 text-sm">この日の記録はまだありません</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(byTeacher).map(([teacher, logs]) => (
              <div key={teacher}>
                <p className="text-sm font-semibold text-gray-700 mb-1">{teacher}</p>
                <div className="space-y-1 pl-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{log.student_name}</span>
                      {log.note && <span className="text-xs text-gray-500">{log.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
