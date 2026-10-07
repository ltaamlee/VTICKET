const jwt = require('jsonwebtoken');

class JwtUtils {
  /**
   * Generate JWT Token
   * @param {Object} payload
   * @returns {string} token
   */
  static generateToken(payload) {
    const secret = process.env.JWT_SECRET || 'vticket_super_secret_jwt_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verify JWT Token
   * @param {string} token
   * @returns {Object} decoded payload
   */
  static verifyToken(token) {
    const secret = process.env.JWT_SECRET || 'vticket_super_secret_jwt_key_2026';
    return jwt.verify(token, secret);
  }
}

module.exports = JwtUtils;
