import { verifyToken, getGmail, getHeader, decodeBody, setCors } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const tokens = verifyToken(req);
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  const { since, label = 'Carta', max = 50 } = req.query;
  let afterStr = '';
  if (since) {
    const d = new Date(since);
    afterStr = `after:${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }
  try {
    const gmail = getGmail(tokens);
    const searchRes = await gmail.users.messages.list({
      userId: 'me', q: `label:${label}${afterStr ? ' ' + afterStr : ''}`, maxResults: Number(max),
    });
    const messages = searchRes.data.messages || [];
    if (!messages.length) return res.json([]);
    const newsletters = await Promise.all(messages.map(async ({ id }) => {
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
