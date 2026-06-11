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
  return JSON.parse(localStorage.getItem(KEYS.design) || JSON.stringify({
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
  }));
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
