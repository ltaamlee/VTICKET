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

/**
 * optionalAuthenticate - Xác thực "mềm": nếu có token hợp lệ thì gán req.user,
 * nếu không có hoặc token sai thì vẫn cho qua (req.user = undefined).
 *
 * Dùng cho các endpoint công khai nhưng cần phân quyền theo vai trò
 * (ví dụ: chi tiết tin bán vé - chủ vé được thấy mã vé của mình,
 * người lạ không thấy).
 */
const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = JwtUtils.verifyToken(token);
    } catch (error) {
        // Token không hợp lệ -> coi như khách vãng la, vẫn cho qua
        req.user = undefined;
    }

    next();
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenException('Bạn không có quyền truy cập tài nguyên này'));
        }
        next();
    };
};

module.exports = { authenticate, optionalAuthenticate, authorize };
