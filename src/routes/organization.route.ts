import { Router } from 'express';
import * as orgController from '../controllers/organization.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

// --- Core Organization ---
router.post('/', orgController.create);
router.get('/', orgController.getMyOrgs);
router.get('/:id', orgController.getDetail);
router.put('/:id', orgController.update); // Update Orgs

// --- Members Management ---
router.post('/:id/members', orgController.addMember);
router.put('/:id/members/:memberId', orgController.updateMemberRole); // Update Member Role
router.delete('/:id/members/:memberId', orgController.removeMember);

// --- Divisions Management ---
router.post('/:id/divisions', orgController.createDivision);
router.get('/:id/divisions', orgController.getOrgDivisions); // Get All Divisions
router.get('/:id/divisions/:divId', orgController.getDivisionDetail); // Get Detail Div
router.put('/:id/divisions/:divId', orgController.updateDivision); // Update Div
router.delete('/:id/divisions/:divId', orgController.deleteDivision); // Delete Div

// --- Projects Management ---
router.post('/:id/projects', orgController.createProject);
router.get('/:id/projects', orgController.getOrgProjects); // Get All Projects
router.get('/:id/divisions/:divId/projects', orgController.getProjectsByDivision); // Get Project by Div
router.get('/:id/projects/:projId', orgController.getProjectDetail); // Get Detail Project
router.delete('/:id/projects/:projId', orgController.deleteProject); // Delete Project

export default router;