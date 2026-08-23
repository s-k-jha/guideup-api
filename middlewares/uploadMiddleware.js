const multer = require('multer');

// Memory storage — the file buffer is streamed straight to Cloudinary in the
// controller, never written to disk on this server.
const storage = multer.memoryStorage();

const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.has(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported file type. Allowed: PDF, Word, PowerPoint, Excel, text, or image files.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = upload;
