const db = require('../config/db');
const { validate } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');

exports.index = async (req, res, next) => {
  try {
    let sql = `
      SELECT used_items.*, customers.first_name || ' ' || customers.last_name AS customer_name
      FROM used_items LEFT JOIN customers ON customers.id = used_items.customer_id
      WHERE used_items.deleted_at IS NULL`;
    const params = [];

    if (req.query.search) {
      sql += ' AND (used_items.name LIKE ? OR used_items.category LIKE ? OR used_items.condition LIKE ? OR used_items.status LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like);
    }
    if (req.query.status) {
      sql += ' AND used_items.status = ?';
      params.push(req.query.status);
    }
    if (req.query.category) {
      sql += ' AND used_items.category = ?';
      params.push(req.query.category);
    }

    sql += sortClause(req, {
      name: 'used_items.name',
      category: 'used_items.category',
      condition: 'used_items.condition',
      price: 'used_items.price',
      customer_name: 'customer_name',
      status: 'used_items.status',
      created_at: 'used_items.created_at',
    });

    const total = (await db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params)).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = await db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);

    const categories = (await db
      .prepare(
        "SELECT DISTINCT category FROM used_items WHERE category IS NOT NULL AND deleted_at IS NULL ORDER BY category"
      )
      .all()).map((r) => r.category);

    res.json({ ...paginate(req, rows, total, 15), categories });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const item = await db
      .prepare('SELECT * FROM used_items WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    item.customer = item.customer_id
      ? await db.prepare('SELECT * FROM customers WHERE id = ?').get(item.customer_id)
      : null;
    item.buyer = item.sold_to
      ? await db.prepare('SELECT * FROM customers WHERE id = ?').get(item.sold_to)
      : null;
    item.payments = await db
      .prepare(
        `SELECT payments.*, customers.first_name || ' ' || customers.last_name AS customer_name
         FROM payments LEFT JOIN customers ON customers.id = payments.customer_id
         WHERE payable_type = 'used_item' AND payable_id = ? AND payments.deleted_at IS NULL`
      )
      .all(item.id);

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.createMeta = async (req, res, next) => {
  try {
    const customers = await db
      .prepare('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY first_name')
      .all();
    res.json({ customers });
  } catch (err) {
    next(err);
  }
};

exports.store = async (req, res, next) => {
  try {
    await validate(req.body, {
      name: 'required|string|max:255',
      description: 'nullable|string',
      category: 'nullable|string|max:100',
      price: 'required|numeric|min:0',
      condition: 'required|in:new,good,fair,poor',
      status: 'required|in:available,sold',
      customer_id: 'nullable|exists:customers,id',
    });

    const info = await db
      .prepare(
        `INSERT INTO used_items (name, description, category, price, condition, status, customer_id, registered_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.body.name,
        req.body.description || null,
        req.body.category || null,
        parseFloat(req.body.price),
        req.body.condition,
        req.body.status,
        req.body.customer_id || null,
        req.user.id,
        db.now(),
        db.now()
      );

    await logActivity(req.user.id, 'created', 'used_item', `Created used item ${req.body.name}`);
    res.status(201).json({ message: 'Used item created successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.editMeta = async (req, res, next) => {
  try {
    const item = await db
      .prepare('SELECT * FROM used_items WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    const customers = await db
      .prepare('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY first_name')
      .all();
    res.json({ record: item, customers });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await db
      .prepare('SELECT * FROM used_items WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    await validate(req.body, {
      name: 'required|string|max:255',
      description: 'nullable|string',
      category: 'nullable|string|max:100',
      price: 'required|numeric|min:0',
      condition: 'required|in:new,good,fair,poor',
      status: 'required|in:available,sold',
      customer_id: 'nullable|exists:customers,id',
      sold_to: 'nullable|exists:customers,id',
      sold_date: 'nullable|date',
    });

    await db
      .prepare(
        `UPDATE used_items SET name = ?, description = ?, category = ?, price = ?, condition = ?, status = ?, customer_id = ?, sold_to = ?, sold_date = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        req.body.name,
        req.body.description || null,
        req.body.category || null,
        parseFloat(req.body.price),
        req.body.condition,
        req.body.status,
        req.body.customer_id || null,
        req.body.sold_to || null,
        req.body.sold_date || null,
        db.now(),
        item.id
      );

    await logActivity(req.user.id, 'updated', 'used_item', `Updated used item ${req.body.name}`);
    res.json({ message: 'Used item updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const item = await db
      .prepare('SELECT * FROM used_items WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    const newStatus = item.status === 'available' ? 'sold' : 'available';
    await db.prepare('UPDATE used_items SET status = ?, updated_at = ? WHERE id = ?').run(
      newStatus,
      db.now(),
      item.id
    );
    await logActivity(req.user.id, 'updated', 'used_item', `Toggled status of used item ${item.name}`);
    res.json({ status: newStatus });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const item = await db
      .prepare('SELECT * FROM used_items WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    await db.prepare('UPDATE used_items SET deleted_at = ? WHERE id = ?').run(db.now(), item.id);
    await logActivity(req.user.id, 'deleted', 'used_item', `Deleted used item ${item.name}`);
    res.json({ message: 'Used item deleted successfully.' });
  } catch (err) {
    next(err);
  }
};