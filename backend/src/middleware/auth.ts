/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from './errorHandler';
import { prisma } from '../config/database';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
        email?: string;
        role?: string;
      };
    }
  }
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'પ્રમાણીકરણ ટોકન આવશ્યક છે'); // Authentication token required
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      phone: string;
      email?: string;
    };

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, phone: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'અમાન્ય ટોકન'); // Invalid token
    }

    // Attach user to request
    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'અમાન્ય ટોકન')); // Invalid token
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'ટોકનની સમયસીમા સમાપ્ત')); // Token expired
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      phone: string;
      email?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, phone: true, email: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        phone: user.phone,
        email: user.email || undefined,
      };
    }

    next();
  } catch {
    // Ignore errors and continue without user
    next();
  }
};

/**
 * Require specific role
 * Use after authenticate middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'પ્રમાણીકરણ આવશ્યક છે')); // Authentication required
    }

    // Fetch user with role
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'અમાન્ય વપરાશકર્તા')); // Invalid user
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new ApiError(403, 'પરવાનગી નથી')); // Forbidden
    }

    // Attach role to request
    req.user.role = user.role;
    next();
  };
};
