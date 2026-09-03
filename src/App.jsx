import { useState, useEffect, useCallback, useRef } from 'react';
import GistSetup from './components/GistSetup.jsx';
import FairsTab from './components/FairsTab.jsx';
import SocialTab from './components/SocialTab.jsx';
import CalendarTab from './components/CalendarTab.jsx';
import { loadData, saveData, getInitialData, migrateData } from './data/storage.js';
import {
  getCredentials, saveCredentials, clearCredentials,
  loadFromGist, saveToGist,
  setPending, clearPending, hasPending,
  isGuestMode, setGuestMode, clearGuestMode,
} from './data/gistStorage.js';

const TABS = [
  { id: 'fairs', label: 'Art Fairs' },
  { id: 'social', label: 'Social' },
  { id: 'calendar', label: 'Calendar' },
];

const SYNC_DEBOUNCE_MS = 5 * 60 * 1000;

function applyTheme(m) {
  const root = document.documentElement;
  if (m === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', m);
}

export default function App() {
  const [credentials, setCredentials] = useState(() => getCredentials());
  const [guestMode, setGuestModeState] = useState(() => isGuestMode());
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('fairs');
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState('');
  const [conflictData, setConflictData] = useState(null);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('art-theme') || 'system'; } catch { return 'system'; } });

  const saveTimer = useRef(null);
  const credentialsRef = useRef(credentials);
  useEffect(() => { credentialsRef.current = credentials; }, [credentials]);
  useEffect(() => { applyTheme(theme); try { localStorage.setItem('art-theme', theme); } catch { /* ignore */ } }, [theme]);

  // Initial load
  useEffect(() => {
    if (isGuestMode()) {
      const cached = loadData();
      setData(cached || getInitialData());
      setLoading(false);
      return;
    }
    const creds = getCredentials();
    if (!creds) { setLoading(false); return; }

    loadFromGist(creds.token, creds.gistId)
      .then(rawGistData => {
        const gistData = migrateData(rawGistData);
        if (hasPending()) {
          const local = loadData();
          if (local) { setConflictData({ gist: gistData, local }); setLoading(false); return; }
        }
        clearPending();
        setData(gistData);
        saveData(gistData);
        setLoading(false);
      })
      .catch(err => {
        console.error('[ART] Failed to load from gist:', err.message);
        const cached = loadData();
        setData(cached || getInitialData());
        setSyncStatus('error');
        setSyncError(err.message);
        setLoading(false);
      });
  }, []);

  const doGistSave = useCallback(async (nextData) => {
    const creds = credentialsRef.current;
    if (!creds) return;
    setSyncStatus('saving');
    try {
      await saveToGist(creds.token, creds.gistId, nextData);
      clearPending();
      setSyncStatus('saved');
      setSyncError('');
      setTimeout(() => setSyncStatus(s => s === 'saved' ? 'idle' : s), 2000);
    } catch (err) {
      console.error('[ART] Failed to save to gist:', err.message);
      setSyncStatus('error');
      setSyncError(err.message);
    }
  }, []);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveData(next);
      if (!isGuestMode() && credentialsRef.current) {
        setPending();
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doGistSave(next), SYNC_DEBOUNCE_MS);
      }
      return next;
    });
  }, [doGistSave]);

  const handleConnect = useCallback(({ token, gistId, data: initialData }) => {
    saveCredentials(token, gistId);
    credentialsRef.current = { token, gistId };
    setCredentials({ token, gistId });
    setData(migrateData(initialData));
    saveData(initialData);
    setLoading(false);
  }, []);

  const handleGuest = useCallback(() => {
    setGuestMode();
    setGuestModeState(true);
    const cached = loadData();
    setData(cached || getInitialData());
    setLoading(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    if (!confirm('Disconnect from GitHub? Your data stays saved locally in this browser.')) return;
    clearCredentials();
    clearGuestMode();
    clearPending();
    setCredentials(null);
    setGuestModeState(false);
  }, []);

  const resolveConflict = useCallback((choice) => {
    const chosen = choice === 'local' ? conflictData.local : conflictData.gist;
    clearPending();
    setData(chosen);
    saveData(chosen);
    if (choice === 'local') {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doGistSave(chosen), 500);
    }
    setConflictData(null);
  }, [conflictData, doGistSave]);

  const cycleTheme = () => setTheme(t => t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system');
  const themeLabel = theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light';
  const themeIcon = theme === 'system' ? '◐' : theme === 'dark' ? '☾' : '☀';

  // Setup screen
  if (!credentials && !guestMode) {
    return <GistSetup onConnect={handleConnect} onGuest={handleGuest} getInitialData={getInitialData} />;
  }
  if (loading || (!conflictData && !data)) {
    return <div className="loading">Loading…</div>;
  }
  if (conflictData) {
    return (
      <div className="conflict-dialog">
        <div className="conflict-box">
          <div className="conflict-title">Unsynced changes found</div>
          <p className="conflict-desc">Your last session had changes that didn't sync to GitHub. Choose which version to keep.</p>
          <button className="conflict-btn conflict-btn-primary" onClick={() => resolveConflict('local')}>
            Keep this device's version
            <div className="conflict-info">Saved: {new Date(conflictData.local.savedAt).toLocaleString()}</div>
          </button>
          <button className="conflict-btn conflict-btn-secondary" onClick={() => resolveConflict('gist')}>
            Load from GitHub
            <div className="conflict-info">Saved: {conflictData.gist.savedAt ? new Date(conflictData.gist.savedAt).toLocaleString() : 'unknown'}</div>
          </button>
        </div>
      </div>
    );
  }

  const renderSyncStatus = () => {
    if (guestMode) return <span className="sync-muted">Local only</span>;
    if (syncStatus === 'saving') return <span className="sync-muted">Syncing…</span>;
    if (syncStatus === 'saved') return <span className="sync-ok">Saved ✓</span>;
    if (syncStatus === 'error') return <button className="sync-btn err" title={syncError} onClick={() => doGistSave(data)}>Sync error — retry</button>;
    return <button className="sync-btn" onClick={() => doGistSave(data)}>↑ Sync now</button>;
  };

  return (
    <div className="wrap">
      <header>
        <div className="brandrow">
          <div className="brand">
            <div className="mark">A</div>
            <div>
              <h1>Art Resource Tracker</h1>
              <p>Where to show up, post, and get seen — one running board.</p>
            </div>
          </div>
          <div className="headtools">
            <div className="sync-status">{renderSyncStatus()}</div>
            <button className="themebtn" onClick={cycleTheme} aria-label="Toggle theme"><span>{themeIcon}</span>{themeLabel}</button>
            <button className="themebtn" onClick={handleDisconnect} aria-label="Settings" title="Disconnect / settings">⚙</button>
          </div>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map(t => (
            <button key={t.id} className="tab" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </header>

      <div className="panel">
        {tab === 'fairs' && <FairsTab data={data} updateData={updateData} />}
        {tab === 'social' && <SocialTab data={data} updateData={updateData} />}
        {tab === 'calendar' && <CalendarTab data={data} updateData={updateData} />}
      </div>

      <footer>
        <span>Art Resource Tracker · gist-synced board</span>
        <span>{guestMode ? 'This device only' : 'Synced to your gist'}</span>
      </footer>
    </div>
  );
}
