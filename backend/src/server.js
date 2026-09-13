require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local'), override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/db');
const settings = require('./helpers/settings');

// Safety bootstrap for database tables this project added after Laravel,
// plus seeding the default commission rate. DDL differs slightly per driver,
// but the schema (backend/database/supabase_schema.sql) is authoritative for
// Supabase; this just guarantees the app can boot on either driver.
async function ensureSchema() {
  if (db.driver === 'pg') {
    await db.exec(`CREATE TABLE IF NOT EXISTS commissions (
      id serial primary key,
      commission_type text not null,
      commission_id integer not null,
      property_id integer,
      customer_id integer,
      amount double precision not null default 0,
      rate double precision not null default 0,
      commission double precision not null default 0,
      status text not null default 'pending',
      registered_by integer,
      created_at timestamp,
      updated_at timestamp,
      deleted_at timestamp
    )`);

    await db.exec(`CREATE TABLE IF NOT EXISTS public_inquiries (
      id serial primary key,
      type text not null,
      name text not null,
      email text not null,
      phone text,
      interest text,
      subject text,
      message text,
      created_at timestamp,
      updated_at timestamp
    )`);
  } else {
    await db.exec(`CREATE TABLE IF NOT EXISTS commissions (
      id integer primary key autoincrement,
      commission_type text not null,
      commission_id integer not null,
      property_id integer,
      customer_id integer,
      amount real not null default 0,
      rate real not null default 0,
      commission real not null default 0,
      status text not null default 'pending',
      registered_by integer,
      created_at timestamp,
      updated_at timestamp,
      deleted_at timestamp
    )`);

    await db.exec(`CREATE TABLE IF NOT EXISTS public_inquiries (
      id integer primary key autoincrement,
      type text not null,
      name text not null,
      email text not null,
      phone text,
      interest text,
      subject text,
      message text,
      created_at timestamp,
      updated_at timestamp
    )`);
  }

  const row = await db
    .prepare("SELECT COUNT(*) as c FROM settings WHERE key = 'commission_rate'")
    .get();
  if (row.c === 0) {
    await db
      .prepare('INSERT INTO settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run('commission_rate', '10', db.now(), db.now());
  }
}

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files (existing Laravel storage + new uploads)
  const storagePath = process.env.STORAGE_PATH || path.resolve(__dirname, '../storage');
  if (fs.existsSync(storagePath)) {
    app.use('/storage', express.static(storagePath));
  }

  // Desktop/production mode: serve the built React frontend when FRONTEND_DIST is set
  const frontendDist = process.env.FRONTEND_DIST || '';
  const servingFrontend = frontendDist && fs.existsSync(path.join(frontendDist, 'index.html'));
  if (servingFrontend) {
    app.use(express.static(frontendDist));
  }

  // Root health check
  app.get('/', (req, res) => {
    if (servingFrontend) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    res.send(`<!DOCTYPE html>
<html lang="so">
<head>
<meta charset="UTF-8">
<title>LAAS Real Estate - API</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111827; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: #1f2937; border: 1px solid #374151; border-radius: 16px; padding: 40px; max-width: 460px; text-align: center; }
  h1 { margin: 0 0 8px; font-size: 22px; }
  p { color: #9ca3af; font-size: 14px; margin: 4px 0; }
  .ok { color: #34d399; font-weight: 600; }
  a.btn { display: inline-block; margin-top: 20px; padding: 10px 22px; background: #eab308; color: #111827; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
<h1>LAAS Real Estate API</h1>
<p class="ok">● API-gu wuu shaqeynayaa (running)</p>
<p>Backend: http://localhost:8001/api</p>
<p>App-ka oo buuxa fur halkan:</p>
<a class="btn" href="http://localhost:5173">Fur App-ka → localhost:5173</a>
</div>
</body>
</html>`);
  });

  // Serve backup downloads handled in controller; API routes
  app.use('/api', routes);

  // 404 for unknown API endpoints
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

  // SPA fallback for client-side routes (desktop mode)
  if (servingFrontend) {
    app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }

  app.use(errorHandler);

  return { app, servingFrontend };
}

async function bootstrap() {
  if (db.driver === 'sqlite') {
    console.warn(
      '\nℹ️  Running on local SQLite — fill in the database password in backend/.env.local (replace YOUR_DB_PASSWORD) and restart to switch to Supabase/Postgres.\n'
    );
  }

  try {
    await ensureSchema();
  } catch (err) {
    console.error(
      '\n✖️  Could not connect to Supabase. Check backend/.env.local and make sure the schema (backend/database/supabase_schema.sql) has been run.\n',
      err.message
    );
    process.exit(1);
  }

  await settings.loadAll();

  const { app, servingFrontend } = createApp();

  const PORT = process.env.PORT || 8001;
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`LAAS Real Estate API running on http://localhost:${PORT}`);
    });
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});