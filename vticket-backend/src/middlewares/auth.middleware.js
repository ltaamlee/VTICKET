const JwtUtils = require('../utils/jwtUtils');
const { UnauthorizedException, ForbiddenException } = require('../exceptions');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedException('Vui lòng đăng nhập để thực hiện chức năng này'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = JwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'));
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenException('Bạn không có quyền truy cập tài nguyên này'));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
