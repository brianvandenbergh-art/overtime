import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, requireCompanyAccess } from '../middleware/auth.js';
import { createPaymentLink, PLANS } from '../services/ikhokha.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/payments/plans
 */
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

/**
 * POST /api/payments/subscribe
 * Create iKhokha payment link for selected plan
 */
router.post('/subscribe', authenticate, requireCompanyAccess, requireRole('company_admin'), async (req, res) => {
  try {
    const { plan } = req.body; // basic | pro | enterprise
    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const company = await prisma.company.findUnique({ where: { id: req.user.companyId } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const planInfo = PLANS[plan];
    const externalTxId = `OTSA-${company.id}-${Date.now()}`;

    // Create pending subscription record
    const sub = await prisma.subscription.create({
      data: {
        companyId: company.id,
        plan,
        amount: planInfo.amount * 100, // cents
        status: 'pending',
        ikhokhaExternalTxId: externalTxId
      }
    });

    const link = await createPaymentLink({
      amountZar: planInfo.amount,
      description: `OvertimeSA ${planInfo.name} – ${company.name}`,
      externalTxId,
      companyId: company.id
    });

    // Update with paylink id
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { ikhokhaPaylinkId: link.paylinkID }
    });

    res.json({
      paylinkUrl: link.paylinkUrl,
      paylinkID: link.paylinkID,
      externalTransactionID: link.externalTransactionID,
      amount: planInfo.amount,
      plan
    });
  } catch (err) {
    console.error('Payment link error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to create payment link',
      details: err.response?.data || err.message
    });
  }
});

/**
 * POST /api/payments/webhook
 * iKhokha callback
 */
router.post('/webhook', async (req, res) => {
  try {
    const { paylinkID, status, externalTransactionID, responseCode } = req.body;

    console.log('iKhokha webhook:', req.body);

    if (status === 'SUCCESS' || responseCode === '00') {
      const sub = await prisma.subscription.findFirst({
        where: {
          OR: [
            { ikhokhaPaylinkId: paylinkID },
            { ikhokhaExternalTxId: externalTransactionID }
          ]
        }
      });

      if (sub && sub.status !== 'paid') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'paid',
              paidAt: new Date(),
              expiresAt
            }
          }),
          prisma.company.update({
            where: { id: sub.companyId },
            data: {
              plan: sub.plan,
              planStatus: 'active',
              planExpiresAt: expiresAt,
              maxUsers: PLANS[sub.plan]?.maxUsers || 20
            }
          })
        ]);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/payments/status
 * Current company subscription status
 */
router.get('/status', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        maxUsers: true
      }
    });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
