import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, requireCompanyAccess);

/**
 * GET /api/company
 */
router.get('/', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        registrationNumber: true,
        phone: true,
        address: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        maxUsers: true,
        inviteCode: true,
        createdAt: true
      }
    });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * PATCH /api/company
 */
router.patch('/', requireRole('company_admin'), async (req, res) => {
  try {
    const { name, phone, address, registrationNumber } = req.body;
    const company = await prisma.company.update({
      where: { id: req.user.companyId },
      data: { name, phone, address, registrationNumber }
    });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
