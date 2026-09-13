const db = require('../config/db');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');

exports.index = (req, res, next) => {
  try {
    let sql = `
      SELECT commissions.*,
             properties.title AS property_title,
             customers.first_name || ' ' || customers.last_name AS customer_name,
             users.name AS registered_by_name
      FROM commissions
      LEFT JOIN properties ON properties.id = commissions.property_id
      LEFT JOIN customers ON customers.id = commissions.customer_id
      LEFT JOIN users ON users.id = commissions.registered_by
      WHERE commissions.deleted_at IS NULL`;
    const params = [];

    if (req.query.search) {
      sql +=
        ' AND (commissions.commission_type LIKE ? OR CAST(commissions.commission AS TEXT) LIKE ? OR properties.title LIKE ? OR customers.first_name LIKE ? OR customers.last_name LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like, like);
    }
    if (req.query.status) {
      sql += ' AND commissions.status = ?';
      params.push(req.query.status);
    }
    if (req.query.type) {
      sql += ' AND commissions.commission_type = ?';
      params.push(req.query.type);
    }

    sql += sortClause(req, {
      commission_type: 'commissions.commission_type',
      customer_name: 'customer_name',
      property_title: 'properties.title',
      amount: 'commissions.amount',
      rate: 'commissions.rate',
      commission: 'commissions.commission',
      status: 'commissions.status',
      created_at: 'commissions.created_at',
    });

    const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);

    const summary = db
      .prepare(
        'SELECT COALESCE(SUM(commission), 0) AS total_commission, COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS count FROM commissions WHERE deleted_at IS NULL'
      )
      .get();

    res.json({ ...paginate(req, rows, total, 15), summary });
  } catch (err) {
    next(err);
  }
};

exports.show = (req, res, next) => {
  try {
    const row = db
      .prepare('SELECT * FROM commissions WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });

    row.property = row.property_id
      ? db.prepare('SELECT * FROM properties WHERE id = ?').get(row.property_id)
      : null;
    row.customer = row.customer_id
      ? db.prepare('SELECT * FROM customers WHERE id = ?').get(row.customer_id)
      : null;
    row.registered_by_user = row.registered_by
      ? db.prepare('SELECT name FROM users WHERE id = ?').get(row.registered_by)
      : null;

    res.json(row);
  } catch (err) {
    next(err);
  }
};

exports.destroy = (req, res, next) => {
  try {
    const row = db
      .prepare('SELECT * FROM commissions WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });

    db.prepare('UPDATE commissions SET deleted_at = ? WHERE id = ?').run(db.now(), row.id);
    logActivity(req.user.id, 'deleted', 'commission', `Deleted commission #${row.id}`);
    res.json({ message: 'Commission deleted successfully.' });
  } catch (err) {
    next(err);
  }
};