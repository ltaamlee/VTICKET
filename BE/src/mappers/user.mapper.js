class UserMapper {
  /**
   * Format authentication response with User details and JWT token
   * @param {Object} user - User entity from DB
   * @param {string} token - JWT Token
   * @returns {Object} Auth DTO
   */
  static toAuthResponse(user, token) {
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role ? user.role.roleName : null,
        status: user.status,
        isVerified: user.isVerified,
        fullName: user.profile ? user.profile.fullName : null,
        phone: user.profile ? user.profile.phone : null,
        avatar: user.profile ? user.profile.avatar : null,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Format public profile response
   * @param {Object} user - User entity from DB
   * @returns {Object} User DTO
   */
  static toUserProfileResponse(user) {
    return {
      id: user.id,
      email: user.email,
      role: user.role ? user.role.roleName : null,
      status: user.status,
      isVerified: user.isVerified,
      fullName: user.profile ? user.profile.fullName : null,
      phone: user.profile ? user.profile.phone : null,
      avatar: user.profile ? user.profile.avatar : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

module.exports = UserMapper;
