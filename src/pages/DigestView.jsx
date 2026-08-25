import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Btn } from '../components/ui';
import { useMobile } from '../hooks/useMobile';
import { getDesign, weekLabel } from '../store';

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

// ── Design helpers ────────────────────────────────────────────────────────────
const PAPER_DIMS = {
  'A4':      ['210mm', '297mm'],
  'Letter':  ['215.9mm', '279.4mm'],
  'A5':      ['148mm', '210mm'],
  'Tabloid': ['279.4mm', '431.8mm'],
};

function getPaperSize(paperSize, orientation) {
  const [w, h] = PAPER_DIMS[paperSize] || PAPER_DIMS['A4'];
  return orientation === 'Landscape' ? `${h} ${w}` : `${w} ${h}`;
}

function mergeDesign(baseT, design) {
  return {
    ...baseT,
    fontFamily: design.bodyFont || baseT.fontFamily,
    headlineFamily: design.displayFont || baseT.headlineFamily,
  };
}

// ── Shared: one-sentence teaser from body text ────────────────────────────────
function getTeaser(bodyText, maxChars = 140) {
  const paras = getParas(bodyText);
  if (!paras.length) return '';
  const first = paras[0];
  const sentence = first.match(/^[^.!?]+[.!?]/)?.[0] || first;
  return sentence.length > maxChars ? sentence.slice(0, maxChars).trimEnd() + '…' : sentence;
}

// ── Cover Page ────────────────────────────────────────────────────────────────
function CoverPage({ digest, t }) {
  const week = weekLabel(digest.week);
  const isEco = t === TEMPLATES.eco;
  const rule = isEco ? '1px solid #ccc' : '2px solid #000';

  return (
    <div className="digest-page" style={{ width: '210mm', minHeight: '297mm', background: '#fff', border: rule, marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: t.coverBg, color: t.coverFg, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isEco ? '1px solid #ccc' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-sign)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Carta</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: isEco ? '#999' : '#888' }}>Newsletter Digest</span>
      </div>

      <div style={{ flex: 1, padding: '28px 32px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderTop: isEco ? '1px solid #ccc' : '3px solid #000', paddingTop: 12, marginBottom: 6 }}>
          <div style={{ fontFamily: t.headlineFamily, fontSize: isEco ? 66 : 84, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 0.88, color: t.headlineFg }}>
            CARTA
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.metaFg, marginBottom: 20 }}>{week}</div>

        <div style={{ borderTop: isEco ? '1px solid #ccc' : '2px solid #000' }}>
          <div style={{ background: isEco ? 'transparent' : '#000', color: isEco ? t.metaFg : '#fff', padding: isEco ? '7px 0' : '6px 0 6px 12px', fontFamily: 'var(--font-sign)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', borderBottom: isEco ? '1px solid #ccc' : 'none' }}>
            Contents
          </div>
          {digest.newsletters.map((nl, i) => {
            const teaser = getTeaser(nl.bodyText);
            return (
              <div key={nl.id || i} style={{ padding: '9px 0', borderBottom: `1px solid ${t.ruleColor}` }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: teaser ? 3 : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.metaFg }}>{nl.sender}</div>
                    <div style={{ fontFamily: t.headlineFamily, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, color: t.headlineFg }}>{nl.subject}</div>
                  </div>
                </div>
                {teaser && <div style={{ paddingLeft: 22, fontFamily: t.fontFamily, fontSize: 10, lineHeight: 1.6, color: t.metaFg }}>{teaser}</div>}
              </div>
            );
          })}
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
          Carta
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

// ── Portrait Print Portal ─────────────────────────────────────────────────────
function PrintCoverPage({ digest, t }) {
  const week = weekLabel(digest.week);
  const isEco = t === TEMPLATES.eco;
  const rule = isEco ? '1pt solid #ccc' : '2pt solid #000';

  return (
    <div style={{ breakAfter: 'page', pageBreakAfter: 'always' }}>
      <div style={{ background: t.coverBg, color: t.coverFg, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isEco ? '1pt solid #ccc' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-sign)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Carta</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: isEco ? '#999' : '#888' }}>Newsletter Digest</span>
      </div>
      <div style={{ padding: '28px 32px 0' }}>
        <div style={{ borderTop: isEco ? '1pt solid #ccc' : '3pt solid #000', paddingTop: 12, marginBottom: 6 }}>
          <div style={{ fontFamily: t.headlineFamily, fontSize: isEco ? 66 : 84, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 0.88, color: t.headlineFg }}>
            CARTA
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.metaFg, marginBottom: 20 }}>{week}</div>
        <div style={{ borderTop: rule }}>
          <div style={{ background: isEco ? 'transparent' : '#000', color: isEco ? t.metaFg : '#fff', padding: isEco ? '7px 0' : '6px 0 6px 12px', fontFamily: 'var(--font-sign)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', borderBottom: isEco ? '1pt solid #ccc' : 'none' }}>
            Contents
          </div>
          {digest.newsletters.map((nl, i) => {
            const teaser = getTeaser(nl.bodyText);
            return (
              <div key={nl.id || i} style={{ padding: '9pt 0', borderBottom: `1pt solid ${t.ruleColor}` }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: teaser ? 3 : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.metaFg }}>{nl.sender}</div>
                    <div style={{ fontFamily: t.headlineFamily, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, color: t.headlineFg }}>{nl.subject}</div>
                  </div>
                </div>
                {teaser && <div style={{ paddingLeft: 22, fontFamily: t.fontFamily, fontSize: 10, lineHeight: 1.6, color: t.metaFg }}>{teaser}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: rule, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em' }}>{digest.newsletters.length} ISSUES · CARTA LABEL</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em' }}>PRINT EDITION</span>
      </div>
    </div>
  );
}

