const BASE = 'http://localhost:3001';

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

export async function fetchNewsletters({ days = 7, max = 10, label = 'Carta' } = {}) {
  const res = await fetch(
    `${BASE}/api/newsletters?days=${days}&max=${max}&label=${label}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSources(label = 'Carta') {
  const res = await fetch(`${BASE}/api/sources?label=${label}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function buildDigest({ days = 7, max = 10, label = 'Carta' } = {}) {
  const res = await fetch(`${BASE}/api/digest/build`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days, max, label }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
