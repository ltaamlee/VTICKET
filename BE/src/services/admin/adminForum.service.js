const prisma = require("../../config/prisma");
const ForumMapper = require("../../mappers/forum.mapper");
const {
    BadRequestException,
    NotFoundException,
} = require("../../exceptions");

const VALID_POST_STATUSES = ["VISIBLE", "HIDDEN", "DELETED"];
const VALID_COMMENT_STATUSES = ["VISIBLE", "HIDDEN", "DELETED"];

const ADMIN_AUTHOR_SELECT = {
    id: true,
    username: true,
    email: true,
    profile: {
        select: {
            fullName: true,
            avatar: true,
        },
    },
    role: {
        select: {
            roleName: true,
        },
    },
};

const EVENT_TAG_SELECT = {
    id: true,
    name: true,
    slug: true,
    thumbnailUrl: true,
    startAt: true,
    location: true,
    status: true,
};

class AdminForumService {
    constructor(prismaClient = prisma, mapper = ForumMapper) {
        this.prisma = prismaClient;
        this.mapper = mapper;
    }

    isValidObjectId(id) {
        return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id.trim());
    }

    /**
     * Thống kê tổng quan diễn đàn cho Admin
     */
    async getForumStats() {
        const [
            totalPosts,
            visiblePosts,
            hiddenPosts,
            deletedPosts,
            totalComments,
            visibleComments,
            hiddenComments,
            deletedComments,
            totalReactions,
        ] = await Promise.all([
            this.prisma.post.count(),
            this.prisma.post.count({ where: { status: "VISIBLE" } }),
            this.prisma.post.count({ where: { status: "HIDDEN" } }),
            this.prisma.post.count({ where: { status: "DELETED" } }),
            this.prisma.comment.count(),
            this.prisma.comment.count({ where: { status: "VISIBLE" } }),
            this.prisma.comment.count({ where: { status: "HIDDEN" } }),
            this.prisma.comment.count({ where: { status: "DELETED" } }),
            this.prisma.reaction.count(),
        ]);

        return {
            posts: {
                total: totalPosts,
                visible: visiblePosts,
                hidden: hiddenPosts,
                deleted: deletedPosts,
            },
            comments: {
                total: totalComments,
                visible: visibleComments,
                hidden: hiddenComments,
                deleted: deletedComments,
            },
            totalReactions,
        };
    }

    /**
     * Lấy danh sách toàn bộ bài viết trên diễn đàn để Admin kiểm duyệt
     */
    async getPosts({
        page = 1,
        limit = 10,
        keyword = "",
        status = "",
        eventId = "",
    } = {}) {
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
        const skip = (currentPage - 1) * pageSize;

        const andConditions = [];

        if (typeof status === "string" && status.trim()) {
            const cleanStatus = status.trim().toUpperCase();
            if (!VALID_POST_STATUSES.includes(cleanStatus)) {
                throw new BadRequestException("Trạng thái bài viết không hợp lệ");
            }
            andConditions.push({ status: cleanStatus });
        }

        if (typeof eventId === "string" && eventId.trim()) {
            const cleanEventId = eventId.trim();
            if (cleanEventId === "general" || cleanEventId === "none") {
                andConditions.push({
                    OR: [{ eventId: null }, { eventId: { isSet: false } }],
                });
            } else {
                if (!this.isValidObjectId(cleanEventId)) {
                    throw new BadRequestException("ID sự kiện lọc không hợp lệ");
                }
                andConditions.push({ eventId: cleanEventId });
            }
        }

        if (typeof keyword === "string" && keyword.trim()) {
            const kw = keyword.trim();
            andConditions.push({
                OR: [
                    { title: { contains: kw, mode: "insensitive" } },
                    { content: { contains: kw, mode: "insensitive" } },
                    {
                        author: {
                            is: {
                                email: { contains: kw, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        author: {
                            is: {
                                username: { contains: kw, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        author: {
                            is: {
                                profile: {
                                    is: {
                                        fullName: {
                                            contains: kw,
                                            mode: "insensitive",
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            });
        }

        const where =
            andConditions.length > 0 ? { AND: andConditions } : {};

        const [posts, totalPosts] = await Promise.all([
            this.prisma.post.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    author: { select: ADMIN_AUTHOR_SELECT },
                    event: { select: EVENT_TAG_SELECT },
                    reactions: {
                        select: { id: true, userId: true, type: true },
                    },
                    comments: {
                        select: { id: true, status: true },
                    },
                },
            }),
            this.prisma.post.count({ where }),
        ]);

        const totalPages = Math.ceil(totalPosts / pageSize);

        return {
            posts: posts.map((post) => ({
                ...this.mapper.toPostSummaryResponse(post, null),
                totalComments: post.comments?.length || 0,
                hiddenCommentCount: (post.comments || []).filter(
                    (c) => c.status === "HIDDEN"
                ).length,
            })),
            pagination: {
                currentPage,
                pageSize,
                totalPosts,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
        };
    }

    /**
     * Xem chi tiết bài viết kèm toàn bộ cây bình luận (kể cả ẩn/xóa)
     */
    async getPostDetail(postId) {
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: ADMIN_AUTHOR_SELECT },
                event: { select: EVENT_TAG_SELECT },
                reactions: {
                    select: { id: true, userId: true, type: true },
                },
                comments: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        author: { select: ADMIN_AUTHOR_SELECT },
                    },
                },
            },
        });

        if (!post) {
            throw new NotFoundException("Không tìm thấy bài viết");
        }

        return this.mapper.toPostDetailResponse(post, null, {
            includeAllStatuses: true,
        });
    }

    /**
     * Cập nhật trạng thái kiểm duyệt bài viết (VISIBLE / HIDDEN / DELETED)
     */
    async updatePostStatus(postId, status) {
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const cleanStatus =
            typeof status === "string" ? status.trim().toUpperCase() : "";

        if (!VALID_POST_STATUSES.includes(cleanStatus)) {
            throw new BadRequestException(
                `Trạng thái không hợp lệ. Chấp nhận: ${VALID_POST_STATUSES.join(", ")}`
            );
        }

        const existingPost = await this.prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, status: true },
        });

        if (!existingPost) {
            throw new NotFoundException("Không tìm thấy bài viết");
        }

        const updated = await this.prisma.post.update({
            where: { id: postId },
            data: { status: cleanStatus },
            include: {
                author: { select: ADMIN_AUTHOR_SELECT },
                event: { select: EVENT_TAG_SELECT },
                reactions: {
                    select: { id: true, userId: true, type: true },
                },
                comments: {
                    select: { id: true, status: true },
                },
            },
        });

        return {
            ...this.mapper.toPostSummaryResponse(updated, null),
            totalComments: updated.comments?.length || 0,
        };
    }

    /**
     * Lấy danh sách bình luận toàn hệ thống để Admin kiểm duyệt
     */
    async getComments({
        page = 1,
        limit = 20,
        keyword = "",
        status = "",
        postId = "",
    } = {}) {
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
        const skip = (currentPage - 1) * pageSize;

        const andConditions = [];

        if (typeof status === "string" && status.trim()) {
            const cleanStatus = status.trim().toUpperCase();
            if (!VALID_COMMENT_STATUSES.includes(cleanStatus)) {
                throw new BadRequestException(
                    "Trạng thái bình luận không hợp lệ"
                );
            }
            andConditions.push({ status: cleanStatus });
        }

        if (typeof postId === "string" && postId.trim()) {
            const cleanPostId = postId.trim();
            if (!this.isValidObjectId(cleanPostId)) {
                throw new BadRequestException("ID bài viết không hợp lệ");
            }
            andConditions.push({ postId: cleanPostId });
        }

        if (typeof keyword === "string" && keyword.trim()) {
            const kw = keyword.trim();
            andConditions.push({
                OR: [
                    { content: { contains: kw, mode: "insensitive" } },
                    {
                        author: {
                            is: {
                                email: { contains: kw, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        author: {
                            is: {
                                profile: {
                                    is: {
                                        fullName: {
                                            contains: kw,
                                            mode: "insensitive",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        post: {
                            is: {
                                title: { contains: kw, mode: "insensitive" },
                            },
                        },
                    },
                ],
            });
        }

        const where =
            andConditions.length > 0 ? { AND: andConditions } : {};

        const [comments, totalComments] = await Promise.all([
            this.prisma.comment.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    author: { select: ADMIN_AUTHOR_SELECT },
                    post: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                    parent: {
                        select: {
                            id: true,
                            content: true,
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    profile: { select: { fullName: true } },
                                },
                            },
                        },
                    },
                    _count: {
                        select: { replies: true },
                    },
                },
            }),
            this.prisma.comment.count({ where }),
        ]);

        const totalPages = Math.ceil(totalComments / pageSize);

        return {
            comments: comments.map((comment) => ({
                ...this.mapper.formatCommentNode(comment, null, false),
                post: comment.post || null,
                parentPreview: comment.parent
                    ? {
                          id: comment.parent.id,
                          content: this.mapper.createExcerpt(
                              comment.parent.content,
                              80
                          ),
                          authorName:
                              comment.parent.author?.profile?.fullName ||
                              comment.parent.author?.username ||
                              "Người dùng",
                      }
                    : null,
                replyCount: comment._count?.replies || 0,
            })),
            pagination: {
                currentPage,
                pageSize,
                totalComments,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
        };
    }

    /**
     * Cập nhật trạng thái kiểm duyệt bình luận (VISIBLE / HIDDEN / DELETED)
     */
    async updateCommentStatus(commentId, status) {
        if (!this.isValidObjectId(commentId)) {
            throw new BadRequestException("ID bình luận không hợp lệ");
        }

        const cleanStatus =
            typeof status === "string" ? status.trim().toUpperCase() : "";

        if (!VALID_COMMENT_STATUSES.includes(cleanStatus)) {
            throw new BadRequestException(
                `Trạng thái không hợp lệ. Chấp nhận: ${VALID_COMMENT_STATUSES.join(", ")}`
            );
        }

        const existingComment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true },
        });

        if (!existingComment) {
            throw new NotFoundException("Không tìm thấy bình luận");
        }

        const updated = await this.prisma.comment.update({
            where: { id: commentId },
            data: { status: cleanStatus },
            include: {
                author: { select: ADMIN_AUTHOR_SELECT },
            },
        });

        return this.mapper.formatCommentNode(updated, null, false);
    }
}

module.exports = new AdminForumService();

