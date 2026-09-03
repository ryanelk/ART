const GIST_FILENAME = 'art-data.json';
export const CREDENTIALS_KEY = 'art-gist-credentials';
const PENDING_KEY = 'art-pending-sync';
const GUEST_KEY = 'art-guest-mode';

export const setGuestMode = () => localStorage.setItem(GUEST_KEY, '1');
export const clearGuestMode = () => localStorage.removeItem(GUEST_KEY);
export const isGuestMode = () => !!localStorage.getItem(GUEST_KEY);

export const setPending = () => localStorage.setItem(PENDING_KEY, '1');
export const clearPending = () => localStorage.removeItem(PENDING_KEY);
export const hasPending = () => !!localStorage.getItem(PENDING_KEY);

export function getCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCredentials(token, gistId) {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ token, gistId }));
}

export function clearCredentials() {
  localStorage.removeItem(CREDENTIALS_KEY);
}

async function githubError(res) {
  try {
    const body = await res.json();
    return new Error(`GitHub ${res.status}: ${body.message || JSON.stringify(body)}`);
  } catch {
    return new Error(`GitHub API error ${res.status}`);
  }
}

export async function loadFromGist(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw await githubError(res);
  const gist = await res.json();
  const content = gist.files?.[GIST_FILENAME]?.content;
  if (!content) throw new Error(`File "${GIST_FILENAME}" not found in gist`);
  return JSON.parse(content);
}

export async function saveToGist(token, gistId, data) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
    }),
  });
  if (!res.ok) throw await githubError(res);
}

export async function createGist(token, data) {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Art Resource Tracker Data',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
    }),
  });
  if (!res.ok) throw await githubError(res);
  const gist = await res.json();
  return gist.id;
}
