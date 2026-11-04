import { Router } from 'express';
import { config } from '../config';
import { err } from '../middleware/auth';
import { receiptRef, verifyRazorpaySignature } from '../utils/helpers';
import { prisma, STATUS } from '../prisma';

/**
 * Razorpay webhook (TEST MODE only). The raw body is verified with
 * HMAC-SHA256 against RAZORPAY_WEBHOOK_SECRET. A payment is marked Paid
 * ONLY when the signature verifies — unverified calls never change state.
 */
export const webhookRouter = Router();

webhookRouter.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const raw = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
  if (!verifyRazorpaySignature(raw, signature ?? '', config.razorpayWebhookSecret)) {
    return err(res, 401, 'invalid_signature', 'Webhook signature verification failed.');
  }
  try {
    const payload = JSON.parse(raw.toString('utf8')) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    if (payload.event === 'payment.captured') {
      const ent = payload.payload?.payment?.entity;
      const paymentId = ent?.id;
      const orderId = ent?.order_id;
      if (paymentId || orderId) {
        const payment = await prisma.revenuePayment.findFirst({ where: { OR: [{ razorpayOrderId: orderId }, { razorpayPaymentId: paymentId }] } });
        if (payment && payment.status !== STATUS.Paid) {
          await prisma.revenuePayment.update({
            where: { id: payment.id },
            data: { status: STATUS.Paid, razorpayPaymentId: paymentId, transactionId: paymentId, receiptNumber: payment.receiptNumber ?? receiptRef(), paidAt: new Date(), paymentMethod: 'Razorpay-Test' },
          });
        }
      }
    }
  } catch {
    // Malformed-but-signed payload: acknowledge without changing state.
  }
  return res.json({ received: true });
});
