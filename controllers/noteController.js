const path = require('path');
const cloudinary = require('../config/cloudinary');
const Note = require('../models/Note');
const { successResponse, errorResponse } = require('../utils/apiResponse');

function uploadBufferToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'guideup/notes',
        resource_type: 'auto', // images -> image, everything else (pdf, docx...) -> raw
        // Cloudinary strips extensions from raw uploads by default; keeping it
        // in the public_id means the delivered URL still ends in e.g. ".pdf".
        public_id: filename.replace(/\.[^/.]+$/, ''),
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

/**
 * GET /api/admin/notes
 * protect (admin)
 */
const getAdminNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 });
    return successResponse(res, { notes });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/admin/notes
 * protect (admin)
 * multipart/form-data: title, description, file
 */
const createNote = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) return errorResponse(res, 'Title is required', 400);
    if (!req.file) return errorResponse(res, 'A file is required', 400);

    const uploaded = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);

    const note = await Note.create({
      title: title.trim(),
      description: description?.trim() || '',
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
      fileSize: req.file.size,
    });

    return successResponse(res, { note }, 'Note created', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PUT /api/admin/notes/:id
 * protect (admin)
 * multipart/form-data: title?, description?, isActive?, file? (optional replacement)
 */
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 'Note not found', 404);

    const { title, description, isActive } = req.body;
    if (title !== undefined) note.title = title.trim();
    if (description !== undefined) note.description = description.trim();
    if (isActive !== undefined) note.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      // Swap the asset: upload the new one first, only delete the old one
      // once the new upload has actually succeeded.
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      const oldPublicId = note.filePublicId;

      note.fileUrl = uploaded.secure_url;
      note.filePublicId = uploaded.public_id;
      note.fileName = req.file.originalname;
      note.fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();
      note.fileSize = req.file.size;

      await note.save();
      await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch(() => {
        cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' }).catch(() => {});
      });
    } else {
      await note.save();
    }

    return successResponse(res, { note }, 'Note updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * DELETE /api/admin/notes/:id
 * protect (admin)
 */
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 'Note not found', 404);

    await Note.deleteOne({ _id: note._id });

    // Cloudinary requires the right resource_type to delete a raw (non-image)
    // asset; try raw first (the common case for notes) then image as a fallback.
    await cloudinary.uploader.destroy(note.filePublicId, { resource_type: 'raw' }).catch(() => {
      return cloudinary.uploader.destroy(note.filePublicId, { resource_type: 'image' }).catch(() => {});
    });

    return successResponse(res, {}, 'Note deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/notes
 * protectUser — students must be signed in to see notes
 */
const getPublicNotes = async (req, res) => {
  try {
    const notes = await Note.find({ isActive: true })
      .select('title description fileUrl fileName fileType fileSize createdAt')
      .sort({ createdAt: -1 });
    return successResponse(res, { notes });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getAdminNotes,
  createNote,
  updateNote,
  deleteNote,
  getPublicNotes,
};
