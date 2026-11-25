-- Add password reset token tracking timestamps to AdminUser.
ALTER TABLE "AdminUser"
ADD COLUMN "passwordResetTokenUsedAt" TIMESTAMP(3),
ADD COLUMN "passwordResetTokenViewedAt" TIMESTAMP(3);
