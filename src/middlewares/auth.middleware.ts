import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  adminId?: string;
  role?: string;
}

export const verifyAdminToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.admin_token;

  if (!token) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_development_secret';
    const decoded = jwt.verify(token, secret) as any;
    
    req.adminId = decoded.adminId;
    req.role = decoded.role;
    
    next();
  } catch (error) {
    return sendError(res, 401, 'Unauthorized');
  }
};
