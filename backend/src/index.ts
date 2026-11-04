import cors from 'cors';
import 'express-async-errors'; // forwards async route errors to the error handler (Express 4 otherwise crashes)
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/auth';
import { openApiSpec } from './openapi';
import { adminRouter, auditLogRouter, notificationRouter, reportRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { jamabandiRouter, landRouter } from './routes/land';
import { mutationRouter } from './routes/mutations';
import { revenueRouter } from './routes/revenue';
import { certificateRouter, complaintRouter, surveyRouter } from './routes/services';
import { webhookRouter } from './routes/webhooks';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'rate_limited', message: 'Too many requests. Try again shortly.' } } }));

  // Razorpay webhook needs the RAW body for signature verification — capture it before JSON parsing.
  app.use('/api/webhooks/razorpay', express.raw({ type: '*/*' }), (req, _res, next) => {
    (req as unknown as { rawBody: Buffer }).rawBody = req.body as Buffer;
    next();
  });
  app.use(express.json({ limit: '6mb' }));
  app.use(express.urlencoded({ extended: true }));

  const uploadDir = path.join(process.cwd(), config.uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'lrms-api' }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api-docs.json', (_req, res) => res.json(openApiSpec));

  const authLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'rate_limited', message: 'Too many requests. Try again shortly.' } } });
  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/land-records', landRouter);
  app.use('/api/jamabandi', jamabandiRouter);
  app.use('/api/mutations', mutationRouter);
  app.use('/api/revenue', revenueRouter);
  app.use('/api/surveys', surveyRouter);
  app.use('/api/certificates', certificateRouter);
  app.use('/api/complaints', complaintRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/audit-logs', auditLogRouter);
  app.use('/api/webhooks', webhookRouter);

  app.use((_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Route not found.' } }));
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`LRMS API listening on http://localhost:${config.port} — docs at /api-docs`);
  });
}
