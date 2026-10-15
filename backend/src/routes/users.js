import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, requireCompanyAccess } from '../middleware/auth.js';
import { encrypt, monthlyToHourly } from '../utils/encryption.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, requireCompanyAccess);

/**
 * GET /api/users
 * List company users
 */
router.get('/', requireRole('company_admin', 'manager', 'hr'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        hourlyRate: true,
        isActive: true,
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        createdAt: true
      },
      orderBy: { lastName: 'asc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * POST /api/users
 * Company admin / HR invites a new user
 */
router.post('/', requireRole('company_admin', 'hr'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, monthlySalary, departmentId, managerId } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check plan limits
    const company = await prisma.company.findUnique({ where: { id: req.user.companyId } });
    const userCount = await prisma.user.count({ where: { companyId: req.user.companyId } });
    if (userCount >= company.maxUsers) {
      return res.status(403).json({ error: `Plan limit reached (${company.maxUsers} users). Upgrade to add more.` });
    }

    const existing = await prisma.user.findFirst({
      where: { companyId: req.user.companyId, email: email.toLowerCase() }
    });
    if (existing) return res.status(409).json({ error: 'Email already exists in this company' });

    const passwordHash = await bcrypt.hash(password, 12);
    let hourlyRate = null;
    let salaryEncrypted = null;
    if (monthlySalary) {
      salaryEncrypted = encrypt(monthlySalary);
      hourlyRate = monthlyToHourly(monthlySalary);
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role,
        phone,
        salaryEncrypted,
        hourlyRate,
        companyId: req.user.companyId,
        departmentId: departmentId || null,
        managerId: managerId || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true
      }
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
