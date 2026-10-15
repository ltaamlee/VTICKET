const AppException = require('./AppException');

class BadRequestException extends AppException {
  constructor(message = 'Dữ liệu yêu cầu không hợp lệ') {
    super(message, 400);
  }
}

module.exports = BadRequestException;
