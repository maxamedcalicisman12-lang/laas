const db = require('../config/db');
const { paginate } = require('../helpers/paginate');

exports.index = (req, res, next) => {
  try {
    const sql = `SELECT * FROM notifications WHERE notifiable_id = ? AND notifiable_type = 'App\\\\Models\\\\User' ORDER BY created_at DESC`;
    const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(req.user.id).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = db.prepare(`${sql} LIMIT 20 OFFSET ?`).all(req.user.id, (page - 1) * 20);
    rows.forEach((n) => {
      try {
        n.data_parsed = JSON.parse(n.data);
      } catch (e) {
        n.data_parsed = {};
      }
    });
    res.json(paginate(req, rows, total, 20));
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = (req, res) => {
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM notifications WHERE notifiable_id = ? AND notifiable_type = 'App\\\\Models\\\\User' AND read_at IS NULL`
    )
    .get(req.user.id);
  res.json({ count: row.c });
};

exports.markAsRead = (req, res, next) => {
  try {
    const notification = db
      .prepare(
        `SELECT * FROM notifications WHERE id = ? AND notifiable_id = ? AND notifiable_type = 'App\\\\Models\\\\User'`
      )
      .get(req.params.id, req.user.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });

    db.prepare('UPDATE notifications SET read_at = ?, updated_at = ? WHERE id = ?').run(
      db.now(),
      db.now(),
      notification.id
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = (req, res, next) => {
  try {
    db.prepare(
      `UPDATE notifications SET read_at = ?, updated_at = ? WHERE notifiable_id = ? AND notifiable_type = 'App\\\\Models\\\\User' AND read_at IS NULL`
    ).run(db.now(), db.now(), req.user.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};
