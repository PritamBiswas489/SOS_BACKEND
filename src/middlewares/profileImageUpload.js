import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'profile_images');

// Ensure upload directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    ensureDir(UPLOAD_DIR);
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('ONLY_IMAGES_ALLOWED'), false);
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1, // max 1 file per request
  },
});
