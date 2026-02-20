/**
 * Authentication routes - Mobile + OTP based
 * Simple, mobile-friendly authentication for farmers
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate, requireRole } from '@/middleware/auth';
import { otpRateLimit } from '@/middleware/rateLimiter';
import { prisma } from '@/config/database';
import { generateTokenPair, verifyRefreshToken, deleteRefreshToken } from '@/utils/jwt';
import { otpService } from '@/services/otp';
import { logger } from '@/utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો'),
  otp: z.string().length(6, 'OTP 6 અંકોનો હોવો જોઈએ'),
  name: z.string().min(2, 'નામ ઓછામાં ઓછા 2 અક્ષરોનું હોવું જોઈએ').optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'રિફ્રેશ ટોકન દાખલ કરો'),
});

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to mobile number
 * @access  Public
 * @rateLimit: 3 requests per hour per phone
 */
router.post(
  '/send-otp',
  otpRateLimit,
  asyncHandler(async (req, res) => {
    const { phone } = sendOtpSchema.parse(req.body);

    // Check if user exists (for new user registration)
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, isActive: true },
    });

    // Generate and store OTP
    const otp = await otpService.generate(phone);
    const isNewUser = !existingUser;

    // Send OTP (in production, integrate with SMS gateway)
    // For development, log OTP to console
    if (process.env.NODE_ENV === 'development') {
      logger.info(`🔓 OTP for ${phone}: ${otp}`);
    }

    // In production, send SMS via your gateway
    // await smsService.sendOtp(phone, otp);

    res.json({
      success: true,
      message: isNewUser
        ? 'નવું નંબર. OTP મોકલવામાં આવ્યો છે.' // New number. OTP sent.
        : 'તમારા નંબર પર OTP મોકલવામાં આવ્યો છે.', // OTP sent to your number.
      data: {
        isNewUser,
        phone,
        expiresIn: 5, // minutes
      },
    });
  })
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and login/register
 * @access  Public
 */
router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { phone, otp, name } = verifyOtpSchema.parse(req.body);

    // Verify OTP
    const isValid = await otpService.verify(phone, otp);

    if (!isValid) {
      throw new ApiError(400, 'અમાન્ય OTP. કૃપા કરીને ફરી પ્રયત્ન કરો.'); // Invalid OTP. Please try again.
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    // Create new user if doesn't exist
    if (!user) {
      if (!name) {
        throw new ApiError(400, 'નામ આવશ્યક છે. કૃપા કરીને તમારું નામ દાખલ કરો.'); // Name is required.
      }

      const bcrypt = require('bcrypt');
      const defaultPassword = await bcrypt.hash('default123', 10);

      user = await prisma.user.create({
        data: {
          phone,
          name,
          password: defaultPassword,
          language: 'GUJARATI',
          isVerified: true,
        },
      });

      logger.info(`New user registered via OTP: ${phone}`);
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          isVerified: true,
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, 'તમારું ખાતું નિષ્ક્રિય છે. સપોર્ટથી સંપર્ક કરો.'); // Account is inactive.
    }

    // Delete used OTP
    await otpService.delete(phone);

    // Generate tokens
    const tokens = await generateTokenPair({
      id: user.id,
      phone: user.phone,
    });

    logger.info(`User logged in via OTP: ${phone}`);

    res.json({
      success: true,
      message: 'સફળતાપૂર્વક લોગિન થયું!', // Login successful!
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          language: user.language,
        },
        ...tokens,
      },
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new ApiError(401, 'અમાન્ય રિફ્રેશ ટોકન'); // Invalid refresh token
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'અમાન્ય રિફ્રેશ ટોકન');
    }

    // Delete old refresh token
    await deleteRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await generateTokenPair({
      id: user.id,
      phone: user.phone,
    });

    res.json({
      success: true,
      data: tokens,
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await deleteRefreshToken(refreshToken);
    }

    logger.info(`User logged out: ${req.user?.phone}`);

    res.json({
      success: true,
      message: 'સફળતાપૂર્વક લોગઆઉટ થયું', // Logout successful
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        language: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'વપરાશકર્તા મળ્યો નથી'); // User not found
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      language: z.enum(['GUJARATI', 'ENGLISH', 'HINDI']).optional(),
    });

    const data = updateSchema.parse(req.body);

    // Check email uniqueness if provided
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: req.user!.id },
        },
      });
      if (existing) {
        throw new ApiError(400, 'આ ઇમેઇલ પહેલેથી નોંધાયેલ છે'); // Email already registered
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        language: true,
        avatar: true,
      },
    });

    res.json({
      success: true,
      message: 'પ્રોફાઇલ અપડેટ થયું', // Profile updated
      data: user,
    });
  })
);

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login with password (separate from user flow)
 * @access  Public
 */
router.post(
  '/admin/login',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      phone: z.string().regex(/^[6-9]\d{9}$/),
      password: z.string().min(1),
    });

    const { phone, password } = schema.parse(req.body);

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(401, 'અમાન્ય પ્રમાણો'); // Invalid credentials
    }

    if (!user.isActive) {
      throw new ApiError(403, 'ખાતું નિષ્ક્રિય છે'); // Account inactive
    }

    // For admin, we still use password (stored separately)
    // Import bcrypt for admin password verification
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new ApiError(401, 'અમાન્ય પ્રમાણો'); // Invalid credentials
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await generateTokenPair({
      id: user.id,
      phone: user.phone,
    });

    logger.info(`Admin logged in: ${phone}`);

    res.json({
      success: true,
      message: 'સફળતાપૂર્વક લોગિન થયું', // Login successful
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        ...tokens,
      },
    });
  })
);

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get(
  '/admin/users',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

/**
 * @route   PATCH /api/auth/admin/users/:id/status
 * @desc    Activate/deactivate user (admin only)
 * @access  Admin
 */
router.patch(
  '/admin/users/:id/status',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      isActive: z.boolean(),
    });

    const { isActive } = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
      },
    });

    logger.info(`User status updated by admin: ${user.phone} -> ${isActive}`);

    res.json({
      success: true,
      message: isActive
        ? 'વપરાશકર્તા સક્રિય થયા' // User activated
        : 'વપરાશકર્તા નિષ્ક્રિય થયા', // User deactivated
      data: user,
    });
  })
);

export default router;
