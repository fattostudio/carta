import { verifyToken, setCors } from '../_helpers.js';

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.json({ authenticated: !!verifyToken(req) });
}
