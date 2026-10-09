const express = require('express');
const { ensure } = require('./_lib/db');
const app = express();
app.use(express.json());
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
app.use((req, res, next) => {
  const origin = req.header('Origin');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-uid');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(!origin || allowedOrigins.has(origin) ? 204 : 403);
  }
  next();
});
app.use(async (req, res, next) => {
  try { await ensure(); req.uid = String(req.header('x-uid') || 'demo').slice(0, 64); next(); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Database not connected. Add Postgres storage in Vercel.' }); }
});
app.get('/api/health', (_q, r) => r.json({ ok: true }));
app.use('/api/products', require('./_routes/products'));
app.use('/api/cart', require('./_routes/cart'));
app.use('/api/wishlist', require('./_routes/wishlist'));
app.use((err, _q, res, _n) => { console.error(err); res.status(500).json({ error: err.message }); });
module.exports = app;
