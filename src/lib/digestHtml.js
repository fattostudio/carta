// Build a single self-contained HTML document for one digest — every style
// inline, no scripts, no same-origin assets — so it opens in any browser with
// no server and no network. Mirrors the on-screen DigestReader layout.

import { getParas, domainFromEmail } from './text';

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slug = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'digest';

export function digestFilename(digest) {
  return `carta-${slug(digest?.week || 'digest')}.html`;
}

// Font stacks that hold up offline; the Google Fonts link is a nicety that
// simply no-ops when there's no connection.
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@700;800&family=DM+Mono&display=swap';
const SIGN = "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const BODY = "'Barlow', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif";

function articleHtml(nl, i) {
  const paras = getParas(nl.bodyText);
  const wc = paras.join(' ').split(/\s+/).filter(Boolean).length;
  const rt = Math.max(1, Math.round(wc / 200));
  const aDate = nl.date
    ? new Date(nl.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const source = domainFromEmail(nl.senderEmail);
  const meta = [aDate, `${rt} min read`, source].filter(Boolean).map(esc).join(' &middot; ');
  const body = paras.length
    ? paras.map((p, j) => `<p${j === 0 ? ' class="lead"' : ''}>${esc(p)}</p>`).join('\n')
    : '<p class="empty">No readable text was captured for this issue.</p>';

  return `<article id="article-${i}">
  <div class="tag">${esc(nl.sender)}</div>
  <h2>${esc(nl.subject)}</h2>
  <div class="ameta">${meta}</div>
  ${body}
  <div class="wc">${wc.toLocaleString()} words</div>
</article>`;
}

export function buildDigestHtml(digest) {
  const week = digest?.week || 'Digest';
  const items = digest?.newsletters || [];
  const built = digest?.builtAt ? new Date(digest.builtAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  const contents = items.map((nl, i) =>
    `<a href="#article-${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="s">${esc(nl.subject)}</span></a>`
  ).join('\n');

  const articles = items.map(articleHtml).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carta — ${esc(week)}</title>
<link rel="stylesheet" href="${FONT_LINK}">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #1a1a1a; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 0 20px 64px; }
  .cover { padding: 28px 0 24px; border-bottom: 2px solid #000; }
  .cover h1 { font-family: ${SIGN}; font-size: 44px; font-weight: 800; letter-spacing: -0.01em; text-transform: uppercase; line-height: .92; margin: 0 0 8px; color: #000; }
  .cover .week { font-family: ${MONO}; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
  .cover .count { font-family: ${MONO}; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #aaa; }
  .contents { padding: 16px 0; border-bottom: 2px solid #000; }
  .contents h3 { font-family: ${SIGN}; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; margin: 0 0 12px; }
  .contents a { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; text-decoration: none; align-items: baseline; color: #000; }
  .contents .n { font-family: ${MONO}; font-size: 9px; color: #aaa; min-width: 18px; }
  .contents .s { font-family: ${SIGN}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; line-height: 1.2; }
  article { padding: 24px 0; border-bottom: 1px solid #ddd; }
  .tag { display: inline-block; font-family: ${MONO}; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; border: 1px solid #000; padding: 2px 8px; margin-bottom: 12px; }
  article h2 { font-family: ${SIGN}; font-size: 28px; font-weight: 800; letter-spacing: -0.01em; text-transform: uppercase; line-height: .98; color: #000; margin: 0 0 12px; border-top: 3px solid #000; padding-top: 12px; }
  .ameta { font-family: ${MONO}; font-size: 9px; color: #888; letter-spacing: .1em; text-transform: uppercase; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #eee; }
  article p { font-family: ${BODY}; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 16px; }
  article p.lead { font-weight: 500; }
  article p.empty { color: #999; font-style: italic; }
  .wc { font-family: ${MONO}; font-size: 9px; color: #aaa; letter-spacing: .1em; margin-top: 8px; }
  footer { max-width: 720px; margin: 0 auto; padding: 24px 20px; font-family: ${MONO}; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: #b0b0b0; }
  @media print { .contents a { border-color: #ddd; } article { break-inside: avoid; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="cover">
    <h1>Carta</h1>
    <div class="week">${esc(week)}</div>
    <div class="count">${items.length} ${items.length === 1 ? 'issue' : 'issues'}</div>
  </div>
  <nav class="contents">
    <h3>Contents</h3>
    ${contents}
  </nav>
  ${articles}
</div>
<footer>Saved from carta.fatto.studio${built ? ` &middot; digest built ${esc(built)}` : ''}</footer>
</body>
</html>`;
}
