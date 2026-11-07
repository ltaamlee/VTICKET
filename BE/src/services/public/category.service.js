
const prisma = require("../../config/prisma");

class CategoryService {
    
    async getCategories({ page = 1, keyword = "" } = {}) {
        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize;

        const searchKeyword =
            typeof keyword === "string" ? keyword.trim() : "";

        const where = searchKeyword
            ? {
                OR: [
                    {
                        name: {
                            contains: searchKeyword,
                            mode: "insensitive",
                        },
                    },
                    {
                        slug: {
                            contains: searchKeyword,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {};

        const [categories, totalCategories] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    _count: {
                        select: {
                            events: true,
                        },
                    },
                },
            }),

            prisma.category.count({ where }),
        ]);

        return {
            categories: categories.map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                eventCount: category._count.events,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            })),
            pagination: {
                currentPage,
                pageSize,
                totalCategories,
                totalPages: Math.ceil(totalCategories / pageSize),
            },
        };
    }
}

module.exports = new CategoryService();