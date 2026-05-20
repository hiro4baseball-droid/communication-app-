import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import StudentManagement from '../components/admin/StudentManagement';
import TeacherManagement from '../components/admin/TeacherManagement';
import ActivityDashboard from '../components/admin/ActivityDashboard';

type AdminTab = 'students' | 'teachers' | 'activity';

const navItems: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'students', label: '生徒管理', icon: '👤' },
  { key: 'teachers', label: '講師管理', icon: '👨‍🏫' },
  { key: 'activity', label: '活動状況', icon: '📊' },
];

function AdminSidebar({ active, onChange }: { active: AdminTab; onChange: (t: AdminTab) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">管理メニュー</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active === item.key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">管理者専用</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('students');

  return (
    <Layout
      title="管理者ダッシュボード"
      sidebar={<AdminSidebar active={activeTab} onChange={setActiveTab} />}
    >
      <div className="p-4 md:p-6">
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'teachers' && <TeacherManagement />}
        {activeTab === 'activity' && <ActivityDashboard />}
      </div>
    </Layout>
  );
}
