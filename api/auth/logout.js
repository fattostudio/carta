import { clearCookie, setCors } from '../_helpers.js';

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  clearCookie(res);
  res.json({ ok: true });
}
