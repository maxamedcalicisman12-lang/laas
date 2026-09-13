const db = require('../config/db');
const { validate } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');

exports.index = async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM cleaners WHERE deleted_at IS NULL';
    const params = [];

    if (req.query.search) {
      sql +=
        ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like);
    }
    if (req.query.status) {
      sql += ' AND status = ?';
      params.push(req.query.status);
    }

    sql += sortClause(req, {
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'email',
      phone: 'phone',
      salary: 'salary',
      status: 'status',
      created_at: 'created_at',
    });

    const total = (await db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params)).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = await db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);
    res.json(paginate(req, rows, total, 15));
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const cleaner = await db
      .prepare('SELECT * FROM cleaners WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!cleaner) return res.status(404).json({ message: 'Not found' });
    res.json(cleaner);
  } catch (err) {
    next(err);
  }
};

function rules() {
  return {
    first_name: 'required|string|max:255',
    last_name: 'required|string|max:255',
    phone: 'nullable|string|max:20',
    email: 'nullable|email',
    address: 'nullable|string',
    salary: 'nullable|numeric|min:0',
    status: 'required|in:active,inactive',
    notes: 'nullable|string',
  };
}

exports.store = async (req, res, next) => {
  try {
    await validate(req.body, rules());

    const info = await db
      .prepare(
        `INSERT INTO cleaners (first_name, last_name, phone, email, address, salary, status, notes, registered_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.body.first_name,
        req.body.last_name,
        req.body.phone || null,
        req.body.email || null,
        req.body.address || null,
        req.body.salary ? parseFloat(req.body.salary) : 0,
        req.body.status,
        req.body.notes || null,
        req.user.id,
        db.now(),
        db.now()
      );

    await logActivity(
      req.user.id,
      'created',
      'cleaner',
      `Created cleaner ${req.body.first_name} ${req.body.last_name}`
    );
    res.status(201).json({ message: 'Cleaner created successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const cleaner = await db
      .prepare('SELECT * FROM cleaners WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!cleaner) return res.status(404).json({ message: 'Not found' });

    await validate(req.body, rules());

    await db
      .prepare(
        `UPDATE cleaners SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ?, salary = ?, status = ?, notes = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        req.body.first_name,
        req.body.last_name,
        req.body.phone || null,
        req.body.email || null,
        req.body.address || null,
        req.body.salary ? parseFloat(req.body.salary) : 0,
        req.body.status,
        req.body.notes || null,
        db.now(),
        cleaner.id
      );

    await logActivity(
      req.user.id,
      'updated',
      'cleaner',
      `Updated cleaner ${req.body.first_name} ${req.body.last_name}`
    );
    res.json({ message: 'Cleaner updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const cleaner = await db
      .prepare('SELECT * FROM cleaners WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!cleaner) return res.status(404).json({ message: 'Not found' });

    const newStatus = cleaner.status === 'active' ? 'inactive' : 'active';
    await db.prepare('UPDATE cleaners SET status = ?, updated_at = ? WHERE id = ?').run(
      newStatus,
      db.now(),
      cleaner.id
    );
    await logActivity(req.user.id, 'updated', 'cleaner', `Toggled status of cleaner ${cleaner.first_name} ${cleaner.last_name}`);
    res.json({ status: newStatus });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const cleaner = await db
      .prepare('SELECT * FROM cleaners WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!cleaner) return res.status(404).json({ message: 'Not found' });

    await db.prepare('UPDATE cleaners SET deleted_at = ? WHERE id = ?').run(db.now(), cleaner.id);
    await logActivity(
      req.user.id,
      'deleted',
      'cleaner',
      `Deleted cleaner ${cleaner.first_name} ${cleaner.last_name}`
    );
    res.json({ message: 'Cleaner deleted successfully.' });
  } catch (err) {
    next(err);
  }
};