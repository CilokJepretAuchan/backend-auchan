import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/multer.middleware';

const router = Router();

// Define roles for route protection
const allMemberRoles = ['ADMIN', 'OWNER', 'MANAGER', 'MEMBER', 'VIEWER'];
const adminRoles = ['ADMIN', 'OWNER', 'TREASURER', 'AUDITOR']; // Auditors might be added here later

// All routes require a valid JWT
router.use(authenticateJWT);

/**
 * @route POST /api/transactions
 * @description Create a new transaction. Handles multipart/form-data for file uploads.
 * User must be a member of the organization.
 */
router.post('/', authorize(adminRoles), upload.array('attachments', 5) as any, transactionController.create as any);

/**
 * @route GET /api/transactions
 * @description List transactions for an organization with pagination.
 * User must be a member of the organization.
 */
router.get('/', authorize(allMemberRoles), transactionController.list);

/**
 * @route GET /api/transactions/:id/verify
 * @description Verify the integrity of a single transaction against the blockchain.
 * Restricted to admin/auditor roles.
 */
router.get('/:id/verify', authorize(adminRoles), transactionController.verify);

router.get('/:id', authorize(allMemberRoles), transactionController.getDetail);
router.put('/:id', authorize(adminRoles), transactionController.update);
router.delete('/:id', authorize(adminRoles), transactionController.remove);


export default router;