const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const JwtUtils = require('../../utils/jwtUtils');
const UserMapper = require('../../mappers/user.mapper');
const otpService = require('../../shared/otp.service');
const emailService = require('../../shared/email.service');
const {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} = require('../../exceptions');

class AuthService {
  /**
   * Handle User Registration
   * @param {Object} data - { fullName, email, password, confirmPassword }
   */
  async register({ fullName, email, password, confirmPassword }) {
    // 4 & 4a. Validate input data
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new BadRequestException('Họ và tên không hợp lệ (tối thiểu 2 ký tự)');
    }

    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Vui lòng nhập địa chỉ email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Địa chỉ email không đúng định dạng');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // 5. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 5a. If email exists and already verified
    if (existingUser && existingUser.isVerified) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // If account was registered earlier but not verified yet, update details and resend OTP
    if (existingUser && !existingUser.isVerified) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
        },
      });

      if (existingUser.profile) {
        await prisma.userProfile.update({
          where: { userId: existingUser.id },
          data: { fullName: fullName.trim() },
        });
      } else {
        await prisma.userProfile.create({
          data: {
            userId: existingUser.id,
            fullName: fullName.trim(),
          },
        });
      }

      const otp = await otpService.createOtp(normalizedEmail);
      await emailService.sendOtpEmail(normalizedEmail, otp, fullName.trim());

      return {
        email: normalizedEmail,
        isVerified: false,
        message: 'Mã xác thực OTP đã được gửi đến email của bạn',
      };
    }

    // 6. Find or create default USER role
    let userRole = await prisma.role.findUnique({
      where: { roleName: 'USER' },
    });

    if (!userRole) {
      userRole = await prisma.role.create({
        data: { roleName: 'USER' },
      });
    }

    // 6. Create unverified user and profile
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        roleId: userRole.id,
        status: 'ACTIVE',
        isVerified: false,
        profile: {
          create: {
            fullName: fullName.trim(),
          },
        },
      },
      include: {
        role: true,
        profile: true,
      },
    });

    // 7. Generate and send OTP
    const otp = await otpService.createOtp(normalizedEmail);
    await emailService.sendOtpEmail(normalizedEmail, otp, fullName.trim());

    return {
      email: newUser.email,
      isVerified: false,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản',
    };
  }

  /**
   * Verify OTP and activate account
   * @param {string} email 
   * @param {string} otp 
   */
  async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw new BadRequestException('Vui lòng cung cấp email và mã OTP');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 10. Check validity and expiration of OTP
    await otpService.verifyOtp(normalizedEmail, otp);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    // 11. Activate account
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    return {
      email: normalizedEmail,
      isVerified: true,
    };
  }

  /**
   * Resend OTP for unverified user
   * @param {string} email 
   */
  async resendOtp(email) {
    if (!email) {
      throw new BadRequestException('Vui lòng cung cấp địa chỉ email');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Email chưa được đăng ký trong hệ thống');
    }

    if (user.isVerified) {
      throw new BadRequestException('Tài khoản này đã được kích hoạt. Bạn có thể đăng nhập');
    }

    const otp = await otpService.createOtp(normalizedEmail);
    const fullName = user.profile ? user.profile.fullName : 'Quý khách';
    await emailService.sendOtpEmail(normalizedEmail, otp, fullName);

    return {
      email: normalizedEmail,
      message: 'Mã OTP mới đã được gửi đến email của bạn',
    };
  }

  /**
   * Handle Login business logic
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Auth DTO
   */
  async login(email, password) {
    if (!email || !password) {
      throw new BadRequestException('Vui lòng nhập đầy đủ email và mật khẩu');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user by email including Role and Profile
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 3. Check account status & verification
    if (user.status === 'BANNED') {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.');
    }

    if (user.status === 'INACTIVE' || !user.isVerified) {
      throw new ForbiddenException('Tài khoản chưa được kích hoạt. Vui lòng xác thực mã OTP trước khi đăng nhập.');
    }

    // 4. Generate JWT Token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.roleName,
      status: user.status,
    };

    const token = JwtUtils.generateToken(tokenPayload);

    // 5. Map and return safe response
    return UserMapper.toAuthResponse(user, token);
  }

  /**
   * Get current authenticated user profile
   * @param {string} userId
   * @returns {Promise<Object>} User Profile DTO
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return UserMapper.toUserProfileResponse(user);
  }
}

module.exports = new AuthService();
