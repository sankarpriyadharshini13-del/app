const r = require('express').Router();
const { sql } = require('../_lib/db');
r.get('/', async (req, res) => {
  const { rows } = await sql`SELECT product_id AS id, qty FROM cart WHERE uid=${req.uid}`;
  res.json(rows);
});
r.put('/:id', async (req, res) => {
  const id = +req.params.id, qty = Math.min(99, +req.body.qty || 0);
  if (qty <= 0) await sql`DELETE FROM cart WHERE uid=${req.uid} AND product_id=${id}`;
  else await sql`INSERT INTO cart(uid,product_id,qty) VALUES(${req.uid},${id},${qty})
                 ON CONFLICT(uid,product_id) DO UPDATE SET qty=${qty}`;
  res.json({ ok: true });
});
r.delete('/', async (req, res) => { await sql`DELETE FROM cart WHERE uid=${req.uid}`; res.json({ ok: true }); });
module.exports = r;
