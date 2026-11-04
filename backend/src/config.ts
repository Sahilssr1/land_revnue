import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 5000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-that-is-at-least-32-characters-long',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh-secret-min-32-chars',
  jwtExpiresMinutes: Number(process.env.JWT_EXPIRES_MINUTES ?? 60),
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  razorpayTestMode: (process.env.RAZORPAY_TEST_MODE ?? 'true') !== 'false',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxUploadBytes: 5 * 1024 * 1024,
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
};
export { required };