function PrintArticlePage({ nl, index, total, t, design, pageNum }) {
  const paras = getParas(nl.bodyText);
  const lead = paras[0] || '';
  const body = paras.slice(1);
  const wc = paras.join(' ').split(/\s+/).length;
  const rt = Math.max(1, Math.round(wc / 200));
  const date = nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const source = domainFromEmail(nl.senderEmail);
  const isEco = t === TEMPLATES.eco;

  const colCount =
    design.layout === 'Two column'      ? 2 :
    design.layout === 'Newspaper grid'  ? 3 :
    design.layout === 'Full bleed'      ? 1 :
    body.length > 8 ? 2 : 1;

  return (
    <div style={{ breakAfter: 'page', pageBreakAfter: 'always' }}>
      <div style={{ background: t.headerBg, color: t.headerFg, padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isEco ? '1pt solid #ccc' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-sign)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Carta
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isEco ? '#999' : '#888', letterSpacing: '0.1em' }}>
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <div style={{ padding: t.margins }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', border: `1pt solid ${t.tagBorder}`, padding: '2px 8px', color: t.tagFg }}>
            {nl.sender}
          </span>
        </div>
        <div style={{ borderTop: isEco ? '1pt solid #ccc' : '3pt solid #000', paddingTop: 10, marginBottom: 10 }}>
          <h2 style={{ fontFamily: t.headlineFamily, fontSize: t.fontSize.headline, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.95, color: t.headlineFg, margin: 0 }}>
            {nl.subject}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: t.fontSize.meta, color: t.metaFg, letterSpacing: '0.12em', textTransform: 'uppercase', paddingBottom: 14, marginBottom: 16, borderBottom: `1pt solid ${t.ruleColor}` }}>
          <span>{date}</span><span>·</span>
          <span>{rt} min read</span>
          {source && <><span>·</span><span>{source}</span></>}
        </div>
        {lead && (
          <p style={{ fontFamily: t.fontFamily, fontSize: t.fontSize.lead, lineHeight: 1.75, fontWeight: 500, color: t.bodyFg, marginBottom: 16 }}>
            {lead}
          </p>
        )}
        <div style={{ columns: colCount, columnGap: 28, columnRule: colCount > 1 ? `1pt solid ${t.ruleColor}` : 'none' }}>
          {body.map((p, i) => (
            <p key={i} style={{ fontFamily: t.fontFamily, fontSize: t.fontSize.body, lineHeight: 1.8, color: t.bodyFg, marginBottom: 12, breakInside: 'avoid' }}>
              {p}
            </p>
          ))}
        </div>
        <div style={{ borderTop: `1pt solid ${t.ruleColor}`, paddingTop: 8, marginTop: 16, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.1em' }}>
          <span>{nl.sender}</span>
          {design.pageNums ? <span>{pageNum}</span> : <span>{wc.toLocaleString()} words</span>}
        </div>
      </div>
    </div>
  );
}

function PortraitPortal({ digest, t, design }) {
  const containerRef = useRef(null);
  if (!containerRef.current) {
    let el = document.getElementById('carta-portrait-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'carta-portrait-container';
      document.body.appendChild(el);
    }
    containerRef.current = el;
  }
  let pageNum = 0;
  return createPortal(
    <div>
      {design.coverPage && (() => { pageNum++; return <PrintCoverPage key="cover" digest={digest} t={t} />; })()}
      {digest.newsletters.map((nl, i) => {
        pageNum++;
        return <PrintArticlePage key={nl.id || i} nl={nl} index={i} total={digest.newsletters.length} t={t} design={design} pageNum={pageNum} />;
      })}
    </div>,
    containerRef.current
  );
}

