const db = require('../config/db');

const cache = new Map();

function getValue(key, defaultValue = null) {
  if (cache.has(key)) return cache.get(key);
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  const value = row ? row.value : defaultValue;
  cache.set(key, value);
  return value;
}

function setValue(key, value) {
  db.prepare(
    'INSERT INTO settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  ).run(key, String(value), db.now(), db.now());
  cache.set(key, String(value));
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
  cache.clear();
}

module.exports = { getValue, setValue, getInt, getFloat, getBool, clearCache };
