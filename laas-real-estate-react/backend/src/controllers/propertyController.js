const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { validate } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');
const { paginate } = require('../helpers/paginate');

const NEIGHBORHOODS = [
  'Daami',
  'Ex Control',
  'Cadhootay',
  'Saamaley',
  'Sayidka',
  'Dhakhtarka Wayn',
  'Jaamalaaye',
  'Dhiif',
  'Farxaskulle',
  'Buulaha Dowladda',
];

const TYPE_ALIASES = { 'land-sale': 'land', 'house-sale': 'house', 'house-rental': 'house' };
const HOUSE_TYPES = ['house', 'land', 'apartment', 'commercial', 'villa'];

function storagePath() {
  return process.env.STORAGE_PATH || path.resolve(__dirname, '../../storage');
}

exports.neighborhoods = NEIGHBORHOODS;

exports.index = (req, res, next) => {
  try {
    const sortWhitelist = ['title', 'type', 'location', 'price', 'status', 'created_at'];
    const sort = sortWhitelist.includes(req.query.sort) ? req.query.sort : 'created_at';
    const direction = req.query.direction === 'asc' ? 'ASC' : 'DESC';

    let sql = 'SELECT * FROM properties WHERE deleted_at IS NULL';
    const params = [];

    if (req.query.status) {
      sql += ' AND status = ?';
      params.push(req.query.status);
    }
    if (req.query.type) {
      sql += ' AND type = ?';
      params.push(req.query.type);
    }
    if (req.query.location) {
      sql += ' AND location = ?';
      params.push(req.query.location);
    }
    if (req.query.price_min !== undefined && req.query.price_min !== '') {
      sql += ' AND price >= ?';
      params.push(parseFloat(req.query.price_min));
    }
    if (req.query.price_max !== undefined && req.query.price_max !== '') {
      sql += ' AND price <= ?';
      params.push(parseFloat(req.query.price_max));
    }
    if (req.query.search) {
      sql += ' AND (title LIKE ? OR location LIKE ? OR type LIKE ? OR status LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like, like);
    }

    sql += ` ORDER BY ${sort} ${direction}`;

    const total = db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);

    rows.forEach((r) => {
      r.images_parsed = r.images ? JSON.parse(r.images) : [];
    });

    res.json({ ...paginate(req, rows, total, 15), currentStatus: req.query.status || '', neighborhoods: NEIGHBORHOODS });
  } catch (err) {
    next(err);
  }
};

exports.apiShow = (req, res, next) => {
  try {
    const p = db
      .prepare('SELECT * FROM properties WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({
      id: p.id,
      title: p.title,
      type: p.type,
      house_type: p.house_type,
      land_type: p.land_type,
      description: p.description,
      location: p.location,
      address: p.address,
      price: p.price,
      area: p.area,
      status: p.status,
      owner: p.owner,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      floors: p.floors,
      images: p.images ? JSON.parse(p.images) : [],
      amenities: p.amenities ? JSON.parse(p.amenities) : [],
    });
  } catch (err) {
    next(err);
  }
};

