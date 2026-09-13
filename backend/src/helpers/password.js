const settings = require('../helpers/settings');
const { ValidationError } = require('./validate');

function validatePasswordStrength(password, errors = {}) {
  if (settings.getBool('password_require_uppercase') && !/[A-Z]/.test(password)) {
    errors.password = ['Password must contain at least one uppercase letter.'];
  } else if (settings.getBool('password_require_numeric') && !/[0-9]/.test(password)) {
    errors.password = ['Password must contain at least one number.'];
  } else if (settings.getBool('password_require_special') && !/[^A-Za-z0-9]/.test(password)) {
    errors.password = ['Password must contain at least one special character.'];
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

module.exports = { validatePasswordStrength };