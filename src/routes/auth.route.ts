import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authenticateJWT, authController.getMe);
router.put('/profile', authenticateJWT, authController.updateProfile);

export default router;