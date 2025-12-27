import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AccessTokenPayload extends JWTPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends JWTPayload {
  type: 'refresh';
}

// Generate access token
export const generateAccessToken = (payload: Omit<AccessTokenPayload, 'type'>): string => {
  const tokenPayload = { ...payload, type: 'access' };
  return (jwt.sign as any)(tokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'type'>): string => {
  const tokenPayload = { ...payload, type: 'refresh' };
  return (jwt.sign as any)(tokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN
  });
};

// Generate both tokens
export const generateTokens = (user: { id: string; email: string; role: UserRole }) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken, refreshToken };
};

// Verify token
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

// Verify access token specifically
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = verifyToken(token);
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload as AccessTokenPayload;
};

// Verify refresh token specifically
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = verifyToken(token);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload as RefreshTokenPayload;
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
