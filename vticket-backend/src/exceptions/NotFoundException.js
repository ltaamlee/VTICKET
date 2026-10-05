const AppException = require('./AppException');

class NotFoundException extends AppException {
  constructor(message = 'Tài nguyên yêu cầu không tồn tại') {
    super(message, 404);
  }
}

module.exports = NotFoundException;
