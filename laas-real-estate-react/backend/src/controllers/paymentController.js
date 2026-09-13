const db = require('../config/db');
const { validate } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');

const PAYABLE_MAP = {
  land_sale: 'App\\Models\\LandSale',
  house_sale: 'App\\Models\\HouseSale',
  house_rental: 'App\\Models\\HouseRental',
  used_item: 'App\\Models\\UsedItem',
};

function resolvePayable(p) {
  if (!p.payable_type || !p.payable_id) return null;
  const tableMap = {
    'App\\Models\\LandSale': ['land_sales', 'land_sale'],
    'App\\Models\\HouseSale': ['house_sales', 'house_sale'],
    'App\\Models\\HouseRental': ['house_rentals', 'house_rental'],
    'App\\Models\\UsedItem': ['used_items', 'used_item'],
  };
  const entry = tableMap[p.payable_type];
  if (!entry) return null;
  const [table] = entry;
  const row = db
    .prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
    .get(p.payable_id);
  if (row) row.__payable_table = table;
  return row || null;
}

exports.index = (req, res, next) => {
  try {
    let sql = `
      SELECT payments.*, customers.first_name || ' ' || customers.last_name AS customer_name,
             users.name AS processed_by_name
      FROM payments
      LEFT JOIN customers ON customers.id = payments.customer_id
      LEFT JOIN users ON users.id = payments.processed_by
      WHERE payments.deleted_at IS NULL`;
    const params = [];

    if (req.query.status) {
      sql += ' AND payments.status = ?';
      params.push(req.query.status);
    }
    if (req.query.search) {
      sql +=
        ' AND (payments.reference_number LIKE ? OR payments.payment_method LIKE ? OR payments.status LIKE ? OR CAST(payments.amount AS TEXT) LIKE ? OR customers.first_name LIKE ? OR customers.last_name LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like, like, like);
    }

    sql += sortClause(req, {
      reference_number: 'payments.reference_number',
      customer_name: 'customer_name',
      amount: 'payments.amount',
      payment_method: 'payments.payment_method',
      payment_date: 'payments.payment_date',
      status: 'payments.status',
      created_at: 'payments.created_at',
    });

    const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);

    rows.forEach((p) => {
      p.payable = resolvePayable(p);
    });

    res.json(paginate(req, rows, total, 15));
  } catch (err) {
    next(err);
  }
};

exports.show = (req, res, next) => {
  try {
    const p = db
      .prepare('SELECT * FROM payments WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    p.customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(p.customer_id);
    p.processed_by_user = p.processed_by
      ? db.prepare('SELECT name FROM users WHERE id = ?').get(p.processed_by)
      : null;
    p.payable = resolvePayable(p);

    res.json(p);
  } catch (err) {
    next(err);
  }
};

exports.createMeta = (req, res) => {
  const customers = db
    .prepare('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY first_name')
    .all();
  res.json({ customers });
};

exports.store = (req, res, next) => {
  try {
    validate(req.body, {
      customer_id: 'required|exists:customers,id',
      amount: 'required|numeric|min:0',
      payment_method: 'required|string|max:100',
      payment_date: 'required|date',
      status: 'required|in:pending,completed,failed,refunded',
      notes: 'nullable|string',
    });

    let payableType = null;
    let payableId = null;
    if (req.body.payable_type && req.body.payable_id) {
      payableType = PAYABLE_MAP[req.body.payable_type] || req.body.payable_type;
      payableId = req.body.payable_id;
    }

    const referenceNumber = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const info = db
      .prepare(
        `INSERT INTO payments (payable_type, payable_id, customer_id, amount, payment_method, reference_number, payment_date, status, notes, processed_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        payableType,
        payableId,
        req.body.customer_id,
        parseFloat(req.body.amount),
        req.body.payment_method,
        referenceNumber,
        req.body.payment_date,
        req.body.status,
        req.body.notes || null,
        req.user.id,
        db.now(),
        db.now()
      );

    logActivity(
      req.user.id,
      'created',
      'payment',
      `Created payment ${referenceNumber}`
    );
    res.status(201).json({
      message: 'Payment created successfully.',
      payment: { id: info.lastInsertRowid, reference_number: referenceNumber },
    });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const p = db
      .prepare('SELECT * FROM payments WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    validate(req.body, {
      customer_id: 'required|exists:customers,id',
      amount: 'required|numeric|min:0',
      payment_method: 'required|string|max:100',
      reference_number: 'nullable|string|max:255',
      payment_date: 'required|date',
      status: 'required|in:pending,completed,failed,refunded',
      notes: 'nullable|string',
    });

    db.prepare(
      `UPDATE payments SET customer_id = ?, amount = ?, payment_method = ?, reference_number = ?, payment_date = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      req.body.customer_id,
      parseFloat(req.body.amount),
      req.body.payment_method,
      req.body.reference_number || null,
      req.body.payment_date,
      req.body.status,
      req.body.notes || null,
      db.now(),
      p.id
    );

    logActivity(req.user.id, 'updated', 'payment', `Updated payment #${p.id}`);
    res.json({ message: 'Payment updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.destroy = (req, res, next) => {
  try {
    const p = db
      .prepare('SELECT * FROM payments WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    db.prepare('UPDATE payments SET deleted_at = ? WHERE id = ?').run(db.now(), p.id);
    logActivity(req.user.id, 'deleted', 'payment', `Deleted payment ${p.reference_number}`);
    res.json({ message: 'Payment deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
