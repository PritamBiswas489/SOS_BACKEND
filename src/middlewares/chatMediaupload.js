import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/vnd.wave',
    'audio/ogg',
    'audio/aac',
    'audio/x-aac',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/x-caf',
    'audio/aiff',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
  ],
};

export const CHAT_MEDIA_FILE_SIZES = {
  image: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 20 * 1024 * 1024, // 20MB
  document: 20 * 1024 * 1024, // 20MB
};

const DEFAULT_FILE_SIZE_LIMIT = 20 * 1024 * 1024;
const MAX_CHAT_MEDIA_FILE_SIZE = Math.max(...Object.values(CHAT_MEDIA_FILE_SIZES));
export const CHAT_MEDIA_MAX_FILE_SIZE_ERROR_MESSAGE = `Chat media file size should not exceed ${MAX_CHAT_MEDIA_FILE_SIZE / (1024 * 1024)}MB.`;

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

const fileFilter = (req, file, cb) => {
  req.chatMediaUploadMimetype = file.mimetype;

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
    files: 1, // max 1 file per request
    fileSize: MAX_CHAT_MEDIA_FILE_SIZE,
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

const bytesToMb = (bytes) => bytes / (1024 * 1024);

export const getChatMediaFileSizeLimit = (mimetype) => {
  const mediaType = getMediaType(mimetype);
  return CHAT_MEDIA_FILE_SIZES[mediaType] || DEFAULT_FILE_SIZE_LIMIT;
};

export const getChatMediaFileSizeErrorMessage = (mimetype) => {
  const mediaType = getMediaType(mimetype);
  const maxSizeMb = bytesToMb(getChatMediaFileSizeLimit(mimetype));
  return `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} file size should not exceed ${maxSizeMb}MB.`;
};

export const isChatMediaFileSizeValid = (file) => {
  if (!file) return false;
  return file.size <= getChatMediaFileSizeLimit(file.mimetype);
};
