import { useEffect, useMemo, useRef, useState } from 'react';
import { Toggle } from './ui';
import {
  getSummaries, mergeSummaries, subscribe,
  setDigestExclusions,
  getDisabledSources, saveDisabledSources,
} from '../store';
import { summarize } from '../api';

// Newsletters sent per summary request. Small enough that each call returns well
// inside the function timeout, so a big digest fills in progressively.
const CHUNK = 24;

const wordCount = (text = '') => text.split(/\s+/).filter(Boolean).length;

// Rough page estimate so the reader can watch the digest shrink as they cut —
// one cover page plus ~500 words per printed page.
function estimatePages(newsletters) {
  let pages = 1;
  for (const nl of newsletters) pages += Math.max(1, Math.ceil(wordCount(nl.bodyText) / 500));
  return pages;
}

export default function DigestCuration({ digest }) {
  const [summaries, setSummaries] = useState(getSummaries);
  const [excluded, setExcluded] = useState(() => new Set(digest.excludedIds || []));
  const [pending, setPending] = useState(0);
  const [error, setError] = useState(null);

  // Re-seed the exclusion set whenever a different digest is opened.
  useEffect(() => {
    setExcluded(new Set(digest.excludedIds || []));
  }, [digest.id]);

  // Keep in sync if summaries land from another view.
  useEffect(() => subscribe(e => {
    if (e.detail.key === 'summaries') setSummaries(getSummaries());
  }), []);

  // Fetch summaries for any newsletter we haven't summarised before.
  const fetchToken = useRef(0);
  useEffect(() => {
    const token = ++fetchToken.current;
    const cache = getSummaries();
    const missing = digest.newsletters
      .filter(nl => nl.id && !cache[nl.id])
      .map(nl => ({
        id: nl.id,
        subject: nl.subject,
        sender: nl.sender,
        bodyText: (nl.bodyText || '').replace(/\s+/g, ' ').slice(0, 1200),
      }));

    if (!missing.length) { setPending(0); return; }

    setError(null);
    setPending(missing.length);

    (async () => {
      for (let i = 0; i < missing.length; i += CHUNK) {
        if (fetchToken.current !== token) return;
        const slice = missing.slice(i, i + CHUNK);
        try {
          const { summaries: got } = await summarize(slice);
          if (fetchToken.current !== token) return;
          setSummaries(mergeSummaries(got));
          setPending(p => Math.max(0, p - slice.length));
        } catch (err) {
          if (fetchToken.current !== token) return;
          setError(err.message || 'Could not load summaries');
          setPending(0);
          return;
        }
      }
    })();

    return () => { fetchToken.current++; };
  }, [digest.id]);

  const total = digest.newsletters.length;
  const included = useMemo(
    () => digest.newsletters.filter(nl => !excluded.has(nl.id)),
    [digest.newsletters, excluded],
  );
  const pages = useMemo(() => estimatePages(included), [included]);

  function persist(nextSet) {
    setExcluded(nextSet);
    setDigestExclusions(digest.id, [...nextSet]);
  }

  function toggle(id) {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id); else next.add(id);
    persist(next);
  }

  const selectAll = () => persist(new Set());
  const deselectAll = () => persist(new Set(digest.newsletters.map(nl => nl.id)));

  // Senders with every issue in this digest switched off — offer to stop pulling
  // them altogether, which is a Sources concern, not just this digest's.
  const droppedSenders = useMemo(() => {
    const disabled = new Set(getDisabledSources());
    const bySender = new Map();
    for (const nl of digest.newsletters) {
      const key = nl.senderEmail || nl.sender;
      if (!key || disabled.has(nl.senderEmail)) continue;
      if (!bySender.has(key)) bySender.set(key, { name: nl.sender, email: nl.senderEmail, ids: [] });
      bySender.get(key).ids.push(nl.id);
    }
    return [...bySender.values()].filter(s => s.email && s.ids.every(id => excluded.has(id)));
  }, [digest.newsletters, excluded, summaries]);

  function stopFollowing() {
    const emails = droppedSenders.map(s => s.email).filter(Boolean);
    if (!emails.length) return;
    saveDisabledSources([...new Set([...getDisabledSources(), ...emails])]);
    setSummaries(s => ({ ...s })); // nudge droppedSenders recompute
  }

  const droppedLabel = droppedSenders.slice(0, 3).map(s => s.name).join(', ')
    + (droppedSenders.length > 3 ? ` +${droppedSenders.length - 3} more` : '');

  return (
    <div>
      {/* Tally bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5, background: 'var(--white)',
        borderBottom: '1px solid var(--grey-rule)', padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)', letterSpacing: '0.06em' }}>
          <span style={{ color: 'var(--black)', fontWeight: 600 }}>{included.length}</span> of {total} selected
          <span style={{ color: 'var(--grey-light)' }}> · ~{pages} page{pages === 1 ? '' : 's'}</span>
          {pending > 0 && <span style={{ color: 'var(--grey-light)' }}> · summarising {pending}…</span>}
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <button onClick={selectAll} style={linkBtn}>Select all</button>
          <button onClick={deselectAll} style={linkBtn}>Deselect all</button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px 20px', borderBottom: '1px solid var(--grey-rule)',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--signal)', letterSpacing: '0.06em',
        }}>
          {error}
        </div>
      )}

      {droppedSenders.length > 0 && (
        <div style={{
          padding: '10px 20px', borderBottom: '1px solid var(--grey-rule)', background: 'var(--grey-bg, #fafafa)',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span>Nothing selected from {droppedLabel}</span>
          <button onClick={stopFollowing} style={{ ...linkBtn, color: 'var(--black)' }}>Stop following</button>
        </div>
      )}

      {/* Rows */}
      {digest.newsletters.map((nl, i) => {
        const on = !excluded.has(nl.id);
        const summary = summaries[nl.id];
        return (
          <div key={nl.id || i} style={{
            padding: '14px 20px', borderBottom: '1px solid var(--grey-rule)',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)', minWidth: 20, paddingTop: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, minWidth: 0, opacity: on ? 1 : 0.4, transition: 'opacity 0.15s' }}>
              <div style={{ fontFamily: 'var(--font-sign)', fontSize: 15, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 4 }}>
                {nl.subject}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em', marginBottom: summary ? 6 : 0 }}>
                {nl.sender} · {nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </div>
              {summary
                ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5, color: 'var(--black)' }}>{summary}</div>
                : <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)', letterSpacing: '0.04em' }}>
                    {error ? 'No summary' : 'Summarising…'}
                  </div>}
            </div>
            <div style={{ paddingTop: 2, flexShrink: 0 }}>
              <Toggle on={on} onChange={() => toggle(nl.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const linkBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--grey-mid)',
};
