// Simple shared state via localStorage + custom events
// So sidebar, pages, and digest view all stay in sync

const KEYS = {
  digests: 'carta-digests',
  sources: 'carta-sources',
  sourcesDisabled: 'carta-sources-disabled',
  sourcesPending: 'carta-sources-pending',
  summaries: 'carta-summaries',
  template: 'carta-template',
  design: 'carta-design',
  triggers: 'carta-triggers',
  onboarded: 'carta-onboarded',
};

export function getDigests() {
  return JSON.parse(localStorage.getItem(KEYS.digests) || '[]');
}

export function saveDigests(digests) {
  localStorage.setItem(KEYS.digests, JSON.stringify(digests));
  dispatch('digests');
}

// ── Digest curation ──────────────────────────────────────────────────────────
// A digest carries `excludedIds` — newsletter ids the reader has toggled off in
// the pre-read curation step. Every surface that renders a digest (the reader,
// the print portals, the offline HTML) reads through `includedNewsletters` so
// the exclusions apply everywhere without touching the stored newsletter list.
export function includedNewsletters(digest) {
  if (!digest) return [];
  const excluded = new Set(digest.excludedIds || []);
  return digest.newsletters.filter(nl => !excluded.has(nl.id));
}

export function setDigestExclusions(digestId, excludedIds) {
  const digests = getDigests();
  const digest = digests.find(d => String(d.id) === String(digestId));
  if (!digest) return;
  digest.excludedIds = excludedIds;
  saveDigests(digests);
}

// ── Newsletter summaries ─────────────────────────────────────────────────────
// One-sentence blurbs keyed by newsletter id (the Gmail message id, stable
// across digests) so a given issue is only ever summarised — and paid for —
// once, however many digests it lands in.
export function getSummaries() {
  return JSON.parse(localStorage.getItem(KEYS.summaries) || '{}');
}

export function mergeSummaries(partial) {
  const next = { ...getSummaries(), ...partial };
  localStorage.setItem(KEYS.summaries, JSON.stringify(next));
  dispatch('summaries');
  return next;
}

export function getSources() {
  return JSON.parse(localStorage.getItem(KEYS.sources) || '[]');
}

export function saveSources(sources) {
  localStorage.setItem(KEYS.sources, JSON.stringify(sources));
  dispatch('sources');
}

export function getDisabledSources() {
  return JSON.parse(localStorage.getItem(KEYS.sourcesDisabled) || '[]');
}

// Detected senders minus the ones toggled off — the allowlist passed to the
// server once the user has reviewed their sources. Empty until the first sync.
export function getEnabledSourceEmails() {
  const disabled = getDisabledSources();
  return getSources().map(s => s.email).filter(email => !disabled.includes(email));
}

export function saveDisabledSources(disabled) {
  localStorage.setItem(KEYS.sourcesDisabled, JSON.stringify(disabled));
  dispatch('sources');
}

// ── Pending (newly detected) sources ────────────────────────────────────────
// Once a reviewed allowlist exists, a fetch only pulls known senders. Each
// fetch also runs a cheap auto-detect pass; any sender it turns up that isn't
// reviewed or disabled lands here for the reader to add or ignore on Sources —
// a newly-subscribed newsletter is surfaced, never folded into a digest
// silently.
export function getPendingSources() {
  return JSON.parse(localStorage.getItem(KEYS.sourcesPending) || '[]');
}

// Fold a detection result into the pending list: skip anything already known or
// explicitly disabled, union the rest, and keep a running issue count.
export function mergePendingSources(detected = []) {
  const known = new Set(getSources().map(s => s.email));
  const disabled = new Set(getDisabledSources());
  const byEmail = new Map(getPendingSources().map(s => [s.email, { ...s }]));

  for (const d of detected) {
    if (!d.email || known.has(d.email) || disabled.has(d.email)) continue;
    const existing = byEmail.get(d.email);
    if (existing) existing.count = (existing.count || 0) + (d.count || 0);
    else byEmail.set(d.email, { name: d.name || d.email, email: d.email, count: d.count || 0 });
  }

  const next = [...byEmail.values()].sort((a, b) => (b.count || 0) - (a.count || 0));
  localStorage.setItem(KEYS.sourcesPending, JSON.stringify(next));
  dispatch('sources');
  return next;
}

