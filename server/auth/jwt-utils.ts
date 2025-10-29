import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto, { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AccessTokenPayload, RefreshTokenPayload } from '@shared/schema';
import logger from '../logger';

const scryptAsync = promisify(scrypt);
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export function generateTokenPair(payload: any): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: payload.userId, sessionId: payload.sessionId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    // Check if it's a legacy scrypt hash (contains a dot separator)
    if (hash.includes('.')) {
      const [hashed, salt] = hash.split('.');
      const hashedBuf = Buffer.from(hashed, 'hex');
      const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
    
    // Otherwise it's a bcrypt hash
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Password comparison error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenExpirationDate(duration: string): Date {
  const now = new Date();
  if (duration === '15m') return new Date(now.getTime() + 15 * 60 * 1000);
  if (duration === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  throw new Error(`Unsupported duration: ${duration}`);
}
