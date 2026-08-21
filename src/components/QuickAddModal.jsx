import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addRecord, DIAPER_OPTIONS, DIAPER_TYPES, TYPES } from '../store/useStore';
import SliderInput from './SliderInput';
import TimePicker from './TimePicker';
import './QuickAddModal.css';

const WHO_TABS = [
  { id: 'mom',  label: 'Mẹ', emoji: '👩', types: ['mom_water', 'mom_milk'] },
  { id: 'baby', label: 'Bé', emoji: '👶', types: ['baby_breast', 'baby_bottle', 'baby_diaper'] },
];

const DEFAULTS = {
  mom_water: 200, mom_milk: 150,
  baby_breast: 100, baby_bottle: 100,
  baby_diaper: 0, baby_diaper_wet: 0, baby_diaper_dirty: 0,
};

export default function QuickAddModal({ date, initHour, initMinute, onClose }) {
  const overlayRef = useRef(null);
  const [who, setWho]   = useState('baby');
  const [type, setType] = useState('baby_breast');
  const [ml, setMl]     = useState(100);
  const [hour, setHour] = useState(initHour);
  const [min, setMin]   = useState(initMinute);

  // iOS Chrome and installed PWAs can keep `100vh` behind their bottom UI.
  // Size the overlay to the actually visible viewport so the CTA stays reachable.
  useEffect(() => {
    const viewport = window.visualViewport;
    const overlay = overlayRef.current;
    if (!overlay) return undefined;

    const syncViewport = () => {
      overlay.style.setProperty('--qam-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      overlay.style.setProperty('--qam-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
    };

    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);

    return () => {
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  function switchWho(w) {
    setWho(w);
    const t = WHO_TABS.find(x => x.id === w).types[0];
    setType(t);
    setMl(DEFAULTS[t]);
  }

  function switchType(t) {
    setType(t);
    setMl(DEFAULTS[t]);
  }

  function save() {
    if (type === 'baby_diaper') return;
    const ts = new Date(date);
    ts.setHours(hour, min, 0, 0);
    addRecord({ type, value: DIAPER_TYPES.includes(type) ? null : ml, timestamp: ts.toISOString() });
    onClose();
  }

  const typeList = WHO_TABS.find(x => x.id === who).types;
  const isDiaper = DIAPER_TYPES.includes(type);

  return createPortal(
    <div
      ref={overlayRef}
      className="qam-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="qam-sheet">
        <div className="qam-content">
          <div className="qam-handle" />

          <div className="qam-header">
            <span className="qam-title">Thêm ghi chú</span>
            <button className="qam-close" onClick={onClose} aria-label="Đóng">×</button>
          </div>

          {/* Who tabs */}
          <div className="qam-who-tabs">
            {WHO_TABS.map(w => (
              <button key={w.id} className={`qam-who-tab${who === w.id ? ' active' : ''}`} onClick={() => switchWho(w.id)}>
                <span>{w.emoji}</span><span>{w.label}</span>
              </button>
            ))}
          </div>

          {/* Type pills */}
          <div className="qam-type-pills">
            {typeList.map(t => {
              const info = TYPES[t];
              const isActive = t === 'baby_diaper' ? isDiaper : type === t;
              return (
                <button
                  key={t}
                  className={`qam-type-pill${isActive ? ' active' : ''}`}
                  style={isActive ? { background: info.color, borderColor: info.color } : {}}
                  onClick={() => switchType(t)}
                >
                  <span>{info.emoji}</span>
                  <span>{info.label.replace(/ \(mẹ\)/, '')}</span>
                </button>
              );
            })}
          </div>

          {/* Slider */}
          {!isDiaper && (
            <div className="qam-slider">
              <SliderInput type={type} value={ml} onChange={setMl} />
            </div>
          )}
          {isDiaper && (
            <div className="qam-diaper-group">
              <p className="qam-diaper-title">Tình trạng bỉm</p>
              <div className="qam-diaper-options" role="group" aria-label="Chọn tình trạng bỉm">
                {DIAPER_OPTIONS.map(option => {
                  const info = TYPES[option];
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`qam-diaper-option${type === option ? ' active' : ''}`}
                      style={type === option ? { '--diaper-option-color': info.color } : {}}
                      onClick={() => switchType(option)}
                      aria-pressed={type === option}
                    >
                      <span>{info.emoji}</span>
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="qam-diaper-hint">
                {type === 'baby_diaper' ? 'Chọn tình trạng bỉm trước khi lưu' : `Đã chọn ${TYPES[type].label.toLowerCase()}`}
              </p>
            </div>
          )}

          {/* Use the same iOS-style scroll picker as the Record screen */}
          <TimePicker
            hour={hour}
            minute={min}
            onHourChange={setHour}
            onMinuteChange={setMin}
          />
        </div>

        <div className="qam-footer">
          <button className="qam-save-btn" onClick={save} disabled={type === 'baby_diaper'}>Lưu lại</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
