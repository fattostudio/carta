import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// ── OAuth client ─────────────────────────────────────────────────────────────
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3001/auth/callback'
  );
}

// ── Auth routes ──────────────────────────────────────────────────────────────
app.get('/auth/login', (req, res) => {
  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(req.query.code);
  req.session.tokens = tokens;
  res.redirect('http://localhost:5173/digests');
});

app.get('/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.tokens });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// ── Gmail helpers ────────────────────────────────────────────────────────────
function getGmail(tokens) {
  const client = getOAuthClient();
  client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: client });
}

function decodeBody(payload) {
  // Recursively find text/plain or text/html parts
  if (!payload) return '';

  if (payload.parts) {
    // Prefer text/plain
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain?.body?.data) return Buffer.from(plain.body.data, 'base64').toString('utf8');
    // Fall back to text/html
    const html = payload.parts.find(p => p.mimeType === 'text/html');
    if (html?.body?.data) return Buffer.from(html.body.data, 'base64').toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // Recurse into multipart
    for (const part of payload.parts) {
      const text = decodeBody(part);
      if (text) return text;
    }
  }

  if (payload.body?.data) {
    const text = Buffer.from(payload.body.data, 'base64').toString('utf8');
    if (payload.mimeType === 'text/html') return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }

  return '';
}

function extractImages(payload) {
  const images = [];
  function walk(part) {
    if (!part) return;
    if (part.mimeType?.startsWith('image/') && part.body?.attachmentId) {
      images.push({ attachmentId: part.body.attachmentId, mimeType: part.mimeType });
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return images;
}

function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

// Gmail tabs where bulk mail lands (Primary excluded — too many false positives).
const NEWSLETTER_CATEGORIES = ['updates', 'promotions', 'forums'];

// label -> label:<label>; allowlist -> from:(...); neither -> category scan.
function buildNewsletterQuery({ afterStr, allowlist, label }) {
  const clauses = [];
  if (label) clauses.push(`label:${label}`);
  else if (allowlist?.length) clauses.push(`from:(${allowlist.join(' OR ')})`);
  else clauses.push(`(${NEWSLETTER_CATEGORIES.map(c => `category:${c}`).join(' OR ')})`);
  if (afterStr) clauses.push(`after:${afterStr}`);
  return clauses.join(' ');
}

// RFC 2369/2919 list headers — the signal that a message is a real newsletter.
function hasListHeaders(headers = []) {
  return headers.some(h => {
    const n = h.name.toLowerCase();
    return n === 'list-id' || n === 'list-unsubscribe' || n === 'list-post';
  });
}

// Keep older Carta-label setups working: only auto-detect when that label is gone.
async function resolveLabel(gmail, name = 'Carta') {
  try {
    const { data } = await gmail.users.labels.list({ userId: 'me' });
    const hit = (data.labels || []).find(l => l.name.toLowerCase() === name.toLowerCase());
    return hit ? hit.name : null;
  } catch {
    return null;
  }
}

// Shared fetch used by /api/newsletters and /api/digest/build.
async function collectNewsletters(gmail, { days, max, label, allowlist }) {
  const since = new Date();
  since.setDate(since.getDate() - Number(days));
  const afterStr = `${since.getFullYear()}/${since.getMonth() + 1}/${since.getDate()}`;
  let effectiveLabel = label;
  if (!effectiveLabel && !(allowlist && allowlist.length)) {
    effectiveLabel = await resolveLabel(gmail);
  }
  const auto = !effectiveLabel && !(allowlist && allowlist.length);
  const q = buildNewsletterQuery({ afterStr, allowlist, label: effectiveLabel });
  const listMax = auto ? Math.min(Number(max) * 4, 200) : Number(max);

  const searchRes = await gmail.users.messages.list({ userId: 'me', q, maxResults: listMax });
  const messages = searchRes.data.messages || [];
  if (!messages.length) return [];

  const fetched = await Promise.all(messages.map(async ({ id }) => {
    const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
    const { payload } = msg.data;
    const headers = payload.headers;
    if (auto && !hasListHeaders(headers)) return null;
    return {
      id,
      subject: getHeader(headers, 'subject'),
      sender: getHeader(headers, 'from').replace(/<.*>/, '').trim(),
      senderEmail: (getHeader(headers, 'from').match(/<(.+)>/) || [])[1] || getHeader(headers, 'from'),
      date: getHeader(headers, 'date'),
      bodyText: decodeBody(payload),
      hasImages: extractImages(payload).length > 0,
    };
  }));
  return fetched.filter(Boolean).slice(0, Number(max));
}

// ── Fetch newsletters ────────────────────────────────────────────────────────
app.get('/api/newsletters', async (req, res) => {
  if (!req.session.tokens) return res.status(401).json({ error: 'Not authenticated' });

  const { days = 7, max = 10, label, allowlist } = req.query;
  const allow = allowlist ? allowlist.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const gmail = getGmail(req.session.tokens);
    const newsletters = await collectNewsletters(gmail, { days, max, label: label || undefined, allowlist: allow });
    res.json(newsletters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Build digest (latest newsletters) ───────────────────────────────────────
app.post('/api/digest/build', async (req, res) => {
  if (!req.session.tokens) return res.status(401).json({ error: 'Not authenticated' });

  const { days = 7, max = 10, label, allowlist } = req.body;
  const allow = Array.isArray(allowlist)
    ? allowlist
    : (allowlist ? String(allowlist).split(',').map(s => s.trim()).filter(Boolean) : []);

  try {
    const gmail = getGmail(req.session.tokens);
    const newsletters = await collectNewsletters(gmail, { days, max, label: label || undefined, allowlist: allow });
    res.json({ newsletters, builtAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Carta server running on http://localhost:${PORT}`));
