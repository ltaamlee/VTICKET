const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

function getSecret() {
  return process.env.JWT_SECRET || 'vticket_super_secret_jwt_key_2026';
}

function getBookingSecret() {
  return crypto.createHmac('sha256', getSecret()).update('booking-session-v1').digest();
}

class JwtUtils {
  /**
   * Generate JWT Token
   * @param {Object} payload
   * @returns {string} token
   */
  static generateToken(payload) {
    const secret = getSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verify JWT Token
   * @param {string} token
   * @returns {Object} decoded payload
   */
  static verifyToken(token) {
    const secret = getSecret();
    return jwt.verify(token, secret);
  }

  static generateBookingToken(payload, expiresAt) {
    return jwt.sign({ ...payload, exp: Math.floor(expiresAt.getTime() / 1000) }, getBookingSecret(), { algorithm: 'HS256' });
  }

  static verifyBookingToken(token) {
    return jwt.verify(token, getBookingSecret(), { algorithms: ['HS256'] });
  }
}

module.exports = JwtUtils;
