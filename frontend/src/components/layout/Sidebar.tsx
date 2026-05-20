import { useState } from 'react';
import { Student } from '../../types';

interface SidebarProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  selectedStudentId?: number;
  title?: string;
}

export default function Sidebar({ students, onSelectStudent, selectedStudentId, title = '生徒名簿' }: SidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = students.filter(s =>
    s.name.includes(search) || s.grade.includes(search)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">{title}</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="検索..."
          className="input-field text-sm py-1.5"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">生徒が見つかりません</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map(student => (
              <li key={student.id}>
                <button
                  onClick={() => onSelectStudent(student)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedStudentId === student.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{student.name}</span>
                  {student.grade && (
                    <span className="ml-2 text-xs text-gray-400">{student.grade}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 border-t border-gray-200 text-xs text-gray-400 text-center">
        {filtered.length}名
      </div>
    </div>
  );
}
