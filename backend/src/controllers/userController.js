const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { validate, boolify } = require('../helpers/validate');
const { logActivity } = require('../helpers/activityLog');
const { paginate, sortClause } = require('../helpers/paginate');
const settings = require('../helpers/settings');
const { validatePasswordStrength } = require('../helpers/password');

exports.index = async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM users WHERE deleted_at IS NULL';
    const params = [];

    if (req.query.search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR role LIKE ?)';
      const like = `%${req.query.search}%`;
      params.push(like, like, like);
    }
    if (req.query.role) {
      sql += ' AND role = ?';
      params.push(req.query.role);
    }
    if (req.query.is_active !== undefined && req.query.is_active !== '') {
      sql += ' AND is_active = ?';
      params.push(boolify(req.query.is_active) ? 1 : 0);
    }

    sql += sortClause(req, {
      name: 'name',
      email: 'email',
      phone: 'phone',
      role: 'role',
      is_active: 'is_active',
      created_at: 'created_at',
    });

    const total = (await db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params)).c;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = await db.prepare(`${sql} LIMIT 15 OFFSET ?`).all(...params, (page - 1) * 15);
    rows.forEach((u) => delete u.password);
    res.json(paginate(req, rows, total, 15));
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const user = await db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    delete user.password;
    user.profile_picture_url = user.profile_picture
      ? `/storage/${user.profile_picture}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=facc15&color=111827`;
    res.json(user);
  } catch (err) {
    next(err);
  }
};

function storeRules() {
  return {
    name: 'required|string|max:255',
    email: 'required|email|max:255|unique:users,email',
    password: `required|string|min:${settings.getInt('password_min_length', 8)}|confirmed`,
    phone: 'nullable|string|max:20',
    role: 'required|in:super_admin,manager,agent,accountant',
    is_active: 'boolean',
  };
}

exports.store = async (req, res, next) => {
  try {
    await validate(req.body, storeRules());
    validatePasswordStrength(req.body.password);

    const info = await db
      .prepare(
        `INSERT INTO users (name, email, password, phone, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.body.name,
        req.body.email,
        bcrypt.hashSync(req.body.password, 12),
        req.body.phone || null,
        req.body.role,
        boolify(req.body.is_active) ? 1 : 0,
        db.now(),
        db.now()
      );

    await logActivity(req.user.id, 'created', 'user', `Created user ${req.body.name}`);
    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.editMeta = async (req, res, next) => {
  try {
    const user = await db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    delete user.password;
    res.json({ record: user, password_min_length: settings.getInt('password_min_length', 8) });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });

    await validate(req.body, {
      name: 'required|string|max:255',
      email: `required|email|max:255|unique:users,email,null,${user.id}`,
      password: `nullable|string|min:${settings.getInt('password_min_length', 8)}|confirmed`,
      phone: 'nullable|string|max:20',
      role: 'required|in:super_admin,manager,agent,accountant',
      is_active: 'boolean',
    });

    let password = user.password;
    if (req.body.password) {
      validatePasswordStrength(req.body.password);
      password = bcrypt.hashSync(req.body.password, 12);
    }

    await db
      .prepare(
        `UPDATE users SET name = ?, email = ?, password = ?, phone = ?, role = ?, is_active = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        req.body.name,
        req.body.email,
        password,
        req.body.phone || null,
        req.body.role,
        boolify(req.body.is_active) ? 1 : 0,
        db.now(),
        user.id
      );

    await logActivity(req.user.id, 'updated', 'user', `Updated user ${req.body.name}`);
    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const user = await db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await db.prepare('UPDATE users SET deleted_at = ? WHERE id = ?').run(db.now(), user.id);
    await logActivity(req.user.id, 'deleted', 'user', `Deleted user ${user.name}`);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};