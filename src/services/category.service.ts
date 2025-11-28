import { prisma } from '../prisma/client';
import { createCategorySchema, updateCategorySchema } from '../utils/validation/category.schema';
import { z } from 'zod';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

const getUserOrgId = async (userId: string): Promise<string> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            members: {
                take: 1,
                select: { orgId: true }
            }
        }
    });

    if (!user || !user.members || user.members.length === 0) {
        throw new Error("User is not associated with any organization.");
    }
    return user.members[0].orgId;
};

export const createCategory = async (userId: string, data: CreateCategoryInput) => {
    const orgId = await getUserOrgId(userId);

    const newCategory = await prisma.category.create({
        data: {
            categoryName: data.categoryName,
            orgId,
        }
    });
    return newCategory;
};

export const getCategories = async (userId: string) => {
    const orgId = await getUserOrgId(userId);
    return await prisma.category.findMany({
        where: { orgId }
    });
};

export const getCategoryById = async (categoryId: string, userId: string) => {
    const orgId = await getUserOrgId(userId);
    const category = await prisma.category.findFirst({
        where: { id: categoryId, orgId }
    });
    if (!category) {
        throw new Error('Category not found or you do not have permission to view it.');
    }
    return category;
};

export const updateCategory = async (categoryId: string, userId: string, data: UpdateCategoryInput) => {
    const orgId = await getUserOrgId(userId);

    // Ensure category exists and belongs to the user's org
    const existingCategory = await prisma.category.findFirst({
        where: { id: categoryId, orgId }
    });

    if (!existingCategory) {
        throw new Error('Category not found or you do not have permission to update it.');
    }

    const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: {
            categoryName: data.categoryName
        }
    });
    return updatedCategory;
};

export const deleteCategory = async (categoryId: string, userId: string) => {
    const orgId = await getUserOrgId(userId);

    // Ensure category exists and belongs to the user's org
    const existingCategory = await prisma.category.findFirst({
        where: { id: categoryId, orgId }
    });

    if (!existingCategory) {
        throw new Error('Category not found or you do not have permission to delete it.');
    }

    // Check if category is being used by any transaction
    const transactionCount = await prisma.transaction.count({
        where: { categoryId: categoryId }
    });

    if (transactionCount > 0) {
        throw new Error('Cannot delete category as it is associated with existing transactions.');
    }

    await prisma.category.delete({
        where: { id: categoryId }
    });

    return { message: 'Category deleted successfully' };
};
