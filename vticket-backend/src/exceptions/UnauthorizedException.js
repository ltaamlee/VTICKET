const AppException = require('./AppException');

class UnauthorizedException extends AppException {
  constructor(message = 'Chưa xác thực hoặc phiên đăng nhập không hợp lệ') {
    super(message, 401);
  }
}

module.exports = UnauthorizedException;
