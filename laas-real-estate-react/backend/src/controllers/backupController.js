const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { logActivity } = require('../helpers/activityLog');

function backupsDir() {
  const dir = path.resolve(__dirname, '../../storage/backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

exports.index = (req, res) => {
  const dir = backupsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sqlite'))
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

exports.create = (req, res, next) => {
  try {
    const source = process.env.BACKUP_SOURCE_DB || path.resolve(__dirname, '../../database/database.sqlite');
    const filename = `backup-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')
      .replace('T', '-')}.sqlite`;

    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(backupsDir(), filename));
    }
    logActivity(req.user.id, 'created', 'backup', `Created database backup: ${filename}`);
    res.status(201).json({ message: 'Backup created successfully.' });
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

exports.destroy = (req, res, next) => {
  try {
    const filePath = path.join(backupsDir(), req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    logActivity(req.user.id, 'deleted', 'backup', `Deleted backup ${req.params.filename}`);
    res.json({ message: 'Backup deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
