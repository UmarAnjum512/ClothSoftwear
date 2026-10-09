import multer from 'multer';
import path from 'path';

// Files are kept in memory only, then streamed to Cloudinary by the controller.
// Nothing is written to the server's disk.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
             allowed.test(file.mimetype);
  if (ok) cb(null, true);
  else cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
};

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});
