import { fetchSince, getSources as detectSenders } from '../api';
import {
  getDigests, saveDigests,
  getDisabledSources, getEnabledSourceEmails, mergePendingSources,
  getWeekKey, weekLabel,
  getLastFetch, saveLastFetch,
} from '../store';

// label: optional Gmail-label override. When no reviewed senders exist yet, both
// label and allowlist are empty and the server auto-detects from the inbox.
export async function incrementalFetch({ label } = {}) {
  const since = getLastFetch();
  const allowlist = getEnabledSourceEmails();
  const newsletters = await fetchSince({ since, label, allowlist });

  // Against a reviewed allowlist the fetch above only sees known senders. Run a
  // cheap auto-detect pass (metadata only, since the last fetch) so a
  // newly-subscribed newsletter surfaces on Sources for review instead of being
  // missed. Runs before the early returns — new mail may be *entirely* from
  // unknown senders. Best-effort: never let it block a fetch.
  let newSenders = 0;
  if (allowlist.length && !label) {
    try {
      newSenders = mergePendingSources(await detectSenders({ since })).length;
    } catch { /* ignore — detection is a nicety, not the job */ }
  }

  if (!newsletters.length) return { added: 0, weekKey: getWeekKey(), newSenders };

  const disabled = getDisabledSources();
  const filtered = disabled.length
    ? newsletters.filter(nl => !disabled.includes(nl.senderEmail))
    : newsletters;

  if (!filtered.length) return { added: 0, weekKey: getWeekKey(), newSenders };

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

  return { added: totalAdded, weekKey: getWeekKey(), newSenders };
}
