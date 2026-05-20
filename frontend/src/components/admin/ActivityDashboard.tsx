import { useState, useEffect } from 'react';
import { TeacherActivity, StudentOverview } from '../../types';
import api from '../../api/client';

export default function ActivityDashboard() {
  const [view, setView] = useState<'teacher' | 'student'>('teacher');
  const [teacherData, setTeacherData] = useState<TeacherActivity[]>([]);
  const [studentData, setStudentData] = useState<StudentOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<TeacherActivity[]>('/admin/activity-summary'),
      api.get<StudentOverview[]>('/admin/students-overview'),
    ]).then(([t, s]) => {
      setTeacherData(t.data);
      setStudentData(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">読み込み中...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">活動状況</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="講師数" value={teacherData.length} color="blue" />
        <StatCard label="生徒数" value={studentData.length} color="green" />
        <StatCard
          label="総記録数"
          value={teacherData.reduce((a, t) => a + t.total_comms, 0)}
          color="purple"
        />
        <StatCard
          label="未記録の生徒"
          value={studentData.filter(s => s.total_comms === 0).length}
          color="red"
        />
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('teacher')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'teacher' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
        >
          講師別
        </button>
        <button
          onClick={() => setView('student')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'student' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
        >
          生徒別
        </button>
      </div>

      {view === 'teacher' ? (
        <TeacherTable data={teacherData} />
      ) : (
        <StudentTable data={studentData} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TeacherTable({ data }: { data: TeacherActivity[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">講師名</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">ログイン回数</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">コミュニケーション記録</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">シフト回数</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">最終シフト</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">最終ログイン</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map(t => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
              <td className="px-4 py-3 text-gray-600">{t.login_count}回</td>
              <td className="px-4 py-3">
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{t.total_comms}件</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{t.total_shifts}回</td>
              <td className="px-4 py-3 text-gray-500 text-sm">{t.last_shift || '—'}</td>
              <td className="px-4 py-3 text-gray-400 text-sm">
                {t.last_login ? new Date(t.last_login).toLocaleDateString('ja-JP') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentTable({ data }: { data: StudentOverview[] }) {
  function getCommBadge(count: number) {
    if (count === 0) return 'bg-red-100 text-red-700';
    if (count < 3) return 'bg-orange-100 text-orange-700';
    if (count < 8) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  return (
    <div>
      <div className="flex gap-3 flex-wrap mb-4 text-xs">
        <LegendBadge color="bg-red-100 text-red-700" label="未記録 (0件)" />
        <LegendBadge color="bg-orange-100 text-orange-700" label="少ない (1〜2件)" />
        <LegendBadge color="bg-yellow-100 text-yellow-700" label="普通 (3〜7件)" />
        <LegendBadge color="bg-green-100 text-green-700" label="十分 (8件以上)" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">生徒名</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">学年</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">コミュニケーション数</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">関わった講師数</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">最終記録日</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">関わった講師</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.grade || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCommBadge(s.total_comms)}`}>
                    {s.total_comms}件
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{s.teacher_count}名</td>
                <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{s.last_comm_date || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                  {s.teachers_talked_to || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium ${color}`}>{label}</span>
  );
}
