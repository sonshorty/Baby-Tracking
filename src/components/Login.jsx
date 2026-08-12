import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

function messageFor(error) {
  if (error?.code === 'auth/invalid-credential') return 'Email hoặc mật khẩu không đúng.';
  if (error?.code === 'auth/invalid-email') return 'Email không hợp lệ.';
  if (error?.code === 'auth/too-many-requests') return 'Thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.';
  return 'Không thể đăng nhập. Vui lòng thử lại.';
}

export default function Login() {
  const { signIn, tryDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDemo() {
    setBusy(true);
    setError('');
    try {
      await tryDemo();
    } catch {
      setError('Không thể mở chế độ demo. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">🍼</div>
        <h1>Nhật ký bé yêu</h1>
        <p className="login-subtitle">Đăng nhập để xem và cập nhật nhật ký gia đình.</p>

        <form onSubmit={handleLogin} className="login-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-primary" disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="login-divider"><span>hoặc</span></div>
        <button type="button" className="login-demo" onClick={handleDemo} disabled={busy}>
          👀 Trải nghiệm Demo
        </button>
        <p className="demo-note">Dữ liệu demo được tách riêng và không ảnh hưởng dữ liệu gia đình.</p>
      </div>
    </div>
  );
}
