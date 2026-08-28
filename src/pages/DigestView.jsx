import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Btn } from '../components/ui';
import { useMobile } from '../hooks/useMobile';
import { getDesign } from '../store';
import { getParas, domainFromEmail, getTeaser } from '../lib/text';
import { downloadDigestHtml } from '../lib/digestHtml';

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
// Explicit mm dimensions rather than named size + orientation keyword —
// browsers are unreliable about honoring "size: A4 landscape" but always
// respect literal "size: <w>mm <h>mm".
const PAPER_DIMENSIONS_MM = {
  A4: [210, 297],
  Letter: [215.9, 279.4],
  A5: [148.5, 210],
  Tabloid: [279.4, 431.8],
};

function getPaperSize(paperSize, orientation) {
  const [w, h] = PAPER_DIMENSIONS_MM[paperSize] || PAPER_DIMENSIONS_MM.A4;
  const [width, height] = orientation === 'Landscape' ? [h, w] : [w, h];
  return `${width}mm ${height}mm`;
}

function mergeDesign(baseT, design) {
  return {
    ...baseT,
    fontFamily: design.bodyFont || baseT.fontFamily,
    headlineFamily: design.displayFont || baseT.headlineFamily,
  };
}

// ── Portrait Print Portal ─────────────────────────────────────────────────────
function PrintCoverPage({ digest, t }) {
  const week = digest.week;
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

// ── Zine pagination via DOM measurement ──────────────────────────────────────
// Renders all remaining paragraphs into a hidden panel replica with real CSS
// 2-column layout, then uses getBoundingClientRect to detect which paragraphs
// are fully visible vs clipped by overflow:hidden.
function measureZinePanels(digest, t) {
  const isEco = t === TEMPLATES.eco;
  const panel = document.createElement('div');
  panel.style.cssText = 'position:absolute;left:-9999px;width:148.5mm;height:210mm;padding:8mm 10mm;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden';
  document.body.appendChild(panel);
  const results = [];

  for (const [ai, nl] of digest.newsletters.entries()) {
    const paras = getParas(nl.bodyText);
    const lead = paras[0] || '';
    const body = paras.slice(1);
    const wc = paras.join(' ').split(/\s+/).length;
    const rt = Math.max(1, Math.round(wc / 200));
    const date = nl.date ? new Date(nl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    let rem = body.slice();
    let first = true;

    do {
      panel.innerHTML = '';

      const hd = document.createElement('div');
      if (first) {
        hd.style.cssText = 'flex-shrink:0;margin-bottom:5px';
        const mkLabel = (text) => {
          const s = document.createElement('span');
          s.style.cssText = `font-family:var(--font-mono);font-size:6.5px;letter-spacing:.1em;text-transform:uppercase;color:${t.metaFg}`;
          s.textContent = text;
          return s;
        };
        const rh = document.createElement('div');
        rh.style.cssText = `display:flex;justify-content:space-between;padding-bottom:3px;margin-bottom:4px;border-bottom:.5pt solid ${t.ruleColor}`;
        rh.append(mkLabel('Carta'), mkLabel(`${String(ai + 1).padStart(2, '0')}/${String(digest.newsletters.length).padStart(2, '0')}`));
        hd.appendChild(rh);
        const tw = document.createElement('div');
        tw.style.marginBottom = '4px';
        const tag = document.createElement('span');
        tag.style.cssText = `font-family:var(--font-mono);font-size:6.5px;border:.5pt solid ${t.tagBorder};padding:1px 5px;text-transform:uppercase;letter-spacing:.1em;color:${t.tagFg}`;
        tag.textContent = nl.sender;
        tw.appendChild(tag);
        hd.appendChild(tw);
        const h2 = document.createElement('h2');
        h2.style.cssText = `font-family:${t.headlineFamily};font-size:17px;font-weight:800;letter-spacing:-.01em;text-transform:uppercase;line-height:.95;color:${t.headlineFg};margin:0;border-top:${isEco ? '.5pt solid #ccc' : '2pt solid #000'};padding-top:5px;margin-bottom:5px`;
        h2.textContent = nl.subject;
        hd.appendChild(h2);
        const md = document.createElement('div');
        md.style.cssText = `font-family:var(--font-mono);font-size:6.5px;color:${t.metaFg};letter-spacing:.08em;text-transform:uppercase;padding-bottom:5px;margin-bottom:5px;border-bottom:.5pt solid ${t.ruleColor}`;
        md.textContent = `${date}${rt ? ` · ${rt} min` : ''}`;
        hd.appendChild(md);
      } else {
        hd.style.cssText = `flex-shrink:0;display:flex;justify-content:space-between;padding-bottom:3px;margin-bottom:5px;border-bottom:.5pt solid ${t.ruleColor}`;
        const s1 = document.createElement('span');
        s1.style.cssText = `font-family:var(--font-mono);font-size:6.5px;color:${t.metaFg};letter-spacing:.1em;text-transform:uppercase`;
        s1.textContent = nl.sender;
        hd.appendChild(s1);
        const s2 = document.createElement('span');
        s2.style.cssText = 'font-family:var(--font-mono);font-size:6.5px;color:#ccc';
        s2.textContent = '—';
        hd.appendChild(s2);
      }
      panel.appendChild(hd);

      const bd = document.createElement('div');
      bd.style.cssText = `flex:1;overflow:hidden;columns:2;column-fill:auto;column-gap:4mm;column-rule:.5pt solid ${t.ruleColor}`;
      panel.appendChild(bd);

      const ft = document.createElement('div');
      ft.style.cssText = `flex-shrink:0;border-top:.5pt solid ${t.ruleColor};padding-top:3px;margin-top:3px;text-align:center;font-family:var(--font-mono);font-size:6px;color:#ccc`;
      ft.textContent = '·';
      panel.appendChild(ft);

      if (lead && first) {
        const lp = document.createElement('p');
        lp.style.cssText = `column-span:all;font-family:${t.fontFamily};font-size:10px;line-height:1.55;font-weight:500;color:${t.bodyFg};margin:0 0 5px;padding:0 0 5px;border-bottom:.5pt solid ${t.ruleColor}`;
        lp.textContent = lead;
        bd.appendChild(lp);
      }

      // Render ALL remaining paragraphs into the 2-column body
      const paraEls = [];
      for (const text of rem) {
        const p = document.createElement('p');
        p.style.cssText = `font-family:${t.fontFamily};font-size:9.5px;line-height:1.55;color:${t.bodyFg};margin:0;text-indent:1em`;
        p.textContent = text;
        bd.appendChild(p);
        paraEls.push(p);
      }

      // Detect which paragraphs fit: multi-column overflow is horizontal
      // (content flows into virtual columns 3, 4, … to the right), so check
      // both vertical AND horizontal bounds.
      const bdRect = bd.getBoundingClientRect();
      const fitsBounds = (el) => {
        const r = el.getBoundingClientRect();
        return r.bottom <= bdRect.bottom + 1 && r.right <= bdRect.right + 1;
      };
      let fit = 0;
      for (let i = 0; i < paraEls.length; i++) {
        if (!fitsBounds(paraEls[i])) break;
        fit = i + 1;
      }

      const panelBody = rem.slice(0, fit);
      let nextRem = rem.slice(fit);

      // The first paragraph that doesn't fully fit gets split at a word
      // boundary via binary search, so the overflowing tail carries over
      // to the next panel instead of being lost to overflow:hidden.
      if (fit < paraEls.length) {
        const words = rem[fit].split(' ');
        const boundaryEl = paraEls[fit];
        let lo = 0, hi = words.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          boundaryEl.textContent = words.slice(0, mid).join(' ');
          if (fitsBounds(boundaryEl)) lo = mid; else hi = mid - 1;
        }
        if (lo > 0) {
          panelBody.push(words.slice(0, lo).join(' '));
          nextRem = [words.slice(lo).join(' '), ...nextRem.slice(1)];
        }
      }

      // Safety net: guarantee forward progress even in the pathological
      // case where not even a single word fits on this panel.
      if (panelBody.length === 0 && nextRem.length > 0) {
        const words = nextRem[0].split(' ');
        panelBody.push(words[0]);
        const rest = words.slice(1).join(' ');
        nextRem = [rest, ...nextRem.slice(1)].filter(p => p.length > 0);
      }

      results.push({ nl, ai, lead: first ? lead : null, body: panelBody, isFirst: first });
      rem = nextRem;
      first = false;
    } while (rem.length > 0);
  }

  panel.remove();
  return results;
}

// ── A5 panel components (148.5mm × 210mm each) ───────────────────────────────
const MM_TO_PX = 96 / 25.4;
const COVER_PANEL_WIDTH_PX = 148.5 * MM_TO_PX;

function ZinePanelCover({ digest, t }) {
  const week = digest.week;
  const [weekFontSize, setWeekFontSize] = useState(20);

  useEffect(() => {
    document.fonts.ready.then(() => {
      // Measured via an off-screen probe (not the real, hidden-until-print
      // panel) — an element inside a display:none ancestor always reports
      // zero size, so the real node can't be measured directly here.
      const baseSize = 20;
      const probe = document.createElement('div');
      probe.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;line-height:1;font-family:var(--font-mono);font-weight:700;letter-spacing:-0.01em;text-transform:uppercase;font-size:${baseSize}px`;
      probe.textContent = week;
      document.body.appendChild(probe);
      const naturalWidth = probe.getBoundingClientRect().width;
      probe.remove();
      if (!naturalWidth) return;
      const targetWidth = COVER_PANEL_WIDTH_PX * 0.98;
      setWeekFontSize(baseSize * (targetWidth / naturalWidth));
    });
  }, [week]);

  return (
    <div style={{ width: '148.5mm', height: '210mm', background: '#fff', color: '#111', display: 'flex', flexDirection: 'column', padding: '14px 18px', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 6, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>
        Carta · Zine Edition
      </div>
      <div style={{ margin: '0 -18px', marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ fontFamily: t.headlineFamily, fontSize: 176, fontWeight: 800, letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 0.82, color: '#000', whiteSpace: 'nowrap', textAlign: 'center' }}>
          CARTA
        </div>
      </div>
      <div style={{ margin: '0 -18px', marginBottom: 10, paddingBottom: 8, borderBottom: '1pt solid #000', overflow: 'hidden' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: weekFontSize, fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', color: '#000', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1 }}>
          {week}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {digest.newsletters.map((nl, i) => {
          const teaser = getTeaser(nl.bodyText, 80);
          return (
            <div key={nl.id || i} style={{ padding: '4px 0', borderBottom: `0.5pt solid ${t.ruleColor}` }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6, color: '#bbb', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 5.5, color: t.metaFg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{nl.sender}</div>
                  <div style={{ fontFamily: t.headlineFamily, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, color: t.headlineFg }}>{nl.subject}</div>
                </div>
              </div>
              {teaser && <div style={{ paddingLeft: 14, fontFamily: t.fontFamily, fontSize: 6, lineHeight: 1.4, color: t.metaFg }}>{teaser}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: `0.5pt solid ${t.ruleColor}`, paddingTop: 5, fontFamily: 'var(--font-mono)', fontSize: 6, color: '#bbb', letterSpacing: '0.1em' }}>
        {digest.newsletters.length} issues · fold & staple
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
    <div style={{ width: '148.5mm', height: '210mm', background: '#fff', display: 'flex', flexDirection: 'column', padding: '8mm 10mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      {isFirst ? (
        <div style={{ flexShrink: 0, marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 3, marginBottom: 4, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.metaFg }}>Carta</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg }}>{String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, border: `0.5pt solid ${t.tagBorder}`, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.tagFg }}>
              {nl.sender}
            </span>
          </div>
          <h2 style={{ fontFamily: t.headlineFamily, fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.95, color: t.headlineFg, margin: 0, borderTop: isEco ? '0.5pt solid #ccc' : '2pt solid #000', paddingTop: 5, marginBottom: 5 }}>
            {nl.subject}
          </h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg, letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: 5, marginBottom: 5, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
            {date}{rt ? ` · ${rt} min` : ''}
          </div>
        </div>
      ) : (
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', gap: 10, paddingBottom: 3, marginBottom: 5, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{nl.sender}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: t.metaFg, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nl.subject}</span>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', columns: 2, columnFill: 'auto', columnGap: '4mm', columnRule: `0.5pt solid ${t.ruleColor}` }}>
        {lead && isFirst && (
          <p style={{ columnSpan: 'all', fontFamily: t.fontFamily, fontSize: 10, lineHeight: 1.55, fontWeight: 500, color: t.bodyFg, marginBottom: 5, paddingBottom: 5, borderBottom: `0.5pt solid ${t.ruleColor}` }}>
            {lead}
          </p>
        )}
        {body.map((p, i) => (
          <p key={i} style={{ fontFamily: t.fontFamily, fontSize: 9.5, lineHeight: 1.55, color: t.bodyFg, margin: 0, textIndent: '1em' }}>
            {p}
          </p>
        ))}
      </div>

      <div style={{ flexShrink: 0, borderTop: `0.5pt solid ${t.ruleColor}`, paddingTop: 3, marginTop: 3, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 6, color: '#ccc' }}>
        {pageNum}
      </div>
    </div>
  );
}

function ZinePanelBlank({ pageNum, isBackCover }) {
  return (
    <div style={{ width: '148.5mm', height: '210mm', background: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '11mm 12mm', boxSizing: 'border-box' }}>
      {isBackCover ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb' }}>made with carta.fatto.studio</span>
      ) : (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: '#e8e8e8' }}>{pageNum}</span>
      )}
    </div>
  );
}

// ── Zine Portal — saddle-stitch imposition ────────────────────────────────────
//    Sheet k front: [page N-2k+2 | page 2k-1]   (pages 1-indexed)
//    Sheet k back:  [page 2k     | page N-2k+1]
//    Print double-sided, flip on short edge, fold, staple.
function ZinePortal({ digest, t }) {
  const containerRef = useRef(null);
  const [panelData, setPanelData] = useState(null);

  if (!containerRef.current) {
    let el = document.getElementById('carta-zine-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'carta-zine-container';
      document.body.appendChild(el);
    }
    containerRef.current = el;
  }

  useEffect(() => {
    document.fonts.ready.then(() => {
      setPanelData(measureZinePanels(digest, t));
    });
  }, [digest, t]);

  if (!panelData) return createPortal(<div />, containerRef.current);

  const panels = [
    <ZinePanelCover key="cover" digest={digest} t={t} />,
    <ZinePanelBlank key="ifc" pageNum="" />,
  ];
  panelData.forEach((pg, i) => {
    const pageNum = panels.length + 1;
    panels.push(
      <ZinePanelArticle key={`a${i}`}
        nl={pg.nl} index={pg.ai} total={digest.newsletters.length}
        t={t} lead={pg.lead} body={pg.body} isFirst={pg.isFirst}
        pageNum={pageNum} />
    );
  });
  // The outermost (cover) sheet must be printed on one side only: its inner
  // face — the inside front cover (page 2) and the inside back cover
  // (page N-1) — stays blank. Page 2 is already a blank; pad the body so the
  // two reserved trailing blanks land on a 4-page boundary, then append them.
  while ((panels.length + 2) % 4 !== 0) {
    panels.push(<ZinePanelBlank key={`pad${panels.length}`} pageNum="" />);
  }
  panels.push(<ZinePanelBlank key="ibc" pageNum="" />);
  panels.push(<ZinePanelBlank key="obc" pageNum="" isBackCover />);

  // Landscape A4 spread, drawn straight: two 148.5mm A5 panels side by side,
  // full bleed, no rotation and no scaling. A CSS transform here gets baked into
  // the PDF as a matrix that Preview.app renders off-centre (Acrobat handles it,
  // Preview doesn't, and the print follows Preview). Drawn straight, every
  // viewer and printer agrees. Print A4 landscape at 100% — or A4 Borderless so
  // nothing is clipped. Front and back share this layout, so the centre fold
  // guide registers between the two sides.
  const sheet = (key, left, right, isLast) => (
    <div key={key} style={{
      width: '297mm', height: '210mm', position: 'relative', display: 'flex', overflow: 'hidden',
      breakAfter: isLast ? 'avoid' : 'page',
      pageBreakAfter: isLast ? 'avoid' : 'always',
    }}>
      <div style={{ width: '148.5mm', overflow: 'hidden' }}>{left}</div>
      <div style={{ width: '148.5mm', overflow: 'hidden' }}>{right}</div>
      {/* fold guide at the true centre of the spread */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '148.5mm', borderLeft: '0.4pt dashed #b0b0b0' }} />
    </div>
  );

  const N = panels.length;
  const sheets = [];
  for (let k = 1; k <= N / 4; k++) {
    sheets.push(sheet(`${k}f`, panels[N - 2 * k + 1], panels[2 * k - 2], false));
    sheets.push(sheet(`${k}b`, panels[2 * k - 1], panels[N - 2 * k], k === N / 4));
  }

  return createPortal(<div>{sheets}</div>, containerRef.current);
}

// ── Digest reader — single-column, responsive screen view (desktop + mobile) ─
function DigestReader({ digest, t }) {
  const week = digest.week;

  return (
    <div style={{ background: '#fff', maxWidth: 720, margin: '0 auto' }}>
      {/* Cover */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '2px solid #000' }}>
        <div style={{ fontFamily: 'var(--font-sign)', fontSize: 44, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 0.92, color: '#000', marginBottom: 8 }}>
          CARTA
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: 16 }}>
          {week}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {digest.newsletters.length} issues
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
      setTimeout(() => printDigest(), 800);
    }
  }, []);

  const savedTemplate = localStorage.getItem('carta-template') || 'standard';
  const design = getDesign();
  const t = mergeDesign(TEMPLATES[savedTemplate] || TEMPLATES.standard, design);

  function printWithMode(mode, pageRule) {
    document.getElementById('carta-print-page-rule')?.remove();
    const s = document.createElement('style');
    s.id = 'carta-print-page-rule';
    s.textContent = pageRule;
    document.head.appendChild(s);
    document.body.classList.add(mode);

    const cleanup = () => {
      document.body.classList.remove(mode);
      s.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  function printPortrait() {
    printWithMode(
      'carta-print-portrait',
      `@page { size: ${getPaperSize(design.paperSize, design.orientation)}; margin: 16mm 18mm; }`
    );
  }

  function printZine() {
    printWithMode(
      'carta-print-zine',
      `@page { size: 297mm 210mm; margin: 0; }`
    );
  }

  function printDigest() {
    if (design.printFormat === 'Zine') printZine();
    else printPortrait();
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
          html, body { margin: 0 !important; padding: 0 !important; }
          body > #root { display: none !important; }
          #carta-portrait-container, #carta-zine-container { margin: 0 !important; padding: 0 !important; }
          body.carta-print-portrait #carta-portrait-container { display: block !important; }
          body.carta-print-zine     #carta-zine-container     { display: block !important; }
        }
      `}</style>

      {/* Screen nav — a column on mobile so the digest title keeps its full width */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--white)', borderBottom: '2px solid var(--black)', padding: '10px 16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: isMobile ? 'none' : 1 }}>
          <button onClick={() => navigate(-1)} style={{ fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', color: 'var(--grey-mid)', cursor: 'pointer', flexShrink: 0 }}>
            ← Back
          </button>
          <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: isMobile ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {digest.week}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {!isMobile && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.08em', marginRight: 4 }}>
              {t.name} · {design.printFormat}
            </div>
          )}
          <Btn onClick={() => downloadDigestHtml(digest)}>Download</Btn>
          <Btn primary onClick={printDigest}>Print</Btn>
        </div>
      </div>

      {/* Screen view — single column, responsive at every width */}
      <DigestReader digest={digest} t={t} />

      <PortraitPortal digest={digest} t={t} design={design} />
      <ZinePortal digest={digest} t={t} />
    </>
  );
}
