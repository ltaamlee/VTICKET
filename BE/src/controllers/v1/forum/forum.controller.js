const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const forumService = require("../../../services/forum/forum.service");

class ForumController {
    constructor(service = forumService) {
        this.forumService = service;
    }

    /**
     * Lấy danh sách sự kiện hợp lệ để gắn thẻ / lọc bài viết Forum
     * GET /api/v1/forum/events
     */
    getTaggableEvents = asyncHandler(async (req, res) => {
        const result = await this.forumService.getTaggableEvents(req.query);
        return sendResponse(
            res,
            200,
            "Lấy danh sách sự kiện thảo luận thành công",
            { events: result }
        );
    });

    /**
     * Lấy danh sách bài viết trên diễn đàn
     * GET /api/v1/forum/posts
     */
    getPosts = asyncHandler(async (req, res) => {
        const result = await this.forumService.getPosts(
            req.query,
            req.user?.id || null
        );
        return sendResponse(
            res,
            200,
            "Lấy danh sách bài viết diễn đàn thành công",
            result
        );
    });

    /**
     * Xem chi tiết bài viết kèm cây bình luận lồng nhau
     * GET /api/v1/forum/posts/:id
     */
    getPostDetail = asyncHandler(async (req, res) => {
        const result = await this.forumService.getPostDetail(
            req.params.id,
            req.user?.id || null
        );
        return sendResponse(res, 200, "Lấy chi tiết bài viết thành công", result);
    });

    /**
     * Tạo bài viết mới
     * POST /api/v1/forum/posts
     */
    createPost = asyncHandler(async (req, res) => {
        const result = await this.forumService.createPost(
            req.user.id,
            req.body
        );
        return sendResponse(res, 201, "Đăng bài viết thành công", result);
    });

    /**
     * Cập nhật bài viết của chính mình
     * PUT /api/v1/forum/posts/:id
     */
    updatePost = asyncHandler(async (req, res) => {
        const result = await this.forumService.updatePost(
            req.params.id,
            req.user.id,
            req.body
        );
        return sendResponse(res, 200, "Cập nhật bài viết thành công", result);
    });

    /**
     * Xóa bài viết của chính mình (Soft delete)
     * DELETE /api/v1/forum/posts/:id
     */
    deletePost = asyncHandler(async (req, res) => {
        const result = await this.forumService.deletePost(
            req.params.id,
            req.user.id
        );
        return sendResponse(res, 200, "Xóa bài viết thành công", result);
    });

    /**
     * Thêm bình luận mới hoặc trả lời bình luận cha
     * POST /api/v1/forum/posts/:id/comments
     */
    createComment = asyncHandler(async (req, res) => {
        const result = await this.forumService.createComment(
            req.params.id,
            req.user.id,
            req.body
        );
        return sendResponse(res, 201, "Gửi bình luận thành công", result);
    });

    /**
     * Chỉnh sửa bình luận của chính mình
     * PUT /api/v1/forum/comments/:commentId
     */
    updateComment = asyncHandler(async (req, res) => {
        const result = await this.forumService.updateComment(
            req.params.commentId,
            req.user.id,
            req.body
        );
        return sendResponse(res, 200, "Cập nhật bình luận thành công", result);
    });

    /**
     * Xóa bình luận của chính mình
     * DELETE /api/v1/forum/comments/:commentId
     */
    deleteComment = asyncHandler(async (req, res) => {
        const result = await this.forumService.deleteComment(
            req.params.commentId,
            req.user.id
        );
        return sendResponse(res, 200, "Xóa bình luận thành công", result);
    });

    /**
     * Thả / đổi / hủy cảm xúc bài viết
     * POST /api/v1/forum/posts/:id/reactions
     */
    toggleReaction = asyncHandler(async (req, res) => {
        const result = await this.forumService.toggleReaction(
            req.params.id,
            req.user.id,
            req.body
        );
        return sendResponse(res, 200, "Tương tác bài viết thành công", result);
    });
}

module.exports = new ForumController();

