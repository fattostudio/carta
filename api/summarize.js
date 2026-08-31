import Anthropic from '@anthropic-ai/sdk';
import { verifyToken, setCors } from './_helpers.js';

// Cheap + fast: these are triage blurbs, not prose. A ~120-issue digest costs a
// few cents to summarise, once — results are cached client-side by newsletter id.
const MODEL = 'claude-haiku-4-5';
const BATCH_SIZE = 8;       // newsletters per Claude call
const MAX_CONCURRENT = 4;   // batches in flight
const MAX_ITEMS = 200;      // hard cap per request
const MAX_BODY_CHARS = 1200;

const anthropic = new Anthropic();

const clip = (text = '', n = MAX_BODY_CHARS) => {
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) : t;
};

const SYSTEM = [
  'You summarise email newsletters for a reading-triage list.',
  'For each newsletter write ONE plain sentence, 25 words max, saying what THIS issue actually covers — its topics, stories or content.',
  'No hype, no "this newsletter is about", no marketing phrasing.',
  'If an issue is mostly promotional or has no real content, say that briefly.',
  'Respond with ONLY a JSON object mapping each given id to its sentence — no prose, no code fences.',
].join(' ');

async function summarizeBatch(items) {
  const block = items
    .map(it => `id: ${it.id}\nSUBJECT: ${it.subject || '(no subject)'}\nFROM: ${it.sender || ''}\nBODY: ${clip(it.bodyText)}`)
    .join('\n\n---\n\n');

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Summarise these ${items.length} newsletters:\n\n${block}` }],
  });

  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {};
  }
  const out = {};
  for (const it of items) {
    const value = parsed[it.id] ?? parsed[String(it.id)];
    if (typeof value === 'string' && value.trim()) out[it.id] = value.trim();
  }
  return out;
}

async function mapLimit(list, limit, fn) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (cursor < list.length) {
      const index = cursor++;
      results[index] = await fn(list[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tokens = verifyToken(req);
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Summaries are not configured on the server' });
  }

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'No newsletters to summarise' });

  const cleaned = items.slice(0, MAX_ITEMS).map(it => ({
    id: String(it.id),
    subject: typeof it.subject === 'string' ? it.subject.slice(0, 300) : '',
    sender: typeof it.sender === 'string' ? it.sender.slice(0, 200) : '',
    bodyText: typeof it.bodyText === 'string' ? it.bodyText : '',
  }));

  const batches = [];
  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) batches.push(cleaned.slice(i, i + BATCH_SIZE));

  try {
    const results = await mapLimit(batches, MAX_CONCURRENT, summarizeBatch);
    res.json({ summaries: Object.assign({}, ...results) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Summarisation failed' });
  }
}
