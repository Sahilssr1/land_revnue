import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, err, ipOf, isCitizen } from '../middleware/auth';
import { audit, paged, parseListQuery } from '../utils/helpers';
import { prisma, STAFF } from '../prisma';

export const landRouter = Router();
landRouter.use(authenticate);

const landSchema = z.object({
  khataNumber: z.string().min(1), khesraNumber: z.string().min(1), plotNumber: z.string().min(1),
  mauza: z.string().min(1), village: z.string().min(1), circle: z.string().min(1), district: z.string().min(1),
  areaInDecimal: z.number().positive().max(100000),
  landClassification: z.string().default('Agricultural'),
  ownerName: z.string().min(1), ownerFatherName: z.string().optional(), ownerMobile: z.string().optional(),
  ownerAddress: z.string().optional(), ownerUserId: z.number().int().optional(),
  latitude: z.number().optional(), longitude: z.number().optional(), remarks: z.string().optional(),
});

function toDto(r: Record<string, unknown>) {
  const owner = r.owner as { fullName: string } | null;
  return { ...r, ownerName: owner?.fullName ?? '', owner: undefined };
}

landRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.ownerUserId = req.user!.id;
  if (q.search) where.OR = [{ khataNumber: { contains: q.search } }, { khesraNumber: { contains: q.search } }, { plotNumber: { contains: q.search } }, { owner: { fullName: { contains: q.search } } }];
  if (q.district) where.district = q.district;
  if (q.circle) where.circle = q.circle;
  if (q.status) where.status = q.status;
  const [total, items] = await Promise.all([
    prisma.landRecord.count({ where }),
    prisma.landRecord.findMany({ where, include: { owner: true }, orderBy: { id: q.sort === 'desc' ? 'desc' : 'asc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items.map(toDto), total, q));
});

/** Public-style search (authenticated): limited fields only, no owner contact details. */
landRouter.get('/search', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const query = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (query.khata) where.khataNumber = { contains: query.khata };
  if (query.khesra) where.khesraNumber = { contains: query.khesra };
  if (query.ownerName) where.owner = { fullName: { contains: query.ownerName } };
  if (q.district) where.district = q.district;
  if (q.circle) where.circle = q.circle;
  if (query.mauza) where.mauza = { contains: query.mauza };
  if (query.village) where.village = { contains: query.village };
  if (q.search) where.OR = [{ khataNumber: { contains: q.search } }, { khesraNumber: { contains: q.search } }, { owner: { fullName: { contains: q.search } } }];
  const [total, items] = await Promise.all([
    prisma.landRecord.count({ where }),
    prisma.landRecord.findMany({ where, include: { owner: { select: { fullName: true } } }, orderBy: { id: 'asc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items.map((r) => ({ id: r.id, khataNumber: r.khataNumber, khesraNumber: r.khesraNumber, plotNumber: r.plotNumber, mauza: r.mauza, village: r.village, circle: r.circle, district: r.district, areaInDecimal: Number(r.areaInDecimal), landClassification: r.landClassification, ownerName: r.owner.fullName, status: r.status })), total, q));
});

landRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const r = await prisma.landRecord.findUnique({ where: { id }, include: { owner: true } });
  if (!r) return err(res, 404, 'not_found', 'Land record not found.');
  if (isCitizen(req) && r.ownerUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only view your own land records.');
  const history = await prisma.landOwnershipHistory.findMany({ where: { landRecordId: id }, orderBy: { transferDate: 'desc' } });
  const jamabandi = await prisma.jamabandiRecord.findMany({ where: { landRecordId: id }, orderBy: { createdAt: 'desc' } });
  res.json({ record: toDto(r as never), history, jamabandi });
});

landRouter.post('/', authorize(...STAFF), async (req, res) => {
  const parsed = landSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const d = parsed.data;
  const owner = await prisma.landOwner.create({ data: { fullName: d.ownerName, fatherName: d.ownerFatherName, mobile: d.ownerMobile, address: d.ownerAddress, userId: d.ownerUserId, createdBy: req.user!.email } });
  const r = await prisma.landRecord.create({
    data: { khataNumber: d.khataNumber, khesraNumber: d.khesraNumber, plotNumber: d.plotNumber, mauza: d.mauza, village: d.village, circle: d.circle, district: d.district, areaInDecimal: d.areaInDecimal, landClassification: d.landClassification, ownerId: owner.id, ownerUserId: d.ownerUserId, latitude: d.latitude, longitude: d.longitude, remarks: d.remarks, createdBy: req.user!.email },
    include: { owner: true },
  });
  await prisma.landOwnershipHistory.create({ data: { landRecordId: r.id, toOwnerId: owner.id, fromOwnerName: '', toOwnerName: owner.fullName, transferType: 'Initial', createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'land.created', 'LandRecord', r.id, `Khata ${r.khataNumber}`, ipOf(req));
  res.status(201).json(toDto(r as never));
});

landRouter.put('/:id', authorize(...STAFF), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = landSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const d = parsed.data;
  const existing = await prisma.landRecord.findUnique({ where: { id }, include: { owner: true } });
  if (!existing) return err(res, 404, 'not_found', 'Land record not found.');
  await prisma.landOwner.update({ where: { id: existing.ownerId }, data: { fullName: d.ownerName, fatherName: d.ownerFatherName, mobile: d.ownerMobile, address: d.ownerAddress } });
  const r = await prisma.landRecord.update({ where: { id }, data: { khataNumber: d.khataNumber, khesraNumber: d.khesraNumber, plotNumber: d.plotNumber, mauza: d.mauza, village: d.village, circle: d.circle, district: d.district, areaInDecimal: d.areaInDecimal, landClassification: d.landClassification, latitude: d.latitude, longitude: d.longitude, remarks: d.remarks, updatedBy: req.user!.email }, include: { owner: true } });
  await audit(req.user!.id, req.user!.email, 'land.updated', 'LandRecord', id, `Khata ${r.khataNumber}`, ipOf(req));
  res.json(toDto(r as never));
});

landRouter.delete('/:id', authorize('SuperAdmin'), async (req, res) => {
  const id = Number(req.params.id);
  const r = await prisma.landRecord.findUnique({ where: { id } });
  if (!r) return err(res, 404, 'not_found', 'Land record not found.');
  await prisma.landRecord.delete({ where: { id } });
  await audit(req.user!.id, req.user!.email, 'land.deleted', 'LandRecord', id, `Khata ${r.khataNumber}`, ipOf(req));
  res.status(204).send();
});

// ---- Jamabandi ----
export const jamabandiRouter = Router();
jamabandiRouter.use(authenticate);

jamabandiRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const landRecordId = req.query.landRecordId ? Number(req.query.landRecordId) : undefined;
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.landRecord = { ownerUserId: req.user!.id };
  if (landRecordId) where.landRecordId = landRecordId;
  if (q.search) where.OR = [{ jamabandiNumber: { contains: q.search } }, { ownerName: { contains: q.search } }];
  const [total, items] = await Promise.all([
    prisma.jamabandiRecord.count({ where }),
    prisma.jamabandiRecord.findMany({ where, include: { landRecord: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});

jamabandiRouter.get('/:id', async (req, res) => {
  const j = await prisma.jamabandiRecord.findUnique({ where: { id: Number(req.params.id) }, include: { landRecord: true } });
  if (!j) return err(res, 404, 'not_found', 'Jamabandi record not found.');
  if (isCitizen(req) && j.landRecord.ownerUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only view your own records.');
  res.json(j);
});

jamabandiRouter.post('/', authorize(...STAFF), async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int(), jamabandiNumber: z.string().min(1), ownerName: z.string().min(1), khataNumber: z.string().default(''), khesraNumber: z.string().default(''), areaInDecimal: z.number().positive(), classification: z.string().default('Agricultural'), remarks: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const d = parsed.data;
  const land = await prisma.landRecord.findUnique({ where: { id: d.landRecordId } });
  if (!land) return err(res, 400, 'validation_error', 'Land record not found.');
  const j = await prisma.$transaction(async (tx) => {
    await tx.jamabandiRecord.updateMany({ where: { landRecordId: d.landRecordId, isCurrent: true }, data: { isCurrent: false } });
    return tx.jamabandiRecord.create({ data: { ...d, isCurrent: true, createdBy: req.user!.email } });
  });
  await audit(req.user!.id, req.user!.email, 'jamabandi.created', 'JamabandiRecord', j.id, j.jamabandiNumber, ipOf(req));
  res.status(201).json(j);
});
