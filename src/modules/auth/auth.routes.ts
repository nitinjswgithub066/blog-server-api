import { Router } from 'express';
import { authController } from './auth.controller';
import { verifyAdminToken } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register-admin', authController.registerAdmin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', verifyAdminToken, authController.getMe);

export default router;
