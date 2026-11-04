import crypto from 'crypto';
import path from 'path';
import { prisma } from '../prisma';

export interface ListQuery { search?: string; district?: string; circle?: string; status?: string; page: number; pageSize: number; sort?: string; }

export function parseListQuery(q: Record<string, unknown>): ListQuery {
  const page = Math.max(1, Number(q.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20) || 20));
  return {
    search: typeof q.search === 'string' ? q.search : undefined,
    district: typeof q.district === 'string' ? q.district : undefined,
    circle: typeof q.circle === 'string' ? q.circle : undefined,
    status: typeof q.status === 'string' ? q.status : undefined,
    page, pageSize,
    sort: typeof q.sort === 'string' ? q.sort : undefined,
  };
}

export function paged<T>(items: T[], total: number, q: ListQuery) {
  return { items, total, page: q.page, pageSize: q.pageSize };
}

export function sha256(s: string) { return crypto.createHash('sha256').update(s).digest('hex'); }
export function newRefreshToken() { return crypto.randomBytes(64).toString('base64'); }
export function certRef() { return `LRMS-${new Date().getUTCFullYear()}-${crypto.randomInt(100000, 999999)}`; }
export function receiptRef() { return `LRMS-RCT-${new Date().getUTCFullYear()}-${crypto.randomInt(100000, 999999)}`; }
export function trackingRef() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return `LRMS-MUT-${ymd}-${crypto.randomInt(1000, 9999)}`;
}

export async function audit(userId: number | undefined, userEmail: string | undefined, action: string, entity: string, entityId: number | undefined, details: string | undefined, ip: string) {
  await prisma.auditLog.create({ data: { userId, userEmail, action, entity, entityId, details, ipAddress: ip } });
}

export async function notify(userId: number, title: string, message: string, type: string, entity?: string, id?: number) {
  await prisma.notification.create({ data: { userId, title, message, type, relatedEntity: entity, relatedId: id } });
}

export async function notifyStaff(title: string, message: string, type: string, entity?: string, id?: number) {
  const staff = await prisma.user.findMany({ where: { role: { not: 'Citizen' }, isActive: true }, select: { id: true } });
  if (staff.length) {
    await prisma.notification.createMany({ data: staff.map((s) => ({ userId: s.id, title, message, type, relatedEntity: entity, relatedId: id })) });
  }
}

export interface UploadedFile { originalname: string; size: number; mimetype: string; buffer: Buffer; }
export function validateUpload(file: UploadedFile | undefined, allowed: string[], maxBytes: number): string | null {
  if (!file) return 'No file uploaded.';
  if (file.size > maxBytes) return `File exceeds ${Math.round(maxBytes / 1024 / 1024)} MB limit.`;
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return `File type ${ext} not allowed. Allowed: ${allowed.join(', ')}.`;
  return null;
}

/**
 * Razorpay TEST-MODE webhook verification. A payment is NEVER marked Paid
 * unless this HMAC-SHA256 signature check passes against RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyRazorpaySignature(payload: Buffer, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
