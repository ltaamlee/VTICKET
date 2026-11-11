const REACTION_TYPES = ["LIKE", "LOVE", "HAHA", "SAD", "ANGRY"];

class ForumMapper {
    /**
     * Format thông tin tác giả bài viết / bình luận
     * @param {Object|null} author
     * @returns {Object|null}
     */
    static formatAuthor(author) {
        if (!author) return null;

        return {
            id: author.id,
            name:
                author.profile?.fullName ||
                author.username ||
                "Người dùng VTICKET",
            ...(author.email ? { email: author.email } : {}),
            avatar: author.profile?.avatar || null,
            role: author.role?.roleName || null,
        };
    }

    /**
     * Format thông tin thẻ sự kiện gắn kèm bài viết (nếu có)
     * @param {Object|null} event
     * @returns {Object|null}
     */
    static formatEventTag(event) {
        if (!event) return null;

        return {
            id: event.id,
            name: event.name,
            slug: event.slug,
            thumbnailUrl: event.thumbnailUrl || null,
            startAt: event.startAt || null,
            location: event.location || null,
            status: event.status || null,
        };
    }

    /**
     * Thống kê tổng hợp các reaction của bài viết
     * @param {Array} reactions
     * @param {string|null} currentUserId
     * @returns {{ total: number, counts: Object, myReaction: string|null }}
     */
    static formatReactions(reactions = [], currentUserId = null) {
        const counts = REACTION_TYPES.reduce((acc, type) => {
            acc[type] = 0;
            return acc;
        }, {});

        let myReaction = null;

        for (const reaction of reactions) {
            if (counts[reaction.type] !== undefined) {
                counts[reaction.type] += 1;
            }
            if (currentUserId && reaction.userId === currentUserId) {
                myReaction = reaction.type;
            }
        }

        return {
            total: reactions.length,
            counts,
            myReaction,
        };
    }

    /**
     * Tạo đoạn mô tả ngắn từ nội dung bài viết
     * @param {string} content
     * @param {number} maxLength
     * @returns {string}
     */
    static createExcerpt(content = "", maxLength = 220) {
        const plainText = String(content)
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (plainText.length <= maxLength) {
            return plainText;
        }

        return `${plainText.slice(0, maxLength).trimEnd()}...`;
    }

    /**
     * Format thông tin tóm tắt của 1 bài viết (danh sách /forum)
     * @param {Object} post
     * @param {string|null} currentUserId
     * @returns {Object|null}
     */
    static toPostSummaryResponse(post, currentUserId = null) {
        if (!post) return null;

        const reactions = this.formatReactions(
            post.reactions || [],
            currentUserId
        );
        const commentCount = Array.isArray(post.comments)
            ? post.comments.filter(
                  (comment) => !comment.status || comment.status === "VISIBLE"
              ).length
            : Number(post._count?.comments || 0);

        return {
            id: post.id,
            title: post.title,
            content: post.content,
            excerpt: this.createExcerpt(post.content),
            status: post.status,
            eventId: post.eventId || null,
            event: this.formatEventTag(post.event),
            isGeneral: !post.eventId,
            author: this.formatAuthor(post.author),
            isOwner: Boolean(currentUserId && post.authorId === currentUserId),
            reactions,
            commentCount,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        };
    }

    /**
     * Format 1 node bình luận phẳng
     * @param {Object} comment
     * @param {string|null} currentUserId
     * @param {boolean} isPlaceholder
     * @returns {Object}
     */
    static formatCommentNode(
        comment,
        currentUserId = null,
        isPlaceholder = false
    ) {
        if (isPlaceholder) {
            return {
                id: comment.id,
                postId: comment.postId,
                parentId: comment.parentId || null,
                content:
                    comment.status === "HIDDEN"
                        ? "Bình luận này đã bị ẩn bởi quản trị viên."
                        : "Bình luận này đã bị tác giả xóa.",
                status: comment.status,
                isPlaceholder: true,
                author: null,
                isOwner: false,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                replies: [],
            };
        }

        return {
            id: comment.id,
            postId: comment.postId,
            parentId: comment.parentId || null,
            content: comment.content,
            status: comment.status,
            isPlaceholder: false,
            author: this.formatAuthor(comment.author),
            isOwner: Boolean(
                currentUserId && comment.authorId === currentUserId
            ),
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            replies: [],
        };
    }

    /**
     * Xây dựng cây bình luận lồng nhau từ danh sách phẳng
     * @param {Array} comments
     * @param {string|null} currentUserId
     * @param {{ includeAllStatuses?: boolean }} options
     * @returns {Array}
     */
    static buildCommentTree(
        comments = [],
        currentUserId = null,
        { includeAllStatuses = false } = {}
    ) {
        const rawMap = new Map();
        const childrenMap = new Map();

        for (const comment of comments) {
            rawMap.set(comment.id, comment);
            childrenMap.set(comment.id, []);
        }

        const roots = [];

        for (const comment of comments) {
            if (comment.parentId && rawMap.has(comment.parentId)) {
                childrenMap.get(comment.parentId).push(comment);
            } else {
                roots.push(comment);
            }
        }

        const buildSubtree = (rawComment, visited = new Set()) => {
            if (visited.has(rawComment.id)) return null;
            visited.add(rawComment.id);

            const childComments = (childrenMap.get(rawComment.id) || []).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            const replies = childComments
                .map((child) => buildSubtree(child, visited))
                .filter(Boolean);

            const isVisible = rawComment.status === "VISIBLE";

            if (includeAllStatuses || isVisible) {
                const node = this.formatCommentNode(
                    rawComment,
                    currentUserId,
                    false
                );
                node.replies = replies;
                return node;
            }

            // Nếu bình luận cha bị ẩn/xóa nhưng vẫn còn reply hiển thị -> giữ placeholder để không mất mạch hội thoại
            if (replies.length > 0) {
                const placeholderNode = this.formatCommentNode(
                    rawComment,
                    currentUserId,
                    true
                );
                placeholderNode.replies = replies;
                return placeholderNode;
            }

            return null;
        };

        const rootNodes = roots
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((root) => buildSubtree(root))
            .filter(Boolean);

        return rootNodes;
    }

    /**
     * Format chi tiết bài viết kèm cây bình luận lồng nhau
     * @param {Object} post
     * @param {string|null} currentUserId
     * @param {{ includeAllStatuses?: boolean }} options
     * @returns {Object|null}
     */
    static toPostDetailResponse(
        post,
        currentUserId = null,
        { includeAllStatuses = false } = {}
    ) {
        if (!post) return null;

        const rawComments = post.comments || [];
        const commentTree = this.buildCommentTree(rawComments, currentUserId, {
            includeAllStatuses,
        });
        const visibleCommentCount = rawComments.filter(
            (comment) => comment.status === "VISIBLE"
        ).length;

        return {
            ...this.toPostSummaryResponse(
                {
                    ...post,
                    _count: { comments: visibleCommentCount },
                },
                currentUserId
            ),
            totalComments: rawComments.length,
            commentCount: visibleCommentCount,
            comments: commentTree,
        };
    }

    /**
     * Format danh sách bài viết phân trang
     * @param {Array} posts
     * @param {Object} pagination
     * @param {string|null} currentUserId
     * @returns {{ posts: Array, pagination: Object }}
     */
    static toPostListResponse(
        posts = [],
        pagination = {},
        currentUserId = null
    ) {
        return {
            posts: posts.map((post) =>
                this.toPostSummaryResponse(post, currentUserId)
            ),
            pagination,
        };
    }
}

module.exports = ForumMapper;
