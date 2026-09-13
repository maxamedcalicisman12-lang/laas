const db = require('../config/db');

const store = new Map();

// Load all rows into the in-memory store at startup. Once loaded,
// getValue/getInt/getFloat/getBool stay synchronous (used in middleware,
// password policy, commission math, etc.).
async function loadAll() {
  const rows = await db.prepare('SELECT key, value FROM settings').all();
  store.clear();
  rows.forEach((r) => store.set(r.key, r.value));
  return store;
}

function getValue(key, defaultValue = null) {
  return store.has(key) ? store.get(key) : defaultValue;
}

async function setValue(key, value) {
  const str = String(value);
  await db
    .prepare(
      'INSERT INTO settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    )
    .run(key, str, db.now(), db.now());
  store.set(key, str);
}

function getInt(key, defaultValue = 0) {
  return parseInt(getValue(key, defaultValue), 10) || 0;
}

function getFloat(key, defaultValue = 0) {
  return parseFloat(getValue(key, defaultValue)) || 0;
}

function getBool(key, defaultValue = false) {
  const value = getValue(key, defaultValue ? '1' : '0');
  return value === '1' || value === true || value === 1;
}

function clearCache() {
  store.clear();
}

module.exports = { loadAll, getValue, setValue, getInt, getFloat, getBool, clearCache };