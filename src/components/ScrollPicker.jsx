import { useRef, useEffect, useCallback } from 'react';
import './ScrollPicker.css';

const ITEM_H = 44;
const PAD = 2; // ghost items above/below so first/last items can center

export default function ScrollPicker({ items, value, onChange, formatLabel }) {
  const listRef = useRef(null);
  const isProgrammatic = useRef(false);
  const debounce = useRef(null);

  const idx = Math.max(0, items.indexOf(value));

  // Sync scroll position when value changes externally
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    isProgrammatic.current = true;
    el.scrollTop = idx * ITEM_H;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { isProgrammatic.current = false; }, 200);
  }, [idx]);

  const handleScroll = useCallback(() => {
    if (isProgrammatic.current) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const newIdx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), items.length - 1));
      if (items[newIdx] !== value) onChange(items[newIdx]);
    }, 80);
  }, [items, value, onChange]);

  return (
    <div className="sp-wrap">
      {/* selection highlight band */}
      <div className="sp-highlight" />
      <div className="sp-fade-top" />
      <div className="sp-fade-bottom" />
      <div className="sp-list" ref={listRef} onScroll={handleScroll}>
        {Array(PAD).fill(null).map((_, i) => <div key={`t${i}`} className="sp-item" aria-hidden />)}
        {items.map(item => (
          <div key={item} className={`sp-item${item === value ? ' sp-selected' : ''}`}>
            {formatLabel ? formatLabel(item) : item}
          </div>
        ))}
        {Array(PAD).fill(null).map((_, i) => <div key={`b${i}`} className="sp-item" aria-hidden />)}
      </div>
    </div>
  );
}
