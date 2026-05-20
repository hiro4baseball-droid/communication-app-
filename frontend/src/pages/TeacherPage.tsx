import { useState, useEffect } from 'react';
import { Student } from '../types';
import api from '../api/client';
import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import CommunicationLog from '../components/teacher/CommunicationLog';
import StudentRecordView from '../components/teacher/StudentRecord';
import EffortCard from '../components/teacher/EffortCard';

type Tab = 'communication' | 'record' | 'effort';

export default function TeacherPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('communication');
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();

  useEffect(() => {
    api.get<Student[]>('/students').then(r => setStudents(r.data));
  }, []);

  function handleStudentSelect(student: Student) {
    setSelectedStudentId(student.id);
    setActiveTab('record');
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'communication', label: 'コミュニケーション記録', icon: '💬' },
    { key: 'record', label: '生徒カルテ', icon: '📋' },
    { key: 'effort', label: '頑張ったカード', icon: '🌟' },
  ];

  return (
    <Layout
      sidebar={
        <Sidebar
          students={students}
          onSelectStudent={handleStudentSelect}
          selectedStudentId={selectedStudentId}
        />
      }
    >
      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'communication' && <CommunicationLog students={students} />}
      {activeTab === 'record' && (
        <StudentRecordView students={students} initialStudentId={selectedStudentId} />
      )}
      {activeTab === 'effort' && (
        <EffortCard students={students} initialStudentId={selectedStudentId} />
      )}
    </Layout>
  );
}
