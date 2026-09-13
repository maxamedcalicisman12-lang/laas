const db = require('../config/db');

function count(table, where = 'deleted_at IS NULL') {
  return db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE ${where}`).get().c;
}

function sum(table, column, where = 'deleted_at IS NULL') {
  return db.prepare(`SELECT COALESCE(SUM(${column}), 0) as s FROM ${table} WHERE ${where}`).get().s;
}

const TRASHED_TABLES = ['cleaners', 'customers', 'properties', 'land_sales', 'house_sales', 'house_rentals', 'used_items', 'payments'];

exports.index = (req, res) => {
  const nowDate = new Date();
  const thisMonthStart = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-01`;
  const lastMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
  const lastMonthStart = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
  const lastMonthEnd = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-01`;

  const stats = {
    total_properties: count('properties'),
    available_properties: count('properties', "status = 'available' AND deleted_at IS NULL"),
    rented_properties: count('properties', "status = 'rented' AND deleted_at IS NULL"),
    sold_properties: count('properties', "status = 'sold' AND deleted_at IS NULL"),
    total_customers: count('customers'),
    active_rentals: count('house_rentals', "status = 'active' AND deleted_at IS NULL"),
    total_payments: sum('payments', 'amount', "status = 'completed' AND deleted_at IS NULL"),
    pending_payments: sum('payments', 'amount', "status = 'pending' AND deleted_at IS NULL"),
    land_sales: count('land_sales'),
    house_sales: count('house_sales'),
    used_items: count('used_items'),
    cleaners: count('cleaners'),
    completed_sales:
      count('land_sales', "status = 'completed' AND deleted_at IS NULL") +
      count('house_sales', "status = 'completed' AND deleted_at IS NULL"),
    pending_sales:
      count('land_sales', "status = 'pending' AND deleted_at IS NULL") +
      count('house_sales', "status = 'pending' AND deleted_at IS NULL"),
    cancelled_sales:
      count('land_sales', "status = 'cancelled' AND deleted_at IS NULL") +
      count('house_sales', "status = 'cancelled' AND deleted_at IS NULL"),
    completed_sales_revenue:
      sum('land_sales', 'sale_price', "status = 'completed' AND deleted_at IS NULL") +
      sum('house_sales', 'sale_price', "status = 'completed' AND deleted_at IS NULL"),
  };

  stats.this_month_sales =
    db
      .prepare(
        `SELECT COUNT(*) as c FROM land_sales WHERE strftime('%Y-%m', sale_date) = ? AND deleted_at IS NULL`
      )
      .get(thisMonthStart.slice(0, 7)).c +
    db
      .prepare(
        `SELECT COUNT(*) as c FROM house_sales WHERE strftime('%Y-%m', sale_date) = ? AND deleted_at IS NULL`
      )
      .get(thisMonthStart.slice(0, 7)).c;

  stats.this_month_revenue =
    db
      .prepare(
        `SELECT COALESCE(SUM(sale_price),0) as s FROM land_sales WHERE strftime('%Y-%m', sale_date) = ? AND status = 'completed' AND deleted_at IS NULL`
      )
      .get(thisMonthStart.slice(0, 7)).s +
    db
      .prepare(
        `SELECT COALESCE(SUM(sale_price),0) as s FROM house_sales WHERE strftime('%Y-%m', sale_date) = ? AND status = 'completed' AND deleted_at IS NULL`
      )
      .get(thisMonthStart.slice(0, 7)).s;

  stats.last_month_sales =
    db
      .prepare(
        `SELECT COUNT(*) as c FROM land_sales WHERE sale_date >= ? AND sale_date < ? AND deleted_at IS NULL`
      )
      .get(lastMonthStart, lastMonthEnd).c +
    db
      .prepare(
        `SELECT COUNT(*) as c FROM house_sales WHERE sale_date >= ? AND sale_date < ? AND deleted_at IS NULL`
      )
      .get(lastMonthStart, lastMonthEnd).c;

  const recentProperties = db
    .prepare('SELECT * FROM properties WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5')
    .all();

  stats.recycle_bin_count = TRASHED_TABLES.reduce(
    (acc, table) => acc + count(table, 'deleted_at IS NOT NULL'),
    0
  );

  const recentPayments = db
    .prepare(
      `SELECT payments.*, customers.first_name || ' ' || customers.last_name AS customer_name
       FROM payments LEFT JOIN customers ON customers.id = payments.customer_id
       WHERE payments.deleted_at IS NULL ORDER BY payments.created_at DESC LIMIT 5`
    )
    .all();

  const recentActivities = db
    .prepare(
      `SELECT activity_logs.*, users.name AS user_name
       FROM activity_logs LEFT JOIN users ON users.id = activity_logs.user_id
       ORDER BY activity_logs.created_at DESC LIMIT 10`
    )
    .all();

  const landSales = db
    .prepare(
      `SELECT land_sales.*, customers.first_name || ' ' || customers.last_name AS customer_name,
              properties.title AS property_title
       FROM land_sales
       LEFT JOIN customers ON customers.id = land_sales.customer_id
       LEFT JOIN properties ON properties.id = land_sales.property_id
       WHERE land_sales.deleted_at IS NULL ORDER BY land_sales.created_at DESC LIMIT 5`
    )
    .all()
    .map((r) => ({ ...r, type: 'Land' }));

  const houseSales = db
    .prepare(
      `SELECT house_sales.*, customers.first_name || ' ' || customers.last_name AS customer_name,
              properties.title AS property_title
       FROM house_sales
       LEFT JOIN customers ON customers.id = house_sales.customer_id
       LEFT JOIN properties ON properties.id = house_sales.property_id
       WHERE house_sales.deleted_at IS NULL ORDER BY house_sales.created_at DESC LIMIT 5`
    )
    .all()
    .map((r) => ({ ...r, type: 'House' }));

  const recentSales = [...landSales, ...houseSales]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 5);

  res.json({ stats, recentProperties, recentPayments, recentActivities, recentSales });
};
