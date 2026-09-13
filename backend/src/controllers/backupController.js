const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { logActivity } = require('../helpers/activityLog');

const BACKUP_TABLES = [
  'users',
  'settings',
  'customers',
  'properties',
  'land_sales',
  'house_sales',
  'house_rentals',
  'used_items',
  'payments',
  'commissions',
  'cleaners',
  'notifications',
  'activity_logs',
  'public_inquiries',
];

function backupsDir() {
  const dir = path.resolve(__dirname, '../../storage/backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

exports.index = (req, res) => {
  const dir = backupsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const full = path.join(dir, f);
      return {
        name: f,
        size: fs.statSync(full).size,
        date: fs
          .statSync(full)
          .mtime.toISOString()
          .slice(0, 19)
          .replace('T', ' '),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  res.json({ backups: files });
};

exports.create = async (req, res, next) => {
  try {
    let createdBy = null;
    try {
      createdBy = req.user ? req.user.name : null;
    } catch (e) {
      createdBy = null;
    }

    const snapshot = {
      created_at: db.now(),
      created_by: createdBy,
      database: 'supabase',
      tables: {},
    };

    for (const table of BACKUP_TABLES) {
      try {
        snapshot.tables[table] = await db.prepare(`SELECT * FROM ${table}`).all();
      } catch (e) {
        snapshot.tables[table] = [];
      }
    }

    const filename = `backup-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')
      .replace('T', '-')}.json`;

    fs.writeFileSync(path.join(backupsDir(), filename), JSON.stringify(snapshot, null, 2));

    await logActivity(req.user.id, 'created', 'backup', `Created database backup: ${filename}`);
    res.status(201).json({ message: 'Backup created successfully.', filename });
  } catch (err) {
    next(err);
  }
};

exports.download = (req, res) => {
  const filePath = path.join(backupsDir(), req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Backup file not found.' });
  }
  res.download(filePath);
};

exports.destroy = async (req, res, next) => {
  try {
    const filePath = path.join(backupsDir(), req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await logActivity(req.user.id, 'deleted', 'backup', `Deleted backup ${req.params.filename}`);
    res.json({ message: 'Backup deleted successfully.' });
  } catch (err) {
    next(err);
  }
};