import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, err, ipOf, isCitizen } from '../middleware/auth';
import { audit, paged, parseListQuery } from '../utils/helpers';
import { toExcel, toPdf } from '../utils/reports';
import { prisma, STAFF, STATUS } from '../prisma';

export const revenueRouter = Router();
revenueRouter.use(authenticate);

revenueRouter.get('/rates', async (req, res) => {
  const district = typeof req.query.district === 'string' ? req.query.district : undefined;
  res.json(await prisma.revenueRate.findMany({ where: district ? { district } : undefined, orderBy: [{ district: 'asc' }, { landClassification: 'asc' }] }));
});

revenueRouter.post('/rates', authorize(...STAFF), async (req, res) => {
  const schema = z.object({ district: z.string().min(1), landClassification: z.string().min(1), ratePerDecimal: z.number().nonnegative().max(100000), isActive: z.boolean().default(true) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const r = await prisma.revenueRate.create({ data: { ...parsed.data, createdBy: req.user!.email } });
  await audit(req.user!.id, req.user!.email, 'revenue-rate.created', 'RevenueRate', r.id, `${r.district}/${r.landClassification} = ${r.ratePerDecimal}`, ipOf(req));
  res.status(201).json(r);
});

revenueRouter.get('/payments', async (req, res) => {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};
  if (isCitizen(req)) where.userId = req.user!.id;
  if (q.status) where.status = q.status;
  if (q.district) where.landRecord = { district: q.district };
  if (q.search) where.OR = [{ receiptNumber: { contains: q.search } }, { transactionId: { contains: q.search } }];
  const [total, items] = await Promise.all([
    prisma.revenuePayment.count({ where }),
    prisma.revenuePayment.findMany({ where, include: { landRecord: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  res.json(paged(items, total, q));
});

revenueRouter.post('/payments', async (req, res) => {
  const schema = z.object({ landRecordId: z.number().int(), amount: z.number().positive(), financialYear: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
  const land = await prisma.landRecord.findUnique({ where: { id: parsed.data.landRecordId } });
  if (!land) return err(res, 400, 'validation_error', 'Land record not found.');
  if (isCitizen(req) && land.ownerUserId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only pay for your own land.');
  const p = await prisma.revenuePayment.create({ data: { ...parsed.data, userId: req.user!.id, status: STATUS.Unpaid, createdBy: req.user!.email } });
  res.status(201).json(p);
});

revenueRouter.get('/payments/:id/receipt', async (req, res) => {
  const p = await prisma.revenuePayment.findUnique({ where: { id: Number(req.params.id) }, include: { landRecord: true } });
  if (!p) return err(res, 404, 'not_found', 'Payment not found.');
  if (isCitizen(req) && p.userId !== req.user!.id) return err(res, 403, 'forbidden', 'You can only view your own receipts.');
  if (p.status !== STATUS.Paid) return err(res, 400, 'validation_error', 'Receipt is available only for paid payments.');
  const headers = ['Field', 'Value'];
  const rows = [
    ['Receipt No', p.receiptNumber ?? '-'],
    ['Amount (INR)', Number(p.amount).toFixed(2)],
    ['Financial Year', p.financialYear],
    ['Khata / Khesra', `${p.landRecord.khataNumber} / ${p.landRecord.khesraNumber}`],
    ['Transaction', p.transactionId ?? '-'],
    ['Paid At', p.paidAt?.toISOString() ?? '-'],
  ];
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'pdf';
  if (format === 'xlsx') {
    const buf = await toExcel('Receipt', headers, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${p.id}.xlsx"`);
    return res.send(buf);
  }
  const buf = await toPdf(`Land Revenue Receipt — ${p.receiptNumber ?? p.id}`, headers, rows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${p.id}.pdf"`);
  return res.send(buf);
});
