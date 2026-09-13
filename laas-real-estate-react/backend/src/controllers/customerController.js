const db = require('../config/db');
const { validate, boolify } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');

exports.index = (req, res, next) => {
  try {
    let sql = 'SELECT * FROM customers WHERE deleted_at IS NULL';
    const params = [];

    if (boolify(req.query.tenant)) {
      sql += ' AND is_tenant = 1';
    }

    if (req.query.search) {
      sql +=
        " AND (customer_number LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like, like);
    }

    sql += sortClause(req, {
      customer_number: 'customer_number',
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'email',
      phone: 'phone',
      created_at: 'created_at',
    });

    const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params).c;
    const rows = db
      .prepare(`${sql} LIMIT 15 OFFSET ?`)
      .all(...params, (Math.max(1, parseInt(req.query.page, 10) || 1) - 1) * 15);

    res.json(paginate(req, rows, total, 15));
  } catch (err) {
    next(err);
  }
};

exports.show = (req, res, next) => {
  try {
    const customer = db
      .prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Not found' });

    customer.land_sales = db
      .prepare(
        `SELECT land_sales.*, properties.title AS property_title FROM land_sales
         LEFT JOIN properties ON properties.id = land_sales.property_id
         WHERE land_sales.customer_id = ? AND land_sales.deleted_at IS NULL ORDER BY land_sales.created_at DESC`
      )
      .all(customer.id);
    customer.house_rentals = db
      .prepare(
        `SELECT house_rentals.*, properties.title AS property_title FROM house_rentals
         LEFT JOIN properties ON properties.id = house_rentals.property_id
         WHERE house_rentals.customer_id = ? AND house_rentals.deleted_at IS NULL ORDER BY house_rentals.created_at DESC`
      )
      .all(customer.id);
    customer.house_sales = db
      .prepare(
        `SELECT house_sales.*, properties.title AS property_title FROM house_sales
         LEFT JOIN properties ON properties.id = house_sales.property_id
         WHERE house_sales.customer_id = ? AND house_sales.deleted_at IS NULL ORDER BY house_sales.created_at DESC`
      )
      .all(customer.id);
    customer.payments = db
      .prepare(
        'SELECT * FROM payments WHERE customer_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
      )
      .all(customer.id);

    res.json(customer);
  } catch (err) {
    next(err);
  }
};

function rules(id = null) {
  return {
    first_name: 'required|string|max:255',
    last_name: 'required|string|max:255',
    email: id
      ? `nullable|email|unique:customers,email,null,${id}`
      : 'nullable|email|unique:customers,email',
    phone: 'nullable|string|max:20',
    address: 'nullable|string',
    id_type: 'nullable|string|max:50',
    is_buyer: 'boolean',
    is_tenant: 'boolean',
    notes: 'nullable|string',
  };
}

exports.store = (req, res, next) => {
  try {
    validate(req.body, rules());

    const last = db
      .prepare(
        "SELECT customer_number FROM customers WHERE customer_number LIKE 'CUST-%' ORDER BY CAST(SUBSTR(customer_number, 6) AS INTEGER) DESC LIMIT 1"
      )
      .get();
    const lastNum = last ? parseInt(last.customer_number.slice(5), 10) : 0;
    const customerNumber = `CUST-${String(lastNum + 1).padStart(5, '0')}`;

    const info = db
      .prepare(
        `INSERT INTO customers (customer_number, first_name, last_name, email, phone, address, id_type, is_buyer, is_tenant, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        customerNumber,
        req.body.first_name,
        req.body.last_name,
        req.body.email || null,
        req.body.phone || null,
        req.body.address || null,
        req.body.id_type || null,
        boolify(req.body.is_buyer) ? 1 : 0,
        boolify(req.body.is_tenant) ? 1 : 0,
        req.body.notes || null,
        db.now(),
        db.now()
      );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
    logActivity(
      req.user.id,
      'created',
      'customer',
      `Created customer ${customer.first_name} ${customer.last_name}`
    );
    res.status(201).json({ message: 'Customer created successfully.', customer });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const customer = db
      .prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Not found' });

    validate(req.body, rules(customer.id));

    db.prepare(
      `UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, id_type = ?, is_buyer = ?, is_tenant = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      req.body.first_name,
      req.body.last_name,
      req.body.email || null,
      req.body.phone || null,
      req.body.address || null,
      req.body.id_type || null,
      boolify(req.body.is_buyer) ? 1 : 0,
      boolify(req.body.is_tenant) ? 1 : 0,
      req.body.notes || null,
      db.now(),
      customer.id
    );

    logActivity(
      req.user.id,
      'updated',
      'customer',
      `Updated customer ${req.body.first_name} ${req.body.last_name}`
    );
    res.json({ message: 'Customer updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.destroy = (req, res, next) => {
  try {
    const customer = db
      .prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Not found' });

    db.prepare('UPDATE customers SET deleted_at = ? WHERE id = ?').run(db.now(), customer.id);
    logActivity(
      req.user.id,
      'deleted',
      'customer',
      `Deleted customer ${customer.first_name} ${customer.last_name}`
    );
    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
