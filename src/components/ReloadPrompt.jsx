import { useRegisterSW } from 'virtual:pwa-register/react';
import './ReloadPrompt.css';

export default function ReloadPrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="reload-banner">
      <span>🆕 Có phiên bản mới!</span>
      <button className="reload-btn" onClick={() => updateServiceWorker(true)}>
        Cập nhật ngay
      </button>
    </div>
  );
}
