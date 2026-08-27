import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, Btn } from '../components/ui';
import { getDigests, subscribe } from '../store';
import { incrementalFetch } from '../hooks/useFetch';
import { useMobile } from '../hooks/useMobile';

export default function Digests() {
  const [digests, setDigests] = useState(getDigests);
  const [selected, setSelected] = useState(() => {
    const saved = sessionStorage.getItem('carta-selected-digest');
    if (saved && getDigests().some(d => String(d.id) === saved)) return JSON.parse(saved);
    return getDigests()[0]?.id || null;
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  // On mobile, track whether we're viewing a digest (detail) or the list.
  // Persist so returning from the reader (View) restores the detail view.
  const [mobileView, setMobileView] = useState(() => sessionStorage.getItem('carta-mobile-view') || 'list');
  const navigate = useNavigate();
  const isMobile = useMobile();

  useEffect(() => {
    sessionStorage.setItem('carta-mobile-view', mobileView);
  }, [mobileView]);

  useEffect(() => subscribe(e => {
    if (e.detail.key === 'digests') {
      const d = getDigests();
      setDigests(d);
      if (d.length && !selected) setSelected(d[0].id);
    }
  }), []);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const { added } = await incrementalFetch();
      const d = getDigests();
      setDigests(d);
      if (d.length) setSelected(d[0].id);
      setStatus(added > 0 ? `${added} new newsletter${added !== 1 ? 's' : ''} added` : 'Already up to date');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openDigest(id) {
    setSelected(id);
    sessionStorage.setItem('carta-selected-digest', JSON.stringify(id));
    if (isMobile) setMobileView('detail');
  }

  const active = digests.find(d => d.id === selected);

  // On mobile, show either the list OR the detail, not both
  const showList = !isMobile || mobileView === 'list';
  const showDetail = !isMobile || mobileView === 'detail';

  return (
    <PageShell
      title="Digests"
      sub="Weekly reading digests, updated daily"
      actions={<Btn primary onClick={handleFetch} loading={loading ? 'Fetching...' : undefined}>Fetch now</Btn>}
    >
      {(error || status) && (
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid var(--grey-rule)',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
          color: error ? 'var(--signal)' : '#2a9a5a',
          background: error ? '#fff2f0' : '#f0faf4',
        }}>
          {error || status}
        </div>
      )}

      {digests.length === 0 && !loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-sign)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--grey-light)' }}>No digests yet</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)', letterSpacing: '0.08em' }}>Hit "Fetch now" to pull from your Carta label</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '220px 1fr',
          minHeight: 'calc(100vh - 57px)',
        }}>
          {/* List */}
          {showList && (
            <div style={{ borderRight: isMobile ? 'none' : '2px solid var(--black)', overflowY: 'auto' }}>
              {digests.map(d => {
                const isActive = d.id === selected && !isMobile;
                const date = new Date(d.builtAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={d.id} onClick={() => openDigest(d.id)} style={{
                    padding: '14px 16px', borderBottom: '1px solid var(--grey-rule)',
                    cursor: 'pointer', background: isActive ? 'var(--black)' : 'var(--white)', transition: 'background 0.1s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isActive ? 'var(--white)' : 'var(--black)', marginBottom: 3 }}>
                        {d.week}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isActive ? 'var(--grey-light)' : 'var(--grey-mid)', letterSpacing: '0.04em' }}>
                        {d.newsletters.length} issues · updated {date}
                      </div>
                    </div>
                    {isMobile && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Detail */}
          {showDetail && active && (
            <div style={{ overflowY: 'auto' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--grey-rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {isMobile && (
                    <button onClick={() => setMobileView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-sign)', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.week}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 3, letterSpacing: '0.06em' }}>
                      {active.newsletters.length} newsletters
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
