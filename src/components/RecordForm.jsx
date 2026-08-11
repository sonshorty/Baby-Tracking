import { useState } from 'react';
import { addRecord, TYPES } from '../store/useStore';
import SliderInput from './SliderInput';
import TimePicker from './TimePicker';
import './RecordForm.css';

const WHO_TABS = [
  { id: 'mom', label: 'Mẹ', emoji: '👩' },
  { id: 'baby', label: 'Bé', emoji: '👶' },
];

const MOM_TYPES = ['mom_water', 'mom_milk'];
const BABY_TYPES = ['baby_breast', 'baby_bottle', 'baby_diaper'];

function Toast({ msg, onDone }) {
  useState(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  });
  return <div className="toast">{msg}</div>;
}

export default function RecordForm() {
  const [who, setWho] = useState('mom');
  const [type, setType] = useState('mom_water');
  const [ml, setMl] = useState(200);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());

  function switchWho(w) {
    setWho(w);
    setType(w === 'mom' ? 'mom_water' : 'baby_breast');
    setMl(w === 'mom' ? 200 : 100);
  }

  function switchType(t) {
    setType(t);
    if (t === 'baby_diaper') setMl(0);
    else if (t === 'mom_water') setMl(200);
    else if (t === 'mom_milk') setMl(150);
    else setMl(100);
  }

  function save() {
    if (saving) return;
    setSaving(true);
    const info = TYPES[type];
    // Build timestamp from today's date + picked hour/minute
    const ts = new Date();
    ts.setHours(hour, minute, 0, 0);
    addRecord({ type, value: type === 'baby_diaper' ? null : ml, timestamp: ts.toISOString() });
    const label = type === 'baby_diaper'
      ? `✅ Đã ghi thay bỉm`
      : `✅ Đã ghi ${info.label} – ${ml} ml`;
    setToast(label);
    setSaving(false);
  }

  const typeList = who === 'mom' ? MOM_TYPES : BABY_TYPES;
  const isDiaper = type === 'baby_diaper';

  return (
    <div className="record-form">
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* Who tabs */}
      <div className="who-tabs">
        {WHO_TABS.map(w => (
          <button
            key={w.id}
            className={`who-tab${who === w.id ? ' active' : ''}`}
            onClick={() => switchWho(w.id)}
          >
            <span>{w.emoji}</span>
            <span>{w.label}</span>
          </button>
        ))}
      </div>

      {/* Type selector */}
      <div className="type-pills">
        {typeList.map(t => {
          const info = TYPES[t];
          return (
            <button
              key={t}
              className={`type-pill${type === t ? ' active' : ''}`}
              style={type === t ? { background: info.color, borderColor: info.color } : {}}
              onClick={() => switchType(t)}
            >
              <span>{info.emoji}</span>
              <span>{info.label.replace(/ \(mẹ\)/, '')}</span>
            </button>
          );
        })}
      </div>

      {/* Slider or diaper */}
      <div className="form-card">
        {isDiaper ? (
          <div className="diaper-section">
            <div className="diaper-icon">🩲</div>
            <p className="diaper-hint">Nhấn <strong>Lưu</strong> để ghi nhận thời điểm thay bỉm</p>
          </div>
        ) : (
          <SliderInput type={type} value={ml} onChange={setMl} />
        )}
      </div>

      {/* Time picker */}
      <TimePicker
        hour={hour} minute={minute}
        onHourChange={setHour} onMinuteChange={setMinute}
      />

      <button className="save-btn" onClick={save}>
        Lưu lại
      </button>
    </div>
  );
}
