import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Btn } from '../components/ui';
import { useMobile } from '../hooks/useMobile';

// ── Text cleaning ─────────────────────────────────────────────────────────────
function cleanBody(raw = '') {
  return raw
    .replace(/https?:\/\/[^\s<>"]+/g, '')
    .replace(/[\(\[\{]\s*[\)\]\}]/g, '')
    .replace(/^[\s\W]{0,3}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getParas(raw = '') {
  const cleaned = cleanBody(raw);
  let chunks = cleaned.split(/\n{2,}/);
  if (chunks.length < 3) chunks = cleaned.split(/\n/);
  return chunks
    .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 60);
}

function domainFromEmail(email = '') {
  const match = email.match(/@([\w.-]+)/);
  if (!match) return null;
  const domain = match[1];
  const boring = ['substack.com', 'buttondown.email', 'mailchimp.com', 'beehiiv.com', 'convertkit.com', 'ghost.io'];
  if (boring.some(b => domain.includes(b))) return null;
  return domain;
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = {
  standard: {
    name: 'Standard',
    coverBg: '#000', coverFg: '#fff',
    headerBg: '#000', headerFg: '#fff',
    headlineFg: '#000', bodyFg: '#222', metaFg: '#888',
    ruleColor: '#e0e0e0', tagBorder: '#000', tagFg: '#000',
    fontSize: { headline: 36, lead: 15, body: 13, meta: 9 },
    fontFamily: 'var(--font-body)',
    headlineFamily: 'var(--font-sign)',
    margins: '28px 32px',
  },
  eco: {
    name: 'Eco',
    coverBg: '#fff', coverFg: '#111',
    headerBg: '#fff', headerFg: '#333',
    headlineFg: '#111', bodyFg: '#333', metaFg: '#999',
    ruleColor: '#ccc', tagBorder: '#999', tagFg: '#555',
    fontSize: { headline: 28, lead: 13, body: 11, meta: 8 },
    fontFamily: "'Ecofont Vera Sans', 'Trebuchet MS', Arial, sans-serif",
    headlineFamily: "'Ecofont Vera Sans', 'Trebuchet MS', Arial, sans-serif",
    margins: '20px 24px',
  },
};

// ── Cover Page ────────────────────────────────────────────────────────────────
function CoverPage({ digest, t }) {
  const date = new Date(digest.builtAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const isEco = t === TEMPLATES.eco;

  return (
    <div className="digest-page" style={{ width: '210mm', minHeight: '297mm', background: '#fff', border: isEco ? '1px solid #ccc' : '2px solid #000', marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: t.coverBg, color: t.coverFg, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isEco ? '1px solid #ccc' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-sign)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Carta</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: isEco ? '#999' : '#888' }}>Newsletter Digest</span>
      </div>

      <div style={{ flex: 1, padding: '40px 40px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.metaFg, marginBottom: 32 }}>{date}</div>

        <div style={{ borderTop: isEco ? '1px solid #ccc' : '3px solid #000', paddingTop: 20, marginBottom: 40 }}>
          <div style={{ fontFamily: t.headlineFamily, fontSize: isEco ? 52 : 72, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.9, color: t.headlineFg }}>
            The<br />Weekend<br />Digest
          </div>
        </div>

        {isEco && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.12em', marginBottom: 16 }}>
            ♻ Printed using Ecofont · reduced ink consumption
          </div>
        )}

        <div style={{ borderTop: isEco ? '1px solid #ccc' : '2px solid #000' }}>
          <div style={{
            background: isEco ? 'transparent' : '#000',
            color: isEco ? t.metaFg : '#fff',
            padding: isEco ? '8px 0' : '6px 0 6px 16px',
            fontFamily: 'var(--font-sign)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
            borderBottom: isEco ? '1px solid #ccc' : 'none',
            paddingLeft: isEco ? 0 : 16,
          }}>
            Contents
          </div>
          {digest.newsletters.map((nl, i) => (
            <div key={nl.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, padding: '9px 0', borderBottom: `1px solid ${t.ruleColor}`, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa' }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ fontFamily: t.headlineFamily, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, color: t.headlineFg }}>{nl.subject}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: t.metaFg, marginTop: 2, letterSpacing: '0.06em' }}>{nl.sender}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', whiteSpace: 'nowrap' }}>
                {nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: isEco ? '1px solid #ccc' : '2px solid #000', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em' }}>{digest.newsletters.length} ISSUES · CARTA LABEL</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em' }}>PRINT EDITION</span>
      </div>
    </div>
  );
}

// ── Article Page ──────────────────────────────────────────────────────────────
function ArticlePage({ nl, index, total, t }) {
  const paras = getParas(nl.bodyText);
  const lead = paras[0] || '';
  const body = paras.slice(1);
  const wc = paras.join(' ').split(/\s+/).length;
  const rt = Math.max(1, Math.round(wc / 200));
  const date = nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const source = domainFromEmail(nl.senderEmail);
  const isEco = t === TEMPLATES.eco;

  return (
    <div className="digest-page" style={{ width: '210mm', minHeight: '297mm', background: '#fff', border: isEco ? '1px solid #ccc' : '2px solid #000', marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: t.headerBg, color: t.headerFg,
        padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: isEco ? '1px solid #ccc' : 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-sign)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          The Weekend Digest · Carta
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isEco ? '#999' : '#888', letterSpacing: '0.1em' }}>
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      <div style={{ flex: 1, padding: t.margins, display: 'flex', flexDirection: 'column' }}>
        <div style={{ breakInside: 'avoid' }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', border: `1px solid ${t.tagBorder}`, padding: '2px 8px', color: t.tagFg }}>
              {nl.sender}
            </span>
          </div>

          <div style={{ borderTop: isEco ? '1px solid #ccc' : '3px solid #000', paddingTop: 12, marginBottom: 12 }}>
            <h2 style={{ fontFamily: t.headlineFamily, fontSize: t.fontSize.headline, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.95, color: t.headlineFg, margin: 0 }}>
              {nl.subject}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: t.fontSize.meta, color: t.metaFg, letterSpacing: '0.12em', textTransform: 'uppercase', paddingBottom: 16, marginBottom: 18, borderBottom: `1px solid ${t.ruleColor}` }}>
            <span>{date}</span><span>·</span>
            <span>{rt} min read</span>
            {source && <><span>·</span><span>{source}</span></>}
          </div>
        </div>

        {lead && (
          <p style={{ fontFamily: t.fontFamily, fontSize: t.fontSize.lead, lineHeight: 1.75, fontWeight: 500, color: t.bodyFg, marginBottom: 18 }}>
            {lead}
          </p>
        )}

        <div style={{ columns: body.length > 8 ? 2 : 1, columnGap: 28, columnRule: body.length > 8 ? `1px solid ${t.ruleColor}` : 'none' }}>
          {body.map((p, i) => (
            <p key={i} style={{ fontFamily: t.fontFamily, fontSize: t.fontSize.body, lineHeight: 1.8, color: t.bodyFg, marginBottom: 12, breakInside: 'avoid' }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${t.ruleColor}`, padding: '8px 24px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em' }}>
        <span>{nl.sender}</span>
        <span>{wc.toLocaleString()} words</span>
      </div>
    </div>
  );
}

// ── Zine Cover (full A4 landscape — split left/right panels) ─────────────────
function ZineCover({ digest, t }) {
  const date = new Date(digest.builtAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const isEco = t === TEMPLATES.eco;

  return (
    <div className="zine-cover" style={{ width: '297mm', height: '210mm', display: 'flex', breakAfter: 'page', pageBreakAfter: 'always' }}>
      {/* Left: headline */}
      <div style={{ width: '148.5mm', flexShrink: 0, background: isEco ? '#fff' : t.coverBg, color: isEco ? '#111' : t.coverFg, display: 'flex', flexDirection: 'column', padding: '28px', borderRight: isEco ? '1px solid #ccc' : 'none' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: isEco ? '#aaa' : 'rgba(255,255,255,0.5)', marginBottom: 'auto' }}>
          Carta · Zine Edition
        </div>
        <div>
          <div style={{ fontFamily: t.headlineFamily, fontSize: isEco ? 52 : 60, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 0.88, color: isEco ? '#111' : '#fff', borderTop: isEco ? '1px solid #ccc' : '3px solid rgba(255,255,255,0.25)', paddingTop: 14, marginBottom: 16 }}>
            The<br />Week&shy;end<br />Digest
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: isEco ? '#aaa' : 'rgba(255,255,255,0.55)' }}>
            {date}
          </div>
        </div>
      </div>

      {/* Right: TOC */}
      <div style={{ width: '148.5mm', flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', padding: '28px' }}>
        <div style={{ fontFamily: 'var(--font-sign)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.metaFg, marginBottom: 14 }}>
          Contents
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {digest.newsletters.map((nl, i) => (
            <div key={nl.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.ruleColor}`, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ fontFamily: t.headlineFamily, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, color: t.headlineFg }}>{nl.subject}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: t.metaFg, marginTop: 2, letterSpacing: '0.06em' }}>{nl.sender}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${t.ruleColor}`, paddingTop: 10, fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', letterSpacing: '0.1em' }}>
          {digest.newsletters.length} issues · print edition
        </div>
      </div>
    </div>
  );
}

// ── Zine Article (2-col flow across as many A4 landscape sheets as needed) ────
function ZineArticle({ nl, index, total, t }) {
  const paras = getParas(nl.bodyText);
  const lead = paras[0] || '';
  const body = paras.slice(1);
  const wc = paras.join(' ').split(/\s+/).length;
  const rt = Math.max(1, Math.round(wc / 200));
  const date = nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const source = domainFromEmail(nl.senderEmail);
  const isEco = t === TEMPLATES.eco;

  return (
    <div style={{
      breakBefore: 'page', pageBreakBefore: 'always',
      columns: 4, columnGap: '8mm',
      columnRule: `1px solid ${t.ruleColor}`,
    }}>
      {/* Header spans all 4 columns */}
      <div style={{ columnSpan: 'all', breakInside: 'avoid', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${t.ruleColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', border: `1px solid ${t.tagBorder}`, padding: '2px 7px', color: t.tagFg }}>
            {nl.sender}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: t.metaFg, letterSpacing: '0.1em' }}>
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
        <h2 style={{ fontFamily: t.headlineFamily, fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.95, color: t.headlineFg, margin: '0 0 10px', borderTop: isEco ? '1px solid #ccc' : '3px solid #000', paddingTop: 10 }}>
          {nl.subject}
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 8, color: t.metaFg, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>{date}</span><span>·</span>
          <span>{rt} min read</span>
          {source && <><span>·</span><span>{source}</span></>}
        </div>
      </div>

      {/* Lead spans all 4 columns */}
      {lead && (
        <p style={{ columnSpan: 'all', fontFamily: t.fontFamily, fontSize: 12, lineHeight: 1.75, fontWeight: 500, color: t.bodyFg, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${t.ruleColor}` }}>
          {lead}
        </p>
      )}

      {/* Body flows in 4 columns (2 per A5 half) */}
      {body.map((p, i) => (
        <p key={i} style={{ fontFamily: t.fontFamily, fontSize: 10, lineHeight: 1.8, color: t.bodyFg, marginBottom: 10, breakInside: 'avoid' }}>
          {p}
        </p>
      ))}
    </div>
  );
}

