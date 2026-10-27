const prisma = require("../../config/prisma");
const generateSlug = require("../../utils/generateSlug");

class AdminCategoryService {

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

    async getCategoryDetail({ categoryId }) {
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId,
            },
            include: {
                _count: {
                    select: {
                        events: true,
                    },
                },
            },
        });

        if (!category) {
            const error = new Error("Không tìm thấy danh mục");
            error.statusCode = 404;
            throw error;
        }

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            eventCount: category._count.events,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    async createCategory({ name, slug }) {
        if (typeof name !== "string" || !name.trim()) {
            const error = new Error("Tên danh mục không được để trống");
            error.statusCode = 400;
            throw error;
        }

        const categoryName = name.trim();
        const categorySlug = generateSlug(
            typeof slug === "string" && slug.trim()
                ? slug
                : categoryName
        );

        if (!categorySlug) {
            const error = new Error("Slug danh mục không hợp lệ");
            error.statusCode = 400;
            throw error;
        }

        const existingCategory = await prisma.category.findFirst({
            where: {
                slug: categorySlug,
            },
            select: {
                id: true,
            },
        });

        if (existingCategory) {
            const error = new Error("Slug danh mục đã tồn tại");
            error.statusCode = 409;
            throw error;
        }

        const category = await prisma.category.create({
            data: {
                name: categoryName,
                slug: categorySlug,
            },
        });

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    async updateCategory({ categoryId, name, slug }) {
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: categoryId,
            },
        });

        if (!existingCategory) {
            const error = new Error("Không tìm thấy danh mục");
            error.statusCode = 404;
            throw error;
        }

        const data = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                const error = new Error("Tên danh mục không được để trống");
                error.statusCode = 400;
                throw error;
            }

            data.name = name.trim();
        }

        const slugSource =
            typeof slug === "string" && slug.trim()
                ? slug
                : data.name || existingCategory.name;

        const categorySlug = generateSlug(slugSource);

        if (!categorySlug) {
            const error = new Error("Slug danh mục không hợp lệ");
            error.statusCode = 400;
            throw error;
        }

        const duplicateCategory = await prisma.category.findFirst({
            where: {
                slug: categorySlug,
                NOT: { id: categoryId },
            },
            select: { id: true },
        });

        if (duplicateCategory) {
            const error = new Error("Slug danh mục đã tồn tại");
            error.statusCode = 409;
            throw error;
        }

        data.slug = categorySlug;

        const category = await prisma.category.update({
            where: {
                id: categoryId,
            },
            data,
        });

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    async deleteCategory({ categoryId }) {
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId,
            },
            include: {
                _count: {
                    select: {
                        events: true,
                    },
                },
            },
        });

        if (!category) {
            const error = new Error("Không tìm thấy danh mục");
            error.statusCode = 404;
            throw error;
        }

        if (category._count.events > 0) {
            const error = new Error(
                "Không thể xóa danh mục đang được sử dụng bởi sự kiện"
            );
            error.statusCode = 409;
            throw error;
        }

        await prisma.category.delete({
            where: {
                id: categoryId,
            },
        });

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
        };
    }
}

module.exports = new AdminCategoryService();