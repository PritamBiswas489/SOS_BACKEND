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
export const MAX_PROFILE_IMAGE_SIZE_MB = 20;
export const PROFILE_IMAGE_SIZE_ERROR_MESSAGE = `Profile image size should not exceed ${MAX_PROFILE_IMAGE_SIZE_MB}MB.`;

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
    fileSize: MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024,
    files: 1, // max 1 file per request
  },
});
