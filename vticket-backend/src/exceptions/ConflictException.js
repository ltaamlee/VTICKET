const AppException = require('./AppException');

class ConflictException extends AppException {
  constructor(message = 'Dữ liệu đã tồn tại hoặc xảy ra xung đột') {
    super(message, 409);
  }
}

module.exports = ConflictException;
