import { getOAuthClient, signToken, setCookie, setCors, getPublicBase } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    setCookie(res, signToken(tokens));
    res.redirect(`${getPublicBase()}/carta/digests`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
