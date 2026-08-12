import ScrollPicker from './ScrollPicker';
import './TimePicker.css';

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const pad = number => String(number).padStart(2, '0');

export default function TimePicker({ hour, minute, onHourChange, onMinuteChange }) {
  return (
    <section className="time-picker" aria-labelledby="time-picker-title">
      <h2 className="time-picker-label" id="time-picker-title">Thời gian</h2>

      <div className="time-picker-headings" aria-hidden="true">
        <span>Giờ</span>
        <span>Phút</span>
      </div>

      <div className="time-picker-body">
        <div className="time-picker-selection" aria-hidden="true" />
        <ScrollPicker
          items={HOURS}
          value={hour}
          onChange={onHourChange}
          formatLabel={pad}
          label="Giờ"
        />
        <span className="time-picker-sep" aria-hidden="true">:</span>
        <ScrollPicker
          items={MINUTES}
          value={minute}
          onChange={onMinuteChange}
          formatLabel={pad}
          label="Phút"
        />
      </div>
    </section>
  );
}
