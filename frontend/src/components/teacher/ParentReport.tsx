import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, ParentReport } from '../../types';
import api from '../../api/client';

interface Props {
  students: Student[];
  initialStudentId?: number;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ParentReportView({ students, initialStudentId }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(initialStudentId ?? null);
  const [reports, setReports] = useState<ParentReport[]>([]);
  const [reportDate, setReportDate] = useState(today());
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (initialStudentId) setSelectedId(initialStudentId);
  }, [initialStudentId]);

  const fetchReports = useCallback(async (id: number) => {
    const { data } = await api.get<ParentReport[]>(`/parent-reports?student_id=${id}`);
    setReports(data);
  }, []);

  useEffect(() => {
    if (selectedId) fetchReports(selectedId);
    else setReports([]);
  }, [selectedId, fetchReports]);

  const sortedStudents = useMemo(() => (
    [...students].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade, 'ja');
      return a.name.localeCompare(b.name, 'ja');
    })
  ), [students]);

  const selected = students.find(s => s.id === selectedId);

  async function handleSave() {
    if (!selectedId || !content.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      await api.post('/parent-reports', { student_id: selectedId, report_date: reportDate, content });
      setContent('');
      setReportDate(today());
      setMsg('保存しました');
      await fetchReports(selectedId);
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('この記録を削除しますか？')) return;
    await api.delete(`/parent-reports/${id}`);
    if (selectedId) fetchReports(selectedId);
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">保護者報告</h2>

      {/* Student selector */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">生徒を選択</label>
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(Number(e.target.value) || null)}
          className="input-field w-full"
        >
          <option value="">-- 生徒を選んでください --</option>
          {sortedStudents.map(s => (
            <option key={s.id} value={s.id}>{s.name}{s.grade ? ` (${s.grade})` : ''}</option>
          ))}
        </select>
      </div>

      {selectedId && (
        <>
          {/* New report form */}
          <div className="card mb-6">
            <h3 className="font-semibold text-gray-700 mb-4">
              {selected?.name} への報告を追加
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">報告日</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="input-field w-auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">報告内容</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="保護者への連絡内容、保護者からの連絡など..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="btn-primary"
              >
                {saving ? '保存中...' : '記録を追加'}
              </button>
              {msg && (
                <span className={`text-sm font-medium ${msg.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
                  {msg}
                </span>
              )}
            </div>
          </div>

          {/* Reports history */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">報告履歴</h3>
              <span className="text-xs text-gray-400">{reports.length}件</span>
            </div>
            {reports.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">まだ報告がありません</p>
            ) : (
              <div className="space-y-3">
                {reports.map(r => (
                  <div key={r.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{r.report_date}</span>
                        <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          {r.teacher_name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                      >
                        削除
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedId && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📞</p>
          <p>上のセレクトまたは左のサイドバーから生徒を選んでください</p>
        </div>
      )}
    </div>
  );
}
