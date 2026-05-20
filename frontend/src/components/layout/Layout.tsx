import { ReactNode, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  title?: string;
}

export default function Layout({ children, sidebar, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center h-14 px-4 gap-3">
          {sidebar && (
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <span className="text-lg font-bold text-blue-600">📚</span>
          <h1 className="text-base font-semibold text-gray-800 hidden sm:block">
            {title || 'コミュニケーション管理'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-600">
              <span className="hidden sm:inline">{user?.role === 'admin' ? '🔑 ' : '👤 '}</span>
              {user?.name}
            </span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        {sidebar && (
          <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 overflow-hidden flex-shrink-0">
            {sidebar}
          </aside>
        )}

        {/* Sidebar - mobile overlay */}
        {sidebar && sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-white h-full shadow-xl overflow-hidden">
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
