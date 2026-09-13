const db = require('../config/db');

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.status = 422;
    this.errors = errors;
  }
}

function str(v) {
  return v === undefined || v === null ? '' : String(v);
}

function isEmpty(v) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

function validate(data, rules) {
  const errors = {};

  for (const [field, ruleStr] of Object.entries(rules)) {
    const rulesList = ruleStr.split('|');
    const raw = data[field];
    const value = raw;
    const fieldErrors = [];
    const nullable = rulesList.includes('nullable');

    for (const rule of rulesList) {
      if (rule === 'nullable' || rule === 'sometimes') continue;

      if (rule === 'required') {
        if (isEmpty(value)) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} field is required.`);
        }
        continue;
      }

      if (isEmpty(value)) {
        if (nullable) break;
        continue;
      }

      if (rule.startsWith('max:')) {
        const max = parseInt(rule.slice(4), 10);
        const isNumericField = rulesList.includes('numeric') || rulesList.includes('integer');
        if (isNumericField) {
          if (parseFloat(value) > max) fieldErrors.push(`The ${field.replace(/_/g, ' ')} may not be greater than ${max}.`);
        } else if (String(value).length > max) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} may not be greater than ${max} characters.`);
        }
      } else if (rule.startsWith('min:')) {
        const min = parseFloat(rule.slice(4));
        const isNumericField = rulesList.includes('numeric') || rulesList.includes('integer');
        if (isNumericField) {
          if (parseFloat(value) < min) fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be at least ${min}.`);
        } else if (String(value).length < min) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be at least ${min} characters.`);
        }
      } else if (rule === 'string') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be a string.`);
        }
      } else if (rule === 'alpha_dash') {
        if (!/^[a-zA-Z0-9_-]+$/.test(String(value))) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} may only contain letters, numbers, dashes and underscores.`);
        }
      } else if (rule === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be a valid email address.`);
        }
      } else if (rule === 'numeric') {
        if (isNaN(parseFloat(value)) || !isFinite(Number(value))) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be a number.`);
        }
      } else if (rule === 'integer') {
        if (!Number.isInteger(Number(value))) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be an integer.`);
        }
      } else if (rule === 'boolean') {
        if (typeof value !== 'boolean' && value !== 0 && value !== 1 && value !== '0' && value !== '1' && value !== 'true' && value !== 'false' && value !== 'on' && value !== null) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} field must be true or false.`);
        }
      } else if (rule.startsWith('in:')) {
        const allowed = rule.slice(3).split(',');
        if (!allowed.includes(String(value))) {
          fieldErrors.push(`The selected ${field.replace(/_/g, ' ')} is invalid.`);
        }
      } else if (rule === 'date') {
        if (isNaN(new Date(value).getTime())) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be a valid date.`);
        }
      } else if (rule.startsWith('after:')) {
        const otherField = rule.slice(6);
        if (new Date(value) <= new Date(data[otherField])) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be a date after ${otherField.replace(/_/g, ' ')}.`);
        }
      } else if (rule.startsWith('exists:')) {
        const [, table, column] = rule.split(':').join(',').split(',').map((s) => s.trim());
        const col = column || 'id';
        const row = db.prepare(`SELECT id FROM ${table} WHERE ${col} = ? AND deleted_at IS NULL`).get(value);
        if (!row) {
          fieldErrors.push(`The selected ${field.replace(/_/g, ' ')} is invalid.`);
        }
      } else if (rule.startsWith('unique:')) {
        const parts = rule.split(',');
        const table = parts[0].split(':')[1];
        const column = parts[1] || field;
        const ignoreId = parts[2] ? parseInt(parts[3], 10) : null;
        let sql = `SELECT id FROM ${table} WHERE ${column} = ?`;
        const params = [value];
        if (ignoreId) {
          sql += ' AND id != ?';
          params.push(ignoreId);
        }
        const row = db.prepare(sql).get(...params);
        if (row) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} has already been taken.`);
        }
      } else if (rule === 'confirmed') {
        if (value !== data[`${field}_confirmation`]) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} confirmation does not match.`);
        }
      } else if (rule === 'array') {
        if (!Array.isArray(value)) {
          fieldErrors.push(`The ${field.replace(/_/g, ' ')} must be an array.`);
        }
      }
    }

    if (fieldErrors.length) errors[field] = fieldErrors;
  }

  if (Object.keys(errors).length) throw new ValidationError(errors);
}

function boolify(v) {
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'on';
}

module.exports = { validate, ValidationError, boolify };
