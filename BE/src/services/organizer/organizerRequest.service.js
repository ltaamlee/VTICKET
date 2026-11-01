const prisma = require('../../config/prisma');
const {
  BadRequestException,
  NotFoundException,
  ConflictException,
} = require('../../exceptions');
const OrganizerRequestMapper = require('../../mappers/organizerRequest.mapper');

class OrganizerRequestService {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Submit an organizer registration request
   * @param {string} userId - ID of the authenticated user
   * @param {Object} data - Request payload
   * @returns {Promise<Object>} Formatted OrganizerRequest DTO
   */
  async createRequest(userId, data) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Tài khoản của bạn hiện đang bị khóa hoặc không hoạt động');
    }

    // Kiểm tra quyền hiện tại của user
    const currentRole = user.role?.roleName;
    if (currentRole === 'ORGANIZER') {
      throw new BadRequestException('Tài khoản của bạn đã là Ban Tổ Chức (ORGANIZER)');
    }
    if (currentRole === 'ADMIN') {
      throw new BadRequestException('Tài khoản Quản trị viên (ADMIN) không cần đăng ký làm Ban Tổ Chức');
    }

    // Kiểm tra xem đã có đơn PENDING chưa
    const existingPending = await this.prisma.organizerRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new ConflictException(
        'Bạn đang có một yêu cầu đăng ký Ban Tổ Chức đang chờ xét duyệt. Vui lòng chờ phản hồi từ ban quản trị.'
      );
    }

    // Validate dữ liệu đầu vào
    const {
      organizationName,
      contactEmail,
      contactPhone,
      organizerType = 'INDIVIDUAL',
      address,
      website,
      taxCode,
      idCardNumber,
      idFrontImage,
      idBackImage,
      businessLicense,
      description,
    } = data;

    if (!organizationName || typeof organizationName !== 'string' || organizationName.trim().length < 2) {
      throw new BadRequestException('Tên tổ chức / Đơn vị tổ chức phải có tối thiểu 2 ký tự');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail || !emailRegex.test(contactEmail.trim())) {
      throw new BadRequestException('Email liên hệ không hợp lệ');
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!contactPhone || !phoneRegex.test(contactPhone.trim())) {
      throw new BadRequestException('Số điện thoại liên hệ không đúng định dạng');
    }

    const validTypes = ['INDIVIDUAL', 'BUSINESS'];
    if (!validTypes.includes(organizerType)) {
      throw new BadRequestException('Loại hình tổ chức không hợp lệ (Cá nhân hoặc Doanh nghiệp)');
    }

    // Tạo đơn đăng ký
    const newRequest = await this.prisma.organizerRequest.create({
      data: {
        userId,
        organizerType,
        organizationName: organizationName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        address: address ? address.trim() : null,
        website: website ? website.trim() : null,
        taxCode: taxCode ? taxCode.trim() : null,
        idCardNumber: idCardNumber ? idCardNumber.trim() : null,
        idFrontImage: idFrontImage || null,
        idBackImage: idBackImage || null,
        businessLicense: businessLicense || null,
        description: description ? description.trim() : null,
        status: 'PENDING',
      },
      include: {
        user: {
          include: {
            profile: true,
            role: true,
          },
        },
      },
    });

    return OrganizerRequestMapper.toOrganizerRequestResponse(newRequest);
  }

  /**
   * Get user's current organizer status and latest request
   * @param {string} userId - ID of authenticated user
   * @returns {Promise<Object>} Status and latest request details
   */
  async getMyRequest(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true,
        organizerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const latestRequest = await this.prisma.organizerRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: {
            profile: true,
            role: true,
          },
        },
      },
    });

    return {
      currentRole: user.role?.roleName || 'USER',
      isOrganizer: user.role?.roleName === 'ORGANIZER',
      organizerProfile: user.organizerProfile
        ? OrganizerRequestMapper.toOrganizerProfileResponse(user.organizerProfile)
        : null,
      latestRequest: latestRequest
        ? OrganizerRequestMapper.toOrganizerRequestResponse(latestRequest)
        : null,
    };
  }

  /**
   * Update request content while it is still PENDING
   * @param {string} userId - ID of authenticated user
   * @param {string} requestId - ID of OrganizerRequest
   * @param {Object} data - Update data
   */
  async updateMyRequest(userId, requestId, data) {
    const request = await this.prisma.organizerRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký của bạn');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể cập nhật thông tin khi đơn đăng ký đang chờ xét duyệt');
    }

    const updatePayload = {};

    if (data.organizationName !== undefined) {
      if (!data.organizationName || data.organizationName.trim().length < 2) {
        throw new BadRequestException('Tên tổ chức phải có tối thiểu 2 ký tự');
      }
      updatePayload.organizationName = data.organizationName.trim();
    }

    if (data.contactEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.contactEmail || !emailRegex.test(data.contactEmail.trim())) {
        throw new BadRequestException('Email liên hệ không hợp lệ');
      }
      updatePayload.contactEmail = data.contactEmail.trim().toLowerCase();
    }

    if (data.contactPhone !== undefined) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!data.contactPhone || !phoneRegex.test(data.contactPhone.trim())) {
        throw new BadRequestException('Số điện thoại liên hệ không đúng định dạng');
      }
      updatePayload.contactPhone = data.contactPhone.trim();
    }

    if (data.organizerType !== undefined) {
      const validTypes = ['INDIVIDUAL', 'BUSINESS'];
      if (!validTypes.includes(data.organizerType)) {
        throw new BadRequestException('Loại hình tổ chức không hợp lệ');
      }
      updatePayload.organizerType = data.organizerType;
    }

    if (data.address !== undefined) updatePayload.address = data.address ? data.address.trim() : null;
    if (data.website !== undefined) updatePayload.website = data.website ? data.website.trim() : null;
    if (data.taxCode !== undefined) updatePayload.taxCode = data.taxCode ? data.taxCode.trim() : null;
    if (data.idCardNumber !== undefined) updatePayload.idCardNumber = data.idCardNumber ? data.idCardNumber.trim() : null;
    if (data.idFrontImage !== undefined) updatePayload.idFrontImage = data.idFrontImage || null;
    if (data.idBackImage !== undefined) updatePayload.idBackImage = data.idBackImage || null;
    if (data.businessLicense !== undefined) updatePayload.businessLicense = data.businessLicense || null;
    if (data.description !== undefined) updatePayload.description = data.description ? data.description.trim() : null;

    const updated = await this.prisma.organizerRequest.update({
      where: { id: requestId },
      data: updatePayload,
      include: {
        user: {
          include: {
            profile: true,
            role: true,
          },
        },
      },
    });

    return OrganizerRequestMapper.toOrganizerRequestResponse(updated);
  }

  /**
   * Cancel a PENDING organizer registration request
   * @param {string} userId - ID of authenticated user
   * @param {string} requestId - ID of OrganizerRequest
   */
  async cancelMyRequest(userId, requestId) {
    const request = await this.prisma.organizerRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký của bạn');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy đơn đăng ký khi đang ở trạng thái Chờ xét duyệt');
    }

    await this.prisma.organizerRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return {
      message: 'Hủy đơn đăng ký Ban Tổ Chức thành công',
    };
  }
}

module.exports = new OrganizerRequestService();
