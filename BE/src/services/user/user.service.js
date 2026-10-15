const prisma = require('../../config/prisma');
const UserMapper = require('../../mappers/user.mapper');
const { NotFoundException, BadRequestException } = require('../../exceptions');

class UserService {
  /**
   * Get user profile by user ID
   * @param {string} userId - ID of authenticated user
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
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    return UserMapper.toUserProfileResponse(user);
  }

  /**
   * Update user profile information
   * @param {string} userId - ID of authenticated user
   * @param {Object} updateData - { fullName, phone, dob, avatar }
   * @returns {Promise<Object>} Updated User Profile DTO
   */
  async updateProfile(userId, updateData) {
    const { fullName, phone, dob, avatar } = updateData;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const profileData = {};

    // Validate and set fullName
    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length < 2) {
        throw new BadRequestException('Họ và tên phải có tối thiểu 2 ký tự');
      }
      profileData.fullName = fullName.trim();
    }

    // Validate and set phone
    if (phone !== undefined) {
      if (phone !== null && phone !== '') {
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(phone.trim())) {
          throw new BadRequestException('Số điện thoại không đúng định dạng');
        }
        profileData.phone = phone.trim();
      } else {
        profileData.phone = null;
      }
    }

    // Validate and set dob (Date of Birth)
    if (dob !== undefined) {
      if (dob !== null && dob !== '') {
        const parsedDob = new Date(dob);
        if (isNaN(parsedDob.getTime())) {
          throw new BadRequestException('Ngày sinh không hợp lệ');
        }
        if (parsedDob > new Date()) {
          throw new BadRequestException('Ngày sinh không thể là ngày trong tương lai');
        }
        profileData.dob = parsedDob;
      } else {
        profileData.dob = null;
      }
    }

    // Validate and set avatar (URL string)
    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== 'string') {
        throw new BadRequestException('Đường dẫn ảnh đại diện không hợp lệ');
      }
      profileData.avatar = avatar ? avatar.trim() : null;
    }

    // Upsert UserProfile
    await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });

    // Fetch updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true,
      },
    });

    return UserMapper.toUserProfileResponse(updatedUser);
  }
}

module.exports = new UserService();
