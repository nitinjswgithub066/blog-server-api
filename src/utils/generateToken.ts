import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateJwtToken = (payload: any): string => {
  const secret = process.env.JWT_SECRET || 'fallback_development_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
