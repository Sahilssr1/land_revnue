import bcrypt from 'bcryptjs';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, err, ipOf } from '../middleware/auth';
import { audit, paged, parseListQuery } from '../utils/helpers';
import { toExcel, toPdf } from '../utils/reports';
import { prisma, STAFF } from '../prisma';

const EMPLOYEE_ROLES = ['SuperAdmin', 'DistrictOfficer', 'CircleOfficer', 'RevenueEmployee', 'Amin'];

// ---------------- Admin: users / roles / masters ----------------
export const adminRouter = Router();
// Masters GET routes are authenticated-only (citizen portal dropdowns);
// every other admin route below requires a staff role.
adminRouter.use(authenticate);

adminRouter.get('/users', authorize(...STAFF), async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (q.search) where.OR = [{ fullName: { contains: q.search } }, { email: { contains: q.search } }, { mobile: { contains: q.search } }];
  if (q.district) where.district = q.district;
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { id: 'asc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, select: { id: true, fullName: true, mobile: true, email: true, address: true, role: true, isActive: true, otpVerified: true, district: true, circle: true } }),
  ]);
  res.json(paged(items, total, q));
});

adminRouter.post('/users', authorize('SuperAdmin', 'DistrictOfficer'), async (req, res) => {
  const schema = z.object({ fullName: z.string().min(1).max(150), mobile: z.string().min(10).max(15), email: z.string().email(), password: z.string().min(8), role: z.string(), district: z.string().optional(), circle: z.string().optional(), address: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const d = parsed.data;
  if (!EMPLOYEE_ROLES.includes(d.role)) return err(res, 400, 'validation_error', `Role must be one of: ${EMPLOYEE_ROLES.join(', ')}.`);
  if (await prisma.user.findUnique({ where: { email: d.email } })) return err(res, 409, 'email_exists', 'An account with this email already exists.');
  const u = await prisma.user.create({ data: { fullName: d.fullName, mobile: d.mobile, email: d.email, address: d.address, role: d.role, district: d.district, circle: d.circle, passwordHash: await bcrypt.hash(d.password, 10), otpVerified: true, createdBy: req.user!.email } });
  const roleEntity = await prisma.role.findUnique({ where: { name: d.role } });
  if (roleEntity) await prisma.userRole.create({ data: { userId: u.id, roleId: roleEntity.id, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'user.created', 'User', u.id, `${d.role} ${d.email}`, ipOf(req));
  res.status(201).json({ id: u.id, fullName: u.fullName, mobile: u.mobile, email: u.email, address: u.address, role: u.role, isActive: u.isActive, otpVerified: u.otpVerified, district: u.district, circle: u.circle });
});

async function setActive(req: Request, res: Response, active: boolean) {
  const id = Number(req.params.id);
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return err(res, 404, 'not_found', 'User not found.');
  const updated = await prisma.user.update({ where: { id }, data: { isActive: active, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, active ? 'user.activated' : 'user.deactivated', 'User', id, u.email, ipOf(req));
  res.json({ id: updated.id, fullName: updated.fullName, email: updated.email, role: updated.role, isActive: updated.isActive });
}
adminRouter.post('/users/:id/activate', authorize('SuperAdmin', 'DistrictOfficer'), (req, res) => setActive(req, res, true));
adminRouter.post('/users/:id/deactivate', authorize('SuperAdmin', 'DistrictOfficer'), (req, res) => setActive(req, res, false));

adminRouter.get('/roles', authorize(...STAFF), async (_req, res) => res.json(await prisma.role.findMany({ orderBy: { name: 'asc' } })));
adminRouter.get('/permissions', authorize(...STAFF), async (_req, res) => res.json(await prisma.permission.findMany({ orderBy: { name: 'asc' } })));

// Masters — reads are public (citizen portal dropdowns); writes are SuperAdmin only.
adminRouter.get('/masters/districts', async (_req, res) => res.json(await prisma.district.findMany({ include: { circles: true }, orderBy: { name: 'asc' } })));
adminRouter.post('/masters/districts', authorize('SuperAdmin'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1), code: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', 'Name is required.');
  const d = await prisma.district.create({ data: { ...parsed.data, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'master.district.created', 'District', d.id, d.name, ipOf(req));
  res.status(201).json(d);
});
adminRouter.get('/masters/circles', async (req, res) => {
  const districtId = req.query.districtId ? Number(req.query.districtId) : undefined;
  res.json(await prisma.circle.findMany({ where: districtId ? { districtId } : undefined, orderBy: { name: 'asc' } }));
});
adminRouter.post('/masters/circles', authorize('SuperAdmin'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1), parentId: z.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', 'Name and parentId (districtId) are required.');
  const c = await prisma.circle.create({ data: { name: parsed.data.name, districtId: parsed.data.parentId, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'master.circle.created', 'Circle', c.id, c.name, ipOf(req));
  res.status(201).json(c);
});
adminRouter.get('/masters/mauzas', async (req, res) => {
  const circleId = req.query.circleId ? Number(req.query.circleId) : undefined;
  res.json(await prisma.mauza.findMany({ where: circleId ? { circleId } : undefined, orderBy: { name: 'asc' } }));
});
adminRouter.post('/masters/mauzas', authorize('SuperAdmin'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1), parentId: z.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', 'Name and parentId (circleId) are required.');
  const m = await prisma.mauza.create({ data: { name: parsed.data.name, circleId: parsed.data.parentId, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'master.mauza.created', 'Mauza', m.id, m.name, ipOf(req));
  res.status(201).json(m);
});
adminRouter.get('/masters/villages', async (req, res) => {
  const mauzaId = req.query.mauzaId ? Number(req.query.mauzaId) : undefined;
  res.json(await prisma.village.findMany({ where: mauzaId ? { mauzaId } : undefined, orderBy: { name: 'asc' } }));
});
adminRouter.post('/masters/villages', authorize('SuperAdmin'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1), parentId: z.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', 'Name and parentId (mauzaId) are required.');
  const v = await prisma.village.create({ data: { name: parsed.data.name, mauzaId: parsed.data.parentId, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'master.village.created', 'Village', v.id, v.name, ipOf(req));
  res.status(201).json(v);
});

// ---------------- Reports (?format=pdf|xlsx, default json) ----------------
export const reportRouter = Router();
reportRouter.use(authenticate, authorize(...STAFF));

async function render(req: Request, res: Response, title: string, headers: string[], rows: string[][], filename: string) {
  const format = req.query.format === 'xlsx' ? 'xlsx' : req.query.format === 'pdf' ? 'pdf' : 'json';
  if (format === 'xlsx') {
    const buf = await toExcel(title, headers, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(buf);
  }
  if (format === 'pdf') {
    const buf = await toPdf(title, headers, rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    return res.send(buf);
  }
  return res.json({ title, headers, rows });
}

reportRouter.get('/district', async (req, res) => {
  const rows = await prisma.landRecord.groupBy({ by: ['district'], _count: true, _sum: { areaInDecimal: true } });
  await render(req, res, 'District-wise Land Records', ['District', 'Records', 'Total Area (decimal)'], rows.map((r) => [r.district, String(r._count), Number(r._sum.areaInDecimal ?? 0).toFixed(2)]), 'district-report');
});
reportRouter.get('/revenue', async (req, res) => {
  const district = typeof req.query.district === 'string' ? req.query.district : undefined;
  const rows = await prisma.revenuePayment.groupBy({ by: ['status'], _count: true, _sum: { amount: true }, where: district ? { landRecord: { district } } : undefined });
  await render(req, res, 'Revenue Collection Report', ['Status', 'Count', 'Amount (INR)'], rows.map((r) => [r.status, String(r._count), Number(r._sum.amount ?? 0).toFixed(2)]), 'revenue-report');
});
reportRouter.get('/mutation', async (req, res) => {
  const rows = await prisma.mutationApplication.groupBy({ by: ['status'], _count: true });
  await render(req, res, 'Mutation Pending/Status Report', ['Status', 'Count'], rows.map((r) => [r.status, String(r._count)]), 'mutation-report');
});
reportRouter.get('/ownership', async (req, res) => {
  const district = typeof req.query.district === 'string' ? req.query.district : undefined;
  const rows = await prisma.landRecord.findMany({ where: district ? { district } : undefined, include: { owner: true }, orderBy: { district: 'asc' }, take: 500 });
  await render(req, res, 'Land Ownership Report', ['District', 'Circle', 'Khata', 'Khesra', 'Owner', 'Area'], rows.map((r) => [r.district, r.circle, r.khataNumber, r.khesraNumber, r.owner.fullName, Number(r.areaInDecimal).toFixed(2)]), 'ownership-report');
});
reportRouter.get('/survey', async (req, res) => {
  const rows = await prisma.surveyRequest.groupBy({ by: ['status'], _count: true });
  await render(req, res, 'Survey Report', ['Status', 'Count'], rows.map((r) => [r.status, String(r._count)]), 'survey-report');
});
reportRouter.get('/employee', async (req, res) => {
  const rows = await prisma.auditLog.groupBy({ by: ['userEmail'], _count: true, where: { userId: { not: null } } });
  await render(req, res, 'Employee Performance Report (audit actions)', ['Employee', 'Actions'], rows.map((r) => [r.userEmail ?? '-', String(r._count)]), 'employee-report');
});

// ---------------- Notifications + Audit logs ----------------
export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = { userId: req.user!.id };
  if (req.query.unreadOnly === 'true') where.isRead = false;
  const [total, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});
notificationRouter.post('/:id/read', async (req, res) => {
  const n = await prisma.notification.findFirst({ where: { id: Number(req.params.id), userId: req.user!.id } });
  if (!n) return err(res, 404, 'not_found', 'Notification not found.');
  res.json(await prisma.notification.update({ where: { id: n.id }, data: { isRead: true } }));
});

export const auditLogRouter = Router();
auditLogRouter.use(authenticate, authorize(...STAFF));
auditLogRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (typeof req.query.action === 'string') where.action = req.query.action;
  if (typeof req.query.entity === 'string') where.entity = req.query.entity;
  if (q.search) where.OR = [{ details: { contains: q.search } }, { userEmail: { contains: q.search } }];
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});
