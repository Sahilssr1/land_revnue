import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, authorize, err, ipOf, isCitizen } from '../middleware/auth';
import { audit, notify, notifyStaff, paged, parseListQuery, trackingRef, validateUpload } from '../utils/helpers';
import { prisma, APPROVERS, STAFF, STATUS } from '../prisma';

export const mutationRouter = Router();
mutationRouter.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxUploadBytes } });
const actionSchema = z.object({ remarks: z.string().optional(), reason: z.string().optional(), assignToUserId: z.number().int().optional(), documentRequestNote: z.string().optional() });

mutationRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const landRecordId = req.query.landRecordId ? Number(req.query.landRecordId) : undefined;
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.applicantUserId = req.user!.id;
  if (landRecordId) where.landRecordId = landRecordId;
  if (q.search) where.OR = [{ trackingNumber: { contains: q.search } }, { buyerName: { contains: q.search } }, { sellerName: { contains: q.search } }];
  if (q.status) where.status = q.status;
  if (q.district) where.landRecord = { district: q.district };
  if (q.circle) where.landRecord = { ...(where.landRecord as object ?? {}), circle: q.circle };
  const [total, items] = await Promise.all([
    prisma.mutationApplication.count({ where }),
    prisma.mutationApplication.findMany({ where, include: { landRecord: true, documents: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});

mutationRouter.get('/:id', async (req, res) => {
  const m = await prisma.mutationApplication.findUnique({ where: { id: Number(req.params.id) }, include: { landRecord: true, documents: true } });
  if (!m) return err(res, 404, 'not_found', 'Mutation not found.');
  if (isCitizen(req) && m.applicantUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only view your own applications.');
  res.json(m);
});

mutationRouter.post('/', async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int(), sellerName: z.string().min(1), buyerName: z.string().min(1), sellerMobile: z.string().optional(), buyerMobile: z.string().optional(), mutationType: z.string().default('Sale') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const d = parsed.data;
  const land = await prisma.landRecord.findUnique({ where: { id: d.landRecordId } });
  if (!land) return err(res, 400, 'validation_error', 'Land record not found.');
  if (isCitizen(req) && land.ownerUserId !== null && land.ownerUserId !== req.user!.id)
    return err(res, 403, 'forbidden', 'You can only apply for your own land.');
  const m = await prisma.mutationApplication.create({ data: { ...d, trackingNumber: trackingRef(), applicantUserId: req.user!.id, status: STATUS.Pending, createdBy: req.user!.email } });
  await notifyStaff('New mutation application', `Tracking ${m.trackingNumber} submitted.`, 'Mutation', 'Mutation', m.id);
  res.status(201).json(m);
});

mutationRouter.post('/:id/documents', upload.single('file'), async (req, res) => {
  const id = Number(req.params.id);
  const m = await prisma.mutationApplication.findUnique({ where: { id } });
  if (!m) return err(res, 404, 'not_found', 'Mutation not found.');
  if (isCitizen(req) && m.applicantUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only upload to your own applications.');
  const file = req.file as unknown as { originalname: string; size: number; mimetype: string; buffer: Buffer } | undefined;
  const problem = validateUpload(file, config.allowedExtensions, config.maxUploadBytes);
  if (problem) return err(res, 400, 'validation_error', problem);
  const dir = path.join(process.cwd(), config.uploadDir);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file!.originalname).toLowerCase()}`;
  fs.writeFileSync(path.join(dir, name), file!.buffer);
  const doc = await prisma.mutationDocument.create({ data: { mutationApplicationId: id, fileName: file!.originalname, filePath: `/uploads/${name}`, documentType: String(req.body?.documentType ?? 'General'), contentType: file!.mimetype, fileSize: file!.size, createdBy: req.user!.email } });
  res.status(201).json(doc);
});

mutationRouter.post('/:id/assign', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const m = await prisma.mutationApplication.findUnique({ where: { id } });
  if (!m) return err(res, 404, 'not_found', 'Mutation not found.');
  if (!parsed.success || !parsed.data.assignToUserId) return err(res, 400, 'validation_error', 'AssignToUserId is required.');
  const updated = await prisma.mutationApplication.update({ where: { id }, data: { assignedToUserId: parsed.data.assignToUserId, status: STATUS.UnderReview, remarks: parsed.data.remarks ?? m.remarks, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'mutation.assigned', 'MutationApplication', id, `Assigned to user ${parsed.data.assignToUserId}`, ipOf(req));
  await notify(parsed.data.assignToUserId, 'Mutation assigned', `Mutation ${m.trackingNumber} assigned to you.`, 'Mutation', 'Mutation', id);
  res.json(updated);
});

mutationRouter.post('/:id/request-documents', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const m = await prisma.mutationApplication.findUnique({ where: { id } });
  if (!m) return err(res, 404, 'not_found', 'Mutation not found.');
  const note = parsed.success ? (parsed.data.documentRequestNote ?? parsed.data.remarks) : undefined;
  const updated = await prisma.mutationApplication.update({ where: { id }, data: { status: STATUS.UnderReview, documentRequestNote: note, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'mutation.documents-requested', 'MutationApplication', id, note, ipOf(req));
  await notify(m.applicantUserId, 'Additional documents requested', `For mutation ${m.trackingNumber}: ${note ?? ''}`, 'Mutation', 'Mutation', id);
  res.json(updated);
});

mutationRouter.post('/:id/reject', authorize(...APPROVERS), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const m = await prisma.mutationApplication.findUnique({ where: { id } });
  if (!m) return err(res, 404, 'not_found', 'Mutation not found.');
  const reason = parsed.success ? (parsed.data.reason ?? parsed.data.remarks) : undefined;
  const updated = await prisma.mutationApplication.update({ where: { id }, data: { status: STATUS.Rejected, rejectionReason: reason, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'mutation.rejected', 'MutationApplication', id, reason, ipOf(req));
  await notify(m.applicantUserId, 'Mutation rejected', `Mutation ${m.trackingNumber} was rejected: ${reason ?? ''}`, 'Mutation', 'Mutation', id);
  res.json(updated);
});

/**
 * APPROVE — atomic Prisma $transaction: LandRecord owner + Jamabandi +
 * LandOwnershipHistory + Mutation status + AuditLog all commit or all roll back.
 */
mutationRouter.post('/:id/approve', authorize(...APPROVERS), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const m = await prisma.mutationApplication.findUnique({ where: { id }, include: { landRecord: { include: { owner: true } } } });
  if (!m) return err(res, 404, 'not_found', 'Mutation not found.');
  if (m.status === STATUS.Approved) return err(res, 400, 'validation_error', 'Mutation already approved.');
  const result = await prisma.$transaction(async (tx) => {
    const land = m.landRecord;
    const oldOwner = land.owner;
    const newOwner = await tx.landOwner.create({ data: { fullName: m.buyerName, mobile: m.buyerMobile, address: oldOwner.address, createdBy: req.user!.email } });
    await tx.landRecord.update({ where: { id: land.id }, data: { ownerId: newOwner.id, updatedBy: req.user!.email } });
    await tx.jamabandiRecord.updateMany({ where: { landRecordId: land.id, isCurrent: true }, data: { isCurrent: false } });
    await tx.jamabandiRecord.create({ data: { landRecordId: land.id, jamabandiNumber: `JB-${String(land.id).padStart(3, '0')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`, ownerName: newOwner.fullName, khataNumber: land.khataNumber, khesraNumber: land.khesraNumber, areaInDecimal: land.areaInDecimal, classification: land.landClassification, isCurrent: true, createdBy: req.user!.email } });
    await tx.landOwnershipHistory.create({ data: { landRecordId: land.id, fromOwnerId: oldOwner.id, toOwnerId: newOwner.id, fromOwnerName: oldOwner.fullName, toOwnerName: newOwner.fullName, transferType: m.mutationType, mutationApplicationId: m.id, createdBy: req.user!.email } });
    const updated = await tx.mutationApplication.update({ where: { id }, data: { status: STATUS.Approved, remarks: parsed.success ? (parsed.data.remarks ?? m.remarks) : m.remarks, updatedBy: req.user!.email } });
    await tx.auditLog.create({ data: { userId: req.user!.id, userEmail: req.user!.email, action: 'mutation.approved', entity: 'MutationApplication', entityId: id, details: `Ownership transferred to ${newOwner.fullName}`, ipAddress: ipOf(req) } });
    return updated;
  });
  await notify(m.applicantUserId, 'Mutation approved', `Mutation ${m.trackingNumber} approved. Ownership updated.`, 'Mutation', 'Mutation', id);
  res.json(result);
});
