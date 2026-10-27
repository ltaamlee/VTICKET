const prisma = require("../../config/prisma");

const notAdmin = {
    role: {
        roleName: {
            not: "ADMIN",
        },
    },
};

class AdminUserService {
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

    // Lấy chi tiết tài khoản theo ID
    async getUserDetail({ userId }) {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                ...notAdmin,
            },
            select: {
                id: true,
                email: true,
                username: true,
                roleId: true,
                status: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        roleName: true,
                    },
                },
            },
        });

        if (!user) {
            const error = new Error("Không tìm thấy người dùng");
            error.statusCode = 404;
            throw error;
        }

        return user;
    }

    async updateUser({ userId, username, email, role, status }) {
        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
                ...notAdmin,
            },
        });

        if (!existingUser) {
            const error = new Error("Không tìm thấy người dùng");
            error.statusCode = 404;
            throw error;
        }

        // Kiểm tra dữ liệu đầu vào
        if (!username?.trim() || !email?.trim()) {
            const error = new Error("Nhập username và email");
            error.statusCode = 400;
            throw error;
        }

        if (!["USER", "ORGANIZER"].includes(role)) {
            const error = new Error("Invalid role");
            error.statusCode = 400;
            throw error;
        }

        if (!["ACTIVE", "INACTIVE", "BANNED"].includes(status)) {
            const error = new Error("Trạng thái không hợp lệ");
            error.statusCode = 400;
            throw error;
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const duplicateUser = await prisma.user.findFirst({
            where: {
                id: { not: userId },
                OR: [
                    { username: normalizedUsername },
                    { email: normalizedEmail },
                ],
            },
            select: {
                username: true,
                email: true,
            },
        });

        if (duplicateUser) {
            const error = new Error(
                duplicateUser.username === normalizedUsername
                    ? "Username đã tồn tại trên hệ thống"
                    : "Email đã tồn tại trên hệ thống"
            );
            error.statusCode = 409;
            throw error;
        }

        
        const roleRecord = await prisma.role.findFirst({
            where: {
                roleName: role,
            },
            select: {
                id: true,
            },
        });

        if (!roleRecord) {
            const error = new Error("Role không hợp lệ");
            error.statusCode = 404;
            throw error;
        }

        return prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                username: normalizedUsername,
                email: normalizedEmail,
                roleId: roleRecord.id,
                status,
            },
            select: {
                id: true,
                username: true,
                email: true,
                roleId: true,
                status: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        roleName: true,
                    },
                },
            },
        });
    }

    async deleteUser({ userId }) {
        const user = await prisma.user.findFirst({
            select: {
                id: true,
            },
        });

        if (!user) {
            const error = new Error("Không tìm thấy người dùng");
            error.statusCode = 404;
            throw error;
        }

        return prisma.user.delete({
            where: {
                id: userId,
            },
        });
    }
}

module.exports = new AdminUserService();