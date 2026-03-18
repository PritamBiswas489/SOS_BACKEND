// controllers/uploadController.js
 

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Allowed file types
const allowedTypes = /jpeg|jpg|png|gif/;

// Multer storage with auto folder creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const i18n = req.headers.i18n;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error(i18n.__('ONLY_IMAGES_ALLOWED')));
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Upload handler
const uploadImage = (req, res) => {
   const i18n = req.headers.i18n;
  if (!req.file) {
    return res.status(400).json({ error: i18n.__("NO_FILE_UPLOADED") });
  }

 

  res.status(200).json({
    message: i18n.__("IMAGE_UPLOADED_SUCCESSFULLY"),
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
};

export  { upload };
