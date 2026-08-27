import {
  verifyToken, getGmail, getHeader, setCors,
  buildNewsletterQuery, needsListHeaderFilter, hasListHeaders,
  resolveLabel, formatAfter, NEWSLETTER_HEADERS,
} from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const tokens = verifyToken(req);
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

  const { label, since, days = 90 } = req.query;
  const after = formatAfter(since || Date.now() - Number(days) * 86400000);

  try {
    const gmail = getGmail(tokens);
    const opts = { label: label || undefined, after };
    // No override given -> use the Carta label if it exists, else auto-detect.
    if (!opts.label) opts.label = (await resolveLabel(gmail)) || undefined;
    const q = buildNewsletterQuery(opts);
    const filterByHeaders = needsListHeaderFilter(opts);

    const searchRes = await gmail.users.messages.list({ userId: 'me', q, maxResults: 500 });
    const messages = searchRes.data.messages || [];
    if (!messages.length) return res.json([]);
    const senderMap = new Map();
    await Promise.all(messages.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({
        userId: 'me', id, format: 'metadata', metadataHeaders: NEWSLETTER_HEADERS,
      });
      const headers = msg.data.payload.headers;
      if (filterByHeaders && !hasListHeaders(headers)) return;
      const from = getHeader(headers, 'from');
      if (!from) return;
      const nameMatch = from.match(/^"?([^"<]+?)"?\s*</);
      const emailMatch = from.match(/<(.+)>/) || [null, from.trim()];
      const name = nameMatch ? nameMatch[1].trim() : emailMatch[1];
      const email = emailMatch[1];
      if (!senderMap.has(email)) senderMap.set(email, { name, email, count: 0 });
      senderMap.get(email).count++;
    }));
    res.json(Array.from(senderMap.values()).sort((a, b) => b.count - a.count));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