exports.show = (req, res, next) => {
  try {
    const p = db
      .prepare('SELECT * FROM properties WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    p.images_parsed = p.images ? JSON.parse(p.images) : [];
    p.amenities_parsed = p.amenities ? JSON.parse(p.amenities) : [];
    res.json(p);
  } catch (err) {
    next(err);
  }
};

exports.createMeta = (req, res) => {
  res.json({ neighborhoods: NEIGHBORHOODS });
};

function baseRules() {
  return {
    title: 'required|string|max:255',
    owner: 'nullable|string|max:255',
    type: `required|in:${HOUSE_TYPES.join(',')},land-sale,house-sale,house-rental`,
    description: 'nullable|string',
    location: 'nullable|string|max:255',
    address: 'nullable|string',
    price: 'required|numeric|min:0',
    area: 'nullable|string|max:255',
    status: 'required|in:available,not_available,rented,sold,pending',
    bedrooms: 'nullable|integer|min:0',
    bathrooms: 'nullable|numeric|min:0',
    floors: 'nullable|integer|min:1',
    house_type: 'nullable|string|max:100',
    land_type: 'nullable|string|max:100',
    amenities: 'nullable|array',
    phone: 'nullable|string|max:50',
    country_code: 'nullable|string|max:10',
  };
}

exports.store = (req, res, next) => {
  try {
    const rules = baseRules();
    const rawType = req.body.type;
    const houseLike = ['house', 'house-sale', 'house-rental', 'villa'].includes(rawType);

    if (houseLike) {
      rules.house_type = 'required|string|max:100';
      rules.bedrooms = 'required|integer|min:0';
      rules.bathrooms = 'required|numeric|min:0';
      rules.location = `required|string|in:${NEIGHBORHOODS.join(',')}`;
    } else if (rawType === 'land' || rawType === 'land-sale') {
      rules.land_type = 'required|string|max:100';
      rules.location = `required|string|in:${NEIGHBORHOODS.join(',')}`;
    }

    validate(req.body, rules);

    let phone = req.body.phone || null;
    if (req.body.country_code && req.body.phone) {
      phone = `+${String(req.body.country_code).replace(/^\+/, '')}${req.body.phone}`;
    }

    const type = TYPE_ALIASES[rawType] || rawType;

    let imagePath = null;
    if (req.file) {
      imagePath = `properties/${req.file.filename}`;
    }

    const info = db
      .prepare(
        `INSERT INTO properties (title, owner, description, type, house_type, land_type, status, location, address, price, area, bedrooms, bathrooms, floors, amenities, images, notes, phone, registered_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.body.title,
        req.body.owner || null,
        req.body.description || null,
        type,
        req.body.house_type || null,
        req.body.land_type || null,
        req.body.status,
        req.body.location || null,
        req.body.address || null,
        parseFloat(req.body.price),
        req.body.area || null,
        req.body.bedrooms ? parseInt(req.body.bedrooms, 10) : null,
        req.body.bathrooms ? parseFloat(req.body.bathrooms) : null,
        req.body.floors ? parseInt(req.body.floors, 10) : null,
        req.body.amenities ? JSON.stringify([].concat(req.body.amenities)) : null,
        imagePath ? JSON.stringify([imagePath]) : null,
        req.body.notes || null,
        phone,
        req.user.id,
        db.now(),
        db.now()
      );

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(info.lastInsertRowid);
    logActivity(
      req.user.id,
      'created',
      'property',
      `Created property ${property.title}`
    );
    res.status(201).json({
      message: `${type.charAt(0).toUpperCase()}${type.slice(1)} property created successfully.`,
      property,
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const property = db
      .prepare('SELECT * FROM properties WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!property) return res.status(404).json({ message: 'Not found' });

    const rules = baseRules();
    delete rules.type;
    const storedType = property.type;
    const houseLike = ['house', 'villa'].includes(storedType);

    if (houseLike) {
      rules.house_type = 'required|string|max:100';
      rules.bedrooms = 'required|integer|min:0';
      rules.bathrooms = 'required|numeric|min:0';
      rules.location = `required|string|in:${NEIGHBORHOODS.join(',')}`;
    } else if (storedType === 'land') {
      rules.land_type = 'required|string|max:100';
      rules.location = `required|string|in:${NEIGHBORHOODS.join(',')}`;
    }

    validate(req.body, rules);

    let phone = req.body.phone || null;
    if (req.body.country_code && req.body.phone) {
      phone = `+${String(req.body.country_code).replace(/^\+/, '')}${req.body.phone}`;
    }

    let imagesJson = property.images;
    if (req.file) {
      const oldImages = property.images ? JSON.parse(property.images) : [];
      oldImages.forEach((img) => {
        const oldPath = path.join(storagePath(), img);
        if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
      });
      imagesJson = JSON.stringify([`properties/${req.file.filename}`]);
    }

    db.prepare(
      `UPDATE properties SET title = ?, owner = ?, description = ?, house_type = ?, land_type = ?, status = ?, location = ?, address = ?, price = ?, area = ?, bedrooms = ?, bathrooms = ?, floors = ?, amenities = ?, images = ?, notes = ?, phone = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      req.body.title,
      req.body.owner || null,
      req.body.description || null,
      req.body.house_type || null,
      req.body.land_type || null,
      req.body.status,
      req.body.location || null,
      req.body.address || null,
      parseFloat(req.body.price),
      req.body.area || null,
      req.body.bedrooms ? parseInt(req.body.bedrooms, 10) : null,
      req.body.bathrooms ? parseFloat(req.body.bathrooms) : null,
      req.body.floors ? parseInt(req.body.floors, 10) : null,
      req.body.amenities ? JSON.stringify([].concat(req.body.amenities)) : property.amenities,
      imagesJson,
      req.body.notes || null,
      phone,
      db.now(),
      property.id
    );

    logActivity(req.user.id, 'updated', 'property', `Updated property ${req.body.title}`);
    res.json({ message: 'Property updated successfully.' });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

exports.destroy = (req, res, next) => {
  try {
    const property = db
      .prepare('SELECT * FROM properties WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!property) return res.status(404).json({ message: 'Not found' });

    db.prepare('UPDATE properties SET deleted_at = ? WHERE id = ?').run(db.now(), property.id);
    logActivity(req.user.id, 'deleted', 'property', `Deleted property ${property.title}`);
    res.json({ message: 'Property deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
