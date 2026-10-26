const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload.middleware');
const uploadService = require('../../shared/upload.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const { BadRequestException } = require('../../exceptions');
const { authenticate } = require('../../middlewares/auth.middleware');

// Upload endpoint chung (yêu cầu đăng nhập)
router.post(
  '/image',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestException('Vui lòng chọn tệp hình ảnh để tải lên');
    }

    const folder = req.body.folder || 'vticket';
    const result = await uploadService.uploadImage(req.file.buffer, folder);

    return sendResponse(res, 200, 'Tải ảnh lên Cloudinary thành công', {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  })
);

module.exports = router;
