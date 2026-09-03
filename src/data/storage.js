import { STORAGE_KEY, DEFAULT_DATA, getInitialData } from './defaults.js';

export { getInitialData };

const clone = (x) => JSON.parse(JSON.stringify(x));

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
    return null;
  } catch {
    return null;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[ART] Failed to save:', e);
  }
}

export function migrateData(data) {
  if (!data) return null;

  if (!Array.isArray(data.organizers)) data.organizers = clone(DEFAULT_DATA.organizers);
  if (!Array.isArray(data.fairs)) data.fairs = clone(DEFAULT_DATA.fairs);
  if (!Array.isArray(data.events)) data.events = clone(DEFAULT_DATA.events);
  if (!data.social || typeof data.social !== 'object') data.social = clone(DEFAULT_DATA.social);
  if (!Array.isArray(data.social.reddit)) data.social.reddit = [];
  if (!Array.isArray(data.social.discord)) data.social.discord = [];
  if (!Array.isArray(data.weekly)) data.weekly = clone(DEFAULT_DATA.weekly);

  // Legacy: Inktober was replaced by Peachtober (same span).
  data.events = data.events.map(e =>
    e.id === 'seed-inktober'
      ? { ...e, id: 'seed-peachtober', name: 'Peachtober', description: 'Daily ink prompts (Peachtober list) — same span as Inktober, friendlier prompts.' }
      : e
  );

  // Ensure stable ids.
  data.events = data.events.map((e, i) => ({ ...e, id: e.id || `e${i}_${Date.now()}` }));
  data.fairs = data.fairs.map((f, i) => ({ ...f, id: f.id || `f${i}_${Date.now()}` }));
  data.organizers = data.organizers.map((o, i) => ({ ...o, id: o.id || `o${i}_${Date.now()}` }));

  return data;
}
