import { fetchSince } from '../api';
import {
  getDigests, saveDigests,
  getDisabledSources,
  getWeekKey, weekLabel,
  getLastFetch, saveLastFetch,
} from '../store';

export async function incrementalFetch({ label = 'Carta' } = {}) {
  const since = getLastFetch();
  const newsletters = await fetchSince({ since, label });

  if (!newsletters.length) return { added: 0, weekKey: getWeekKey() };

  const disabled = getDisabledSources();
  const filtered = disabled.length
    ? newsletters.filter(nl => !disabled.includes(nl.senderEmail))
    : newsletters;

  if (!filtered.length) return { added: 0, weekKey: getWeekKey() };

  const byWeek = {};
  for (const nl of filtered) {
    const wk = getWeekKey(new Date(nl.date || Date.now()));
    if (!byWeek[wk]) byWeek[wk] = [];
    byWeek[wk].push(nl);
  }

  const digests = getDigests();
  let totalAdded = 0;

  for (const [wk, nls] of Object.entries(byWeek)) {
    const existing = digests.find(d => d.weekKey === wk);
    if (existing) {
      const existingIds = new Set(existing.newsletters.map(n => n.id));
      const newOnes = nls.filter(n => !existingIds.has(n.id));
      existing.newsletters = [...existing.newsletters, ...newOnes]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      existing.builtAt = new Date().toISOString();
      totalAdded += newOnes.length;
    } else {
      digests.unshift({
        id: Date.now() + Math.random(),
        weekKey: wk,
        week: weekLabel(wk),
        builtAt: new Date().toISOString(),
        newsletters: nls,
      });
      totalAdded += nls.length;
    }
  }

  digests.sort((a, b) => (b.weekKey || '').localeCompare(a.weekKey || ''));
  saveDigests(digests);

  const latest = filtered.reduce((max, nl) =>
    new Date(nl.date) > new Date(max.date) ? nl : max
  );
  saveLastFetch(latest.date);

  return { added: totalAdded, weekKey: getWeekKey() };
}
