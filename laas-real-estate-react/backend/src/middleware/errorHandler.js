const { ValidationError } = require('../helpers/validate');

function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(422).json({ message: 'The given data was invalid.', errors: err.errors });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      message: 'Failed to delete record. It may be linked to other records.',
    });
  }

  if (err.type === 'entity.parse.failed' || err.statusCode || err.status) {
    const status = err.statusCode || err.status || 400;
    return res.status(status).json({ message: status === 400 ? 'Invalid JSON body.' : err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Server Error' });
}

module.exports = errorHandler;
