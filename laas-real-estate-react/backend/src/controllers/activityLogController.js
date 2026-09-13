const db = require('../config/db');
const { paginate, sortClause } = require('../helpers/paginate');

exports.index = (req, res, next) => {
  try {
    let sql = `
      SELECT activity_logs.*, users.name AS user_name
      FROM activity_logs LEFT JOIN users ON users.id = activity_logs.user_id
      WHERE 1=1`;
    const params = [];

    if (req.query.search) {
      sql +=
        ' AND (activity_logs.description LIKE ? OR activity_logs.module LIKE ? OR activity_logs.action LIKE ? OR users.name LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like);
    }
    if (req.query.module) {
      sql += ' AND activity_logs.module = ?';
      params.push(req.query.module);
    }
    if (req.query.action) {
      sql += ' AND activity_logs.action = ?';
      params.push(req.query.action);
    }

    sql += sortClause(req, {
      action: 'activity_logs.action',
      module: 'activity_logs.module',
      description: 'activity_logs.description',
      user_name: 'user_name',
      created_at: 'activity_logs.created_at',
    });

    const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = db.prepare(`${sql} LIMIT 20 OFFSET ?`).all(...params, (page - 1) * 20);

    const modules = db
      .prepare(
        'SELECT DISTINCT module FROM activity_logs WHERE module IS NOT NULL ORDER BY module'
      )
      .all()
      .map((r) => r.module);

    res.json({ ...paginate(req, rows, total, 20), modules });
  } catch (err) {
    next(err);
  }
};
