import { useState, useEffect, useMemo } from 'react';
import { Student } from '../../types';
import api from '../../api/client';

interface LastDate { student_id: number; last_date: string; }
interface CountEntry { student_id: number; count: number; }

type Category = 'regular' | 'summer';

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function AdminParentReport() {
  const [category, setCategory] = useState<Category>('regular');
  const [students, setStudents] = useState<Student[]>([]);
  const [lastDates, setLastDates] = useState<Map<number, string>>(new Map());
  const [counts, setCounts] = useState<Map<number, number>>(new Map());
  const [filterGrade, setFilterGrade] = useState('all');
  const [showWarnOnly, setShowWarnOnly] = useState(false);

  useEffect(() => {
    api.get<Student[]>('/students').then(r => setStudents(r.data));
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<LastDate[]>(`/parent-reports/last-dates?category=${category}`),
      api.get<CountEntry[]>(`/parent-reports/counts?category=${category}`),
    ]).then(([lRes, cRes]) => {
      const ldMap = new Map<number, string>();
      for (const e of lRes.data) ldMap.set(e.student_id, e.last_date);
      setLastDates(ldMap);
      const cMap = new Map<number, number>();
      for (const e of cRes.data) cMap.set(e.student_id, e.count);
      setCounts(cMap);
    });
  }, [category]);

  const grades = useMemo(() => {
    const set = new Set(students.map(s => s.grade).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [students]);

  const rows = useMemo(() => {
    return students
      .filter(s => filterGrade === 'all' || s.grade === filterGrade)
      .map(s => ({ ...s, days: daysSince(lastDates.get(s.id)), last_date: lastDates.get(s.id), count: counts.get(s.id) ?? 0 }))
      .filter(s => !showWarnOnly || s.days >= 14)
      .sort((a, b) => b.days - a.days);
  }, [students, lastDates, counts, filterGrade, showWarnOnly]);

  const warnCount = students.filter(s => daysSince(lastDates.get(s.id)) >= 14).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">保護者報告 進捗</h2>
        <span className="text-sm text-gray-500">
          {students.length}名中 <span className="text-amber-600 font-semibold">{warnCount}名</span> が2週間以上未報告
        </span>
      </div>

      {/* Category toggle */}
      <div className="flex gap-2 mb-4">
        {(['regular', 'summer'] as Category[]).map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              category === c
                ? c === 'summer'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {c === 'regular' ? '📅 通常' : '☀️ 夏期講習'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-1">
          {grades.map(g => (
            <button
              key={g}
              onClick={() => setFilterGrade(g)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                filterGrade === g
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {g === 'all' ? '全員' : g}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showWarnOnly}
            onChange={e => setShowWarnOnly(e.target.checked)}
            className="w-4 h-4 text-amber-500 rounded"
          />
          要対応のみ表示
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">名前</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">学年</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">最終報告日</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">経過日数</th>
              {category === 'summer' && (
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">報告回数</th>
              )}
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">該当する生徒がいません</td></tr>
            ) : rows.map(s => {
              const isWarn = s.days >= 14;
              return (
                <tr key={s.id} className={`transition-colors ${isWarn ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.grade || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.last_date ?? <span className="text-gray-300">なし</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.days === Infinity ? '—' : `${s.days}日`}
                  </td>
                  {category === 'summer' && (
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${s.count > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                        {s.count}回
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {isWarn ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        ⚠️ 要報告
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                        ✓ 対応済
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
