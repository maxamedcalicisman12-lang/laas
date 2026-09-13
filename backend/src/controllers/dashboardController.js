const db = require('../config/db');

// Month expression differs per driver: Postgres uses to_char, SQLite strftime.
const monthExpr = db.driver === 'pg' ? "to_char(sale_date, 'YYYY-MM')" : "strftime('%Y-%m', sale_date)";

async function count(table, where = 'deleted_at IS NULL') {
  const row = await db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE ${where}`).get();
  return row.c;
}

async function sum(table, column, where = 'deleted_at IS NULL') {
  const row = await db
    .prepare(`SELECT COALESCE(SUM(${column}), 0) as s FROM ${table} WHERE ${where}`)
    .get();
  return row.s;
}

const TRASHED_TABLES = ['cleaners', 'customers', 'properties', 'land_sales', 'house_sales', 'house_rentals', 'used_items', 'payments'];

exports.index = async (req, res, next) => {
  try {
    const nowDate = new Date();
    const thisMonthStart = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
    const lastMonthStart = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonthEnd = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-01`;

    const stats = {
      total_properties: await count('properties'),
      available_properties: await count('properties', "status = 'available' AND deleted_at IS NULL"),
      rented_properties: await count('properties', "status = 'rented' AND deleted_at IS NULL"),
      sold_properties: await count('properties', "status = 'sold' AND deleted_at IS NULL"),
      total_customers: await count('customers'),
      active_rentals: await count('house_rentals', "status = 'active' AND deleted_at IS NULL"),
      total_payments: await sum('payments', 'amount', "status = 'completed' AND deleted_at IS NULL"),
      pending_payments: await sum('payments', 'amount', "status = 'pending' AND deleted_at IS NULL"),
      land_sales: await count('land_sales'),
      house_sales: await count('house_sales'),
      used_items: await count('used_items'),
      cleaners: await count('cleaners'),
      completed_sales:
        (await count('land_sales', "status = 'completed' AND deleted_at IS NULL")) +
        (await count('house_sales', "status = 'completed' AND deleted_at IS NULL")),
      pending_sales:
        (await count('land_sales', "status = 'pending' AND deleted_at IS NULL")) +
        (await count('house_sales', "status = 'pending' AND deleted_at IS NULL")),
      cancelled_sales:
        (await count('land_sales', "status = 'cancelled' AND deleted_at IS NULL")) +
        (await count('house_sales', "status = 'cancelled' AND deleted_at IS NULL")),
      completed_sales_revenue:
        (await sum('land_sales', 'sale_price', "status = 'completed' AND deleted_at IS NULL")) +
        (await sum('house_sales', 'sale_price', "status = 'completed' AND deleted_at IS NULL")),
      total_commission: await sum('commissions', 'commission', 'deleted_at IS NULL'),
      pending_commission: await sum('commissions', 'commission', "status = 'pending' AND deleted_at IS NULL"),
    };

    stats.this_month_sales =
      (await db
        .prepare(
          `SELECT COUNT(*) as c FROM land_sales WHERE ${monthExpr} = ? AND deleted_at IS NULL`
        )
        .get(thisMonthStart.slice(0, 7))).c +
      (await db
        .prepare(
          `SELECT COUNT(*) as c FROM house_sales WHERE ${monthExpr} = ? AND deleted_at IS NULL`
        )
        .get(thisMonthStart.slice(0, 7))).c;

    stats.this_month_revenue =
      (await db
        .prepare(
          `SELECT COALESCE(SUM(sale_price),0) as s FROM land_sales WHERE ${monthExpr} = ? AND status = 'completed' AND deleted_at IS NULL`
        )
        .get(thisMonthStart.slice(0, 7))).s +
      (await db
        .prepare(
          `SELECT COALESCE(SUM(sale_price),0) as s FROM house_sales WHERE ${monthExpr} = ? AND status = 'completed' AND deleted_at IS NULL`
        )
        .get(thisMonthStart.slice(0, 7))).s;

    stats.last_month_sales =
      (await db
        .prepare(
          `SELECT COUNT(*) as c FROM land_sales WHERE sale_date >= ? AND sale_date < ? AND deleted_at IS NULL`
        )
        .get(lastMonthStart, lastMonthEnd)).c +
      (await db
        .prepare(
          `SELECT COUNT(*) as c FROM house_sales WHERE sale_date >= ? AND sale_date < ? AND deleted_at IS NULL`
        )
        .get(lastMonthStart, lastMonthEnd)).c;

    const recentProperties = await db
      .prepare('SELECT * FROM properties WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5')
      .all();

    stats.recycle_bin_count = 0;
    for (const table of TRASHED_TABLES) {
      stats.recycle_bin_count += await count(table, 'deleted_at IS NOT NULL');
    }

    const recentPayments = await db
      .prepare(
        `SELECT payments.*, customers.first_name || ' ' || customers.last_name AS customer_name
         FROM payments LEFT JOIN customers ON customers.id = payments.customer_id
         WHERE payments.deleted_at IS NULL ORDER BY payments.created_at DESC LIMIT 5`
      )
      .all();

    const recentActivities = await db
      .prepare(
        `SELECT activity_logs.*, users.name AS user_name
         FROM activity_logs LEFT JOIN users ON users.id = activity_logs.user_id
         ORDER BY activity_logs.created_at DESC LIMIT 10`
      )
      .all();

    const landSales = (await db
      .prepare(
        `SELECT land_sales.*, customers.first_name || ' ' || customers.last_name AS customer_name,
                properties.title AS property_title
         FROM land_sales
         LEFT JOIN customers ON customers.id = land_sales.customer_id
         LEFT JOIN properties ON properties.id = land_sales.property_id
         WHERE land_sales.deleted_at IS NULL ORDER BY land_sales.created_at DESC LIMIT 5`
      )
      .all()).map((r) => ({ ...r, type: 'Land' }));

    const houseSales = (await db
      .prepare(
        `SELECT house_sales.*, customers.first_name || ' ' || customers.last_name AS customer_name,
                properties.title AS property_title
         FROM house_sales
         LEFT JOIN customers ON customers.id = house_sales.customer_id
         LEFT JOIN properties ON properties.id = house_sales.property_id
         WHERE house_sales.deleted_at IS NULL ORDER BY house_sales.created_at DESC LIMIT 5`
      )
      .all()).map((r) => ({ ...r, type: 'House' }));

    const recentSales = [...landSales, ...houseSales]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 5);

    res.json({ stats, recentProperties, recentPayments, recentActivities, recentSales });
  } catch (err) {
    next(err);
  }
};