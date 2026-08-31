const BASE = '/api';

export async function getAuthStatus() {
  const res = await fetch(`${BASE}/auth/status`, { credentials: 'include' });
  return res.json();
}

export function loginWithGoogle() {
  window.location.href = `${BASE}/auth/login`;
}

export async function logout() {
  await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  window.location.reload();
}

// label: optional Gmail-label override. allowlist: array of sender emails to
// restrict to. With neither, the server auto-detects newsletters from the inbox.
export async function getSources({ label, allowlist } = {}) {
  const params = new URLSearchParams();
  if (label) params.set('label', label);
  if (allowlist?.length) params.set('allowlist', allowlist.join(','));
  const res = await fetch(`${BASE}/sources?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSince({ since, label, allowlist, max = 50 } = {}) {
  const params = new URLSearchParams({ max });
  if (since) params.append('since', since);
  if (label) params.append('label', label);
  if (allowlist?.length) params.append('allowlist', allowlist.join(','));
  const res = await fetch(`${BASE}/newsletters/since?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// items: [{ id, subject, sender, bodyText }]. Returns { summaries: { [id]: string } }.
// Call with a bounded slice (the curation view chunks by ~24) so each request
// stays well under the function timeout.
export async function summarize(items) {
  const res = await fetch(`${BASE}/summarize`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
