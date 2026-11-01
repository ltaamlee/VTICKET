const multer = require('multer');
const { BadRequestException } = require('../exceptions');

// Lưu trữ tệp trong RAM dưới dạng Buffer để stream trực tiếp lên Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép các định dạng ảnh phổ biến
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Chỉ cho phép tải lên tệp hình ảnh (jpg, jpeg, png, webp, gif)'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn kích thước tối đa 5MB
  },
  fileFilter,
});

module.exports = upload;
