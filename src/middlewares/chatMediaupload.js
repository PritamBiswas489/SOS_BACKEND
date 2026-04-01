import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

const ALL_ALLOWED = Object.values(ALLOWED_MIME_TYPES).flat();

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Determine subfolder by media type
    let subDir = 'misc';
    for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
      if (mimes.includes(file.mimetype)) {
        subDir = 'chat-' + type + 's'; // chat-images, chat-videos, chat-audios, chat-documents
        break;
      }
    }
    const dest = path.join(UPLOAD_DIR, subDir);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};
export const uploadChatMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // max 5 files per request
  },
});
/**
 * Infer a media type string from a MIME type.
 */
export const getMediaType = (mimetype) => {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mimetype)) return type;
  }
  return 'document';
};
