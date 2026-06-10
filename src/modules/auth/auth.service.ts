import { AdminUser, EmailType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { hashData, compareData } from '../../utils/hash';
import { generateAdminCode } from '../../utils/generateAdminCode';
import { generateResetToken, generateJwtToken } from '../../utils/generateToken';
import { emailService } from '../../emails/email.service';
import { getAdminAccountCreatedTemplate } from '../../emails/templates/adminAccountCreated.template';
import { getForgotPasswordTemplate } from '../../emails/templates/forgotPassword.template';
import { getPasswordChangedTemplate } from '../../emails/templates/passwordChanged.template';

const RESET_EXPIRY_MINUTES = 15;

const adminFrontendUrl = () => process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173';

const findAdminByResetToken = async (token: string): Promise<AdminUser | null> => {
  const admins = await prisma.adminUser.findMany({
    where: { passwordResetTokenHash: { not: null } },
  });

  for (const admin of admins) {
    if (!admin.passwordResetTokenHash) continue;
    if (await compareData(token, admin.passwordResetTokenHash)) return admin;
  }

  return null;
};

const isResetTokenUsable = (admin: AdminUser) => {
  return (
    !!admin.passwordResetTokenHash &&
    !!admin.passwordResetExpiresAt &&
    !admin.passwordResetTokenUsedAt &&
    admin.passwordResetExpiresAt > new Date()
  );
};

export const authService = {
  async registerAdmin(data: any) {
    const { name, username, email, password } = data;

    const adminCount = await prisma.adminUser.count();
    if (adminCount > 0) {
      throw new Error('Admin account already exists. Please login.');
    }

    const normalizedEmail = email.toLowerCase();
    const existingEmail = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) throw new Error('Email already exists');

    const existingUsername = await prisma.adminUser.findUnique({ where: { username } });
    if (existingUsername) throw new Error('Username already exists');

    const passwordHash = await hashData(password);
    const adminRegistrationCode = generateAdminCode();
    const adminRegistrationCodeHash = await hashData(adminRegistrationCode);

    const admin = await prisma.adminUser.create({
      data: {
        name,
        username,
        email: normalizedEmail,
        password: passwordHash,
        adminRegistrationCodeHash,
        role: 'ADMIN',
      },
    });

    await emailService.queueEmail({
      to: admin.email,
      toName: admin.name,
      subject: 'Your Admin Account Has Been Created',
      html: getAdminAccountCreatedTemplate({
        name: admin.name,
        email: admin.email,
        username: admin.username || '',
        adminRegistrationCode,
        loginUrl: `${adminFrontendUrl()}/auth/login`,
      }),
      type: EmailType.ADMIN_ACCOUNT_CREATED,
    });

    return { admin };
  },

  async login(data: any) {
    const { email, password } = data;

    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin) throw new Error('Invalid email or password');

    const isMatch = await compareData(password, admin.password);
    if (!isMatch) throw new Error('Invalid email or password');

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
    if (!admin) return;

    const resetToken = generateResetToken();
    const resetTokenHash = await hashData(resetToken);
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpiresAt: expiresAt,
        passwordResetTokenUsedAt: null,
        passwordResetTokenViewedAt: null,
      },
    });

    const resetUrl = `${adminFrontendUrl()}/auth/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('\n======================================================');
      console.log('DEVELOPMENT MODE: PASSWORD RESET LINK GENERATED');
      console.log('Open this link in your browser to reset your password:');
      console.log(resetUrl);
      console.log('======================================================\n');
    }

    await emailService.queueEmail({
      to: admin.email,
      toName: admin.name,
      subject: 'Reset Your Admin Password',
      html: getForgotPasswordTemplate({ resetUrl, expiresInMinutes: RESET_EXPIRY_MINUTES }),
      type: EmailType.FORGOT_PASSWORD,
    });
  },

  async verifyResetToken(token: string) {
    const admin = await findAdminByResetToken(token);
    if (!admin || !isResetTokenUsable(admin)) return false;

    if (!admin.passwordResetTokenViewedAt) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordResetTokenViewedAt: new Date() },
      });
    }

    return true;
  },

  async resetPassword(data: any) {
    const { token, email, adminRegistrationCode, newPassword } = data;

    const admin = await findAdminByResetToken(token);
    if (!admin || !isResetTokenUsable(admin)) {
      throw new Error('Reset link is invalid or expired.');
    }

    if (admin.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Reset link is invalid or expired.');
    }

    if (!admin.adminRegistrationCodeHash) {
      throw new Error('Admin Registration Code is not configured for this account.');
    }

    const isAdminCodeValid = await compareData(adminRegistrationCode, admin.adminRegistrationCodeHash);
    if (!isAdminCodeValid) {
      throw new Error('Invalid Admin Registration Code.');
    }

    const changedAt = new Date();
    const newPasswordHash = await hashData(newPassword);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        password: newPasswordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetTokenUsedAt: changedAt,
      },
    });

    await emailService.queueEmail({
      to: admin.email,
      toName: admin.name,
      subject: 'Your Admin Password Was Changed',
      html: getPasswordChangedTemplate({
        name: admin.name,
        time: changedAt.toLocaleString(),
      }),
      type: EmailType.PASSWORD_CHANGED,
    });
  },
};
