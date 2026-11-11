const asyncHandler = require("../../../utils/asyncHandler");
const sendResponse = require("../../../utils/sendResponse");
const adminForumService = require("../../../services/admin/adminForum.service");

class AdminForumController {
    constructor(service = adminForumService) {
        this.adminForumService = service;
    }

    /**
     * Thống kê diễn đàn
     * GET /api/v1/admin/forum/stats
     */
    getForumStats = asyncHandler(async (req, res) => {
        const result = await this.adminForumService.getForumStats();
        return sendResponse(
            res,
            200,
            "Lấy thống kê diễn đàn thành công",
            result
        );
    });

    /**
     * Danh sách bài viết kiểm duyệt
     * GET /api/v1/admin/forum/posts
     */
    getPosts = asyncHandler(async (req, res) => {
        const result = await this.adminForumService.getPosts(req.query);
        return sendResponse(
            res,
            200,
            "Lấy danh sách bài viết diễn đàn thành công",
            result
        );
    });

    /**
     * Chi tiết bài viết kèm toàn bộ bình luận lồng nhau
     * GET /api/v1/admin/forum/posts/:id
     */
    getPostDetail = asyncHandler(async (req, res) => {
        const result = await this.adminForumService.getPostDetail(
            req.params.id
        );
        return sendResponse(
            res,
            200,
            "Lấy chi tiết bài viết thành công",
            result
        );
    });

    /**
     * Cập nhật trạng thái bài viết (VISIBLE | HIDDEN | DELETED)
     * PATCH /api/v1/admin/forum/posts/:id/status
     */
    updatePostStatus = asyncHandler(async (req, res) => {
        const result = await this.adminForumService.updatePostStatus(
            req.params.id,
            req.body?.status
        );
        return sendResponse(
            res,
            200,
            "Cập nhật trạng thái bài viết thành công",
            result
        );
    });

    /**
     * Danh sách bình luận toàn diễn đàn
     * GET /api/v1/admin/forum/comments
     */
    getComments = asyncHandler(async (req, res) => {
        const result = await this.adminForumService.getComments(req.query);
        return sendResponse(
            res,
            200,
            "Lấy danh sách bình luận thành công",
            result
        );
    });

    /**
     * Cập nhật trạng thái bình luận (VISIBLE | HIDDEN | DELETED)
     * PATCH /api/v1/admin/forum/comments/:id/status
     */
    updateCommentStatus = asyncHandler(async (req, res) => {
        const result = await this.adminForumService.updateCommentStatus(
            req.params.id,
            req.body?.status
        );
        return sendResponse(
            res,
            200,
            "Cập nhật trạng thái bình luận thành công",
            result
        );
    });
}

module.exports = new AdminForumController();

