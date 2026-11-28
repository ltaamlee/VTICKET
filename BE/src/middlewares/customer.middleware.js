
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/prisma");
const { getRedisClient } = require("../config/redis");
const { ForbiddenException } = require("../exceptions");

class CustomerMiddleware {
    constructor(prismaClient = prisma, redisProvider = getRedisClient) {
        this.prisma = prismaClient;
        this.redisProvider = redisProvider;
        this.cacheTTL = 60;
    }

    verifyActiveCustomer = asyncHandler(async (req, res, next) => {
        const userId = req.user.id;
        const redis = this.redisProvider();
        const cacheKey = `auth:customer:${userId}`;

        let user = null;

        // 1. Lấy thông tin từ Redis
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);

                if (cached) {
                    user = JSON.parse(cached);
                }
            } catch (error) {
                // Redis lỗi thì chuyển sang truy vấn database
            }
        }

        // 2. Nếu không có cache, truy vấn MongoDB
        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    status: true,
                    role: {
                        select: {
                            roleName: true,
                        },
                    },
                },
            });

            // 3. Lưu kết quả vào Redis trong 60 giây
            if (user && redis) {
                try {
                    await redis.set(
                        cacheKey,
                        JSON.stringify(user),
                        "EX",
                        this.cacheTTL
                    );
                } catch (error) {
                    // Bỏ qua lỗi ghi cache
                }
            }
        }

        // 4. Kiểm tra điều kiện giao dịch
        const isActiveCustomer =
            user &&
            user.status === "ACTIVE" &&
            user.role?.roleName === "USER";

        if (!isActiveCustomer) {
            throw new ForbiddenException(
                "Chỉ tài khoản khách hàng đang hoạt động mới có thể giao dịch vé"
            );
        }

        next();
    });
}

module.exports = new CustomerMiddleware();