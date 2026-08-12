import { useEffect, useRef, useState } from 'react';
import { useRecords, getTodayRecords, deleteRecord, TYPES } from '../store/useStore';
import QuickAddModal from './QuickAddModal';
import './Timeline.css';

const SLOT_MINUTES = 30;
const TOTAL_SLOTS = 24 * (60 / SLOT_MINUTES); // 48 slots

function slotIndex(date) {
  const d = new Date(date);
  return Math.floor((d.getHours() * 60 + d.getMinutes()) / SLOT_MINUTES);
}

function slotLabel(idx) {
  const totalMin = idx * SLOT_MINUTES;
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const m = String(totalMin % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getRecordsForDate(records, date) {
  const dateStr = date.toDateString();
  return records.filter(r => new Date(r.timestamp).toDateString() === dateStr);
}

function formatDateDisplay(date) {
  const today = new Date().toDateString();
  if (date.toDateString() === today) return 'Hôm nay';
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  
  return date.toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Timeline() {
  const records = useRecords();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personFilter, setPersonFilter] = useState('all');
  const allDayRecords = getRecordsForDate(records, selectedDate);
  const dayRecords = personFilter === 'all'
    ? allDayRecords
    : allDayRecords.filter(record => TYPES[record.type]?.who === personFilter);
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const nowSlot = isToday ? slotIndex(new Date()) : -1;
  const nowRef = useRef(null);

  // Group records by slot
  const bySlot = {};
  dayRecords.forEach(r => {
    const s = slotIndex(r.timestamp);
    if (!bySlot[s]) bySlot[s] = [];
    bySlot[s].push(r);
  });

  // Scroll current slot into view once on mount
  useEffect(() => {
    if (nowRef.current && isToday) {
      nowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isToday]);

  function goToPrevDay() {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  }

  function goToNextDay() {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    // compare midnight timestamps, not locale strings
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    if (next <= tomorrow) setSelectedDate(next);
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  // yyyy-mm-dd value for <input type="date">
  const dateInputVal = selectedDate.toLocaleDateString('en-CA'); // en-CA = YYYY-MM-DD
  const todayInputMax = new Date().toLocaleDateString('en-CA');

  function onDateInput(e) {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    const picked = new Date(y, m - 1, d);
    if (picked <= new Date()) setSelectedDate(picked);
  }

  const [modal, setModal] = useState(null); // { hour, minute }

  function openModal(slotIdx) {
    const totalMin = slotIdx * SLOT_MINUTES;
    setModal({ hour: Math.floor(totalMin / 60), minute: totalMin % 60 });
  }

  function openModalNow() {
    const now = new Date();
    setModal({ hour: now.getHours(), minute: now.getMinutes() });
  }

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);

  return (
    <div className="timeline">
      {modal && (
        <QuickAddModal
          date={selectedDate}
          initHour={modal.hour}
          initMinute={modal.minute}
          onClose={() => setModal(null)}
        />
      )}

      <div className="timeline-header">
        <button className="date-nav-btn" onClick={goToPrevDay} aria-label="Ngày trước">‹</button>
        <label className="date-display-wrap">
          <span className="date-display-text">{formatDateDisplay(selectedDate)}</span>
          <input
            type="date"
            className="date-input"
            value={dateInputVal}
            max={todayInputMax}
            onChange={onDateInput}
            aria-label="Chọn ngày"
          />
        </label>
        <button
          className={`date-nav-btn${isToday ? ' disabled' : ''}`}
          onClick={goToNextDay}
          disabled={isToday}
          aria-label="Ngày sau"
        >›</button>
      </div>

      <div className="timeline-filter" role="group" aria-label="Lọc timeline theo người">
        {[
          { value: 'all', label: 'Cả hai' },
          { value: 'mom', label: 'Mẹ' },
          { value: 'baby', label: 'Bé' },
        ].map(option => (
          <button
            key={option.value}
            type="button"
            className={`timeline-filter-btn${personFilter === option.value ? ' active' : ''}`}
            onClick={() => setPersonFilter(option.value)}
            aria-pressed={personFilter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="timeline-inner">
        {slots.map(i => {
          const isNow = i === nowSlot;
          const items = bySlot[i];
          const hasItems = items && items.length > 0;

          if (!hasItems && !isNow) return null;

          return (
            <div
              key={i}
              ref={isNow ? nowRef : null}
              className={`slot${isNow ? ' slot--now' : ''}${hasItems ? ' slot--filled' : ''}`}
            >
              <div className="slot-time">{slotLabel(i)}</div>

              <div className="slot-line">
                <div className="slot-dot" />
              </div>

              <div className="slot-events">
                {isNow && !hasItems && (
                  <div className="slot-now-badge">Bây giờ</div>
                )}
                {hasItems && items.map(r => {
                  const info = TYPES[r.type];
                  return (
                    <div key={r.id} className="event-chip" style={{ '--chip-color': info.color }}>
                      <span className="event-emoji">{info.emoji}</span>
                      <span className="event-label">{info.label}</span>
                      {r.value != null && (
                        <span className="event-value">{r.value} ml</span>
                      )}
                      <span className="event-time">{formatTime(r.timestamp)}</span>
                      <button
                        className="event-delete"
                        onClick={() => deleteRecord(r.id)}
                        aria-label="Xóa"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              <button className="slot-add-btn" onClick={() => openModal(i)} aria-label="Thêm ghi chú">+</button>
            </div>
          );
        })}

        {dayRecords.length === 0 && (
          <div className="timeline-empty">
            <p>
              📭 {allDayRecords.length === 0
                ? `Chưa có ghi chú ${isToday ? 'hôm nay' : 'ngày này'}`
                : `Không có ghi chú của ${personFilter === 'mom' ? 'mẹ' : 'bé'}`}
            </p>
            <p>Nhấn <strong>+</strong> bên dưới để bắt đầu</p>
          </div>
        )}
      </div>

      {/* FAB: add at current moment */}
      <button className="timeline-fab" onClick={openModalNow} aria-label="Thêm ghi chú">+</button>
    </div>
  );
}
