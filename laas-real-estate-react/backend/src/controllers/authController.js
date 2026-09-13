const bcrypt = require('bcryptjs');
const db = require('../config/db');
const settings = require('../helpers/settings');
const { validate, boolify } = require('../helpers/validate');
const { signToken } = require('../middleware/auth');
const { validatePasswordStrength } = require('../helpers/password');
const { logActivity } = require('../helpers/activityLog');

const attempts = new Map();

function tooManyAttempts(key) {
  const maxAttempts = settings.getInt('login_max_attempts', 5);
  const lockoutMinutes = settings.getInt('login_lockout_minutes', 15);
  const record = attempts.get(key);
  if (!record) return { blocked: false };
  const elapsedSec = (Date.now() - record.firstAt) / 1000;
  if (elapsedSec > lockoutMinutes * 60) {
    attempts.delete(key);
    return { blocked: false };
  }
  if (record.count >= maxAttempts) {
    return { blocked: true, retryAfterSec: Math.ceil(lockoutMinutes * 60 - elapsedSec) };
  }
  return { blocked: false };
}

function hitAttempts(key) {
  const record = attempts.get(key);
  if (!record || (Date.now() - record.firstAt) / 1000 > settings.getInt('login_lockout_minutes', 15) * 60) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    record.count += 1;
  }
}

function clearAttempts(key) {
  attempts.delete(key);
}

function userPayload(user) {
  let avatar;
  if (user.profile_picture) {
    avatar = `/storage/${user.profile_picture}`;
  } else {
    avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=facc15&color=111827`;
  }
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_active: !!user.is_active,
    two_factor_enabled: !!user.two_factor_enabled,
    profile_picture: user.profile_picture,
    profile_picture_url: avatar,
  };
}

exports.login = (req, res, next) => {
  try {
    validate(req.body, {
      email: 'required',
      password: 'required',
    });

    const identifier = String(req.body.email).trim();
    const key = `${identifier.toLowerCase()}|${req.ip}`;
    const limit = tooManyAttempts(key);
    if (limit.blocked) {
      return res.status(429).json({
        message: 'Too many login attempts.',
        errors: {
          email: [
            `Too many login attempts. Please try again in ${limit.retryAfterSec} seconds.`,
          ],
        },
        email_input: req.body.email,
      });
    }

    const user = db
      .prepare(
        'SELECT * FROM users WHERE deleted_at IS NULL AND (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?))'
      )
      .get(identifier, identifier);

    if (!user || !bcrypt.compareSync(String(req.body.password), user.password)) {
      hitAttempts(key);
      return res.status(422).json({
        message: 'The provided credentials do not match our records.',
        errors: { email: ['The provided credentials do not match our records.'] },
        email_input: req.body.email,
      });
    }

    if (!user.is_active) {
      return res.status(422).json({
        message: 'Your account has been deactivated. Contact an administrator.',
        errors: {
          email: ['Your account has been deactivated. Contact an administrator.'],
        },
        email_input: req.body.email,
      });
    }

    clearAttempts(key);
    const token = signToken(user, boolify(req.body.remember));
    res.json({ token, user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = (req, res) => {
  res.json({ user: userPayload(req.user) });
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out' });
};

exports.showRegister = (req, res) => {
  res.json({
    password_min_length: settings.getInt('password_min_length', 8),
  });
};

exports.register = (req, res, next) => {
  try {
    const minLength = settings.getInt('password_min_length', 8);
    validate(req.body, {
      name: 'required|string|max:255',
      email: `required|email|max:255|unique:users,email`,
      password: `required|string|min:${minLength}|confirmed`,
      phone: 'nullable|string|max:20',
    });
    validatePasswordStrength(req.body.password);

    const hashed = bcrypt.hashSync(req.body.password, 12);
    const info = db
      .prepare(
        "INSERT INTO users (name, email, password, phone, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 'agent', 1, ?, ?)"
      )
      .run(req.body.name, req.body.email, hashed, req.body.phone || null, db.now(), db.now());

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    logActivity(req.user.id, 'created', 'user', `Created user ${user.name}`);

    const token = signToken(user);
    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};
