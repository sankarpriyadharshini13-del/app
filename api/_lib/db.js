const { createPool } = require('@vercel/postgres');
let pool;

function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('Set DATABASE_URL or POSTGRES_URL in the Vercel project environment variables.');
  }
  if (!pool) pool = createPool({ connectionString });
  return pool;
}

function sql(strings, ...values) {
  return getPool().sql(strings, ...values);
}

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
  let added = 0;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const [n, c, p, m, r, f] = PRODUCTS[i];
    const img = `https://picsum.photos/seed/shop${i + 1}/600/760`;
    const { rows } = await sql`INSERT INTO products(name,category,price,mrp,rating,image,featured)
              SELECT ${n},${c},${p},${m},${r},${img},${!!f}
              WHERE NOT EXISTS (SELECT 1 FROM products WHERE name=${n})
              RETURNING id`;
    added += rows.length;
  }
  return added;
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
