import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

const SECRET = process.env.SESSION_SECRET;

export function getOAuthClient() {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000';
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${base}/api/auth/callback`
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
  const secure = process.env.VERCEL_PROJECT_PRODUCTION_URL ? '; Secure' : '';
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

export function setCors(res) {
  const origin = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
