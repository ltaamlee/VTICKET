const cloudinary = require('cloudinary').v2;
const { BadRequestException } = require('../exceptions');

class UploadService {
  constructor() {
    this._isConfigured = false;
  }

  /**
   * Khởi tạo cấu hình Cloudinary từ process.env trong RAM (chỉ chạy 1 lần)
   */
  _ensureConfigured() {
    if (this._isConfigured) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
      this._isConfigured = true;
      return;
    }

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        'Hệ thống chưa nhận được thông tin Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Vui lòng cấu hình file .env và khởi động lại server.'
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this._isConfigured = true;
  }

  /**
   * Upload image buffer directly to Cloudinary
   * @param {Buffer} buffer - File buffer from multer
   * @param {string} folder - Destination folder on Cloudinary
   * @param {Object} options - Additional Cloudinary upload options
   * @returns {Promise<Object>} Cloudinary upload result
   */
  async uploadImage(buffer, folder = 'vticket', options = {}) {
    if (!buffer) {
      throw new BadRequestException('Không tìm thấy dữ liệu tệp hình ảnh để tải lên');
    }

    this._ensureConfigured();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          ...options,
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]:', error);
            return reject(new BadRequestException(`Tải lên Cloudinary thất bại: ${error.message}`));
          }
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete an image from Cloudinary by its public ID
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('[Cloudinary Delete Error]:', err.message);
    }
  }
}

module.exports = new UploadService();
