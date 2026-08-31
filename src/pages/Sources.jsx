import { useEffect, useState } from 'react';
import { PageShell, Section, Row, Toggle, Btn, FieldLabel, Input } from '../components/ui';
import {
  getSources as getStoredSources, saveSources,
  getDisabledSources, saveDisabledSources,
  getPendingSources, acceptPendingSource, ignorePendingSource,
  subscribe,
} from '../store';
import { getSources as fetchSources } from '../api';

export default function Sources() {
  const [sources, setSources] = useState(getStoredSources);
  const [disabled, setDisabled] = useState(getDisabledSources);
  const [pending, setPending] = useState(getPendingSources);
  const [label, setLabel] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // A fetch elsewhere can add pending senders (or accept/ignore can move them);
  // keep this screen live so the review list reflects the store.
  useEffect(() => subscribe(e => {
    if (e.detail.key !== 'sources') return;
    setSources(getStoredSources());
    setDisabled(getDisabledSources());
    setPending(getPendingSources());
  }), []);

  function isOn(email) { return !disabled.includes(email); }

  function toggleSource(email) {
    setDisabled(d => {
      const next = d.includes(email) ? d.filter(x => x !== email) : [...d, email];
      saveDisabledSources(next);
      return next;
    });
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const result = await fetchSources({ label: label || undefined });
      setSources(result);
      saveSources(result);
    } catch (err) {
      setError(err.message);
      throw err; // re-throw so Btn confirm knows it failed
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave() {
    saveDisabledSources(disabled);
  }

  return (
    <PageShell
      title="Sources"
      sub="Gmail connection and newsletter senders"
      actions={<Btn primary confirm onClick={handleSave}>Save</Btn>}
    >
      <Section label="Gmail">
        <div>
          <FieldLabel>Gmail label override (optional)</FieldLabel>
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Blank: auto-detect (or your existing Carta label)" />
        </div>
      </Section>

      {pending.length > 0 && (
        <Section
          label="New senders"
          meta={`${pending.length} found`}
          action="Add all"
          onAction={() => pending.forEach(p => acceptPendingSource(p.email))}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em', marginBottom: 12 }}>
            Spotted on a recent fetch, not in your list yet. They stay out of digests until you add them.
          </div>
          {pending.map((p, i) => (
            <Row key={p.email} last={i === pending.length - 1}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 2, letterSpacing: '0.04em' }}>
                  {p.email} · {p.count} {p.count === 1 ? 'issue' : 'issues'} since last fetch
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <button
                  onClick={() => ignorePendingSource(p.email)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-mid)' }}
                >
                  Ignore
                </button>
                <Btn onClick={() => acceptPendingSource(p.email)}>Add</Btn>
              </div>
            </Row>
          ))}
        </Section>
      )}

      <Section
        label="Senders"
        action={syncing ? 'Syncing...' : 'Sync'}
        onAction={handleSync}
        meta={sources.length ? `${sources.length} detected` : ''}
      >
        {error && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--signal)', letterSpacing: '0.06em', marginBottom: 12 }}>
            {error}
          </div>
        )}

        {sources.length === 0 && !syncing && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)', letterSpacing: '0.08em', padding: '8px 0' }}>
            No sources yet — click Sync to scan your inbox for newsletters
          </div>
        )}

        {syncing && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.08em', padding: '8px 0' }}>
            Scanning inbox for newsletters...
          </div>
        )}

        {sources.map((src, i) => (
          <Row key={src.email} last={i === sources.length - 1}>
            <div style={{ flex: 1, opacity: isOn(src.email) ? 1 : 0.4, transition: 'opacity 0.15s' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{src.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 2, letterSpacing: '0.04em' }}>
                {src.email} · {src.count} {src.count === 1 ? 'issue' : 'issues'}
              </div>
            </div>
            <Toggle on={isOn(src.email)} onChange={() => toggleSource(src.email)} />
          </Row>
        ))}
      </Section>
    </PageShell>
  );
}
