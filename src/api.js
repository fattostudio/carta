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

export async function getSources(label = 'Carta') {
  const res = await fetch(`${BASE}/sources?label=${label}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSince({ since, label = 'Carta', max = 50 } = {}) {
  const params = new URLSearchParams({ label, max });
  if (since) params.append('since', since);
  const res = await fetch(`${BASE}/newsletters/since?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
