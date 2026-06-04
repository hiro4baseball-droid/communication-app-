import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, StudentRecord, CommunicationLog } from '../../types';
import api from '../../api/client';

export default function AdminStudentRecord() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Student[]>('/students').then(r => setStudents(r.data));
  }, []);

  const fetchStudentData = useCallback(async (id: number) => {
    const [recordRes, logsRes] = await Promise.all([
      api.get<StudentRecord>(`/students/${id}/record`),
      api.get<CommunicationLog[]>(`/communications?student_id=${id}`),
    ]);
    setRecord(recordRes.data);
    setLogs(logsRes.data);
  }, []);

  useEffect(() => {
    if (selectedId) fetchStudentData(selectedId);
    else { setRecord(null); setLogs([]); }
  }, [selectedId, fetchStudentData]);

  const studentsByGrade = useMemo(() => {
    const filtered = students.filter(s => s.name.includes(search) || s.grade.includes(search));
    const sorted = [...filtered].sort((a, b) => {
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
  }, [students, search]);

  // Logs grouped by date (newest first)
  const logsByDate = useMemo(() => {
    const map: Record<string, CommunicationLog[]> = {};
    for (const log of logs) {
      if (!map[log.shift_date]) map[log.shift_date] = [];
      map[log.shift_date].push(log);
    }
    return map;
  }, [logs]);

  const selected = students.find(s => s.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6">
      {/* Student list panel */}
      <div className="w-56 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white overflow-hidden">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">生徒一覧</h3>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="検索..."
            className="input-field text-sm py-1.5"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {Object.entries(studentsByGrade).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([grade, studs]) => (
            <div key={grade} className="mb-3">
              <p className="text-xs font-semibold text-gray-400 px-2 mb-1">{grade}</p>
              <ul className="space-y-0.5">
                {studs.map(s => (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedId === s.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-5xl mb-3">👤</p>
            <p>左のリストから生徒を選んでください</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold text-gray-800">{selected?.name}</h2>
              {selected?.grade && <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{selected.grade}</span>}
            </div>

            {/* カルテ */}
            {record && (
              <div className="card">
                <h3 className="font-semibold text-gray-700 mb-4">生徒カルテ</h3>
                <div className="space-y-4">
                  <RecordSection label="⭐ 好きなもの・得意なこと" value={record.likes} empty="未入力" />
                  <RecordSection label="💪 頑張っていること" value={record.efforts} empty="未入力" />
                  <RecordSection label="💬 話した内容メモ" value={record.talk_history} empty="未入力" />
                </div>
                {record.updated_by_name && (
                  <p className="mt-4 text-xs text-gray-400 text-right">
                    最終更新: {record.updated_by_name}（{new Date(record.updated_at).toLocaleString('ja-JP')}）
                  </p>
                )}
              </div>
            )}

            {/* Communication logs with teacher notes */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">講師メモ履歴</h3>
                <span className="text-xs text-gray-400">{logs.length}件</span>
              </div>
              {Object.keys(logsByDate).length === 0 ? (
                <p className="text-gray-400 text-sm">記録がありません</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(logsByDate)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([date, entries]) => (
                      <div key={date}>
                        <p className="text-xs font-semibold text-gray-400 mb-2 border-b border-gray-100 pb-1">{date}</p>
                        <div className="space-y-2">
                          {entries.map(log => (
                            <div key={log.id} className="flex items-start gap-2">
                              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                                {log.teacher_name}
                              </span>
                              {log.note ? (
                                <span className="text-sm text-gray-700">{log.note}</span>
                              ) : (
                                <span className="text-xs text-gray-300 italic mt-0.5">メモなし</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordSection({ label, value, empty }: { label: string; value: string; empty: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-1.5">{label}</p>
      <div className={`p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}>
        {value || empty}
      </div>
    </div>
  );
}
