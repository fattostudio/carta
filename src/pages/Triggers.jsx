import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, Section, Row, Btn } from '../components/ui';
import { getTriggers, saveTriggers, getDigests, saveDigests } from '../store';
import { buildDigest } from '../api';

export default function Triggers() {
  const navigate = useNavigate();
  const saved = getTriggers();
  const [days, setDays] = useState(saved.days);
  const [count, setCount] = useState(saved.count);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  // Real stats from store
  const digests = getDigests();
  const latest = digests[0];
  const collectedSoFar = latest?.newsletters?.length || 0;

  // Next fetch date = latest digest date + days
  function nextFetchDate() {
    if (!latest) return 'No digest yet — fetch now to start';
    const last = new Date(latest.builtAt);
    const next = new Date(last);
    next.setDate(next.getDate() + days);
    return next.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  async function handleSave() {
    saveTriggers({ days, count });
  }

  async function handleFetch() {
    setFetching(true);
    setError(null);
    try {
      const result = await buildDigest({ days, max: count, label: 'Carta' });
      if (!result.newsletters?.length) {
        setError('No newsletters found in that range.');
        return;
      }
      const week = `Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
      const existing = digests.find(d => d.week === week);
      const digest = { id: existing?.id || Date.now(), week, builtAt: result.builtAt, newsletters: result.newsletters };
      const updated = existing ? digests.map(d => d.id === existing.id ? digest : d) : [digest, ...digests];
      saveDigests(updated);
      navigate('/digests');
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }

  return (
    <PageShell
      title="Triggers"
      sub="When to automatically build a new digest"
      actions={<Btn primary confirm onClick={handleSave}>Save</Btn>}
    >
      <Section label="Dual Trigger">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em', marginBottom: 20, lineHeight: 1.7 }}>
          A new digest is built when either condition is met — whichever comes first.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--grey-rule)' }}>
          <div style={{ padding: 16, borderRight: '1px solid var(--grey-rule)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-mid)', marginBottom: 12 }}>By count</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-sign)', fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{count}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.08em' }}>newsletters</span>
            </div>
            <input type="range" min={3} max={30} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--black)' }} />
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-mid)', marginBottom: 12 }}>By time</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-sign)', fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{days}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.08em' }}>days</span>
            </div>
            <input type="range" min={1} max={30} value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--black)' }} />
          </div>
        </div>

        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--grey-bg)', borderLeft: '3px solid var(--black)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
          Fetch when <strong style={{ color: 'var(--black)' }}>{count} newsletters</strong> accumulate — or after <strong style={{ color: 'var(--black)' }}>{days} days</strong>, whichever comes first
        </div>
      </Section>

      <Section label="Status">
        {error && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--signal)', letterSpacing: '0.06em', marginBottom: 12 }}>
            {error}
          </div>
        )}
        <Row>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>Next fetch</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 2, letterSpacing: '0.04em' }}>{nextFetchDate()}</div>
          </div>
          <Btn onClick={handleFetch} loading={fetching ? 'Fetching...' : undefined}>Fetch now</Btn>
        </Row>
        <Row last>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em' }}>
            {latest ? `Last digest: ${latest.newsletters.length} newsletters` : 'No digests yet'}
          </div>
          {latest && (
            <div style={{ fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--grey-mid)' }}>
              {Math.round((collectedSoFar / count) * 100)}%
            </div>
          )}
        </Row>
      </Section>
    </PageShell>
  );
}
