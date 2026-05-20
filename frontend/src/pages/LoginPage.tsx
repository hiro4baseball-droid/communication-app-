import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const loginName = isAdmin ? '管理者' : name;
      await login(loginName, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'ログインに失敗しました');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-gray-800">コミュニケーション管理</h1>
          <p className="text-gray-500 text-sm mt-1">講師・生徒サポートシステム</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isAdmin ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            onClick={() => { setIsAdmin(false); setError(''); }}
          >
            講師ログイン
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isAdmin ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            onClick={() => { setIsAdmin(true); setName('管理者'); setError(''); }}
          >
            管理者ログイン
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="講師名を入力"
                required
              />
            </div>
          )}
          {isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              管理者専用ログインです
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="パスワードを入力"
              required
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
