import './SliderInput.css';

const PRESETS = {
  mom_water:   [100, 200, 300, 500],
  mom_milk:    [100, 150, 200, 250],
  baby_breast: [50, 80, 100, 120],
  baby_bottle: [50, 80, 100, 120],
};

const MAX = {
  mom_water:   1000,
  mom_milk:    500,
  baby_breast: 300,
  baby_bottle: 300,
};

const STEP = {
  mom_water:   10,
  mom_milk:    10,
  baby_breast: 5,
  baby_bottle: 5,
};

export default function SliderInput({ type, value, onChange }) {
  const max = MAX[type] ?? 500;
  const step = STEP[type] ?? 10;
  const presets = PRESETS[type] ?? [];
  const pct = Math.round((value / max) * 100);

  return (
    <div className="slider-wrap">
      <div className="slider-value-row">
        <span className="slider-value">{value}</span>
        <span className="slider-unit">ml</span>
      </div>

      <div className="slider-track-wrap">
        <div
          className="slider-fill"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="slider-input"
        />
      </div>

      <div className="slider-range-labels">
        <span>0</span>
        <span>{max / 2}</span>
        <span>{max}</span>
      </div>

      <div className="slider-presets">
        {presets.map(p => (
          <button
            key={p}
            className={`preset-btn${value === p ? ' active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
