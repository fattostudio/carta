// Simple shared state via localStorage + custom events
// So sidebar, pages, and digest view all stay in sync

const KEYS = {
  digests: 'carta-digests',
  sources: 'carta-sources',
  sourcesDisabled: 'carta-sources-disabled',
  template: 'carta-template',
  design: 'carta-design',
  triggers: 'carta-triggers',
};

export function getDigests() {
  return JSON.parse(localStorage.getItem(KEYS.digests) || '[]');
}

export function saveDigests(digests) {
  localStorage.setItem(KEYS.digests, JSON.stringify(digests));
  dispatch('digests');
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
