import { Router } from 'express';
import * as orgController from '../controllers/organization.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateJWT);

// Role constants for clarity
const adminRoles = ['ADMIN', 'TREASURER'];
const allMemberRoles = ['ADMIN', 'TREASURER', 'VIEWER'];

// --- Core Organization ---
// Anyone authenticated can create an organization. They become an admin in the service logic.
router.post('/', orgController.create);
// This route gets organizations for the logged-in user, so no specific orgId is needed for auth.
router.get('/', orgController.getMyOrgs);

// For the routes below, the user must be a member of the organization specified by `:id`.
router.get('/:id', authorize(allMemberRoles), orgController.getDetail);
router.put('/:id', authorize(adminRoles), orgController.update);

// --- Members Management ---
router.post('/:id/members', authorize(adminRoles), orgController.addMember);
router.put('/:id/members/:memberId', authorize(adminRoles), orgController.updateMemberRole);
router.delete('/:id/members/:memberId', authorize(adminRoles), orgController.removeMember);

// --- Divisions Management ---
router.post('/:id/divisions', authorize(adminRoles), orgController.createDivision);
router.get('/:id/divisions', authorize(allMemberRoles), orgController.getOrgDivisions);
router.get('/:id/divisions/:divId', authorize(allMemberRoles), orgController.getDivisionDetail);
router.put('/:id/divisions/:divId', authorize(adminRoles), orgController.updateDivision);
router.delete('/:id/divisions/:divId', authorize(adminRoles), orgController.deleteDivision);

// --- Projects Management ---
router.post('/:id/projects', authorize(adminRoles), orgController.createProject);
router.get('/:id/projects', authorize(allMemberRoles), orgController.getOrgProjects);
router.get('/:id/divisions/:divId/projects', authorize(allMemberRoles), orgController.getProjectsByDivision);
router.get('/:id/projects/:projId', authorize(allMemberRoles), orgController.getProjectDetail);
router.delete('/:id/projects/:projId', authorize(adminRoles), orgController.deleteProject);

export default router;