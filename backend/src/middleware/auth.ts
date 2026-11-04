import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser { id: number; email: string; role: string; fullName: string; }
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: AuthUser; } }
}

export function err(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return err(res, 401, 'unauthorized', 'Missing or invalid access token.');
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    return err(res, 401, 'invalid_token', 'Access token is invalid or expired.');
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return err(res, 401, 'unauthorized', 'Authentication required.');
    if (!roles.includes(req.user.role)) return err(res, 403, 'forbidden', 'You do not have permission for this action.');
    next();
  };
}

export function isCitizen(req: Request) { return req.user?.role === 'Citizen'; }
export function ipOf(req: Request) { return req.ip ?? 'unknown'; }
export function publicUser(u: { id: number; fullName: string; email: string; mobile: string; role: string }) {
  return { id: u.id, fullName: u.fullName, email: u.email, mobile: u.mobile, role: u.role };
}

export function errorHandler(errObj: unknown, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(errObj);
  if (res.headersSent) return;
  return err(res, 500, 'internal_error', 'An unexpected error occurred.');
}
