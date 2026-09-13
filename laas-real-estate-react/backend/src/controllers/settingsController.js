const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const settings = require('../helpers/settings');
const { validate, boolify } = require('../helpers/validate');
const { validatePasswordStrength } = require('../helpers/password');

function userPayload(user) {
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
    profile_picture_url: user.profile_picture
      ? `/storage/${user.profile_picture}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=facc15&color=111827`,
  };
}

exports.index = (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  res.json({ settings: map, user: userPayload(req.user) });
};

exports.toggleLanguage = (req, res) => {
  const locale = ['en', 'so'].includes(req.params.locale) ? req.params.locale : 'en';
  res.json({ locale, message: 'Language updated.' });
};

exports.toggleTwoFactor = (req, res, next) => {
  try {
    const newValue = req.user.two_factor_enabled ? 0 : 1;
    db.prepare('UPDATE users SET two_factor_enabled = ?, updated_at = ? WHERE id = ?').run(
      newValue,
      db.now(),
      req.user.id
    );
    res.json({
      message: `Two-factor authentication ${newValue ? 'enabled' : 'disabled'} successfully.`,
      two_factor_enabled: !!newValue,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSecurity = (req, res, next) => {
  try {
    validate(req.body, {
      password_min_length: 'required|integer|min:6|max:128',
      login_max_attempts: 'required|integer|min:1|max:100',
      login_lockout_minutes: 'required|integer|min:1|max:1440',
    });

    settings.setValue('password_min_length', req.body.password_min_length);
    settings.setValue('password_require_uppercase', boolify(req.body.password_require_uppercase) ? '1' : '0');
    settings.setValue('password_require_numeric', boolify(req.body.password_require_numeric) ? '1' : '0');
    settings.setValue('password_require_special', boolify(req.body.password_require_special) ? '1' : '0');
    settings.setValue('login_max_attempts', req.body.login_max_attempts);
    settings.setValue('login_lockout_minutes', req.body.login_lockout_minutes);

    res.json({ message: 'Security settings updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = (req, res, next) => {
  try {
    validate(req.body, {
      name: 'required|string|max:255',
      username: `nullable|string|max:50|alpha_dash|unique:users,username,null,${req.user.id}`,
      email: `required|email|max:255|unique:users,email,null,${req.user.id}`,
      phone: 'nullable|string|max:20',
    });

    let profilePicture = req.user.profile_picture;
    if (req.file) {
      if (profilePicture) {
        const oldPath = path.join(process.env.STORAGE_PATH || '', profilePicture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      profilePicture = `profile-pictures/${req.file.filename}`;
    }

    db.prepare(
      'UPDATE users SET name = ?, username = ?, email = ?, phone = ?, profile_picture = ?, updated_at = ? WHERE id = ?'
    ).run(
      req.body.name,
      req.body.username || null,
      req.body.email,
      req.body.phone || null,
      profilePicture,
      db.now(),
      req.user.id
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully.', user: userPayload(user) });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

exports.changePassword = (req, res, next) => {
  try {
    validate(req.body, {
      current_password: 'required',
      new_password: `required|string|min:${settings.getInt('password_min_length', 8)}|confirmed`,
    });

    if (!bcrypt.compareSync(String(req.body.current_password), req.user.password)) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { current_password: ['The current password is incorrect.'] },
      });
    }

    validatePasswordStrength(req.body.new_password);

    db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(
      bcrypt.hashSync(req.body.new_password, 12),
      db.now(),
      req.user.id
    );

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateProfilePicture = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(422).json({
        message: 'The given data was invalid.',
        errors: { profile_picture: ['The profile picture field is required.'] },
      });
    }

    if (req.user.profile_picture) {
      const oldPath = path.join(process.env.STORAGE_PATH || '', req.user.profile_picture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const picturePath = `profile-pictures/${req.file.filename}`;
    db.prepare('UPDATE users SET profile_picture = ?, updated_at = ? WHERE id = ?').run(
      picturePath,
      db.now(),
      req.user.id
    );

    res.json({ message: 'Profile picture updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.removeProfilePicture = (req, res, next) => {
  try {
    if (req.user.profile_picture) {
      const oldPath = path.join(process.env.STORAGE_PATH || '', req.user.profile_picture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare('UPDATE users SET profile_picture = NULL, updated_at = ? WHERE id = ?').run(
      db.now(),
      req.user.id
    );
    res.json({ message: 'Profile picture removed successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateColor = (req, res, next) => {
  try {
    validate(req.body, { accent_color: 'required|string|max:50' });
    settings.setValue('accent_color', req.body.accent_color);
    res.json({ message: 'Color scheme updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateFont = (req, res, next) => {
  try {
    validate(req.body, {
      font_size: 'required|in:small,medium,large',
      font_family: 'required|in:default,serif,mono,rounded',
    });
    settings.setValue('font_size', req.body.font_size);
    settings.setValue('font_family', req.body.font_family);
    res.json({ message: 'Font settings updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateCommission = (req, res, next) => {
  try {
    validate(req.body, {
      commission_rate: 'required|numeric|min:0|max:100',
    });
    const rate = parseFloat(req.body.commission_rate);
    settings.setValue('commission_rate', rate);
    res.json({ message: 'Commission rate updated successfully.', commission_rate: rate });
  } catch (err) {
    next(err);
  }
};

const CLEAR_TABLES = [
  'cleaners',
  'customers',
  'properties',
  'land_sales',
  'house_sales',
  'house_rentals',
  'used_items',
  'payments',
  'activity_logs',
];

exports.clearData = (req, res, next) => {
  try {
    validate(req.body, { table: `required|in:${CLEAR_TABLES.join(',')}` });
    db.prepare(`DELETE FROM ${req.body.table}`).run();
    res.json({ message: `All data in '${req.body.table}' has been cleared successfully.` });
  } catch (err) {
    next(err);
  }
};
