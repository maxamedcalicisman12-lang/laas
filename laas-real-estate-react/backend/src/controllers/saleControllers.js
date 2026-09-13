const db = require('../config/db');
const { validate } = require('../helpers/validate');
const settings = require('../helpers/settings');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');

function round2(n) {
  return Math.round(n * 100) / 100;
}

function commissionFor(amount) {
  const rate = settings.getFloat('commission_rate', 10);
  return { rate, commission: round2((parseFloat(amount) || 0) * rate / 100) };
}

function syncCommission(sourceType, sourceId, propertyId, customerId, amount, registeredBy) {
  const { rate, commission } = commissionFor(amount);
  db.prepare('DELETE FROM commissions WHERE commission_type = ? AND commission_id = ?').run(
    sourceType,
    sourceId
  );
  db.prepare(
    `INSERT INTO commissions (commission_type, commission_id, property_id, customer_id, amount, rate, commission, status, registered_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).run(
    sourceType,
    sourceId,
    propertyId || null,
    customerId || null,
    parseFloat(amount) || 0,
    rate,
    commission,
    registeredBy,
    db.now(),
    db.now()
  );
}

function makeSaleController({ table, module }) {
  const label = module.replace(/_/g, ' ');

  function index(req, res, next) {
    try {
      let sql = `
        SELECT ${table}.*, properties.title AS property_title,
               customers.first_name || ' ' || customers.last_name AS customer_name
        FROM ${table}
        LEFT JOIN properties ON properties.id = ${table}.property_id
        LEFT JOIN customers ON customers.id = ${table}.customer_id
        WHERE ${table}.deleted_at IS NULL`;
      const params = [];

      if (req.query.search) {
        sql += ` AND (${table}.status LIKE ? OR CAST(${table}.${module === 'house_rental' ? 'rent_amount' : 'sale_price'} AS TEXT) LIKE ? OR properties.title LIKE ? OR customers.first_name LIKE ? OR customers.last_name LIKE ?)`;
        const like = `%${req.query.search}%`;
        params.push(like, like, like, like, like);
      }
      if (req.query.status) {
        sql += ` AND ${table}.status = ?`;
        params.push(req.query.status);
      }

      const amountCol = module === 'house_rental' ? `${table}.rent_amount` : `${table}.sale_price`;
      sql += sortClause(req, {
        property_title: 'properties.title',
        customer_name: 'customer_name',
        amount: amountCol,
        ...(module === 'land_sale' ? { meters: `${table}.meters` } : {}),
        commission: `${table}.commission`,
        location: `${table}.location`,
        status: `${table}.status`,
        created_at: `${table}.created_at`,
      });

      const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params).c;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const rows = db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);
      res.json(paginate(req, rows, total, 15));
    } catch (err) {
      next(err);
    }
  }

  function show(req, res, next) {
    try {
      const row = db
        .prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
        .get(req.params.id);
      if (!row) return res.status(404).json({ message: 'Not found' });

      row.property = db.prepare('SELECT * FROM properties WHERE id = ?').get(row.property_id);
      row.customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(row.customer_id);
      row.payments = db
        .prepare(
          `SELECT payments.*, customers.first_name || ' ' || customers.last_name AS customer_name
           FROM payments LEFT JOIN customers ON customers.id = payments.customer_id
           WHERE payable_type = ? AND payable_id = ? AND payments.deleted_at IS NULL`
        )
        .all(module, row.id);

      res.json(row);
    } catch (err) {
      next(err);
    }
  }

  function createMeta(req, res) {
    const isRental = module === 'house_rental';
    const isLand = module === 'land_sale';
    let properties;
    if (isLand) {
      properties = db
        .prepare("SELECT * FROM properties WHERE type = 'land' AND status != 'sold' AND deleted_at IS NULL")
        .all();
    } else {
      properties = db
        .prepare(
          "SELECT * FROM properties WHERE type IN ('house','apartment') AND status != ? AND deleted_at IS NULL"
        )
        .all(isRental ? 'rented' : 'sold');
    }
    const customers = db
      .prepare('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY first_name')
      .all();
    res.json({ properties, customers, commission_rate: settings.getFloat('commission_rate', 10) });
  }

  function editMeta(req, res, next) {
    try {
      const row = db
        .prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
        .get(req.params.id);
      if (!row) return res.status(404).json({ message: 'Not found' });

      const isLand = module === 'land_sale';
      const properties = isLand
        ? db.prepare("SELECT * FROM properties WHERE type = 'land' AND deleted_at IS NULL").all()
        : db
            .prepare(
              "SELECT * FROM properties WHERE type IN ('house','apartment') AND deleted_at IS NULL"
            )
            .all();
      const customers = db
        .prepare('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY first_name')
        .all();
      res.json({ record: row, properties, customers, commission_rate: settings.getFloat('commission_rate', 10) });
    } catch (err) {
      next(err);
    }
  }

  function store(req, res, next) {
    try {
      const amountField = module === 'house_rental' ? 'rent_amount' : 'sale_price';
      const rules = {
        property_id: 'required|exists:properties,id',
        customer_id: 'required|exists:customers,id',
        [amountField]: 'required|numeric|min:0',
        location: 'nullable|string|max:255',
        notes: 'nullable|string',
      };
      if (module === 'house_rental') {
        rules.deposit = 'nullable|numeric|min:0';
        rules.start_date = 'required|date';
        rules.end_date = 'nullable|date|after:start_date';
      } else {
        rules.commission = 'nullable|numeric|min:0';
        rules.sale_date = 'required|date';
        rules.payment_method = 'nullable|string|max:100';
      }
      if (module === 'land_sale') {
        rules.meters = 'nullable|string|max:255';
      }
      rules.status = 'required|in:available,not_available';

      validate(req.body, rules);

      const columns = ['property_id', 'customer_id', 'location', 'status', 'notes', 'registered_by', 'created_at', 'updated_at'];
      const values = [
        req.body.property_id,
        req.body.customer_id,
        req.body.location || null,
        req.body.status,
        req.body.notes || null,
        req.user.id,
        db.now(),
        db.now(),
      ];

      let sourceId;
      if (module === 'house_rental') {
        columns.splice(2, 0, 'rent_amount', 'deposit', 'start_date', 'end_date', 'commission');
        values.splice(
          2,
          0,
          parseFloat(req.body.rent_amount),
          req.body.deposit ? parseFloat(req.body.deposit) : 0,
          req.body.start_date,
          req.body.end_date || null,
          commissionFor(req.body.rent_amount).commission
        );
      } else {
        columns.splice(2, 0, 'sale_price', 'commission', 'sale_date', 'payment_method');
        values.splice(
          2,
          0,
          parseFloat(req.body.sale_price),
          commissionFor(req.body.sale_price).commission,
          req.body.sale_date,
          req.body.payment_method || null
        );
        if (module === 'land_sale') {
          columns.splice(4, 0, 'meters');
          values.splice(4, 0, req.body.meters || null);
        }
      }

      const placeholders = columns.map(() => '?').join(', ');
      const info = db
        .prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`)
        .run(...values);
      sourceId = info.lastInsertRowid;

      syncCommission(
        module,
        sourceId,
        req.body.property_id,
        req.body.customer_id,
        req.body[amountField],
        req.user.id
      );

      logActivity(
        req.user.id,
        'created',
        module,
        `Created ${label} for property #${req.body.property_id}`
      );
      res.status(201).json({ message: `${capitalize(label)} created successfully.` });
    } catch (err) {
      next(err);
    }
  }

  function update(req, res, next) {
    try {
      const row = db
        .prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
        .get(req.params.id);
      if (!row) return res.status(404).json({ message: 'Not found' });

      const amountField = module === 'house_rental' ? 'rent_amount' : 'sale_price';
      const rules = {
        property_id: 'required|exists:properties,id',
        customer_id: 'required|exists:customers,id',
        [amountField]: 'required|numeric|min:0',
        location: 'nullable|string|max:255',
        notes: 'nullable|string',
      };
      if (module === 'house_rental') {
        rules.deposit = 'nullable|numeric|min:0';
        rules.start_date = 'required|date';
        rules.end_date = 'nullable|date|after:start_date';
      } else {
        rules.commission = 'nullable|numeric|min:0';
        rules.sale_date = 'required|date';
        rules.payment_method = 'nullable|string|max:100';
      }
      if (module === 'land_sale') {
        rules.meters = 'nullable|string|max:255';
      }
      rules.status = 'required|in:available,not_available';

      validate(req.body, rules);

      const sets = ['property_id = ?', 'customer_id = ?', 'location = ?', 'status = ?', 'notes = ?', 'updated_at = ?'];
      const values = [
        req.body.property_id,
        req.body.customer_id,
        req.body.location || null,
        req.body.status,
        req.body.notes || null,
        db.now(),
      ];

      if (module === 'house_rental') {
        sets.push('rent_amount = ?', 'deposit = ?', 'start_date = ?', 'end_date = ?', 'commission = ?');
        values.push(
          parseFloat(req.body.rent_amount),
          req.body.deposit ? parseFloat(req.body.deposit) : 0,
          req.body.start_date,
          req.body.end_date || null,
          commissionFor(req.body.rent_amount).commission
        );
      } else {
        sets.push('sale_price = ?', 'commission = ?', 'sale_date = ?', 'payment_method = ?');
        values.push(
          parseFloat(req.body.sale_price),
          commissionFor(req.body.sale_price).commission,
          req.body.sale_date,
          req.body.payment_method || null
        );
        if (module === 'land_sale') {
          sets.push('meters = ?');
          values.push(req.body.meters || null);
        }
      }
      values.push(row.id);

      db.prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`).run(...values);

      syncCommission(
        module,
        row.id,
        req.body.property_id,
        req.body.customer_id,
        req.body[amountField],
        req.user.id
      );

      logActivity(req.user.id, 'updated', module, `Updated ${label} #${row.id}`);
      res.json({ message: `${capitalize(label)} updated successfully.` });
    } catch (err) {
      next(err);
    }
  }

  function toggleStatus(req, res, next) {
    try {
      const row = db
        .prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
        .get(req.params.id);
      if (!row) return res.status(404).json({ message: 'Not found' });

      const newStatus = row.status === 'available' ? 'not_available' : 'available';
      db.prepare(`UPDATE ${table} SET status = ?, updated_at = ? WHERE id = ?`).run(
        newStatus,
        db.now(),
        row.id
      );
      logActivity(req.user.id, 'updated', module, `Toggled status of ${label} #${row.id}`);
      res.json({ status: newStatus });
    } catch (err) {
      next(err);
    }
  }

  function destroy(req, res, next) {
    try {
      const row = db
        .prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
        .get(req.params.id);
      if (!row) return res.status(404).json({ message: 'Not found' });

      db.prepare(`UPDATE ${table} SET deleted_at = ? WHERE id = ?`).run(db.now(), row.id);
      logActivity(req.user.id, 'deleted', module, `Deleted ${label} #${row.id}`);
      res.json({ message: `${capitalize(label)} deleted successfully.` });
    } catch (err) {
      next(err);
    }
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return { index, show, createMeta, editMeta, store, update, toggleStatus, destroy };
}

const landSaleController = makeSaleController({ table: 'land_sales', module: 'land_sale' });
const houseRentalController = makeSaleController({ table: 'house_rentals', module: 'house_rental' });
const houseSaleController = makeSaleController({ table: 'house_sales', module: 'house_sale' });

module.exports = { landSaleController, houseRentalController, houseSaleController };
