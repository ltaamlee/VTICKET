const { MongoClient } = require('mongodb');
const { BadRequestException } = require('../exceptions');

class OtpService {
  constructor() {
    this.client = null;
    this.db = null;
    this.memoryStore = new Map();
    this.initMongo();
  }

  async initMongo() {
    try {
      const uri = process.env.DATABASE_URL;
      if (uri) {
        this.client = new MongoClient(uri);
        await this.client.connect();
        this.db = this.client.db();
        await this.db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      }
    } catch (err) {
      console.warn('MongoDB connection for OtpService failed, using in-memory store:', err.message);
    }
  }

  /**
   * Generate 6-digit random OTP
   */
  generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and store OTP for an email
   * @param {string} email 
   * @returns {Promise<string>} 6-digit OTP code
   */
  async createOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const otp = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store in memory fallback
    this.memoryStore.set(normalizedEmail, { otp, expiresAt });

    // Store in MongoDB otps collection
    if (this.db) {
      try {
        await this.db.collection('otps').updateOne(
          { email: normalizedEmail },
          {
            $set: {
              otp,
              expiresAt,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Failed saving OTP to MongoDB, using memory store:', err.message);
      }
    }

    return otp;
  }

  /**
   * Verify provided OTP for an email
   * @param {string} email 
   * @param {string} inputOtp 
   */
  async verifyOtp(email, inputOtp) {
    if (!email || !inputOtp) {
      throw new BadRequestException('Vui lòng cung cấp email và mã OTP');
    }

    const normalizedEmail = email.trim().toLowerCase();
    let otpRecord = null;

    if (this.db) {
      try {
        otpRecord = await this.db.collection('otps').findOne({ email: normalizedEmail });
      } catch (err) {
        console.warn('Querying MongoDB for OTP failed, checking memory store:', err.message);
      }
    }

    if (!otpRecord) {
      otpRecord = this.memoryStore.get(normalizedEmail);
    }

    if (!otpRecord) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const now = new Date();
    if (new Date(otpRecord.expiresAt) < now) {
      this.memoryStore.delete(normalizedEmail);
      if (this.db) {
        await this.db.collection('otps').deleteOne({ email: normalizedEmail }).catch(() => {});
      }
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    if (otpRecord.otp !== inputOtp.trim()) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    this.memoryStore.delete(normalizedEmail);
    if (this.db) {
      await this.db.collection('otps').deleteOne({ email: normalizedEmail }).catch(() => {});
    }

    return true;
  }
}

module.exports = new OtpService();
