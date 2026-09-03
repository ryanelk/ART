import { useState } from 'react';
import { createGist, loadFromGist } from '../data/gistStorage.js';

function extractGistId(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/([a-f0-9]{20,})/i);
  return match ? match[1] : trimmed;
}

function Landing({ onGuest, onGitHub }) {
  return (
    <div className="setup-screen">
      <div className="setup-box">
        <div className="setup-mark">A</div>
        <div>
          <div className="setup-title">Art Resource Tracker</div>
          <p className="setup-subtitle">Fairs, channels &amp; a content calendar — one board.</p>
        </div>
        <div className="setup-actions">
          <button className="setup-btn" onClick={onGuest}>Start on this device</button>
          <p className="setup-note">Saved locally in this browser</p>
          <div className="setup-divider">
            <div className="setup-divider-line" />
            <span className="setup-divider-text">or</span>
            <div className="setup-divider-line" />
          </div>
          <button className="setup-btn setup-btn-outline" onClick={onGitHub}>Sync with GitHub →</button>
          <p className="setup-note">Sync across devices with a free GitHub account</p>
        </div>
      </div>
    </div>
  );
}

function GitHubForm({ onConnect, onBack, getInitialData }) {
  const [token, setToken] = useState('');
  const [mode, setMode] = useState('new');
  const [gistIdInput, setGistIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) { setError('Token is required.'); return; }
    setLoading(true);
    setError('');
    try {
      if (mode === 'new') {
        const initialData = getInitialData();
        const gistId = await createGist(token.trim(), initialData);
        onConnect({ token: token.trim(), gistId, data: initialData });
      } else {
        const gistId = extractGistId(gistIdInput);
        if (!gistId) { setError('Gist ID is required.'); setLoading(false); return; }
        const data = await loadFromGist(token.trim(), gistId);
        onConnect({ token: token.trim(), gistId, data });
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="setup-screen">
      <div className="setup-form">
        <button className="setup-back" onClick={onBack}>← Back</button>
        <div className="setup-form-title">Connect to GitHub</div>
        <p className="setup-form-desc">
          Your board is saved to a private GitHub Gist and syncs across all your devices automatically.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="setup-field">
            <label className="setup-field-label">Personal Access Token</label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)}
              className="setup-field-input" placeholder="github_pat_..." autoComplete="off" />
            <a href="https://github.com/settings/tokens/new?scopes=gist&description=Art+Resource+Tracker"
              target="_blank" rel="noreferrer" className="setup-link">Create a token with gist scope →</a>
          </div>
          <div className="setup-field">
            <label className="setup-field-label">Storage</label>
            <div className="setup-radio-group">
              <label><input type="radio" name="mode" value="new" checked={mode === 'new'} onChange={() => setMode('new')} /><span>Create new gist</span></label>
              <label><input type="radio" name="mode" value="existing" checked={mode === 'existing'} onChange={() => setMode('existing')} /><span>Use existing gist</span></label>
            </div>
          </div>
          {mode === 'existing' && (
            <div className="setup-field">
              <label className="setup-field-label">Gist ID or URL</label>
              <input type="text" value={gistIdInput} onChange={e => setGistIdInput(e.target.value)}
                className="setup-field-input" placeholder="abc123... or gist.github.com/..." />
            </div>
          )}
          {error && <div className="setup-error">{error}</div>}
          <button type="submit" className="setup-btn" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Connecting...' : mode === 'new' ? 'Create & Connect' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GistSetup({ onConnect, onGuest, getInitialData }) {
  const [step, setStep] = useState('landing');
  if (step === 'github') {
    return <GitHubForm onConnect={onConnect} onBack={() => setStep('landing')} getInitialData={getInitialData} />;
  }
  return <Landing onGuest={onGuest} onGitHub={() => setStep('github')} />;
}
