const prisma = require("../../config/prisma");

const notAdmin = {
    role: {
        roleName: {
            not: "ADMIN",
        },
    },
};

class AdminUserService {
    // Thống kê tài khoản, không tính ADMIN
    async getUserStats() {
        const [totalUsers, customerCount, orgranizerCount] =
            await Promise.all([
                prisma.user.count({
                    where: notAdmin,
                }),

                prisma.user.count({
                    where: {
                        role: {
                            roleName: "USER",
                        },
                    },
                }),

                prisma.user.count({
                    where: {
                        role: {
                            roleName: "ORGANIZER",
                        },
                    },
                }),
            ]);

        return {
            totalUsers,
            customerCount,
            orgranizerCount,
        };
    }

    // Lấy danh sách tài khoản, tìm kiếm, lọc vai trò và phân trang
    async getUsers({ page = 1, keyword = "", role = "" } = {}) {
        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize;

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

        const conditions = [notAdmin];

        // Tìm kiếm theo email hoặc username
        if (searchKeyword) {
            conditions.push({
                OR: [
                    {
                        email: {
                            contains: searchKeyword,
                            mode: "insensitive",
                        },
                    },
                    {
                        username: {
                            contains: searchKeyword,
                            mode: "insensitive",
                        },
                    },
                ],
            });
        }

        // Lọc theo vai trò
        if (role && ["USER", "ORGANIZER"].includes(role)) {
            conditions.push({
                role: {
                    roleName: role,
                },
            });
        }

        const where = {
            AND: conditions,
        };

        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    roleId: true,
                    status: true,
                    isVerified: true,
                    createdAt: true,
                    role: {
                        select: {
                            roleName: true,
                        },
                    },
                },
            }),

            prisma.user.count({
                where,
            }),
        ]);

        return {
            users,
            pagination: {
                currentPage,
                pageSize,
                totalUsers,
                totalPages: Math.ceil(totalUsers / pageSize),
            },
        };
    }
}

module.exports = new AdminUserService();
