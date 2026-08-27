import {
  verifyToken, getGmail, getHeader, decodeBody, setCors,
  buildNewsletterQuery, needsListHeaderFilter, hasListHeaders,
  resolveLabel, formatAfter,
} from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const tokens = verifyToken(req);
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

  const { since, label, allowlist, max = 50 } = req.query;
  const allow = allowlist ? allowlist.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const gmail = getGmail(tokens);
    const opts = { label: label || undefined, allowlist: allow, after: formatAfter(since) };
    // No allowlist and no override -> keep the Carta label if it exists, else auto-detect.
    if (!opts.label && !allow.length) opts.label = (await resolveLabel(gmail)) || undefined;
    const q = buildNewsletterQuery(opts);
    const filterByHeaders = needsListHeaderFilter(opts);
    // The category scan is a wide net; pull extra candidates so that after the
    // List-header winnowing we still have up to `max` real newsletters.
    const listMax = filterByHeaders ? Math.min(Number(max) * 4, 200) : Number(max);

    const searchRes = await gmail.users.messages.list({ userId: 'me', q, maxResults: listMax });
    let candidates = searchRes.data.messages || [];
    if (!candidates.length) return res.json([]);

    // Pass 1 (auto-detect only): cheap metadata fetch to keep just the messages
    // that carry list headers and land after `since`, capped at `max`.
    if (filterByHeaders) {
      const metas = await Promise.all(candidates.map(async ({ id }) => {
        const m = await gmail.users.messages.get({
          userId: 'me', id, format: 'metadata',
          metadataHeaders: ['Date', 'List-Id', 'List-Unsubscribe', 'List-Post'],
        });
        return { id, headers: m.data.payload.headers };
      }));
      candidates = metas
        .filter(m => hasListHeaders(m.headers))
        .filter(m => !since || new Date(getHeader(m.headers, 'date')) > new Date(since))
        .slice(0, Number(max))
        .map(m => ({ id: m.id }));
    }
    if (!candidates.length) return res.json([]);

    // Pass 2: full fetch for the survivors so we can extract the body.
    const newsletters = await Promise.all(candidates.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      const { payload } = msg.data;
      const headers = payload.headers;
      const date = getHeader(headers, 'date');
      if (since && new Date(date) <= new Date(since)) return null;
      return {
        id,
        subject: getHeader(headers, 'subject'),
        sender: getHeader(headers, 'from').replace(/<.*>/, '').trim(),
        senderEmail: (getHeader(headers, 'from').match(/<(.+)>/) || [])[1] || getHeader(headers, 'from'),
        date,
        bodyText: decodeBody(payload),
      };
    }));
    res.json(newsletters.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
