// ── Newsletter body text cleaning ────────────────────────────────────────────
// Shared by the on-screen reader, the print portals, and the offline HTML export
// so they all paginate and read from the same cleaned prose.

export function cleanBody(raw = '') {
  return raw
    // Drop embedded images/captions/tables/styles/scripts wholesale (tag +
    // inner content), not just the surrounding markup — a figcaption's text
    // is a photo credit, not article prose, and a <style> block's CSS rules
    // are never meant to be read as text at all.
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<(hr|img|br)\b[^>]*\/?>/gi, '')
    // Markdown links: keep the visible label, drop the URL, e.g.
    // "[here](https://x.com)" -> "here"
    .replace(/\[([^\]]*)\]\(https?:\/\/[^)]*\)/g, '$1')
    // Markdown link cut off mid-URL (source got truncated before the
    // closing paren) — keep the label, drop the dangling "](". Trailing
    // whitespace is restricted to the same line so this can't eat the
    // blank-line paragraph separator that follows.
    .replace(/\[([^\]\n]*)\]\([ \t]*$/gm, '$1')
    // Link cut off even earlier — before any label survived, just a bare
    // "[" dangling at the end of a line/sentence.
    .replace(/\[[ \t]*$/gm, '')
    // Stray markdown emphasis asterisks
    .replace(/\*+/g, '')
    // Any remaining HTML tags (inline formatting etc.) — keep their text
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/[^\s<>"]+/g, '')
    .replace(/[([{]\s*[)\]}]/g, '')
    .replace(/^[\s\W]{0,3}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Photo credit lines ("<description> | REUTERS/Name, edited by X") that
// slip through as full sentences — not article prose, so drop them.
const CAPTION_RE = /\|\s*(REUTERS|AP Photo|AP\b|AFP|Getty Images|Getty|Bloomberg|Shutterstock)\b/i;

// Safety net for truncated sources: an opening bracket/paren with no
// matching close anywhere after it means whatever followed (a link, an
// aside) got cut off and never arrived. Trim from that opener onward,
// repeating in case removing one exposes another further back (e.g. an
// unclosed "(" that only became dangling once the "[" inside it was cut).
export function stripDanglingOpeners(text) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const [open, close] of [['[', ']'], ['(', ')']]) {
      const lastOpen = text.lastIndexOf(open);
      if (lastOpen !== -1 && !text.includes(close, lastOpen)) {
        text = text.slice(0, lastOpen).trimEnd();
        changed = true;
      }
    }
  }
  return text;
}

export function getParas(raw = '') {
  const cleaned = cleanBody(raw);
  let chunks = cleaned.split(/\n{2,}/);
  if (chunks.length < 3) chunks = cleaned.split(/\n/);
  return chunks
    .map(p => stripDanglingOpeners(p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()))
    .filter(p => p.length > 60 && !CAPTION_RE.test(p));
}

export function domainFromEmail(email = '') {
  const match = email.match(/@([\w.-]+)/);
  if (!match) return null;
  const domain = match[1];
  const boring = ['substack.com', 'buttondown.email', 'mailchimp.com', 'beehiiv.com', 'convertkit.com', 'ghost.io'];
  if (boring.some(b => domain.includes(b))) return null;
  return domain;
}

// ── One-sentence teaser from body text ───────────────────────────────────────
export function getTeaser(bodyText, maxChars = 140) {
  const paras = getParas(bodyText);
  if (!paras.length) return '';
  const first = paras[0];
  const sentence = first.match(/^[^.!?]+[.!?]/)?.[0] || first;
  return sentence.length > maxChars ? sentence.slice(0, maxChars).trimEnd() + '…' : sentence;
}
