class OrganizerRequestMapper {
  /**
   * Format single OrganizerRequest entity to DTO
   * @param {Object} request - OrganizerRequest entity from DB
   * @returns {Object} Formatted DTO
   */
  static toOrganizerRequestResponse(request) {
    if (!request) return null;

    const userObj = request.user
      ? {
          id: request.user.id,
          email: request.user.email,
          status: request.user.status,
          fullName: request.user.profile?.fullName || request.user.username || null,
          phone: request.user.profile?.phone || null,
          avatar: request.user.profile?.avatar || null,
          role: request.user.role?.roleName || null,
        }
      : null;

    return {
      id: request.id,
      userId: request.userId,
      user: userObj,
      applicant: userObj,
      organizerType: request.organizerType,
      organizationName: request.organizationName,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone,
      address: request.address || null,
      website: request.website || null,
      taxCode: request.taxCode || null,
      idCardNumber: request.idCardNumber || null,
      idFrontImage: request.idFrontImage || null,
      idBackImage: request.idBackImage || null,
      businessLicense: request.businessLicense || null,
      description: request.description || null,
      status: request.status,
      rejectReason: request.rejectReason || null,
      reviewedBy: request.reviewedBy || null,
      reviewedAt: request.reviewedAt || null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  /**
   * Format paginated list of OrganizerRequest entities
   * @param {Array} requests - Array of requests
   * @param {Object} pagination - { page, limit, total, totalPages }
   * @returns {Object} Formatted list with pagination
   */
  static toOrganizerRequestListResponse(requests, pagination) {
    const list = requests.map((req) => this.toOrganizerRequestResponse(req));
    return {
      requests: list,
      items: list,
      pagination,
    };
  }

  /**
   * Format OrganizerProfile entity to DTO
   * @param {Object} profile - OrganizerProfile entity from DB
   * @returns {Object} Formatted DTO
   */
  static toOrganizerProfileResponse(profile) {
    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      organizerType: profile.organizerType,
      organizationName: profile.organizationName,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      address: profile.address || null,
      website: profile.website || null,
      taxCode: profile.taxCode || null,
      idCardNumber: profile.idCardNumber || null,
      businessLicense: profile.businessLicense || null,
      description: profile.description || null,
      logo: profile.logo || null,
      banner: profile.banner || null,
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}

module.exports = OrganizerRequestMapper;
