const prisma = require("../../config/prisma");
const ForumMapper = require("../../mappers/forum.mapper");
const {
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
} = require("../../exceptions");

const VALID_REACTION_TYPES = ["LIKE", "LOVE", "HAHA", "SAD", "ANGRY"];
const TAGGABLE_EVENT_STATUSES = ["APPROVED", "COMPLETED"];

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000;
const MAX_COMMENT_LENGTH = 2000;

const AUTHOR_SELECT = {
    id: true,
    username: true,
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

const POST_SUMMARY_INCLUDE = {
    author: { select: AUTHOR_SELECT },
    event: { select: EVENT_TAG_SELECT },
    reactions: {
        select: {
            id: true,
            userId: true,
            type: true,
        },
    },
    comments: {
        where: { status: "VISIBLE" },
        select: { id: true, status: true },
    },
};

const POST_DETAIL_INCLUDE = {
    author: { select: AUTHOR_SELECT },
    event: { select: EVENT_TAG_SELECT },
    reactions: {
        select: {
            id: true,
            userId: true,
            type: true,
        },
    },
    comments: {
        orderBy: { createdAt: "asc" },
        include: {
            author: { select: AUTHOR_SELECT },
        },
    },
};

class ForumService {
    constructor(prismaClient = prisma, mapper = ForumMapper) {
        this.prisma = prismaClient;
        this.mapper = mapper;
    }

    isValidObjectId(id) {
        return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id.trim());
    }

    stripHtml(value = "") {
        return String(value)
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    validateTitle(title) {
        if (typeof title !== "string" || !title.trim()) {
            throw new BadRequestException("Tiêu đề bài viết không được để trống");
        }
        const trimmed = title.trim();
        if (trimmed.length > MAX_TITLE_LENGTH) {
            throw new BadRequestException(
                `Tiêu đề bài viết không được vượt quá ${MAX_TITLE_LENGTH} ký tự`
            );
        }
        return trimmed;
    }

    validatePostContent(content) {
        if (typeof content !== "string" || !this.stripHtml(content)) {
            throw new BadRequestException("Nội dung bài viết không được để trống");
        }
        const trimmed = content.trim();
        if (trimmed.length > MAX_CONTENT_LENGTH) {
            throw new BadRequestException(
                `Nội dung bài viết không được vượt quá ${MAX_CONTENT_LENGTH} ký tự`
            );
        }
        return trimmed;
    }

    validateCommentContent(content) {
        if (typeof content !== "string" || !content.trim()) {
            throw new BadRequestException("Nội dung bình luận không được để trống");
        }
        const trimmed = content.trim();
        if (trimmed.length > MAX_COMMENT_LENGTH) {
            throw new BadRequestException(
                `Nội dung bình luận không được vượt quá ${MAX_COMMENT_LENGTH} ký tự`
            );
        }
        return trimmed;
    }

    async resolveValidEventId(eventId) {
        if (
            eventId === undefined ||
            eventId === null ||
            String(eventId).trim() === ""
        ) {
            return null;
        }

        const cleanId = String(eventId).trim();
        if (!this.isValidObjectId(cleanId)) {
            throw new BadRequestException("ID sự kiện gắn thẻ không hợp lệ");
        }

        const event = await this.prisma.event.findFirst({
            where: {
                id: cleanId,
                status: { in: TAGGABLE_EVENT_STATUSES },
            },
            select: { id: true },
        });

        if (!event) {
            throw new NotFoundException(
                "Không tìm thấy sự kiện hợp lệ để gắn vào bài viết"
            );
        }

        return event.id;
    }

    /**
     * Lấy danh sách sự kiện hợp lệ để gắn thẻ hoặc lọc trong Forum
     */
    async getTaggableEvents({ keyword = "", limit = 50 } = {}) {
        const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
        const cleanKeyword = typeof keyword === "string" ? keyword.trim() : "";

        const where = {
            status: { in: TAGGABLE_EVENT_STATUSES },
        };

        if (cleanKeyword) {
            where.name = {
                contains: cleanKeyword,
                mode: "insensitive",
            };
        }

        const events = await this.prisma.event.findMany({
            where,
            take,
            orderBy: [{ startAt: "desc" }],
            select: EVENT_TAG_SELECT,
        });

        return events;
    }

    /**
     * Lấy danh sách bài viết diễn đàn (tìm kiếm, lọc theo sự kiện / thảo luận chung, phân trang)
     */
    async getPosts(queryParams = {}, currentUserId = null) {
        const {
            page = 1,
            limit = 10,
            pageSize,
            keyword = "",
            eventId = "",
            mine = false,
            sortBy = "newest",
        } = queryParams;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.max(
            1,
            Math.min(50, parseInt(pageSize || limit, 10) || 10)
        );
        const skip = (currentPage - 1) * parsedLimit;

        const andConditions = [];
        const isMine = mine === true || mine === "true";

        if (isMine) {
            if (!currentUserId) {
                throw new UnauthorizedException(
                    "Vui lòng đăng nhập để xem bài viết của bạn"
                );
            }
            andConditions.push({ authorId: currentUserId });
            andConditions.push({ status: { not: "DELETED" } });
        } else {
            andConditions.push({ status: "VISIBLE" });
        }

        if (typeof keyword === "string" && keyword.trim()) {
            const cleanKeyword = keyword.trim();
            andConditions.push({
                OR: [
                    { title: { contains: cleanKeyword, mode: "insensitive" } },
                    { content: { contains: cleanKeyword, mode: "insensitive" } },
                ],
            });
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

        const where =
            andConditions.length > 0 ? { AND: andConditions } : {};

        let orderBy = [{ createdAt: "desc" }];
        if (sortBy === "oldest") {
            orderBy = [{ createdAt: "asc" }];
        } else if (sortBy === "popular") {
            orderBy = [
                { reactions: { _count: "desc" } },
                { comments: { _count: "desc" } },
                { createdAt: "desc" },
            ];
        }

        const [posts, totalPosts] = await Promise.all([
            this.prisma.post.findMany({
                where,
                skip,
                take: parsedLimit,
                orderBy,
                include: POST_SUMMARY_INCLUDE,
            }),
            this.prisma.post.count({ where }),
        ]);

        const totalPages = Math.ceil(totalPosts / parsedLimit);
        const pagination = {
            currentPage,
            pageSize: parsedLimit,
            totalPosts,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
        };

        return this.mapper.toPostListResponse(posts, pagination, currentUserId);
    }

    /**
     * Xem chi tiết 1 bài viết kèm cây bình luận lồng nhau
     */
    async getPostDetail(postId, currentUserId = null) {
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: POST_DETAIL_INCLUDE,
        });

        if (!post || post.status === "DELETED") {
            throw new NotFoundException("Không tìm thấy bài viết");
        }

        if (post.status === "HIDDEN" && post.authorId !== currentUserId) {
            throw new NotFoundException(
                "Không tìm thấy bài viết hoặc bài viết đã bị ẩn"
            );
        }

        return this.mapper.toPostDetailResponse(post, currentUserId);
    }

    /**
     * Tạo bài viết mới (gắn tag sự kiện hoặc thảo luận chung)
     */
    async createPost(userId, payload = {}) {
        if (!userId) {
            throw new UnauthorizedException("Vui lòng đăng nhập để đăng bài");
        }

        const title = this.validateTitle(payload.title);
        const content = this.validatePostContent(payload.content);
        const validEventId = await this.resolveValidEventId(payload.eventId);

        const created = await this.prisma.post.create({
            data: {
                authorId: userId,
                eventId: validEventId,
                title,
                content,
                status: "VISIBLE",
            },
            include: POST_DETAIL_INCLUDE,
        });

        return this.mapper.toPostDetailResponse(created, userId);
    }

    /**
     * Cập nhật bài viết của chính mình
     */
    async updatePost(postId, userId, payload = {}) {
        if (!userId) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const existingPost = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!existingPost || existingPost.status === "DELETED") {
            throw new NotFoundException("Không tìm thấy bài viết");
        }

        if (existingPost.authorId !== userId) {
            throw new ForbiddenException(
                "Bạn không có quyền chỉnh sửa bài viết này"
            );
        }

        if (existingPost.status === "HIDDEN") {
            throw new BadRequestException(
                "Bài viết đang bị ẩn bởi quản trị viên, không thể chỉnh sửa"
            );
        }

        const data = {};

        if (payload.title !== undefined) {
            data.title = this.validateTitle(payload.title);
        }

        if (payload.content !== undefined) {
            data.content = this.validatePostContent(payload.content);
        }

        if (payload.eventId !== undefined) {
            data.eventId = await this.resolveValidEventId(payload.eventId);
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException("Không có dữ liệu cần cập nhật");
        }

        const updated = await this.prisma.post.update({
            where: { id: postId },
            data,
            include: POST_DETAIL_INCLUDE,
        });

        return this.mapper.toPostDetailResponse(updated, userId);
    }

    /**
     * Xóa bài viết của chính mình (Soft Delete -> DELETED)
     */
    async deletePost(postId, userId) {
        if (!userId) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const existingPost = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!existingPost || existingPost.status === "DELETED") {
            throw new NotFoundException("Không tìm thấy bài viết");
        }

        if (existingPost.authorId !== userId) {
            throw new ForbiddenException(
                "Bạn không có quyền xóa bài viết này"
            );
        }

        await this.prisma.post.update({
            where: { id: postId },
            data: { status: "DELETED" },
        });

        return { id: postId };
    }

    /**
     * Tạo bình luận mới hoặc trả lời bình luận cha (comment lồng nhau)
     */
    async createComment(postId, userId, payload = {}) {
        if (!userId) {
            throw new UnauthorizedException(
                "Vui lòng đăng nhập để bình luận"
            );
        }
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const content = this.validateCommentContent(payload.content);

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, status: true },
        });

        if (!post || post.status !== "VISIBLE") {
            throw new NotFoundException(
                "Bài viết không tồn tại hoặc không thể bình luận"
            );
        }

        let validParentId = null;

        if (
            payload.parentId !== undefined &&
            payload.parentId !== null &&
            String(payload.parentId).trim() !== ""
        ) {
            const cleanParentId = String(payload.parentId).trim();
            if (!this.isValidObjectId(cleanParentId)) {
                throw new BadRequestException("ID bình luận cha không hợp lệ");
            }

            const parentComment = await this.prisma.comment.findUnique({
                where: { id: cleanParentId },
                select: { id: true, postId: true, status: true },
            });

            if (
                !parentComment ||
                parentComment.postId !== postId ||
                parentComment.status !== "VISIBLE"
            ) {
                throw new BadRequestException(
                    "Bình luận gốc không tồn tại hoặc không hợp lệ để trả lời"
                );
            }

            validParentId = parentComment.id;
        }

        const createdComment = await this.prisma.comment.create({
            data: {
                postId,
                authorId: userId,
                parentId: validParentId,
                content,
                status: "VISIBLE",
            },
            include: {
                author: { select: AUTHOR_SELECT },
            },
        });

        return this.mapper.formatCommentNode(createdComment, userId, false);
    }

    /**
     * Chỉnh sửa bình luận của chính mình
     */
    async updateComment(commentId, userId, payload = {}) {
        if (!userId) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        if (!this.isValidObjectId(commentId)) {
            throw new BadRequestException("ID bình luận không hợp lệ");
        }

        const content = this.validateCommentContent(payload.content);

        const existingComment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!existingComment || existingComment.status === "DELETED") {
            throw new NotFoundException("Không tìm thấy bình luận");
        }

        if (existingComment.authorId !== userId) {
            throw new ForbiddenException(
                "Bạn không có quyền chỉnh sửa bình luận này"
            );
        }

        if (existingComment.status === "HIDDEN") {
            throw new BadRequestException(
                "Bình luận đang bị ẩn bởi quản trị viên, không thể chỉnh sửa"
            );
        }

        const updatedComment = await this.prisma.comment.update({
            where: { id: commentId },
            data: { content },
            include: {
                author: { select: AUTHOR_SELECT },
            },
        });

        return this.mapper.formatCommentNode(updatedComment, userId, false);
    }

    /**
     * Xóa bình luận của chính mình (Soft Delete -> DELETED)
     */
    async deleteComment(commentId, userId) {
        if (!userId) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        if (!this.isValidObjectId(commentId)) {
            throw new BadRequestException("ID bình luận không hợp lệ");
        }

        const existingComment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!existingComment || existingComment.status === "DELETED") {
            throw new NotFoundException("Không tìm thấy bình luận");
        }

        if (existingComment.authorId !== userId) {
            throw new ForbiddenException(
                "Bạn không có quyền xóa bình luận này"
            );
        }

        await this.prisma.comment.update({
            where: { id: commentId },
            data: { status: "DELETED" },
        });

        return { id: commentId, postId: existingComment.postId };
    }

    /**
     * Thả / đổi / hủy reaction trên bài viết
     */
    async toggleReaction(postId, userId, payload = {}) {
        if (!userId) {
            throw new UnauthorizedException(
                "Vui lòng đăng nhập để tương tác bài viết"
            );
        }
        if (!this.isValidObjectId(postId)) {
            throw new BadRequestException("ID bài viết không hợp lệ");
        }

        const type =
            typeof payload.type === "string"
                ? payload.type.trim().toUpperCase()
                : "LIKE";

        if (!VALID_REACTION_TYPES.includes(type)) {
            throw new BadRequestException(
                `Loại cảm xúc không hợp lệ. Chấp nhận: ${VALID_REACTION_TYPES.join(", ")}`
            );
        }

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, status: true },
        });

        if (!post || post.status !== "VISIBLE") {
            throw new NotFoundException(
                "Bài viết không tồn tại hoặc không thể tương tác"
            );
        }

        const existing = await this.prisma.reaction.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId,
                },
            },
        });

        let action = "ADDED";

        if (existing) {
            if (existing.type === type) {
                await this.prisma.reaction.delete({
                    where: { id: existing.id },
                });
                action = "REMOVED";
            } else {
                await this.prisma.reaction.update({
                    where: { id: existing.id },
                    data: { type },
                });
                action = "UPDATED";
            }
        } else {
            await this.prisma.reaction.create({
                data: {
                    postId,
                    userId,
                    type,
                },
            });
        }

        const updatedReactions = await this.prisma.reaction.findMany({
            where: { postId },
            select: { id: true, userId: true, type: true },
        });

        return {
            action,
            reactions: this.mapper.formatReactions(updatedReactions, userId),
        };
    }
}

module.exports = new ForumService();

