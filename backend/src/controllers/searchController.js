const db = require('../config/db');

exports.search = async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || String(q).length < 2) {
      return res.status(400).json({
        message: 'Please enter at least 2 characters to search.',
      });
    }
    const like = `%${q}%`;
    const results = [];

    const properties = await db
      .prepare(
        'SELECT * FROM properties WHERE deleted_at IS NULL AND (title LIKE ? OR location LIKE ?) LIMIT 20'
      )
      .all(like, like);
    properties.forEach((p) => {
      results.push({
        type: 'property',
        title: p.title,
        description: p.location,
        url: `/properties/${p.id}`,
      });
    });

    const customers = await db
      .prepare(
        'SELECT * FROM customers WHERE deleted_at IS NULL AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?) LIMIT 20'
      )
      .all(like, like, like, like);
    customers.forEach((c) => {
      results.push({
        type: 'customer',
        title: `${c.first_name} ${c.last_name}`,
        description: c.email,
        url: `/customers/${c.id}`,
      });
    });

    const payments = await db
      .prepare(
        'SELECT * FROM payments WHERE deleted_at IS NULL AND reference_number LIKE ? LIMIT 20'
      )
      .all(like);
    payments.forEach((p) => {
      results.push({
        type: 'payment',
        title: p.reference_number,
        description: Number(p.amount).toFixed(2),
        url: `/payments/${p.id}`,
      });
    });

    res.json({ query: q, results });
  } catch (err) {
    next(err);
  }
};