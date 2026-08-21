import { useState } from 'react';
import { addRecord, DIAPER_OPTIONS, TYPES } from '../store/useStore';
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
  const [diaperStatus, setDiaperStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());

  function switchWho(w) {
    setWho(w);
    setType(w === 'mom' ? 'mom_water' : 'baby_breast');
    setDiaperStatus(null);
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
    if (saving || (type === 'baby_diaper' && !diaperStatus)) return;
    setSaving(true);
    const info = TYPES[type];
    // Build timestamp from today's date + picked hour/minute
    const ts = new Date();
    ts.setHours(hour, minute, 0, 0);
    addRecord({
      type,
      value: type === 'baby_diaper' ? null : ml,
      diaperStatus: type === 'baby_diaper' ? diaperStatus : undefined,
      timestamp: ts.toISOString(),
    });
    const diaperOption = DIAPER_OPTIONS.find(option => option.id === diaperStatus);
    const label = type === 'baby_diaper'
      ? `✅ Đã ghi ${diaperOption.label.toLowerCase()}`
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
          const isActive = type === t;
          return (
            <button
              key={t}
              className={`type-pill${isActive ? ' active' : ''}`}
              style={isActive ? { background: info.color, borderColor: info.color } : {}}
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
            <p className="diaper-title">Tình trạng bỉm</p>
            <div className="diaper-options" role="group" aria-label="Chọn tình trạng bỉm">
              {DIAPER_OPTIONS.map(option => {
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`diaper-option${diaperStatus === option.id ? ' active' : ''}`}
                    style={diaperStatus === option.id ? { '--diaper-option-color': option.color } : {}}
                    onClick={() => setDiaperStatus(option.id)}
                    aria-pressed={diaperStatus === option.id}
                  >
                    <span className="diaper-option-icon">{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="diaper-hint">
              {!diaperStatus
                ? 'Chọn tình trạng bỉm trước khi lưu'
                : `Đã chọn ${DIAPER_OPTIONS.find(option => option.id === diaperStatus).label.toLowerCase()}`}
            </p>
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

      <button className="save-btn" onClick={save} disabled={isDiaper && !diaperStatus}>
        Lưu lại
      </button>
    </div>
  );
}
