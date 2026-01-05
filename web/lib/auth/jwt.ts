import jwt, { SignOptions } from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";
const envSecret = process.env.JWT_SECRET;
if (!envSecret && isProd) {
  throw new Error("JWT_SECRET is required in production");
}
const SECRET = envSecret || "dev-only-jwt-secret";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

export interface AccessTokenPayload {
  userId: string;
  role: string;
  firmId: string;
  firmName: string | null;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRES } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: REFRESH_EXPIRES } as SignOptions);
}

export function verifyToken<T = unknown>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}

export function decodeToken<T = unknown>(token: string): T | null {
  try {
    return jwt.decode(token) as T;
  } catch {
    return null;
  }
}
