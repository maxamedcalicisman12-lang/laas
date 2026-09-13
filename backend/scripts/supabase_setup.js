const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const { Client } = require('pg');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');
const SCHEMA_FILE = path.join(ROOT, 'database', 'supabase_schema.sql');
const SQLITE_FILE = path.join(ROOT, 'database', 'database.sqlite');

// Import order matters: parent tables first (FK references)
const TABLES = [
  'users',
  'customers',
  'properties',
  'cleaners',
  'settings',
  'activity_logs',
  'public_inquiries',
  'payments',
  'notifications',
  'land_sales',
  'house_sales',
  'house_rentals',
  'used_items',
  'commissions',
];

function log(step, msg) {
  console.log(`[${String(step).padStart(10)}] ${msg}`);
}

function setEnvFile(dbUrl) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const out = [];
  let replaced = false;
  for (const line of lines) {
    if (/^SUPABASE_DB_URL=/.test(line)) {
      out.push(`SUPABASE_DB_URL=${dbUrl}`);
      replaced = true;
    } else {
      out.push(line);
    }
  }
  if (!replaced) out.push(`SUPABASE_DB_URL=${dbUrl}`);
  fs.writeFileSync(ENV_FILE, out.join('\n') + '\n');
  log('ENV', `SUPABASE_DB_URL written to .env.local`);
}

function sqliteTables(sqlite) {
  const rows = sqlite.prepare(`select name from sqlite_master where type='table'`).all();
  return rows.map((r) => r.name);
}

function sqliteColumns(sqlite, table) {
  return sqlite.prepare(`pragma table_info(${table})`).all().map((c) => c.name);
}

async function tableExists(client, table) {
  const res = await client.query(`select to_regclass('public.${table}') as t`);
  return !!res.rows[0].t;
}

async function runSchema(client) {
  const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  await client.query(sql);
  log('SCHEMA', 'supabase_schema.sql applied (idempotent)');
}

async function importTable(client, sqlite, table) {
  if (!sqliteTables(sqlite).includes(table)) {
    log('IMPORT', `${table}: skipped (not in SQLite)`);
    return 0;
  }
  if (!(await tableExists(client, table))) {
    log('IMPORT', `${table}: skipped (not in Postgres)`);
    return 0;
  }
  const cols = sqliteColumns(sqlite, table).filter((c) => c !== '');
  const rows = sqlite.prepare(`select * from ${table}`).all();
  if (rows.length === 0) {
    log('IMPORT', `${table}: 0 rows (nothing to import)`);
    return 0;
  }
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const insert = `insert into "${table}" (${colList}) values (${placeholders})`;
  for (const row of rows) {
    await client.query(insert, cols.map((c) => row[c]));
  }
  const hasId = cols.includes('id');
  if (hasId) {
    await client.query(
      `select setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1)) from "${table}"`
    );
  }
  log('IMPORT', `${table}: ${rows.length} rows imported`);
  return rows.length;
}

async function main() {
  let dbUrl = process.argv[2];
  if (!dbUrl) {
    const envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
    const m = envContent.match(/^SUPABASE_DB_URL=(.+)$/m);
    dbUrl = m ? m[1].trim() : '';
  }
  if (!dbUrl || !/^postgres(ql)?:\/\//.test(dbUrl) || /YOUR_DB_PASSWORD|YOUR-PASSWORD/.test(dbUrl)) {
    console.error('No usable SUPABASE_DB_URL found. Fill in the database password in backend/.env.local first, or pass it as an argument:');
    console.error('  node supabase_setup.js "postgresql://..."');
    process.exit(1);
  }

  setEnvFile(dbUrl);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  log('CONNECT', 'connected to Supabase Postgres');

  await runSchema(client);

  await client.query('begin');
  try {
    const sqlite = new DatabaseSync(SQLITE_FILE);
    try {
      let total = 0;
      for (const table of TABLES) {
        total += await importTable(client, sqlite, table);
      }
      log('IMPORT', `done: ${total} rows total`);
    } finally {
      sqlite.close();
    }
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  }

  const counts = [];
  for (const table of TABLES) {
    if (await tableExists(client, table)) {
      const res = await client.query(`select count(*)::int as n from "${table}"`);
      counts.push(`${table}=${res.rows[0].n}`);
    }
  }
  log('VERIFY', counts.join('  '));

  log('DONE', 'setup complete — start the app with "npm run dev"');
  await client.end();
}

main().catch(async (err) => {
  console.error('\nSETUP FAILED:\n', err);
  await (this.client && this.client.end());
  process.exit(1);
});