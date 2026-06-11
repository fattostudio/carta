import { verifyToken, getGmail, getHeader, setCors } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const tokens = verifyToken(req);
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  const { label = 'Carta' } = req.query;
  try {
    const gmail = getGmail(tokens);
    const searchRes = await gmail.users.messages.list({ userId: 'me', q: `label:${label}`, maxResults: 500 });
    const messages = searchRes.data.messages || [];
    if (!messages.length) return res.json([]);
    const senderMap = new Map();
    await Promise.all(messages.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata', metadataHeaders: ['From'] });
      const from = getHeader(msg.data.payload.headers, 'from');
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
