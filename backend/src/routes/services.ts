import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, err, ipOf, isCitizen } from '../middleware/auth';
import { audit, certRef, notify, notifyStaff, paged, parseListQuery } from '../utils/helpers';
import { toPdf } from '../utils/reports';
import { prisma, APPROVERS, STAFF, STATUS } from '../prisma';

const actionSchema = z.object({ remarks: z.string().optional(), reason: z.string().optional(), assignToUserId: z.number().int().optional() });

// ---------------- Surveys ----------------
export const surveyRouter = Router();
surveyRouter.use(authenticate);

surveyRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.requestedByUserId = req.user!.id;
  if (req.user!.role === 'Amin') {
    const mine = await prisma.surveyAssignment.findMany({ where: { aminUserId: req.user!.id }, select: { surveyRequestId: true } });
    where.id = { in: mine.map((a) => a.surveyRequestId) };
  }
  if (q.status) where.status = q.status;
  const [total, items] = await Promise.all([
    prisma.surveyRequest.count({ where }),
    prisma.surveyRequest.findMany({ where, include: { landRecord: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  const ids = items.map((i) => i.id);
  const assigns = await prisma.surveyAssignment.findMany({ where: { surveyRequestId: { in: ids } } });
  const reports = await prisma.surveyReport.findMany({ where: { surveyRequestId: { in: ids } } });
  res.json(paged(items.map((s) => ({ ...s, assignment: assigns.find((a) => a.surveyRequestId === s.id) ?? null, report: reports.find((r) => r.surveyRequestId === s.id) ?? null })), total, q));
});

surveyRouter.get('/:id', async (req, res) => {
  const s = await prisma.surveyRequest.findUnique({ where: { id: Number(req.params.id) }, include: { landRecord: true } });
  if (!s) return err(res, 404, 'not_found', 'Survey request not found.');
  if (isCitizen(req) && s.requestedByUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only view your own survey requests.');
  const assignment = await prisma.surveyAssignment.findFirst({ where: { surveyRequestId: s.id } });
  const report = await prisma.surveyReport.findFirst({ where: { surveyRequestId: s.id } });
  res.json({ request: s, assignment, report });
});

surveyRouter.post('/', async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int(), surveyType: z.string().default('Measurement'), preferredDate: z.string().datetime().optional(), remarks: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const land = await prisma.landRecord.findUnique({ where: { id: parsed.data.landRecordId } });
  if (!land) return err(res, 400, 'validation_error', 'Land record not found.');
  if (isCitizen(req) && land.ownerUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only request surveys for your own land.');
  const s = await prisma.surveyRequest.create({ data: { landRecordId: parsed.data.landRecordId, requestedByUserId: req.user!.id, surveyType: parsed.data.surveyType, preferredDate: parsed.data.preferredDate ? new Date(parsed.data.preferredDate) : undefined, remarks: parsed.data.remarks, status: STATUS.Pending, createdBy: req.user!.email } });
  await notifyStaff('New survey request', `Survey request #${s.id} submitted.`, 'Survey', 'Survey', s.id);
  res.status(201).json(s);
});

surveyRouter.post('/:id/assign', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const s = await prisma.surveyRequest.findUnique({ where: { id } });
  if (!s) return err(res, 404, 'not_found', 'Survey request not found.');
  if (!parsed.success || !parsed.data.assignToUserId) return err(res, 400, 'validation_error', 'AssignToUserId (Amin) is required.');
  const existing = await prisma.surveyAssignment.findFirst({ where: { surveyRequestId: id } });
  if (existing) await prisma.surveyAssignment.update({ where: { id: existing.id }, data: { aminUserId: parsed.data.assignToUserId, status: STATUS.Assigned } });
  else await prisma.surveyAssignment.create({ data: { surveyRequestId: id, aminUserId: parsed.data.assignToUserId, appointmentDate: new Date(Date.now() + 7 * 86400000), status: STATUS.Assigned, createdBy: req.user!.email } });
  const updated = await prisma.surveyRequest.update({ where: { id }, data: { status: STATUS.Assigned, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'survey.assigned', 'SurveyRequest', id, `Amin ${parsed.data.assignToUserId}`, ipOf(req));
  await notify(parsed.data.assignToUserId, 'Survey assigned', `Survey request #${id} assigned to you.`, 'Survey', 'Survey', id);
  res.json(updated);
});

surveyRouter.post('/:id/report', authorize(...STAFF), async (req, res) => {
  const schema = z.object({ measuredArea: z.number().positive().max(100000), surveyorNotes: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  const id = Number(req.params.id);
  const s = await prisma.surveyRequest.findUnique({ where: { id } });
  if (!s) return err(res, 404, 'not_found', 'Survey request not found.');
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const rep = await prisma.surveyReport.create({ data: { surveyRequestId: id, measuredArea: parsed.data.measuredArea, surveyorNotes: parsed.data.surveyorNotes, createdBy: req.user!.email } });
  await prisma.surveyRequest.update({ where: { id }, data: { status: STATUS.Completed, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'survey.reported', 'SurveyRequest', id, `Measured ${parsed.data.measuredArea} decimal`, ipOf(req));
  await notify(s.requestedByUserId, 'Survey completed', `Survey for request #${id} is complete.`, 'Survey', 'Survey', id);
  res.json(rep);
});

// ---------------- Certificates (LPC) ----------------
export const certificateRouter = Router();
certificateRouter.use(authenticate);

certificateRouter.get('/applications', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.userId = req.user!.id;
  if (q.status) where.status = q.status;
  const [total, items] = await Promise.all([
    prisma.certificateApplication.count({ where }),
    prisma.certificateApplication.findMany({ where, include: { landRecord: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  const ids = items.map((i) => i.id);
  const certs = await prisma.certificate.findMany({ where: { certificateApplicationId: { in: ids } } });
  res.json(paged(items.map((a) => ({ application: a, certificate: certs.find((c) => c.certificateApplicationId === a.id) ?? null })), total, q));
});

certificateRouter.post('/applications', async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int(), certificateType: z.string().default('LPC'), purpose: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const land = await prisma.landRecord.findUnique({ where: { id: parsed.data.landRecordId } });
  if (!land) return err(res, 400, 'validation_error', 'Land record not found.');
  if (isCitizen(req) && land.ownerUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only apply for certificates for your own land.');
  const a = await prisma.certificateApplication.create({ data: { ...parsed.data, userId: req.user!.id, status: STATUS.Pending, createdBy: req.user!.email } });
  res.status(201).json(a);
});

certificateRouter.post('/applications/:id/approve', authorize(...APPROVERS), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const a = await prisma.certificateApplication.findUnique({ where: { id } });
  if (!a) return err(res, 404, 'not_found', 'Certificate application not found.');
  const updated = await prisma.certificateApplication.update({ where: { id }, data: { status: STATUS.Approved, remarks: parsed.success ? parsed.data.remarks : undefined, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'certificate.approved', 'CertificateApplication', id, '', ipOf(req));
  res.json(updated);
});

certificateRouter.post('/applications/:id/reject', authorize(...APPROVERS), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const a = await prisma.certificateApplication.findUnique({ where: { id } });
  if (!a) return err(res, 404, 'not_found', 'Certificate application not found.');
  const reason = parsed.success ? (parsed.data.reason ?? parsed.data.remarks) : undefined;
  const updated = await prisma.certificateApplication.update({ where: { id }, data: { status: STATUS.Rejected, rejectionReason: reason, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'certificate.rejected', 'CertificateApplication', id, reason, ipOf(req));
  await notify(a.userId, 'Certificate rejected', `Your LPC application #${id} was rejected.`, 'Certificate', 'Certificate', id);
  res.json(updated);
});

certificateRouter.post('/applications/:id/issue', authorize(...APPROVERS), async (req, res) => {
  const id = Number(req.params.id);
  const a = await prisma.certificateApplication.findUnique({ where: { id }, include: { landRecord: true } });
  if (!a) return err(res, 404, 'not_found', 'Certificate application not found.');
  if (a.status !== STATUS.Approved) return err(res, 400, 'validation_error', 'Only an approved application can be issued.');
  const existing = await prisma.certificate.findFirst({ where: { certificateApplicationId: id } });
  if (existing) return res.json(existing);
  let reference = certRef();
  while (await prisma.certificate.findUnique({ where: { referenceNumber: reference } })) reference = certRef();
  const user = await prisma.user.findUnique({ where: { id: a.userId } });
  const cert = await prisma.certificate.create({ data: { certificateApplicationId: id, referenceNumber: reference, issuedTo: user?.fullName ?? '', landRecordId: a.landRecordId, issuedByUserId: req.user!.id, validUntil: new Date(Date.now() + 365 * 86400000), createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'certificate.issued', 'Certificate', cert.id, reference, ipOf(req));
  await notify(a.userId, 'Certificate issued', `Your LPC certificate ${reference} is ready to download.`, 'Certificate', 'Certificate', cert.id);
  res.status(201).json(cert);
});

certificateRouter.get('/:id/download', async (req, res) => {
  const cert = await prisma.certificate.findUnique({ where: { id: Number(req.params.id) }, include: { application: true } });
  if (!cert) return err(res, 404, 'not_found', 'Certificate not found.');
  if (isCitizen(req) && cert.application.userId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only download your own certificates.');
  const buf = await toPdf(`Land Possession Certificate — ${cert.referenceNumber}`, ['Field', 'Value'], [
    ['Reference Number', cert.referenceNumber],
    ['Issued To', cert.issuedTo],
    ['Certificate Type', cert.application.certificateType],
    ['Issued At', cert.issuedAt.toISOString()],
    ['Valid Until', cert.validUntil?.toISOString() ?? '-'],
  ]);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.referenceNumber}.pdf"`);
  res.send(buf);
});

// ---------------- Complaints + Disputes ----------------
export const complaintRouter = Router();
complaintRouter.use(authenticate);

complaintRouter.get('/', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.userId = req.user!.id;
  if (q.status) where.status = q.status;
  if (q.search) where.title = { contains: q.search };
  const [total, items] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({ where, include: { remarks: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});

complaintRouter.get('/disputes', authorize(...STAFF), async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (q.status) where.status = q.status;
  if (q.search) where.title = { contains: q.search };
  const [total, items] = await Promise.all([
    prisma.landDispute.count({ where }),
    prisma.landDispute.findMany({ where, include: { landRecord: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});

complaintRouter.post('/disputes', authorize(...STAFF), async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int(), title: z.string().min(1), description: z.string().min(1), parties: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const d = await prisma.landDispute.create({ data: { ...parsed.data, status: STATUS.InProgress, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'dispute.created', 'LandDispute', d.id, parsed.data.title, ipOf(req));
  res.status(201).json(d);
});

complaintRouter.post('/disputes/:id/resolve', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const d = await prisma.landDispute.findUnique({ where: { id } });
  if (!d) return err(res, 404, 'not_found', 'Dispute not found.');
  const notes = parsed.success ? (parsed.data.remarks ?? parsed.data.reason) : undefined;
  const updated = await prisma.landDispute.update({ where: { id }, data: { status: STATUS.Resolved, resolutionNotes: notes, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'dispute.resolved', 'LandDispute', id, notes, ipOf(req));
  res.json(updated);
});

complaintRouter.get('/:id', async (req, res) => {
  const c = await prisma.complaint.findUnique({ where: { id: Number(req.params.id) }, include: { remarks: true } });
  if (!c) return err(res, 404, 'not_found', 'Complaint not found.');
  if (isCitizen(req) && c.userId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only view your own complaints.');
  res.json(c);
});

complaintRouter.post('/', async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int().optional(), title: z.string().min(1), description: z.string().min(1), category: z.string().default('General') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const c = await prisma.complaint.create({ data: { ...parsed.data, userId: req.user!.id, status: STATUS.Pending, createdBy: req.user!.email } });
  await notifyStaff('New complaint', `Complaint #${c.id}: ${c.title}`, 'Complaint', 'Complaint', c.id);
  res.status(201).json(c);
});

complaintRouter.post('/:id/assign', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const c = await prisma.complaint.findUnique({ where: { id } });
  if (!c) return err(res, 404, 'not_found', 'Complaint not found.');
  if (!parsed.success || !parsed.data.assignToUserId) return err(res, 400, 'validation_error', 'AssignToUserId is required.');
  const updated = await prisma.complaint.update({ where: { id }, data: { assignedToUserId: parsed.data.assignToUserId, status: STATUS.InProgress, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'complaint.assigned', 'Complaint', id, `Assigned to ${parsed.data.assignToUserId}`, ipOf(req));
  res.json(updated);
});

complaintRouter.post('/:id/remarks', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const c = await prisma.complaint.findUnique({ where: { id } });
  if (!c) return err(res, 404, 'not_found', 'Complaint not found.');
  await prisma.complaintRemark.create({ data: { complaintId: id, remark: parsed.success ? (parsed.data.remarks ?? '') : '', authorUserId: req.user!.id, authorRole: req.user!.role, createdBy: req.user!.email } });
  res.json(await prisma.complaint.findUnique({ where: { id }, include: { remarks: true } }));
});

complaintRouter.post('/:id/resolve', authorize(...STAFF), async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  const id = Number(req.params.id);
  const c = await prisma.complaint.findUnique({ where: { id } });
  if (!c) return err(res, 404, 'not_found', 'Complaint not found.');
  const remark = parsed.success ? parsed.data.remarks : undefined;
  if (remark) await prisma.complaintRemark.create({ data: { complaintId: id, remark, authorUserId: req.user!.id, authorRole: req.user!.role, createdBy: req.user!.email } });
  const updated = await prisma.complaint.update({ where: { id }, data: { status: STATUS.Resolved, updatedBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'complaint.resolved', 'Complaint', id, remark, ipOf(req));
  await notify(c.userId, 'Complaint resolved', `Your complaint #${id} has been resolved.`, 'Complaint', 'Complaint', id);
  res.json(updated);
});
