import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt, monthlyToHourly } from '../utils/encryption.js';
import { authenticate } from '../middleware/auth.js';
import { generateInviteCode } from '../utils/saRules.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register-company
 * Manager registers → creates company + becomes company_admin
 * System gives them an INVITE CODE to share with employees
 */
router.post('/register-company', async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      registrationNumber,
      firstName,
      lastName,
      email,
      password,
      phone
    } = req.body;

    if (!companyName || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const inviteCode = generateInviteCode();

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: (companyEmail || email).toLowerCase(),
          registrationNumber,
          inviteCode,
          plan: 'basic',
          planStatus: 'trial',
          planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          maxUsers: 20
        }
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          role: 'company_admin',
          phone,
          companyId: company.id
        }
      });

      return { company, user };
    });

    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        companyId: result.company.id,
        companyName: result.company.name
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        inviteCode: result.company.inviteCode,
        plan: result.company.plan,
        planStatus: result.company.planStatus,
        planExpiresAt: result.company.planExpiresAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/join
 * Employee self-registers with the company's INVITE CODE
 * System automatically links them to that company
 */
router.post('/join', async (req, res) => {
  try {
    const { inviteCode, firstName, lastName, email, password, phone, monthlySalary } = req.body;

    if (!inviteCode || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Invite code, name, email and password are required' });
    }

    const company = await prisma.company.findUnique({
      where: { inviteCode: inviteCode.toUpperCase().trim() }
    });
    if (!company) {
      return res.status(404).json({ error: 'Invalid invite code – ask your manager for the correct code' });
    }

    const userCount = await prisma.user.count({ where: { companyId: company.id } });
    if (userCount >= company.maxUsers) {
      return res.status(403).json({ error: 'This company has reached its user limit. Ask admin to upgrade.' });
    }

    const existing = await prisma.user.findFirst({
      where: { companyId: company.id, email: email.toLowerCase() }
    });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered in this company' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Salary encrypted immediately – never stored plain
    let salaryEncrypted = null;
    let hourlyRate = null;
    if (monthlySalary && Number(monthlySalary) > 0) {
      salaryEncrypted = encrypt(String(monthlySalary));
      hourlyRate = monthlyToHourly(Number(monthlySalary));
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: 'employee',
        phone,
        salaryEncrypted,
        hourlyRate,
        companyId: company.id
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: company.id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: company.id,
        companyName: company.name,
        hasSalary: !!salaryEncrypted
      },
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan,
        planStatus: company.planStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not join company' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), isActive: true },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
        hasSalary: !!user.salaryEncrypted
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        inviteCode: user.role === 'company_admin' ? user.company.inviteCode : undefined,
        plan: user.company.plan,
        planStatus: user.company.planStatus,
        planExpiresAt: user.company.planExpiresAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true, department: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      department: user.department?.name,
      hourlyRate: user.hourlyRate,
      hasSalary: !!user.salaryEncrypted,
      // Never return the actual salary or decrypted value
      plan: user.company.plan,
      planStatus: user.company.planStatus,
      inviteCode: user.role === 'company_admin' ? user.company.inviteCode : undefined
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/auth/my-salary
 * Employee (or any user) sets/updates THEIR OWN basic salary
 * Value is encrypted immediately – even company admin cannot see the plain number
 */
router.patch('/my-salary', authenticate, async (req, res) => {
  try {
    const { monthlySalary } = req.body;
    if (!monthlySalary || Number(monthlySalary) <= 0) {
      return res.status(400).json({ error: 'Valid monthly salary required' });
    }

    const salaryEncrypted = encrypt(String(monthlySalary));
    const hourlyRate = monthlyToHourly(Number(monthlySalary));

    await prisma.user.update({
      where: { id: req.user.id },
      data: { salaryEncrypted, hourlyRate }
    });

    res.json({
      message: 'Salary saved securely (encrypted). Only you can update it.',
      hourlyRate,
      hasSalary: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save salary' });
  }
});

export default router;
