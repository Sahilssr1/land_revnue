import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { err, publicUser } from '../middleware/auth';
import { audit, newRefreshToken, sha256 } from '../utils/helpers';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  fullName: z.string().min(1).max(150),
  mobile: z.string().min(10).max(15),
  email: z.string().email(),
  password: z.string().min(8),
  address: z.string().max(500).optional(),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const otpSchema = z.object({ email: z.string().email(), otp: z.string().regex(/^\d{6}$/) });

function signAccess(u: { id: number; email: string; role: string; fullName: string }) {
  return jwt.sign({ id: u.id, email: u.email, role: u.role, fullName: u.fullName }, config.jwtSecret, { expiresIn: `${config.jwtExpiresMinutes}m` });
}
async function issuePair(user: { id: number; email: string; role: string; fullName: string }) {
  const accessToken = signAccess(user);
  const refreshToken = newRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + config.jwtRefreshExpiresDays * 86400000) },
  });
  return { accessToken, refreshToken, user: publicUser(user as never) };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return err(res, 409, 'email_exists', 'An account with this email already exists.');
  const user = await prisma.user.create({
    data: { ...data, role: 'Citizen', passwordHash: await bcrypt.hash(data.password, 10), createdBy: data.email },
  });
  await audit(user.id, user.email, 'user.registered', 'User', user.id, 'Citizen registered', req.ip ?? 'unknown');
  return res.status(201).json({ user: publicUser(user), message: 'Registered. Verify with the mock OTP endpoint (any 6-digit code in demo).' });
});

/** MOCK OTP verification for demo only — any 6-digit code verifies. Never use in production. */
authRouter.post('/verify-otp', async (req, res) => {
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', 'A 6-digit OTP is required.');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return err(res, 404, 'not_found', 'User not found.');
  const updated = await prisma.user.update({ where: { id: user.id }, data: { otpVerified: true } });
  return res.json({ message: 'Mobile verified (demo mock OTP).', user: publicUser(updated) });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', 'Email and password are required.');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
    return err(res, 401, 'invalid_credentials', 'Invalid email or password.');
  return res.json(await issuePair(user));
});

authRouter.post('/refresh', async (req, res) => {
  const token = String(req.body?.refreshToken ?? '');
  if (!token) return err(res, 401, 'invalid_token', 'Refresh token is required.');
  const stored = await prisma.refreshToken.findFirst({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive)
    return err(res, 401, 'invalid_token', 'Refresh token is invalid or expired.');
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const pair = await issuePair(stored.user);
  // Link rotation: the old token records which token replaced it.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { replacedByTokenHash: sha256(pair.refreshToken) } });
  return res.json(pair);
});

authRouter.post('/logout', authenticate, async (req, res) => {
  const token = String(req.body?.refreshToken ?? '');
  if (token) {
    await prisma.refreshToken.updateMany({ where: { tokenHash: sha256(token), userId: req.user!.id }, data: { revokedAt: new Date() } });
  }
  return res.json({ message: 'Logged out.' });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return err(res, 404, 'not_found', 'User not found.');
  return res.json(publicUser(user));
});

authRouter.post('/forgot-password', async (req, res) => {
  return res.json({ message: 'If this email is registered, a reset link would be sent. Demo: password reset is not wired to a mail provider.' });
});
