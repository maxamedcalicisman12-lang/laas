const path = require('path');
const { DatabaseSync } = require('node:sqlite');

require('dotenv').config();

const dbPath = path.resolve(__dirname, '..', '..', process.env.DB_PATH || './database/database.sqlite');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = db;
module.exports.now = now;
