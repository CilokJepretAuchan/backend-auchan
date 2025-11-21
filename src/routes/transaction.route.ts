import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Semua route di sini butuh Login (Token)
router.use(authenticateJWT);

router.post('/', transactionController.create);
router.get('/', transactionController.list);

export default router;