// Reader accepted a detected sender: into the reviewed list (enabled by
// default, since the disabled list is opt-out) and out of pending.
export function acceptPendingSource(email) {
  const hit = getPendingSources().find(s => s.email === email);
  if (!hit) return;
  const sources = getSources();
  if (!sources.some(s => s.email === email)) {
    sources.push({ name: hit.name, email: hit.email, count: hit.count });
    localStorage.setItem(KEYS.sources, JSON.stringify(sources));
  }
  localStorage.setItem(KEYS.sourcesPending, JSON.stringify(getPendingSources().filter(s => s.email !== email)));
  dispatch('sources');
}

// Reader dismissed a detected sender: onto the disabled list so it isn't
// flagged again, and out of pending.
export function ignorePendingSource(email) {
  const disabled = getDisabledSources();
  if (!disabled.includes(email)) {
    localStorage.setItem(KEYS.sourcesDisabled, JSON.stringify([...disabled, email]));
  }
  localStorage.setItem(KEYS.sourcesPending, JSON.stringify(getPendingSources().filter(s => s.email !== email)));
  dispatch('sources');
}

export function getTemplate() {
  return localStorage.getItem(KEYS.template) || 'standard';
}

export function saveTemplate(id) {
  localStorage.setItem(KEYS.template, id);
  dispatch('design');
}

export function getDesign() {
  const defaults = {
    paper: '#ffffff',
    ink: '#111111',
    accent: '#888888',
    displayFont: 'Helvetica Neue',
    bodyFont: 'Georgia',
    layout: 'One article per page',
    paperSize: 'A4',
    orientation: 'Portrait',
    coverPage: true,
    images: true,
    pageNums: true,
    printFormat: 'Normal',
  };
  const stored = JSON.parse(localStorage.getItem(KEYS.design) || '{}');
  return { ...defaults, ...stored };
}

export function saveDesign(design) {
  localStorage.setItem(KEYS.design, JSON.stringify(design));
  dispatch('design');
}

export function getTriggers() {
  return JSON.parse(localStorage.getItem(KEYS.triggers) || JSON.stringify({ days: 7, count: 10 }));
}

export function saveTriggers(triggers) {
  localStorage.setItem(KEYS.triggers, JSON.stringify(triggers));
  dispatch('triggers');
}

// Simple pub/sub via window events
function dispatch(key) {
  window.dispatchEvent(new CustomEvent('carta:update', { detail: { key } }));
}

export function subscribe(fn) {
  window.addEventListener('carta:update', fn);
  return () => window.removeEventListener('carta:update', fn);
}

// ── Week utilities ─────────────────────────────────────────────────────────────
export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 1 - day);
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function weekLabel(weekKey) {
  const [year, w] = weekKey.split('-W');
  const weekNum = parseInt(w);
  const jan1 = new Date(parseInt(year), 0, 1);
  const monday = new Date(jan1);
  monday.setDate(jan1.getDate() + (weekNum - 1) * 7 - (jan1.getDay() || 7) + 1);
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
}

export function getLastFetch() {
  return localStorage.getItem('carta-last-fetch') || null;
}

export function saveLastFetch(isoDate) {
  localStorage.setItem('carta-last-fetch', isoDate);
  dispatch('lastFetch');
}

// ── Onboarding ────────────────────────────────────────────────────────────────
// Has this browser been through the first-run flow? Anyone who was already
// using Carta before onboarding existed (has digests, detected senders, or a
// past fetch) is grandfathered in so they never see it.
export function isOnboarded() {
  if (localStorage.getItem(KEYS.onboarded) === '1') return true;
  if (getDigests().length || getSources().length || getLastFetch()) {
    localStorage.setItem(KEYS.onboarded, '1');
    return true;
  }
  return false;
}

export function markOnboarded() {
  localStorage.setItem(KEYS.onboarded, '1');
  dispatch('onboarded');
}
