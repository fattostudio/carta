import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, Section, Row, ToggleRow, Btn } from '../components/ui';
import { getLastFetch, getDigests } from '../store';
import { incrementalFetch } from '../hooks/useFetch';

export default function Triggers() {
  const navigate = useNavigate();
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [autoFetch, setAutoFetch] = useState(true);

  const lastFetch = getLastFetch();
  const digests = getDigests();
  const latest = digests[0];

  async function handleFetch() {
    setFetching(true);
    setError(null);
    setStatus(null);
    try {
      const { added } = await incrementalFetch();
      setStatus(added > 0
        ? `${added} new newsletter${added !== 1 ? 's' : ''} added to this week's digest`
        : 'Already up to date — no new newsletters since last fetch'
      );
      if (added > 0) navigate('/digests');
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <PageShell title="Triggers" sub="How and when newsletters are fetched">
      <Section label="Schedule">
        <ToggleRow
          label="Auto-fetch on app open"
          sub="Silently fetches new newsletters each time you open the app"
          on={autoFetch}
          onChange={setAutoFetch}
          last
        />
      </Section>

      <Section label="Manual Fetch">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em', lineHeight: 1.7, marginBottom: 16 }}>
          Fetches all newsletters received since the last fetch and adds them to the current week's digest. Each newsletter only ever appears once.
        </div>

        {(error || status) && (
          <div style={{
            padding: '10px 14px', marginBottom: 16,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
            color: error ? 'var(--signal)' : '#2a9a5a',
            background: error ? '#fff2f0' : '#f0faf4',
            borderLeft: `3px solid ${error ? 'var(--signal)' : '#2a9a5a'}`,
          }}>
            {error || status}
          </div>
        )}

        <Row>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>Fetch now</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 2, letterSpacing: '0.04em' }}>
              Last fetch: {formatDate(lastFetch)}
            </div>
          </div>
          <Btn onClick={handleFetch} loading={fetching ? 'Fetching...' : undefined}>Fetch now</Btn>
        </Row>

        {latest && (
          <Row last>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em' }}>
              Current digest: {latest.week}
            </div>
            <div style={{ fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700, color: 'var(--grey-mid)' }}>
              {latest.newsletters.length} issues
            </div>
          </Row>
        )}
      </Section>
    </PageShell>
  );
}
