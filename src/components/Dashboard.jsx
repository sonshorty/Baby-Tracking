import { useRef, useState } from 'react';
import { useRecords, getTodayRecords, DIAPER_TYPES, exportData, importData } from '../store/useStore';
import './Dashboard.css';

function sum(records, ...types) {
  return records
    .filter(r => types.includes(r.type) && r.value != null)
    .reduce((acc, r) => acc + r.value, 0);
}

function count(records, ...types) {
  return records.filter(r => types.includes(r.type)).length;
}

function StatCard({ emoji, label, value, unit, color }) {
  return (
    <div className="stat-card" style={{ '--card-color': color }}>
      <span className="stat-emoji">{emoji}</span>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {value} {unit && <span className="stat-unit">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

// Simple SVG horizontal bar
function HBar({ items, max }) {
  if (max === 0) max = 1;
  return (
    <div className="hbar-list">
      {items.map(item => (
        <div key={item.key} className="hbar-row">
          <span className="hbar-emoji">{item.emoji}</span>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{ width: `${Math.min((item.value / max) * 100, 100)}%`, background: item.color }}
            />
          </div>
          <span className="hbar-val">{item.value} ml</span>
        </div>
      ))}
    </div>
  );
}

// 7-day vertical bar chart as SVG
function WeekChart({ days }) {
  const W = 40, GAP = 6, H = 90, PAD = 24;
  const svgW = days.length * (W + GAP) - GAP + PAD * 2;
  const maxVal = Math.max(...days.map(d => d.total), 1);

  const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <svg viewBox={`0 0 ${svgW} ${H + 56}`} className="week-svg">
      {days.map((d, i) => {
        const x = PAD + i * (W + GAP);
        const bh = Math.round((d.total / maxVal) * H);
        const y = H - bh;
        const isToday = new Date().toDateString() === d.date.toDateString();
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={W} height={bh || 2}
              rx={6}
              fill={isToday ? '#ec4899' : '#f9a8d4'}
            />
            <text x={x + W / 2} y={H + 16} textAnchor="middle" fontSize={11} fill="#9ca3af" fontWeight="600">
              {DAY_SHORT[d.date.getDay()]}
            </text>
            <text x={x + W / 2} y={H + 31} textAnchor="middle" fontSize={9} fill="#d1d5db">
              {d.date.getDate()}
            </text>
            <text x={x + W / 2} y={H + 46} textAnchor="middle" fontSize={10} fill="#6b7280" fontWeight="600">
              {d.total > 0 ? d.total : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const records = useRecords();
  const fileInputRef = useRef(null);
  const [importMsg, setImportMsg] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = getTodayRecords(records);

  function getWeekRecords(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const ds = d.toDateString();
      days.push({
        date: d,
        records: records.filter(r => new Date(r.timestamp).toDateString() === ds)
      });
    }
    return days;
  }

  const selectedWeek = getWeekRecords(weekStartDate);

  // Today stats
  const momWater = sum(today, 'mom_water');
  const momMilk = sum(today, 'mom_milk');
  const babyBreast = sum(today, 'baby_breast');
  const babyBottle = sum(today, 'baby_bottle');
  const diaperCount = count(today, ...DIAPER_TYPES);

  const momMax = Math.max(momWater + momMilk, 1);
  const babyMax = Math.max(babyBreast + babyBottle, 1);

  function goToPrevWeek() {
    const prev = new Date(weekStartDate);
    prev.setDate(prev.getDate() - 7);
    setWeekStartDate(prev);
  }

  function goToNextWeek() {
    const next = new Date(weekStartDate);
    next.setDate(next.getDate() + 7);
    const now = new Date();
    now.setDate(now.getDate() - now.getDay());
    now.setHours(0, 0, 0, 0);
    if (next <= now) setWeekStartDate(next);
  }

  const isCurrentWeek = weekStartDate.toDateString() === (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toDateString();
  })();

  // Weekly data with dates
  const weekDays = selectedWeek.map(d => ({
    date: d.date,
    total: sum(d.records, 'baby_breast', 'baby_bottle'),
  }));

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const { imported, skipped } = importData(ev.target.result);
        setImportMsg(`✅ Đã nhập ${imported} bản ghi${skipped ? `, bỏ qua ${skipped} trùng` : ''}`);
      } catch {
        setImportMsg('❌ File không hợp lệ');
      }
      e.target.value = '';
      setTimeout(() => setImportMsg(null), 3500);
    };
    reader.readAsText(file);
  }

  return (
    <div className="dashboard">
      {/* Mom section */}
      <div className="dash-section">
        <p className="section-title">Mẹ hôm nay</p>
        <div className="stat-row">
          <StatCard emoji="💧" label="Nước" value={momWater} unit="ml" color="#60a5fa" />
          <StatCard emoji="🥛" label="Sữa" value={momMilk} unit="ml" color="#a78bfa" />
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Tỷ lệ uống</p>
          <HBar
            max={momMax}
            items={[
              { key: 'water', emoji: '💧', label: 'Nước', value: momWater, color: '#60a5fa' },
              { key: 'milk',  emoji: '🥛', label: 'Sữa',  value: momMilk,  color: '#a78bfa' },
            ]}
          />
        </div>
      </div>

      {/* Baby section */}
      <div className="dash-section">
        <p className="section-title">Bé hôm nay</p>
        <div className="stat-row">
          <StatCard emoji="🤱" label="Bú mẹ"   value={babyBreast} unit="ml" color="#f472b6" />
          <StatCard emoji="🍼" label="Bú bình"  value={babyBottle} unit="ml" color="#fb923c" />
          <StatCard emoji="🩲" label="Thay bỉm" value={diaperCount} unit="lần" color="#4ade80" />
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Tỷ lệ bú</p>
          <HBar
            max={babyMax}
            items={[
              { key: 'breast', emoji: '🤱', value: babyBreast, color: '#f472b6' },
              { key: 'bottle', emoji: '🍼', value: babyBottle, color: '#fb923c' },
            ]}
          />
        </div>
      </div>

      {/* Weekly trend */}
      <div className="dash-section">
        <div className="week-header">
          <p className="section-title">Xu hướng bú trong tuần (ml)</p>
          <div className="week-nav">
            <button className="week-nav-btn" onClick={goToPrevWeek} aria-label="Tuần trước">‹</button>
            <span className="week-label">
              {weekStartDate.getDate()}/{weekStartDate.getMonth() + 1}
            </span>
            <button className={`week-nav-btn${isCurrentWeek ? ' disabled' : ''}`} onClick={goToNextWeek} disabled={isCurrentWeek} aria-label="Tuần sau">›</button>
          </div>
        </div>
        <div className="dash-card">
          {weekDays.some(d => d.total > 0) ? (
            <WeekChart days={weekDays} />
          ) : (
            <p className="dash-empty">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Data management */}
      <div className="dash-section">
        <p className="section-title">Dữ liệu</p>
        <div className="dash-card data-mgmt">
          {importMsg && <p className="import-msg">{importMsg}</p>}
          <p className="data-count">Tổng: <strong>{records.length}</strong> bản ghi</p>
          <div className="data-btns">
            <button className="data-btn data-btn--export" onClick={exportData}>
              ⬇ Xuất file JSON
            </button>
            <button className="data-btn data-btn--import" onClick={() => fileInputRef.current.click()}>
              ⬆ Nhập file JSON
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <p className="data-hint">Xuất để sao lưu hoặc chuyển sang thiết bị khác</p>
        </div>
      </div>
    </div>
  );
}
