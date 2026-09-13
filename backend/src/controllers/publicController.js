const db = require('../config/db');
const { validate } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');

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

async function fetchAvailable({ table, module }) {
  const isRental = module === 'house_rental';
  const isLand = module === 'land_sale';

  const saleCols = isRental
    ? `${table}.rent_amount, ${table}.deposit, ${table}.start_date, ${table}.end_date`
    : isLand
      ? `${table}.sale_price, ${table}.commission, ${table}.meters`
      : `${table}.sale_price, ${table}.commission, ${table}.sale_date`;

  const standaloneCols = isRental
    ? 'p.price AS rent_amount, NULL AS deposit, NULL AS start_date, NULL AS end_date'
    : isLand
      ? 'p.price AS sale_price, NULL AS commission, NULL AS meters'
      : 'p.price AS sale_price, NULL AS commission, NULL AS sale_date';

  const typeList = isLand
    ? "'land','land-sale'"
    : isRental
      ? "'house-rental'"
      : "'house','apartment','villa','house-sale'";

  const rows = await db
    .prepare(
      `SELECT
         ${table}.id AS sale_id,
         ${table}.property_id,
         ${table}.status,
         ${table}.location AS sale_location,
         ${saleCols},
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
         properties.amenities,
         ${table}.created_at
       FROM ${table}
       JOIN properties ON properties.id = ${table}.property_id
       WHERE ${table}.status = 'available'
         AND ${table}.deleted_at IS NULL
         AND properties.deleted_at IS NULL
         AND properties.type IN (${typeList})

       UNION ALL

       SELECT
         NULL AS sale_id,
         p.id AS property_id,
         p.status,
         NULL AS sale_location,
         ${standaloneCols},
         p.title,
         p.description,
         p.type AS property_type,
         p.location AS property_location,
         p.address,
         p.price AS property_price,
         p.area,
         p.bedrooms,
         p.bathrooms,
         p.floors,
         p.house_type,
         p.land_type,
         p.images,
         p.phone,
         p.owner,
         p.amenities,
         p.created_at
       FROM properties p
       WHERE p.type IN (${typeList})
         AND p.status = 'available'
         AND p.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM ${table} s
           WHERE s.property_id = p.id AND s.deleted_at IS NULL
         )
       ORDER BY created_at DESC`
    )
    .all();

  return enrich(rows);
}

