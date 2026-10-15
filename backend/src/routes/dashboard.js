import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, requireCompanyAccess);

/**
 * GET /api/dashboard/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();
    // Simple current month range (can be replaced with pay-cycle logic)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const baseWhere = {
      companyId,
      date: { gte: startOfMonth, lte: endOfMonth }
    };

    // Scope for employees
    let userFilter = {};
    if (req.user.role === 'employee') {
      userFilter = { userId: req.user.id };
    }

    const [pending, approved, rejected, totals] = await Promise.all([
      prisma.overtimeEntry.count({ where: { ...baseWhere, ...userFilter, status: 'pending' } }),
      prisma.overtimeEntry.count({ where: { ...baseWhere, ...userFilter, status: 'approved' } }),
      prisma.overtimeEntry.count({ where: { ...baseWhere, ...userFilter, status: 'rejected' } }),
      prisma.overtimeEntry.aggregate({
        where: { ...baseWhere, ...userFilter, status: 'approved' },
        _sum: { hours: true, amount: true }
      })
    ]);

    res.json({
      period: { from: startOfMonth, to: endOfMonth },
      pending,
      approved,
      rejected,
      totalHours: totals._sum.hours || 0,
      totalAmount: totals._sum.amount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dashboard summary failed' });
  }
});

export default router;