// ── Zine Portal ───────────────────────────────────────────────────────────────
function ZinePortal({ digest, t }) {
  const containerRef = useRef(null);
  if (!containerRef.current) {
    let el = document.getElementById('carta-zine-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'carta-zine-container';
      document.body.appendChild(el);
    }
    containerRef.current = el;
  }

  return createPortal(
    <div style={{ width: '297mm' }}>
      <ZineCover digest={digest} t={t} />
      {digest.newsletters.map((nl, i) => (
        <ZineArticle key={nl.id || i} nl={nl} index={i} total={digest.newsletters.length} t={t} />
      ))}
    </div>,
    containerRef.current
  );
}

// ── Mobile reader — reflows content full-width, readable type ────────────────
function MobileReader({ digest, t }) {
  const date = new Date(digest.builtAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={{ background: '#fff' }}>
      {/* Cover */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '2px solid #000' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#888', marginBottom: 16 }}>
          {date}
        </div>
        <div style={{ fontFamily: 'var(--font-sign)', fontSize: 44, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.92, color: '#000', marginBottom: 20 }}>
          The Weekend Digest
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {digest.newsletters.length} issues · Carta label
        </div>
      </div>

      {/* Contents */}
      <div style={{ padding: '16px 20px', borderBottom: '2px solid #000' }}>
        <div style={{ fontFamily: 'var(--font-sign)', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
          Contents
        </div>
        {digest.newsletters.map((nl, i) => (
          <a key={nl.id || i} href={`#article-${i}`} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee', textDecoration: 'none', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.2, color: '#000' }}>{nl.subject}</span>
          </a>
        ))}
      </div>

      {/* Articles */}
      {digest.newsletters.map((nl, i) => {
        const paras = getParas(nl.bodyText);
        const wc = paras.join(' ').split(/\s+/).length;
        const rt = Math.max(1, Math.round(wc / 200));
        const aDate = nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
        const source = domainFromEmail(nl.senderEmail);
        return (
          <article id={`article-${i}`} key={nl.id || i} style={{ padding: '24px 20px', borderBottom: '1px solid #ddd' }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid #000', padding: '2px 8px' }}>
                {nl.sender}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sign)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.98, color: '#000', margin: '0 0 12px', borderTop: '3px solid #000', paddingTop: 12 }}>
              {nl.subject}
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #eee' }}>
              <span>{aDate}</span><span>·</span><span>{rt} min read</span>
              {source && <><span>·</span><span>{source}</span></>}
            </div>
            {paras.map((p, j) => (
              <p key={j} style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7, color: '#1a1a1a', marginBottom: 16, fontWeight: j === 0 ? 500 : 400 }}>
                {p}
              </p>
            ))}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em', marginTop: 8 }}>
              {wc.toLocaleString()} words
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── View ──────────────────────────────────────────────────────────────────────
export default function DigestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [searchParams] = useSearchParams();
  const digests = JSON.parse(localStorage.getItem('carta-digests') || '[]');
  const digest = digests.find(d => String(d.id) === id);

  useEffect(() => {
    if (searchParams.get('print') === '1') {
      setTimeout(() => window.print(), 800);
    }
  }, []);

  const savedTemplate = localStorage.getItem('carta-template') || 'standard';
  const t = TEMPLATES[savedTemplate] || TEMPLATES.standard;

  if (!digest) return (
    <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--grey-mid)' }}>
      Digest not found. <button onClick={() => navigate('/digests')} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back</button>
    </div>
  );

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Ecofont Vera Sans';
          src: url('https://fonts.cdnfonts.com/css/ecofont-vera-sans') format('truetype');
        }
        /* Cover gets zero margin (full bleed); all other pages get safe margins */
        @page { size: 297mm 210mm; margin: 12mm 14mm; }
        @page cover-page { size: 297mm 210mm; margin: 0; }
        .zine-cover { page: cover-page; }
        #carta-zine-container { display: none; }
        @media print {
          body > #root { display: none !important; }
          #carta-zine-container { display: block !important; }
        }
      `}</style>

      {/* Screen nav */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--white)', borderBottom: '2px solid var(--black)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', color: 'var(--grey-mid)', cursor: 'pointer', flexShrink: 0 }}>
          ← Back
        </button>
        <div style={{ flex: 1, fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {digest.week}
        </div>
        {!isMobile && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.08em', marginRight: 8 }}>
            Template: {t.name}
          </div>
        )}
        <Btn primary onClick={() => window.print()}>Print Zine</Btn>
      </div>

      {/* Screen view */}
      {isMobile ? (
        <MobileReader digest={digest} t={t} />
      ) : (
        <div className="digest-screen-wrap" style={{ background: 'var(--grey-bg)', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden' }}>
          <CoverPage digest={digest} t={t} />
          {digest.newsletters.map((nl, i) => (
            <ArticlePage key={nl.id} nl={nl} index={i} total={digest.newsletters.length} t={t} />
          ))}
        </div>
      )}

      <ZinePortal digest={digest} t={t} />
    </>
  );
}
