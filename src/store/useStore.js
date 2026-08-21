import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { ref, push, remove, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const FAMILY_STORAGE_KEY = 'baby-tracker-v1';
const FAMILY_MIGRATED_KEY = 'baby-tracker-migrated';
const DEMO_STORAGE_KEY = 'baby-tracker-demo-v1';

function pathFor(user) {
  return user?.isAnonymous ? `demo/${user.uid}/records` : 'records';
}

function storageKeyFor(user) {
  return user?.isAnonymous ? DEMO_STORAGE_KEY : FAMILY_STORAGE_KEY;
}

function loadCache(key = FAMILY_STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persist(key, records) {
  try { localStorage.setItem(key, JSON.stringify(records)); } catch {}
}

let _records = [];
let _listeners = new Set();
let _syncStatus = 'connecting';
let _statusListeners = new Set();
let _activeUser = null;
let _activePath = null;
let _unsubscribeDb = null;

function broadcast() { _listeners.forEach(fn => fn([..._records])); }
function broadcastStatus() { _statusListeners.forEach(fn => fn(_syncStatus)); }

function setStatus(status) {
  _syncStatus = status;
  broadcastStatus();
}

function connectForUser(user) {
  if (_unsubscribeDb) {
    _unsubscribeDb();
    _unsubscribeDb = null;
  }

  _activeUser = user;
  _activePath = user ? pathFor(user) : null;
  _records = user ? loadCache(storageKeyFor(user)) : [];
  broadcast();

  if (!user) {
    setStatus('connecting');
    return;
  }

  setStatus('connecting');
  const dbRef = ref(db, _activePath);
  _unsubscribeDb = onValue(dbRef, snapshot => {
    const data = snapshot.val();
    const firebaseRecords = data
      ? Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];

    // Preserve the existing one-time localStorage migration for family accounts only.
    if (!user.isAnonymous) {
      const alreadyMigrated = localStorage.getItem(FAMILY_MIGRATED_KEY);
      if (!data && !alreadyMigrated && _records.length > 0) {
        _records.forEach(r => {
          const { id, ...rest } = r;
          push(dbRef, rest);
        });
        localStorage.setItem(FAMILY_MIGRATED_KEY, '1');
        return;
      }
      localStorage.setItem(FAMILY_MIGRATED_KEY, '1');
    }

    _records = firebaseRecords;
    persist(storageKeyFor(user), _records);
    setStatus('ok');
    broadcast();
  }, error => {
    console.error('[Firebase]', error.code, error.message);
    setStatus('error');
  });
}

onAuthStateChanged(auth, connectForUser);

function requireActivePath() {
  if (!_activeUser || !_activePath) throw new Error('Authentication required');
  return _activePath;
}

export function addRecord({ type, value, note = '', timestamp = new Date().toISOString() }) {
  push(ref(db, requireActivePath()), { type, value: value ?? null, note, timestamp });
}

export function deleteRecord(id) {
  remove(ref(db, `${requireActivePath()}/${id}`));
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
  const dbRef = ref(db, requireActivePath());
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
    setRecords([..._records]);
    return () => _listeners.delete(setRecords);
  }, []);
  return records;
}

export function useSyncStatus() {
  const [status, setStatusState] = useState(_syncStatus);
  useEffect(() => {
    _statusListeners.add(setStatusState);
    setStatusState(_syncStatus);
    return () => _statusListeners.delete(setStatusState);
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
  baby_diaper_wet:   { label: 'Bỉm ướt',  emoji: '💦', color: '#38bdf8', unit: null, who: 'baby' },
  baby_diaper_dirty: { label: 'Bỉm bẩn', emoji: '💩', color: '#a16207', unit: null, who: 'baby' },
};

export const DIAPER_OPTIONS = ['baby_diaper_wet', 'baby_diaper_dirty'];
export const DIAPER_TYPES = ['baby_diaper', ...DIAPER_OPTIONS];
