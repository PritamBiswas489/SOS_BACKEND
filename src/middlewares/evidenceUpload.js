import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
};

const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/vnd.wave",
    "audio/ogg",
    "audio/aac",
    "audio/x-aac",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/x-caf",
    "audio/aiff",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
  ],
};

const ALL_ALLOWED_MIME_TYPES = Object.values(ALLOWED_MIME_TYPES).flat();

export const EVIDENCE_FILE_SIZES = {
  image: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

const DEFAULT_EVIDENCE_FILE_SIZE_LIMIT = 20 * 1024 * 1024;
const MAX_EVIDENCE_FILE_SIZE = Math.max(...Object.values(EVIDENCE_FILE_SIZES));
const MAX_EVIDENCE_FILE_SIZE_MB = MAX_EVIDENCE_FILE_SIZE / (1024 * 1024);

export const EVIDENCE_UPLOAD_MAX_FILES = 3;
export const EVIDENCE_FILE_SIZE_ERROR_MESSAGE = `Evidence file size should not exceed ${MAX_EVIDENCE_FILE_SIZE_MB}MB.`;

export const getEvidenceFileType = (mimetype) => {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mimetype)) return type;
  }
  return "document";
};

const bytesToMb = (bytes) => bytes / (1024 * 1024);

export const getEvidenceFileSizeLimit = (mimetype) => {
  const fileType = getEvidenceFileType(mimetype);
  return EVIDENCE_FILE_SIZES[fileType] || DEFAULT_EVIDENCE_FILE_SIZE_LIMIT;
};

export const getEvidenceFileSizeErrorMessage = (mimetype) => {
  const fileType = getEvidenceFileType(mimetype);
  const maxSizeMb = bytesToMb(getEvidenceFileSizeLimit(mimetype));
  return `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file size should not exceed ${maxSizeMb}MB.`;
};

export const isEvidenceFileSizeValid = (file) => {
  if (!file) return false;
  return file.size <= getEvidenceFileSizeLimit(file.mimetype);
};

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fileType = getEvidenceFileType(file.mimetype);
    const dest = path.join(UPLOAD_DIR, "abuser-report-evidence", `${fileType}s`);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evidence-${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  req.evidenceUploadMimetype = file.mimetype;

  if (ALL_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

export const uploadEvidenceFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_EVIDENCE_FILE_SIZE,
    files: EVIDENCE_UPLOAD_MAX_FILES,
  },
});
