import { prisma } from '../../config/prisma';
import { hashData, compareData } from '../../utils/hash';
import { generateAdminCode } from '../../utils/generateAdminCode';
import { generateResetToken, generateJwtToken } from '../../utils/generateToken';
import { emailService } from '../../emails/email.service';
import { getAdminAccountCreatedTemplate } from '../../emails/templates/adminAccountCreated.template';
import { getForgotPasswordTemplate } from '../../emails/templates/forgotPassword.template';
import { getPasswordChangedTemplate } from '../../emails/templates/passwordChanged.template';
import { EmailType } from '@prisma/client';

export const authService = {
  async registerAdmin(data: any) {
    const { name, username, email, password } = data;

    // Check if an admin already exists
    const adminCount = await prisma.adminUser.count();
    if (adminCount > 0) {
      throw new Error('Admin account already exists. Please login.');
    }

    const existingEmail = await prisma.adminUser.findUnique({ where: { email } });
    if (existingEmail) throw new Error('Email already exists');

    const existingUsername = await prisma.adminUser.findUnique({ where: { username } });
    if (existingUsername) throw new Error('Username already exists');

    const passwordHash = await hashData(password);
    const plainAdminCode = generateAdminCode();
    const adminRegistrationCodeHash = await hashData(plainAdminCode);

    const admin = await prisma.adminUser.create({
      data: {
        name,
        username,
        email: email.toLowerCase(),
        password: passwordHash,
        adminRegistrationCodeHash,
        role: 'ADMIN',
      },
    });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login`;

    // Queue email
    await emailService.queueEmail({
      to: admin.email,
      subject: 'Your Admin Account Has Been Created',
      html: getAdminAccountCreatedTemplate({
        name: admin.name,
        email: admin.email,
        username: admin.username || '',
        adminRegistrationCode: plainAdminCode,
        loginUrl,
      }),
      type: 'ADMIN_ACCOUNT_CREATED' as any,
    });

    return { admin, plainAdminCode };
  },

  async login(data: any) {
    const { email, password } = data;

    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await compareData(password, admin.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateJwtToken({ adminId: admin.id, role: admin.role });

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return { admin, token };
  },

  async getAdminById(id: string) {
    return prisma.adminUser.findUnique({ where: { id } });
  },

  async forgotPassword(email: string) {
    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin) {
      return; // Safe generic response flow
    }

    const resetToken = generateResetToken();
    const resetTokenHash = await hashData(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(admin.email)}`;

    await emailService.queueEmail({
      to: admin.email,
      subject: 'Reset Your Admin Password',
      html: getForgotPasswordTemplate({ resetUrl }),
      type: 'FORGOT_PASSWORD' as any,
    });
  },

  async resetPassword(data: any) {
    const { token, email, adminRegistrationCode, newPassword } = data;

    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !admin.passwordResetTokenHash || !admin.passwordResetExpiresAt) {
      throw new Error('Invalid or expired reset token');
    }

    if (new Date() > admin.passwordResetExpiresAt) {
      throw new Error('Invalid or expired reset token');
    }

    const isTokenValid = await compareData(token, admin.passwordResetTokenHash);
    if (!isTokenValid) {
      throw new Error('Invalid or expired reset token');
    }

    if (!admin.adminRegistrationCodeHash) {
      throw new Error('Registration code not set');
    }

    const isCodeValid = await compareData(adminRegistrationCode, admin.adminRegistrationCodeHash);
    if (!isCodeValid) {
      throw new Error('Invalid Admin Registration Code');
    }

    const newPasswordHash = await hashData(newPassword);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        password: newPasswordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    await emailService.queueEmail({
      to: admin.email,
      subject: 'Your Admin Password Was Changed',
      html: getPasswordChangedTemplate({
        name: admin.name,
        time: new Date().toLocaleString(),
      }),
      type: 'PASSWORD_CHANGED' as any,
    });
  },
};
