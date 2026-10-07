const AppException = require('./AppException');

class ForbiddenException extends AppException {
  constructor(message = 'Bạn không có quyền thực hiện hành động này') {
    super(message, 403);
  }
}

module.exports = ForbiddenException;
