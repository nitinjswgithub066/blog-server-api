import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { validateEmail, validatePassword, validateUsername } from './auth.validation';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const authController = {
  async registerAdmin(req: Request, res: Response) {
    try {
      const { name, username, email, password, confirmPassword } = req.body;

      if (!name || !username || !email || !password || !confirmPassword) {
        return sendError(res, 400, 'All fields are required');
      }

      if (!validateEmail(email)) return sendError(res, 400, 'Invalid email format');
      if (!validateUsername(username)) return sendError(res, 400, 'Username must be 3-30 characters (letters, numbers, underscore)');
      if (!validatePassword(password)) return sendError(res, 400, 'Password must be 6-12 characters and can contain only letters, numbers, @, _, #, and !.');
      if (password !== confirmPassword) return sendError(res, 400, 'Passwords do not match');

      const { admin } = await authService.registerAdmin({ name, username, email, password });

      const safeAdmin = {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      };

      return sendSuccess(res, 201, 'Admin account created successfully', { admin: safeAdmin });
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) return sendError(res, 400, 'Email and password are required');

      const { admin, token } = await authService.login({ email, password });

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const safeAdmin = {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      };

      return sendSuccess(res, 200, 'Login successful', { admin: safeAdmin });
    } catch (error: any) {
      return sendError(res, 401, error.message);
    }
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie('admin_token');
    return sendSuccess(res, 200, 'Logged out successfully');
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      const adminId = req.adminId;
      if (!adminId) return sendError(res, 401, 'Unauthorized');

      const admin = await authService.getAdminById(adminId);
      if (!admin) return sendError(res, 404, 'Admin not found');

      const safeAdmin = {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      };

      return sendSuccess(res, 200, 'Profile retrieved successfully', { admin: safeAdmin });
    } catch {
      return sendError(res, 500, 'Internal server error');
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return sendError(res, 400, 'Email is required');

      await authService.forgotPassword(email);

      return sendSuccess(res, 200, 'If this email exists, a reset link has been sent.');
    } catch {
      return sendError(res, 500, 'Internal server error');
    }
  },

  async verifyResetToken(req: Request, res: Response) {
    try {
      const token = req.query.token as string | undefined;
      if (!token) return sendError(res, 400, 'Reset token is required');

      const isValid = await authService.verifyResetToken(token);
      if (!isValid) {
        return sendError(res, 404, 'Reset link is invalid or expired.');
      }

      return sendSuccess(res, 200, 'Reset link is valid.');
    } catch {
      return sendError(res, 404, 'Reset link is invalid or expired.');
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, email, adminRegistrationCode, newPassword, confirmPassword } = req.body;

      if (!token || !email || !adminRegistrationCode || !newPassword || !confirmPassword) {
        return sendError(res, 400, 'All fields are required');
      }

      if (!validateEmail(email)) return sendError(res, 400, 'Invalid email format');
      if (!validatePassword(newPassword)) {
        return sendError(res, 400, 'Password must be 6-12 characters and can contain only letters, numbers, @, _, #, and !.');
      }
      if (newPassword !== confirmPassword) return sendError(res, 400, 'Passwords do not match');

      await authService.resetPassword({ token, email, adminRegistrationCode, newPassword });

      return sendSuccess(res, 200, 'Password changed successfully. Please login.');
    } catch (error: any) {
      return sendError(res, 400, error.message || 'Password reset failed');
    }
  },
};
