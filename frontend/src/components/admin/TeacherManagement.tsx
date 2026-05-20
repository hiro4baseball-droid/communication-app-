import { useState, useEffect } from 'react';
import { TeacherActivity } from '../../types';
import api from '../../api/client';

interface Teacher {
  id: number;
  name: string;
  created_at: string;
  last_login: string | null;
}

interface ActivityDetail {
  loginHistory: Array<{ login_at: string }>;
  recentShifts: Array<{ shift_date: string; student_count: number; students: string }>;
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [summary, setSummary] = useState<TeacherActivity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [form, setForm] = useState({ name: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [tRes, sRes] = await Promise.all([
      api.get<Teacher[]>('/admin/teachers'),
      api.get<TeacherActivity[]>('/admin/activity-summary'),
    ]);
    setTeachers(tRes.data);
    setSummary(sRes.data);
  }

  useEffect(() => { load(); }, []);

  async function openDetail(t: Teacher) {
    setDetailTeacher(t);
    const { data } = await api.get<ActivityDetail>(`/admin/teachers/${t.id}/activity`);
    setDetail(data);
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.password.trim()) { setError('名前とパスワードは必須です'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/admin/teachers', form);
      await load();
      setShowAddModal(false);
      setForm({ name: '', password: '' });
    } catch (e: any) {
      setError(e.response?.data?.error || '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await api.delete(`/admin/teachers/${id}`);
    await load();
  }

  const getSummary = (id: number) => summary.find(s => s.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">講師管理</h2>
        <button onClick={() => { setShowAddModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
          <span>＋</span> 講師を追加
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">名前</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">最終ログイン</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">記録数</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">最終シフト</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">講師が登録されていません</td></tr>
            ) : teachers.map(t => {
              const s = getSummary(t.id);
              return (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">
                    {s?.last_login ? new Date(s.last_login).toLocaleString('ja-JP') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {s?.total_comms ?? 0}件
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{s?.last_shift || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openDetail(t)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">詳細</button>
                      <button onClick={() => handleDelete(t.id, t.name)} className="text-red-500 hover:text-red-700 text-sm font-medium">削除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <Modal title="講師を追加" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="例：鈴木 花子" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="ログインパスワード" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? '作成中...' : '作成'}</button>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">キャンセル</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {detailTeacher && detail && (
        <Modal title={`${detailTeacher.name} の活動詳細`} onClose={() => { setDetailTeacher(null); setDetail(null); }}>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">最近のシフト記録</h4>
              {detail.recentShifts.length === 0 ? (
                <p className="text-gray-400 text-sm">記録なし</p>
              ) : (
                <div className="space-y-2">
                  {detail.recentShifts.map(shift => (
                    <div key={shift.shift_date} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{shift.shift_date}</span>
                        <span className="text-xs text-blue-600">{shift.student_count}名</span>
                      </div>
                      <p className="text-xs text-gray-500">{shift.students}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">ログイン履歴</h4>
              {detail.loginHistory.length === 0 ? (
                <p className="text-gray-400 text-sm">履歴なし</p>
              ) : (
                <ul className="space-y-1">
                  {detail.loginHistory.map((h, i) => (
                    <li key={i} className="text-xs text-gray-500">{new Date(h.login_at).toLocaleString('ja-JP')}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
