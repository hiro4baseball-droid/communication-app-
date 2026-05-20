import { useState, useEffect, useCallback } from 'react';
import { Student, StudentRecord } from '../../types';
import api from '../../api/client';

interface Props {
  students: Student[];
  initialStudentId?: number;
}

export default function StudentRecordView({ students, initialStudentId }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(initialStudentId ?? null);
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ likes: '', efforts: '', talk_history: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchRecord = useCallback(async (id: number) => {
    const { data } = await api.get<StudentRecord>(`/students/${id}/record`);
    setRecord(data);
    setForm({ likes: data.likes || '', efforts: data.efforts || '', talk_history: data.talk_history || '' });
    setEditing(false);
    setMsg('');
  }, []);

  useEffect(() => {
    if (selectedId) fetchRecord(selectedId);
  }, [selectedId, fetchRecord]);

  useEffect(() => {
    if (initialStudentId) setSelectedId(initialStudentId);
  }, [initialStudentId]);

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.put(`/students/${selectedId}/record`, form);
      setMsg('保存しました');
      await fetchRecord(selectedId);
      setEditing(false);
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  const selected = students.find(s => s.id === selectedId);

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">生徒カルテ</h2>

      {/* Student selector */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">生徒を選択</label>
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(Number(e.target.value) || null)}
          className="input-field w-full"
        >
          <option value="">-- 生徒を選んでください --</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}{s.grade ? ` (${s.grade})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Record content */}
      {selectedId && record && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{selected?.name}</h3>
              {selected?.grade && <p className="text-sm text-gray-500">{selected.grade}</p>}
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                編集
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button onClick={() => { setEditing(false); setForm({ likes: record.likes, efforts: record.efforts, talk_history: record.talk_history }); }} className="btn-secondary text-sm">
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {msg}
            </div>
          )}

          <div className="space-y-5">
            <RecordField
              label="⭐ 好きなもの・得意なこと"
              value={form.likes}
              editing={editing}
              onChange={v => setForm(f => ({ ...f, likes: v }))}
              placeholder="趣味、好きな教科、特技など..."
            />
            <RecordField
              label="💪 頑張っていること"
              value={form.efforts}
              editing={editing}
              onChange={v => setForm(f => ({ ...f, efforts: v }))}
              placeholder="最近取り組んでいること、目標など..."
            />
            <RecordField
              label="💬 話した内容メモ"
              value={form.talk_history}
              editing={editing}
              onChange={v => setForm(f => ({ ...f, talk_history: v }))}
              placeholder="会話の内容、気になったことなど..."
              rows={5}
            />
          </div>

          {record.updated_by_name && (
            <p className="mt-4 text-xs text-gray-400 text-right">
              最終更新: {record.updated_by_name} ({new Date(record.updated_at).toLocaleString('ja-JP')})
            </p>
          )}
        </div>
      )}

      {!selectedId && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p>左のサイドバーまたは上のセレクトから生徒を選んでください</p>
        </div>
      )}
    </div>
  );
}

function RecordField({
  label, value, editing, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; editing: boolean;
  onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">{label}</label>
      {editing ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="input-field resize-none"
        />
      ) : (
        <div className={`min-h-[4rem] p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap ${!value ? 'text-gray-400 italic' : ''}`}>
          {value || placeholder}
        </div>
      )}
    </div>
  );
}
