import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Define roles that can access transaction routes
const allMemberRoles = ['ADMIN', 'OWNER', 'MANAGER', 'MEMBER', 'VIEWER'];

// All routes here require the user to be logged in (JWT authentication)
router.use(authenticateJWT);

// Both creating and listing transactions require the user to be a member of the organization.
// The `authorize` middleware will find the `orgId` from the request body (for POST)
// or query string (for GET).
router.post('/', authorize(allMemberRoles), transactionController.create);
router.get('/', authorize(allMemberRoles), transactionController.list);

export default router;