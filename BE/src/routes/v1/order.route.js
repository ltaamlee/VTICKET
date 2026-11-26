const express = require("express");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const prisma = require("../../config/prisma");
const { getRedisClient } = require("../../config/redis");
const { ForbiddenException } = require("../../exceptions");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("../../controllers/v1/user/order.controller");
const orderError = require("../../middlewares/order-error.middleware");

const CUSTOMER_CACHE_TTL_SECONDS = 60;
const router = express.Router();
const customerOnly = [
    authorize("USER"),
    asyncHandler(async (req, res, next) => {
        const redis = getRedisClient();
        const cacheKey = `auth:customer:${req.user.id}`;
        let user = null;

        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) user = JSON.parse(cached);
            } catch {
                // Fall back to MongoDB
            }
        }

        if (!user) {
            user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { status: true, role: { select: { roleName: true } } },
            });
            if (user && redis) {
                try {
                    await redis.set(cacheKey, JSON.stringify(user), "EX", CUSTOMER_CACHE_TTL_SECONDS);
                } catch {
                    // Ignore Redis write failure
                }
            }
        }

        if (!user || user.status !== "ACTIVE" || user.role?.roleName !== "USER") {
            throw new ForbiddenException("Chỉ tài khoản khách hàng mới có thể mua vé");
        }
        next();
    }),
];
router.use(authenticate);
router.post("/booking-session", customerOnly, controller.startBooking);
router.post("/", customerOnly, controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.post("/:id/cancel", customerOnly, controller.cancel);
router.post("/:id/checkout", customerOnly, controller.checkout);
router.use(orderError);

module.exports = router;
