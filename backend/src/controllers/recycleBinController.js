const db = require('../config/db');
const { logActivity } = require('../helpers/activityLog');

const REGISTRY = {
  property: { table: 'properties', label: 'Property', nameCol: 'title' },
  customer: { table: 'customers', label: 'Customer', nameCol: "first_name || ' ' || last_name" },
  land_sale: { table: 'land_sales', label: 'Land Sale', nameCol: null },
  house_sale: { table: 'house_sales', label: 'House Sale', nameCol: null },
  house_rental: { table: 'house_rentals', label: 'House Rental', nameCol: null },
  used_item: { table: 'used_items', label: 'Used Item', nameCol: 'name' },
  payment: { table: 'payments', label: 'Payment', nameCol: 'reference_number' },
  cleaner: { table: 'cleaners', label: 'Cleaner', nameCol: "first_name || ' ' || last_name" },
  user: { table: 'users', label: 'User', nameCol: 'name' },
};

exports.index = async (req, res, next) => {
  try {
    const typeFilter = req.query.type && REGISTRY[req.query.type] ? req.query.type : null;
    const types = typeFilter ? [typeFilter] : Object.keys(REGISTRY);
    let items = [];

    for (const type of types) {
      const { table, label, nameCol } = REGISTRY[type];
      const rows = await db
        .prepare(
          `SELECT id, deleted_at, ${nameCol ? `${nameCol} AS display_name` : `NULL AS display_name`} FROM ${table} WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
        )
        .all();
      rows.forEach((r) => {
        items.push({
          id: r.id,
          type,
          type_label: label,
          name: r.display_name || `#${r.id}`,
          deleted_at: r.deleted_at,
        });
      });
    }

    const sortKeys = ['type', 'type_label', 'name', 'deleted_at'];
    const sortKey = sortKeys.includes(req.query.sort) ? req.query.sort : 'deleted_at';
    const ascending = req.query.direction === 'asc';
    items.sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    const total = items.length;
    const perPage = 15;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const slice = items.slice((page - 1) * perPage, page * perPage);

    res.json({
      data: slice,
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: total === 0 ? null : (page - 1) * perPage + 1,
      to: total === 0 ? null : (page - 1) * perPage + slice.length,
      currentType: typeFilter || '',
    });
  } catch (err) {
    next(err);
  }
};

exports.restore = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entry = REGISTRY[type];
    if (!entry) return res.status(400).json({ message: 'Invalid item type.' });

    const row = await db
      .prepare(`SELECT * FROM ${entry.table} WHERE id = ? AND deleted_at IS NOT NULL`)
      .get(id);
    if (!row) return res.status(404).json({ message: 'Not found' });

    await db.prepare(`UPDATE ${entry.table} SET deleted_at = NULL WHERE id = ?`).run(id);

    const displayName =
      row.title ||
      (row.first_name ? `${row.first_name} ${row.last_name}` : null) ||
      row.name ||
      row.reference_number ||
      `#${id}`;
    await logActivity(req.user.id, 'restored', type, `Restored ${entry.label} ${displayName}`);
    res.json({ message: `${entry.label} restored successfully.` });
  } catch (err) {
    next(err);
  }
};

exports.forceDelete = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entry = REGISTRY[type];
    if (!entry) return res.status(400).json({ message: 'Invalid item type.' });

    const row = await db
      .prepare(`SELECT * FROM ${entry.table} WHERE id = ? AND deleted_at IS NOT NULL`)
      .get(id);
    if (!row) return res.status(404).json({ message: 'Not found' });

    await db.prepare(`DELETE FROM ${entry.table} WHERE id = ?`).run(id);

    const displayName =
      row.title ||
      (row.first_name ? `${row.first_name} ${row.last_name}` : null) ||
      row.name ||
      row.reference_number ||
      `#${id}`;
    await logActivity(
      req.user.id,
      'permanently_deleted',
      type,
      `Permanently deleted ${entry.label} ${displayName}`
    );
    res.json({ message: `${entry.label} permanently deleted.` });
  } catch (err) {
    next(err);
  }
};