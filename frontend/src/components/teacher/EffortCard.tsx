import { useState, useRef } from 'react';
import { Student } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  students: Student[];
  initialStudentId?: number;
}

export default function EffortCard({ students, initialStudentId }: Props) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(initialStudentId ?? null);
  const [message, setMessage] = useState('');
  const [dateStr] = useState(() => new Date().toLocaleDateString('ja-JP'));
  const cardRef = useRef<HTMLDivElement>(null);

  const selected = students.find(s => s.id === selectedId);

  function handlePrint() {
    const printArea = document.getElementById('print-area');
    if (!printArea || !cardRef.current) return;
    printArea.innerHTML = cardRef.current.outerHTML;
    window.print();
    setTimeout(() => { printArea.innerHTML = ''; }, 1000);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">頑張ったカード</h2>

      <div className="card mb-6 space-y-4">
        <div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">頑張った内容</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="例：今日は計算問題を最後まであきらめずに解きました！"
            className="input-field resize-none"
          />
        </div>
      </div>

      {/* Card preview */}
      {selected && message && (
        <>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">プレビュー</h3>
          <div ref={cardRef} style={{ fontFamily: "'Yu Gothic', 'Hiragino Sans', sans-serif" }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '32px',
              color: 'white',
              maxWidth: '480px',
              boxShadow: '0 10px 30px rgba(102,126,234,0.4)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>⭐ よくがんばりました ⭐</div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '4px 16px',
                  display: 'inline-block',
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                }}>
                  がんばりカード
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '12px',
                  padding: '8px 24px',
                  display: 'inline-block',
                }}>
                  {selected.name} さん
                </span>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                fontSize: '16px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                minHeight: '80px',
              }}>
                {message}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: 0.85 }}>
                <span>📅 {dateStr}</span>
                <span>👤 {user?.name}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              印刷・PDF保存
            </button>
          </div>
        </>
      )}

      {(!selected || !message) && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🌟</p>
          <p>生徒を選んで内容を入力すると<br />カードのプレビューが表示されます</p>
        </div>
      )}
    </div>
  );
}
