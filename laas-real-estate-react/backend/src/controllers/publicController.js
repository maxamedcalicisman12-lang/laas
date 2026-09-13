const db = require('../config/db');

function parseImages(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function enrich(rows) {
  return rows.map((r) => ({ ...r, images_parsed: parseImages(r.images) }));
}

function fetchAvailable({ table, module }) {
  const extraCols =
    module === 'house_rental'
      ? `${table}.rent_amount, ${table}.deposit, ${table}.start_date, ${table}.end_date`
      : module === 'land_sale'
        ? `${table}.sale_price, ${table}.commission, ${table}.meters`
        : `${table}.sale_price, ${table}.commission, ${table}.sale_date`;

  const rows = db
    .prepare(
      `SELECT
         ${table}.id AS sale_id,
         ${table}.property_id,
         ${table}.status,
         ${table}.location AS sale_location,
         ${extraCols},
         properties.title AS title,
         properties.description,
         properties.type AS property_type,
         properties.location AS property_location,
         properties.address,
         properties.price AS property_price,
         properties.area,
         properties.bedrooms,
         properties.bathrooms,
         properties.floors,
         properties.house_type,
         properties.land_type,
         properties.images,
         properties.phone,
         properties.owner,
         properties.amenities
       FROM ${table}
       LEFT JOIN properties ON properties.id = ${table}.property_id
       WHERE ${table}.status = 'available' AND ${table}.deleted_at IS NULL
       ORDER BY ${table}.created_at DESC`
    )
    .all();

  return enrich(rows);
}

exports.index = function (req, res) {
  const houseSales = fetchAvailable({ table: 'house_sales', module: 'house_sale' });
  const houseRentals = fetchAvailable({ table: 'house_rentals', module: 'house_rental' });
  const landSales = fetchAvailable({ table: 'land_sales', module: 'land_sale' });

  res.json({
    house_sales: houseSales,
    house_rentals: houseRentals,
    land_sales: landSales,
  });
};
