const express = require("express");
const router = express.Router();

const {
    authenticate,
    optionalAuthenticate,
} = require("../../middlewares/auth.middleware");
const forumController = require("../../controllers/v1/forum/forum.controller");

// Danh sách sự kiện hợp lệ để gắn thẻ hoặc lọc
router.get("/events", forumController.getTaggableEvents);

// Bài viết diễn đàn (công khai, có nhận diện user nếu gửi kèm token)
router.get("/posts", optionalAuthenticate, forumController.getPosts);
router.get("/posts/:id", optionalAuthenticate, forumController.getPostDetail);

// Các thao tác yêu cầu đăng nhập
router.post("/posts", authenticate, forumController.createPost);
router.put("/posts/:id", authenticate, forumController.updatePost);
router.delete("/posts/:id", authenticate, forumController.deletePost);

// Bình luận & trả lời bình luận lồng nhau
router.post("/posts/:id/comments", authenticate, forumController.createComment);
router.put("/comments/:commentId", authenticate, forumController.updateComment);
router.delete(
    "/comments/:commentId",
    authenticate,
    forumController.deleteComment
);

// Thả / đổi / hủy cảm xúc bài viết
router.post(
    "/posts/:id/reactions",
    authenticate,
    forumController.toggleReaction
);

module.exports = router;

