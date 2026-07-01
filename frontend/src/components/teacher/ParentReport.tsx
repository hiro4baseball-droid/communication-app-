import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student } from '../../types';
import api from '../../api/client';

interface Props {
  students: Student[];
}

interface AllEntry {
  id: number;
  report_date: string;
  teacher_name: string;
  student_id: number;
  student_name: string;
}

interface LastDate {
  student_id: number;
  last_date: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function ParentReportView({ students }: Props) {
  const [date, setDate] = useState(today());
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [lastDates, setLastDates] = useState<Map<number, string>>(new Map());
  const [allEntries, setAllEntries] = useState<AllEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const fetchData = useCallback(async () => {
    const [mineRes, allRes, lastRes] = await Promise.all([
      api.get<number[]>(`/parent-reports/mine?date=${date}`),
      api.get<AllEntry[]>(`/parent-reports?date=${date}`),
      api.get<LastDate[]>('/parent-reports/last-dates'),
    ]);
    setChecked(new Set(mineRes.data));
    setAllEntries(allRes.data);
    const ldMap = new Map<number, string>();
    for (const e of lastRes.data) ldMap.set(e.student_id, e.last_date);
    setLastDates(ldMap);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  function toggle(id: number) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');
    try {
      await api.post('/parent-reports', { report_date: date, student_ids: [...checked] });
      setSavedMsg('保存しました');
      await fetchData();
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setSavedMsg('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  const byTeacher = allEntries.reduce<Record<string, AllEntry[]>>((acc, e) => {
    if (!acc[e.teacher_name]) acc[e.teacher_name] = [];
    acc[e.teacher_name].push(e);
    return acc;
  }, {});

  const warnCount = students.filter(s => daysSince(lastDates.get(s.id)) >= 14).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">保護者報告</h2>

      {warnCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">{warnCount}名が2週間以上未報告</p>
            <p className="text-sm text-amber-600">オレンジ枠の生徒は保護者への報告が14日以上ありません</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">報告日</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="input-field w-auto"
        />
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">この日に保護者報告した生徒</h3>
          <span className="text-sm text-blue-600 font-medium">{checked.size}名選択中</span>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-400 text-sm">生徒が登録されていません</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(studentsByGrade).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([grade, studs]) => (
              <div key={grade}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{grade}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {studs.map(student => {
                    const isChecked = checked.has(student.id);
                    const days = daysSince(lastDates.get(student.id));
                    const isWarn = days >= 14;
                    return (
                      <label
                        key={student.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-blue-400 bg-blue-50'
                            : isWarn
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(student.id)}
                          className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{student.name}</p>
                          {!isChecked && (
                            <p className={`text-xs ${isWarn ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                              {days === Infinity ? '未報告' : isWarn ? `⚠️ ${days}日経過` : `${days}日前`}
                            </p>
                          )}
                        </div>
                      </label>
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

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">{date} の全講師記録</h3>
        {Object.keys(byTeacher).length === 0 ? (
          <p className="text-gray-400 text-sm">この日の記録はまだありません</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byTeacher).map(([teacher, entries]) => (
              <div key={teacher} className="flex gap-3">
                <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">{teacher}</span>
                <div className="flex flex-wrap gap-1">
                  {entries.map(e => (
                    <span key={e.id} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      {e.student_name}
                    </span>
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
