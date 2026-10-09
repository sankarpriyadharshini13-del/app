const r = require('express').Router();
const { sql } = require('../_lib/db');
r.get('/', async (req, res) => {
  const cat = req.query.category && req.query.category !== 'All' ? req.query.category : null;
  const q = req.query.q ? `%${req.query.q}%` : null;
  const { rows } = await sql`SELECT id,name,category,price,mrp,rating::float AS rating,image,featured FROM products
    WHERE (${cat}::text IS NULL OR category=${cat}) AND (${q}::text IS NULL OR name ILIKE ${q}) ORDER BY id`;
  res.json(rows);
});
module.exports = r;
