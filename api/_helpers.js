import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

const SECRET = process.env.SESSION_SECRET;

// Public-facing base URL. PUBLIC_BASE_URL (e.g. https://carta.fatto.studio) wins
// so OAuth redirects and cookies resolve on the real domain, not the Vercel URL.
export function getPublicBase() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${getPublicBase()}/api/auth/callback`
  );
}

export function getGmail(tokens) {
  const client = getOAuthClient();
  client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: client });
}

export function signToken(tokens) {
  return jwt.sign({ tokens }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(/carta_auth=([^;]+)/);
  if (!match) return null;
  try { return jwt.verify(match[1], SECRET).tokens; }
  catch { return null; }
}

export function setCookie(res, token) {
  const secure = process.env.PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `carta_auth=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`);
}

export function clearCookie(res) {
  res.setHeader('Set-Cookie', 'carta_auth=; HttpOnly; Path=/; Max-Age=0');
}

export function getHeader(headers = [], name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

export function decodeBody(payload) {
  if (!payload) return '';
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain?.body?.data) return Buffer.from(plain.body.data, 'base64').toString('utf8');
    const html = payload.parts.find(p => p.mimeType === 'text/html');
    if (html?.body?.data) return Buffer.from(html.body.data, 'base64').toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const part of payload.parts) { const t = decodeBody(part); if (t) return t; }
  }
  if (payload.body?.data) {
    const text = Buffer.from(payload.body.data, 'base64').toString('utf8');
    return payload.mimeType === 'text/html' ? text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : text;
  }
  return '';
}

// Headers worth pulling in a metadata scan: enough to identify the sender and
// to decide whether a message is a real bulk newsletter.
export const NEWSLETTER_HEADERS = ['From', 'Subject', 'Date', 'List-Id', 'List-Unsubscribe', 'List-Post'];

// Gmail's auto-classified tabs where bulk mail lands. Primary (category:personal)
// is deliberately excluded — it's mostly 1:1 mail and drags in false positives.
const NEWSLETTER_CATEGORIES = ['updates', 'promotions', 'forums'];

// Turn an ISO string / epoch / Date into Gmail's after: date form (YYYY/M/D).
export function formatAfter(since) {
  if (!since) return '';
  const d = new Date(since);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// Build the Gmail search query for a newsletter scan. Precedence:
//   label      -> label:<label>            (explicit power-user / legacy override)
//   allowlist  -> from:(a@x OR b@y ...)     (steady state once senders are reviewed)
//   neither    -> category:updates/promotions/forums  (first-run auto-detect)
export function buildNewsletterQuery({ after, allowlist, label } = {}) {
  const clauses = [];
  if (label) {
    clauses.push(`label:${label}`);
  } else if (allowlist && allowlist.length) {
    clauses.push(`from:(${allowlist.map(e => e.trim()).filter(Boolean).join(' OR ')})`);
  } else {
    clauses.push(`(${NEWSLETTER_CATEGORIES.map(c => `category:${c}`).join(' OR ')})`);
  }
  const afterStr = typeof after === 'string' && after.includes('/') ? after : formatAfter(after);
  if (afterStr) clauses.push(`after:${afterStr}`);
  return clauses.join(' ');
}

// A category scan returns candidates, not confirmed newsletters — those still
// need the List-header check. A label or allowlist query is already trusted.
export function needsListHeaderFilter({ allowlist, label } = {}) {
  return !label && !(allowlist && allowlist.length);
}

// True when the message carries bulk-mail list headers (RFC 2369/2919) — the
// strongest signal that it's a real newsletter rather than personal mail.
export function hasListHeaders(headers = []) {
  return headers.some(h => {
    const n = h.name.toLowerCase();
    return n === 'list-id' || n === 'list-unsubscribe' || n === 'list-post';
  });
}

export function setCors(res) {
  const origin = getPublicBase();
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
