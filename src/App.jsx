import { useState } from 'react';
import { useSyncStatus } from './store/useStore';
import { useAuth } from './auth/AuthContext';
import Timeline from './components/Timeline';
import RecordForm from './components/RecordForm';
import Dashboard from './components/Dashboard';
import ReloadPrompt from './components/ReloadPrompt';
import Login from './components/Login';
import './App.css';

const DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const MONTHS = ['tháng 1','tháng 2','tháng 3','tháng 4','tháng 5','tháng 6','tháng 7','tháng 8','tháng 9','tháng 10','tháng 11','tháng 12'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function App() {
  const { user, loading, isDemo, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('record');
  const syncStatus = useSyncStatus();

  if (loading) return <div className="auth-loading">🍼 Đang mở nhật ký…</div>;
  if (!user) return <Login />;

  const syncDot = { connecting: '🟡', ok: '🟢', error: '🔴' }[syncStatus];

  return (
    <div className="app">
      <ReloadPrompt />
      <header className="app-header">
        <div className="header-actions">
          {isDemo && <span className="demo-badge">DEMO</span>}
          <button className="logout-button" onClick={signOut} aria-label="Đăng xuất">Đăng xuất</button>
        </div>
        <h1>🍼 Nhật ký bé yêu <span title={syncStatus}>{syncDot}</span></h1>
        <p className="date">{formatDate(new Date())}</p>
      </header>

      {isDemo && <div className="demo-banner">Bạn đang dùng dữ liệu demo riêng biệt.</div>}

      <main className="app-content">
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'record' && <RecordForm />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>

      <nav className="bottom-nav">
        <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}>
          <span>📋</span>
          <span>Timeline</span>
        </button>
        <button className={activeTab === 'record' ? 'active' : ''} onClick={() => setActiveTab('record')}>
          <span>✏️</span>
          <span>Ghi chép</span>
        </button>
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
          <span>📊</span>
          <span>Tổng hợp</span>
        </button>
      </nav>
    </div>
  );
}