// ── Zine pagination ───────────────────────────────────────────────────────────
// Word limits per A5 panel (2 col, 8.5px text). Conservative so content fits.
const ZINE_FIRST_WORDS = 200; // first panel: header+lead eat ~40% of height
const ZINE_CONT_WORDS  = 420; // continuation panels: full 2-col height

function paginateArticle(nl) {
  const paras  = getParas(nl.bodyText);
  const lead   = paras[0] || '';
  const body   = paras.slice(1);
  const pages  = [];

  let firstBody = [], fw = lead.split(/\s+/).length;
  for (const p of body) {
    const w = p.split(/\s+/).length;
    if (fw + w > ZINE_FIRST_WORDS && firstBody.length > 0) break;
    firstBody.push(p); fw += w;
  }
  pages.push({ lead, body: firstBody, isFirst: true });

  let chunk = [], cw = 0;
  for (const p of body.slice(firstBody.length)) {
    const w = p.split(/\s+/).length;
    if (cw + w > ZINE_CONT_WORDS && chunk.length > 0) {
      pages.push({ lead: null, body: chunk, isFirst: false });
      chunk = [p]; cw = w;
    } else { chunk.push(p); cw += w; }
  }
  if (chunk.length > 0) pages.push({ lead: null, body: chunk, isFirst: false });

  return pages;
}

// ── A5 panel components (148.5mm × 210mm each) ───────────────────────────────
function ZinePanelCoverLeft({ digest, t }) {
  const date = new Date(digest.builtAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const isEco = t === TEMPLATES.eco;
  return (
    <div style={{ width: '148.5mm', height: '210mm', background: isEco ? '#fff' : t.coverBg, color: isEco ? '#111' : '#fff', display: 'flex', flexDirection: 'column', padding: '20px 22px', boxSizing: 'border-box', borderRight: `0.5pt solid ${isEco ? '#ccc' : '#333'}`, overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: isEco ? '#aaa' : 'rgba(255,255,255,0.4)', marginBottom: 'auto' }}>
        Carta · Zine Edition
      </div>
      <div>
        <div style={{ fontFamily: t.headlineFamily, fontSize: isEco ? 50 : 56, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 0.88, borderTop: isEco ? '1pt solid #ccc' : '2pt solid rgba(255,255,255,0.2)', paddingTop: 12, marginBottom: 12 }}>
          The<br />Week&shy;end<br />Digest
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: isEco ? '#aaa' : 'rgba(255,255,255,0.45)' }}>
          {date}
        </div>
      </div>
    </div>
  );
}

