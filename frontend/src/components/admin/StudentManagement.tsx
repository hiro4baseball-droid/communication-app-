import { useState, useEffect } from 'react';
import { Student } from '../../types';
import api from '../../api/client';

interface BulkResult {
  succeeded: number;
  failed: number;
  results: Array<{ name: string; success: boolean; error?: string }>;
}

interface ParsedStudent {
  name: string;
  grade: string;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Bulk state
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<ParsedStudent[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  async function load() {
    const { data } = await api.get<Student[]>('/students');
    setStudents(data);
  }

  useEffect(() => { load(); }, []);

  // Parse bulk text into student list
  function parseBulkText(text: string): ParsedStudent[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Support: "名前,学年" or "名前　学年" (tab/comma separated)
        const parts = line.split(/[,，\t]/).map(p => p.trim());
        return { name: parts[0] || '', grade: parts[1] || '' };
      })
      .filter(s => s.name.length > 0);
  }

  function handleBulkTextChange(text: string) {
    setBulkText(text);
    setBulkPreview(parseBulkText(text));
    setBulkResult(null);
  }

  function openBulkModal() {
    setBulkText('');
    setBulkPreview([]);
    setBulkResult(null);
    setShowBulkModal(true);
  }

  async function handleBulkSave() {
    if (bulkPreview.length === 0) return;
    setBulkSaving(true);
    try {
      const { data } = await api.post<BulkResult>('/students/bulk', { students: bulkPreview });
      setBulkResult(data);
      await load();
      if (data.failed === 0) {
        setTimeout(() => setShowBulkModal(false), 1500);
      }
    } catch (e: any) {
      setBulkResult({ succeeded: 0, failed: bulkPreview.length, results: [] });
    } finally {
      setBulkSaving(false);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ name: '', grade: '' });
    setError('');
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditTarget(s);
    setForm({ name: s.name, grade: s.grade });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('名前を入力してください'); return; }
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        await api.put(`/students/${editTarget.id}`, form);
      } else {
        await api.post('/students', form);
      }
      await load();
      setShowModal(false);
    } catch (e: any) {
      setError(e.response?.data?.error || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？\nこの生徒のコミュニケーション記録もすべて削除されます。`)) return;
    await api.delete(`/students/${id}`);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">生徒管理</h2>
        <div className="flex gap-2">
          <button onClick={openBulkModal} className="btn-secondary flex items-center gap-2">
            📋 一括登録
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            ＋ 生徒を追加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">名前</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">学年・クラス</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">登録日</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">生徒が登録されていません</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.grade || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {new Date(s.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">編集</button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="text-red-500 hover:text-red-700 text-sm font-medium">削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Single add/edit modal */}
      {showModal && (
        <Modal title={editTarget ? '生徒を編集' : '生徒を追加'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="例：田中 太郎" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学年・クラス</label>
              <input type="text" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className="input-field" placeholder="例：中2A" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">キャンセル</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk import modal */}
      {showBulkModal && (
        <Modal title="生徒を一括登録" onClose={() => setShowBulkModal(false)} wide>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <p className="font-semibold mb-1">入力形式</p>
              <ul className="space-y-0.5 text-xs">
                <li>・1行に1人（名前のみ）: <code className="bg-blue-100 px-1 rounded">田中太郎</code></li>
                <li>・名前と学年をカンマ区切り: <code className="bg-blue-100 px-1 rounded">田中太郎,中2A</code></li>
                <li>・ExcelやスプレッドシートからコピペもOK</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生徒リスト
                {bulkPreview.length > 0 && (
                  <span className="ml-2 text-blue-600 font-normal">{bulkPreview.length}名を検出</span>
                )}
              </label>
              <textarea
                value={bulkText}
                onChange={e => handleBulkTextChange(e.target.value)}
                rows={10}
                className="input-field resize-none font-mono text-sm"
                placeholder={`田中太郎\n鈴木花子,中1B\n佐藤一郎,中3A\n...`}
              />
            </div>

            {/* Preview */}
            {bulkPreview.length > 0 && !bulkResult && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">プレビュー</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">名前</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">学年</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bulkPreview.map((s, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-gray-800">{s.name}</td>
                          <td className="px-3 py-1.5 text-gray-500">{s.grade || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div className={`p-3 rounded-lg text-sm ${bulkResult.failed === 0 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                <p className="font-semibold">
                  {bulkResult.failed === 0
                    ? `✅ ${bulkResult.succeeded}名を登録しました`
                    : `${bulkResult.succeeded}名登録完了、${bulkResult.failed}名が失敗`}
                </p>
                {bulkResult.failed > 0 && (
                  <ul className="mt-2 text-xs space-y-1">
                    {bulkResult.results.filter(r => !r.success).map((r, i) => (
                      <li key={i}>・{r.name}：{r.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBulkSave}
                disabled={bulkSaving || bulkPreview.length === 0}
                className="btn-primary flex-1"
              >
                {bulkSaving ? '登録中...' : `${bulkPreview.length}名を一括登録`}
              </button>
              <button onClick={() => setShowBulkModal(false)} className="btn-secondary flex-1">閉じる</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full p-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
