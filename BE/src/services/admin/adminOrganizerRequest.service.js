const prisma = require('../../config/prisma');
const emailService = require('../../shared/email.service');
const {
  BadRequestException,
  NotFoundException,
} = require('../../exceptions');
const OrganizerRequestMapper = require('../../mappers/organizerRequest.mapper');

class AdminOrganizerRequestService {
  constructor(prismaClient = prisma, emailSvc = emailService) {
    this.prisma = prismaClient;
    this.emailService = emailSvc;
  }

  /**
   * Get paginated list of organizer registration requests with filter and search
   * @param {Object} params - { page, limit, status, keyword }
   * @returns {Promise<Object>} List of requests with pagination
   */
  async getRequests({ page = 1, limit = 10, status = '', keyword = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Filter theo status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    if (status && validStatuses.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    // Tìm kiếm theo từ khóa
    if (keyword && keyword.trim()) {
      const kw = keyword.trim();
      where.OR = [
        { organizationName: { contains: kw, mode: 'insensitive' } },
        { contactEmail: { contains: kw, mode: 'insensitive' } },
        { contactPhone: { contains: kw, mode: 'insensitive' } },
        { user: { email: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.organizerRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            include: {
              profile: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.organizerRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return OrganizerRequestMapper.toOrganizerRequestListResponse(requests, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    });
  }

  /**
   * Get single request detail by ID
   * @param {string} requestId 
   * @returns {Promise<Object>} Request detail DTO
   */
  async getRequestDetail(requestId) {
    const request = await this.prisma.organizerRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            profile: true,
            role: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký Ban Tổ Chức');
    }

    // Nếu đã có admin duyệt, lấy thêm thông tin của admin đó
    let reviewer = null;
    if (request.reviewedBy) {
      reviewer = await this.prisma.user.findUnique({
        where: { id: request.reviewedBy },
        include: { profile: true },
      });
    }

    const dto = OrganizerRequestMapper.toOrganizerRequestResponse(request);
    if (reviewer) {
      dto.reviewer = {
        id: reviewer.id,
        email: reviewer.email,
        fullName: reviewer.profile?.fullName || reviewer.username || 'Quản trị viên',
      };
    }

    return dto;
  }

  /**
   * Approve organizer registration request:
   * 1. Update request status to APPROVED
   * 2. Update user's role to ORGANIZER
   * 3. Upsert OrganizerProfile
   * 4. Send notification email to applicant
   * @param {string} requestId 
   * @param {string} adminId 
   */
  async approveRequest(requestId, adminId) {
    const request = await this.prisma.organizerRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            profile: true,
            role: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký Ban Tổ Chức');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Đơn đăng ký này đã được xử lý trước đó với trạng thái: ${request.status}`
      );
    }

    // Tìm Role ORGANIZER
    const organizerRole = await this.prisma.role.findUnique({
      where: { roleName: 'ORGANIZER' },
    });

    if (!organizerRole) {
      throw new NotFoundException('Hệ thống chưa thiết lập vai trò ORGANIZER');
    }

    const now = new Date();

    // 1. Cập nhật trạng thái đơn thành APPROVED
    const updatedRequest = await this.prisma.organizerRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: now,
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

    // 2. Nâng cấp role của User thành ORGANIZER
    await this.prisma.user.update({
      where: { id: request.userId },
      data: {
        roleId: organizerRole.id,
      },
    });

    // 3. Upsert OrganizerProfile
    await this.prisma.organizerProfile.upsert({
      where: { userId: request.userId },
      update: {
        organizationName: request.organizationName,
        organizerType: request.organizerType,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
        address: request.address,
        website: request.website,
        taxCode: request.taxCode,
        idCardNumber: request.idCardNumber,
        businessLicense: request.businessLicense,
        description: request.description,
        isVerified: true,
      },
      create: {
        userId: request.userId,
        organizationName: request.organizationName,
        organizerType: request.organizerType,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
        address: request.address,
        website: request.website,
        taxCode: request.taxCode,
        idCardNumber: request.idCardNumber,
        businessLicense: request.businessLicense,
        description: request.description,
        isVerified: true,
      },
    });

    // 4. Gửi email thông báo phê duyệt
    const recipientEmail = request.contactEmail || request.user?.email;
    const recipientName = request.user?.profile?.fullName || request.user?.username || 'Quý khách';
    this.emailService
      .sendOrganizerApprovedEmail(recipientEmail, request.organizationName, recipientName)
      .catch((err) => console.error('[Approve Organizer] Send email error:', err.message));

    return OrganizerRequestMapper.toOrganizerRequestResponse(updatedRequest);
  }

  /**
   * Reject organizer registration request with reason:
   * 1. Update request status to REJECTED
   * 2. Send notification email to applicant
   * @param {string} requestId 
   * @param {string} adminId 
   * @param {Object} param2 - { rejectReason }
   */
  async rejectRequest(requestId, adminId, { rejectReason }) {
    if (!rejectReason || typeof rejectReason !== 'string' || rejectReason.trim().length < 5) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự)');
    }

    const request = await this.prisma.organizerRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            profile: true,
            role: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký Ban Tổ Chức');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Đơn đăng ký này đã được xử lý trước đó với trạng thái: ${request.status}`
      );
    }

    const now = new Date();

    const updatedRequest = await this.prisma.organizerRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectReason: rejectReason.trim(),
        reviewedBy: adminId,
        reviewedAt: now,
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

    // Gửi email thông báo từ chối kèm lý do
    const recipientEmail = request.contactEmail || request.user?.email;
    const recipientName = request.user?.profile?.fullName || request.user?.username || 'Quý khách';
    this.emailService
      .sendOrganizerRejectedEmail(
        recipientEmail,
        request.organizationName,
        recipientName,
        rejectReason.trim()
      )
      .catch((err) => console.error('[Reject Organizer] Send email error:', err.message));

    return OrganizerRequestMapper.toOrganizerRequestResponse(updatedRequest);
  }

  /**
   * Get stats of organizer registration requests
   * @returns {Promise<Object>} Statistics counts
   */
  async getOrganizerStats() {
    const [total, pending, approved, rejected, cancelled] = await Promise.all([
      this.prisma.organizerRequest.count(),
      this.prisma.organizerRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.organizerRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.organizerRequest.count({ where: { status: 'REJECTED' } }),
      this.prisma.organizerRequest.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
    };
  }
}

module.exports = new AdminOrganizerRequestService();
