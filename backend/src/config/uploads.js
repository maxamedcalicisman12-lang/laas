const multer = require('multer');
const path = require('path');
const fs = require('fs');

function storagePath() {
  return process.env.STORAGE_PATH || path.resolve(__dirname, '../../storage');
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

function makeUploader(folder) {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(storagePath(), folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
      else cb(new Error('The image must be a file of type: jpeg, png, jpg, gif, webp.'));
    },
  });
}

module.exports = {
  propertyImage: makeUploader('properties').single('image'),
  profilePicture: makeUploader('profile-pictures').single('profile_picture'),
};