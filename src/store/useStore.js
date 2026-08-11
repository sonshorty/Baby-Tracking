import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, push, remove, onValue, serverTimestamp } from 'firebase/database';

const STORAGE_KEY = 'baby-tracker-v1';
const MIGRATED_KEY = 'baby-tracker-migrated';
const DB_PATH = 'records';

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persist(records) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
}

let _records = loadCache();
let _listeners = new Set();
// 'connecting' | 'ok' | 'error'
let _syncStatus = 'connecting';
let _statusListeners = new Set();

function broadcast() { _listeners.forEach(fn => fn([..._records])); }
function broadcastStatus() { _statusListeners.forEach(fn => fn(_syncStatus)); }

const dbRef = ref(db, DB_PATH);
onValue(dbRef, snapshot => {
  const data = snapshot.val();
  const firebaseRecords = data
    ? Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  // One-time migration: push existing localStorage records to Firebase if DB is empty
  const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
  if (!data && !alreadyMigrated && _records.length > 0) {
    _records.forEach(r => {
      const { id, ...rest } = r;
      push(dbRef, rest);
    });
    localStorage.setItem(MIGRATED_KEY, '1');
    // wait for the next onValue callback which will include migrated data
    return;
  }
  localStorage.setItem(MIGRATED_KEY, '1');

  _records = firebaseRecords;
  persist(_records);
  _syncStatus = 'ok';
  broadcast();
  broadcastStatus();
}, error => {
  console.error('[Firebase]', error.code, error.message);
  _syncStatus = 'error';
  broadcastStatus();
});

export function addRecord({ type, value, note = '', timestamp = new Date().toISOString() }) {
  push(dbRef, { type, value: value ?? null, note, timestamp });
}

export function deleteRecord(id) {
  remove(ref(db, `${DB_PATH}/${id}`));
}

export function exportData() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), records: _records };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `baby-tracker-${new Date().toLocaleDateString('en-CA')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(jsonText) {
  const parsed = JSON.parse(jsonText);
  const incoming = Array.isArray(parsed) ? parsed : parsed.records ?? [];
  if (!Array.isArray(incoming)) throw new Error('Invalid format');
  const existingTs = new Set(_records.map(r => r.timestamp + r.type));
  let imported = 0;
  incoming.forEach(r => {
    if (!r.type || !r.timestamp) return;
    if (existingTs.has(r.timestamp + r.type)) return;
    push(dbRef, { type: r.type, value: r.value ?? null, note: r.note ?? '', timestamp: r.timestamp });
    imported++;
  });
  return { imported, skipped: incoming.length - imported };
}

export function useRecords() {
  const [records, setRecords] = useState(_records);
  useEffect(() => {
    _listeners.add(setRecords);
    return () => _listeners.delete(setRecords);
  }, []);
  return records;
}

export function useSyncStatus() {
  const [status, setStatus] = useState(_syncStatus);
  useEffect(() => {
    _statusListeners.add(setStatus);
    return () => _statusListeners.delete(setStatus);
  }, []);
  return status;
}

export function getTodayRecords(records) {
  const today = new Date().toDateString();
  return records.filter(r => new Date(r.timestamp).toDateString() === today);
}

export function getLastNDays(records, n = 7) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    days.push({
      date: d,
      records: records.filter(r => new Date(r.timestamp).toDateString() === ds)
    });
  }
  return days;
}

export const TYPES = {
  mom_water:   { label: 'Nước (mẹ)',   emoji: '💧', color: '#60a5fa', unit: 'ml', who: 'mom' },
  mom_milk:    { label: 'Sữa (mẹ)',    emoji: '🥛', color: '#a78bfa', unit: 'ml', who: 'mom' },
  baby_breast: { label: 'Bú mẹ',       emoji: '🤱', color: '#f472b6', unit: 'ml', who: 'baby' },
  baby_bottle: { label: 'Bú bình',     emoji: '🍼', color: '#fb923c', unit: 'ml', who: 'baby' },
  baby_diaper: { label: 'Thay bỉm',    emoji: '🩲', color: '#4ade80', unit: null,  who: 'baby' },
};
