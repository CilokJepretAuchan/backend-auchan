import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Define roles for route protection
const allMemberRoles = ['ADMIN', 'OWNER', 'MANAGER', 'MEMBER', 'VIEWER'];
const adminRoles = ['ADMIN', 'OWNER', 'TREASURER'];

// All routes require a valid JWT
router.use(authenticateJWT);

/**
 * @route POST /api/categories
 * @description Create a new category.
 * Accessible by admin roles.
 */
router.post('/', authorize(adminRoles), categoryController.create as any);

/**
 * @route GET /api/categories
 * @description List all categories for an organization.
 * Accessible by all organization members.
 */
router.get('/', authorize(allMemberRoles), categoryController.list as any);

/**
 * @route GET /api/categories/:id
 * @description Get category details by ID.
 * Accessible by all organization members.
 */
router.get('/:id', authorize(allMemberRoles), categoryController.getDetail as any);

/**
 * @route PUT /api/categories/:id
 * @description Update a category.
 * Accessible by admin roles.
 */
router.put('/:id', authorize(adminRoles), categoryController.update as any);

/**
 * @route DELETE /api/categories/:id
 * @description Delete a category.
 * Accessible by admin roles.
 */
router.delete('/:id', authorize(adminRoles), categoryController.remove as any);

export default router;