exports.index = async function (req, res, next) {
  try {
    const [houseSales, houseRentals, landSales] = await Promise.all([
      fetchAvailable({ table: 'house_sales', module: 'house_sale' }),
      fetchAvailable({ table: 'house_rentals', module: 'house_rental' }),
      fetchAvailable({ table: 'land_sales', module: 'land_sale' }),
    ]);

    res.json({
      house_sales: houseSales,
      house_rentals: houseRentals,
      land_sales: landSales,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async function (req, res, next) {
  try {
    const property = await db
      .prepare(
        "SELECT * FROM properties WHERE id = ? AND deleted_at IS NULL AND status = 'available'"
      )
      .get(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Not found' });
    }

    let sale = null;
    if (property.type === 'house-rental') {
      sale = await db
        .prepare("SELECT * FROM house_rentals WHERE property_id = ? AND deleted_at IS NULL AND status = 'available'")
        .get(property.id);
    } else if (property.type === 'land' || property.type === 'land-sale') {
      sale = await db
        .prepare("SELECT * FROM land_sales WHERE property_id = ? AND deleted_at IS NULL AND status = 'available'")
        .get(property.id);
    } else {
      sale = await db
        .prepare("SELECT * FROM house_sales WHERE property_id = ? AND deleted_at IS NULL AND status = 'available'")
        .get(property.id);
    }

    const { images, ...rest } = property;
    res.json({
      ...rest,
      images_parsed: parseImages(images),
      sale: sale || null,
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async function (req, res, next) {
  try {
    await validate(req.body, {
      name: 'required|string|max:255',
      phone: 'required|string|max:30',
      interest: 'nullable|string|max:50',
    });

    const info = await db
      .prepare(
        `INSERT INTO public_inquiries (type, name, email, phone, interest, subject, message, created_at, updated_at)
         VALUES ('register', ?, ?, ?, ?, NULL, NULL, ?, ?)`
      )
      .run(
        String(req.body.name),
        String(req.body.email || '').trim(),
        req.body.phone || null,
        req.body.interest || null,
        db.now(),
        db.now()
      );

    try {
      const phone = String(req.body.phone || '').trim();
      const normalizePhone = (p) => {
        let d = String(p).replace(/\D/g, '');
        if (d.startsWith('0')) d = d.slice(1);
        if (d.startsWith('252')) d = d.slice(3);
        return d;
      };
      const phoneKey = phone ? normalizePhone(phone) : '';
      let existing = null;
      if (phoneKey) {
        const candidates = await db
          .prepare("SELECT * FROM customers WHERE deleted_at IS NULL AND phone IS NOT NULL AND phone != ''")
          .all();
        existing = candidates.find((c) => normalizePhone(c.phone) === phoneKey) || null;
      }

      let customerId = existing ? existing.id : null;
      if (!customerId) {
        const parts = String(req.body.name).trim().split(/\s+/);
        const first_name = parts[0] || req.body.name;
        const last_name = parts.slice(1).join(' ');

        const last = await db
          .prepare(
            "SELECT customer_number FROM customers WHERE customer_number LIKE 'CUST-%' ORDER BY CAST(SUBSTR(customer_number, 6) AS INTEGER) DESC LIMIT 1"
          )
          .get();
        const lastNum = last ? parseInt(last.customer_number.slice(5), 10) : 0;
        const customerNumber = `CUST-${String(lastNum + 1).padStart(5, '0')}`;

        const isRental = req.body.interest === 'house_rental';
        const isBuyer = req.body.interest === 'house_sale' || req.body.interest === 'land_sale' || !isRental;

        const custInfo = await db
          .prepare(
            `INSERT INTO customers (customer_number, first_name, last_name, email, phone, is_buyer, is_tenant, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            customerNumber,
            first_name,
            last_name,
            null,
            phone || null,
            isBuyer ? 1 : 0,
            isRental ? 1 : 0,
            `Is-diwaangelin toos ah (public). Interest: ${req.body.interest || 'N/A'}`,
            db.now(),
            db.now()
          );
        customerId = custInfo.lastInsertRowid;
      }

      await logActivity(
        customerId,
        'created',
        'customer',
        `Customer automatically registered via public listing (${req.body.interest || 'N/A'})`
      );
    } catch (customerErr) {
      console.error('Auto customer creation failed:', customerErr);
    }

    res.status(201).json({ message: 'Diwaangelin waad ku guuleysatay. Waannu kula xiriiri doonnaa.', id: info.lastInsertRowid });
  } catch (err) {
    next(err);
  }
};

exports.contact = async function (req, res, next) {
  try {
    await validate(req.body, {
      name: 'required|string|max:255',
      email: 'required|email|max:255',
      phone: 'nullable|string|max:30',
      subject: 'required|string|max:255',
      message: 'required|string|max:5000',
    });

    const info = await db
      .prepare(
        `INSERT INTO public_inquiries (type, name, email, phone, interest, subject, message, created_at, updated_at)
         VALUES ('contact', ?, ?, ?, NULL, ?, ?, ?, ?)`
      )
      .run(
        String(req.body.name),
        String(req.body.email).trim(),
        req.body.phone || null,
        String(req.body.subject),
        String(req.body.message),
        db.now(),
        db.now()
      );

    res.status(201).json({ message: 'Fariintaada waan ku helnay. Waannu kula soo xiriiri doonnaa.', id: info.lastInsertRowid });
  } catch (err) {
    next(err);
  }
};