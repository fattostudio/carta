import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, Btn, Row } from '../components/ui';
import { getDigests, saveDigests, subscribe, getDisabledSources } from '../store';
import { buildDigest } from '../api';

export default function Digests() {
  const [digests, setDigests] = useState(getDigests);
  const [selected, setSelected] = useState(() => getDigests()[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Keep in sync with store updates from other pages
  useEffect(() => subscribe(e => {
    if (e.detail.key === 'digests') {
      const d = getDigests();
      setDigests(d);
      if (!selected && d.length) setSelected(d[0].id);
    }
  }), []);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    try {
      const result = await buildDigest({ days: 7, max: 10, label: 'Carta' });
      if (!result.newsletters?.length) { setError('No newsletters found.'); return; }

      // Filter out disabled sources
      const disabled = getDisabledSources();
      const filtered = disabled.length
        ? result.newsletters.filter(nl => !disabled.includes(nl.senderEmail))
        : result.newsletters;

      const week = `Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
      const existing = digests.find(d => d.week === week);
      const digest = { id: existing?.id || Date.now(), week, builtAt: result.builtAt, newsletters: filtered };
      const updated = existing ? digests.map(d => d.id === existing.id ? digest : d) : [digest, ...digests];
      saveDigests(updated);
      setDigests(updated);
      setSelected(digest.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const active = digests.find(d => d.id === selected);

  return (
    <PageShell
      title="Digests"
      sub="All generated digests"
      actions={<Btn primary onClick={handleFetch} loading={loading ? 'Fetching...' : undefined}>Fetch now</Btn>}
    >
      {error && (
        <div style={{ padding: '10px 16px', background: '#fff2f0', borderBottom: '1px solid var(--grey-rule)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--signal)', letterSpacing: '0.06em' }}>
          {error}
        </div>
      )}

      {digests.length === 0 && !loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-sign)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--grey-light)' }}>No digests yet</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)', letterSpacing: '0.08em' }}>Hit "Fetch now" to pull from your Carta label</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 57px)' }}>

          {/* Left panel */}
          <div style={{ borderRight: '2px solid var(--black)', overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--grey-rule)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.08em' }}>
                Fetching...
              </div>
            )}
            {digests.map(d => {
              const isActive = d.id === selected;
              const date = new Date(d.builtAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={d.id} onClick={() => setSelected(d.id)} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--grey-rule)',
                  cursor: 'pointer', background: isActive ? 'var(--black)' : 'var(--white)', transition: 'background 0.1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isActive ? 'var(--white)' : 'var(--black)' }}>
                      {d.week}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isActive ? 'var(--grey-light)' : 'var(--grey-mid)', letterSpacing: '0.04em' }}>
                    {d.newsletters.length} issues · {date}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panel */}
          {active && (
            <div style={{ overflowY: 'auto' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--grey-rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-sign)', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{active.week}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 3, letterSpacing: '0.06em' }}>
                    {active.newsletters.length} newsletters · {new Date(active.builtAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => navigate(`/digests/${active.id}`)}>View</Btn>
                  <Btn primary onClick={() => navigate(`/digests/${active.id}?print=1`)}>Print</Btn>
                </div>
              </div>

              {active.newsletters.map((nl, i) => (
                <div key={nl.id || i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--grey-rule)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)', minWidth: 20, paddingTop: 2 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-sign)', fontSize: 15, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 4 }}>
                      {nl.subject}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em' }}>
                      {nl.sender} · {nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
