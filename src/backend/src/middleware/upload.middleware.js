const multer = require('multer');
const { AppError, validationError } = require('../utils/errors');

function createMemoryUpload({ fieldName = 'file', maxSizeBytes }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSizeBytes,
      files: 1
    }
  });

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(validationError('Uploaded file exceeds the allowed size', {
          field: fieldName,
          maxSizeBytes
        }));
      }

      return next(new AppError('File upload failed', 400, 'FILE_UPLOAD_ERROR'));
    });
  };
}

module.exports = {
  createMemoryUpload
};
