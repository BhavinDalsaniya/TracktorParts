/**
 * JWT utility functions
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';

export interface TokenPayload {
  id: string;
  phone: string;
  email?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as any);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as any);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = async (
  payload: TokenPayload
): Promise<TokenPair> => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate expiration date for refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // Save refresh token to database
  await prisma.session.create({
    data: {
      userId: payload.id,
      refreshToken,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (
  token: string
): Promise<TokenPayload | null> => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

    // Check if refresh token exists in database
    const session = await prisma.session.findUnique({
      where: { refreshToken: token },
    });

    if (!session || session.expiresAt < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

/**
 * Delete refresh token (logout)
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
  await prisma.session.deleteMany({ where: { refreshToken: token } });
};

/**
 * Delete all refresh tokens for a user (logout from all devices)
 */
export const deleteAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.session.deleteMany({ where: { userId } });
};