function ZinePanelCoverRight({ digest, t }) {
  const isEco = t === TEMPLATES.eco;
  return (
    <div style={{ width: '148.5mm', height: '210mm', background: '#fff', display: 'flex', flexDirection: 'column', padding: '20px 22px', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-sign)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.metaFg, marginBottom: 10 }}>
        Contents
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {digest.newsletters.map((nl, i) => (
          <div key={nl.id || i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `0.5pt solid ${t.ruleColor}`, alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#bbb', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div style={{ fontFamily: t.headlineFamily, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, color: t.headlineFg }}>{nl.subject}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: t.metaFg, marginTop: 2 }}>{nl.sender}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `0.5pt solid ${t.ruleColor}`, paddingTop: 7, fontFamily: 'var(--font-mono)', fontSize: 7, color: '#bbb', letterSpacing: '0.1em' }}>
        {digest.newsletters.length} issues · fold & staple on short edge
      </div>
    </div>
  );
}

function ZinePanelArticle({ nl, index, total, t, lead, body, isFirst, pageNum }) {
  const wc  = getParas(nl.bodyText).join(' ').split(/\s+/).length;
  const rt  = Math.max(1, Math.round(wc / 200));
  const date = nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const isEco = t === TEMPLATES.eco;

  return (
    <div style={{ width: '148.5mm', height: '210mm', background: '#fff', display: 'flex', flexDirection: 'column', padding: '11mm 12mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      {isFirst ? (
        <div style={{ flexShrink: 0, marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 5, marginBottom: 6, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.metaFg }}>Carta Zine</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg }}>{String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, border: `0.5pt solid ${t.tagBorder}`, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.tagFg }}>
              {nl.sender}
            </span>
          </div>
          <h2 style={{ fontFamily: t.headlineFamily, fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.95, color: t.headlineFg, margin: 0, borderTop: isEco ? '0.5pt solid #ccc' : '2pt solid #000', paddingTop: 6, marginBottom: 6 }}>
            {nl.subject}
          </h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg, letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: 7, marginBottom: 7, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
            {date}{rt ? ` · ${rt} min` : ''} · {wc.toLocaleString()} words
          </div>
        </div>
      ) : (
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', paddingBottom: 5, marginBottom: 7, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{nl.sender}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: '#ccc' }}>{pageNum}</span>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', columns: 2, columnGap: '4mm', columnRule: `0.5pt solid ${t.ruleColor}` }}>
        {lead && isFirst && (
          <p style={{ columnSpan: 'all', fontFamily: t.fontFamily, fontSize: 9, lineHeight: 1.7, fontWeight: 500, color: t.bodyFg, marginBottom: 7, paddingBottom: 7, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
            {lead}
          </p>
        )}
        {body.map((p, i) => (
          <p key={i} style={{ fontFamily: t.fontFamily, fontSize: 8, lineHeight: 1.75, color: t.bodyFg, marginBottom: 5, breakInside: 'avoid' }}>
            {p}
          </p>
        ))}
      </div>

      <div style={{ flexShrink: 0, borderTop: `0.5pt solid ${t.ruleColor}`, paddingTop: 4, marginTop: 4, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 6.5, color: '#ccc' }}>
        {pageNum}
      </div>
    </div>
  );
}

function ZinePanelBlank({ pageNum }) {
  return (
    <div style={{ width: '148.5mm', height: '210mm', background: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '11mm 12mm', boxSizing: 'border-box' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: '#e8e8e8' }}>{pageNum}</span>
    </div>
  );
}

// ── Zine Portal — saddle-stitch imposition ────────────────────────────────────
//    Sheet k front: [page N-2k+2 | page 2k-1]   (pages 1-indexed)
//    Sheet k back:  [page 2k     | page N-2k+1]
//    Print double-sided, flip on short edge, fold, staple.
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

  // Build reading-order panel list
  const panels = [
    <ZinePanelCoverLeft  key="cl" digest={digest} t={t} />,
    <ZinePanelCoverRight key="cr" digest={digest} t={t} />,
  ];
  digest.newsletters.forEach((nl, ai) => {
    paginateArticle(nl).forEach((pg, pi) => {
      const pageNum = panels.length + 1;
      panels.push(
        <ZinePanelArticle key={`${ai}-${pi}`}
          nl={nl} index={ai} total={digest.newsletters.length}
          t={t} lead={pg.lead} body={pg.body} isFirst={pg.isFirst}
          pageNum={pageNum} />
      );
    });
  });
  while (panels.length % 4 !== 0)
    panels.push(<ZinePanelBlank key={`b${panels.length}`} pageNum={panels.length + 1} />);

  const N = panels.length;
  const sheets = [];
  for (let k = 1; k <= N / 4; k++) {
    const fl = panels[N - 2 * k + 1];
    const fr = panels[2 * k - 2];
    const bl = panels[2 * k - 1];
    const br = panels[N - 2 * k];
    const last = k === N / 4;
    sheets.push(
      <div key={`${k}f`} style={{ width: '297mm', height: '210mm', display: 'flex', breakAfter: 'page', pageBreakAfter: 'always' }}>
        <div style={{ borderRight: '0.5pt dashed #ddd', overflow: 'hidden' }}>{fl}</div>
        <div style={{ overflow: 'hidden' }}>{fr}</div>
      </div>
    );
    sheets.push(
      <div key={`${k}b`} style={{ width: '297mm', height: '210mm', display: 'flex', breakAfter: last ? 'avoid' : 'page', pageBreakAfter: last ? 'avoid' : 'always' }}>
        <div style={{ borderRight: '0.5pt dashed #ddd', overflow: 'hidden' }}>{bl}</div>
        <div style={{ overflow: 'hidden' }}>{br}</div>
      </div>
    );
  }

  return createPortal(<div>{sheets}</div>, containerRef.current);
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
  const design = getDesign();
  const t = mergeDesign(TEMPLATES[savedTemplate] || TEMPLATES.standard, design);

  function printPortrait() {
    const s = document.createElement('style');
    s.textContent = `@page { size: ${getPaperSize(design.paperSize, design.orientation)}; margin: 16mm 18mm; }`;
    document.head.appendChild(s);
    document.body.classList.add('carta-print-portrait');
    window.print();
    document.head.removeChild(s);
    document.body.classList.remove('carta-print-portrait');
  }

  function printZine() {
    const s = document.createElement('style');
    s.textContent = `@page { size: 297mm 210mm; margin: 0; }`;
    document.head.appendChild(s);
    document.body.classList.add('carta-print-zine');
    window.print();
    document.head.removeChild(s);
    document.body.classList.remove('carta-print-zine');
  }

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
        #carta-portrait-container, #carta-zine-container { display: none; }
        @media print {
          body > #root { display: none !important; }
          body.carta-print-portrait #carta-portrait-container { display: block !important; }
          body.carta-print-zine     #carta-zine-container     { display: block !important; }
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
        <Btn onClick={printPortrait}>Print</Btn>
        <Btn primary onClick={printZine}>Print Zine</Btn>
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

      <PortraitPortal digest={digest} t={t} design={design} />
      <ZinePortal digest={digest} t={t} />
    </>
  );
}
