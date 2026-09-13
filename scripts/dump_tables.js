const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.resolve(__dirname, '..', 'backend', 'database', 'database.sqlite'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log('=== DATABASE TABLES ===');
tables.forEach(t => {
  console.log('\n--- ' + t.name + ' ---');
  const cols = db.prepare('PRAGMA table_info(' + t.name + ')').all();
  cols.forEach(c => {
    let line = '  ' + c.name + ' | ' + c.type;
    if (c.notnull) line += ' NOT NULL';
    if (c.dflt_value) line += ' DEFAULT ' + c.dflt_value;
    if (c.pk) line += ' PRIMARY KEY';
    console.log(line);
  });
  const count = db.prepare('SELECT COUNT(*) as c FROM "' + t.name + '"').get();
  console.log('  [Rows: ' + count.c + ']');
});
