import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as orgService from '../services/organization.service';
import * as schemas from '../utils/validation/org.schema';

// --- CORE ORGANIZATION ---

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId!;
        const body = schemas.createOrgSchema.parse(req.body);
        const result = await orgService.createOrganization(userId, body);
        res.status(201).json({ success: true, message: 'Organization created', data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const update = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const body = schemas.updateOrgSchema.parse(req.body);

        const result = await orgService.updateOrganization(id, userId, body);
        res.status(200).json({ success: true, message: 'Organization updated', data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getMyOrgs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId!;
        const result = await orgService.getUserOrganizations(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const result = await orgService.getOrganizationDetails(id, userId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// --- MEMBERS ---

export const addMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const body = schemas.addMemberSchema.parse(req.body);

        const result = await orgService.addMember(id, userId, body.email, body.roleId);
        res.status(201).json({ success: true, message: 'Member invited', data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user?.userId!;
        await orgService.removeMember(id, userId, memberId);
        res.status(200).json({ success: true, message: 'Member removed' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user?.userId!;
        const body = schemas.updateMemberRoleSchema.parse(req.body);

        await orgService.updateMemberRole(id, userId, memberId, body.roleId);
        res.status(200).json({ success: true, message: 'Member role updated' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// --- DIVISIONS ---

export const createDivision = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const body = schemas.createDivisionSchema.parse(req.body);

        const result = await orgService.createDivision(id, userId, body.name);
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getOrgDivisions = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const result = await orgService.getDivisions(id);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getDivisionDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id, divId } = req.params;
        const result = await orgService.getDivisionDetail(id, divId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateDivision = async (req: AuthRequest, res: Response) => {
    try {
        const { id, divId } = req.params;
        const userId = req.user?.userId!;
        const body = schemas.updateDivisionSchema.parse(req.body);

        const result = await orgService.updateDivision(id, userId, divId, body.name);
        res.status(200).json({ success: true, message: 'Division updated', data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const deleteDivision = async (req: AuthRequest, res: Response) => {
    try {
        const { id, divId } = req.params;
        const userId = req.user?.userId!;
        await orgService.deleteDivision(id, userId, divId);
        res.status(200).json({ success: true, message: 'Division deleted' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// --- PROJECTS ---

export const createProject = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const body = schemas.createProjectSchema.parse(req.body);

        const result = await orgService.createProject(id, userId, body);
        res.status(201).json({ success: true, message: 'Project created', data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getOrgProjects = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const result = await orgService.getProjects(id);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getProjectsByDivision = async (req: AuthRequest, res: Response) => {
    try {
        const { id, divId } = req.params;
        const result = await orgService.getProjectsByDivision(id, divId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getProjectDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id, projId } = req.params;
        const result = await orgService.getProjectDetail(id, projId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    try {
        const { id, projId } = req.params;
        const userId = req.user?.userId!;
        await orgService.deleteProject(id, userId, projId);
        res.status(200).json({ success: true, message: 'Project deleted' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};