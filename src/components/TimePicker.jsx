import './TimePicker.css';

const pad = n => String(n).padStart(2, '0');

function SpinColumn({ value, min, max, onChange, label }) {
  const dec = () => onChange(value <= min ? max : value - 1);
  const inc = () => onChange(value >= max ? min : value + 1);

  return (
    <div className="spin-col">
      <button className="spin-btn" onClick={inc} aria-label={`Tăng ${label}`}>▲</button>
      <span className="spin-value">{pad(value)}</span>
      <button className="spin-btn" onClick={dec} aria-label={`Giảm ${label}`}>▼</button>
    </div>
  );
}

export default function TimePicker({ hour, minute, onHourChange, onMinuteChange }) {
  return (
    <div className="time-picker">
      <p className="time-picker-label">⏰ Thời gian</p>
      <div className="time-picker-body">
        <SpinColumn value={hour}   min={0} max={23} onChange={onHourChange}   label="giờ" />
        <span className="time-picker-sep">:</span>
        <SpinColumn value={minute} min={0} max={59} onChange={onMinuteChange} label="phút" />
      </div>
    </div>
  );
}
