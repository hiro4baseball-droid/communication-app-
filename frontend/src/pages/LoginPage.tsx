import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

type Mode = 'teacher' | 'admin' | 'register';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('teacher');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('パスワードが一致しません');
        return;
      }
      setRegistering(true);
      try {
        const { data } = await api.post('/auth/register', { name, password, invite_code: inviteCode });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/teacher';
      } catch (err: any) {
        setError(err.response?.data?.error || '登録に失敗しました');
      } finally {
        setRegistering(false);
      }
      return;
    }

    try {
      const loginName = mode === 'admin' ? '管理者' : name;
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

        {/* Tab switcher */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'teacher' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            onClick={() => switchMode('teacher')}
          >
            講師ログイン
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
            onClick={() => switchMode('register')}
          >
            新規登録
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'admin' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            onClick={() => switchMode('admin')}
          >
            管理者
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'admin' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              管理者専用ログインです
            </div>
          )}

          {(mode === 'teacher' || mode === 'register') && (
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

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="もう一度入力"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">招待コード</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  className="input-field"
                  placeholder="管理者から受け取ったコード"
                  required
                />
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                招待コードは管理者に問い合わせてください
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 font-medium rounded-lg text-white transition-colors disabled:opacity-50 ${
              mode === 'register'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading || registering}
          >
            {mode === 'register'
              ? (registering ? '登録中...' : 'アカウントを作成')
              : (isLoading ? 'ログイン中...' : 'ログイン')}
          </button>
        </form>
      </div>
    </div>
  );
}
