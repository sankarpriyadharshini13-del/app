const r = require('express').Router();
const { sql } = require('../_lib/db');
r.get('/', async (req, res) => {
  const { rows } = await sql`SELECT product_id AS id FROM wishlist WHERE uid=${req.uid}`;
  res.json(rows);
});
r.post('/:id', async (req, res) => {
  await sql`INSERT INTO wishlist(uid,product_id) VALUES(${req.uid},${+req.params.id}) ON CONFLICT DO NOTHING`;
  res.json({ ok: true });
});
r.delete('/:id', async (req, res) => {
  await sql`DELETE FROM wishlist WHERE uid=${req.uid} AND product_id=${+req.params.id}`;
  res.json({ ok: true });
});
module.exports = r;
