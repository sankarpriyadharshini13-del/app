// Optional manual seed: DATABASE_URL=... npm run seed  (the API also auto-seeds on first request)
const { ensure, seed } = require('../api/_lib/db');
ensure().then(seed).then((n) => { console.log('Seeded', n, 'products'); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
