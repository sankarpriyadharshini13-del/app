const { createPool } = require('@vercel/postgres');
const pool = createPool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });
const sql = pool.sql.bind(pool);

// name, category, price, mrp, rating, featured
const PRODUCTS = [
  ['AirPods Max Headphones', 'Electronics', 49900, 59900, 4.8, 1],
  ['Smart Watch Series 8', 'Electronics', 32900, 39900, 4.7, 1],
  ['Mechanical Keyboard Pro', 'Electronics', 7999, 11999, 4.6, 0],
  ['4K Action Camera', 'Electronics', 18499, 22999, 4.5, 0],
  ['Portable Bluetooth Speaker', 'Electronics', 3499, 5999, 4.4, 0],
  ['Oversized Linen Shirt', 'Fashion', 2499, 3999, 4.5, 1],
  ['Classic White Sneakers', 'Fashion', 4299, 6999, 4.7, 1],
  ['Black Tailored Blazer', 'Fashion', 6999, 9999, 4.6, 0],
  ['Leather Crossbody Bag', 'Fashion', 3899, 5999, 4.3, 0],
  ['Aviator Sunglasses', 'Fashion', 1799, 2999, 4.2, 0],
  ['Vitamin C Glow Serum', 'Beauty', 899, 1499, 4.6, 0],
  ['Matte Lipstick Set', 'Beauty', 1299, 1999, 4.4, 0],
  ['Hydrating Face Cream', 'Beauty', 1099, 1599, 4.5, 0],
  ['Oud Eau de Parfum 50ml', 'Beauty', 4599, 6499, 4.8, 0],
  ['Argan Hair Oil', 'Beauty', 649, 999, 4.3, 0],
];

async function seed() {
  const { rows } = await sql`SELECT COUNT(*)::int AS c FROM products`;
  if (rows[0].c) return 0;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const [n, c, p, m, r, f] = PRODUCTS[i];
    const img = `https://picsum.photos/seed/shop${i + 1}/600/760`;
    await sql`INSERT INTO products(name,category,price,mrp,rating,image,featured)
              VALUES(${n},${c},${p},${m},${r},${img},${!!f})`;
  }
  return PRODUCTS.length;
}

let ready;
function ensure() {
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT,category TEXT,price INT,mrp INT,rating NUMERIC(2,1),image TEXT,featured BOOLEAN DEFAULT false)`;
      await sql`CREATE TABLE IF NOT EXISTS cart(uid TEXT,product_id INT,qty INT,PRIMARY KEY(uid,product_id))`;
      await sql`CREATE TABLE IF NOT EXISTS wishlist(uid TEXT,product_id INT,PRIMARY KEY(uid,product_id))`;
      await seed();
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}
module.exports = { sql, ensure, seed };
