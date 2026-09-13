const jwt = require('jsonwebtoken');
const db = require('../config/db');
const settings = require('../helpers/settings');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }

  try {
    const user = await db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }
}

function signToken(user, remember = false) {
  let minutes = settings.getInt('session_timeout_minutes', 120);
  if (remember) minutes = Math.max(minutes, 60 * 24 * 30);
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: `${minutes}m`,
  });
}

function role(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }
    next();
  };
}

module.exports = { auth, signToken, role };