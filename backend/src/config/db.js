const path = require('path');
const { Pool } = require('pg');
const pg = require('pg');

require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.local'), override: true });

// Driver selection:
//   - SUPABASE_DB_URL set (and password filled in) -> Supabase Postgres
//   - otherwise -> local SQLite (database/database.sqlite)
// Both expose the same async db.prepare(sql).run/.get/.all() interface.
const hasDbUrl = process.env.SUPABASE_DB_URL && !/YOUR_DB_PASSWORD|YOUR-PASSWORD/.test(process.env.SUPABASE_DB_URL);
const driver = hasDbUrl ? 'pg' : 'sqlite';

// Keep API output identical to SQLite:
//   int8/bigint      -> number        (COUNT(*) etc.)
//   numeric/money    -> number        (amounts, prices)
//   timestamp        -> raw string    (keeps "YYYY-MM-DD HH:MM:SS" format)
//   date             -> raw string
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(790, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(1114, (v) => v);
pg.types.setTypeParser(1184, (v) => v);
pg.types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: process.env.SUPABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  max: 10,
});

const { DatabaseSync } = require('node:sqlite');
const sqlite = driver === 'sqlite'
  ? new DatabaseSync(path.resolve(__dirname, '..', '..', 'database', 'database.sqlite'))
  : null;

// SQLite "?" placeholders -> Postgres "$1,$2,..."
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function lastIdForInsert(sql) {
  if (driver === 'sqlite') return sql;
  if (/^\s*(insert|update)\b/i.test(sql)) {
    return sql.replace(/;?\s*$/, '') + ' RETURNING "id"';
  }
  return sql;
}

// Compatibility layer: keeps db.prepare(sql).run/.get/.all() like node:sqlite,
// but every method returns a Promise and works on the active driver.
function prepare(sql) {
  if (driver === 'pg') {
    const allSql = toPg(sql);
    const runSql = lastIdForInsert(allSql);
    return {
      async run(...params) {
        const res = await pool.query(runSql, params);
        const row = res.rows && res.rows[0];
        return { lastInsertRowid: row ? row.id : null, changes: res.rowCount || 0 };
      },
      async get(...params) {
        const res = await pool.query(allSql, params);
        return res.rows.length ? res.rows[0] : undefined;
      },
      async all(...params) {
        const res = await pool.query(allSql, params);
        return res.rows;
      },
    };
  }

  const stmt = sqlite.prepare(sql);
  return {
    async run(...params) {
      const r = stmt.run(...params);
      return {
        lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null,
        changes: r.changes != null ? Number(r.changes) : 0,
      };
    },
    async get(...params) {
      return stmt.get(...params);
    },
    async all(...params) {
      return stmt.all(...params);
    },
  };
}

async function exec(sql) {
  if (driver === 'pg') {
    await pool.query(sql);
  } else {
    sqlite.exec(sql);
  }
}

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = prepare;
module.exports.prepare = prepare;
module.exports.exec = exec;
module.exports.now = now;
module.exports.pool = pool;
module.exports.driver = driver;
module.exports.sqlite = sqlite;