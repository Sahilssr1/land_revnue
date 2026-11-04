import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma, STAFF, STATUS } from '../prisma';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/admin-stats', authorize(...STAFF), async (_req, res) => {
  const [totalCitizens, totalLandRecords, totalMutations, pendingMutations, approvedMutations, rejectedMutations,
    totalComplaints, openComplaints, activeDisputes, pendingRevenueCount] = await Promise.all([
    prisma.user.count({ where: { role: 'Citizen' } }),
    prisma.landRecord.count(),
    prisma.mutationApplication.count(),
    prisma.mutationApplication.count({ where: { status: { in: [STATUS.Pending, STATUS.UnderReview] } } }),
    prisma.mutationApplication.count({ where: { status: STATUS.Approved } }),
    prisma.mutationApplication.count({ where: { status: STATUS.Rejected } }),
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: { not: STATUS.Resolved } } }),
    prisma.landDispute.count({ where: { status: { not: STATUS.Resolved } } }),
    prisma.revenuePayment.count({ where: { status: STATUS.Unpaid } }),
  ]);
  const paid = await prisma.revenuePayment.aggregate({ where: { status: STATUS.Paid }, _sum: { amount: true } });
  const due = await prisma.revenuePayment.aggregate({ where: { status: STATUS.Unpaid }, _sum: { amount: true } });
  const recentActivities = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  res.json({
    totalCitizens, totalLandRecords, totalMutations, pendingMutations, approvedMutations, rejectedMutations,
    totalRevenueCollected: Number(paid._sum.amount ?? 0),
    pendingRevenue: Number(due._sum.amount ?? 0),
    pendingRevenueCount, activeDisputes, totalComplaints, openComplaints, recentActivities,
  });
});

dashboardRouter.get('/citizen-stats', async (req, res) => {
  const uid = req.user!.id;
  const [myLandCount, totalArea, myMutations, pendingMutations, pendingCerts, pendingSurveys, certs] = await Promise.all([
    prisma.landRecord.count({ where: { ownerUserId: uid } }),
    prisma.landRecord.aggregate({ where: { ownerUserId: uid }, _sum: { areaInDecimal: true } }),
    prisma.mutationApplication.count({ where: { applicantUserId: uid } }),
    prisma.mutationApplication.count({ where: { applicantUserId: uid, status: { in: [STATUS.Pending, STATUS.UnderReview] } } }),
    prisma.certificateApplication.count({ where: { userId: uid, status: { in: [STATUS.Pending, STATUS.UnderReview] } } }),
    prisma.surveyRequest.count({ where: { requestedByUserId: uid, status: STATUS.Pending } }),
    prisma.certificateApplication.count({ where: { userId: uid } }),
  ]);
  const paid = await prisma.revenuePayment.aggregate({ where: { userId: uid, status: STATUS.Paid }, _sum: { amount: true } });
  const due = await prisma.revenuePayment.aggregate({ where: { userId: uid, status: STATUS.Unpaid }, _sum: { amount: true } });
  const recentActivities = await prisma.notification.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 10 });
  res.json({
    myLandCount, totalArea: Number(totalArea._sum.areaInDecimal ?? 0), myMutations,
    pendingRequests: pendingMutations + pendingCerts + pendingSurveys,
    revenuePaid: Number(paid._sum.amount ?? 0), revenueDue: Number(due._sum.amount ?? 0),
    certificates: certs, recentActivities,
  });
});

dashboardRouter.get('/revenue-monthly', authorize(...STAFF), async (_req, res) => {
  const rows = await prisma.revenuePayment.findMany({ where: { status: STATUS.Paid, paidAt: { not: null } }, select: { amount: true, paidAt: true } });
  const byMonth = new Map<string, { year: number; month: number; total: number; count: number }>();
  for (const r of rows) {
    const d = r.paidAt!;
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    const cur = byMonth.get(key) ?? { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, total: 0, count: 0 };
    cur.total += Number(r.amount); cur.count += 1;
    byMonth.set(key, cur);
  }
  res.json([...byMonth.values()].sort((a, b) => a.year - b.year || a.month - b.month));
});

dashboardRouter.get('/mutation-stats', authorize(...STAFF), async (_req, res) => {
  const rows = await prisma.mutationApplication.groupBy({ by: ['status'], _count: true });
  res.json(rows.map((r) => ({ status: r.status, count: r._count })));
});

dashboardRouter.get('/district-records', authorize(...STAFF), async (_req, res) => {
  const rows = await prisma.landRecord.groupBy({ by: ['district'], _count: true, _sum: { areaInDecimal: true } });
  res.json(rows.map((r) => ({ district: r.district, count: r._count, totalArea: Number(r._sum.areaInDecimal ?? 0) })));
});

dashboardRouter.get('/approval-trends', authorize(...STAFF), async (_req, res) => {
  const rows = await prisma.mutationApplication.findMany({ where: { status: { in: [STATUS.Approved, STATUS.Rejected] } }, select: { status: true, createdAt: true } });
  const map = new Map<string, { year: number; month: number; status: string; count: number }>();
  for (const r of rows) {
    const key = `${r.createdAt.getUTCFullYear()}-${r.createdAt.getUTCMonth() + 1}-${r.status}`;
    const cur = map.get(key) ?? { year: r.createdAt.getUTCFullYear(), month: r.createdAt.getUTCMonth() + 1, status: r.status, count: 0 };
    cur.count += 1; map.set(key, cur);
  }
  res.json([...map.values()].sort((a, b) => a.year - b.year || a.month - b.month));
});
