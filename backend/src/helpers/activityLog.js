const db = require('../config/db');

async function logActivity(userId, action, module, description) {
  await db
    .prepare(
      'INSERT INTO activity_logs (user_id, action, module, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId || null, action, module, description, db.now(), db.now());
}

module.exports = { logActivity };