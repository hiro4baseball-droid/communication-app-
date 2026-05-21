import { useState, useMemo } from 'react';
import { Student } from '../../types';

interface SidebarProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  selectedStudentId?: number;
  title?: string;
}

export default function Sidebar({ students, onSelectStudent, selectedStudentId, title = '生徒名簿' }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  const grades = useMemo(() => {
    const set = new Set(students.map(s => s.grade).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [students]);

  const filtered = useMemo(() => {
    return students
      .filter(s => {
        const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
        const matchSearch = s.name.includes(search) || s.grade.includes(search);
        return matchGrade && matchSearch;
      })
      .sort((a, b) => {
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade, 'ja');
        return a.name.localeCompare(b.name, 'ja');
      });
  }, [students, search, selectedGrade]);

  // Group by grade for display
  const grouped = useMemo(() => {
    if (selectedGrade !== 'all') return null;
    const map: Record<string, Student[]> = {};
    for (const s of filtered) {
      const key = s.grade || '学年未設定';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [filtered, selectedGrade]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 space-y-2">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="検索..."
          className="input-field text-sm py-1.5"
        />
        {/* Grade filter */}
        {grades.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {grades.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  selectedGrade === g
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {g === 'all' ? '全員' : g}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">生徒が見つかりません</p>
        ) : grouped ? (
          // グループ表示
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([grade, studs]) => (
            <div key={grade} className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">{grade}</p>
              <ul className="space-y-0.5">
                {studs.map(student => (
                  <StudentItem key={student.id} student={student} selected={selectedStudentId === student.id} onClick={() => onSelectStudent(student)} />
                ))}
              </ul>
            </div>
          ))
        ) : (
          // フィルター時は一覧表示
          <ul className="space-y-0.5">
            {filtered.map(student => (
              <StudentItem key={student.id} student={student} selected={selectedStudentId === student.id} onClick={() => onSelectStudent(student)} />
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-400 text-center">
        {filtered.length}名 / 全{students.length}名
      </div>
    </div>
  );
}

function StudentItem({ student, selected, onClick }: { student: Student; selected: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
          selected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <span className="font-medium">{student.name}</span>
        {student.grade && (
          <span className="ml-2 text-xs text-gray-400">{student.grade}</span>
        )}
      </button>
    </li>
  );
}
